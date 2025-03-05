import { openai } from './openaiService';
import { deepseek } from './deepseekService';
import { getSetting } from '../settings/settingsManager';
import { addMemory } from '../memory/memorySystem';
import { getRelevantMemories } from '../memory/memoryRetrieval';

/**
 * Generate text completion based on current settings
 * @param {string} prompt - Text prompt
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Completion result
 */
export async function createCompletion(prompt, options = {}) {
    // Get preferred model from settings or use provided model
    const model = options.model || getSetting('models.preferredTextModel', 'gpt-4');
    const temperature = options.temperature !== undefined ? options.temperature : getSetting('generation.temperature', 0.7);
    const maxTokens = options.maxTokens || getSetting('generation.maxTokens', 2048);

    // Determine which service to use based on model prefix
    let service;
    let serviceModel = model;

    if (model.startsWith('deepseek-')) {
        service = deepseek;
    } else {
        // Default to OpenAI
        service = openai;
    }

    // Add memory context if enabled
    let fullPrompt = prompt;
    if (getSetting('memory.enabled', true)) {
        const memoryCount = getSetting('memory.promptIncludeCount', 3);
        if (memoryCount > 0) {
            const memories = await getRelevantMemories(prompt, memoryCount);

            if (memories && memories.length > 0) {
                const memoryText = memories.map(m => `Related past information: ${m.content}`).join('\n\n');
                fullPrompt = `${memoryText}\n\n${prompt}`;
            }
        }
    }

    // Prepare messages for chat completion
    const messages = [
        {
            role: 'system',
            content: 'You are an AI assistant for Microsoft Word. Be helpful, concise, and accurate.'
        },
        {
            role: 'user',
            content: fullPrompt
        }
    ];

    try {
        // Handle streaming if requested
        if (options.stream) {
            return await streamCompletion(service, messages, {
                model: serviceModel,
                temperature,
                maxTokens,
                signal: options.signal,
                onStream: options.onStream
            });
        }

        // Regular non-streaming completion
        const response = await service.generateChatCompletion(messages, {
            model: serviceModel,
            temperature,
            maxTokens,
            signal: options.signal
        });

        // Extract content from response
        const content = response.choices[0]?.message?.content || '';

        // Store in memory if enabled
        if (getSetting('memory.enabled', true) && content) {
            addMemory({
                type: 'completion',
                content: prompt,
                response: content,
                tags: [model, 'text-generation']
            });
        }

        return {
            content,
            model: serviceModel,
            provider: service.provider,
            totalTokens: response.usage?.total_tokens || 0,
            streaming: false
        };

    } catch (error) {
        console.error('Error generating completion:', error);
        throw error;
    }
}

/**
 * Stream text completion
 * @param {Object} service - API service to use
 * @param {Array<Object>} messages - Chat messages
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Completion result
 */
async function streamCompletion(service, messages, options) {
    let fullContent = '';
    let totalTokens = 0;

    try {
        // Make sure the service supports streaming
        if (!service.streamChatCompletion) {
            // Fall back to non-streaming
            const response = await service.generateChatCompletion(messages, {
                model: options.model,
                temperature: options.temperature,
                maxTokens: options.maxTokens,
                signal: options.signal
            });

            const content = response.choices[0]?.message?.content || '';

            // Still call the streaming callback with full content
            if (options.onStream && content) {
                options.onStream(content);
            }

            return {
                content,
                model: options.model,
                provider: service.provider,
                totalTokens: response.usage?.total_tokens || 0,
                streaming: false
            };
        }

        // Use streaming API
        await service.streamChatCompletion(messages, {
            model: options.model,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
            signal: options.signal,
            onToken: (token) => {
                fullContent += token;
                if (options.onStream) {
                    options.onStream(token);
                }
            }
        });

        return {
            content: fullContent,
            model: options.model,
            provider: service.provider,
            totalTokens,
            streaming: true
        };

    } catch (error) {
        // Still return what we got so far in case of error
        if (fullContent && options.onStream) {
            return {
                content: fullContent,
                model: options.model,
                provider: service.provider,
                totalTokens,
                streaming: true,
                error
            };
        }

        throw error;
    }
}

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Stack,
    TextField,
    PrimaryButton,
    DefaultButton,
    Dropdown,
    Text,
    Label,
    Slider,
    Spinner,
    SpinnerSize,
    MessageBar,
    MessageBarType,
    IconButton,
    TooltipHost
} from '@fluentui/react';

import { useWordDocument } from '../../hooks/useWordDocument';
import { useSettings } from '../../hooks/useSettings';
import { createCompletion } from '../../services/api/textGeneration';
import ModelSelector from '../common/ModelSelector';
import { addMemory } from '../../services/memory/memorySystem';

const SAMPLE_PROMPTS = [
    "Improve this text by making it more concise and clear.",
    "Rewrite this in a more professional tone.",
    "Summarize this content in 3 bullet points.",
    "Translate this text to Spanish.",
    "Generate a formal email response based on this message."
];

/**
 * Basic tab component for simple text generation
 */
export default function BasicTab() {
    // Hooks
    const { settings } = useSettings();
    const { selectedText, documentContext, getSelectedText, insertText } = useWordDocument();

    // States
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState(settings.models?.preferredTextModel || 'gpt-4');
    const [temperature, setTemperature] = useState(settings.generation?.temperature || 0.7);
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState(null);
    const [useContext, setUseContext] = useState(settings.features?.contextualAwareness !== false);

    const textAreaRef = useRef(null);
    const abortController = useRef(null);

    // When component mounts, refresh selected text and set it as prompt
    useEffect(() => {
        const fetchSelectedText = async () => {
            const text = await getSelectedText();
            if (text && !prompt) {
                setPrompt(text);
            }
        };

        fetchSelectedText();
    }, [getSelectedText, prompt]);

    // Handle prompt change
    const handlePromptChange = (_, newValue) => {
        setPrompt(newValue);
    };

    // Handle model change
    const handleModelChange = (model) => {
        setSelectedModel(model);
    };

    // Handle temperature change
    const handleTemperatureChange = (value) => {
        setTemperature(value);
    };

    // Handle generate click
    const handleGenerateClick = useCallback(async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setResult('');

        // Create abort controller for cancellation
        abortController.current = new AbortController();

        try {
            // If using context, include document context in prompt
            const contextualPrompt = useContext && documentContext ?
                `The following is text from the user's document:
        
${documentContext.before || ''}
${documentContext.selection || ''}
${documentContext.after || ''}

Based on this context, ${prompt}` :
                prompt;

            // Call API for completion
            const completion = await createCompletion(contextualPrompt, {
                model: selectedModel,
                temperature,
                signal: abortController.current.signal,
                stream: true,
                onStream: (chunk) => {
                    setResult((prev) => prev + chunk);
                }
            });

            // If not streaming, set full result
            if (!completion.streaming) {
                setResult(completion.content);
            }

            // Store memory if enabled
            if (settings.memory?.enabled !== false) {
                addMemory({
                    type: 'generation',
                    content: prompt,
                    context: result,
                    tags: ['basic', selectedModel]
                });
            }
        } catch (err) {
            // Handle errors, but ignore AbortError which is triggered by user
            if (err.name !== 'AbortError') {
                setError(err.message || 'Failed to generate text');
                console.error('Generation error:', err);
            }
        } finally {
            setIsGenerating(false);
            abortController.current = null;
        }
    }, [prompt, selectedModel, temperature, useContext, documentContext, settings.memory?.enabled, abortController]);

    // Handle insert click
    const handleInsertClick = useCallback(async () => {
        if (!result) {
            return;
        }

        try {
            await insertText(result);
        } catch (err) {
            setError(`Failed to insert text: ${err.message}`);
            console.error('Insert error:', err);
        }
    }, [result, insertText]);

    // Handle abort/cancel
    const handleAbortClick = useCallback(() => {
        if (abortController.current) {
            abortController.current.abort();
            setIsGenerating(false);
        }
    }, []);

    // Handle sample prompt selection
    const handleSamplePrompt = useCallback((sample) => {
        setPrompt(sample);
        if (textAreaRef.current) {
            textAreaRef.current.focus();
        }
    }, []);

    // Handle context toggle
    const handleContextToggle = useCallback((_, checked) => {
        setUseContext(checked);
        updateSetting('features.contextualAwareness', checked);
    }, [updateSetting]);

    return (
        <Stack tokens={{ childrenGap: 15 }} className="basic-tab">
            {/* Model selection */}
            <ModelSelector
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
                textOnly={true}
            />

            {/* Prompt input */}
            <TextField
                label="What do you want to do?"
                multiline
                rows={4}
                value={prompt}
                onChange={handlePromptChange}
                placeholder="Enter your instructions here..."
                componentRef={textAreaRef}
            />

            {/* Sample prompts */}
            <Stack horizontal wrap tokens={{ childrenGap: 8 }}>
                <Text>Examples: </Text>
                {SAMPLE_PROMPTS.map((sample, index) => (
                    <DefaultButton
                        key={index}
                        size="small"
                        text={sample.split(' ').slice(0, 2).join(' ') + '...'}
                        onClick={() => handleSamplePrompt(sample)}
                        title={sample}
                    />
                ))}
            </Stack>

            {/* Advanced options */}
            <Stack horizontal wrap tokens={{ childrenGap: 20 }}>
                <Stack.Item grow={1}>
                    <Label>Temperature: {temperature.toFixed(1)}</Label>
                    <Slider
                        min={0}
                        max={1}
                        step={0.1}
                        value={temperature}
                        onChange={handleTemperatureChange}
                        showValue={false}
                    />
                    <Text variant="small">
                        Lower values are more deterministic, higher values more creative
                    </Text>
                </Stack.Item>
                <Stack.Item>
                    <Toggle
                        label="Use document context"
                        checked={useContext}
                        onChange={handleContextToggle}
                    />
                </Stack.Item>
            </Stack>

            {/* Generate button */}
            <Stack horizontal tokens={{ childrenGap: 10 }}>
                <PrimaryButton
                    text="Generate"
                    onClick={handleGenerateClick}
                    disabled={isGenerating || !prompt.trim()}
                />
                {isGenerating && (
                    <DefaultButton
                        text="Cancel"
                        onClick={handleAbortClick}
                    />
                )}
            </Stack>

            {/* Error message */}
            {error && (
                <MessageBar
                    messageBarType={MessageBarType.error}
                    isMultiline={true}
                    onDismiss={() => setError(null)}
                >
                    {error}
                </MessageBar>
            )}

            {/* Loading indicator */}
            {isGenerating && (
                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
                    <Spinner size={SpinnerSize.small} />
                    <Text>Generating response...</Text>
                </Stack>
            )}

            {/* Result display */}
            {result && (
                <Stack tokens={{ childrenGap: 10 }} className="result-container">
                    <Text variant="mediumPlus">Result:</Text>
                    <div className="result-text">
                        {result.split('\n').map((line, i) => (
                            <p key={i}>{line || '\u00A0'}</p>
                        ))}
                    </div>
                    <Stack horizontal tokens={{ childrenGap: 10 }}>
                        <PrimaryButton
                            text="Insert into Document"
                            onClick={handleInsertClick}
                        />
                        <DefaultButton
                            text="Copy to Clipboard"
                            onClick={() => {
                                navigator.clipboard.writeText(result);
                            }}
                        />
                    </Stack>
                </Stack>
            )}
        </Stack>
    );
}
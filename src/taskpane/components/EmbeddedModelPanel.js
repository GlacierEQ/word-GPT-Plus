import React, { useState, useEffect } from 'react';
import {
    Stack,
    Text,
    PrimaryButton,
    DefaultButton,
    Dropdown,
    ProgressIndicator,
    MessageBar,
    MessageBarType,
    TextField,
    Spinner,
    Label
} from '@fluentui/react';
import {
    EMBEDDED_MODELS,
    checkWebGPUSupport,
    generateText,
    summarizeText,
    unloadModels,
    getModelMemoryRequirements
} from '../../utils/embeddedModels';
import { checkSystemCapability } from '../../utils/modelManager';

/**
 * Component for using embedded quantized models
 */
export default function EmbeddedModelPanel({ onGenerateComplete }) {
    const [selectedModel, setSelectedModel] = useState('Xenova/TinyLlama-1.1B-Chat-v0.6');
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isLoadingModel, setIsLoadingModel] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [webGPUSupported, setWebGPUSupported] = useState(false);
    const [systemCapability, setSystemCapability] = useState(null);
    const [generationProgress, setGenerationProgress] = useState({ tokens: 0, completed: false });

    // Model options for the dropdown
    const modelOptions = [
        { key: EMBEDDED_MODELS.TEXT_GENERATION.TINY_LLAMA, text: 'TinyLlama 1.1B (Best quality)' },
        { key: EMBEDDED_MODELS.TEXT_GENERATION.FLAN_T5_SMALL, text: 'Flan-T5 Small (Efficient)' },
        { key: EMBEDDED_MODELS.TEXT_GENERATION.DISTILGPT2, text: 'DistilGPT2 (Fast)' }
    ];

    // Check for WebGPU support and system capability on mount
    useEffect(() => {
        async function checkCapabilities() {
            const gpuSupported = await checkWebGPUSupport();
            setWebGPUSupported(gpuSupported);

            const capability = await checkSystemCapability();
            setSystemCapability(capability);
        }

        checkCapabilities();

        // Clean up by unloading models when component unmounts
        return () => {
            unloadModels();
        };
    }, []);

    // Handle model loading progress updates
    const handleModelLoadProgress = (progress) => {
        setIsLoadingModel(true);
        if (progress.status === 'ready') {
            setIsLoadingModel(false);
            setLoadingProgress(1);
        } else if (progress.status === 'progress') {
            setLoadingProgress(progress.progress);
        }
    };

    // Handle model token generation progress
    const handleGenerationProgress = (progress) => {
        setGenerationProgress({
            tokens: progress.generated_token_count,
            completed: progress.is_finished || false
        });
    };

    // Run text generation
    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setErrorMessage('Please enter a prompt');
            return;
        }

        try {
            setIsGenerating(true);
            setResult('');
            setErrorMessage('');
            setGenerationProgress({ tokens: 0, completed: false });

            const memRequirements = getModelMemoryRequirements(selectedModel);
            console.log(`Starting generation with model: ${selectedModel}, estimated memory: ${memRequirements.estimatedMemoryMB}MB`);

            const generatedText = await generateText(prompt, {
                modelName: selectedModel,
                maxLength: 150,
                temperature: 0.7,
                onModelLoadProgress: handleModelLoadProgress,
                onProgress: handleGenerationProgress
            });

            setResult(generatedText);

            if (onGenerateComplete) {
                onGenerateComplete(generatedText);
            }
        } catch (error) {
            console.error('Generation error:', error);
            setErrorMessage(`Error generating text: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // System warning for low-end devices
    const renderSystemWarning = () => {
        if (!systemCapability) return null;

        if (!systemCapability.canRunEmbedded) {
            return (
                <MessageBar messageBarType={MessageBarType.warning}>
                    Your device may not have enough resources to run embedded AI models smoothly.
                    Consider using Ollama or an API-based model instead.
                </MessageBar>
            );
        }

        return null;
    };

    const memoryInfo = selectedModel ? getModelMemoryRequirements(selectedModel) : null;

    return (
        <Stack tokens={{ childrenGap: 15 }}>
            <MessageBar messageBarType={MessageBarType.success}>
                <Text>
                    <strong>Free Embedded AI:</strong> This model runs directly in Word with no API keys or external services required.
                    {webGPUSupported ? ' WebGPU acceleration is available!' : ''}
                </Text>
            </MessageBar>

            {renderSystemWarning()}

            <Dropdown
                label="Select Model (all completely free)"
                selectedKey={selectedModel}
                options={modelOptions}
                onChange={(_, option) => setSelectedModel(option.key)}
            />

            {memoryInfo && (
                <Text variant="small" style={{ fontStyle: 'italic' }}>
                    Memory usage: ~{memoryInfo.estimatedMemoryMB}MB, recommended: {memoryInfo.recommendedRAM} RAM
                </Text>
            )}

            <TextField
                label="Your prompt"
                multiline
                rows={3}
                value={prompt}
                onChange={(_, value) => setPrompt(value)}
                placeholder="Enter what you'd like the AI to generate..."
            />

            <PrimaryButton
                text={isGenerating ? "Generating..." : "Generate with Free Model"}
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
            />

            {isLoadingModel && (
                <Stack tokens={{ childrenGap: 5 }}>
                    <Label>Loading model ({Math.round(loadingProgress * 100)}%)</Label>
                    <ProgressIndicator percentComplete={loadingProgress} />
                    <Text variant="small">The model will be cached for future use</Text>
                </Stack>
            )}

            {isGenerating && generationProgress.tokens > 0 && (
                <Text>{generationProgress.tokens} tokens generated</Text>
            )}

            {errorMessage && (
                <MessageBar messageBarType={MessageBarType.error}>
                    {errorMessage}
                </MessageBar>
            )}

            {result && (
                <Stack tokens={{ childrenGap: 10 }}>
                    <Label>Result:</Label>
                    <TextField
                        multiline
                        rows={6}
                        readOnly
                        value={result}
                    />

                    <DefaultButton
                        text="Insert into Document"
                        onClick={() => onGenerateComplete && onGenerateComplete(result)}
                    />
                </Stack>
            )}
        </Stack>
    );
}

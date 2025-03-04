import React, { useState, useEffect } from 'react';
import {
    Dropdown,
    DefaultButton,
    Stack,
    Text,
    Spinner,
    SpinnerSize,
    MessageBar,
    MessageBarType,
    Icon
} from '@fluentui/react';
import { useSettings } from '../../hooks/useSettings';

/**
 * Component for selecting AI models
 * @param {Object} props - Component props
 * @param {string} props.type - Model type (text, image)
 * @param {string} props.selectedModel - Currently selected model
 * @param {Function} props.onModelChange - Model change callback
 * @returns {JSX.Element} Model selector component
 */
export default function ModelSelector({
    type = 'text',
    selectedModel = '',
    onModelChange = () => { }
}) {
    const { settings } = useSettings();
    const [loadingModels, setLoadingModels] = useState(false);
    const [error, setError] = useState(null);
    const [models, setModels] = useState([]);

    // Get available models based on settings and API keys
    const getAvailableModels = () => {
        const result = [];

        try {
            setLoadingModels(true);
            setError(null);

            // Add OpenAI models if API key is available
            if (settings.apiKeys?.openai) {
                if (type === 'text') {
                    result.push(
                        { key: 'gpt-4', text: 'GPT-4 (OpenAI)' },
                        { key: 'gpt-4o', text: 'GPT-4o (OpenAI)' },
                        { key: 'gpt-3.5-turbo', text: 'GPT-3.5 Turbo (OpenAI)' }
                    );
                } else if (type === 'image') {
                    result.push(
                        { key: 'gpt-4-vision-preview', text: 'GPT-4 Vision (OpenAI)' }
                    );
                }
            }

            // Add DeepSeek models
            if (settings.apiKeys?.deepseek || (!settings.apiKeys?.deepseek && settings.apiKeys?.openai && !settings.usage?.useSeperateDeepseekKey) || settings.usage?.deepseekNonCommercial) {
                if (type === 'text') {
                    result.push(
                        { key: 'deepseek-chat', text: 'DeepSeek Chat' },
                        { key: 'deepseek-coder', text: 'DeepSeek Coder' }
                    );
                } else if (type === 'image') {
                    result.push(
                        { key: 'deepseek-vl-2.0-base', text: 'DeepSeek VL2 Base' },
                        { key: 'deepseek-vl-2.0-pro', text: 'DeepSeek VL2 Pro' },
                        { key: 'deepseek-vl-2.0-inspect', text: 'DeepSeek VL2 Inspect' }
                    );
                }
            }

            // Add Groq models if API key is available
            if (settings.apiKeys?.groq && type === 'text') {
                result.push(
                    { key: 'llama3-8b-8192', text: 'Llama 3 8B (Groq)' },
                    { key: 'llama3-70b-8192', text: 'Llama 3 70B (Groq)' }
                );
            }

            // Add Google models if API key is available
            if (settings.apiKeys?.gemini && type === 'text') {
                result.push(
                    { key: 'gemini-pro', text: 'Gemini Pro (Google)' }
                );
            }

            // Add embedded models for text if enabled
            if (settings.usage?.embedModelEnabled && type === 'text') {
                result.push(
                    {
                        key: 'tinyllama',
                        text: 'TinyLlama (Free/Browser)',
                        data: {
                            type: 'embedded',
                            onlineStatus: 'Available',
                            tooltip: 'Runs in your browser - No API key needed'
                        }
                    },
                    {
                        key: 'flan-t5',
                        text: 'Flan T5 (Free/Browser)',
                        data: {
                            type: 'embedded',
                            onlineStatus: 'Available',
                            tooltip: 'Runs in your browser - No API key needed'
                        }
                    }
                );
            }

            // Add Ollama models if enabled
            if (settings.usage?.ollamaEnabled && type === 'text') {
                // These would normally be fetched from Ollama API
                result.push(
                    {
                        key: 'ollama:llama3',
                        text: 'Llama 3 (Free/Local)',
                        data: {
                            type: 'local',
                            onlineStatus: 'Checking...',
                            tooltip: 'Runs locally via Ollama'
                        }
                    },
                    {
                        key: 'ollama:mistral',
                        text: 'Mistral (Free/Local)',
                        data: {
                            type: 'local',
                            onlineStatus: 'Checking...',
                            tooltip: 'Runs locally via Ollama'
                        }
                    }
                );

                // Async check for Ollama models (placeholder for actual check)
                setTimeout(() => {
                    setModels(prevModels => {
                        return prevModels.map(model => {
                            if (model.key === 'ollama:llama3') {
                                return { ...model, data: { ...model.data, onlineStatus: 'Available' } };
                            }
                            if (model.key === 'ollama:mistral') {
                                return { ...model, data: { ...model.data, onlineStatus: 'Not Installed' } };
                            }
                            return model;
                        });
                    });
                }, 1000);
            }
        } catch (err) {
            console.error('Error getting available models:', err);
            setError('Failed to load model list');
        } finally {
            setLoadingModels(false);
        }

        return result;
    };

    // Get default model if no selection
    const getDefaultModel = (modelList) => {
        if (selectedModel && modelList.some(m => m.key === selectedModel)) {
            return selectedModel;
        }

        // Choose default based on type
        if (type === 'text') {
            // Prefer OpenAI if available
            if (settings.apiKeys?.openai && modelList.some(m => m.key === 'gpt-4')) {
                return 'gpt-4';
            }
            // Fall back to embedded if available
            if (modelList.some(m => m.key === 'tinyllama')) {
                return 'tinyllama';
            }
        } else if (type === 'image') {
            // Prefer DeepSeek for images if non-commercial available
            if (settings.usage?.deepseekNonCommercial && modelList.some(m => m.key === 'deepseek-vl-2.0-base')) {
                return 'deepseek-vl-2.0-base';
            }
            // Otherwise use OpenAI
            if (settings.apiKeys?.openai && modelList.some(m => m.key === 'gpt-4-vision-preview')) {
                return 'gpt-4-vision-preview';
            }
        }

        // Just get the first model if nothing else
        return modelList.length > 0 ? modelList[0].key : '';
    };

    // Initialize model list
    useEffect(() => {
        const availableModels = getAvailableModels();
        setModels(availableModels);

        // Set default model if needed
        const defaultModel = getDefaultModel(availableModels);
        if (defaultModel && defaultModel !== selectedModel) {
            onModelChange(defaultModel);
        }
    }, [
        type,
        settings.apiKeys?.openai,
        settings.apiKeys?.deepseek,
        settings.apiKeys?.gemini,
        settings.apiKeys?.groq,
        settings.usage?.deepseekNonCommercial,
        settings.usage?.embedModelEnabled,
        settings.usage?.ollamaEnabled,
        settings.usage?.useSeperateDeepseekKey
    ]);

    // Render dropdown item with status if applicable
    const onRenderOption = (option) => {
        if (!option.data) {
            return <span>{option.text}</span>;
        }

        let statusIcon = null;
        let statusColor = '';

        if (option.data.type === 'embedded' || option.data.type === 'local') {
            if (option.data.onlineStatus === 'Available') {
                statusIcon = <Icon iconName="CheckMark" style={{ color: 'green', marginLeft: 5 }} />;
                statusColor = 'green';
            } else if (option.data.onlineStatus === 'Not Installed') {
                statusIcon = <Icon iconName="Warning" style={{ color: 'orange', marginLeft: 5 }} />;
                statusColor = 'orange';
            } else if (option.data.onlineStatus === 'Checking...') {
                statusIcon = <Spinner size={SpinnerSize.xSmall} style={{ marginLeft: 5 }} />;
            }
        }

        return (
            <Stack horizontal verticalAlign="center">
                <Text>{option.text}</Text>
                {statusIcon}
                {option.data.type === 'embedded' && (
                    <Text style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>
                        Browser
                    </Text>
                )}
                {option.data.type === 'local' && (
                    <Text style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>
                        Ollama
                    </Text>
                )}
            </Stack>
        );
    };

    // Handle model selection
    const handleModelChange = (_, option) => {
        onModelChange(option.key);
    };

    // Refresh model list
    const handleRefreshModels = () => {
        const availableModels = getAvailableModels();
        setModels(availableModels);
    };

    return (
        <Stack tokens={{ childrenGap: 10 }} className="model-selector">
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
                <Dropdown
                    label={`Select ${type === 'text' ? 'Text' : 'Image'} Model`}
                    selectedKey={selectedModel}
                    onChange={handleModelChange}
                    placeholder="Select a model"
                    options={models}
                    disabled={loadingModels || models.length === 0}
                    onRenderOption={onRenderOption}
                    styles={{ dropdown: { width: 250 } }}
                />

                <DefaultButton
                    iconProps={{ iconName: 'Refresh' }}
                    onClick={handleRefreshModels}
                    disabled={loadingModels}
                    ariaLabel="Refresh model list"
                    style={{ marginTop: 18 }}
                />
            </Stack>

            {loadingModels && (
                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
                    <Spinner size={SpinnerSize.small} />
                    <Text>Loading available models...</Text>
                </Stack>
            )}

            {error && (
                <MessageBar
                    messageBarType={MessageBarType.error}
                    isMultiline={false}
                    dismissButtonAriaLabel="Close"
                    onDismiss={() => setError(null)}
                >
                    {error}
                </MessageBar>
            )}

            {models.length === 0 && !loadingModels && !error && (
                <MessageBar messageBarType={MessageBarType.warning}>
                    No models available. Please add API keys in settings or enable embedded models.
                </MessageBar>
            )}

            {selectedModel && models.find(m => m.key === selectedModel)?.data?.tooltip && (
                <Text variant="smallPlus" style={{ fontStyle: 'italic' }}>
                    {models.find(m => m.key === selectedModel).data.tooltip}
                </Text>
            )}
        </Stack>
    );
}

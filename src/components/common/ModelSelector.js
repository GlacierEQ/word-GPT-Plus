import React, { useState, useEffect } from 'react';
import { Dropdown } from '@fluentui/react';
import { useSettings } from '../../hooks/useSettings';

/**
 * ModelSelector component for selecting AI models
 * @param {Object} props - Component props
 * @param {string} props.selectedModel - Currently selected model
 * @param {Function} props.onModelChange - Callback when model changes
 * @param {boolean} props.textOnly - Show only text models
 * @param {boolean} props.visionOnly - Show only vision models
 */
export default function ModelSelector({ selectedModel, onModelChange, textOnly = false, visionOnly = false }) {
    const { getSetting } = useSettings();
    const [modelOptions, setModelOptions] = useState([]);

    // Get available models based on configuration
    useEffect(() => {
        // Default models
        const textModels = [
            { key: 'gpt-4', text: 'GPT-4 (OpenAI)' },
            { key: 'gpt-3.5-turbo', text: 'GPT-3.5 Turbo (OpenAI)' },
            { key: 'deepseek-chat', text: 'DeepSeek Chat' },
            { key: 'tinyllama-embedded', text: 'TinyLlama (Browser)' }
        ];

        const visionModels = [
            { key: 'gpt-4-vision-preview', text: 'GPT-4 Vision (OpenAI)' },
            { key: 'deepseek-vl-2.0-base', text: 'DeepSeek VL2 Base' },
            { key: 'deepseek-vl-2.0-pro', text: 'DeepSeek VL2 Pro' }
        ];

        // Filter based on props
        let availableModels = [];

        if (visionOnly) {
            availableModels = visionModels;
        } else if (textOnly) {
            availableModels = textModels;
        } else {
            availableModels = [...textModels, ...visionModels];
        }

        // Check if Ollama is enabled
        if (getSetting('usage.ollamaEnabled', false) && !visionOnly) {
            // Add Ollama models if enabled
            const ollamaModels = getSetting('usage.ollamaModels', []);
            ollamaModels.forEach(model => {
                availableModels.push({
                    key: `ollama:${model}`,
                    text: `${model} (Ollama)`
                });
            });
        }

        setModelOptions(availableModels);
    }, [getSetting, textOnly, visionOnly]);

    // Handle model selection
    const handleModelChange = (event, option) => {
        if (onModelChange) {
            onModelChange(option.key);
        }
    };

    return (
        <Dropdown
            label="Model"
            selectedKey={selectedModel}
            options={modelOptions}
            onChange={handleModelChange}
            styles={{ dropdown: { width: 200 } }}
        />
    );
}

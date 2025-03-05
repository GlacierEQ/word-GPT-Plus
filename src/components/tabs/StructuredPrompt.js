import React, { useState, useEffect } from 'react';
import {
    Stack,
    Text,
    TextField,
    Dropdown,
    PrimaryButton,
    ChoiceGroup,
    Checkbox,
    Label,
    MessageBar,
    MessageBarType,
    Spinner
} from '@fluentui/react';
import { useWordDocument } from '../../hooks/useWordDocument';
import ModelSelector from '../common/ModelSelector';
import { useSettings } from '../../hooks/useSettings';
import { generateText } from '../../services/api/textGeneration';
import { useApiError } from '../../context/ApiErrorContext';

/**
 * Structured prompt builder component
 */
export default function StructuredPrompt() {
    const { settings } = useSettings();
    const { selectedText, documentContext, getSelectedText, insertText } = useWordDocument();
    const { error: apiError, setError: setApiError } = useApiError();

    // Local state
    const [taskType, setTaskType] = useState('edit');
    const [tone, setTone] = useState('professional');
    const [length, setLength] = useState('medium');
    const [customInstructions, setCustomInstructions] = useState('');
    const [promptText, setPromptText] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState('');
    const [includeContext, setIncludeContext] = useState(true);
    const [legalContext, setLegalContext] = useState([]);

    // Task type options
    const taskOptions = [
        { key: 'edit', text: 'Edit/Improve' },
        { key: 'expand', text: 'Expand' },
        { key: 'summarize', text: 'Summarize' },
        { key: 'rewrite', text: 'Rewrite' },
        { key: 'translate', text: 'Translate' },
        { key: 'custom', text: 'Custom Task' }
    ];

    // Tone options
    const toneOptions = [
        { key: 'professional', text: 'Professional' },
        { key: 'casual', text: 'Casual' },
        { key: 'academic', text: 'Academic' },
        { key: 'technical', text: 'Technical' },
        { key: 'persuasive', text: 'Persuasive' },
        { key: 'creative', text: 'Creative' }
    ];

    // Length options
    const lengthChoices = [
        { key: 'short', text: 'Short' },
        { key: 'medium', text: 'Medium' },
        { key: 'long', text: 'Long' }
    ];

    // Legal domain options
    const legalOptions = [
        { key: 'hawaiiState', text: 'Hawaii State Law' },
        { key: 'federalUS', text: 'Federal US Law' },
        { key: 'hawaiianCultural', text: 'Hawaiian Cultural' }
    ];

    // Refresh selected text when component mounts
    useEffect(() => {
        getSelectedText();
    }, [getSelectedText]);

    // Build prompt from inputs
    useEffect(() => {
        let prompt = '';

        // Add task type
        switch (taskType) {
            case 'edit':
                prompt = 'Edit and improve the following text:';
                break;
            case 'expand':
                prompt = 'Expand upon the following text:';
                break;
            case 'summarize':
                prompt = 'Summarize the following text:';
                break;
            case 'rewrite':
                prompt = 'Rewrite the following text:';
                break;
            case 'translate':
                prompt = 'Translate the following text:';
                break;
            case 'custom':
                prompt = customInstructions || 'Process the following text:';
                break;
            default:
                prompt = 'Process the following text:';
        }

        // Add tone if not custom
        if (taskType !== 'custom' && tone) {
            prompt += ` Use a ${tone} tone.`;
        }

        // Add length if applicable
        if (['expand', 'summarize', 'rewrite'].includes(taskType)) {
            let lengthInstructions = '';
            switch (length) {
                case 'short':
                    lengthInstructions = ' Make it brief and concise.';
                    break;
                case 'medium':
                    lengthInstructions = ' Use a moderate length.';
                    break;
                case 'long':
                    lengthInstructions = ' Provide a detailed and thorough response.';
                    break;
                default:
                    break;
            }
            prompt += lengthInstructions;
        }

        // Add legal context if selected
        if (legalContext.length > 0) {
            prompt += ' Consider the following legal contexts:';

            if (legalContext.includes('hawaiiState')) {
                prompt += ' Hawaii State Law,';
            }
            if (legalContext.includes('federalUS')) {
                prompt += ' Federal US Law,';
            }
            if (legalContext.includes('hawaiianCultural')) {
                prompt += ' Hawaiian Cultural practices and traditions,';
            }

            // Remove trailing comma
            prompt = prompt.replace(/,$/, '');
            prompt += '.';
        }

        setPromptText(prompt);
    }, [taskType, tone, length, customInstructions, legalContext]);

    // Handle task type change
    const handleTaskTypeChange = (_, option) => {
        setTaskType(option.key);
    };

    // Handle tone change
    const handleTone
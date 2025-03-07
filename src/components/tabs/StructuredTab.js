import React, { useState, useCallback, useRef } from 'react';
import {
    Stack,
    TextField,
    PrimaryButton,
    DefaultButton,
    Text,
    Dropdown,
    ProgressIndicator,
    MessageBar,
    MessageBarType,
    Label,
    Pivot,
    PivotItem,
    Icon
} from '@fluentui/react';

import { useWordDocument } from '../../hooks/useWordDocument';
import { useSettings } from '../../hooks/useSettings';
import { createCompletion } from '../../services/api/textGeneration';
import ModelSelector from '../common/ModelSelector';

// Structured prompt templates
const PROMPT_TEMPLATES = {
    summarize: {
        id: 'summarize',
        name: 'Summarize Text',
        description: 'Create a concise summary of the selected text',
        systemPrompt: 'You are a summarization expert. Create clear, accurate, and concise summaries of text.',
        promptTemplate: 'Summarize the following text in {{length}} paragraphs, focusing on {{focus}}:\n\n{{text}}',
        fields: [
            {
                id: 'length',
                label: 'Length',
                type: 'dropdown',
                options: [
                    { key: 'one', text: '1 paragraph' },
                    { key: 'two', text: '2-3 paragraphs' },
                    { key: 'bullet', text: 'Bullet points' }
                ],
                defaultValue: 'one'
            },
            {
                id: 'focus',
                label: 'Focus on',
                type: 'dropdown',
                options: [
                    { key: 'main_points', text: 'Main points' },
                    { key: 'conclusions', text: 'Conclusions' },
                    { key: 'arguments', text: 'Arguments' }
                ],
                defaultValue: 'main_points'
            }
        ]
    },
    rewrite: {
        id: 'rewrite',
        name: 'Rewrite & Improve',
        description: 'Rewrite text to improve clarity, style, or tone',
        systemPrompt: 'You are an expert editor who helps improve writing to be clearer, more engaging, and more effective.',
        promptTemplate: 'Rewrite the following text in a {{tone}} tone, making it {{style}}. Maintain the original meaning but improve the quality:\n\n{{text}}',
        fields: [
            {
                id: 'tone',
                label: 'Tone',
                type: 'dropdown',
                options: [
                    { key: 'professional', text: 'Professional' },
                    { key: 'casual', text: 'Casual' },
                    { key: 'academic', text: 'Academic' },
                    { key: 'persuasive', text: 'Persuasive' },
                    { key: 'enthusiastic', text: 'Enthusiastic' }
                ],
                defaultValue: 'professional'
            },
            {
                id: 'style',
                label: 'Style',
                type: 'dropdown',
                options: [
                    { key: 'clearer', text: 'Clearer' },
                    { key: 'more_concise', text: 'More concise' },
                    { key: 'more_detailed', text: 'More detailed' },
                    { key: 'more_engaging', text: 'More engaging' },
                    { key: 'simpler', text: 'Simpler' }
                ],
                defaultValue: 'clearer'
            }
        ]
    },
    format: {
        id: 'format',
        name: 'Format & Structure',
        description: 'Convert text into a specific format or structure',
        systemPrompt: 'You are a document formatting expert who helps structure information clearly and effectively.',
        promptTemplate: 'Convert the following text into a {{format}} format:\n\n{{text}}',
        fields: [
            {
                id: 'format',
                label: 'Format',
                type: 'dropdown',
                options: [
                    { key: 'bullet_points', text: 'Bullet points' },
                    { key: 'numbered_list', text: 'Numbered list' },
                    { key: 'table', text: 'Table' },
                    { key: 'outline', text: 'Outline' },
                    { key: 'qa_format', text: 'Q&A format' }
                ],
                defaultValue: 'bullet_points'
            }
        ]
    },
    analyze: {
        id: 'analyze',
        name: 'Analyze Text',
        description: 'Analyze text for specific characteristics or information',
        systemPrompt: 'You are an analytical expert who provides insightful analysis of text.',
        promptTemplate: 'Analyze the following text, focusing on {{aspect}}. {{instructions}}:\n\n{{text}}',
        fields: [
            {
                id: 'aspect',
                label: 'Analysis aspect',
                type: 'dropdown',
                options: [
                    { key: 'tone', text: 'Tone and mood' },
                    { key: 'arguments', text: 'Arguments and evidence' },
                    { key: 'structure', text: 'Structure and organization' },
                    { key: 'themes', text: 'Themes and concepts' },
                    { key: 'readability', text: 'Readability and clarity' }
                ],
                defaultValue: 'themes'
            },
            {
                id: 'instructions',
                label: 'Instructions',
                type: 'text',
                placeholder: 'Additional instructions (optional)',
                defaultValue: 'Provide a detailed analysis'
            }
        ]
    },
    custom: {
        id: 'custom',
        name: 'Custom Template',
        description: 'Create your own structured prompt',
        systemPrompt: 'You are a helpful AI assistant.',
        promptTemplate: '{{instructions}}\n\n{{text}}',
        fields: [
            {
                id: 'instructions',
                label: 'Instructions',
                type: 'text',
                multiline: true,
                placeholder: 'Enter detailed instructions for the AI',
                defaultValue: 'Please review the following text and provide feedback.'
            }
        ]
    }
};

/**
 * Structured Prompts Tab
 */
export default function StructuredTab() {
    // Hooks
    const { settings } = useSettings();
    const { selectedText, insertText, getSelectedText } = useWordDocument();

    // States
    const [selectedTemplate, setSelectedTemplate] = useState(PROMPT_TEMPLATES.summarize);
    const [fieldValues, setFieldValues] = useState({});
    const [model, setModel] = useState(settings.models?.preferredTextModel || 'gpt-4');
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState(null);
    const [currentSelectedText, setCurrentSelectedText] = useState('');

    const abortController = useRef(null);

    // Update field values when template changes
    React.useEffect(() => {
        // Initialize field values with defaults
        const initialValues = {};
        selectedTemplate.fields.forEach(field => {
            initialValues[field.id] = field.defaultValue || '';
        });
        setFieldValues(initialValues);
    }, [selectedTemplate]);

    // Update selected text when it changes
    React.useEffect(() => {
        const updateSelectedText = async () => {
            const text = await getSelectedText();
            setCurrentSelectedText(text);
        };

        updateSelectedText();
    }, [getSelectedText]);

    // Handle template selection
    const handleTemplateChange = (_, option) => {
        const template = PROMPT_TEMPLATES[option.key];
        if (template) {
            setSelectedTemplate(template);
        }
    };

    // Handle field value changes
    const handleFieldChange = (id, value) => {
        setFieldValues(prev => ({
            ...prev,
            [id]: value
        }));
    };

    // Generate final prompt from template
    const generatePrompt = () => {
        let prompt = selectedTemplate.promptTemplate;

        // Replace field placeholders with values
        Object.keys(fieldValues).forEach(fieldId => {
            prompt = prompt.replace(`{{${fieldId}}}`, fieldValues[fieldId]);
        });

        // Replace text placeholder with selected text
        prompt = prompt.replace('{{text}}', currentSelectedText);

        return prompt;
    };

    // Handle generate click
    const handleGenerateClick = useCallback(async () => {
        if (!currentSelectedText) {
            setError('Please select text in your document first.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setResult('');

        // Create abort controller for cancellation
        abortController.current = new AbortController();

        try {
            const finalPrompt = generatePrompt();

            // Call API for completion with system prompt from template
            const completion = await createCompletion(finalPrompt, {
                model: model,
                systemPrompt: selectedTemplate.systemPrompt,
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
    }, [currentSelectedText, fieldValues, model, selectedTemplate]);

    // Handle insert click
    const handleInsertClick = useCallback(async () => {
        if (!result) {
            return;
        }

        try {
            await insertText(result);
        } catch (err) {
            setError(`Failed to insert text: ${err.message}`);
        }
    }, [result, insertText]);

    // Handle abort/cancel
    const handleAbortClick = useCallback(() => {
        if (abortController.current) {
            abortController.current.abort();
            setIsGenerating(false);
        }
    }, []);

    // Render field based on type
    const renderField = (field) => {
        switch (field.type) {
            case 'dropdown':
                return (
                    <Dropdown
                        key={field.id}
                        label={field.label}
                        selectedKey={fieldValues[field.id] || field.defaultValue}
                        options={field.options}
                        onChange={(_, option) => handleFieldChange(field.id, option.key)}
                    />
                );
            case 'text':
                return (
                    <TextField
                        key={field.id}
                        label={field.label}
                        placeholder={field.placeholder || ''}
                        value={fieldValues[field.id] || ''}
                        onChange={(_, value) => handleFieldChange(field.id, value)}
                        multiline={field.multiline}
                        rows={field.multiline ? 3 : 1}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Stack tokens={{ childrenGap: 15 }}>
            <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                <Text variant="large">Structured Prompts</Text>

                <ModelSelector
                    selectedModel={model}
                    onModelChange={setModel}
                    textOnly={true}
                />
            </Stack>

            {/* Template selection */}
            <Dropdown
                label="Select template"
                selectedKey={selectedTemplate.id}
                options={Object.values(PROMPT_TEMPLATES).map(template => ({
                    key: template.id,
                    text: template.name,
                    data: template
                }))}
                onChange={handleTemplateChange}
            />

            <Text variant="medium">{selectedTemplate.description}</Text>

            {/* Dynamic fields */}
            <Stack tokens={{ childrenGap: 10 }}>
                {selectedTemplate.fields.map(field => renderField(field))}
            </Stack>

            {/* Selected text info */}
            <Stack horizontal verticalAlign="center" horizontalAlign="space-between">
                <Text>
                    {currentSelectedText ?
                        `Selected text: ${currentSelectedText.substring(0, 50)}${currentSelectedText.length > 50 ? '...' : ''}` :
                        'No text selected in document'
                    }
                </Text>
                <DefaultButton
                    onClick={async () => setCurrentSelectedText(await getSelectedText())}
                    iconProps={{ iconName: 'Refresh' }}
                    text="Refresh"
                />
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

            {/* Generate button */}
            <Stack horizontal tokens={{ childrenGap: 10 }}>
                <PrimaryButton
                    text="Generate"
                    onClick={handleGenerateClick}
                    disabled={isGenerating || !currentSelectedText}
                />
                {isGenerating && (
                    <DefaultButton
                        text="Cancel"
                        onClick={handleAbortClick}
                    />
                )}
            </Stack>

            {/* Loading indicator */}
            {isGenerating && (
                <ProgressIndicator label="Generating response..." />
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

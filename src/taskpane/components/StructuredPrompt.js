import React from 'react';
import {
    TextField,
    Stack,
    Text,
    Dropdown,
    DefaultButton,
    PrimaryButton,
    Toggle,
    IconButton,
    Panel,
    PanelType,
    Label,
    Checkbox,
    MessageBar,
    MessageBarType
} from '@fluentui/react';
import { LEGAL_DOMAINS } from '../../utils/legalContext';

const promptSections = [
    { key: 'who', name: 'Who', description: 'Who is the audience or subject?' },
    { key: 'what', name: 'What', description: 'What is the main content/purpose?' },
    { key: 'how', name: 'How', description: 'How should it be presented?' },
    { key: 'why', name: 'Why', description: 'Why is this content needed?' },
    { key: 'alwaysNever', name: 'Always/Never', description: 'Required or prohibited elements' },
    { key: 'imageDesc', name: 'Image Description', description: 'Visual elements to reference (if applicable)' }
];

const toneOptions = [
    { key: 'professional', text: 'Professional' },
    { key: 'casual', text: 'Casual' },
    { key: 'academic', text: 'Academic' },
    { key: 'persuasive', text: 'Persuasive' },
    { key: 'friendly', text: 'Friendly' },
    { key: 'authoritative', text: 'Authoritative' },
    { key: 'humorous', text: 'Humorous' },
    { key: 'technical', text: 'Technical' },
    { key: 'legal', text: 'Legal' },
    { key: 'poetic', text: 'Poetic' }
];

const templateOptions = [
    { key: 'standard', text: 'Standard Text' },
    { key: 'email', text: 'Email' },
    { key: 'memo', text: 'Memo' },
    { key: 'letter', text: 'Letter' },
    { key: 'report', text: 'Report' },
    { key: 'proposal', text: 'Proposal' },
    { key: 'analysis', text: 'Analysis' },
    { key: 'brief', text: 'Legal Brief' },
    { key: 'contract', text: 'Contract' }
];

export default class StructuredPrompt extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sections: {
                who: '',
                what: '',
                how: '',
                why: '',
                alwaysNever: '',
                imageDesc: ''
            },
            selectedTone: 'professional',
            selectedTemplate: 'standard',
            advancedSettingsOpen: false,
            legalDomains: {
                [LEGAL_DOMAINS.HAWAII_STATE]: false,
                [LEGAL_DOMAINS.FEDERAL_US]: false,
                [LEGAL_DOMAINS.HAWAIIAN_CULTURAL]: false
            },
            selectedText: props.selectedText || '',
            errorMessage: ''
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.selectedText !== prevProps.selectedText) {
            this.setState({ selectedText: this.props.selectedText });
        }
    }

    handleSectionChange = (key, value) => {
        this.setState(prevState => ({
            sections: {
                ...prevState.sections,
                [key]: value
            }
        }));
    };

    handleToneChange = (_, option) => {
        this.setState({ selectedTone: option.key });
    };

    handleTemplateChange = (_, option) => {
        this.setState({ selectedTemplate: option.key });
    };

    toggleAdvancedSettings = () => {
        this.setState(prevState => ({
            advancedSettingsOpen: !prevState.advancedSettingsOpen
        }));
    };

    toggleLegalDomain = (domain) => {
        this.setState(prevState => ({
            legalDomains: {
                ...prevState.legalDomains,
                [domain]: !prevState.legalDomains[domain]
            }
        }));
    };

    generatePrompt = () => {
        const { sections, selectedTone, selectedTemplate, legalDomains, selectedText } = this.state;

        // Validate input
        if (!selectedTemplate || !selectedTone) {
            this.setState({ errorMessage: 'Please select both a template and a tone.' });
            return;
        }

        // Build structured prompt
        let prompt = `I have a ${selectedTemplate} that needs your assistance. Please help with the following context:`;

        // Add sections that have content
        Object.entries(sections).forEach(([key, value]) => {
            if (value.trim()) {
                const section = promptSections.find(s => s.key === key);
                prompt += `\n\n${section.name}: ${value}`;
            }
        });

        // Add tone preference
        prompt += `\n\nPlease use a ${selectedTone} tone.`;

        // Add selected text if available
        if (selectedText) {
            prompt += `\n\nHere's the text to work with:\n"""\n${selectedText}\n"""`;
        }

        // Get legal domains
        const activeLegalDomains = Object.entries(legalDomains)
            .filter(([_, isActive]) => isActive)
            .map(([domain]) => domain);

        // Call parent's generate method with the constructed prompt and legal domains
        this.props.onGenerate(prompt, activeLegalDomains);
    };

    render() {
        const { sections, selectedTone, selectedTemplate, advancedSettingsOpen, legalDomains, errorMessage } = this.state;

        return (
            <Stack tokens={{ childrenGap: 15 }} className="structured-prompt">
                <Text variant="xLarge" className="structured-prompt-title">Enhanced Prompt Builder</Text>

                {/* Template and Tone Dropdowns */}
                <Stack horizontal tokens={{ childrenGap: 15 }}>
                    <Stack.Item grow={1}>
                        <Dropdown
                            label="Template"
                            selectedKey={selectedTemplate}
                            options={templateOptions}
                            onChange={this.handleTemplateChange}
                        />
                    </Stack.Item>
                    <Stack.Item grow={1}>
                        <Dropdown
                            label="Tone"
                            selectedKey={selectedTone}
                            options={toneOptions}
                            onChange={this.handleToneChange}
                        />
                    </Stack.Item>
                </Stack>

                {/* Section Fields */}
                {promptSections.map(section => (
                    <TextField
                        key={section.key}
                        label={section.name}
                        placeholder={section.description}
                        value={sections[section.key]}
                        onChange={(_, newValue) => this.handleSectionChange(section.key, newValue)}
                        multiline={section.key === 'what' || section.key === 'alwaysNever' || section.key === 'imageDesc'}
                        rows={section.key === 'what' ? 3 : 2}
                    />
                ))}

                {/* Legal Context Options */}
                <Stack horizontal verticalAlign="center">
                    <Stack.Item grow>
                        <Text>Legal Context</Text>
                    </Stack.Item>
                    <Stack.Item>
                        <DefaultButton
                            iconProps={{ iconName: 'Settings' }}
                            text="Legal Settings"
                            onClick={this.toggleAdvancedSettings}
                        />
                    </Stack.Item>
                </Stack>

                {/* Advanced Settings Panel */}
                <Panel
                    isOpen={advancedSettingsOpen}
                    onDismiss={this.toggleAdvancedSettings}
                    headerText="Legal Context Settings"
                    type={PanelType.medium}
                >
                    <Stack tokens={{ childrenGap: 10 }}>
                        <Text>Select legal domains to apply to your prompt:</Text>

                        <Checkbox
                            label="Hawaii State Law"
                            checked={legalDomains[LEGAL_DOMAINS.HAWAII_STATE]}
                            onChange={() => this.toggleLegalDomain(LEGAL_DOMAINS.HAWAII_STATE)}
                        />
                        <Text variant="small">Includes Hawaii Revised Statutes, Hawaii Administrative Rules, and Hawaii case law.</Text>

                        <Checkbox
                            label="US Federal Law"
                            checked={legalDomains[LEGAL_DOMAINS.FEDERAL_US]}
                            onChange={() => this.toggleLegalDomain(LEGAL_DOMAINS.FEDERAL_US)}
                        />
                        <Text variant="small">Includes US Constitution, federal statutes, and Supreme Court precedents.</Text>

                        <Checkbox
                            label="Hawaiian Cultural Law"
                            checked={legalDomains[LEGAL_DOMAINS.HAWAIIAN_CULTURAL]}
                            onChange={() => this.toggleLegalDomain(LEGAL_DOMAINS.HAWAIIAN_CULTURAL)}
                        />
                        <Text variant="small">Includes Native Hawaiian rights, cultural practices, and traditional legal concepts.</Text>

                        <DefaultButton text="Apply" onClick={this.toggleAdvancedSettings} />
                    </Stack>
                </Panel>

                {/* Error Message */}
                {errorMessage && (
                    <MessageBar
                        messageBarType={MessageBarType.error}
                        isMultiline={false}
                        onDismiss={() => this.setState({ errorMessage: '' })}
                        dismissButtonAriaLabel="Close"
                    >
                        {errorMessage}
                    </MessageBar>
                )}

                {/* Generate Button */}
                <PrimaryButton
                    text="Generate"
                    onClick={this.generatePrompt}
                    disabled={this.props.isGenerating}
                />
            </Stack>
        );
    }
}

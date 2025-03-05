import React, { useState } from 'react';
import {
    Stack,
    Toggle,
    Text,
    Dropdown,
    MessageBar,
    MessageBarType,
    DefaultButton,
    Slider
} from '@fluentui/react';
import { useSettings } from '../../hooks/useSettings';

/**
 * Component for general application settings
 */
export default function GeneralSettings() {
    const { settings, updateSetting } = useSettings();

    // General settings
    const [contextualAwareness, setContextualAwareness] = useState(settings.features?.contextualAwareness !== false);
    const [errorDetection, setErrorDetection] = useState(settings.features?.errorDetection !== false);
    const [embedModelEnabled, setEmbedModelEnabled] = useState(settings.usage?.embedModelEnabled !== false);
    const [ollamaEnabled, setOllamaEnabled] = useState(settings.usage?.ollamaEnabled !== false);
    const [temperature, setTemperature] = useState(settings.generation?.temperature || 0.7);
    const [theme, setTheme] = useState(settings.ui?.theme || 'auto');
    const [debugMode, setDebugMode] = useState(settings.system?.debugMode === true);

    // Theme options
    const themeOptions = [
        { key: 'light', text: 'Light' },
        { key: 'dark', text: 'Dark' },
        { key: 'auto', text: 'System Default' },
    ];

    // Handle contextual awareness toggle
    const handleToggleContextual = (_, checked) => {
        setContextualAwareness(checked);
        updateSetting('features.contextualAwareness', checked);
    };

    // Handle error detection toggle
    const handleToggleErrorDetection = (_, checked) => {
        setErrorDetection(checked);
        updateSetting('features.errorDetection', checked);
    };

    // Handle embedded model toggle
    const handleToggleEmbedModel = (_, checked) => {
        setEmbedModelEnabled(checked);
        updateSetting('usage.embedModelEnabled', checked);
    };

    // Handle Ollama toggle
    const handleToggleOllama = (_, checked) => {
        setOllamaEnabled(checked);
        updateSetting('usage.ollamaEnabled', checked);
    };

    // Handle temperature change
    const handleTemperatureChange = (value) => {
        setTemperature(value);
        updateSetting('generation.temperature', value);
    };

    // Handle theme change
    const handleThemeChange = (_, option) => {
        setTheme(option.key);
        updateSetting('ui.theme', option.key);
    };

    // Handle debug mode toggle
    const handleToggleDebugMode = (_, checked) => {
        setDebugMode(checked);
        updateSetting('system.debugMode', checked);
    };

    return (
        <Stack tokens={{ childrenGap: 15 }} className="general-settings">
            <Text variant="large">General Settings</Text>

            <Stack tokens={{ childrenGap: 10 }}>
                {/* AI Feature toggles */}
                <Text variant="mediumPlus">AI Features</Text>

                <Toggle
                    label="Contextual awareness"
                    checked={contextualAwareness}
                    onChange={handleToggleContextual}
                    onText="Enabled"
                    offText="Disabled"
                />
                <Text variant="small" style={{ marginTop: -10 }}>
                    Helps the AI understand the context of your document
                </Text>

                <Toggle
                    label="Error detection"
                    checked={errorDetection}
                    onChange={handleToggleErrorDetection}
                    onText="Enabled"
                    offText="Disabled"
                />
                <Text variant="small" style={{ marginTop: -10 }}>
                    Identifies and corrects errors in grammar, spelling, and logic
                </Text>

                {/* Generation options */}
                <Text variant="mediumPlus" style={{ marginTop: 10 }}>Generation Options</Text>

                <Stack tokens={{ childrenGap: 5 }}>
                    <Text>Temperature</Text>
                    <Slider
                        min={0}
                        max={1}
                        step={0.1}
                        value={temperature}
                        showValue
                        valueFormat={(value) => `${value.toFixed(1)}`}
                        onChange={handleTemperatureChange}
                    />
                    <Text variant="small" style={{ fontStyle: 'italic' }}>
                        Higher values (0.7-1.0) make output more creative, lower values (0.0-0.3) make it more deterministic
                    </Text>
                </Stack>

                {/* Model options */}
                <Text variant="mediumPlus" style={{ marginTop: 10 }}>Model Options</Text>

                <Toggle
                    label="Enable browser-embedded models"
                    checked={embedModelEnabled}
                    onChange={handleToggleEmbedModel}
                    onText="Enabled"
                    offText="Disabled"
                />
                <Text variant="small" style={{ marginTop: -10 }}>
                    Run AI models directly in your browser without API keys (lower quality but completely free)
                </Text>

                <Toggle
                    label="Enable Ollama integration"
                    checked={ollamaEnabled}
                    onChange={handleToggleOllama}
                    onText="Enabled"
                    offText="Disabled"
                />
                <Text variant="small" style={{ marginTop: -10 }}>
                    Use local AI models via Ollama if installed (requires separate Ollama installation)
                </Text>

                {ollamaEnabled && (
                    <MessageBar messageBarType={MessageBarType.info}>
                        Ollama must be installed and running on your computer for this feature to work.
                        <DefaultButton
                            text="Download Ollama"
                            onClick={() => window.open('https://ollama.ai', '_blank')}
                            style={{ marginTop: 10 }}
                        />
                    </MessageBar>
                )}

                {/* UI options */}
                <Text variant="mediumPlus" style={{ marginTop: 10 }}>UI Options</Text>

                <Dropdown
                    label="Theme"
                    selectedKey={theme}
                    onChange={handleThemeChange}
                    options={themeOptions}
                />

                {/* System options */}
                <Text variant="mediumPlus" style={{ marginTop: 10 }}>System
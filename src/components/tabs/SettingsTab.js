import React, { useState, useEffect } from 'react';
import {
    Stack,
    Text,
    TextField,
    DefaultButton,
    PrimaryButton,
    Toggle,
    Dropdown,
    ProgressIndicator,
    Separator,
    MessageBar,
    MessageBarType,
    Pivot,
    PivotItem,
    Label,
    Slider,
    SpinButton,
    ComboBox,
    Link
} from '@fluentui/react';

import { getSetting, updateSetting } from '../../services/settings/settingsManager';
import { updateService } from '../../services/updater/updateService';

// API key input with reveal/hide functionality
const ApiKeyField = ({ label, settingPath, placeholder }) => {
    const [key, setKey] = useState('');
    const [isRevealed, setIsRevealed] = useState(false);

    // Load API key on mount
    useEffect(() => {
        const storedKey = getSetting(settingPath, '');
        setKey(storedKey);
    }, [settingPath]);

    // Handle key change
    const handleChange = (_, value) => {
        setKey(value);
    };

    // Save key
    const handleSave = () => {
        updateSetting(settingPath, key);
    };

    // Clear key
    const handleClear = () => {
        setKey('');
        updateSetting(settingPath, '');
    };

    // Toggle reveal
    const toggleReveal = () => {
        setIsRevealed(!isRevealed);
    };

    return (
        <Stack tokens={{ childrenGap: 10 }}>
            <Stack horizontal verticalAlign="center" horizontalAlign="space-between">
                <Label>{label}</Label>
                <Link onClick={toggleReveal}>{isRevealed ? 'Hide' : 'Show'}</Link>
            </Stack>
            <Stack horizontal tokens={{ childrenGap: 10 }}>
                <Stack.Item grow>
                    <TextField
                        placeholder={placeholder}
                        value={key}
                        onChange={handleChange}
                        type={isRevealed ? 'text' : 'password'}
                    />
                </Stack.Item>
                <DefaultButton onClick={handleSave} disabled={!key}>Save</DefaultButton>
                <DefaultButton onClick={handleClear}>Clear</DefaultButton>
            </Stack>
        </Stack>
    );
};

/**
 * Settings Tab Component
 */
export default function SettingsTab() {
    // State for settings fields
    const [updateStatus, setUpdateStatus] = useState(null);
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [temperature, setTemperature] = useState(getSetting('generation.temperature', 0.7));
    const [maxTokens, setMaxTokens] = useState(getSetting('generation.maxTokens', 2048));
    const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(getSetting('system.autoUpdate', true));
    const [preferredModel, setPreferredModel] = useState(getSetting('models.preferredTextModel', 'gpt-4'));
    const [memoryEnabled, setMemoryEnabled] = useState(getSetting('memory.enabled', true));
    const [contextualAwareness, setContextualAwareness] = useState(getSetting('features.contextualAwareness', true));
    const [deepseekNonCommercial, setDeepseekNonCommercial] = useState(getSetting('usage.deepseekNonCommercial', true));
    const [message, setMessage] = useState(null);

    // Models dropdown options
    const modelOptions = [
        { key: 'gpt-4', text: 'GPT-4 (OpenAI)' },
        { key: 'gpt-3.5-turbo', text: 'GPT-3.5 Turbo (OpenAI)' },
        { key: 'deepseek-chat', text: 'DeepSeek Chat' },
        { key: 'tinyllama-embedded', text: 'TinyLlama (Browser)' },
    ];

    // Handle check for updates
    const handleCheckUpdate = async () => {
        try {
            setIsCheckingUpdate(true);
            const status = await updateService.checkForUpdates(true); // Force check
            setUpdateStatus(status);

            if (status.status === 'update-available') {
                setMessage({
                    type: MessageBarType.success,
                    text: `Update available: ${status.latestVersion}`
                });
            } else if (status.status === 'up-to-date') {
                setMessage({
                    type: MessageBarType.info,
                    text: `You have the latest version: ${status.currentVersion}`
                });
            } else {
                setMessage({
                    type: MessageBarType.warning,
                    text: status.message || 'Unknown update status'
                });
            }
        } catch (error) {
            setMessage({
                type: MessageBarType.error,
                text: `Error checking for updates: ${error.message}`
            });
        } finally {
            setIsCheckingUpdate(false);
        }
    };

    // Handle update now
    const handleUpdate = async () => {
        if (!updateStatus || updateStatus.status !== 'update-available') return;

        try {
            await updateService.triggerUpdate();
            setMessage({
                type: MessageBarType.success,
                text: 'Update process started. Follow the instructions in the dialog.'
            });
        } catch (error) {
            setMessage({
                type: MessageBarType.error,
                text: `Error triggering update: ${error.message}`
            });
        }
    };

    // Handle settings changes
    const handleTemperatureChange = (value) => {
        setTemperature(value);
        updateSetting('generation.temperature', value);
    };

    const handleMaxTokensChange = (_, value) => {
        const tokens = parseInt(value);
        if (!isNaN(tokens)) {
            setMaxTokens(tokens);
            updateSetting('generation.maxTokens', tokens);
        }
    };

    const handleAutoUpdateChange = (_, checked) => {
        setAutoUpdateEnabled(checked);
        updateSetting('system.autoUpdate', checked);
    };

    const handleModelChange = (_, option) => {
        setPreferredModel(option.key);
        updateSetting('models.preferredTextModel', option.key);
    };

    const handleMemoryChange = (_, checked) => {
        setMemoryEnabled(checked);
        updateSetting('memory.enabled', checked);
    };

    const handleContextChange = (_, checked) => {
        setContextualAwareness(checked);
        updateSetting('features.contextualAwareness', checked);
    };

    const handleDeepSeekCommercialChange = (_, checked) => {
        setDeepseekNonCommercial(checked);
        updateSetting('usage.deepseekNonCommercial', checked);
    };

    // Clear message after 5 seconds
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <Stack tokens={{ childrenGap: 15 }} styles={{ root: { maxWidth: 800 } }}>
            <Text variant="xLarge">Settings</Text>

            {message && (
                <MessageBar
                    messageBarType={message.type}
                    isMultiline={false}
                    onDismiss={() => setMessage(null)}
                    dismissButtonAriaLabel="Close"
                >
                    {message.text}
                </MessageBar>
            )}

            <Pivot>
                <PivotItem headerText="API Keys">
                    <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: '10px 0' } }}>
                        <ApiKeyField
                            label="OpenAI API Key"
                            settingPath="apiKeys.openai"
                            placeholder="sk-..."
                        />

                        <ApiKeyField
                            label="DeepSeek API Key"
                            settingPath="apiKeys.deepseek"
                            placeholder="deepseek-..."
                        />

                        <ApiKeyField
                            label="Azure OpenAI"
                            settingPath="apiKeys.azure"
                            placeholder="Azure OpenAI key"
                        />

                        <Toggle
                            label="Use DeepSeek without API key (non-commercial use only)"
                            checked={deepseekNonCommercial}
                            onChange={handleDeepSeekCommercialChange}
                        />

                        <Text variant="small">
                            Note: API keys are stored locally on your device and are never transmitted to our servers.
                            They are used directly to authenticate with the respective API providers.
                        </Text>
                    </Stack>
                </PivotItem>

                <PivotItem headerText="Generation Settings">
                    <Stack tokens={{ childrenGap: 15 }} styles={{ root: { padding: '10px 0' } }}>
                        <Dropdown
                            label="Default AI Model"
                            selectedKey={preferredModel}
                            options={modelOptions}
                            onChange={handleModelChange}
                        />

                        <Stack>
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
                                Lower values produce more predictable results, higher values more creative ones.
                            </Text>
                        </Stack>

                        <SpinButton
                            label="Max Tokens"
                            min={256}
                            max={8192}
                            step={256}
                            value={maxTokens.toString()}
                            onChange={handleMaxTokensChange}
                        />

                        <Toggle
                            label="Enable memory"
                            checked={memoryEnabled}
                            onChange={handleMemoryChange}
                            onText="On (Remembers previous interactions)"
                            offText="Off (No memory of previous interactions)"
                        />

                        <Toggle
                            label="Use document context"
                            checked={contextualAwareness}
                            onChange={handleContextChange}
                            onText="On (AI is aware of surrounding text)"
                            offText="Off (AI only sees selected text)"
                        />
                    </Stack>
                </PivotItem>

                <PivotItem headerText="Updates">
                    <Stack tokens={{ childrenGap: 15 }} styles={{ root: { padding: '10px 0' } }}>
                        <Stack horizontal tokens={{ childrenGap: 10 }}>
                            <PrimaryButton
                                onClick={handleCheckUpdate}
                                disabled={isCheckingUpdate}
                                text={isCheckingUpdate ? "Checking..." : "Check for Updates"}
                            />

                            {updateStatus?.status === 'update-available' && (
                                <DefaultButton onClick={handleUpdate} text="Update Now" />
                            )}
                        </Stack>

                        {isCheckingUpdate && <ProgressIndicator label="Checking for updates..." />}

                        {updateStatus && (
                            <Text>
                                Current version: {updateStatus.currentVersion || "unknown"}
                                {updateStatus.latestVersion && `, Latest: ${updateStatus.latestVersion}`}
                            </Text>
                        )}

                        <Toggle
                            label="Automatic updates"
                            checked={autoUpdateEnabled}
                            onChange={handleAutoUpdateChange}
                            onText="On (Check for updates automatically)"
                            offText="Off (Manual updates only)"
                        />
                    </Stack>
                </PivotItem>

                <PivotItem headerText="Advanced">
                    <Stack tokens={{ childrenGap: 15 }} styles={{ root: { padding: '10px 0' } }}>
                        <TextField
                            label="Custom DeepSeek Endpoint URL"
                            value={getSetting('usage.deepseekEndpoint', 'https://api.deepseek.com/v1')}
                            onChange={(_, value) => updateSetting('usage.deepseekEndpoint', value)}
                        />

                        <TextField
                            label="Ollama Local Endpoint"
                            value={getSetting('usage.ollamaEndpoint', 'http://localhost:11434')}
                            onChange={(_, value) => updateSetting('usage.ollamaEndpoint', value)}
                            placeholder="http://localhost:11434"
                        />

                        <ComboBox
                            label="Advanced: Local Models"
                            placeholder="Select available models"
                            multiSelect
                            options={[
                                { key: 'llama2', text: 'Llama2' },
                                { key: 'mistral', text: 'Mistral' },
                                { key: 'gemma', text: 'Gemma' },
                                { key: 'phi3', text: 'Phi-3' }
                            ]}
                        />

                        <DefaultButton
                            text="Reset All Settings"
                            onClick={() => {
                                if (window.confirm("Are you sure you want to reset all settings to defaults? This cannot be undone.")) {
                                    // Clear all settings
                                    Object.keys(localStorage).forEach(key => {
                                        if (key.startsWith('word-gpt-plus.')) {
                                            localStorage.removeItem(key);
                                        }
                                    });
                                    // Reload the page to apply defaults
                                    window.location.reload();
                                }
                            }}
                        />
                    </Stack>
                </PivotItem>

                <PivotItem headerText="About">
                    <Stack tokens={{ childrenGap: 10 }} styles={{ root: { padding: '10px 0' } }}>
                        <Text variant="large">Word-GPT-Plus</Text>
                        <Text>Version: {getSetting('system.currentVersion', '1.0.0')}</Text>
                        <Text>Released: {getSetting('system.releaseDate', '')}</Text>

                        <Separator />

                        <Text>
                            Word-GPT-Plus is an advanced AI assistant for Microsoft Word that integrates with multiple AI providers
                            including OpenAI, DeepSeek, and local models via Ollama.
                        </Text>

                        <Text variant="medium" style={{ marginTop: 10 }}>
                            Copyright © 2025 Example Inc. All rights reserved.
                        </Text>
                    </Stack>
                </PivotItem>
            </Pivot>
        </Stack>
    );
}

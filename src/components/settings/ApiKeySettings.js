import React from 'react';
import {
    TextField,
    Toggle,
    MessageBar,
    MessageBarType,
    Stack,
    Text,
    Link
} from '@fluentui/react';
import { useSettings } from '../../hooks/useSettings';

/**
 * Component for managing API keys and authentication settings
 */
export default function ApiKeySettings() {
    const { settings, updateSetting } = useSettings();

    const handleApiKeyChange = (provider, value) => {
        updateSetting(`apiKeys.${provider}`, value);
    };

    const handleSecurityToggle = (setting, value) => {
        updateSetting(`security.${setting}`, value);
    };

    return (
        <Stack tokens={{ childrenGap: 15 }} className="api-settings-panel">
            <Text variant="large">API Configuration</Text>

            {/* Security settings */}
            <Stack tokens={{ childrenGap: 8 }}>
                <Text variant="mediumPlus">Security Settings</Text>
                <Toggle
                    label="Store API keys in memory only (not persisted)"
                    checked={settings.security.storeKeysInMemoryOnly}
                    onChange={(_, checked) => handleSecurityToggle('storeKeysInMemoryOnly', checked)}
                />
                <Toggle
                    label="Encrypt stored API keys"
                    checked={settings.security.encryptStoredKeys}
                    onChange={(_, checked) => handleSecurityToggle('encryptStoredKeys', checked)}
                    disabled={settings.security.storeKeysInMemoryOnly}
                />
                <MessageBar messageBarType={MessageBarType.info}>
                    <Text>
                        Memory-only storage improves security but requires re-entering keys when you reload.
                        Encryption adds protection for persisted keys.
                    </Text>
                </MessageBar>
            </Stack>

            {/* OpenAI API Key */}
            <Stack tokens={{ childrenGap: 5 }}>
                <TextField
                    label="OpenAI API Key"
                    value={settings.apiKeys.openai || ''}
                    onChange={(_, value) => handleApiKeyChange('openai', value)}
                    placeholder="sk-..."
                    type="password"
                    canRevealPassword
                />
                <Link href="https://platform.openai.com/account/api-keys" target="_blank">
                    Get OpenAI API Key
                </Link>
            </Stack>

            {/* Google API Key */}
            <Stack tokens={{ childrenGap: 5 }}>
                <TextField
                    label="Google Gemini API Key"
                    value={settings.apiKeys.gemini || ''}
                    onChange={(_, value) => handleApiKeyChange('gemini', value)}
                    placeholder="AIza..."
                    type="password"
                    canRevealPassword
                />
                <Link href="https://ai.google.dev/" target="_blank">
                    Get Google Gemini API Key
                </Link>
            </Stack>

            {/* Groq API Key */}
            <Stack tokens={{ childrenGap: 5 }}>
                <TextField
                    label="Groq API Key"
                    value={settings.apiKeys.groq || ''}
                    onChange={(_, value) => handleApiKeyChange('groq', value)}
                    placeholder="gsk_..."
                    type="password"
                    canRevealPassword
                />
                <Link href="https://console.groq.com/keys" target="_blank">
                    Get Groq API Key
                </Link>
            </Stack>

            {/* Azure OpenAI Settings */}
            <Stack tokens={{ childrenGap: 5 }}>
                <Text variant="mediumPlus">Azure OpenAI (Optional)</Text>
                <TextField
                    label="Azure OpenAI API Key"
                    value={settings.apiKeys.azure || ''}
                    onChange={(_, value) => handleApiKeyChange('azure', value)}
                    type="password"
                    canRevealPassword
                />
                <TextField
                    label="Azure OpenAI Endpoint"
                    value={settings.endpoints?.azure || ''}
                    onChange={(_, value) => updateSetting('endpoints.azure', value)}
                    placeholder="https://your-resource.openai.azure.com"
                />
                <TextField
                    label="Azure OpenAI Deployment Name"
                    value={settings.azure?.deploymentName || ''}
                    onChange={(_, value) => updateSetting('azure.deploymentName', value)}
                    placeholder="deployment-name"
                />
            </Stack>

            <MessageBar messageBarType={MessageBarType.warning}>
                <Text>
                    API keys are sensitive information. Don't share your API keys or include them in shared documents.
                    Regularly rotate your API keys for better security.
                </Text>
            </MessageBar>
        </Stack>
    );
}

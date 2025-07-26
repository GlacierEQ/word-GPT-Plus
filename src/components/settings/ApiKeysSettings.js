import React, { useState, useEffect } from 'react';
import { 
    TextField, 
    PrimaryButton, 
    Stack, 
    Text, 
    MessageBar, 
    MessageBarType,
    Spinner,
    SpinnerSize
} from '@fluentui/react';
import { useSettings } from '../../context/SettingsContext';
import { useEnhancedApi } from '../../context/EnhancedApiContext';

const ApiKeysSettings = () => {
    const { settings, updateSettings } = useSettings();
    const { availableModels, isInitialized } = useEnhancedApi();
    
    const [formData, setFormData] = useState({
        groqApiKey: '',
        deepseekApiKey: '',
        openaiApiKey: ''
    });
    
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

    // Initialize form with saved settings
    useEffect(() => {
        if (settings) {
            setFormData({
                groqApiKey: settings.groqApiKey || '',
                deepseekApiKey: settings.deepseekApiKey || '',
                openaiApiKey: settings.openaiApiKey || ''
            });
        }
    }, [settings]);

    const handleInputChange = (field) => (event, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setSaveStatus({ type: '', message: '' });
            
            // Update settings
            await updateSettings({
                ...settings,
                ...formData
            });
            
            setSaveStatus({
                type: 'success',
                message: 'API keys saved successfully!'
            });
        } catch (error) {
            console.error('Error saving API keys:', error);
            setSaveStatus({
                type: 'error',
                message: `Failed to save API keys: ${error.message}`
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isInitialized) {
        return (
            <Stack horizontalAlign="center" style={{ padding: 20 }}>
                <Spinner size={SpinnerSize.medium} />
                <Text>Loading API providers...</Text>
            </Stack>
        );
    }

    return (
        <Stack tokens={{ childrenGap: 15 }}>
            <Text variant="xLarge" block>API Keys</Text>
            <Text variant="medium">
                Enter your API keys for different AI providers. Your keys are stored securely and never sent to our servers.
            </Text>

            {saveStatus.message && (
                <MessageBar
                    messageBarType={saveStatus.type === 'error' ? MessageBarType.error : MessageBarType.success}
                    onDismiss={() => setSaveStatus({ type: '', message: '' })}
                >
                    {saveStatus.message}
                </MessageBar>
            )}

            {availableModels.groq && (
                <TextField
                    label="Groq API Key"
                    value={formData.groqApiKey}
                    onChange={handleInputChange('groqApiKey')}
                    type="password"
                    canRevealPassword
                    description="Get your API key from https://console.groq.com/keys"
                />
            )}

            {availableModels.deepseek && (
                <TextField
                    label="DeepSeek API Key"
                    value={formData.deepseekApiKey}
                    onChange={handleInputChange('deepseekApiKey')}
                    type="password"
                    canRevealPassword
                    description="Get your API key from https://platform.deepseek.com/"
                />
            )}

            {availableModels.openai && (
                <TextField
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={handleInputChange('openaiApiKey')}
                    type="password"
                    canRevealPassword
                    description="Get your API key from https://platform.openai.com/api-keys"
                />
            )}

            <Stack horizontal tokens={{ childrenGap: 10 }}>
                <PrimaryButton
                    text="Save API Keys"
                    onClick={handleSave}
                    disabled={isSaving}
                />
                {isSaving && <Spinner size={SpinnerSize.small} />}
            </Stack>

            <MessageBar messageBarType={MessageBarType.info}>
                <Text block>Note: Your API keys are stored locally in your browser's secure storage and are only used to make direct requests to the respective API providers.</Text>
            </MessageBar>
        </Stack>
    );
};

export default ApiKeysSettings;

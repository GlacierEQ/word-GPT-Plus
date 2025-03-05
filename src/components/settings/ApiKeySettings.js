import React, { useState } from 'react';
import {
    Stack,
    TextField,
    Text,
    MessageBar,
    MessageBarType,
    Link,
    DefaultButton,
    Dialog,
    DialogType,
    DialogFooter,
    PrimaryButton
} from '@fluentui/react';
import { useSettings } from '../../hooks/useSettings';

/**
 * Component for managing API keys
 */
export default function ApiKeySettings() {
    const { settings, updateSetting } = useSettings();
    const [apiKeys, setApiKeys] = useState({
        openai: settings.apiKeys?.openai || '',
        azure: settings.apiKeys?.azure || '',
        azureEndpoint: settings.apiKeys?.azureEndpoint || '',
        gemini: settings.apiKeys?.gemini || '',
        groq: settings.apiKeys?.groq || '',
        anthropic: settings.apiKeys?.anthropic || '',
    });
    const [azureDetails, setAzureDetails] = useState({
        resourceName: settings.azure?.resourceName || '',
        deploymentId: settings.azure?.deploymentId || '',
        apiVersion: settings.azure?.apiVersion || '2023-05-15',
    });
    const [showAzureHelp, setShowAzureHelp] = useState(false);

    // Handle API key changes
    const handleApiKeyChange = (provider, value) => {
        setApiKeys({
            ...apiKeys,
            [provider]: value
        });

        // Update settings storage
        updateSetting(`apiKeys.${provider}`, value);
    };

    // Handle Azure details changes
    const handleAzureDetailsChange = (field, value) => {
        setAzureDetails({
            ...azureDetails,
            [field]: value
        });

        // Update settings storage
        updateSetting(`azure.${field}`, value);
    };

    // Clear all API keys after confirmation
    const handleClearAllKeys = () => {
        const providers = ['openai', 'azure', 'gemini', 'groq', 'anthropic'];
        
        // Clear keys from state
        const clearedKeys = { ...apiKeys };
        providers.forEach(provider => {
            clearedKeys[provider] = '';
        });
        setApiKeys(clearedKeys);
        
        // Clear keys from settings
        providers.forEach(provider => {
            updateSetting(`apiKeys.${provider}`, '');
        });
    };

    // Azure help dialog
    const azureHelpDialog = (
        <Dialog
            hidden={!showAzureHelp}
            onDismiss={() => setShowAzureHelp(false)}
            dialogContentProps={{
                type: DialogType.normal,
                title: 'Azure OpenAI Setup Help',
                subText: 'How to set up Azure OpenAI Service'
            }}
            minWidth={600}
            maxWidth={800}
        >
            <Stack tokens={{ childrenGap: 15 }}>
                <Text>Follow these steps to set up Azure OpenAI Service:</Text>
                
                <Stack tokens={{ childrenGap: 8 }}>
                    <Text>1. Create an Azure OpenAI resource in Azure Portal</Text>
                    <Text>2. Deploy a model and note the deployment ID</Text>
                    <Text>3. Get your API key and endpoint from the resource page</Text>
                    <Text>4. Enter these details in the fields provided</Text>
                </Stack>
                
                <Text>Your Azure endpoint will look like:</Text>
                <Text style={{ fontFamily: 'monospace' }}>
                    https://YOUR_RESOURCE_NAME.openai.azure.com/
                </Text>
                
                <MessageBar messageBarType={MessageBarType.warning}>
                    Note that you need separate Azure OpenAI access approval before using this service.
                </MessageBar>
                
                <Link href="https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource" target="_blank">
                    Azure OpenAI Documentation
                </Link>
            </Stack>
            
            <DialogFooter>
                <DefaultButton text="Close" onClick={() => setShowAzureHelp(false)} />
            </DialogFooter>
        </Dialog>
    );

    return (
        <Stack tokens={{ childrenGap: 15 }} className="api-key-settings">
            <Text variant="large">API Keys</Text>
            <Text>Enter your API keys for the services you want to use. API keys are stored locally in your browser.</Text>
            
            <Stack tokens={{ childrenGap: 15 }}>
                {/* OpenAI API Key */}
                <TextField
                    label="OpenAI API Key"
                    value={apiKeys.openai}
                    onChange={(_, value) => handleApiKeyChange('openai', value)}
                    placeholder="sk-..."
                    type="password"
                    canRevealPassword
                />
                <Link href="https://platform.openai.com/api-keys" target="_blank">
                    Get an OpenAI API key
                </Link>
                
                {/* Azure OpenAI */}
                <Stack tokens={{ childrenGap: 10 }}>
                    <TextField
                        label="Azure OpenAI API Key"
                        value={apiKeys.azure}
                        onChange={(_, value) => handleApiKeyChange('azure', value)}
                        placeholder="Azure OpenAI API Key"
                        type="password"
                        canRevealPassword
                    />
                    
                    <TextField
                        label="Azure OpenAI Endpoint"
                        value={apiKeys.azureEndpoint}
                        onChange={(_, value) => handleApiKeyChange('azureEndpoint', value)}
                        placeholder="https://your-resource.openai.azure.com/"
                    />
                    
                    <Stack horizontal tokens={{ childrenGap: 10 }}>
                        <Stack.Item grow={1}>
                            <TextField
                                label="Resource Name"
                                value={azureDetails.resourceName}
                                onChange={(_, value) => handleAzureDetailsChange('resourceName', value)}
                                placeholder="your-resource-name"
                            />
                        </Stack.Item>
                        <Stack.Item grow={1}>
                            <TextField
                                label="Deployment ID"
                                value={azureDetails.deploymentId}
                                onChange={(_, value) => handleAzureDetailsChange('deploymentId', value)}
                                placeholder="gpt-4"
                            />
                        </Stack.Item>
                    </Stack>
                    
                    <Link onClick={() => setShowAzureHelp(true)}>
                        Help with Azure OpenAI setup
                    </Link>
                </Stack>
                
                {/* Google Gemini API Key */}
                <TextField
                    label="Google Gemini API Key"
                    value={apiKeys.gemini}
                    onChange={(_, value) => handleApiKeyChange('gemini', value)}
                    placeholder="AIza..."
                    type="password"
                    canRevealPassword
                />
                <Link href="https://aistudio.google.com/app/apikey" target="_blank">
                    Get a Google Gemini API key
                </Link>
                
                {/* Groq API Key */}
                <TextField
                    label="Groq API Key"
                    value={apiKeys.groq}
                    onChange={(_, value) => handleApiKeyChange('groq', value)}
                    placeholder="gsk_..."
                    type="password"
                    canRevealPassword
                />
                <Link href="https://console.groq.com/keys" target="_blank">
                    Get a Groq API key
                </Link>
                
                {/* Anthropic API Key */}
                <TextField
                    label="Anthropic API Key (Claude)"
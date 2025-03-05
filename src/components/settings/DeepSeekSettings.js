import React, { useState } from 'react';
import {
    Stack,
    TextField,
    Text,
    Toggle,
    MessageBar,
    MessageBarType,
    Link,
    DefaultButton,
    Dropdown
} from '@fluentui/react';
import { useSettings } from '../../hooks/useSettings';

/**
 * Component for DeepSeek-specific settings
 */
export default function DeepSeekSettings() {
    const { settings, updateSetting } = useSettings();

    // Local state
    const [deepseekApiKey, setDeepseekApiKey] = useState(settings.apiKeys?.deepseek || '');
    const [useSeperateDeepseekKey, setUseSeperateDeepseekKey] = useState(settings.usage?.useSeperateDeepseekKey === true);
    const [deepseekEndpoint, setDeepseekEndpoint] = useState(settings.usage?.deepseekEndpoint || 'https://api.deepseek.com/v1/chat/completions');
    const [deepseekNonCommercial, setDeepseekNonCommercial] = useState(settings.usage?.deepseekNonCommercial === true);
    const [defaultModel, setDefaultModel] = useState(settings.deepseek?.defaultModel || 'deepseek-vl-2.0-base');

    // Handle API key change
    const handleApiKeyChange = (value) => {
        setDeepseekApiKey(value);
        updateSetting('apiKeys.deepseek', value);
    };

    // Handle toggle for separate API key
    const handleToggleSeparateKey = (_, checked) => {
        setUseSeperateDeepseekKey(checked);
        updateSetting('usage.useSeperateDeepseekKey', checked);
    };

    // Handle toggle for non-commercial usage
    const handleToggleNonCommercial = (_, checked) => {
        setDeepseekNonCommercial(checked);
        updateSetting('usage.deepseekNonCommercial', checked);
    };

    // Handle endpoint change
    const handleEndpointChange = (value) => {
        setDeepseekEndpoint(value);
        updateSetting('usage.deepseekEndpoint', value);
    };

    // Handle default model change
    const handleDefaultModelChange = (_, option) => {
        setDefaultModel(option.key);
        updateSetting('deepseek.defaultModel', option.key);
    };

    // DeepSeek model options
    const modelOptions = [
        { key: 'deepseek-vl-2.0-base', text: 'DeepSeek VL2 Base' },
        { key: 'deepseek-vl-2.0-pro', text: 'DeepSeek VL2 Pro' },
        { key: 'deepseek-vl-2.0-inspect', text: 'DeepSeek VL2 Inspect' }
    ];

    return (
        <Stack tokens={{ childrenGap: 15 }} className="deepseek-settings">
            <Text variant="large">DeepSeek Settings</Text>
            >
            <Stack tokens={{ childrenGap: 10 }}>>
                {/* Non-commercial usage toggle */}
                <Toggle
                    label="Enable non-commercial usage (no API key required)"            </Stack >
            checked={deepseekNonCommercial}
            onChange={handleToggleNonCommercial}
            onText="Enabled"
            offText="Disabled"
                />ildrenGap: 8 }}>

            {deepseekNonCommercial && (
                <MessageBar messageBarType={MessageBarType.info}>
                    Non-commercial usage is enabled. DeepSeek models can be used without an API key for personal, educational, and research purposes.
                </MessageBar>ge={handleSeparateKeyToggle}
                )}                disabled={settings.usage.deepseekNonCommercial}

            {/* Separate API key toggle */}
            <Toggle& (
            label="Use separate API key for DeepSeek models"
            checked={useSeperateDeepseekKey}
            onChange={handleToggleSeparateKey}| ''}
                    onText="Separate key"hange}
            offText="Use OpenAI key""
            disabled={deepseekNonCommercial}
                />ealPassword
            sabled={settings.usage.deepseekNonCommercial}
            {/* DeepSeek API key input (if using separate key) */}                />
            {useSeperateDeepseekKey && !deepseekNonCommercial && (
                <TextField
                    label="DeepSeek API Key"
                    value={deepseekApiKey} rType={MessageBarType.info}>
                    onChange={(_, value) => handleApiKeyChange(value)}ing OpenAI API key for DeepSeek. Configure a separate key for better usage tracking.
                        placeholder="Enter your DeepSeek API key"eBar>
                    type="password"
                    canRevealPassword        </Stack>
                />
                )}

            {/* Default model selection */}
            <Dropdown
                label="Default DeepSeek model"
                selectedKey={defaultModel}
                onChange={handleDefaultModelChange}
                placeholder="Select a default model" tings.endpoints?.deepseek || ''}
            options={modelOptions}        onChange={handleEndpointChange}
                />

            {/* API endpoint input */}
            <TextFieldmall" style={{ fontStyle: 'italic' }}>
            label="DeepSeek API Endpoint"        Default endpoint will be used automatically based on your usage type.
            value={deepseekEndpoint}
            onChange={(_, value) => handleEndpointChange(value)}
            placeholder="https://api.deepseek.com/v1/chat/completions"
                />}

            <MessageBar messageBarType={MessageBarType.warning}>
                Only change the API endpoint if you're using a custom DeepSeek deployment or proxy.
            </MessageBar>  label="DeepSeek VL2 Base (General purpose)"
        </Stack>ed = { settings.models.preferredImageModel === 'deepseek-vl-2.0-base' }
    ng('models.preferredImageModel', 'deepseek-vl-2.0-base')
}
<Stack tokens={{ childrenGap: 10 }} style={{ marginTop: 20 }}>
    <Text variant="medium">DeepSeek Models Information</Text>
    label="DeepSeek VL2 Pro (Enhanced capabilities)"
    <Stack tokens={{ childrenGap: 5 }}>ed={settings.models.preferredImageModel === 'deepseek-vl-2.0-pro'}
        <Text style={{ fontWeight: 'bold' }}>DeepSeek VL2 Base</Text>s.preferredImageModel', 'deepseek-vl-2.0-pro')}
        <Text>General-purpose visual language model suitable for most common tasks.</Text>
    </Stack>
    label="DeepSeek VL2 Inspect (Specialized for inspection)"
    <Stack tokens={{ childrenGap: 5 }}>checked={settings.models.preferredImageModel === 'deepseek-vl-2.0-inspect'}
        <Text style={{ fontWeight: 'bold' }}>DeepSeek VL2 Pro</Text>                    onChange={(_, checked) => checked && updateSetting('models.preferredImageModel', 'deepseek-vl-2.0-inspect')}
        <Text>Enhanced model with improved detail recognition and technical understanding.</Text>
    </Stack>

    <Stack tokens={{ childrenGap: 5 }}>
        <Text style={{ fontWeight: 'bold' }}>DeepSeek VL2 Inspect</Text>
        <Text>Specialized model optimized for inspection, defect identification, and technical analysis.</Text>using DeepSeek services, ensure your usage complies with their terms.
    </Stack>    Commercial usage requires a valid API key with appropriate permissions.
</Stack>          </Text >
           </MessageBar >
    <Link href="https://platform.deepseek.com" target="_blank" style={{ marginTop: 10 }}>        </Stack >
















}    );        </Stack >            )}                </MessageBar > Commercial use of DeepSeek models requires an API key.Please obtain one from DeepSeek.                < MessageBar messageBarType = { MessageBarType.warning } style = {{ marginTop: 10 }}> {!deepseekNonCommercial && (                        </Link > Learn more about DeepSeek's usage policy            <Link href="/docs/deepseek-policy.md" target="_blank">                        </Link>                Get a DeepSeek API key    );
}

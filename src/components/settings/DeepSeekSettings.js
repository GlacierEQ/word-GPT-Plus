import React from 'react';
import {
    TextField,
    Toggle,
    MessageBar,
    MessageBarType,
    Stack,
    Text,
    Link,
    Checkbox
} from '@fluentui/react';
import { useSettings } from '../../hooks/useSettings';

/**
 * Component for DeepSeek-specific settings
 */
export default function DeepSeekSettings() {
    const { settings, updateSetting } = useSettings();

    const handleEndpointChange = (_, value) => {
        updateSetting('endpoints.deepseek', value);
    };

    const handleNonCommercialToggle = (_, checked) => {
        updateSetting('usage.deepseekNonCommercial', checked);
    };

    const handleSeparateKeyToggle = (_, checked) => {
        updateSetting('usage.useSeperateDeepseekKey', checked);
    };

    const handleApiKeyChange = (_, value) => {
        updateSetting('apiKeys.deepseek', value);
    };

    return (
        <Stack tokens={{ childrenGap: 12 }} className="deepseek-settings">
            <Text variant="large">DeepSeek Settings</Text>

            {/* Non-commercial usage section */}
            <Stack tokens={{ childrenGap: 8 }}>
                <Text variant="mediumPlus">Usage Type</Text>
                <Toggle
                    label="Enable free non-commercial usage"
                    checked={settings.usage.deepseekNonCommercial}
                    onChange={handleNonCommercialToggle}
                    inlineLabel
                />

                {settings.usage.deepseekNonCommercial && (
                    <MessageBar messageBarType={MessageBarType.info}>
                        <Stack tokens={{ childrenGap: 8 }}>
                            <Text>
                                Non-commercial usage enables free access to DeepSeek models for:
                                <ul>
                                    <li>Personal projects</li>
                                    <li>Academic research</li>
                                    <li>Educational purposes</li>
                                    <li>Open-source non-commercial applications</li>
                                </ul>
                            </Text>
                            <Text>
                                <strong>Note:</strong> Commercial use requires an API key.
                            </Text>
                            <Link href="/docs/deepseek-policy.md" target="_blank">
                                Learn more about DeepSeek usage policy
                            </Link>
                        </Stack>
                    </MessageBar>
                )}
            </Stack>

            {/* Commercial usage section */}
            {!settings.usage.deepseekNonCommercial && (
                <Stack tokens={{ childrenGap: 8 }}>
                    <Text variant="mediumPlus">API Configuration</Text>
                    <Toggle
                        label="Use separate API key for DeepSeek"
                        checked={settings.usage.useSeperateDeepseekKey}
                        onChange={handleSeparateKeyToggle}
                        disabled={settings.usage.deepseekNonCommercial}
                    />

                    {settings.usage.useSeperateDeepseekKey && (
                        <TextField
                            label="DeepSeek API Key"
                            value={settings.apiKeys.deepseek || ''}
                            onChange={handleApiKeyChange}
                            placeholder="deepseek-..."
                            type="password"
                            canRevealPassword
                            disabled={settings.usage.deepseekNonCommercial}
                        />
                    )}

                    {!settings.usage.useSeperateDeepseekKey && (
                        <MessageBar messageBarType={MessageBarType.info}>
                            Using OpenAI API key for DeepSeek. Configure a separate key for better usage tracking.
                        </MessageBar>
                    )}
                </Stack>
            )}

            {/* Advanced settings */}
            <Stack tokens={{ childrenGap: 8 }}>
                <Text variant="mediumPlus">Advanced Settings</Text>
                <TextField
                    label="DeepSeek API Endpoint"
                    value={settings.endpoints?.deepseek || ''}
                    onChange={handleEndpointChange}
                    placeholder="https://api.deepseek.com/v1"
                />

                <Text variant="small" style={{ fontStyle: 'italic' }}>
                    Default endpoint will be used automatically based on your usage type.
                </Text>
            </Stack>

            {/* Model preferences */}
            <Stack tokens={{ childrenGap: 8 }}>
                <Text variant="mediumPlus">DeepSeek Models</Text>
                <Checkbox
                    label="DeepSeek VL2 Base (General purpose)"
                    checked={settings.models.preferredImageModel === 'deepseek-vl-2.0-base'}
                    onChange={(_, checked) => checked && updateSetting('models.preferredImageModel', 'deepseek-vl-2.0-base')}
                />
                <Checkbox
                    label="DeepSeek VL2 Pro (Enhanced capabilities)"
                    checked={settings.models.preferredImageModel === 'deepseek-vl-2.0-pro'}
                    onChange={(_, checked) => checked && updateSetting('models.preferredImageModel', 'deepseek-vl-2.0-pro')}
                />
                <Checkbox
                    label="DeepSeek VL2 Inspect (Specialized for inspection)"
                    checked={settings.models.preferredImageModel === 'deepseek-vl-2.0-inspect'}
                    onChange={(_, checked) => checked && updateSetting('models.preferredImageModel', 'deepseek-vl-2.0-inspect')}
                />
            </Stack>

            <MessageBar messageBarType={MessageBarType.warning}>
                <Text>
                    When using DeepSeek services, ensure your usage complies with their terms.
                    Commercial usage requires a valid API key with appropriate permissions.
                </Text>
            </MessageBar>
        </Stack>
    );
}

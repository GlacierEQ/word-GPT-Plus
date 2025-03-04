import React, { useState } from 'react';
import {
    Stack,
    Toggle,
    Text,
    DefaultButton,
    ProgressIndicator,
    MessageBar,
    MessageBarType,
    Dialog,
    DialogType,
    DialogFooter,
    PrimaryButton
} from '@fluentui/react';
import { useSettings } from '../../hooks/useSettings';
import { getMemoryStats, clearAllMemories } from '../../utils/memorySystem';

/**
 * Component for managing memory system settings
 */
export default function MemorySettings() {
    const { settings, updateSetting } = useSettings();
    const [memoryStats, setMemoryStats] = useState(() => getMemoryStats());
    const [isClearing, setIsClearing] = useState(false);
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [clearStatus, setClearStatus] = useState(null);

    // Toggle memory system
    const handleMemoryToggle = (_, checked) => {
        updateSetting('features.memoryEnabled', checked);
    };

    // Toggle contextual awareness
    const handleContextToggle = (_, checked) => {
        updateSetting('features.contextualAwareness', checked);
    };

    // Handle clearing memory
    const handleClearMemory = async () => {
        setIsClearing(true);
        setClearStatus(null);

        try {
            await clearAllMemories();
            setMemoryStats(getMemoryStats());
            setClearStatus({
                type: 'success',
                message: 'Memory successfully cleared'
            });
        } catch (error) {
            console.error('Error clearing memory:', error);
            setClearStatus({
                type: 'error',
                message: `Failed to clear memory: ${error.message}`
            });
        } finally {
            setIsClearing(false);
            setShowClearDialog(false);
        }
    };

    // Calculate memory usage percentage
    const getMemoryUsagePercentage = () => {
        if (!memoryStats) return 0;
        const maxMemories = 1000; // Hypothetical max
        return Math.min(100, (memoryStats.totalMemories / maxMemories) * 100);
    };

    return (
        <Stack tokens={{ childrenGap: 15 }} className="memory-settings">
            <Text variant="large">Memory System Settings</Text>

            {/* Toggle memory system */}
            <Toggle
                label="Enable long-term memory"
                checked={settings.features.memoryEnabled}
                onChange={handleMemoryToggle}
                inlineLabel
            />

            {settings.features.memoryEnabled && (
                <MessageBar messageBarType={MessageBarType.info}>
                    Long-term memory allows Word-GPT-Plus to remember context across sessions,
                    understand your preferences, and provide more personalized responses.
                </MessageBar>
            )}

            {/* Toggle contextual awareness */}
            <Toggle
                label="Enable contextual awareness"
                checked={settings.features.contextualAwareness}
                onChange={handleContextToggle}
                inlineLabel
                disabled={!settings.features.memoryEnabled}
            />

            {settings.features.contextualAwareness && settings.features.memoryEnabled && (
                <MessageBar messageBarType={MessageBarType.info}>
                    Contextual awareness allows the AI to analyze your document context
                    for more relevant responses that match your document's style and terminology.
                </MessageBar>
            )}

            {/* Memory stats */}
            {settings.features.memoryEnabled && memoryStats && (
                <Stack tokens={{ childrenGap: 10 }} className="memory-stats-panel">
                    <Text variant="mediumPlus">Memory Statistics</Text>

                    <Stack tokens={{ childrenGap: 5 }}>
                        <Text>Total memories stored: {memoryStats.totalMemories}</Text>
                        <Text>Total interactions: {memoryStats.totalInteractions}</Text>
                        <Text>Used memory entries: {getMemoryUsagePercentage().toFixed(1)}%</Text>

                        <ProgressIndicator
                            percentComplete={getMemoryUsagePercentage() / 100}
                            barHeight={5}
                            styles={{
                                progressBar: {
                                    backgroundColor: getMemoryUsagePercentage() > 80 ? '#d13438' : '#0078d4'
                                }
                            }}
                        />
                    </Stack>

                    {/* Clear memory button */}
                    <DefaultButton
                        text="Clear all memories"
                        onClick={() => setShowClearDialog(true)}
                        disabled={isClearing || memoryStats.totalMemories === 0}
                        iconProps={{ iconName: 'Delete' }}
                        className="clear-memory-btn"
                    />

                    {clearStatus && (
                        <MessageBar
                            messageBarType={clearStatus.type === 'success' ? MessageBarType.success : MessageBarType.error}
                            onDismiss={() => setClearStatus(null)}
                        >
                            {clearStatus.message}
                        </MessageBar>
                    )}
                </Stack>
            )}

            {/* Memory privacy notice */}
            <Stack className="memory-privacy">
                <Text variant="mediumPlus">Privacy Information</Text>
                <Text variant="small">
                    All memory is stored locally in your browser. No data is sent to external servers
                    beyond what's needed for AI processing. Clearing browser data will also clear memory.
                </Text>
            </Stack>

            {/* Confirmation dialog */}
            <Dialog
                hidden={!showClearDialog}
                onDismiss={() => setShowClearDialog(false)}
                dialogContentProps={{
                    type: DialogType.normal,
                    title: 'Clear Memory',
                    subText: 'Are you sure you want to clear all memories? This action cannot be undone and will reset all learned preferences and context.'
                }}
            >
                <DialogFooter>
                    <PrimaryButton
                        onClick={handleClearMemory}
                        text="Clear Memory"
                        disabled={isClearing}
                    />
                    <DefaultButton
                        onClick={() => setShowClearDialog(false)}
                        text="Cancel"
                    />
                </DialogFooter>
            </Dialog>
        </Stack>
    );
}

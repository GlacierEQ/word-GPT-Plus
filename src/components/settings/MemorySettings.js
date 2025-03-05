import React, { useState, useEffect } from 'react';
import {
    Stack,
    Toggle,
    Text,
    DefaultButton,
    PrimaryButton,
    Dialog,
    DialogType,
    DialogFooter,
    Slider,
    Spinner,
    SpinnerSize,
    MessageBar,
    MessageBarType
} from '@fluentui/react';
import { useSettings } from '../../hooks/useSettings';
import { getMemoryStatistics, clearAllMemories } from '../../services/memory/memorySystem';

/**
 * Component for memory system settings
 */
export default function MemorySettings() {
    const { settings, updateSetting } = useSettings();

    // Memory settings
    const [memoryEnabled, setMemoryEnabled] = useState(settings.memory?.enabled !== false);
    const [memoryLimit, setMemoryLimit] = useState(settings.memory?.maxItems || 1000);
    const [promptIncludeCount, setPromptIncludeCount] = useState(settings.memory?.promptIncludeCount || 3);
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [memoryStats, setMemoryStats] = useState(null);
    const [clearSuccess, setClearSuccess] = useState(false);

    // Load memory statistics
    useEffect(() => {
        if (memoryEnabled) {
            setIsLoadingStats(true);
            try {
                const stats = getMemoryStatistics();
                setMemoryStats(stats);
            } catch (error) {
                console.error('Error loading memory statistics:', error);
            } finally {
                setIsLoadingStats(false);
            }
        }
    }, [memoryEnabled, clearSuccess]);

    // Handle memory toggle
    const handleToggleMemory = (_, checked) => {
        setMemoryEnabled(checked);
        updateSetting('memory.enabled', checked);
    };

    // Handle memory limit change
    const handleMemoryLimitChange = (value) => {
        setMemoryLimit(value);
        updateSetting('memory.maxItems', value);
    };

    // Handle prompt count change
    const handlePromptIncludeCountChange = (value) => {
        setPromptIncludeCount(value);
        updateSetting('memory.promptIncludeCount', value);
    };

    // Handle clear all memories
    const handleClearAllMemories = () => {
        try {
            clearAllMemories();
            setShowClearDialog(false);
            setClearSuccess(true);

            // Reset success message after 3 seconds
            setTimeout(() => {
                setClearSuccess(false);
            }, 3000);
        } catch (error) {
            console.error('Error clearing memories:', error);
        }
    };

    // Clear memories confirmation dialog
    const clearDialog = (
        <Dialog
            hidden={!showClearDialog}
            onDismiss={() => setShowClearDialog(false)}
            dialogContentProps={{
                type: DialogType.normal,
                title: 'Clear All Memories',
                subText: 'Are you sure you want to clear all stored memories? This cannot be undone.'
            }}
        >
            <DialogFooter>
                <PrimaryButton
                    text="Clear All"
                    onClick={handleClearAllMemories}
                />
                <DefaultButton
                    text="Cancel"
                    onClick={() => setShowClearDialog(false)}
                />
            </DialogFooter>
        </Dialog>
    );

    return (
        <Stack tokens={{ childrenGap: 15 }} className="memory-settings">
            <Text variant="large">Memory System Settings</Text>

            <Stack tokens={{ childrenGap: 10 }}>
                {/* Memory toggle */}
                <Toggle
                    label="Enable long-term memory"
                    checked={memoryEnabled}
                    onChange={handleToggleMemory}
                    onText="Enabled"
                    offText="Disabled"
                />

                {memoryEnabled && (
                    <MessageBar messageBarType={MessageBarType.info}>
                        Long-term memory helps the AI remember your past interactions and preferences, creating more personalized responses over time.
                    </MessageBar>
                )}

                {/* Memory limit slider */}
                {memoryEnabled && (
                    <Stack tokens={{ childrenGap: 5 }}>
                        <Text>Maximum memory items</Text>
                        <Slider
                            min={100}
                            max={5000}
                            step={100}
                            value={memoryLimit}
                            showValue
                            onChange={handleMemoryLimitChange}
                        />
                        <Text variant="small" style={{ fontStyle: 'italic' }}>
                            Higher values use more storage but allow more context to be remembered.
                        </Text>
                    </Stack>
                )}

                {/* Prompt inclusion count */}
                {memoryEnabled && (
                    <Stack tokens={{ childrenGap: 5 }}>
                        <Text>Memories to include in prompts</Text>
                        <Slider
                            min={0}
                            max={10}
                            step={1}
                            value={promptIncludeCount}
                            showValue
                            onChange={handlePromptIncludeCountChange}
                        />
                        <Text variant="small" style={{ fontStyle: 'italic' }}>
                            Higher values provide more context but use more tokens.
                        </Text>
                    </Stack>
                )}

                {/* Memory statistics */}
                {memoryEnabled && (
                    <Stack tokens={{ childrenGap: 10 }} style={{ marginTop: 10 }}>
                        <Text variant="mediumPlus">Memory Statistics</Text>

                        {isLoadingStats ? (
                            <Spinner size={SpinnerSize.small} label="Loading memory statistics..." />
                        ) : memoryStats ? (
                            <Stack tokens={{ childrenGap: 5 }} className="memory-stats">
                                <Text>Total memories: {memoryStats.count}</Text>
                                <Text>Total interactions: {memoryStats.systemStats.totalInteractions}</Text>
                                {memoryStats.count > 0 && (
                                    <>
                                        <Text>
                                            Memory types: {Object.entries(memoryStats.types)
                                                .map(([type, count]) => `${type} (${count})`)
                                                .join(', ')}
                                        </Text>
                                        <Text>
                                            Most used tags: {Object.entries(memoryStats.tags)
                                                .sort((a, b) => b[1] - a[1])
                                                .slice(0, 5)
                                                .map(([tag, count]) => `${tag} (${count})`)
                                                .join(', ')}
                                        </Text>
                                        {memoryStats.timeStats.newest && (
                                            <Text>
                                                Last memory: {new Date(memoryStats.timeStats.newest).toLocaleDateString()}
                                            </Text>
                                        )}
                                    </>
                                )}
                            </Stack>
                        ) : (
                            <Text>No memory statistics available.</Text>
                        )}
                    </Stack>
                )}

                {/* Clear all memories button */}
                {memoryEnabled && (
                    <DefaultButton
                        text="Clear All Memories"
                        onClick={() => setShowClearDialog(true)}
                        disabled={!memoryStats || memoryStats.count === 0}
                        style={{ marginTop: 10, alignSelf: 'flex-start' }}
                    />
                )}

                {/* Success message */}
                {clearSuccess && (
                    <MessageBar messageBarType={MessageBarType.success}>
                        All memories have been cleared successfully.
                    </MessageBar>
                )}
            </Stack>

            {/* Memory disabled message */}
            {!memoryEnabled && (
                <MessageBar messageBarType={MessageBarType.warning}>
                    Memory system is disabled. The AI will not remember past interactions between sessions.
                </MessageBar>
            )}

            {clearDialog}
        </Stack>
    );
}

import React, { useState } from 'react';
import {
    Stack,
    Text,
    Image,
    IconButton,
    Dialog,
    DialogType,
    DialogFooter,
    PrimaryButton,
    DefaultButton,
    Panel,
    PanelType,
    TextField,
    Pivot,
    PivotItem
} from '@fluentui/react';
import ApiKeySettings from '../settings/ApiKeySettings';
import DeepSeekSettings from '../settings/DeepSeekSettings';
import MemorySettings from '../settings/MemorySettings';
import GeneralSettings from '../settings/GeneralSettings';
import { useSettings } from '../../hooks/useSettings';

/**
 * Header component for the application
 */
export default function AppHeader({ isOfficeInitialized }) {
    const { settings, exportSettings, importSettings, resetSettings } = useSettings();

    const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
    const [currentSettingsTab, setCurrentSettingsTab] = useState('apiKeys');
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportedSettings, setExportedSettings] = useState('');
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [importText, setImportText] = useState('');
    const [importError, setImportError] = useState('');

    // Open settings panel
    const openSettingsPanel = () => {
        setSettingsPanelOpen(true);
    };

    // Close settings panel
    const closeSettingsPanel = () => {
        setSettingsPanelOpen(false);
    };

    // Handle settings tab change
    const handleSettingsTabChange = (item) => {
        setCurrentSettingsTab(item.props.itemKey);
    };

    // Handle export settings
    const handleExportSettings = () => {
        try {
            const exported = exportSettings();
            setExportedSettings(exported);
            setShowExportDialog(true);
        } catch (err) {
            console.error('Error exporting settings:', err);
        }
    };

    // Handle import settings
    const handleImportSettings = () => {
        try {
            setImportError('');

            if (!importText.trim()) {
                setImportError('Please enter settings to import');
                return;
            }

            const success = importSettings(importText);
            if (success) {
                setShowImportDialog(false);
                setImportText('');
            } else {
                setImportError('Invalid settings format');
            }
        } catch (err) {
            setImportError(`Error importing settings: ${err.message}`);
        }
    };

    // Render reset confirmation dialog
    const resetDialog = (
        <Dialog
            hidden={!showResetDialog}
            onDismiss={() => setShowResetDialog(false)}
            dialogContentProps={{
                type: DialogType.normal,
                title: 'Reset Settings',
                subText: 'Are you sure you want to reset all settings to defaults? This cannot be undone.'
            }}
        >
            <DialogFooter>
                <PrimaryButton
                    text="Reset"
                    onClick={() => {
                        resetSettings();
                        setShowResetDialog(false);
                    }}
                />
                <DefaultButton
                    text="Cancel"
                    onClick={() => setShowResetDialog(false)}
                />
            </DialogFooter>
        </Dialog>
    );

    // Render export settings dialog
    const exportDialog = (
        <Dialog
            hidden={!showExportDialog}
            onDismiss={() => setShowExportDialog(false)}
            dialogContentProps={{
                type: DialogType.normal,
                title: 'Export Settings',
                subText: 'Your settings have been exported. Copy the JSON below.'
            }}
            minWidth={500}
        >
            <TextField
                multiline
                rows={10}
                value={exportedSettings}
                readOnly
            />
            <DialogFooter>
                <PrimaryButton
                    text="Copy to Clipboard"
                    onClick={() => {
                        navigator.clipboard.writeText(exportedSettings);
                    }}
                />
                <DefaultButton
                    text="Close"
                    onClick={() => setShowExportDialog(false)}
                />
            </DialogFooter>
        </Dialog>
    );

    // Render import settings dialog
    const importDialog = (
        <Dialog
            hidden={!showImportDialog}
            onDismiss={() => setShowImportDialog(false)}
            dialogContentProps={{
                type: DialogType.normal,
                title: 'Import Settings',
                subText: 'Paste your settings JSON below.'
            }}
            minWidth={500}
        >
            <TextField
                multiline
                rows={10}
                value={importText}
                onChange={(_, newValue) => setImportText(newValue)}
                errorMessage={importError}
            />
            <DialogFooter>
                <PrimaryButton
                    text="Import"
                    onClick={handleImportSettings}
                />
                <DefaultButton
                    text="Cancel"
                    onClick={() => setShowImportDialog(false)}
                />
            </DialogFooter>
        </Dialog>
    );

    // Render settings panel
    const settingsPanel = (
        <Panel
            isOpen={settingsPanelOpen}
            onDismiss={closeSettingsPanel}
            headerText="Settings"
            type={PanelType.medium}
            closeButtonAriaLabel="Close"
            onRenderFooterContent={() => (
                <Stack horizontal tokens={{ childrenGap: 10 }}>
                    <DefaultButton
                        text="Export Settings"
                        onClick={handleExportSettings}
                    />
                    <DefaultButton
                        text="Import Settings"
                        onClick={() => {
                            setImportText('');
                            setImportError('');
                            setShowImportDialog(true);
                        }}
                    />
                    <DefaultButton
                        text="Reset to Defaults"
                        onClick={() => setShowResetDialog(true)}
                    />
                </Stack>
            )}
        >
            <Pivot
                selectedKey={currentSettingsTab}
                onLinkClick={handleSettingsTabChange}
            >
                <PivotItem headerText="API Keys" itemKey="apiKeys">
                    <ApiKeySettings />
                </PivotItem>
                <PivotItem headerText="DeepSeek" itemKey="deepseek">
                    <DeepSeekSettings />
                </PivotItem>
                <PivotItem headerText="Memory" itemKey="memory">
                    <MemorySettings />
                </PivotItem>
                <PivotItem headerText="General" itemKey="general">
                    <GeneralSettings />
                </PivotItem>
            </Pivot>
        </Panel>
    );

    return (
        <Stack
            horizontal
            verticalAlign="center"
            horizontalAlign="space-between"
            className="app-header"
            tokens={{ padding: '10px 0' }}
        >
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
                <Image
                    src="/assets/logo.png"
                    alt="Word-GPT-Plus"
                    width={40}
                    height={40}
                />
                <Text variant="xxLarge">Word-GPT-Plus</Text>
                {!isOfficeInitialized && (
                    <Text variant="small" style={{ color: 'red' }}>
                        (Office not initialized)
                    </Text>
                )}
            </Stack>

            <Stack horizontal tokens={{ childrenGap: 8 }}>
                <IconButton
                    iconProps={{ iconName: 'Settings' }}
                    title="Settings"
                    ariaLabel="Settings"
                    onClick={openSettingsPanel}
                />
                <IconButton
                    iconProps={{ iconName: 'Help' }}
                    title="Help"
                    ariaLabel="Help"
                    onClick={() => window.open('/docs/help.md', '_blank')}
                />
                <IconButton
                    iconProps={{ iconName: 'Info' }}
                    title="About"
                    ariaLabel="About"
                />
            </Stack>

            {settingsPanel}
            {resetDialog}
            {exportDialog}
            {importDialog}
        </Stack>
    );
}
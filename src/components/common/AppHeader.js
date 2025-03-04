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
    PanelType
} from '@fluentui/react';
import ApiKeySettings from '../settings/ApiKeySettings';
import DeepSeekSettings from '../settings/DeepSeekSettings';
import MemorySettings from '../settings/MemorySettings';
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
    const [showIm
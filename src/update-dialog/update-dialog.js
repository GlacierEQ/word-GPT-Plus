/**
 * Update Dialog
 * Provides a UI for handling the update process
 */

import React, { useState, useEffect } from 'react';
import { render } from 'react-dom';
import {
    Stack,
    DefaultButton,
    PrimaryButton,
    Text,
    ProgressIndicator,
    MessageBar,
    MessageBarType,
    Dialog,
    DialogType,
    Spinner,
    SpinnerSize
} from '@fluentui/react';

// Initialize Office.js
Office.onReady(() => {
    render(<UpdateDialog />, document.getElementById('container'));
});

/**
 * Update Dialog Component
 */
function UpdateDialog() {
    // State
    const [updateState, setUpdateState] = useState('checking'); // checking, available, downloading, installing, complete, error
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [updateInfo, setUpdateInfo] = useState(null);

    // Get dialog parameters
    useEffect(() => {
        try {
            // Get latest version info passed through dialog parameters
            const dialogInfo = Office.context.ui.messageParent;
            if (dialogInfo) {
                try {
                    const info = JSON.parse(dialogInfo);
                    setUpdateInfo(info);
                    setUpdateState('available');
                } catch (e) {
                    console.error('Failed to parse update info:', e);
                }
            }
        } catch (e) {
            console.warn('Cannot access Office dialog parameters:', e);
        }

        // If no update info provided, check for updates
        const urlParams = new URLSearchParams(window.location.search);
        const versionParam = urlParams.get('version');
        const urlParam = urlParams.get('url');

        if (versionParam && urlParam) {
            setUpdateInfo({
                currentVersion: '',
                latestVersion: versionParam,
                downloadUrl: decodeURIComponent(urlParam)
            });
            setUpdateState('available');
        } else {
            // If direct parameters aren't available, we need to wait for params via Office Dialog API
            // or we could initiate a check for updates ourselves...
            setTimeout(() => {
                if (updateState === 'checking') {
                    setError('Update information not provided. Please try again.');
                    setUpdateState('error');
                }
            }, 5000);
        }
    }, []);

    // Handle update
    const handleUpdate = async () => {
        if (!updateInfo?.downloadUrl) {
            setError('Update URL not found');
            setUpdateState('error');
            return;
        }

        try {
            setUpdateState('downloading');
            setProgress(10);

            // Start the actual update process
            const result = await window.fetch('/api/trigger-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: updateInfo.downloadUrl,
                    version: updateInfo.latestVersion
                })
            });

            // Handle update progress
            if (result.ok) {
                setProgress(50);
                setUpdateState('installing');

                // Wait for installation to complete
                const updateResult = await result.json();

                if (updateResult.success) {
                    setProgress(100);
                    setUpdateState('complete');
                } else {
                    throw new Error(updateResult.message || 'Update failed');
                }
            } else {
                throw new Error(`Server returned ${result.status}: ${result.statusText}`);
            }
        } catch (err) {
            setError(err.message || 'An error occurred during the update');
            setUpdateState('error');
        }
    };

    // Handle update later
    const handleLater = () => {
        // Close the dialog
        Office.context.ui.messageParent(JSON.stringify({
            action: 'later',
        }));
    };

    // Handle restart after update
    const handleRestart = () => {
        // Tell parent to reload
        Office.context.ui.messageParent(JSON.stringify({
            action: 'restart',
        }));
    };

    // Handle retry on error
    const handleRetry = () => {
        setUpdateState('available');
        setError(null);
    };

    // Render loading state
    if (updateState === 'checking') {
        return (
            <Stack horizontalAlign="center" verticalAlign="center" styles={{ root: { height: '100vh', padding: 20 } }}>
                <Spinner size={SpinnerSize.large} label="Checking for updates..." />
            </Stack>
        );
    }

    // Render available update
    if (updateState === 'available') {
        return (
            <Stack horizontalAlign="stretch" verticalAlign="start" styles={{ root: { padding: 20 } }}>
                <Text variant="xLarge" block>Update Available</Text>

                <Text block styles={{ root: { marginTop: 15 } }}>
                    A new version of Word-GPT-Plus is available.
                </Text>

                {updateInfo && (
                    <Stack styles={{ root: { marginTop: 15 } }}>
                        <Text block>Current version: {updateInfo.currentVersion}</Text>
                        <Text block>New version: {updateInfo.latestVersion}</Text>
                    </Stack>
                )}

                <Text block styles={{ root: { marginTop: 20 } }}>
                    Would you like to update now?
                </Text>

                <Stack horizontal tokens={{ childrenGap: 10 }} styles={{ root: { marginTop: 20 } }}>
                    <PrimaryButton text="Update Now" onClick={handleUpdate} />
                    <DefaultButton text="Later" onClick={handleLater} />
                </Stack>
            </Stack>
        );
    }

    // Render downloading/installing state
    if (updateState === 'downloading' || updateState === 'installing') {
        return (
            <Stack horizontalAlign="stretch" verticalAlign="start" styles={{ root: { padding: 20 } }}>
                <Text variant="xLarge" block>
                    {updateState === 'downloading' ? 'Downloading Update...' : 'Installing Update...'}
                </Text>

                <ProgressIndicator
                    label={updateState === 'downloading' ? 'Downloading...' : 'Installing...'}
                    description={`Please don't close this window.`}
                    percentComplete={progress / 100}
                    styles={{ root: { marginTop: 20 } }}
                />
            </Stack>
        );
    }

    // Render complete state
    if (updateState === 'complete') {
        return (
            <Stack horizontalAlign="stretch" verticalAlign="start" styles={{ root: { padding: 20 } }}>
                <Text variant="xLarge" block>Update Complete</Text>

                <MessageBar
                    messageBarType={MessageBarType.success}
                    styles={{ root: { marginTop: 15 } }}
                >
                    Word-GPT-Plus has been updated successfully.
                </MessageBar>

                <Text block styles={{ root: { marginTop: 20 } }}>
                    You need to restart the add-in for changes to take effect.
                </Text>

                <Stack horizontal tokens={{ childrenGap: 10 }} styles={{ root: { marginTop: 20 } }}>
                    <PrimaryButton text="Restart Now" onClick={handleRestart} />
                </Stack>
            </Stack>
        );
    }

    // Render error state
    if (updateState === 'error') {
        return (
            <Stack horizontalAlign="stretch" verticalAlign="start" styles={{ root: { padding: 20 } }}>
                <Text variant="xLarge" block>Update Failed</Text>

                <MessageBar
                    messageBarType={MessageBarType.error}
                    isMultiline={true}
                    styles={{ root: { marginTop: 15 } }}
                >
                    {error || 'An error occurred during the update process.'}
                </MessageBar>

                <Stack horizontal tokens={{ childrenGap: 10 }} styles={{ root: { marginTop: 20 } }}>
                    <PrimaryButton text="Retry" onClick={handleRetry} />
                    <DefaultButton text="Cancel" onClick={handleLater} />
                </Stack>
            </Stack>
        );
    }

    // Fallback
    return (
        <Stack horizontalAlign="center" verticalAlign="center" styles={{ root: { height: '100vh', padding: 20 } }}>
            <Text>Unknown update state</Text>
        </Stack>
    );
}

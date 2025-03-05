import React, { useState, useEffect } from 'react';
import { Pivot, PivotItem, Spinner, SpinnerSize, MessageBar, MessageBarType, Stack, Text } from '@fluentui/react';
import { ApiErrorProvider } from '../../context/ApiErrorContext';
import { SettingsProvider } from '../../context/SettingsContext';

// Import tabs
import BasicTab from '../../components/tabs/BasicTab';
import StructuredTab from '../../components/tabs/StructuredTab';
import PhotosTab from '../../components/tabs/PhotosTab';
import SettingsTab from '../../components/tabs/SettingsTab';

// Import app-wide styles
import '../styles/index.css';

/**
 * Main app component for Word-GPT-Plus
 */
export default function App() {
    // Office initialized state
    const [officeInitialized, setOfficeInitialized] = useState(false);
    const [officeError, setOfficeError] = useState(null);

    // Initialize Office JS
    useEffect(() => {
        const initializeOffice = async () => {
            try {
                await new Promise((resolve) => {
                    Office.onReady((info) => {
                        if (info.host === Office.HostType.Word) {
                            resolve();
                        } else {
                            setOfficeError('This add-in is designed for Microsoft Word.');
                        }
                    });
                });

                setOfficeInitialized(true);
            } catch (error) {
                console.error('Error initializing Office JS:', error);
                setOfficeError('Failed to initialize Office JS. Please try refreshing the page.');
            }
        };

        initializeOffice();
    }, []);

    // Show loading state while Office initializes
    if (!officeInitialized) {
        return (
            <Stack
                horizontalAlign="center"
                verticalAlign="center"
                verticalFill
                styles={{
                    root: {
                        width: '100%',
                        height: '100%',
                        padding: '20px'
                    }
                }}
            >
                {officeError ? (
                    <MessageBar messageBarType={MessageBarType.error}>
                        {officeError}
                    </MessageBar>
                ) : (
                    <>
                        <Spinner size={SpinnerSize.large} label="Loading Word-GPT-Plus..." />
                        <Text style={{ marginTop: 20 }}>
                            Please wait while the add-in initializes...
                        </Text>
                    </>
                )}
            </Stack>
        );
    }

    return (
        <SettingsProvider>
            <ApiErrorProvider>
                <div className="app-container">
                    <header className="app-header">
                        <Text variant="large" style={{ fontWeight: 'bold' }}>
                            Word-GPT-Plus
                        </Text>
                    </header>

                    <div className="app-content">
                        <Pivot aria-label="Word-GPT-Plus Features">
                            <PivotItem headerText="Basic" itemKey="basic">
                                <div className="tab-content">
                                    <BasicTab />
                                </div>
                            </PivotItem>

                            <PivotItem headerText="Structured" itemKey="structured">
                                <div className="tab-content">
                                    <StructuredTab />
                                </div>
                            </PivotItem>

                            <PivotItem headerText="Photos" itemKey="photos">
                                <div className="tab-content">
                                    <PhotosTab />
                                </div>
                            </PivotItem>

                            <PivotItem headerText="Settings" itemKey="settings">
                                <div className="tab-content">
                                    <SettingsTab />
                                </div>
                            </PivotItem>
                        </Pivot>
                    </div>
                </div>
            </ApiErrorProvider>
        </SettingsProvider>
    );
}

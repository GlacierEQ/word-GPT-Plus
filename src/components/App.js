import React, { useState, useEffect } from 'react';
import { Stack } from '@fluentui/react';
import { SettingsProvider } from '../context/SettingsContext';
import { ApiErrorProvider } from '../context/ApiErrorContext';
import TabController from './tabs/TabController';
import ErrorBoundary from './common/ErrorBoundary';
import AppHeader from './common/AppHeader';

/**
 * Main application component
 */
export default function App() {
    const [isOfficeInitialized, setIsOfficeInitialized] = useState(false);

    useEffect(() => {
        // Initialize Office JS
        const initializeOffice = async () => {
            try {
                await Office.onReady();
                setIsOfficeInitialized(true);
            } catch (error) {
                console.error('Error initializing Office:', error);
            }
        };

        initializeOffice();
    }, []);

    // Define tabs for the TabController
    const tabs = [
        {
            key: 'structured',
            title: 'Structured',
            component: 'tabs/StructuredPrompt'
        },
        {
            key: 'basic',
            title: 'Basic',
            component: 'tabs/BasicPrompt'
        },
        {
            key: 'photos',
            title: 'Images',
            component: 'tabs/ImagePanel'
        }
    ];

    return (
        <ErrorBoundary>
            <SettingsProvider>
                <ApiErrorProvider>
                    <Stack className="app-container" tokens={{ childrenGap: 15, padding: 10 }}>
                        <AppHeader isOfficeInitialized={isOfficeInitialized} />

                        {isOfficeInitialized ? (
                            <TabController
                                tabs={tabs}
                                defaultTab="structured"
                                commonProps={{ isOfficeInitialized }}
                            />
                        ) : (
                            <Stack horizontalAlign="center" tokens={{ padding: 20 }}>
                                <span>Loading Office.js...</span>
                            </Stack>
                        )}
                    </Stack>
                </ApiErrorProvider>
            </SettingsProvider>
        </ErrorBoundary>
    );
}

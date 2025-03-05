import React, { useState, lazy, Suspense } from 'react';
import { Pivot, PivotItem, Stack, Spinner, SpinnerSize } from '@fluentui/react';

/**
 * Dynamically loads components for each tab
 * @param {string} componentPath - Path to the component to load
 */
const loadComponent = (componentPath) => {
    // Create a dynamic import for the requested component
    return lazy(() => {
        // Handle special path formatting if needed
        const adjustedPath = componentPath.startsWith('./') || componentPath.startsWith('../')
            ? componentPath
            : `../${componentPath}`;

        // Use dynamic import to load the component
        return import(`${adjustedPath}`).catch(error => {
            console.error(`Error loading component: ${componentPath}`, error);
            // Return a placeholder component if loading fails
            return {
                default: () => (
                    <div>Failed to load component: {componentPath}</div>
                )
            };
        });
    });
};

/**
 * Tab controller component that manages tab navigation
 * @param {Object} props - Component props
 * @param {Array} props.tabs - Array of tab definitions
 * @param {string} props.defaultTab - Default selected tab key
 * @param {Object} props.commonProps - Props to pass to all tab components
 */
export default function TabController({ tabs = [], defaultTab = '', commonProps = {} }) {
    const [selectedTab, setSelectedTab] = useState(defaultTab || (tabs[0]?.key || ''));

    // Handle tab change
    const handleTabChange = (item) => {
        setSelectedTab(item.props.itemKey);
    };

    // Get the current tab configuration
    const currentTab = tabs.find(tab => tab.key === selectedTab) || tabs[0];

    // Dynamically load the component for the current tab
    const TabComponent = currentTab ? loadComponent(currentTab.component) : null;

    return (
        <Stack className="tab-controller">
            <Pivot
                selectedKey={selectedTab}
                onLinkClick={handleTabChange}
                styles={{
                    root: { marginBottom: 15 }
                }}
            >
                {tabs.map(tab => (
                    <PivotItem
                        key={tab.key}
                        itemKey={tab.key}
                        headerText={tab.title}
                    />
                ))}
            </Pivot>

            <div className="tab-content">
                <Suspense fallback={
                    <Stack horizontalAlign="center" tokens={{ padding: 20 }}>
                        <Spinner label="Loading content..." size={SpinnerSize.large} />
                    </Stack>
                }>
                    {TabComponent && <TabComponent {...commonProps} />}
                </Suspense>
            </div>
        </Stack>
    );
}

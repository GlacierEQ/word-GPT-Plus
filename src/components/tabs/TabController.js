import React, { useState } from 'react';
import {
    Pivot,
    PivotItem,
    Stack
} from '@fluentui/react';

/**
 * Component for managing tab navigation
 * @param {Object} props - Component props
 * @param {string} props.defaultTab - Default active tab
 * @param {Array} props.tabs - Array of tab definitions
 * @param {Object} props.commonProps - Props to pass to all tab contents
 * @returns {JSX.Element} Tab controller component
 */
export default function TabController({
    defaultTab = 'structured',
    tabs = [],
    commonProps = {}
}) {
    const [activeTab, setActiveTab] = useState(defaultTab);

    // If no tabs provided, use a default set
    const tabDefinitions = tabs.length > 0 ? tabs : [
        {
            key: 'structured',
            title: 'Structured',
            component: 'StructuredPrompt'
        },
        {
            key: 'basic',
            title: 'Basic',
            component: 'BasicPrompt'
        },
        {
            key: 'photos',
            title: 'Images',
            component: 'ImagePanel'
        }
    ];

    const handleTabChange = (item) => {
        setActiveTab(item.props.itemKey);
    };

    // Dynamically render the active tab's component
    const renderTabContent = () => {
        const activeTabDef = tabDefinitions.find(tab => tab.key === activeTab);
        if (!activeTabDef) return null;

        // If component is a string, load it dynamically
        if (typeof activeTabDef.component === 'string') {
            const TabComponent = require(`../${activeTabDef.component}`).default;
            return <TabComponent {...commonProps} {...activeTabDef.props} />;
        }

        // If component is a React component, render it
        if (React.isValidElement(activeTabDef.component)) {
            return React.cloneElement(activeTabDef.component, {
                ...commonProps,
                ...activeTabDef.props
            });
        }

        // If component is a function component, instantiate it
        if (typeof activeTabDef.component === 'function') {
            const Component = activeTabDef.component;
            return <Component {...commonProps} {...activeTabDef.props} />;
        }

        return null;
    };

    return (
        <Stack tokens={{ childrenGap: 15 }}>
            <Pivot
                selectedKey={activeTab}
                onLinkClick={handleTabChange}
                styles={{
                    root: {
                        marginBottom: 15
                    }
                }}
            >
                {tabDefinitions.map(tab => (
                    <PivotItem
                        key={tab.key}
                        itemKey={tab.key}
                        headerText={tab.title}
                        headerButtonProps={{
                            'aria-label': `${tab.title} tab`
                        }}
                    />
                ))}
            </Pivot>

            {/* Render the active tab content */}
            {renderTabContent()}
        </Stack>
    );
}

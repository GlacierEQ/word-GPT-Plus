/**
 * Word GPT Plus - Test Initialization
 * Initializes the Word GPT Plus system for testing purposes
 */

import modelManager from './model-manager.js';
import simpleApiClient from './simple-api-client.js';
import simpleDocumentManager from './simple-document-manager.js';
import automationManager from './automation/automation-manager.js';
import automationTaskpane from './automation-taskpane.js';

/**
 * Initialize the system for testing
 * @returns {Promise<Object>} Initialized components
 */
export async function initializeForTesting() {
    console.log('Initializing Word GPT Plus system for testing...');

    try {
        // Initialize core components
        await modelManager.loadConfig();
        simpleApiClient.loadConfig();

        // Initialize automation system
        await automationManager.init();

        // Return components for testing
        return {
            modelManager,
            simpleApiClient,
            simpleDocumentManager,
            automationManager,
            automationTaskpane
        };
    } catch (error) {
        console.error('Error initializing system for testing:', error);
        throw error;
    }
}

/**
 * Initialize a mock Office.js context for testing
 * @returns {Object} Mock context
 */
export function createMockContext() {
    // Create mock selection
    const mockSelection = {
        text: 'This is sample text for testing purposes.',
        insertText: function (text, location) {
            console.log(`Mock: Inserting text "${text}" with location "${location}"`);
            this.text = text;
            return this;
        },
        clear: function () {
            console.log('Mock: Clearing selection');
            return this;
        },
        load: function (param) {
            console.log(`Mock: Loading ${param} from selection`);
            return this;
        }
    };

    // Create mock document
    const mockDocument = {
        body: {
            text: 'This is the document body text for testing.',
            paragraphs: {
                items: [
                    { text: 'Paragraph 1', style: 'Normal', load: () => { } },
                    { text: 'Heading 1', style: 'Heading 1', load: () => { } },
                    { text: 'Paragraph 2', style: 'Normal', load: () => { } }
                ],
                load: function (param) {
                    console.log(`Mock: Loading ${param} from paragraphs`);
                    return this;
                }
            },
            tables: {
                items: [
                    {
                        rowCount: 3,
                        columnCount: 3,
                        rows: {
                            getFirst: () => ({
                                cells: {
                                    items: [
                                        { body: { font: {} }, shading: {} },
                                        { body: { font: {} }, shading: {} },
                                        { body: { font: {} }, shading: {} }
                                    ]
                                },
                                load: () => { }
                            }),
                            getItem: () => ({
                                cells: { items: [] },
                                load: () => { }
                            })
                        },
                        getBorder: () => ({ color: '', width: 1 }),
                        autoFit: () => { },
                        load: () => { }
                    }
                ],
                load: function (param) {
                    console.log(`Mock: Loading ${param} from tables`);
                    return this;
                }
            },
            load: function (param) {
                console.log(`Mock: Loading ${param} from body`);
                return this;
            }
        },
        getSelection: function () {
            return mockSelection;
        },
        sections: {
            items: [],
            load: function (param) {
                console.log(`Mock: Loading ${param} from sections`);
                return this;
            }
        }
    };

    // Create mock context
    const mockContext = {
        document: mockDocument,
        sync: async function () {
            console.log('Mock: Syncing context');
            return Promise.resolve();
        }
    };

    return mockContext;
}

/**
 * Run basic validation tests
 * @param {Object} components - Initialized components
 * @returns {Object} Test results
 */
export async function runBasicTests(components) {
    const { modelManager, automationManager } = components;
    const results = {
        tests: [],
        passed: 0,
        failed: 0
    };

    function addResult(testName, passed, details = null) {
        results.tests.push({ name: testName, passed, details });
        if (passed) results.passed++;
        else results.failed++;
    }

    // Test model manager
    try {
        const text = await modelManager.generateText("Hello, World!", { demoMode: true });
        addResult('ModelManager.generateText', true, { text });
    } catch (error) {
        addResult('ModelManager.generateText', false, { error: error.message });
    }

    // Test automation manager
    try {
        const automations = automationManager.getAutomationsByCategory();
        const automationCount = Object.values(automations).reduce(
            (count, list) => count + list.length, 0
        );
        addResult('AutomationManager.getAutomationsByCategory',
            automationCount > 0,
            { categories: Object.keys(automations), count: automationCount }
        );
    } catch (error) {
        addResult('AutomationManager.getAutomationsByCategory', false,
            { error: error.message }
        );
    }

    // Test automation running with mock context
    try {
        const mockContext = createMockContext();
        const result = await automationManager.runAutomation(
            'smartify-quotes',
            { target: 'selection' },
            mockContext
        );
        addResult('AutomationManager.runAutomation',
            result && result.success,
            { result }
        );
    } catch (error) {
        addResult('AutomationManager.runAutomation', false,
            { error: error.message }
        );
    }

    return results;
}

// If running directly (not imported)
if (typeof window !== 'undefined' && window.document) {
    window.addEventListener('DOMContentLoaded', async () => {
        // Check if we're in test mode
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('test') === 'true') {
            console.log('Running in test mode');

            // Create test results container
            const testContainer = document.createElement('div');
            testContainer.className = 'test-results';
            testContainer.innerHTML = '<h2>Word GPT Plus - Test Results</h2><div id="test-output"></div>';
            document.body.appendChild(testContainer);

            // Initialize and run tests
            try {
                const components = await initializeForTesting();
                const results = await runBasicTests(components);

                // Display results
                const output = document.getElementById('test-output');
                output.innerHTML = `
                    <div class="test-summary">
                        <p>Tests: ${results.tests.length}, Passed: ${results.passed}, Failed: ${results.failed}</p>
                    </div>
                    <div class="test-details">
                        ${results.tests.map(test => `
                            <div class="test-result ${test.passed ? 'passed' : 'failed'}">
                                <div class="test-name">${test.name}</div>
                                <div class="test-status">${test.passed ? 'PASSED' : 'FAILED'}</div>
                                <div class="test-details">${test.details ? JSON.stringify(test.details) : ''}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } catch (error) {
                document.getElementById('test-output').innerHTML = `
                    <div class="test-error">
                        <p>Error initializing tests: ${error.message}</p>
                    </div>
                `;
            }
        }
    });
}

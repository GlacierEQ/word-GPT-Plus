/**
 * Word GPT Plus - Core Functionality Test Runner
 * Simple test harness for verifying basic functionality
 */

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
        this.isRunning = false;
        this.outputElement = null;
    }

    /**
     * Initialize the test runner
     * @param {HTMLElement} outputElement - Element to display test results
     */
    initialize(outputElement) {
        this.outputElement = outputElement;
        this.registerCoreTests();
    }

    /**
     * Register core functionality tests
     */
    registerCoreTests() {
        // Test 1: Word connection test
        this.registerTest("Word Connection", this.testWordConnection.bind(this));

        // Test 2: Document selection test
        this.registerTest("Document Selection", this.testDocumentSelection.bind(this));

        // Test 3: Text insertion test
        this.registerTest("Text Insertion", this.testTextInsertion.bind(this));

        // Test 4: API connection test
        this.registerTest("API Connection", this.testApiConnection.bind(this));

        // Test 5: Quality standards module test
        this.registerTest("Quality Standards", this.testQualityStandards.bind(this));
    }

    /**
     * Register a test
     * @param {string} name - Test name
     * @param {Function} testFunction - Test function to run
     */
    registerTest(name, testFunction) {
        this.tests.push({
            name,
            run: testFunction
        });
    }

    /**
     * Run all registered tests
     */
    async runAllTests() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.results = [];
        this.updateOutput("Running tests...");

        for (const test of this.tests) {
            this.updateOutput(`Running test: ${test.name}...`);

            try {
                const startTime = performance.now();
                const result = await test.run();
                const duration = performance.now() - startTime;

                const success = result === true;
                const resultObj = {
                    name: test.name,
                    success,
                    duration,
                    message: success ? `Passed (${duration.toFixed(2)}ms)` : "Failed"
                };

                this.results.push(resultObj);
                this.updateOutput(`${test.name}: ${resultObj.message}`);

            } catch (error) {
                this.results.push({
                    name: test.name,
                    success: false,
                    message: `Error: ${error.message}`,
                    error
                });

                this.updateOutput(`${test.name}: Error - ${error.message}`);
            }
        }

        this.isRunning = false;
        this.displaySummary();
    }

    /**
     * Display test summary
     */
    displaySummary() {
        const passed = this.results.filter(r => r.success).length;
        const failed = this.results.length - passed;

        let summaryHTML = `
            <h3>Test Summary</h3>
            <p>Total: ${this.results.length}, Passed: ${passed}, Failed: ${failed}</p>
            <ul>
        `;

        this.results.forEach(result => {
            const icon = result.success ? '✓' : '✗';
            const color = result.success ? 'green' : 'red';
            summaryHTML += `
                <li style="color: ${color}">
                    ${icon} ${result.name}: ${result.message}
                </li>
            `;
        });

        summaryHTML += '</ul>';

        if (this.outputElement) {
            this.outputElement.innerHTML = summaryHTML;
        }
    }

    /**
     * Update output display
     * @param {string} message - Message to display
     */
    updateOutput(message) {
        console.log(message);

        if (this.outputElement) {
            this.outputElement.innerHTML += `<div>${message}</div>`;
        }
    }

    /**
     * Test 1: Word connection test
     */
    async testWordConnection() {
        // Verify Office.js is loaded
        if (!window.Office) {
            throw new Error("Office.js is not loaded");
        }

        return new Promise((resolve, reject) => {
            Office.onReady(info => {
                if (info.host === Office.HostType.Word) {
                    this.updateOutput("Word connection successful");
                    resolve(true);
                } else {
                    reject(new Error(`Not running in Word (host: ${info.host})`));
                }
            });
        });
    }

    /**
     * Test 2: Document selection test
     */
    async testDocumentSelection() {
        return Word.run(async context => {
            // Get document properties to verify access
            const properties = context.document.properties;
            properties.load("title");

            // Get current selection
            const selection = context.document.getSelection();
            selection.load("text");

            await context.sync();

            this.updateOutput(`Document title: ${properties.title || "(Untitled)"}`);
            this.updateOutput(`Current selection: "${selection.text || "(no selection)"}"`);

            return true;
        }).catch(error => {
            this.updateOutput(`Selection test error: ${error.message}`);
            throw error;
        });
    }

    /**
     * Test 3: Text insertion test
     */
    async testTextInsertion() {
        return Word.run(async context => {
            // Get the current selection
            const selection = context.document.getSelection();

            // Insert a test string
            const testText = "This text was inserted by Word GPT Plus test runner.";
            selection.insertText(testText, "Replace");

            await context.sync();
            this.updateOutput(`Inserted text: "${testText}"`);

            return true;
        }).catch(error => {
            this.updateOutput(`Text insertion error: ${error.message}`);
            throw error;
        });
    }

    /**
     * Test 4: API connection test
     */
    async testApiConnection() {
        try {
            // Check if API client is available
            if (!window.apiClient) {
                throw new Error("API client not available");
            }

            // Test with a simple prompt
            const result = await window.apiClient.generateText(
                "Write a one-sentence test response.",
                { maxTokens: 50 }
            );

            if (!result || typeof result !== 'string' || result.length < 5) {
                throw new Error("Invalid API response");
            }

            this.updateOutput(`API response: "${result}"`);
            return true;

        } catch (error) {
            this.updateOutput(`API test error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Test 5: Quality standards module test
     */
    async testQualityStandards() {
        try {
            // Check if quality standards module is available
            if (!window.qualityStandards) {
                throw new Error("Quality standards module not available");
            }

            // Test generating a quality report
            const report = window.qualityStandards.generateQualityReport();

            if (!report || !report.timestamp) {
                throw new Error("Invalid quality report generated");
            }

            this.updateOutput("Quality standards module working correctly");
            return true;

        } catch (error) {
            this.updateOutput(`Quality standards test error: ${error.message}`);
            throw error;
        }
    }
}

// Create global instance
const testRunner = new TestRunner();

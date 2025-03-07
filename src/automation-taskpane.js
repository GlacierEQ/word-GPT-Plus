/**
 * Word GPT Plus - Automation Taskpane
 * Main UI controller for the automation features
 */

import automationManager from './automation/automation-manager.js';
import documentAnalyzer from './automation/document-analyzer.js';
import contentGenerator from './automation/content-generator.js';
import formatConverter from './automation/format-converter.js';
import citationManager from './automation/citation-manager.js';
import batchProcessor from './automation/batch-processor.js';

class AutomationTaskpane {
    constructor() {
        // UI elements
        this.elements = {};

        // Track current state
        this.isInitialized = false;
        this.activeTab = 'automations';

        // Bind methods to preserve 'this'
        this.initialize = this.initialize.bind(this);
        this.switchTab = this.switchTab.bind(this);
        this.runQuickAction = this.runQuickAction.bind(this);
    }

    /**
     * Initialize the taskpane
     * @param {string} containerId - ID of container element
     * @returns {Promise<boolean>} Success indicator
     */
    async initialize(containerId = 'automation-container') {
        try {
            // Get container element
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.error(`Container element #${containerId} not found`);
                return false;
            }

            // Initialize automation system
            await automationManager.init();

            // Create initial UI
            this.createUI();

            // Mark as initialized
            this.isInitialized = true;
            console.log('Automation taskpane initialized');

            return true;
        } catch (error) {
            console.error('Error initializing automation taskpane:', error);
            return false;
        }
    }

    /**
     * Create the taskpane UI
     */
    createUI() {
        // Ensure container exists
        if (!this.container) return;

        // Clear container
        this.container.innerHTML = '';

        // Add header
        const header = document.createElement('div');
        header.className = 'automation-header';
        header.innerHTML = `
            <h2>Word GPT Plus Automations</h2>
            <p>Enhance your document with AI-powered automations</p>
        `;
        this.container.appendChild(header);

        // Add tabs
        const tabs = document.createElement('div');
        tabs.className = 'automation-tabs';
        tabs.innerHTML = `
            <div class="automation-tab active" data-tab="automations">Automations</div>
            <div class="automation-tab" data-tab="quick-actions">Quick Actions</div>
            <div class="automation-tab" data-tab="history">History</div>
        `;
        this.container.appendChild(tabs);

        // Add tab content containers
        const tabContent = document.createElement('div');
        tabContent.className = 'automation-tab-content';

        // Automations tab
        const automationsTab = document.createElement('div');
        automationsTab.className = 'automation-tab-pane active';
        automationsTab.id = 'automations-tab';
        tabContent.appendChild(automationsTab);

        // Quick actions tab
        const quickActionsTab = document.createElement('div');
        quickActionsTab.className = 'automation-tab-pane';
        quickActionsTab.id = 'quick-actions-tab';
        quickActionsTab.innerHTML = this.createQuickActionsUI();
        tabContent.appendChild(quickActionsTab);

        // History tab
        const historyTab = document.createElement('div');
        historyTab.className = 'automation-tab-pane';
        historyTab.id = 'history-tab';
        tabContent.appendChild(historyTab);

        this.container.appendChild(tabContent);

        // Create automation UI in automations tab
        this.automationUI = automationManager.createUI(automationsTab);

        // Add event listeners to tabs
        const tabElements = tabs.querySelectorAll('.automation-tab');
        tabElements.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        // Update history tab
        this.updateHistoryTab();

        // Set up quick action handlers
        this.setupQuickActions();
    }

    /**
     * Switch between tabs
     * @param {string} tabName - Tab name to switch to
     */
    switchTab(tabName) {
        if (!tabName || tabName === this.activeTab) return;

        // Update active tab
        this.activeTab = tabName;

        // Update tab buttons
        const tabButtons = this.container.querySelectorAll('.automation-tab');
        tabButtons.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab panes
        const tabPanes = this.container.querySelectorAll('.automation-tab-pane');
        tabPanes.forEach(pane => {
            pane.classList.remove('active');
        });

        // Show selected tab
        const activePane = this.container.querySelector(`#${tabName}-tab`);
        if (activePane) {
            activePane.classList.add('active');
        }

        // Refresh content if needed
        if (tabName === 'history') {
            this.updateHistoryTab();
        }
    }

    /**
     * Create UI for quick actions
     * @returns {string} Quick actions HTML
     */
    createQuickActionsUI() {
        return `
            <div class="quick-actions-grid">
                <div class="quick-action-card" data-action="analyze-readability">
                    <div class="quick-action-icon">📊</div>
                    <div class="quick-action-title">Check Readability</div>
                    <div class="quick-action-description">Analyze the readability of selected text</div>
                </div>
                
                <div class="quick-action-card" data-action="improve-text">
                    <div class="quick-action-icon">✨</div>
                    <div class="quick-action-title">Improve Text</div>
                    <div class="quick-action-description">Enhance selected text's clarity and style</div>
                </div>
                
                <div class="quick-action-card" data-action="fix-grammar">
                    <div class="quick-action-icon">🔍</div>
                    <div class="quick-action-title">Fix Grammar</div>
                    <div class="quick-action-description">Correct grammar issues in selection</div>
                </div>
                
                <div class="quick-action-card" data-action="format-table">
                    <div class="quick-action-icon">📑</div>
                    <div class="quick-action-title">Format Table</div>
                    <div class="quick-action-description">Apply professional styling to selected table</div>
                </div>
                
                <div class="quick-action-card" data-action="expand-bullet-points">
                    <div class="quick-action-icon">📝</div>
                    <div class="quick-action-title">Expand Bullets</div>
                    <div class="quick-action-description">Convert bullet points into full paragraphs</div>
                </div>
                
                <div class="quick-action-card" data-action="smart-quotes">
                    <div class="quick-action-icon">"</div>
                    <div class="quick-action-title">Smart Quotes</div>
                    <div class="quick-action-description">Convert straight quotes to smart quotes</div>
                </div>
            </div>
            
            <div class="quick-action-result" style="display: none;">
                <h3>Result</h3>
                <div class="quick-action-result-content"></div>
                <div class="quick-action-buttons">
                    <button class="automation-btn-secondary" id="quick-action-dismiss">Dismiss</button>
                </div>
            </div>
        `;
    }

    /**
     * Set up event listeners for quick actions
     */
    setupQuickActions() {
        // Get quick action cards
        const quickActionCards = this.container.querySelectorAll('.quick-action-card');

        // Add click listeners
        quickActionCards.forEach(card => {
            card.addEventListener('click', () => {
                const action = card.dataset.action;
                if (action) {
                    this.runQuickAction(action);
                }
            });
        });

        // Set up dismiss button for results
        const dismissButton = this.container.querySelector('#quick-action-dismiss');
        if (dismissButton) {
            dismissButton.addEventListener('click', () => {
                const resultArea = this.container.querySelector('.quick-action-result');
                if (resultArea) {
                    resultArea.style.display = 'none';
                }
            });
        }
    }

    /**
     * Run a quick action
     * @param {string} actionName - Name of the action to run
     */
    async runQuickAction(actionName) {
        try {
            // Show loading state
            this.showQuickActionLoading(true);

            // Create Word context
            const context = await Word.run();

            // Execute action based on name
            let result;

            switch (actionName) {
                case 'analyze-readability':
                    result = await documentAnalyzer.analyzeReadability(context, { target: 'selection' });
                    this.showReadabilityResult(result);
                    break;

                case 'improve-text':
                    // Get selected text
                    const selection = context.document.getSelection();
                    selection.load('text');
                    await context.sync();
                    const text = selection.text;

                    if (!text.trim()) {
                        throw new Error('No text selected for improvement');
                    }

                    // Use model manager to improve text
                    const prompt = `Improve this text for clarity and style without changing its meaning: "${text}"`;
                    const improvedText = await this.modelManager.generateText(prompt, { temperature: 0.3 });

                    // Replace text
                    selection.insertText(improvedText, 'Replace');
                    await context.sync();

                    result = {
                        original: text,
                        improved: improvedText,
                        timestamp: new Date().toISOString()
                    };
                    this.showSimpleResult('Text improved successfully');
                    break;

                case 'fix-grammar':
                    result = await batchProcessor.fixGrammar(context, { target: 'selection' });
                    this.showSimpleResult(`Fixed ${result.stats.wordinessFixed} wordiness issues and ${result.stats.redundanciesFixed} redundancies`);
                    break;

                case 'format-table':
                    result = await formatConverter.formatTable(context, { style: 'professional' });
                    this.showSimpleResult('Table formatted successfully');
                    break;

                case 'expand-bullet-points':
                    result = await contentGenerator.expandBulletPoints(context);
                    this.showSimpleResult(`Expanded ${result.originalBulletCount} bullet points into paragraphs`);
                    break;

                case 'smart-quotes':
                    result = await formatConverter.smartifyQuotes(context, { target: 'selection' });
                    this.showSimpleResult(`Converted ${result.replacements.straightQuotes} straight quotes and ${result.replacements.apostrophes} apostrophes`);
                    break;

                default:
                    throw new Error(`Unknown quick action: ${actionName}`);
            }

            // Add to history
            this.addActionToHistory(actionName, result);

        } catch (error) {
            console.error(`Error running quick action ${actionName}:`, error);
            this.showQuickActionError(error.message);
        } finally {
            // Hide loading state
            this.showQuickActionLoading(false);
        }
    }

    /**
     * Show quick action loading state
     * @param {boolean} isLoading - Whether loading is active
     */
    showQuickActionLoading(isLoading) {
        const resultArea = this.container.querySelector('.quick-action-result');
        if (!resultArea) return;

        if (isLoading) {
            resultArea.style.display = 'block';
            resultArea.innerHTML = `
                <div class="automation-loading">
                    <div class="automation-spinner"></div>
                    <p>Processing...</p>
                </div>
            `;
        } else {
            // We'll let the result display functions handle this case
        }
    }

    /**
     * Show readability analysis result
     * @param {Object} result - Readability analysis result
     */
    showReadabilityResult(result) {
        const resultArea = this.container.querySelector('.quick-action-result');
        if (!resultArea) return;

        // Format recommendations
        const recommendations = result.recommendations || [];
        const recommendationsHtml = recommendations.length > 0
            ? `
                <h4>Recommendations:</h4>
                <ul>
                    ${recommendations.map(rec => `<li>${rec.tip}</li>`).join('')}
                </ul>
            `
            : '';

        // Create result HTML
        resultArea.innerHTML = `
            <h3>Readability Analysis</h3>
            
            <div class="readability-metrics">
                <div class="metric">
                    <div class="metric-value">${result.scores.fleschReadingEase}</div>
                    <div class="metric-label">Reading Ease</div>
                </div>
                
                <div class="metric">
                    <div class="metric-value">${result.scores.fleschKincaidGrade}</div>
                    <div class="metric-label">Grade Level</div>
                </div>
                
                <div class="metric">
                    <div class="metric-value">${result.metrics.avgWordsPerSentence.toFixed(1)}</div>
                    <div class="metric-label">Words per Sentence</div>
                </div>
            </div>
            
            <div class="readability-level">
                <p>Reading Level: <strong>${result.scores.readabilityLevel}</strong></p>
            </div>
            
            ${recommendationsHtml}
            
            <div class="quick-action-buttons">
                <button class="automation-btn-secondary" id="quick-action-dismiss">Dismiss</button>
            </div>
        `;

        resultArea.style.display = 'block';

        // Re-attach dismiss button event
        const dismissButton = this.container.querySelector('#quick-action-dismiss');
        if (dismissButton) {
            dismissButton.addEventListener('click', () => {
                resultArea.style.display = 'none';
            });
        }
    }

    /**
     * Show simple result message
     * @param {string} message - Result message
     */
    showSimpleResult(message) {
        const resultArea = this.container.querySelector('.quick-action-result');
        if (!resultArea) return;

        resultArea.innerHTML = `
            <h3>Result</h3>
            <p>${message}</p>
            <div class="quick-action-buttons">
                <button class="automation-btn-secondary" id="quick-action-dismiss">Dismiss</button>
            </div>
        `;

        resultArea.style.display = 'block';

        // Re-attach dismiss button event
        const dismissButton = this.container.querySelector('#quick-action-dismiss');
        if (dismissButton) {
            dismissButton.addEventListener('click', () => {
                resultArea.style.display = 'none';
            });
        }
    }

    /**
     * Show quick action error
     * @param {string} errorMessage - Error message
     */
    showQuickActionError(errorMessage) {
        const resultArea = this.container.querySelector('.quick-action-result');
        if (!resultArea) return;

        resultArea.innerHTML = `
            <h3>Error</h3>
            <p class="error-message">${errorMessage}</p>
            <div class="quick-action-buttons">
                <button class="automation-btn-secondary" id="quick-action-dismiss">Dismiss</button>
            </div>
        `;

        resultArea.style.display = 'block';

        // Re-attach dismiss button event
        const dismissButton = this.container.querySelector('#quick-action-dismiss');
        if (dismissButton) {
            dismissButton.addEventListener('click', () => {
                resultArea.style.display = 'none';
            });
        }
    }

    /**
     * Add action to history
     * @param {string} actionName - Name of the action
     * @param {Object} result - Action result
     */
    addActionToHistory(actionName, result) {
        try {
            // Get existing history
            let history = [];

            try {
                const storedHistory = localStorage.getItem('wordGptPlusAutomationHistory');
                if (storedHistory) {
                    history = JSON.parse(storedHistory);
                }
            } catch (e) {
                console.warn('Failed to load history from storage');
            }

            // Add new item to top of history
            history.unshift({
                action: actionName,
                timestamp: new Date().toISOString(),
                result: result
            });

            // Limit history size
            if (history.length > 50) {
                history.length = 50;
            }

            // Save back to storage
            localStorage.setItem('wordGptPlusAutomationHistory', JSON.stringify(history));

            // Update UI if on history tab
            if (this.activeTab === 'history') {
                this.updateHistoryTab();
            }
        } catch (error) {
            console.error('Error adding to history:', error);
        }
    }

    /**
     * Update history tab with stored history
     */
    updateHistoryTab() {
        const historyTab = this.container.querySelector('#history-tab');
        if (!historyTab) return;

        // Try to get history from storage
        let history = [];
        try {
            const storedHistory = localStorage.getItem('wordGptPlusAutomationHistory');
            if (storedHistory) {
                history = JSON.parse(storedHistory);
            }
        } catch (e) {
            console.warn('Failed to load history from storage');
        }

        // Format history items
        const historyItems = history.map(item => {
            // Format timestamp
            const date = new Date(item.timestamp);
            const formattedDate = date.toLocaleString();

            // Format action name
            const actionName = this.formatActionName(item.action);

            return `
                <div class="history-item">
                    <div class="history-item-header">
                        <span class="history-item-action">${actionName}</span>
                        <span class="history-item-time">${formattedDate}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Update tab content
        historyTab.innerHTML = history.length > 0
            ? `<div class="history-list">${historyItems}</div>`
            : `<p class="no-history">No automation history yet.</p>`;
    }

    /**
     * Format action name for display
     * @param {string} actionName - Raw action name
     * @returns {string} Formatted action name
     */
    formatActionName(actionName) {
        // Convert kebab-case to title case
        return actionName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

// Create and export singleton instance
const automationTaskpane = new AutomationTaskpane();
export default automationTaskpane;

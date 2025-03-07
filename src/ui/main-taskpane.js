/**
 * Word GPT Plus - Main Taskpane UI
 * Controls the main user interface elements and interactions
 */

import config from '../config';
import logger from '../utils/logger';
import errorHandler from '../utils/error-handler';

// Create a logger specific to the UI module
const uiLogger = logger.createContextLogger('UI');

class MainTaskpane {
    constructor() {
        // UI references
        this.elements = {};

        // State
        this.state = {
            isProcessing: false,
            currentMode: 'standard', // 'standard', 'multiverse', 'optimize'
            selectedTemplate: null,
            darkMode: false,
            menuOpen: false
        };

        // Component references
        this.settingsPanel = window.settingsPanel;
        this.systemIntegration = window.systemIntegration;

        // Templates from config
        this.templates = config.ui.templates || [];

        // Event handlers - bind to preserve 'this'
        this.handlePromptSubmit = this.handlePromptSubmit.bind(this);
        this.handleTemplateClick = this.handleTemplateClick.bind(this);
        this.handleInsertClick = this.handleInsertClick.bind(this);
        this.handleClearClick = this.handleClearClick.bind(this);
        this.handleSettingsClick = this.handleSettingsClick.bind(this);
        this.toggleMode = this.toggleMode.bind(this);
    }

    /**
     * Initialize the taskpane UI
     */
    async initialize() {
        try {
            uiLogger.info('Initializing taskpane UI');

            // Get UI element references
            this.getElementReferences();

            // Set up event listeners
            this.setupEventListeners();

            // Initialize UI components
            await this.initializeUIComponents();

            // Apply theme
            this.applyTheme();

            // Render templates
            this.renderTemplates();

            // Show ready state
            this.showStatus('Ready');

            uiLogger.info('Taskpane UI initialized');
            return true;
        } catch (error) {
            uiLogger.error('Failed to initialize taskpane UI', { error });
            errorHandler.handleError(error, errorHandler.categories.UI);
            this.showError('Failed to initialize the interface');
            return false;
        }
    }

    /**
     * Get references to DOM elements
     */
    getElementReferences() {
        // Main sections
        this.elements.app = document.getElementById('app');
        this.elements.promptInput = document.getElementById('prompt-input');
        this.elements.generateButton = document.getElementById('generate-btn');
        this.elements.responseContainer = document.getElementById('response-container');
        this.elements.responseContent = document.getElementById('response-content');
        this.elements.insertButton = document.getElementById('insert-btn');
        this.elements.clearButton = document.getElementById('clear-btn');
        this.elements.templateContainer = document.getElementById('templates-container');
        this.elements.statusMessage = document.getElementById('status-message');
        this.elements.settingsButton = document.getElementById('settings-btn');
        this.elements.modeToggle = document.getElementById('mode-toggle');
        this.elements.settingsPanel = document.getElementById('settings-panel');

        // Verify essential elements exist
        if (!this.elements.app || !this.elements.promptInput || !this.elements.generateButton) {
            throw new Error('Required UI elements not found in the DOM');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Generate button
        if (this.elements.generateButton) {
            this.elements.generateButton.addEventListener('click', this.handlePromptSubmit);
        }

        // Insert button
        if (this.elements.insertButton) {
            this.elements.insertButton.addEventListener('click', this.handleInsertClick);
        }

        // Clear button
        if (this.elements.clearButton) {
            this.elements.clearButton.addEventListener('click', this.handleClearClick);
        }

        // Settings button
        if (this.elements.settingsButton) {
            this.elements.settingsButton.addEventListener('click', this.handleSettingsClick);
        }

        // Mode toggle
        if (this.elements.modeToggle) {
            this.elements.modeToggle.addEventListener('click', this.toggleMode);
        }

        // Enter key in prompt input
        if (this.elements.promptInput) {
            this.elements.promptInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && event.ctrlKey) {
                    event.preventDefault();
                    this.handlePromptSubmit();
                }
            });
        }
    }

    /**
     * Initialize UI components
     */
    async initializeUIComponents() {
        // Initialize settings panel if available
        if (this.settingsPanel && this.elements.settingsPanel) {
            this.settingsPanel.initialize(this.elements.settingsPanel);
        } else {
            uiLogger.warn('Settings panel not available');
        }

        // Apply stored preferences
        if (this.settingsPanel) {
            const settings = this.settingsPanel.settings || {};

            // Apply appearance settings
            if (settings.appearance) {
                this.state.darkMode = settings.appearance.theme === 'dark' ||
                    (settings.appearance.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

                // Apply font size
                if (settings.appearance.fontSize) {
                    document.documentElement.dataset.fontSize = settings.appearance.fontSize;
                }

                // Apply compact mode
                if (settings.appearance.compactMode) {
                    document.documentElement.dataset.compact = 'true';
                }
            }
        }
    }

    /**
     * Render template buttons
     */
    renderTemplates() {
        if (!this.elements.templateContainer) return;

        // Skip if no templates
        if (!this.templates || this.templates.length === 0) {
            this.elements.templateContainer.style.display = 'none';
            return;
        }

        // Add template buttons
        this.elements.templateContainer.innerHTML = '';

        this.templates.forEach(template => {
            const templateButton = document.createElement('button');
            templateButton.className = 'template-btn';
            templateButton.dataset.template = template.id;
            templateButton.textContent = template.name;

            templateButton.addEventListener('click', () => this.handleTemplateClick(template));

            this.elements.templateContainer.appendChild(templateButton);
        });
    }

    /**
     * Apply current theme to UI
     */
    applyTheme() {
        document.documentElement.dataset.theme = this.state.darkMode ? 'dark' : 'light';

        // Update mode toggle button
        if (this.elements.modeToggle) {
            this.elements.modeToggle.title = this.state.darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
            this.elements.modeToggle.innerHTML = this.state.darkMode ? '☀️' : '🌙';
        }
    }

    /**
     * Show status message
     * @param {string} message - Status message
     * @param {string} [type='info'] - Message type ('info', 'success', 'error', 'warning')
     * @param {number} [duration=3000] - How long to show the message (ms)
     */
    showStatus(message, type = 'info', duration = 3000) {
        if (!this.elements.statusMessage) return;

        // Clear any existing status
        clearTimeout(this.statusTimeout);

        // Set message text and type
        this.elements.statusMessage.textContent = message;
        this.elements.statusMessage.className = 'status-message ' + type;

        // Auto clear after duration if not permanent
        if (duration > 0) {
            this.statusTimeout = setTimeout(() => {
                this.elements.statusMessage.textContent = '';
                this.elements.statusMessage.className = 'status-message';
            }, duration);
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     * @param {boolean} [persistent=false] - Whether the message should persist
     */
    showError(message, persistent = false) {
        const duration = persistent ? 0 : 5000;
        this.showStatus(message, 'error', duration);

        // Show in response container if empty
        if (this.elements.responseContent &&
            (!this.elements.responseContent.textContent ||
                this.elements.responseContent.textContent === 'Response will appear here...')) {
            this.elements.responseContent.innerHTML = `<div class="error-message">${message}</div>`;
        }
    }

    /**
     * Set processing state
     * @param {boolean} isProcessing - Whether processing is ongoing
     */
    setProcessing(isProcessing) {
        this.state.isProcessing = isProcessing;

        // Update UI to reflect processing state
        if (this.elements.generateButton) {
            this.elements.generateButton.disabled = isProcessing;
            this.elements.generateButton.innerHTML = isProcessing ?
                '<span class="spinner"></span> Generating...' :
                'Generate with AI';
        }

        // Enable/disable prompt input
        if (this.elements.promptInput) {
            this.elements.promptInput.disabled = isProcessing;
        }

        // Show appropriate status
        if (isProcessing) {
            this.showStatus('Processing request...', 'info', 0);
        } else {
            this.showStatus('Ready', 'info', 3000);
        }
    }

    /**
     * Handle prompt submission
     */
    async handlePromptSubmit() {
        // Prevent submission if already processing
        if (this.state.isProcessing) return;

        const promptText = this.elements.promptInput?.value?.trim();

        // Validate input
        if (!promptText) {
            this.showError('Please enter a prompt');
            return;
        }

        try {
            this.setProcessing(true);

            // Check if system integration is available
            if (!this.systemIntegration) {
                throw new Error('System integration not available');
            }

            // Show responding state
            if (this.elements.responseContent) {
                this.elements.responseContent.innerHTML = '<div class="generating">Generating response...</div>';
            }

            // Get selected text from document
            let selectedText = '';
            try {
                selectedText = await this.getSelectedText();
            } catch (error) {
                uiLogger.warn('Failed to get selected text', { error });
            }

            // Process based on mode
            let result;
            if (this.state.currentMode === 'multiverse') {
                // Handle multiverse mode (multiple variations)
                result = await this.systemIntegration.generateMultiverseContent(
                    promptText,
                    ['formal', 'casual', 'creative', 'technical']
                );

                // Show variations UI
                this.displayMultiverseResults(result);
            } else if (this.state.currentMode === 'optimize') {
                // Handle recursive optimization mode
                const options = {
                    goal: promptText,
                    startingText: selectedText || 'Please provide text to optimize',
                    depth: 2
                };

                result = await this.systemIntegration.perfectText(selectedText, options);
                this.displayOptimizationResult(result);
            } else {
                // Standard mode - direct generation
                const context = { selectedText };
                result = await this.systemIntegration.modelManager.generateText(promptText, context);
                this.displayResult(result);
            }
        } catch (error) {
            uiLogger.error('Error processing prompt', { error, prompt: promptText });
            errorHandler.handleError(error, errorHandler.categories.SYSTEM);
            this.showError(`Error: ${error.message}`);

            if (this.elements.responseContent) {
                this.elements.responseContent.innerHTML =
                    `<div class="error-message">Failed to generate response: ${error.message}</div>`;
            }
        } finally {
            this.setProcessing(false);
        }
    }

    /**
     * Handle template button click
     * @param {Object} template - Template object
     */
    handleTemplateClick(template) {
        if (!this.elements.promptInput || !template) return;

        this.state.selectedTemplate = template.id;

        // Update all template buttons
        const templateButtons = this.elements.templateContainer?.querySelectorAll('.template-btn');
        if (templateButtons) {
            templateButtons.forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.template === template.id);
            });
        }

        // Get selected text
        this.getSelectedText().then(selectedText => {
            let promptText = template.prompt;

            // Add selected text if available
            if (selectedText) {
                promptText += `\n\n${selectedText}`;
            } else {
                promptText += '\n\n[Please select text in your document]';
            }

            // Set as prompt
            this.elements.promptInput.value = promptText;
            this.elements.promptInput.focus();
        });
    }

    /**
     * Handle insert button click
     */
    async handleInsertClick() {
        // Skip if no response
        if (!this.elements.responseContent ||
            !this.elements.responseContent.textContent ||
            this.elements.responseContent.textContent === 'Response will appear here...') {
            this.showStatus('No content to insert', 'warning');
            return;
        }

        try {
            // Get text to insert
            let textToInsert;
            const selectedVariant = this.elements.responseContent.querySelector('.variant-selected');

            if (selectedVariant) {
                // Handle multiverse mode with selected variant
                textToInsert = selectedVariant.querySelector('.variant-content').textContent;
            } else {
                // Standard mode
                textToInsert = this.elements.responseContent.textContent;
            }

            // Check if system integration is available
            if (!this.systemIntegration) {
                throw new Error('System integration not available');
            }

            this.showStatus('Inserting text...', 'info', 0);

            // Insert the text
            await this.systemIntegration.insertTextIntoDocument(textToInsert);

            this.showStatus('Text inserted successfully', 'success');
        } catch (error) {
            uiLogger.error('Failed to insert text', { error });
            errorHandler.handleError(error, errorHandler.categories.SYSTEM);
            this.showError(`Error inserting text: ${error.message}`);
        }
    }

    /**
     * Handle clear button click
     */
    handleClearClick() {
        // Clear prompt
        if (this.elements.promptInput) {
            this.elements.promptInput.value = '';
        }

        // Clear response
        if (this.elements.responseContent) {
            this.elements.responseContent.innerHTML = 'Response will appear here...';
        }

        // Deselect template
        this.state.selectedTemplate = null;
        const templateButtons = this.elements.templateContainer?.querySelectorAll('.template-btn');
        if (templateButtons) {
            templateButtons.forEach(btn => btn.classList.remove('selected'));
        }

        this.showStatus('Cleared', 'info');
    }

    /**
     * Handle settings button click
     */
    handleSettingsClick() {
        if (this.settingsPanel) {
            this.settingsPanel.toggle();
        } else {
            this.showStatus('Settings panel not available', 'warning');
        }
    }

    /**
     * Toggle between light and dark mode
     */
    toggleMode() {
        this.state.darkMode = !this.state.darkMode;
        this.applyTheme();

        // Save preference if settings available
        if (this.settingsPanel && this.settingsPanel.settings) {
            this.settingsPanel.settings.appearance = this.settingsPanel.settings.appearance || {};
            this.settingsPanel.settings.appearance.theme = this.state.darkMode ? 'dark' : 'light';
            this.settingsPanel.saveSettings();
        }

        this.showStatus(`${this.state.darkMode ? 'Dark' : 'Light'} mode enabled`, 'info');
    }

    /**
     * Get selected text from Word document
     * @returns {Promise<string>} The selected text
     */
    async getSelectedText() {
        try {
            return await Word.run(async context => {
                const selection = context.document.getSelection();
                selection.load('text');
                await context.sync();
                return selection.text;
            });
        } catch (error) {
            uiLogger.error('Error getting selected text', { error });
            throw error;
        }
    }

    /**
     * Display standard generation result
     * @param {string} result - Generated text
     */
    displayResult(result) {
        if (!this.elements.responseContent) return;

        this.elements.responseContent.textContent = result;

        // Show response container
        if (this.elements.responseContainer) {
            this.elements.responseContainer.style.display = 'block';
        }
    }

    /**
     * Display multiverse generation results
     * @param {Object} result - Multiverse generation result
     */
    displayMultiverseResults(result) {
        if (!this.elements.responseContent || !result.variants) return;

        // Create variants display
        let html = '<div class="multiverse-container">';

        result.variants.forEach((variant, index) => {
            html += `
        <div class="variant ${index === 0 ? 'variant-selected' : ''}" data-variant="${index}">
          <div class="variant-header">
            <h3>${variant.style || `Variant ${index + 1}`}</h3>
            <button class="variant-select-btn">${index === 0 ? 'Selected' : 'Select'}</button>
          </div>
          <div class="variant-content">${variant.text}</div>
        </div>
      `;
        });

        html += '</div>';

        this.elements.responseContent.innerHTML = html;

        // Add event listeners to variant selection buttons
        const variantButtons = this.elements.responseContent.querySelectorAll('.variant-select-btn');
        variantButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Find the parent variant
                const variant = e.target.closest('.variant');
                if (!variant) return;

                // Remove selected class from all variants
                const allVariants = this.elements.responseContent.querySelectorAll('.variant');
                allVariants.forEach(v => v.classList.remove('variant-selected'));

                // Update all buttons
                variantButtons.forEach(b => b.textContent = 'Select');

                // Select this variant
                variant.classList.add('variant-selected');
                e.target.textContent = 'Selected';
            });
        });

        // Show response container
        if (this.elements.responseContainer) {
            this.elements.responseContainer.style.display = 'block';
        }
    }

    /**
     * Display optimization result
     * @param {Object} result - Optimization result
     */
    displayOptimizationResult(result) {
        if (!this.elements.responseContent) return;

        this.elements.responseContent.innerHTML = `
      <div class="optimization-result">
        <div class="optimization-header">
          <h3>Optimized Content</h3>
          <span class="quality-score">Quality: ${Math.round(result.qualityScore * 100)}%</span>
        </div>
        <div class="optimization-content">${result.text}</div>
        <div class="optimization-improvements">
          <h4>Improvements Made:</h4>
          <ul class="improvements-list">
            ${result.improvements?.map(imp => `<li>${imp}</li>`).join('') || '<li>Basic optimization applied</li>'}
          </ul>
        </div>
      </div>
    `;

        // Show response container
        if (this.elements.responseContainer) {
            this.elements.responseContainer.style.display = 'block';
        }
    }
}

// Create global instance
const mainTaskpane = new MainTaskpane();

// Export
export default mainTaskpane;

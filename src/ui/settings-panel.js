/**
 * Word GPT Plus - Settings Panel
 * Provides UI for configuring add-in settings
 */

class SettingsPanel {
    constructor() {
        this.container = null;
        this.preferencesManager = window.preferencesManager;
        this.settings = null;
        this.isVisible = false;

        // Sections in settings panel
        this.sections = [
            { id: 'api', label: 'API Settings', icon: '🔌' },
            { id: 'features', label: 'Features', icon: '✨' },
            { id: 'appearance', label: 'Appearance', icon: '🎨' },
            { id: 'advanced', label: 'Advanced', icon: '⚙️' },
            { id: 'security', label: 'Security', icon: '🔒' },
            { id: 'about', label: 'About', icon: 'ℹ️' }
        ];

        this.activeSection = 'api';
    }

    /**
     * Initialize the settings panel
     * @param {HTMLElement} container - Container element
     */
    initialize(container) {
        this.container = container;

        // Try to load preferences
        if (this.preferencesManager) {
            this.settings = this.preferencesManager.getPreferences();
        } else {
            console.warn('Preferences manager not found, using default settings');
            this.settings = this.getDefaultSettings();
        }

        // Initial render
        this.render();
        this.hide(); // Start hidden
    }

    /**
     * Show the settings panel
     */
    show() {
        if (!this.container) return;
        this.container.style.display = 'block';
        this.isVisible = true;

        // Announce for screen readers
        const announcer = document.getElementById('settings-announcer');
        if (announcer) {
            announcer.textContent = 'Settings panel opened';
        }
    }

    /**
     * Hide the settings panel
     */
    hide() {
        if (!this.container) return;
        this.container.style.display = 'none';
        this.isVisible = false;

        // Announce for screen readers
        const announcer = document.getElementById('settings-announcer');
        if (announcer) {
            announcer.textContent = 'Settings panel closed';
        }
    }

    /**
     * Toggle the settings panel visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Render the settings panel
     */
    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="settings-panel">
                <div class="settings-header">
                    <h2>Settings</h2>
                    <button class="close-btn" id="close-settings" aria-label="Close settings">×</button>
                </div>
                
                <div class="settings-body">
                    <div class="settings-sidebar">
                        ${this.renderSidebar()}
                    </div>
                    
                    <div class="settings-content">
                        ${this.renderContent()}
                    </div>
                </div>
                
                <div class="settings-footer">
                    <button class="secondary-btn" id="reset-settings">Reset to Defaults</button>
                    <button class="primary-btn" id="save-settings">Save Settings</button>
                </div>
            </div>
            <div id="settings-announcer" class="sr-only" aria-live="polite"></div>
        `;

        // Add event listeners
        this.attachEventListeners();
    }

    /**
     * Render the sidebar navigation
     * @returns {string} Sidebar HTML
     */
    renderSidebar() {
        return `
            <ul class="settings-nav">
                ${this.sections.map(section => `
                    <li class="settings-nav-item ${section.id === this.activeSection ? 'active' : ''}">
                        <button data-section="${section.id}" aria-selected="${section.id === this.activeSection}">
                            <span class="section-icon">${section.icon}</span>
                            ${section.label}
                        </button>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    /**
     * Render the content for the active section
     * @returns {string} Section content HTML
     */
    renderContent() {
        const renderMethods = {
            'api': this.renderApiSettings.bind(this),
            'features': this.renderFeatureSettings.bind(this),
            'appearance': this.renderAppearanceSettings.bind(this),
            'advanced': this.renderAdvancedSettings.bind(this),
            'security': this.renderSecuritySettings.bind(this),
            'about': this.renderAboutSection.bind(this)
        };

        return renderMethods[this.activeSection] ?
            renderMethods[this.activeSection]() :
            'Section content not available';
    }

    /**
     * Attach event listeners to settings elements
     */
    attachEventListeners() {
        // Close button
        const closeBtn = document.getElementById('close-settings');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Section navigation
        const navButtons = this.container.querySelectorAll('.settings-nav button');
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.activeSection = button.dataset.section;
                this.render();
            });
        });

        // Save button
        const saveBtn = document.getElementById('save-settings');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSettings());
        }

        // Reset button
        const resetBtn = document.getElementById('reset-settings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSettings());
        }

        // Add section-specific event listeners
        this.attachSectionListeners();
    }

    /**
     * Attach section-specific event listeners
     */
    attachSectionListeners() {
        // Example for API settings section
        if (this.activeSection === 'api') {
            const providerSelect = document.getElementById('api-provider');
            if (providerSelect) {
                providerSelect.addEventListener('change', (e) => {
                    // Show/hide provider-specific fields
                    const provider = e.target.value;
                    document.querySelectorAll('.provider-fields').forEach(el => {
                        el.style.display = 'none';
                    });
                    document.getElementById(`${provider}-fields`).style.display = 'block';
                });
            }
        }

        // Example for feature settings
        if (this.activeSection === 'features') {
            const toggles = document.querySelectorAll('.feature-toggle');
            toggles.forEach(toggle => {
                toggle.addEventListener('change', (e) => {
                    const feature = e.target.dataset.feature;
                    const enabled = e.target.checked;

                    // Toggle related configuration elements
                    const configElements = document.querySelectorAll(`.config-${feature}`);
                    configElements.forEach(el => {
                        el.style.opacity = enabled ? '1' : '0.5';
                        el.querySelectorAll('input, select').forEach(input => {
                            input.disabled = !enabled;
                        });
                    });
                });
            });
        }
    }

    /**
     * Render API settings section
     * @returns {string} API settings HTML
     */
    renderApiSettings() {
        const apiSettings = this.settings.api || {};
        const providers = [
            { id: 'openai', name: 'OpenAI' },
            { id: 'azure', name: 'Azure OpenAI' },
            { id: 'localServer', name: 'Local Inference Server' }
        ];

        return `
            <div class="settings-section" id="api-settings">
                <h3>API Configuration</h3>
                <p>Configure the AI provider for text generation</p>
                
                <div class="form-group">
                    <label for="api-provider">AI Provider</label>
                    <select id="api-provider" name="api-provider">
                        ${providers.map(provider => `
                            <option value="${provider.id}" ${apiSettings.provider === provider.id ? 'selected' : ''}>
                                ${provider.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <!-- OpenAI Settings -->
                <div id="openai-fields" class="provider-fields" 
                     style="display: ${apiSettings.provider === 'openai' ? 'block' : 'none'}">
                    <div class="form-group">
                        <label for="openai-key">OpenAI API Key</label>
                        <input type="password" id="openai-key" name="openai-key" 
                               value="${apiSettings.openaiKey || ''}" placeholder="sk-..." />
                        <div class="help-text">Your OpenAI API key starting with 'sk-'</div>
                    </div>
                    
                    <div class="form-group">
                        <label for="openai-model">Default Model</label>
                        <select id="openai-model" name="openai-model">
                            <option value="gpt-4" ${apiSettings.openaiModel === 'gpt-4' ? 'selected' : ''}>GPT-4</option>
                            <option value="gpt-3.5-turbo" ${apiSettings.openaiModel === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo</option>
                        </select>
                    </div>
                </div>
                
                <!-- Azure Settings -->
                <div id="azure-fields" class="provider-fields" 
                     style="display: ${apiSettings.provider === 'azure' ? 'block' : 'none'}">
                    <div class="form-group">
                        <label for="azure-endpoint">Azure Endpoint</label>
                        <input type="text" id="azure-endpoint" name="azure-endpoint" 
                               value="${apiSettings.azureEndpoint || ''}" 
                               placeholder="https://your-resource.openai.azure.com" />
                    </div>
                    
                    <div class="form-group">
                        <label for="azure-key">Azure API Key</label>
                        <input type="password" id="azure-key" name="azure-key" 
                               value="${apiSettings.azureKey || ''}" placeholder="Azure API Key" />
                    </div>
                    
                    <div class="form-group">
                        <label for="azure-deployment">Deployment Name</label>
                        <input type="text" id="azure-deployment" name="azure-deployment" 
                               value="${apiSettings.azureDeployment || ''}" placeholder="Deployment name" />
                    </div>
                </div>
                
                <!-- Local Server Settings -->
                <div id="localServer-fields" class="provider-fields"
                     style="display: ${apiSettings.provider === 'localServer' ? 'block' : 'none'}">
                    <div class="form-group">
                        <label for="local-endpoint">Local Server Endpoint</label>
                        <input type="text" id="local-endpoint" name="local-endpoint" 
                               value="${apiSettings.localEndpoint || 'http://localhost:8080'}" 
                               placeholder="http://localhost:8080" />
                    </div>
                    
                    <div class="form-group">
                        <label for="local-model">Model Name</label>
                        <input type="text" id="local-model" name="local-model" 
                               value="${apiSettings.localModel || ''}" placeholder="Model name" />
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="api-timeout">Request Timeout (seconds)</label>
                    <input type="number" id="api-timeout" name="api-timeout" 
                           value="${apiSettings.timeout || 60}" min="10" max="300" />
                </div>
            </div>
        `;
    }

    /**
     * Render feature settings section
     * @returns {string} Feature settings HTML
     */
    renderFeatureSettings() {
        const features = this.settings.features || {};

        return `
            <div class="settings-section" id="feature-settings">
                <h3>Feature Configuration</h3>
                <p>Enable or disable specific features</p>
                
                <!-- Recursive Optimization -->
                <div class="feature-card">
                    <div class="feature-header">
                        <div>
                            <h4>Recursive Optimization</h4>
                            <p>Iteratively refine text through multiple AI passes</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" class="feature-toggle" data-feature="recursive" 
                                   ${features.recursiveOptimization?.enabled ? 'checked' : ''} />
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="feature-config config-recursive" 
                         style="opacity: ${features.recursiveOptimization?.enabled ? '1' : '0.5'}">
                        <div class="form-group">
                            <label for="recursive-iterations">Maximum Iterations</label>
                            <input type="number" id="recursive-iterations" 
                                   value="${features.recursiveOptimization?.maxIterations || 3}" 
                                   min="1" max="5" 
                                   ${features.recursiveOptimization?.enabled ? '' : 'disabled'} />
                        </div>
                        
                        <div class="form-group">
                            <label for="recursive-threshold">Quality Threshold</label>
                            <input type="range" id="recursive-threshold" 
                                   value="${features.recursiveOptimization?.qualityThreshold || 0.8}" 
                                   min="0.5" max="0.95" step="0.05" 
                                   ${features.recursiveOptimization?.enabled ? '' : 'disabled'} />
                            <div class="range-value">
                                <span id="recursive-threshold-value">
                                    ${features.recursiveOptimization?.qualityThreshold || 0.8}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Multiverse Writing -->
                <div class="feature-card">
                    <div class="feature-header">
                        <div>
                            <h4>Multiverse Writing</h4>
                            <p>Generate multiple versions of text in different styles</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" class="feature-toggle" data-feature="multiverse" 
                                   ${features.multiverseWriting?.enabled ? 'checked' : ''} />
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="feature-config config-multiverse" 
                         style="opacity: ${features.multiverseWriting?.enabled ? '1' : '0.5'}">
                        <div class="form-group">
                            <label for="multiverse-variants">Maximum Variants</label>
                            <input type="number" id="multiverse-variants" 
                                   value="${features.multiverseWriting?.maxVariants || 4}" 
                                   min="2" max="6" 
                                   ${features.multiverseWriting?.enabled ? '' : 'disabled'} />
                        </div>
                    </div>
                </div>
                
                <!-- Image Processing -->
                <div class="feature-card">
                    <div class="feature-header">
                        <div>
                            <h4>Image Processing</h4>
                            <p>Manipulate images within your documents</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" class="feature-toggle" data-feature="image" 
                                   ${features.imageProcessing?.enabled ? 'checked' : ''} />
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render appearance settings section
     * @returns {string} Appearance settings HTML
     */
    renderAppearanceSettings() {
        const appearance = this.settings.appearance || {};

        return `
            <div class="settings-section" id="appearance-settings">
                <h3>Appearance Settings</h3>
                <p>Customize the look and feel of Word GPT Plus</p>
                
                <div class="form-group">
                    <label for="theme-selector">Theme</label>
                    <select id="theme-selector" name="theme">
                        <option value="system" ${appearance.theme === 'system' ? 'selected' : ''}>System Default</option>
                        <option value="light" ${appearance.theme === 'light' ? 'selected' : ''}>Light</option>
                        <option value="dark" ${appearance.theme === 'dark' ? 'selected' : ''}>Dark</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="font-size">Font Size</label>
                    <select id="font-size" name="fontSize">
                        <option value="small" ${appearance.fontSize === 'small' ? 'selected' : ''}>Small</option>
                        <option value="medium" ${appearance.fontSize === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="large" ${appearance.fontSize === 'large' ? 'selected' : ''}>Large</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="compact-mode">Compact Mode</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="compact-mode" name="compactMode" 
                               ${appearance.compactMode ? 'checked' : ''} />
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
        `;
    }

    /**
     * Render advanced settings section
     * @returns {string} Advanced settings HTML
     */
    renderAdvancedSettings() {
        // Default to empty objects if settings are missing
        const advanced = this.settings.advanced || {};

        return `
            <div class="settings-section" id="advanced-settings">
                <h3>Advanced Settings</h3>
                <p>Configure advanced options for Word GPT Plus</p>
                
                <div class="advanced-card">
                    <h4>Developer Options</h4>
                    <div class="form-group">
                        <label for="dev-mode">Developer Mode</label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="dev-mode" name="devMode" 
                                   ${advanced.developerMode ? 'checked' : ''} />
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label for="debug-level">Debug Level</label>
                        <select id="debug-level" name="debugLevel" 
                                ${!advanced.developerMode ? 'disabled' : ''}>
                            <option value="none" ${advanced.debugLevel === 'none' ? 'selected' : ''}>None</option>
                            <option value="error" ${advanced.debugLevel === 'error' ? 'selected' : ''}>Errors Only</option>
                            <option value="warn" ${advanced.debugLevel === 'warn' ? 'selected' : ''}>Warnings & Errors</option>
                            <option value="info" ${advanced.debugLevel === 'info' ? 'selected' : ''}>Info</option>
                            <option value="debug" ${advanced.debugLevel === 'debug' ? 'selected' : ''}>Debug</option>
                        </select>
                    </div>
                </div>
                
                <div class="advanced-card">
                    <h4>Data Management</h4>
                    <div class="form-group">
                        <button class="secondary-btn" id="export-data">Export All Data</button>
                        <button class="secondary-btn" id="clear-data">Clear Cached Data</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render security settings section
     * @returns {string} Security settings HTML
     */
    renderSecuritySettings() {
        const security = this.settings.security || {};

        return `
            <div class="settings-section" id="security-settings">
                <h3>Security Settings</h3>
                <p>Configure security options for protecting your data</p>
                
                <div class="form-group">
                    <label for="security-level">Security Level</label>
                    <select id="security-level" name="securityLevel">
                        <option value="basic" ${security.securityLevel === 'basic' ? 'selected' : ''}>Basic</option>
                        <option value="standard" ${security.securityLevel === 'standard' ? 'selected' : ''}>Standard</option>
                        <option value="enhanced" ${security.securityLevel === 'enhanced' ? 'selected' : ''}>Enhanced</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="encrypt-data">Encrypt Stored Data</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="encrypt-data" name="encryptData" 
                               ${security.encryptionEnabled ? 'checked' : ''} />
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                
                <div class="form-group">
                    <label for="data-minimization">Data Minimization</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="data-minimization" name="dataMinimization" 
                               ${security.dataMinimizationEnabled ? 'checked' : ''} />
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="help-text">Reduce personal data sent to AI providers</div>
                </div>
                
                <div class="form-group">
                    <label for="content-scanning">Content Scanning</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="content-scanning" name="contentScanning" 
                               ${security.contentScanningEnabled ? 'checked' : ''} />
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="help-text">Detect sensitive content before submission</div>
                </div>
            </div>
        `;
    }

    /**
     * Render about section
     * @returns {string} About section HTML
     */
    renderAboutSection() {
        return `
            <div class="settings-section" id="about-section">
                <div class="about-header">
                    <img src="assets/icon-64.png" alt="Word GPT Plus logo" class="about-logo">
                    <div>
                        <h3>Word GPT Plus</h3>
                        <p>Version ${this.settings.app?.version || '1.0.0'}</p>
                    </div>
                </div>
                
                <p>Advanced AI assistant for Microsoft Word with local models and recursive optimization</p>
                
                <div class="about-links">
                    <a href="https://github.com/casey/word-GPT-Plus" target="_blank">GitHub Project</a>
                    <a href="https://github.com/casey/word-GPT-Plus/issues" target="_blank">Report Issue</a>
                    <a href="https://github.com/casey/word-GPT-Plus/blob/main/docs/user/user-guide.md" target="_blank">User Guide</a>
                </div>
                
                <div class="about-card">
                    <h4>System Information</h4>
                    <div class="info-row">
                        <span class="info-label">Browser:</span>
                        <span class="info-value">${navigator.userAgent.split(' ').slice(-3, -2)[0]}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Word Version:</span>
                        <span class="info-value">${Office?.context?.diagnostics?.version || 'Unknown'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Platform:</span>
                        <span class="info-value">${Office?.context?.platform || 'Unknown'}</span>
                    </div>
                </div>
                
                <p class="copyright">© ${new Date().getFullYear()} Word GPT Plus Contributors</p>
            </div>
        `;
    }

    /**
     * Save settings
     */
    saveSettings() {
        if (!this.preferencesManager) {
            console.warn('Cannot save settings: Preferences manager not found');
            return;
        }

        // Save API settings
        if (this.activeSection === 'api') {
            const provider = document.getElementById('api-provider').value;

            // Common API settings
            const apiSettings = {
                provider,
                timeout: parseInt(document.getElementById('api-timeout').value, 10) || 60
            };

            // Provider-specific settings
            if (provider === 'openai') {
                apiSettings.openaiKey = document.getElementById('openai-key').value;
                apiSettings.openaiModel = document.getElementById('openai-model').value;
            } else if (provider === 'azure') {
                apiSettings.azureEndpoint = document.getElementById('azure-endpoint').value;
                apiSettings.azureKey = document.getElementById('azure-key').value;
                apiSettings.azureDeployment = document.getElementById('azure-deployment').value;
            } else if (provider === 'localServer') {
                apiSettings.localEndpoint = document.getElementById('local-endpoint').value;
                apiSettings.localModel = document.getElementById('local-model').value;
            }

            this.settings.api = apiSettings;
        }

        // Save other sections as needed based on this.activeSection
        // ...

        // Finally save all settings
        this.preferencesManager.savePreferences(this.settings);

        // Show confirmation
        const announcer = document.getElementById('settings-announcer');
        if (announcer) {
            announcer.textContent = 'Settings saved successfully';
        }
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        if (!confirm('Are you sure you want to reset all settings to defaults?')) {
            return;
        }

        this.settings = this.getDefaultSettings();
        this.render();

        // Save defaults if we have a preferences manager
        if (this.preferencesManager) {
            this.preferencesManager.savePreferences(this.settings);
        }

        // Show confirmation
        const announcer = document.getElementById('settings-announcer');
        if (announcer) {
            announcer.textContent = 'Settings reset to defaults';
        }
    }

    /**
     * Get default settings
     * @returns {Object} Default settings object
     */
    getDefaultSettings() {
        return {
            app: {
                version: '1.0.0'
            },
            api: {
                provider: 'openai',
                timeout: 60,
                openaiModel: 'gpt-3.5-turbo'
            },
            features: {
                recursiveOptimization: {
                    enabled: true,
                    maxIterations: 3,
                    qualityThreshold: 0.8
                },
                multiverseWriting: {
                    enabled: true,
                    maxVariants: 4
                },
                imageProcessing: {
                    enabled: true
                }
            },
            appearance: {
                theme: 'system',
                fontSize: 'medium',
                compactMode: false
            },
            security: {
                securityLevel: 'standard',
                encryptionEnabled: true,
                dataMinimizationEnabled: true,
                contentScanningEnabled: true
            }
        };
    }
}

// Create global instance
const settingsPanel = new SettingsPanel();

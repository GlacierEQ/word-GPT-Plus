/**
 * Word GPT Plus - Provider Selector
 * UI component for selecting and configuring AI providers with preference for free options
 */

import config from '../config';
import freeApiProvider from '../free-api-provider';
import logger from '../utils/logger';

const providerLogger = logger.createContextLogger('ProviderSelector');

class ProviderSelector {
    constructor() {
        this.container = null;
        this.providers = [];
        this.selectedProvider = null;
        this.onProviderChange = null;
        
        // Get both standard and free providers
        this._initializeProviders();
    }
    
    /**
     * Initialize the provider selector
     * @param {HTMLElement} container - Container element
     * @param {Function} onChange - Callback for provider changes
     */
    initialize(container, onChange) {
        this.container = container;
        this.onProviderChange = onChange;
        
        // Check for Ollama availability
        this._checkLocalProviders();
        
        // Render the selector
        this.render();
    }
    
    /**
     * Initialize provider list
     * @private
     */
    _initializeProviders() {
        // Get configured providers
        const configProviders = config.api.providers;
        
        // Start with free providers
        this.providers = Object.keys(configProviders)
            .filter(id => configProviders[id].isFree)
            .map(id => ({
                id,
                name: this._getProviderName(id),
                isFree: true,
                baseUrl: configProviders[id].baseUrl,
                defaultModel: configProviders[id].defaultModel
            }));
            
        // Add paid providers at the end
        const paidProviders = Object.keys(configProviders)
            .filter(id => !configProviders[id].isFree)
            .map(id => ({
                id,
                name: this._getProviderName(id),
                isFree: false,
                baseUrl: configProviders[id].baseUrl,
                defaultModel: configProviders[id].defaultModel
            }));
            
        this.providers = [...this.providers, ...paidProviders];
        
        // Set default provider
        this.selectedProvider = config.api.defaultProvider || 
            (this.providers.length > 0 ? this.providers[0].id : null);
    }
    
    /**
     * Check for availability of local providers
     * @private
     */
    async _checkLocalProviders() {
        try {
            // Check if Ollama is running
            const ollamaAvailable = await freeApiProvider.checkOllamaAvailability();
            
            if (ollamaAvailable) {
                providerLogger.info('Ollama server detected');
                
                // Get available models
                const models = await freeApiProvider.getOllamaModels();
                providerLogger.info(`Found ${models.length} Ollama models`, { models });
                
                // Update UI if rendered
                this._updateOllamaUI(models);
            } else {
                providerLogger.info('Ollama server not detected');
                
                // Update UI to show installation instructions if rendered
                if (this.container) {
                    const ollamaSection = this.container.querySelector('.ollama-section');
                    if (ollamaSection) {
                        ollamaSection.innerHTML = this._renderOllamaInstructions();
                    }
                }
            }
        } catch (error) {
            providerLogger.error('Error checking local providers', { error });
        }
    }
    
    /**
     * Get formatted provider name
     * @param {string} providerId - Provider ID
     * @returns {string} Formatted name
     * @private
     */
    _getProviderName(providerId) {
        const names = {
            ollama: 'Ollama (Local Models)',
            huggingface: 'Hugging Face',
            groq: 'Groq',
            gemini: 'Google Gemini',
            openai: 'OpenAI',
            azure: 'Azure OpenAI',
            anthropic: 'Anthropic'
        };
        return names[providerId] || providerId;
    }
    
    /**
     * Render the provider selector
     */
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="provider-selector">
                <div class="provider-header">
                    <h3>AI Provider Selection</h3>
                    <div class="provider-info">Prefer free options for cost-effective use</div>
                </div>
                
                <div class="provider-list">
                    ${this._renderProviderList()}
                </div>
                
                <div class="provider-details">
                    ${this._renderProviderDetails()}
                </div>
                
                <div class="ollama-section">
                    ${this._renderOllamaSection()}
                </div>
            </div>
        `;
        
        // Add event listeners
        this._attachEventListeners();
        
        // Check for Ollama availability
        this._checkLocalProviders();
    }
    
    /**
     * Render the list of providers
     * @returns {string} HTML for provider list
     * @private
     */
    _renderProviderList() {
        return `
            <div class="provider-options">
                ${this.providers.map(provider => `
                    <div class="provider-option ${provider.id === this.selectedProvider ? 'selected' : ''}">
                        <input type="radio" name="provider" id="provider-${provider.id}" 
                               value="${provider.id}" ${provider.id === this.selectedProvider ? 'checked' : ''}>
                        <label for="provider-${provider.id}" class="provider-label">
                            <span class="provider-name">${provider.name}</span>
                            ${provider.isFree ? 
                                '<span class="provider-badge free">FREE</span>' : 
                                '<span class="provider-badge paid">PAID</span>'
                            }
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Render details of the selected provider
     * @returns {string} HTML for provider details
     * @private
     */
    _renderProviderDetails() {
        const provider = this.providers.find(p => p.id === this.selectedProvider) || {};
        
        if (provider.id === 'ollama') {
            return `<div class="provider-setup">
                <p>Ollama provides free, local AI models. No API keys required.</p>
            </div>`;
        }
        
        if (provider.isFree) {
            return `<div class="provider-setup">
                <p>${provider.name} offers a free tier with usage limits.</p>
                <div class="form-group">
                    <label for="api-key-${provider.id}">API Key:</label>
                    <input type="password" id="api-key-${provider.id}" class="api-key-input" placeholder="Enter your ${provider.name} API key">
                </div>
                <div class="model-selector">
                    <label for="model-${provider.id}">Model:</label>
                    <select id="model-${provider.id}" class="model-select">
                        <option value="${provider.defaultModel}">${provider.defaultModel}</option>
                    </select>
                </div>
            </div>`;
        }
        
        return `<div class="provider-setup">
            <p>This is a paid service requiring an API key.</p>
            <div class="form-group">
                <label for="api-key-${provider.id}">API Key:</label>
                <input type="password" id="api-key-${provider.id}" class="api-key-input" placeholder="Enter your ${provider.name} API key">
            </div>
        </div>`;
    }
    
    /**
     * Render the Ollama section
     * @returns {string} HTML for the Ollama section
     * @private
     */
    _renderOllamaSection() {
        return `
            <div class="ollama-status">
                <h4>Ollama Status</h4>
                <div class="status-indicator">
                    <span class="status-checking">Checking availability...</span>
                </div>
                <div class="ollama-models" style="display: none;">
                    <h5>Available Models</h5>
                    <div class="model-list">Loading models...</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render Ollama installation instructions
     * @returns {string} HTML with instructions
     * @private
     */
    _renderOllamaInstructions() {
        return `
            <div class="ollama-instructions">
                <h4>Ollama Not Detected</h4>
                <p>Get free AI models running locally with Ollama:</p>
                <ol>
                    <li>Download and install <a href="https://ollama.ai" target="_blank">Ollama</a></li>
                    <li>Run the Ollama application</li>
                    <li>Pull a model: <code>ollama pull mistral</code></li>
                    <li>Refresh this page once Ollama is running</li>
                </ol>
                <button class="refresh-ollama-btn">Refresh Status</button>
            </div>
        `;
    }
    
    /**
     * Update Ollama UI with available models
     * @param {string[]} models - Available models
     * @private
     */
    _updateOllamaUI(models) {
        if (!this.container) return;
        
        const statusIndicator = this.container.querySelector('.status-indicator');
        const ollamaModels = this.container.querySelector('.ollama-models');
        const modelList = this.container.querySelector('.model-list');
        
        if (statusIndicator) {
            statusIndicator.innerHTML = '<span class="status-available">✓ Ollama Available</span>';
        }
        
        if (ollamaModels) {
            ollamaModels.style.display = 'block';
        }
        
        if (modelList) {
            if (models.length === 0) {
                modelList.innerHTML = '<p>No models found. Run <code>ollama pull mistral</code> to download a model.</p>';
            } else {
                modelList.innerHTML = `
                    <ul class="model-items">
                        ${models.map(model => `<li class="model-item">${model}</li>`).join('')}
                    </ul>
                    <p class="model-tip">These models are available for use without API keys.</p>
                `;
            }
        }
    }
    
    /**
     * Attach event listeners
     * @private
     */
    _attachEventListeners() {
        // Provider selection
        const radioButtons = this.container.querySelectorAll('input[name="provider"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.selectedProvider = e.target.value;
                
                // Update UI
                const options = this.container.querySelectorAll('.provider-option');
                options.forEach(option => {
                    option.classList.toggle('selected', option.querySelector('input').value === this.selectedProvider);
                });
                
                // Update details section
                const detailsSection = this.container.querySelector('.provider-details');
                if (detailsSection) {
                    detailsSection.innerHTML = this._renderProviderDetails();
                }
                
                // Notify of change
                if (typeof this.onProviderChange === 'function') {
                    this.onProviderChange(this.selectedProvider);
                }
            });
        });
        
        // Refresh Ollama button
        const refreshBtn = this.container.querySelector('.refresh-ollama-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this._checkLocalProviders();
            });
        }
    }
    
    /**
     * Get the currently selected provider
     * @returns {Object} Provider information
     */
    getSelectedProvider() {
        const provider = this.providers.find(p => p.id === this.selectedProvider);
        
        if (!provider) {
            return {
                id: 'ollama',
                isFree: true,
                name: 'Ollama (Local Models)'
            };
        }
        
        return provider;
    }
    
    /**
     * Get the API key for the selected provider
     * @returns {string|null} API key or null
     */
    getApiKey() {
        if (!this.container || !this.selectedProvider) return null;
        
        const keyInput = this.container.querySelector(`#api-key-${this.selectedProvider}`);
        return keyInput ? keyInput.value : null;
    }
    
    /**
     * Get the selected model
     * @returns {string|null} Selected model or null
     */
    getSelectedModel() {
        if (!this.container || !this.selectedProvider) return null;
        
        const modelSelect = this.container.querySelector(`#model-${this.selectedProvider}`);
        if (modelSelect) {
            return modelSelect.value;
        }
        
        // Get default model
        const provider = this.providers.find(p => p.id === this.selectedProvider);
        return provider ? provider.defaultModel : null;
    }
}

// Export
export default ProviderSelector;

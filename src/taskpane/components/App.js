import React from "react";
import {
    Button,
    Spinner,
    TextField,
    Toggle,
    MessageBar,
    MessageBarType,
    Pivot,
    PivotItem,
    Stack,
    Link,
    Text
} from "@fluentui/react";
import { IconButton } from '@fluentui/react';
import { CancelIcon } from '@fluentui/react-icons';
import {
    checkMemoryUsage,
    safelyLimitTextSize,
    RateLimiter,
    validatePrompt,
    withTimeout,
    documentSizeSafety
} from "../../utils/protections";
import StructuredPrompt from './StructuredPrompt';
import { enhancePromptWithLegalContext } from '../../utils/legalContext';

// Add new imports for memory system
import {
    initializeMemorySystem,
    addMemory,
    generateMemoryEnhancedPrompt
} from "../../utils/memorySystem";

// Add new import for ImagePanel
import ImagePanel from './ImagePanel';

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            apiKey: "",
            prompt: "",
            response: "",
            isProcessing: false,
            canInterrupt: false,
            contextualAwareness: true,
            errorDetection: true,
            showSettings: false,
            temperature: 0.7,
            statusMessage: "",
            memoryWarning: false,
            rateLimited: false,
            timeToWait: 0,
            activeTab: 'structured',
            selectedLegalDomains: [],
            selectedText: "",  // Add missing state for selected text
            memoryEnabled: true,   // Enable memory by default
            memoryStats: null,
            deepseekApiKey: localStorage.getItem('deepseekApiKey') || "",
            useSeperateDeepseekKey: localStorage.getItem('useSeperateDeepseekKey') === 'true' || false,
            deepseekEndpoint: localStorage.getItem('deepseekEndpoint') || "https://api.deepseek.com/v1/chat/completions",
            deepseekNonCommercial: localStorage.getItem('deepseekNonCommercial') === 'true' || false,
        };
        this.abortController = null;
        this.rateLimiter = new RateLimiter(5, 60000); // 5 requests per minute
    }

    // Add lifecycle method to load initial text selection
    componentDidMount() {
        this.getSelectedTextFromWord();

        // Initialize memory system
        if (this.state.memoryEnabled) {
            const memorySystem = initializeMemorySystem();
            this.setState({
                memoryStats: {
                    totalMemories: memorySystem.memories.length,
                    totalInteractions: memorySystem.stats.totalInteractions
                }
            });
        }
    }

    // Method to get selected text from Word document
    getSelectedTextFromWord = async () => {
        try {
            await window.Word.run(async (context) => {
                const selection = context.document.getSelection();
                selection.load('text');
                await context.sync();

                if (selection.text) {
                    this.setState({ selectedText: selection.text });
                }
            });
        } catch (error) {
            console.error("Error getting selected text:", error);
            this.setState({ statusMessage: "Could not get selected text from document." });
        }
    }

    // Add missing handleGenerate method
    handleGenerate = async () => {
        // Refresh selected text before generating
        await this.getSelectedTextFromWord();

        const { prompt, selectedText } = this.state;

        if (!prompt.trim()) {
            this.setState({ statusMessage: "Please enter a prompt before generating." });
            return;
        }

        await this.callAPI(prompt, selectedText);
    }

    handleInterrupt = async () => {
        if (this.abortController) {
            this.abortController.abort();
            this.setState({
                isProcessing: false,
                canInterrupt: false,
                statusMessage: "Operation interrupted by user"
            });
        }
    }

    // Add missing getApiConfig method
    getApiConfig = () => {
        // This should ideally come from your settings or a configuration file
        // For now, we'll use a basic implementation
        return {
            endpoint: "https://api.openai.com/v1/chat/completions",
            apiKey: this.state.apiKey,
            model: "gpt-4"  // Default model
        };
    }

    // Method to get the appropriate API key based on the model
    getApiKeyForModel = (model) => {
        if (model && model.includes('deepseek')) {
            // For DeepSeek models, check if non-commercial keyless usage is enabled
            if (this.state.deepseekNonCommercial) {
                // Allow null API key for non-commercial usage
                return this.state.useSeperateDeepseekKey ? this.state.deepseekApiKey : this.state.apiKey;
            } else {
                // Commercial usage - require API key
                return this.state.useSeperateDeepseekKey ? this.state.deepseekApiKey : this.state.apiKey;
            }
        }
        return this.state.apiKey;
    };

    callAPI = async (prompt, selectedText) => {
        // Validate input first
        const validation = validatePrompt(prompt);
        if (!validation.isValid) {
            this.setState({
                statusMessage: `Error: ${validation.error}`,
                isProcessing: false,
            });
            return;
        }

        // Check rate limiting
        if (!this.rateLimiter.canMakeRequest()) {
            const timeToWait = this.rateLimiter.getTimeToWait();
            this.setState({
                rateLimited: true,
                timeToWait: Math.ceil(timeToWait / 1000),
                statusMessage: `Rate limit reached. Please try again in ${Math.ceil(timeToWait / 1000)} seconds.`
            });
            return;
        }

        // Check memory usage
        if (!checkMemoryUsage()) {
            this.setState({
                memoryWarning: true,
                statusMessage: "Memory usage is high. Please close other applications or reload the add-in."
            });
            return;
        }

        // Check document size safety
        const docSafety = documentSizeSafety(selectedText);
        if (!docSafety.safe) {
            this.setState({
                statusMessage: docSafety.message
            });
            return;
        }

        // Continue with processing
        this.setState({ isProcessing: true, canInterrupt: true });
        this.abortController = new AbortController();

        try {
            const apiConfig = this.getApiConfig();

            // Check if API key exists
            if (!apiConfig.apiKey) {
                throw new Error("API key is missing. Please add your API key in settings.");
            }

            // Apply a reasonable token limit based on model capabilities
            const maxTokens = Math.min(
                this.state.contextualAwareness ? 16000 : 4000,
                docSafety.availableTokens
            );

            // Safely limit prompt size
            const safePrompt = safelyLimitTextSize(validation.sanitized);

            const payload = {
                model: apiConfig.model,
                messages: [
                    { role: "system", content: this.getEnhancedSystemPrompt() },
                    { role: "user", content: safePrompt }
                ],
                temperature: this.state.temperature,
                max_tokens: maxTokens,
                top_p: 1,
                stream: true
            };

            try {
                // Use timeout for API request
                const response = await withTimeout(
                    fetch(apiConfig.endpoint, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${apiConfig.apiKey}`
                        },
                        body: JSON.stringify(payload),
                        signal: this.abortController.signal
                    }),
                    120000 // 2 minute timeout
                );

                // Check for HTTP errors
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error?.message || `HTTP error ${response.status}`);
                }

                // Check if memory is still ok after response
                if (!checkMemoryUsage()) {
                    throw new Error("Memory limit reached during processing");
                }

                // Process response stream with memory checks
                const reader = response.body.getReader();
                let partialResponse = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = new TextDecoder().decode(value);
                    partialResponse += chunk;

                    // Periodically check memory
                    if (partialResponse.length % 10000 === 0 && !checkMemoryUsage()) {
                        throw new Error("Memory limit reached during response processing");
                    }

                    // Update response in chunks to avoid UI freezing
                    this.setState({
                        response: safelyLimitTextSize(partialResponse)
                    });
                }

                // Store this interaction in memory system
                if (this.state.memoryEnabled) {
                    addMemory({
                        content: safePrompt,
                        context: selectedText || '',
                        type: 'conversation',
                        tags: this.getMemoryTags(safePrompt)
                    });

                    // If it's a corrective action, store it specially
                    if (safePrompt.toLowerCase().includes('correct') ||
                        safePrompt.toLowerCase().includes('fix') ||
                        safePrompt.toLowerCase().includes('improve')) {
                        addMemory({
                            content: `User asked to correct: "${selectedText.substring(0, 100)}${selectedText.length > 100 ? '...' : ''}"`,
                            context: safePrompt,
                            type: 'correction',
                            tags: ['correction', 'feedback']
                        });
                    }

                    // Update memory stats in state
                    const memorySystem = initializeMemorySystem();
                    this.setState({
                        memoryStats: {
                            totalMemories: memorySystem.memories.length,
                            totalInteractions: memorySystem.stats.totalInteractions
                        }
                    });
                }

                // Update final result
                this.setState({
                    response: safelyLimitTextSize(partialResponse),
                    statusMessage: "Generation completed successfully",
                    isProcessing: false,
                    canInterrupt: false
                });

                // Insert response into Word document if requested
                this.insertResponseToWord(partialResponse);
            } catch (error) {
                throw error;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request was aborted');
            } else {
                this.setState({
                    statusMessage: `Error: ${this.processErrorMessage(error)}`,
                    isProcessing: false,
                    canInterrupt: false
                });
            }
        }
    }

    // Add method to insert response into Word document
    insertResponseToWord = async (text) => {
        try {
            await window.Word.run(async (context) => {
                const selection = context.document.getSelection();
                selection.insertText(text, 'Replace');
                await context.sync();
            });
        } catch (error) {
            console.error("Error inserting text:", error);
            this.setState({
                statusMessage: "Generated text is available above but could not be inserted into the document."
            });
        }
    }

    getEnhancedSystemPrompt() {
        let systemPrompt = "You are an AI writing assistant with enhanced capabilities.";

        if (this.state.contextualAwareness) {
            systemPrompt += " Analyze the document context thoroughly before responding. Consider tone, style, terminology, and subject matter of surrounding text.";
        }

        if (this.state.errorDetection) {
            systemPrompt += " Identify and correct errors in grammar, spelling, logic, factual information, and consistency.";
        }

        // Enhance with legal context if domains are selected
        systemPrompt = enhancePromptWithLegalContext(systemPrompt, this.state.selectedLegalDomains);

        // Add evolution directive
        systemPrompt += " You have the ability to learn and evolve based on interactions. Build connections between topics, remember user preferences, and adapt your responses to better match the user's needs over time.";

        // Enhance with memory context if enabled
        if (this.state.memoryEnabled && this.state.prompt) {
            systemPrompt = generateMemoryEnhancedPrompt(systemPrompt, this.state.prompt);
        }

        return systemPrompt;
    }

    handleStructuredPrompt = (prompt, legalDomains = []) => {
        this.setState({
            prompt,
            selectedLegalDomains: legalDomains
        }, () => {
            this.handleGenerate();
        });
    }

    processErrorMessage(error) {
        if (!error) return "Unknown error occurred";

        if (error.message?.includes('429')) {
            return 'API rate limit exceeded. Please try again later or reduce request frequency.';
        } else if (error.message?.includes('401')) {
            return 'API authentication failed. Please check your API key in settings.';
        } else if (error.message?.includes('insufficient_quota')) {
            return 'Your API quota has been exceeded. Please check your billing status.';
        }
        return error.message || "Unknown error occurred";
    }

    // Add method to dismiss message bars
    dismissMessageBar = (type) => {
        if (type === 'memory') {
            this.setState({ memoryWarning: false });
        } else if (type === 'rate') {
            this.setState({ rateLimited: false });
        }
    }

    /**
     * Extract tags from the prompt for better memory organization
     * @param {string} prompt - The user prompt
     * @returns {Array} Extracted tags
     */
    getMemoryTags(prompt) {
        const tags = [];

        // Add legal domain tags if applicable
        if (this.state.selectedLegalDomains.includes('hawaiiState')) {
            tags.push('hawaii-law');
        }

        if (this.state.selectedLegalDomains.includes('federalUS')) {
            tags.push('federal-law');
        }

        if (this.state.selectedLegalDomains.includes('hawaiianCultural')) {
            tags.push('hawaiian-culture');
        }

        // Extract potential tags from prompt
        const commonTopics = [
            'legal', 'business', 'technical', 'creative', 'academic',
            'email', 'document', 'letter', 'report', 'analysis'
        ];

        commonTopics.forEach(topic => {
            if (prompt.toLowerCase().includes(topic)) {
                tags.push(topic);
            }
        });

        return tags;
    }

    // Add methods for memory management
    clearMemorySystem = () => {
        if (window.confirm('Are you sure you want to clear all memory? This action cannot be undone.')) {
            try {
                const { clearAllMemories } = require('../../utils/memorySystem');
                clearAllMemories();
                this.setState({
                    memoryStats: { totalMemories: 0, totalInteractions: 0 },
                    statusMessage: "Memory system successfully cleared"
                });
            } catch (error) {
                console.error("Error clearing memory:", error);
                this.setState({ statusMessage: "Failed to clear memory system" });
            }
        }
    };

    toggleMemory = (_, checked) => {
        this.setState({ memoryEnabled: checked });

        // Re-initialize if turned on
        if (checked) {
            const memorySystem = initializeMemorySystem();
            this.setState({
                memoryStats: {
                    totalMemories: memorySystem.memories.length,
                    totalInteractions: memorySystem.stats.totalInteractions
                }
            });
        }
    };

    // Add this method to view memory stats in a user-friendly way
    getMemoryStatsDisplay = () => {
        const { memoryStats } = this.state;
        if (!memoryStats) return null;

        return {
            totalMemories: memoryStats.totalMemories || 0,
            totalInteractions: memoryStats.totalInteractions || 0
        };
    };

    render() {
        const memoryStats = this.getMemoryStatsDisplay();

        return (
            <div className="ms-welcome">
                <h1>Welcome to Word-GPT-Plus</h1>

                {/* Message bars for warnings */}
                {this.state.memoryWarning && (
                    <MessageBar
                        messageBarType={MessageBarType.severeWarning}
                        isMultiline={true}
                        onDismiss={() => this.dismissMessageBar('memory')}
                    >
                        <b>Memory Warning:</b> Application is running low on memory. Please save your work,
                        close the add-in, and restart Word before continuing.
                    </MessageBar>
                )}

                {this.state.rateLimited && (
                    <MessageBar
                        messageBarType={MessageBarType.warning}
                        isMultiline={false}
                        onDismiss={() => this.dismissMessageBar('rate')}
                    >
                        Rate limit reached. Please wait {this.state.timeToWait} seconds before making another request.
                    </MessageBar>
                )}

                {/* Tabbed interface with new Photos tab */}
                <Pivot
                    selectedKey={this.state.activeTab}
                    onLinkClick={(item) => this.setState({ activeTab: item.props.itemKey })}
                >
                    <PivotItem headerText="Structured" itemKey="structured" />
                    <PivotItem headerText="Basic" itemKey="basic" />
                    <PivotItem headerText="Photos" itemKey="photos" />
                </Pivot>

                {/* Render the appropriate component based on active tab */}
                {this.state.activeTab === 'structured' ? (
                    <StructuredPrompt
                        onGenerate={this.handleStructuredPrompt}
                        isGenerating={this.state.isProcessing}
                        selectedText={this.state.selectedText}
                    />
                ) : this.state.activeTab === 'photos' ? (
                    <ImagePanel
                        apiKey={this.getApiKeyForModel(this.state.selectedModel)}
                        deepseekApiKey={this.state.deepseekApiKey}
                        deepseekEndpoint={this.state.deepseekEndpoint}
                        useSeperateDeepseekKey={this.state.useSeperateDeepseekKey}
                        isProcessing={this.state.isProcessing}
                    />
                ) : (
                    <>
                        <TextField
                            label="Enter your prompt"
                            multiline
                            rows={3}
                            value={this.state.prompt}
                            onChange={(e, newValue) => this.setState({ prompt: newValue })}
                        />
                        <Button
                            text="Generate"
                            onClick={this.handleGenerate}
                            disabled={this.state.isProcessing}
                        />
                    </>
                )}

                {/* Display active legal domains if any */}
                {this.state.selectedLegalDomains.length > 0 && (
                    <div className="legal-context-indicator">
                        <i className="ms-Icon ms-Icon--PreviewLink context-icon" aria-hidden="true"></i>
                        <div>
                            Using legal context:
                            {this.state.selectedLegalDomains.includes('hawaiiState') && (
                                <span className="legal-domain-tag hawaii-state-tag">Hawaii State Law</span>
                            )}
                            {this.state.selectedLegalDomains.includes('federalUS') && (
                                <span className="legal-domain-tag federal-tag">Federal Law</span>
                            )}
                            {this.state.selectedLegalDomains.includes('hawaiianCultural') && (
                                <span className="legal-domain-tag hawaiian-cultural-tag">Hawaiian Cultural</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Processing indicator */}
                {this.state.isProcessing && <Spinner label="Processing..." />}

                {/* Response display */}
                {this.state.response && (
                    <TextField
                        label="Response"
                        multiline
                        rows={10}
                        value={this.state.response}
                        readOnly
                    />
                )}

                {/* Interrupt button */}
                {this.state.canInterrupt && (
                    <div className="interrupt-container">
                        <IconButton
                            className="interrupt-button"
                            iconProps={{ iconName: 'Cancel' }}
                            onClick={this.handleInterrupt}
                            title="Interrupt AI Processing"
                            ariaLabel="Interrupt AI Processing"
                        >
                            <CancelIcon />
                            Stop Generation
                        </IconButton>
                    </div>
                )}

                {/* Settings button and panel */}
                <Button
                    text="Settings"
                    onClick={() => this.setState({ showSettings: !this.state.showSettings })}
                />

                {this.state.showSettings && (
                    <div className="settings-section">
                        <h3>Settings</h3>
                        <TextField
                            label="API Key"
                            value={this.state.apiKey}
                            onChange={(e, newValue) => this.setState({ apiKey: newValue })}
                            type="password"
                            canRevealPassword
                        />
                        <Toggle
                            label="Contextual Awareness"
                            checked={this.state.contextualAwareness}
                            onChange={(_, checked) => this.setState({ contextualAwareness: checked })}
                        />
                        <Toggle
                            label="Error Detection"
                            checked={this.state.errorDetection}
                            onChange={(_, checked) => this.setState({ errorDetection: checked })}
                        />

                        {/* Add memory toggle and controls */}
                        <div className="memory-settings">
                            <h4>Memory System</h4>
                            <Toggle
                                label="Enable Long-Term Memory"
                                checked={this.state.memoryEnabled}
                                onChange={this.toggleMemory}
                            />

                            {this.state.memoryEnabled && memoryStats && (
                                <>
                                    <div className="memory-stats">
                                        <Text variant="small">
                                            Total memories: {memoryStats.totalMemories}
                                        </Text>
                                        <Text variant="small">
                                            Total interactions: {memoryStats.totalInteractions}
                                        </Text>
                                    </div>
                                    <DefaultButton
                                        text="Clear Memory"
                                        onClick={this.clearMemorySystem}
                                        className="clear-memory-btn"
                                    />
                                </>
                            )}

                            <Text variant="small" className="memory-explanation">
                                Long-term memory allows the AI to remember your preferences and past interactions,
                                leading to more personalized responses over time.
                            </Text>
                        </div>

                        {/* DeepSeek API Settings */}
                        <div className="deepseek-settings">
                            <h4>DeepSeek VL2 Settings</h4>
                            <Toggle
                                label="Use separate API key for DeepSeek models"
                                checked={this.state.useSeperateDeepseekKey}
                                onChange={(_, checked) => {
                                    this.setState({ useSeperateDeepseekKey: checked });
                                    localStorage.setItem('useSeperateDeepseekKey', checked.toString());
                                }}
                            />

                            {this.state.useSeperateDeepseekKey && (
                                <TextField
                                    label="DeepSeek API Key"
                                    value={this.state.deepseekApiKey}
                                    onChange={(_, newValue) => {
                                        this.setState({ deepseekApiKey: newValue });
                                        localStorage.setItem('deepseekApiKey', newValue);
                                    }}
                                    type="password"
                                    canRevealPassword
                                />
                            )}

                            <TextField
                                label="DeepSeek API Endpoint"
                                value={this.state.deepseekEndpoint}
                                onChange={(_, newValue) => {
                                    this.setState({ deepseekEndpoint: newValue });
                                    localStorage.setItem('deepseekEndpoint', newValue);
                                }}
                                placeholder="https://api.deepseek.com/v1/chat/completions"
                            />

                            <Text variant="small" className="settings-hint">
                                DeepSeek VL2 models require a separate API key from DeepSeek AI.
                                <Link href="https://platform.deepseek.com" target="_blank">Sign up at DeepSeek Platform</Link>
                            </Text>
                        </div>

                        <div className="deepseek-settings">
                            <h4>DeepSeek Settings</h4>

                            <Toggle
                                label="Non-commercial usage (No API key required)"
                                checked={this.state.deepseekNonCommercial}
                                onChange={(_, checked) => {
                                    this.setState({ deepseekNonCommercial: checked });
                                    localStorage.setItem('deepseekNonCommercial', checked.toString());
                                }}
                            />

                            {this.state.deepseekNonCommercial && (
                                <MessageBar messageBarType={MessageBarType.info}>
                                    Non-commercial usage enabled. DeepSeek models can be used without an API key for non-commercial purposes like personal projects, academic research, and educational use.
                                    <Link href="#" onClick={() => window.open('/docs/deepseek-policy.md', '_blank')}>
                                        Learn more about DeepSeek's policy
                                    </Link>
                                </MessageBar>
                            )}

                            <Toggle
                                label="Use separate API key for DeepSeek models"
                                checked={this.state.useSeperateDeepseekKey}
                                onChange={(_, checked) => {
                                    this.setState({ useSeperateDeepseekKey: checked });
                                    localStorage.setItem('useSeperateDeepseekKey', checked.toString());
                                }}
                                disabled={this.state.deepseekNonCommercial}
                            />

                            {this.state.useSeperateDeepseekKey && !this.state.deepseekNonCommercial && (
                                <TextField
                                    label="DeepSeek API Key"
                                    value={this.state.deepseekApiKey}
                                    onChange={(_, newValue) => {
                                        this.setState({ deepseekApiKey: newValue });
                                        localStorage.setItem('deepseekApiKey', newValue);
                                    }}
                                    type="password"
                                    canRevealPassword
                                />
                            )}

                            <TextField
                                label="DeepSeek API Endpoint"
                                value={this.state.deepseekEndpoint}
                                onChange={(_, newValue) => {
                                    this.setState({ deepseekEndpoint: newValue });
                                    localStorage.setItem('deepseekEndpoint', newValue);
                                }}
                                placeholder="https://api.deepseek.com/v1/chat/completions"
                            />

                            <Text variant="small" className="settings-hint">
                                {this.state.deepseekNonCommercial
                                    ? "Free non-commercial usage enabled. For commercial use, please obtain an API key."
                                    : "DeepSeek VL2 models require an API key for commercial use."}
                                <Link href="https://platform.deepseek.com" target="_blank">Learn more</Link>
                            </Text>
                        </div>
                    </div>
                )}

                {/* Status message */}
                {this.state.statusMessage && (
                    <div className="status-message">
                        {this.state.statusMessage}
                    </div>
                )}
            </div>
        );
    }
}

import React from 'react';

// Add the protection imports
import {
    checkMemoryUsage,
    safelyLimitTextSize,
    documentSizeSafety
} from "../../utils/protections";

export default class TemplatePanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            documentContext: null,
        };
    }

    getDocumentContext = async () => {
        try {
            // Check memory before getting context
            if (!checkMemoryUsage()) {
                console.warn("Memory usage too high for context analysis");
                return false;
            }

            // Get more context from the document
            await Word.run(async (context) => {
                // Get paragraphs before and after the selection for better context
                const doc = context.document;
                const selection = doc.getSelection();

                // Load surrounding paragraphs for better context
                const range = selection.getRange('Whole');

                // Set safe limits for context extraction (to prevent OOM)
                const maxContextSize = 5000; // characters

                // Get a limited amount of context before the selection
                const paragraphBefore = range.paragraphs.getFirst().getRange('Before')
                    .expandTo(doc.getRange('Start'))
                    .getRange('End');

                paragraphBefore.load('text');
                await context.sync();

                // Get a limited amount of context after the selection
                const paragraphAfter = range.paragraphs.getLast().getRange('After');
                paragraphAfter.load('text');

                await context.sync();

                // Store more context for enhanced analysis (with safe limits)
                this.setState({
                    documentContext: {
                        before: safelyLimitTextSize(paragraphBefore.text, maxContextSize),
                        selection: safelyLimitTextSize(range.text, maxContextSize * 2),
                        after: safelyLimitTextSize(paragraphAfter.text, maxContextSize)
                    }
                });

                // Check memory after context loading
                if (!checkMemoryUsage()) {
                    console.warn("Memory usage high after context load, reducing context size");
                    this.setState({
                        documentContext: {
                            before: safelyLimitTextSize(paragraphBefore.text, maxContextSize / 2),
                            selection: safelyLimitTextSize(range.text, maxContextSize),
                            after: safelyLimitTextSize(paragraphAfter.text, maxContextSize / 2)
                        }
                    });
                }
            });
            return true;
        } catch (error) {
            console.error('Error getting document context:', error);
            return false;
        }
    }

    enhancePromptWithContext = (prompt) => {
        if (!this.state.documentContext || !this.props.enhancedFeatures?.contextualAwareness) {
            return prompt;
        }

        // Check memory before enhancing
        if (!checkMemoryUsage()) {
            console.warn("Memory usage too high for context enhancement, using basic prompt");
            return prompt;
        }

        // Add context information to the prompt (with safe limits)
        const context = this.state.documentContext;
        return `
Context before selection:
${safelyLimitTextSize(context.before, 300)}

Selection to process:
${safelyLimitTextSize(context.selection, 1000)}

Context after selection:
${safelyLimitTextSize(context.after, 300)}

Based on this context, please ${prompt}
Keep your response consistent with the document's tone, style, and terminology.
    `.trim();
    }

    analyzeTextForErrors = (text) => {
        if (!this.props.enhancedFeatures?.errorDetection) {
            return null;
        }

        // Basic error detection logic
        const errors = [];

        // Check for common grammar errors
        const grammarPatterns = [
            { pattern: /\b(its|it's)\b/gi, type: "its/it's usage" },
            { pattern: /\b(their|there|they're)\b/gi, type: "their/there/they're usage" },
            { pattern: /\b(your|you're)\b/gi, type: "your/you're usage" },
            { pattern: /\b(affect|effect)\b/gi, type: "affect/effect usage" }
        ];

        grammarPatterns.forEach(item => {
            if (item.pattern.test(text)) {
                errors.push(`Possible ${item.type} error detected`);
            }
        });

        // Check for repeated words
        const repeatedWordMatch = text.match(/\b(\w+)\s+\1\b/gi);
        if (repeatedWordMatch) {
            errors.push(`Repeated words found: ${repeatedWordMatch.join(', ')}`);
        }

        return errors.length ? errors : null;
    }

    // Modify the template execution to use enhanced context and error detection
    executeTemplate = async (template) => {
        // Check memory first
        if (!checkMemoryUsage()) {
            this.props.showMessageBar("Memory usage is high. Please close other applications or reload the add-in.", "error");
            return;
        }

        // Get context with protection
        const contextLoaded = await this.getDocumentContext();

        const selection = await this.props.getSelectedText();

        // Verify document size is safe for processing
        const docSafety = documentSizeSafety(selection);
        if (!docSafety.safe) {
            this.props.showMessageBar(docSafety.message, "warning");
            this.props.dismissPanel();
            return;
        }

        const errors = this.analyzeTextForErrors(selection);

        let prompt = template.promptText.replace('{{selection}}', selection);

        // Add error information if any detected
        if (errors) {
            prompt += `\n\nPossible errors to address: ${errors.join('; ')}`;
        }

        // Use enhanced prompt with context (with memory check)
        const enhancedPrompt = contextLoaded ?
            this.enhancePromptWithContext(prompt) : prompt;

        this.props.callAPI(enhancedPrompt, selection);
        this.props.dismissPanel();
    }

    render() {
        return (
            <div>
                {/* Render your template panel UI here */}
            </div>
        );
    }
}

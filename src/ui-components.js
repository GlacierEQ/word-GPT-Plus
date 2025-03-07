/**
 * Word GPT Plus - UI Components
 * Reusable UI components for consistent experience
 */

class UIComponents {
    constructor() {
        // Component registry
        this.components = {};

        // Component types
        this.componentTypes = {
            MODAL: 'modal',
            DROPDOWN: 'dropdown',
            TABS: 'tabs',
            TOOLTIP: 'tooltip',
            NOTIFICATION: 'notification'
        };

        // Active elements
        this.activeElements = {
            modals: [],
            tooltips: [],
            notifications: []
        };

        // Theme configuration
        this.theme = {
            primary: '#0078d4',
            secondary: '#2b88d8',
            danger: '#d13438',
            success: '#107c10',
            warning: '#ffb900',
            neutral: '#605e5c',
            background: '#ffffff',
            text: '#323130',
            textLight: '#605e5c',
            border: '#edebe9',
            borderDark: '#8a8886'
        };

        // Initialize
        this.setupGlobalStyles();
        this.setupEventHandlers();
    }

    /**
     * Set up global styles
     */
    setupGlobalStyles() {
        // Check if styles already exist
        if (document.getElementById('word-gpt-plus-styles')) {
            return;
        }

        const styleSheet = document.createElement('style');
        styleSheet.id = 'word-gpt-plus-styles';
        styleSheet.textContent = `
            .wgp-modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
            }
        `;
        document.head.appendChild(styleSheet);
    }

    /**
     * Set up event handlers
     */
    setupEventHandlers() {
        // Event handlers for UI components
    }

    /**
     * Create a modal
     * @param {string} title - Modal title
     * @param {string} content - Modal content
     * @param {string} footerContent - Modal footer content
     */
    createModal(title, content, footerContent) {
        // Create modal element and append to body
        const modalId = `modal-${Date.now()}`;

        // Use template literals for dynamic HTML generation
        const modalHTML = `
            <div class="wgp-modal" id="${modalId}">
                <div class="wgp-modal-content">
                    <div class="wgp-modal-header">
                        <h2>${title}</h2>
                        <button class="wgp-modal-close">&times;</button>
                    </div>
                    <div class="wgp-modal-body">
                        ${content}
                    </div>
                    <div class="wgp-modal-footer">
                        ${footerContent}
                    </div>
                </div>
            </div>
        `;

        // Append to body and return the modal element
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        return document.getElementById(modalId);
    }
}
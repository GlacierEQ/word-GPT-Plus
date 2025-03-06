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
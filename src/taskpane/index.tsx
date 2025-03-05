import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import { initializeSettings } from '../services/settings/settingsManager';
import './styles/index.css';

/* global document, Office, module */

// Initialize Office JS
Office.onReady(info => {
    if (info.host === Office.HostType.Word) {
        // Initialize settings first
        initializeSettings();

        // Then render the app
        const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
    }
});

// Handle errors during initialization
const handleError = (error: Error) => {
    console.error('Error during initialization:', error);

    // Display an error UI
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = `
      <div style="padding: 20px; color: #a80000;">
        <h2>Failed to initialize Word-GPT-Plus</h2>
        <p>${error.message}</p>
        <button onclick="location.reload()">Try Again</button>
      </div>
    `;
    }
};

// Add global error handler
window.onerror = (message, source, lineno, colno, error) => {
    handleError(error || new Error(message as string));
    return true;
};

// Also catch unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
    handleError(event.reason);
});

// Enable Hot Module Replacement (HMR)
if (module.hot) {
    module.hot.accept('./components/App', () => {
        console.log('Hot-reloading App component...');
        const NextApp = require('./components/App').default;

        const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
        root.render(
            <React.StrictMode>
                <NextApp />
            </React.StrictMode>
        );
    });
}

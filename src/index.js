import 'office-ui-fabric-react/dist/css/fabric.min.css';
import './taskpane/taskpane.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

/* global document, Office */

Office.onReady(() => {
    // Office is ready
    const container = document.getElementById('root');
    const root = createRoot(container);
    root.render(<App />);
});

// Register add-in error handling
window.onerror = (message, source, lineNumber, columnNumber, error) => {
    console.error('Unhandled error in Word-GPT-Plus:', { message, source, lineNumber, columnNumber, error });

    // You could implement error reporting here

    // Don't prevent default error handling
    return false;
};

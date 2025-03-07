/**
 * Word GPT Plus - Error Handler
 * Centralized error handling and logging
 */

class ErrorHandler {
    constructor() {
        // Error categories
        this.categories = {
            API: 'api_error',
            UI: 'ui_error',
            SYSTEM: 'system_error',
            SECURITY: 'security_error',
            DATA: 'data_error',
            NETWORK: 'network_error',
            UNKNOWN: 'unknown_error'
        };

        // Error storage for analytics
        this.recentErrors = [];
        this.maxStoredErrors = 50;

        // Error handlers by category
        this.handlers = {};

        // Register default handlers
        this._registerDefaultHandlers();

        // Initialize error event listeners
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }

    /**
     * Register default error handlers
     * @private
     */
    _registerDefaultHandlers() {
        // Register default handler for each category
        Object.values(this.categories).forEach(category => {
            this.handlers[category] = [(error, metadata) => {
                this._logError(error, category, metadata);
                return true; // Error handled
            }];
        });
    }

    /**
     * Handle an error with appropriate category
     * @param {Error|string} error - Error object or message
     * @param {string} category - Error category
     * @param {Object} [metadata={}] - Additional error metadata
     * @returns {boolean} Whether the error was handled
     */
    handleError(error, category, metadata = {}) {
        // Convert string errors to Error objects
        if (typeof error === 'string') {
            error = new Error(error);
        }

        // Default to unknown category if invalid
        if (!Object.values(this.categories).includes(category)) {
            category = this.categories.UNKNOWN;
        }

        // Add timestamp to metadata
        metadata.timestamp = new Date().toISOString();

        // Store error info
        this._storeError(error, category, metadata);

        // Process handlers for this category
        let handled = false;

        if (this.handlers[category]) {
            // Try each handler until one returns true
            for (const handler of this.handlers[category]) {
                try {
                    if (handler(error, metadata) === true) {
                        handled = true;
                        break;
                    }
                } catch (handlerError) {
                    console.error('Error in error handler:', handlerError);
                }
            }
        }

        // If not handled by specific handlers, use default logging
        if (!handled) {
            this._logError(error, category, metadata);
        }

        return handled;
    }

    /**
     * Register a custom error handler for a category
     * @param {string} category - Error category
     * @param {Function} handler - Error handler function
     * @param {boolean} [prepend=false] - Whether to prepend handler to list
     * @returns {boolean} Success status
     */
    registerHandler(category, handler, prepend = false) {
        if (!Object.values(this.categories).includes(category)) {
            return false;
        }

        if (typeof handler !== 'function') {
            return false;
        }

        if (!this.handlers[category]) {
            this.handlers[category] = [];
        }

        if (prepend) {
            this.handlers[category].unshift(handler);
        } else {
            this.handlers[category].push(handler);
        }

        return true;
    }

    /**
     * Handle global error event
     * @param {ErrorEvent} event - Error event
     */
    handleGlobalError(event) {
        const metadata = {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        };

        // Prevent default browser error handling
        event.preventDefault();

        // Handle the error
        this.handleError(event.error || event.message, this.categories.SYSTEM, metadata);
    }

    /**
     * Handle unhandled promise rejection
     * @param {PromiseRejectionEvent} event - Rejection event
     */
    handleUnhandledRejection(event) {
        const error = event.reason;
        const category = this._detectErrorCategory(error);

        // Prevent default browser error handling
        event.preventDefault();

        // Handle the error
        this.handleError(error, category, { unhandledRejection: true });
    }

    /**
     * Detect error category based on error properties
     * @param {Error} error - Error to categorize
     * @returns {string} Error category
     * @private
     */
    _detectErrorCategory(error) {
        if (!error) return this.categories.UNKNOWN;

        const errorString = error.toString().toLowerCase();

        if (error.name === 'SecurityError' || errorString.includes('security')) {
            return this.categories.SECURITY;
        }

        if (error.name === 'NetworkError' || errorString.includes('network') ||
            errorString.includes('fetch') || errorString.includes('xhr')) {
            return this.categories.NETWORK;
        }

        if (error.name === 'SyntaxError' || error.name === 'ReferenceError') {
            return this.categories.SYSTEM;
        }

        if (errorString.includes('api') || error.status || error.statusCode) {
            return this.categories.API;
        }

        return this.categories.UNKNOWN;
    }

    /**
     * Store error information for later analysis
     * @param {Error} error - Error object
     * @param {string} category - Error category
     * @param {Object} metadata - Error metadata
     * @private
     */
    _storeError(error, category, metadata) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            category,
            metadata,
            timestamp: new Date().toISOString()
        };

        this.recentErrors.unshift(errorInfo);

        // Trim array if it exceeds maximum size
        if (this.recentErrors.length > this.maxStoredErrors) {
            this.recentErrors = this.recentErrors.slice(0, this.maxStoredErrors);
        }
    }

    /**
     * Log error with appropriate formatting
     * @param {Error} error - Error object
     * @param {string} category - Error category
     * @param {Object} metadata - Error metadata
     * @private
     */
    _logError(error, category, metadata) {
        const timestamp = new Date().toISOString();

        console.group(`[${timestamp}] ${category.toUpperCase()}`);
        console.error(error);

        if (Object.keys(metadata).length > 0) {
            console.info('Metadata:', metadata);
        }

        console.groupEnd();

        // Send error to remote logging service in production
        if (process.env.NODE_ENV === 'production') {
            this._sendErrorToRemoteService(error, category, metadata);
        }
    }

    /**
     * Send error to remote logging service
     * @param {Error} error - Error object
     * @param {string} category - Error category
     * @param {Object} metadata - Error metadata
     * @private
     */
    _sendErrorToRemoteService(error, category, metadata) {
        // This would be implemented to send errors to a remote service
        // like Application Insights, LogRocket, Sentry, etc.

        // Example implementation (commented out):
        /*
        if (window.applicationInsights) {
          try {
            window.applicationInsights.trackException({
              exception: error,
              properties: {
                category,
                ...metadata
              }
            });
          } catch (e) {
            console.error('Failed to send error to remote service', e);
          }
        }
        */
    }

    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getErrorStatistics() {
        const categoryCounts = {};

        // Initialize counts
        Object.values(this.categories).forEach(category => {
            categoryCounts[category] = 0;
        });

        // Count errors by category
        this.recentErrors.forEach(error => {
            categoryCounts[error.category] = (categoryCounts[error.category] || 0) + 1;
        });

        return {
            total: this.recentErrors.length,
            categories: categoryCounts,
            mostRecent: this.recentErrors[0] || null,
            lastErrorTime: this.recentErrors[0]?.timestamp || null
        };
    }

    /**
     * Clear stored errors
     */
    clearErrors() {
        this.recentErrors = [];
    }
}

// Create global instance
const errorHandler = new ErrorHandler();

// Export
export default errorHandler;

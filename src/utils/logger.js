/**
 * Word GPT Plus - Logger
 * Centralized logging system with different log levels and contexts
 */

class Logger {
    constructor() {
        // Log levels
        this.LEVELS = {
            TRACE: 0,   // Most detailed information
            DEBUG: 1,   // Detailed information for debugging
            INFO: 2,    // General information about program execution
            WARN: 3,    // Potential issues that aren't errors
            ERROR: 4,   // Run-time errors that don't stop the application
            FATAL: 5    // Critical errors that may cause the app to terminate
        };

        // Current log level (can be changed at runtime)
        this.currentLevel = this.LEVELS.INFO;

        // Enable storing logs in memory
        this.storeLogsEnabled = true;

        // Maximum number of logs to keep in memory
        this.maxStoredLogs = 1000;

        // Store for recent logs
        this.logs = [];

        // Log output destinations
        this.destinations = [
            {
                type: 'console',
                enabled: true,
                formatter: this._consoleFormatter.bind(this)
            }
        ];

        // Context for prefixing logs
        this.currentContext = null;
    }

    /**
     * Set the current log level
     * @param {number|string} level - Log level number or name
     */
    setLevel(level) {
        if (typeof level === 'string') {
            level = this.LEVELS[level.toUpperCase()];
        }

        if (typeof level === 'number' && level >= 0 && level <= 5) {
            this.currentLevel = level;
            this.info(`Log level set to ${this._getLevelName(level)}`);
        }
    }

    /**
     * Enable or disable storing logs in memory
     * @param {boolean} enabled - Whether to store logs
     */
    setStoreLogs(enabled) {
        this.storeLogsEnabled = Boolean(enabled);
    }

    /**
     * Clear stored logs
     */
    clearLogs() {
        this.logs = [];
    }

    /**
     * Get stored logs, optionally filtered
     * @param {Object} [options] - Filter options
     * @param {string} [options.level] - Minimum log level to include
     * @param {string} [options.context] - Filter by context
     * @param {number} [options.limit] - Maximum number of logs to return
     * @returns {Array} Filtered logs
     */
    getLogs(options = {}) {
        let filteredLogs = [...this.logs];

        // Filter by level
        if (options.level) {
            const levelValue = typeof options.level === 'string' ?
                this.LEVELS[options.level.toUpperCase()] :
                options.level;

            if (typeof levelValue === 'number') {
                filteredLogs = filteredLogs.filter(log => log.levelValue >= levelValue);
            }
        }

        // Filter by context
        if (options.context) {
            filteredLogs = filteredLogs.filter(log => log.context === options.context);
        }

        // Apply limit
        if (options.limit && typeof options.limit === 'number') {
            filteredLogs = filteredLogs.slice(0, options.limit);
        }

        return filteredLogs;
    }

    /**
     * Add a log destination
     * @param {string} type - Destination type
     * @param {Function} formatter - Log formatter function
     * @param {boolean} [enabled=true] - Whether the destination is enabled
     */
    addDestination(type, formatter, enabled = true) {
        this.destinations.push({
            type,
            formatter,
            enabled
        });
    }

    /**
     * Set logging context
     * @param {string} context - Context name
     * @returns {Logger} Logger instance for chaining
     */
    withContext(context) {
        this.currentContext = context;
        return this;
    }

    /**
     * Create a new logger with fixed context
     * @param {string} context - Context name
     * @returns {Object} Logger-like object with context
     */
    createContextLogger(context) {
        // Create a proxy object with the same methods but fixed context
        const contextLogger = {};

        // For each log level method, create a bound version with context
        Object.keys(this.LEVELS).forEach(level => {
            const method = level.toLowerCase();
            contextLogger[method] = (...args) => {
                return this.withContext(context)[method](...args);
            };
        });

        // Add special methods
        contextLogger.withContext = (newContext) => {
            return this.createContextLogger(`${context}:${newContext}`);
        };

        return contextLogger;
    }

    /**
     * Log a message at TRACE level
     * @param {string} message - Log message
     * @param {Object} [data] - Additional data
     */
    trace(message, data) {
        this._log(this.LEVELS.TRACE, message, data);
    }

    /**
     * Log a message at DEBUG level
     * @param {string} message - Log message
     * @param {Object} [data] - Additional data
     */
    debug(message, data) {
        this._log(this.LEVELS.DEBUG, message, data);
    }

    /**
     * Log a message at INFO level
     * @param {string} message - Log message
     * @param {Object} [data] - Additional data
     */
    info(message, data) {
        this._log(this.LEVELS.INFO, message, data);
    }

    /**
     * Log a message at WARN level
     * @param {string} message - Log message
     * @param {Object} [data] - Additional data
     */
    warn(message, data) {
        this._log(this.LEVELS.WARN, message, data);
    }

    /**
     * Log a message at ERROR level
     * @param {string} message - Log message
     * @param {Object} [data] - Additional data
     */
    error(message, data) {
        this._log(this.LEVELS.ERROR, message, data);
    }

    /**
     * Log a message at FATAL level
     * @param {string} message - Log message
     * @param {Object} [data] - Additional data
     */
    fatal(message, data) {
        this._log(this.LEVELS.FATAL, message, data);
    }

    /**
     * Internal method to log a message
     * @param {number} level - Log level
     * @param {string} message - Log message
     * @param {Object} [data] - Additional data
     * @private
     */
    _log(level, message, data) {
        // Skip if below current log level
        if (level < this.currentLevel) {
            return;
        }

        const timestamp = new Date();
        const levelName = this._getLevelName(level);

        // Create log entry
        const logEntry = {
            timestamp,
            level: levelName,
            levelValue: level,
            message,
            data,
            context: this.currentContext
        };

        // Store log if enabled
        if (this.storeLogsEnabled) {
            this.logs.unshift(logEntry);

            // Trim logs if exceeding max size
            if (this.logs.length > this.maxStoredLogs) {
                this.logs = this.logs.slice(0, this.maxStoredLogs);
            }
        }

        // Output to each destination
        this.destinations.forEach(dest => {
            if (dest.enabled) {
                dest.formatter(logEntry);
            }
        });

        // Reset context after logging
        this.currentContext = null;
    }

    /**
     * Get level name from level value
     * @param {number} level - Log level value
     * @returns {string} Level name
     * @private
     */
    _getLevelName(level) {
        return Object.keys(this.LEVELS).find(key => this.LEVELS[key] === level) || 'UNKNOWN';
    }

    /**
     * Format log entry for console output
     * @param {Object} logEntry - Log entry
     * @private
     */
    _consoleFormatter(logEntry) {
        const { timestamp, level, message, data, context } = logEntry;

        const time = timestamp.toISOString();
        const contextStr = context ? `[${context}] ` : '';

        // Use different console methods based on level
        let consoleMethod;
        switch (level) {
            case 'TRACE':
            case 'DEBUG':
                consoleMethod = console.debug;
                break;
            case 'INFO':
                consoleMethod = console.info;
                break;
            case 'WARN':
                consoleMethod = console.warn;
                break;
            case 'ERROR':
            case 'FATAL':
                consoleMethod = console.error;
                break;
            default:
                consoleMethod = console.log;
        }

        // Format the log message
        const formattedMessage = `[${time}] [${level}] ${contextStr}${message}`;

        if (data) {
            consoleMethod(formattedMessage, data);
        } else {
            consoleMethod(formattedMessage);
        }
    }
}

// Create global instance
const logger = new Logger();

// Export
export default logger;

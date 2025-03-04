/**
 * Utilities for performance monitoring and optimization
 */

// Track long operations
const operationTimers = new Map();
const operationStats = new Map();

/**
 * Start timing an operation
 * @param {string} operationName - Name of the operation to track
 */
export function startTiming(operationName) {
    operationTimers.set(operationName, performance.now());
}

/**
 * End timing an operation and record stats
 * @param {string} operationName - Name of the operation to track
 * @param {Object} metadata - Additional metadata about the operation
 */
export function endTiming(operationName, metadata = {}) {
    if (!operationTimers.has(operationName)) return;

    const startTime = operationTimers.get(operationName);
    const duration = performance.now() - startTime;

    // Delete the timer
    operationTimers.delete(operationName);

    // Record stats
    if (!operationStats.has(operationName)) {
        operationStats.set(operationName, {
            count: 0,
            totalDuration: 0,
            min: Infinity,
            max: 0,
            recent: []
        });
    }

    const stats = operationStats.get(operationName);
    stats.count++;
    stats.totalDuration += duration;
    stats.min = Math.min(stats.min, duration);
    stats.max = Math.max(stats.max, duration);

    // Keep track of recent timings (last 10)
    stats.recent.push({
        timestamp: new Date(),
        duration,
        ...metadata
    });
    if (stats.recent.length > 10) {
        stats.recent.shift();
    }

    // Log slow operations (over 1000ms)
    if (duration > 1000) {
        console.warn(`Slow operation: ${operationName} took ${duration.toFixed(2)}ms`, metadata);
    }
}

/**
 * Get performance statistics for operations
 * @returns {Object} Performance statistics
 */
export function getPerformanceStats() {
    const result = {};

    operationStats.forEach((stats, operationName) => {
        result[operationName] = {
            count: stats.count,
            avgDuration: stats.totalDuration / stats.count,
            min: stats.min,
            max: stats.max,
            recent: stats.recent
        };
    });

    return result;
}

/**
 * Clear performance statistics
 */
export function clearPerformanceStats() {
    operationStats.clear();
}

/**
 * Debounce function to limit frequency of calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in ms
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
    let lastCall = 0;

    return function executedFunction(...args) {
        const now = Date.now();

        if (now - lastCall >= limit) {
            lastCall = now;
            func(...args);
        }
    };
}

/**
 * Track memory usage
 * @returns {Object|null} Memory usage stats if available
 */
export function getMemoryUsage() {
    if (performance && performance.memory) {
        return {
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            percentUsed: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
        };
    }

    return null;
}

/**
 * Resource URL tracker for proper cleanup
 */
export const resourceTracker = {
    urls: new Set(),

    /**
     * Create and track an object URL
     * @param {Blob} blob - Blob to create URL from
     * @returns {string} Object URL
     */
    createObjectURL(blob) {
        const url = URL.createObjectURL(blob);
        this.urls.add(url);
        return url;
    },

    /**
     * Revoke a tracked object URL
     * @param {string} url - URL to revoke
     */
    revokeObjectURL(url) {
        if (this.urls.has(url)) {
            URL.revokeObjectURL(url);
            this.urls.delete(url);
        }
    },

    /**
     * Revoke all tracked object URLs
     */
    revokeAll() {
        this.urls.forEach(url => {
            URL.revokeObjectURL(url);
        });
        this.urls.clear();
    }
};

/**
 * Clean up resources when component unmounts
 * @returns {Function} Cleanup function for useEffect
 */
export function useResourceCleanup() {
    return () => {
        resourceTracker.revokeAll();
    };
}

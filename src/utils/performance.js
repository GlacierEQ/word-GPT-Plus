/**
 * Utilities for tracking performance in Word-GPT-Plus
 */

// Store for timing data
const timings = {};

// Store for resource tracking
export const resourceTracker = {
    resources: new Set(),

    // Track a resource that needs to be released later
    track(resource) {
        this.resources.add(resource);
        return resource;
    },

    // Revoke a specific resource
    revoke(resource) {
        if (this.resources.has(resource)) {
            if (resource instanceof Blob) {
                URL.revokeObjectURL(resource);
            } else if (typeof resource.release === 'function') {
                resource.release();
            } else if (typeof resource.dispose === 'function') {
                resource.dispose();
            } else if (typeof resource.close === 'function') {
                resource.close();
            }
            this.resources.delete(resource);
        }
    },

    // Revoke all tracked resources
    revokeAll() {
        this.resources.forEach(resource => {
            try {
                this.revoke(resource);
            } catch (e) {
                console.error('Error revoking resource:', e);
            }
        });
        this.resources.clear();
    }
};

/**
 * Start timing an operation
 * @param {string} operationName - Name of the operation to time
 */
export function startTiming(operationName) {
    if (!window.performance) return;

    if (!timings[operationName]) {
        timings[operationName] = {
            count: 0,
            totalTime: 0,
            min: Number.MAX_SAFE_INTEGER,
            max: 0,
            current: null,
            avg: 0,
            lastTimestamp: 0
        };
    }

    timings[operationName].current = performance.now();
    timings[operationName].lastTimestamp = Date.now();
}

/**
 * End timing an operation
 * @param {string} operationName - Name of the operation
 * @param {Object} metadata - Additional metadata about the operation
 */
export function endTiming(operationName, metadata = {}) {
    if (!window.performance || !timings[operationName] || timings[operationName].current === null) return;

    const end = performance.now();
    const elapsed = end - timings[operationName].current;

    // Update timing stats
    timings[operationName].count++;
    timings[operationName].totalTime += elapsed;
    timings[operationName].min = Math.min(timings[operationName].min, elapsed);
    timings[operationName].max = Math.max(timings[operationName].max, elapsed);
    timings[operationName].avg = timings[operationName].totalTime / timings[operationName].count;
    timings[operationName].current = null;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.debug(`Performance: ${operationName} took ${elapsed.toFixed(2)}ms`, metadata);
    }
}

/**
 * Get timing statistics
 * @param {string} operationName - Optional name to get stats for a specific operation
 * @returns {Object} Timing statistics
 */
export function getTimingStats(operationName = null) {
    if (operationName) {
        return timings[operationName] || null;
    }

    // Return all timing stats
    const results = {};
    Object.keys(timings).forEach(key => {
        results[key] = { ...timings[key] };
    });

    return results;
}

/**
 * Measure memory usage
 * @returns {Object} Memory usage statistics
 */
export function getMemoryUsage() {
    if (!window.performance || !window.performance.memory) {
        return {
            available: false,
            usage: 0,
            limit: 0,
            percentUsed: 0
        };
    }

    const memoryInfo = window.performance.memory;
    return {
        available: true,
        usage: memoryInfo.usedJSHeapSize,
        limit: memoryInfo.jsHeapSizeLimit,
        percentUsed: (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
    };
}

/**
 * High-resolution timer for measuring operations
 * @param {function} fn - Function to measure
 * @param {string} label - Label for the measurement
 * @returns {any} Result of the function
 */
export function measure(fn, label) {
    startTiming(label);
    try {
        return fn();
    } finally {
        endTiming(label);
    }
}

/**
 * Async high-resolution timer
 * @param {function} asyncFn - Async function to measure
 * @param {string} label - Label for the measurement
 * @returns {Promise<any>} Result of the async function
 */
export async function measureAsync(asyncFn, label) {
    startTiming(label);
    try {
        return await asyncFn();
    } finally {
        endTiming(label);
    }
}

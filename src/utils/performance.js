/**
 * Performance monitoring utilities for Word-GPT-Plus
 */

// Store for timing measurements
const timings = {};

/**
 * Start timing a named operation
 * @param {string} name - Operation name
 */
export function startTiming(name) {
    timings[name] = {
        start: performance.now(),
        end: null,
        duration: null
    };
}

/**
 * End timing a named operation and record duration
 * @param {string} name - Operation name
 * @returns {number|null} Duration in milliseconds
 */
export function endTiming(name) {
    if (!timings[name] || !timings[name].start) {
        console.warn(`No timing started for "${name}"`);
        return null;
    }

    timings[name].end = performance.now();
    timings[name].duration = timings[name].end - timings[name].start;

    // Log the timing in development mode
    if (process.env.NODE_ENV === 'development') {
        console.log(`🕒 ${name}: ${timings[name].duration.toFixed(2)}ms`);
    }

    return timings[name].duration;
}

/**
 * Measure async operation duration
 * @param {Function} fn - Async function to measure
 * @param {string} name - Operation name
 * @returns {Promise<*>} Result of the async function
 */
export async function measureAsync(fn, name) {
    startTiming(name);
    try {
        return await fn();
    } finally {
        endTiming(name);
    }
}

/**
 * Get all recorded timings
 * @returns {Object} Timing measurements
 */
export function getAllTimings() {
    return { ...timings };
}

/**
 * Clear all timing measurements
 */
export function clearTimings() {
    Object.keys(timings).forEach(key => {
        delete timings[key];
    });
}

/**
 * Utilities for tracking performance in Word-GPT-Plus
 */

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

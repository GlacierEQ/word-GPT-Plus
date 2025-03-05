/**
 * Memory system for Word-GPT-Plus
 * Provides a way to store and retrieve memories for contextual awareness
 */

import { v4 as uuidv4 } from 'uuid';

// Storage key for memories
const MEMORY_STORAGE_KEY = 'word_gpt_plus_memories';
const MEMORY_STATS_KEY = 'word_gpt_plus_memory_stats';

// Default memory limit
const DEFAULT_MEMORY_LIMIT = 1000;

/**
 * Memory system manager
 */
class MemorySystemManager {
    constructor() {
        this.initialized = false;
        this.memories = [];
        this.stats = {
            totalInteractions: 0,
            lastAccessed: null,
            createdAt: new Date().toISOString()
        };
        this.memoryLimit = DEFAULT_MEMORY_LIMIT;
    }

    /**
     * Initialize memory system
     */
    initialize() {
        if (this.initialized) return;

        try {
            // Load memories from storage
            const storedMemories = localStorage.getItem(MEMORY_STORAGE_KEY);
            if (storedMemories) {
                this.memories = JSON.parse(storedMemories);
            }

            // Load stats from storage
            const storedStats = localStorage.getItem(MEMORY_STATS_KEY);
            if (storedStats) {
                this.stats = JSON.parse(storedStats);
            }

            this.initialized = true;
        } catch (e) {
            console.error('Error initializing memory system:', e);
            // Initialize with empty state if there was an error
            this.memories = [];
            this.stats = {
                totalInteractions: 0,
                lastAccessed: null,
                createdAt: new Date().toISOString()
            };
            this.initialized = true;
        }
    }

    /**
     * Save memories to storage
     */
    saveMemories() {
        try {
            localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(this.memories));
        } catch (e) {
            console.error('Error saving memories:', e);
        }
    }

    /**
     * Save stats to storage
     */
    saveStats() {
        try {
            localStorage.setItem(MEMORY_STATS_KEY, JSON.stringify(this.stats));
        } catch (e) {
            console.error('Error saving memory stats:', e);
        }
    }

    /**
     * Add a new memory
     * @param {Object} memory - Memory to add
     * @returns {string} Memory ID
     */
    addMemory(memory) {
        if (!this.initialized) {
            this.initialize();
        }

        // Enforce memory limit
        if (this.memories.length >= this.memoryLimit) {
            // Remove oldest memory
            this.memories.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            this.memories.shift();
        }

        const newMemory = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            type: memory.type || 'general',
            content: memory.content || '',
            context: memory.context || '',
            tags: memory.tags || [],
            metadata: memory.metadata || {},
            importance: memory.importance || 1,
            accessCount: 0,
            lastAccessed: null
        };

        this.memories.push(newMemory);

        // Update stats
        this.stats.totalInteractions++;
        this.stats.lastAccessed = new Date().toISOString();

        this.saveMemories();
        this.saveStats();

        return newMemory.id;
    }

    /**
     * Remove a memory by ID
     * @param {string} id - Memory ID
     * @returns {boolean} Success
     */
    removeMemory(id) {
        if (!this.initialized) {
            this.initialize();
        }

        const initialLength = this.memories.length;
        this.memories = this.memories.filter(memory => memory.id !== id);

        if (this.memories.length !== initialLength) {
            this.saveMemories();
            return true;
        }

        return false;
    }

    /**
     * Find memories by search criteria
     * @param {Object} criteria - Search criteria
     * @returns {Array} Matching memories
     */
    findMemories(criteria = {}) {
        if (!this.initialized) {
            this.initialize();
        }

        let results = [...this.memories];

        // Filter by type if specified
        if (criteria.type) {
            results = results.filter(memory => memory.type === criteria.type);
        }

        // Filter by tags if specified
        if (criteria.tags && criteria.tags.length > 0) {
            results = results.filter(memory => {
                return criteria.tags.some(tag => memory.tags.includes(tag));
            });
        }

        // Filter by content if specified
        if (criteria.content) {
            const contentLower = criteria.content.toLowerCase();
            results = results.filter(memory => {
                return memory.content.toLowerCase().includes(contentLower) ||
                    memory.context.toLowerCase().includes(contentLower);
            });
        }

        // Filter by date range if specified
        if (criteria.dateFrom) {
            const dateFrom = new Date(criteria.dateFrom);
            results = results.filter(memory => new Date(memory.timestamp) >= dateFrom);
        }

        if (criteria.dateTo) {
            const dateTo = new Date(criteria.dateTo);
            results = results.filter(memory => new Date(memory.timestamp) <= dateTo);
        }

        // Sort by timestamp or relevance
        if (criteria.sortBy === 'relevance' && criteria.content) {
            // Sort by relevance to content
            const contentLower = criteria.content.toLowerCase();
            results.sort((a, b) => {
                const scoreA = this.calculateRelevanceScore(a, contentLower);
                const scoreB = this.calculateRelevanceScore(b, contentLower);
                return scoreB - scoreA; // Descending order
            });
        } else {
            // Default: sort by date (newest first)
            results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }

        // Limit results if specified
        if (criteria.limit && criteria.limit > 0) {
            results = results.slice(0, criteria.limit);
        }

        // Update access counts for retrieved memories
        results.forEach(result => {
            const memory = this.memories.find(m => m.id === result.id);
            if (memory) {
                memory.accessCount++;
                memory.lastAccessed = new Date().toISOString();
            }
        });

        this.saveMemories();

        return results;
    }

    /**
     * Calculate relevance score for memory to query
     * @param {Object} memory - Memory to score
     * @param {string} query - Search query
     * @returns {number} Relevance score
     */
    calculateRelevanceScore(memory, query) {
        let score = 0;

        // Content match
        if (memory.content.toLowerCase().includes(query)) {
            score += 3;

            // Boost score for exact matches
            if (memory.content.toLowerCase() === query) {
                score += 5;
            }
        }

        // Context match
        if (memory.context.toLowerCase().includes(query)) {
            score += 2;
        }

        // Recency boost
        const age = new Date() - new Date(memory.timestamp);
        const daysSinceCreation = age / (1000 * 60 * 60 * 24);
        score += Math.max(0, 1 - (daysSinceCreation / 30)); // Higher score for newer memories

        // Access count boost
        score += Math.min(1, memory.accessCount / 10); // Up to 1 point for frequently accessed memories

        // Importance boost
        score += memory.importance;

        return score;
    }

    /**
     * Generate a prompt enhancement based on relevant memories
     * @param {string} basePrompt - The base system prompt
     * @param {string} userInput - User input to find relevant memories for
     * @returns {string} Enhanced prompt
     */
    generateMemoryEnhancedPrompt(basePrompt, userInput) {
        if (!this.initialized) {
            this.initialize();
        }

        // Find relevant memories
        const relevantMemories = this.findMemories({
            content: userInput,
            sortBy: 'relevance',
            limit: 5
        });

        if (relevantMemories.length === 0) {
            return basePrompt;
        }

        // Format memories for inclusion in prompt
        let memoryContext = '\n\nBased on previous interactions, consider these relevant memories:\n';

        relevantMemories.forEach((memory, index) => {
            memoryContext += `Memory ${index + 1} (${new Date(memory.timestamp).toLocaleDateString()}): ${memory.content}\n`;
            if (memory.context) {
                memoryContext += `Context: ${memory.context.substring(0, 100)}${memory.context.length > 100 ? '...' : ''}\n`;
            }
        });

        memoryContext += '\nUse these memories to inform your response when relevant.';

        return basePrompt + memoryContext;
    }

    /**
     * Clear all memories
     */
    clearAll() {
        this.memories = [];
        this.stats.totalInteractions = 0;
        this.stats.lastAccessed = new Date().toISOString();

        this.saveMemories();
        this.saveStats();
    }

    /**
     * Get memory statistics
     * @returns {Object} Memory statistics
     */
    getStatistics() {
        if (!this.initialized) {
            this.initialize();
        }

        // Calculate memory statistics
        const memoryTypes = {};
        const tagCounts = {};
        const timeStats = {
            oldest: null,
            newest: null,
            avgAge: 0
        };

        if (this.memories.length > 0) {
            // Get timestamps
            const timestamps = this.memories.map(m => new Date(m.timestamp).getTime());
            timeStats.oldest = new Date(Math.min(...timestamps)).toISOString();
            timeStats.newest = new Date(Math.max(...timestamps)).toISOString();

            // Calculate average age
            const now = Date.now();
            const totalAge = timestamps.reduce((sum, ts) => sum + (now - ts), 0);
            timeStats.avgAge = totalAge / timestamps.length;
        }

        // Count by type and tags
        this.memories.forEach(memory => {
            // Count by type
            memoryTypes[memory.type] = (memoryTypes[memory.type] || 0) + 1;

            // Count by tags
            memory.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        return {
            count: this.memories.length,
            types: memoryTypes,
            tags: tagCounts,
            timeStats,
            systemStats: this.stats
        };
    }
}

// Create a singleton instance
const memorySystemInstance = new MemorySystemManager();

/**
 * Initialize the memory system
 * @returns {Object} Memory system instance
 */
export function initializeMemorySystem() {
    if (!memorySystemInstance.initialized) {
        memorySystemInstance.initialize();
    }
    return memorySystemInstance;
}

/**
 * Add a memory
 * @param {Object} memory - Memory to add
 * @returns {string} Memory ID
 */
export function addMemory(memory) {
    return memorySystemInstance.addMemory(memory);
}

/**
 * Find memories by criteria
 * @param {Object} criteria - Search criteria
 * @returns {Array} Matching memories
 */
export function findMemories(criteria) {
    return memorySystemInstance.findMemories(criteria);
}

/**
 * Generate enhanced prompt with memories
 * @param {string} basePrompt - Base system prompt
 * @param {string} userInput - User input
 * @returns {string} Enhanced prompt
 */
export function generateMemoryEnhancedPrompt(basePrompt, userInput) {
    return memorySystemInstance.generateMemoryEnhancedPrompt(basePrompt, userInput);
}

/**
 * Clear all memories
 */
export function clearAllMemories() {
    memorySystemInstance.clearAll();
}

/**
 * Get memory statistics
 * @returns {Object} Memory statistics
 */
export function getMemoryStatistics() {
    return memorySystemInstance.getStatistics();
}

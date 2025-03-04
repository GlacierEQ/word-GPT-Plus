/**
 * Memory system for Word-GPT-Plus to store and retrieve context across sessions
 */

// Constants
const MEMORY_STORAGE_KEY = 'word_gpt_plus_memory';
const MAX_MEMORIES = 1000;
const MAX_MEMORY_SIZE = 10 * 1024 * 1024; // 10MB limit
const DEFAULT_MEMORY_WEIGHT = 1.0;
const MEMORY_DECAY_FACTOR = 0.98; // Memories lose 2% relevance per day

/**
 * Memory entry structure
 * @typedef {Object} MemoryEntry
 * @property {string} id - Unique ID
 * @property {string} type - Memory type (interaction, context, etc)
 * @property {string} content - Memory content
 * @property {Array<string>} tags - Associated tags 
 * @property {number} createdAt - Creation timestamp
 * @property {number} lastAccessed - Last access timestamp
 * @property {number} accessCount - Number of times accessed
 * @property {number} weight - Importance weight
 */

/**
 * Initialize memory system
 */
export function initializeMemory() {
    try {
        // Check if memory exists
        const existingMemory = localStorage.getItem(MEMORY_STORAGE_KEY);

        if (!existingMemory) {
            // Create empty memory store
            const emptyMemory = {
                version: 1,
                memories: [],
                metadata: {
                    totalInteractions: 0,
                    lastAccessed: Date.now(),
                    lastCleaned: Date.now()
                }
            };

            localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(emptyMemory));
        } else {
            // Upgrade memory format if needed
            const parsedMemory = JSON.parse(existingMemory);

            if (!parsedMemory.version || parsedMemory.version < 1) {
                // Migration logic would go here
                parsedMemory.version = 1;
                localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(parsedMemory));
            }
        }

        // Perform maintenance
        performMemoryMaintenance();

        return true;
    } catch (error) {
        console.error('Error initializing memory system:', error);
        return false;
    }
}

/**
 * Add new memory
 * @param {Object} memory - Memory to store
 * @param {string} memory.content - Content to remember
 * @param {string} memory.type - Type of memory (interaction, context, etc)
 * @param {Array<string>} memory.tags - Tags to associate with memory
 * @param {number} memory.weight - Importance weight (0-1)
 * @returns {string} Memory ID
 */
export function addMemory({ content, type = 'interaction', tags = [], weight = DEFAULT_MEMORY_WEIGHT }) {
    try {
        // Validate
        if (!content || typeof content !== 'string') {
            throw new Error('Memory content is required and must be a string');
        }

        // Safety check: content size
        if (content.length > 100000) {
            // Truncate extremely large content
            content = content.substring(0, 100000) + '... [truncated]';
        }

        // Get current memory store
        const memoryData = getMemoryStore();

        // Create new memory entry
        const memoryEntry = {
            id: generateMemoryId(),
            type,
            content,
            tags: Array.isArray(tags) ? tags : [tags],
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            accessCount: 1,
            weight: weight || DEFAULT_MEMORY_WEIGHT
        };

        // Add to store
        memoryData.memories.unshift(memoryEntry);

        // Update metadata
        memoryData.metadata.totalInteractions++;
        memoryData.metadata.lastAccessed = Date.now();

        // Handle memory limit
        if (memoryData.memories.length > MAX_MEMORIES) {
            // Remove least important memories
            pruneMemories(memoryData);
        }

        // Save updated memory
        saveMemoryStore(memoryData);

        return memoryEntry.id;
    } catch (error) {
        console.error('Error adding memory:', error);
        return null;
    }
}

/**
 * Search for memories
 * @param {Object} options - Search options
 * @param {string} options.query - Search query
 * @param {string} options.type - Memory type filter
 * @param {Array<string>} options.tags - Tags to filter by
 * @param {number} options.limit - Max results to return
 * @returns {Array} Matching memories
 */
export function searchMemories({ query = '', type = null, tags = [], limit = 10 }) {
    try {
        // Get memory store
        const memoryData = getMemoryStore();

        // Start with all memories
        let results = [...memoryData.memories];

        // Apply filters
        if (type) {
            results = results.filter(memory => memory.type === type);
        }

        if (tags && tags.length > 0) {
            results = results.filter(memory =>
                tags.some(tag => memory.tags.includes(tag))
            );
        }

        if (query) {
            const queryLower = query.toLowerCase();
            results = results.filter(memory =>
                memory.content.toLowerCase().includes(queryLower)
            );

            // Sort by relevance (simple contains)
            results.sort((a, b) => {
                const aRelevance = a.content.toLowerCase().indexOf(queryLower);
                const bRelevance = b.content.toLowerCase().indexOf(queryLower);

                // If both contain the term, prioritize by position
                if (aRelevance >= 0 && bRelevance >= 0) {
                    return aRelevance - bRelevance;
                }

                // Otherwise sort by weight and recency
                return calculateMemoryScore(b) - calculateMemoryScore(a);
            });
        } else {
            // Sort by recency and importance
            results.sort((a, b) => calculateMemoryScore(b) - calculateMemoryScore(a));
        }

        // Update access time for returned memories
        results.slice(0, limit).forEach(memory => {
            updateMemoryAccess(memory.id);
        });

        return results.slice(0, limit).map(memory => ({
            id: memory.id,
            content: memory.content,
            type: memory.type,
            tags: memory.tags,
            createdAt: memory.createdAt,
            accessCount: memory.accessCount
        }));
    } catch (error) {
        console.error('Error searching memories:', error);
        return [];
    }
}

/**
 * Get memory by ID
 * @param {string} id - Memory ID
 * @returns {Object} Memory object
 */
export function getMemory(id) {
    try {
        if (!id) return null;

        const memoryData = getMemoryStore();
        const memory = memoryData.memories.find(m => m.id === id);

        if (memory) {
            // Update access stats
            updateMemoryAccess(id);
            return { ...memory };
        }

        return null;
    } catch (error) {
        console.error('Error getting memory:', error);
        return null;
    }
}

/**
 * Delete a specific memory
 * @param {string} id - Memory ID to delete
 * @returns {boolean} Success status
 */
export function deleteMemory(id) {
    try {
        if (!id) return false;

        const memoryData = getMemoryStore();

        // Find memory index
        const memoryIndex = memoryData.memories.findIndex(m => m.id === id);

        if (memoryIndex === -1) {
            return false;
        }

        // Remove memory
        memoryData.memories.splice(memoryIndex, 1);

        // Save updated memory
        saveMemoryStore(memoryData);

        return true;
    } catch (error) {
        console.error('Error deleting memory:', error);
        return false;
    }
}

/**
 * Clear all memories
 * @returns {boolean} Success status
 */
export function clearAllMemories() {
    try {
        const emptyMemory = {
            version: 1,
            memories: [],
            metadata: {
                totalInteractions: 0,
                lastAccessed: Date.now(),
                lastCleaned: Date.now()
            }
        };

        localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(emptyMemory));
        return true;
    } catch (error) {
        console.error('Error clearing memory:', error);
        return false;
    }
}

/**
 * Get memory statistics
 * @returns {Object} Memory stats
 */
export function getMemoryStats() {
    try {
        const memoryData = getMemoryStore();

        const stats = {
            totalMemories: memoryData.memories.length,
            totalInteractions: memoryData.metadata.totalInteractions,
            oldestMemory: null,
            newestMemory: null,
            sizeInBytes: 0,
            typeCounts: {}
        };

        if (memoryData.memories.length > 0) {
            // Find oldest and newest
            let oldest = memoryData.memories[0];
            let newest = memoryData.memories[0];

            // Calculate type counts
            memoryData.memories.forEach(memory => {
                // Track by type
                stats.typeCounts[memory.type] = (stats.typeCounts[memory.type] || 0) + 1;

                // Track oldest/newest
                if (memory.createdAt < oldest.createdAt) {
                    oldest = memory;
                }
                if (memory.createdAt > newest.createdAt) {
                    newest = memory;
                }
            });

            stats.oldestMemory = new Date(oldest.createdAt).toISOString();
            stats.newestMemory = new Date(newest.createdAt).toISOString();
        }

        // Estimate size
        stats.sizeInBytes = JSON.stringify(memoryData).length;

        return stats;
    } catch (error) {
        console.error('Error getting memory stats:', error);
        return {
            totalMemories: 0,
            totalInteractions: 0,
            sizeInBytes: 0
        };
    }
}

// Private helper functions

/**
 * Get the memory store from storage
 * @returns {Object} Memory store
 * @private
 */
function getMemoryStore() {
    try {
        const memoryData = localStorage.getItem(MEMORY_STORAGE_KEY);

        if (!memoryData) {
            // Initialize if not found
            initializeMemory();
            return JSON.parse(localStorage.getItem(MEMORY_STORAGE_KEY));
        }

        return JSON.parse(memoryData);
    } catch (error) {
        console.error('Error reading memory store:', error);

        // Return empty store if corrupted
        return {
            version: 1,
            memories: [],
            metadata: {
                totalInteractions: 0,
                lastAccessed: Date.now(),
                lastCleaned: Date.now()
            }
        };
    }
}

/**
 * Save memory store to storage
 * @param {Object} memoryData - Memory store to save
 * @returns {boolean} Success status
 * @private
 */
function saveMemoryStore(memoryData) {
    try {
        // Check size before saving
        const dataSize = JSON.stringify(memoryData).length;

        if (dataSize > MAX_MEMORY_SIZE) {
            // Handle oversized memory by pruning
            pruneMemories(memoryData, true);
        }

        localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memoryData));
        return true;
    } catch (error) {
        console.error('Error saving memory store:', error);
        return false;
    }
}

/**
 * Generate unique memory ID
 * @returns {string} Unique ID
 * @private
 */
function generateMemoryId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Update memory access time and count
 * @param {string} id - Memory ID to update
 * @private
 */
function updateMemoryAccess(id) {
    if (!id) return;

    const memoryData = getMemoryStore();
    const memoryIndex = memoryData.memories.findIndex(m => m.id === id);

    if (memoryIndex === -1) return;

    // Update memory
    memoryData.memories[memoryIndex].lastAccessed = Date.now();
    memoryData.memories[memoryIndex].accessCount++;

    // Update metadata
    memoryData.metadata.lastAccessed = Date.now();

    // Save changes
    saveMemoryStore(memoryData);
}

/**
 * Remove least important memories
 * @param {Object} memoryData - Memory store
 * @param {boolean} forcePrune - Force aggressive pruning
 * @private
 */
function pruneMemories(memoryData, forcePrune = false) {
    // Sort by importance score
    memoryData.memories.sort((a, b) => calculateMemoryScore(b) - calculateMemoryScore(a));

    // Keep only important memories
    const keepCount = forcePrune ? Math.floor(MAX_MEMORIES * 0.7) : MAX_MEMORIES;
    memoryData.memories = memoryData.memories.slice(0, keepCount);
}

/**
 * Calculate memory importance score
 * @param {Object} memory - Memory entry
 * @returns {number} Importance score
 * @private
 */
function calculateMemoryScore(memory) {
    // Factors: recency, access count, explicit weight
    const recency = (Date.now() - memory.createdAt) / (1000 * 60 * 60 * 24); // Days old
    const recencyScore = Math.max(0, 1 - (recency * (1 - MEMORY_DECAY_FACTOR)));

    // Access frequency score
    const accessScore = Math.min(1, memory.accessCount / 10); // Max out at 10 accesses

    // Combine scores with weights
    const score = (
        (recencyScore * 0.4) +
        (accessScore * 0.3) +
        (memory.weight * 0.3)
    );

    return score;
}

/**
 * Perform memory maintenance tasks
 * @private
 */
function performMemoryMaintenance() {
    try {
        const memoryData = getMemoryStore();

        // Skip if recent maintenance performed (once per day)
        const daysSinceLastCleaning = (Date.now() - memoryData.metadata.lastCleaned) / (1000 * 60 * 60 * 24);
        if (daysSinceLastCleaning < 1) {
            return;
        }

        // Check for size issues
        const dataSize = JSON.stringify(memoryData).length;

        if (dataSize > MAX_MEMORY_SIZE * 0.9) {
            pruneMemories(memoryData, true);
        }

        // Update metadata
        memoryData.metadata.lastCleaned = Date.now();

        // Save changes
        saveMemoryStore(memoryData);
    } catch (error) {
        console.error('Error performing memory maintenance:', error);
    }
}

/**
 * Word GPT Plus - User Preferences Manager
 * Manages user settings and preferences
 */

class PreferencesManager {
    constructor() {
        // Default preferences
        this.defaultPreferences = {
            appearance: {
                theme: 'system', // system, light, dark
                fontSize: 'medium', // small, medium, large
                fontFamily: 'default',
                compactMode: false
            },
            behavior: {
                autoSave: true,
                autoSaveInterval: 60000, // milliseconds
                confirmDialogs: true,
                showNotifications: true
            },
            api: {
                defaultModel: 'gpt-4',
                maxTokens: 2048,
                temperature: 0.7,
                saveHistory: true,
                automaticRetry: true
            },
            privacy: {
                collectAnalytics: true,
                shareImprovement: false,
                storeContentLocally: true,
                contentRetentionDays: 30
            },
            features: {
                recursiveOptimizationEnabled: true,
                multiverseWritingEnabled: true,
                imageProcessingEnabled: true
            }
        };
        
        // Initialize user preferences from storage
        this.userPreferences = this.loadPreferences();
    }
    
    // Add the rest of the class methods here
}
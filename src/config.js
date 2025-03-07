/**
 * Word GPT Plus - Central Configuration
 * This file contains global configuration settings for the application
 */

const config = {
    // Application information
    app: {
        name: 'Word GPT Plus',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        debug: process.env.NODE_ENV !== 'production'
    },

    // API configuration
    api: {
        defaultProvider: 'openai',
        providers: {
            openai: {
                baseUrl: 'https://api.openai.com/v1',
                defaultModel: 'gpt-3.5-turbo'
            },
            azure: {
                baseUrl: null, // User must configure
                defaultModel: null // User must configure
            },
            localServer: {
                baseUrl: 'http://localhost:8080',
                defaultModel: 'local-model'
            }
        },
        requestTimeout: 60000, // 60 seconds
        retries: 3
    },

    // UI configuration
    ui: {
        theme: 'light', // 'light' or 'dark'
        animations: true,
        templates: [
            { id: 'summarize', name: 'Summarize', prompt: 'Summarize the following text:' },
            { id: 'improve', name: 'Improve', prompt: 'Improve the clarity of the following text:' },
            { id: 'creatively-rewrite', name: 'Creatively Rewrite', prompt: 'Rewrite the following text in a more creative style:' },
            { id: 'formal', name: 'Formalize', prompt: 'Rewrite the following text in a formal tone:' },
            { id: 'bullet-points', name: 'Bullet Points', prompt: 'Convert the following text into bullet points:' },
            { id: 'simplify', name: 'Simplify', prompt: 'Simplify the following text:' }
        ]
    },

    // Features configuration
    features: {
        recursiveOptimization: {
            enabled: true,
            maxIterations: 3,
            qualityThreshold: 0.8
        },
        multiverseWriting: {
            enabled: true,
            maxVariants: 4
        },
        imageProcessing: {
            enabled: true,
            maxImageSize: 5 * 1024 * 1024 // 5MB
        },
        localStorage: {
            enabled: true,
            keyPrefix: 'word-gpt-plus-'
        }
    },

    // Security settings
    security: {
        encryptionEnabled: true,
        dataMinimizationEnabled: true,
        contentScanningEnabled: true,
        defaultSecurityLevel: 'standard' // 'basic', 'standard', 'enhanced'
    },

    // System settings
    system: {
        scheduledTasks: {
            enabled: true,
            checkInterval: 60000 // 60 seconds
        },
        logging: {
            level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
            consoleOutput: true,
            remoteLogging: false
        }
    }
};

export default config;

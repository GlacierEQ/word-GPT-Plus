import React, { createContext, useContext, useState, useEffect } from 'react';
import enhancedApiProvider from '../enhanced-api-provider';
import logger from '../utils/logger';

const EnhancedApiContext = createContext();

/**
 * Provider component that makes the enhanced API available to any nested components
 */
export function EnhancedApiProvider({ children }) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState(null);
    const [availableModels, setAvailableModels] = useState({});

    // Initialize the API provider and load available models
    useEffect(() => {
        const initialize = async () => {
            try {
                // Load available models from all providers
                const models = enhancedApiProvider.getAvailableModels();
                setAvailableModels(models);
                setIsInitialized(true);
                
                logger.info('Enhanced API provider initialized', { 
                    providers: Object.keys(models) 
                });
            } catch (err) {
                logger.error('Failed to initialize Enhanced API provider', { error: err });
                setError(err.message || 'Failed to initialize API provider');
            }
        };

        initialize();
    }, []);

    /**
     * Generate text using the specified provider and model
     */
    const generateText = async (provider, model, prompt, options = {}) => {
        try {
            if (!isInitialized) {
                throw new Error('API provider is not initialized');
            }

            logger.debug('Generating text', { 
                provider, 
                model, 
                promptLength: prompt.length,
                options 
            });

            const result = await enhancedApiProvider.generateText(
                provider, 
                model, 
                prompt, 
                options
            );

            return result;
        } catch (error) {
            logger.error('Error generating text', { 
                error: error.message,
                provider,
                model 
            });
            throw error;
        }
    };

    // The context value that will be supplied to any descendants of this provider
    const contextValue = {
        isInitialized,
        error,
        availableModels,
        generateText,
        // Add other API methods here as needed
    };

    return (
        <EnhancedApiContext.Provider value={contextValue}>
            {children}
        </EnhancedApiContext.Provider>
    );
}

/**
 * Hook for components to access the enhanced API context
 */
export function useEnhancedApi() {
    const context = useContext(EnhancedApiContext);
    if (!context) {
        throw new Error('useEnhancedApi must be used within an EnhancedApiProvider');
    }
    return context;
}

export default EnhancedApiContext;

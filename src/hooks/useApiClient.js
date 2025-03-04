import { useState, useEffect, useCallback } from 'react';
import { useSettings } from './useSettings';
import { createOpenAIClient } from '../services/api/openaiService';
import { createDeepSeekClient } from '../services/api/deepseekService';
import { ApiError } from '../services/api/apiClient';

/**
 * Custom hook for managing API client instances
 * @returns {Object} API clients and utilities
 */
export function useApiClient() {
    const { settings } = useSettings();
    const [apiClients, setApiClients] = useState({});
    const [lastError, setLastError] = useState(null);

    // Initialize/update API clients when settings change
    useEffect(() => {
        const clients = {};

        // Create OpenAI client if key exists
        if (settings.apiKeys?.openai) {
            clients.openai = createOpenAIClient(settings.apiKeys.openai);
        }

        // Create DeepSeek client
        clients.deepseek = createDeepSeekClient({
            apiKey: settings.apiKeys?.deepseek || settings.apiKeys?.openai,
            endpoint: settings.endpoints?.deepseek || 'https://api.deepseek.com/v1',
            isCommercialUse: !settings.usage?.deepseekNonCommercial,
            allowNonCommercialKeyless: settings.usage?.deepseekNonCommercial
        });

        setApiClients(clients);
    }, [
        settings.apiKeys?.openai,
        settings.apiKeys?.deepseek,
        settings.endpoints?.deepseek,
        settings.usage?.deepseekNonCommercial
    ]);

    /**
     * Execute API request with error handling
     * @param {Function} apiCall - Function that executes an API call
     * @param {Object} options - Options for request handling
     * @returns {Promise<any>} Response data or error
     */
    const executeApiRequest = useCallback(async (apiCall, options = {}) => {
        const {
            onError = null,
            retries = 3,
            showError = true
        } = options;

        try {
            const result = await apiCall();
            setLastError(null);
            return { data: result, error: null };
        } catch (error) {
            // Standardize error
            const apiError = error instanceof ApiError ?
                error :
                new ApiError(error.message, 0, 'Unknown');

            // Set last error
            if (showError) {
                setLastError(apiError);
            }

            // Call error handler if provided
            if (onError) {
                onError(apiError);
            }

            return { data: null, error: apiError };
        }
    }, []);

    const clearError = useCallback(() => {
        setLastError(null);
    }, []);

    return {
        apiClients,
        lastError,
        clearError,
        executeApiRequest
    };
}

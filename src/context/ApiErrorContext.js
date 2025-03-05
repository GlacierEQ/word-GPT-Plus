import React, { createContext, useContext, useState, useCallback } from 'react';
import { MessageBar, MessageBarType, DefaultButton, Stack } from '@fluentui/react';

// Create the context
const ApiErrorContext = createContext({
    error: null,
    setError: () => { },
    clearError: () => { },
});

/**
 * Provider component for API error handling
 */
export function ApiErrorProvider({ children }) {
    const [error, setErrorState] = useState(null);

    // Set error with standardization
    const setError = useCallback((error) => {
        // Normalize error object
        const normalizedError = {
            message: error.message || 'An unknown error occurred',
            code: error.code || error.statusCode || 'UNKNOWN',
            provider: error.provider || 'API',
            retryable: error.retryable !== false,
            timestamp: new Date(),
            originalError: error,
        };

        setErrorState(normalizedError);

        // Auto-clear non-critical errors after timeout
        if (normalizedError.code !== 401 && normalizedError.code !== 403) {
            setTimeout(() => {
                setErrorState((current) =>
                    current && current.timestamp === normalizedError.timestamp ? null : current
                );
            }, 8000);
        }
    }, []);

    // Clear current error
    const clearError = useCallback(() => {
        setErrorState(null);
    }, []);

    // Value for the context provider
    const contextValue = {
        error,
        setError,
        clearError,
    };

    return (
        <ApiErrorContext.Provider value={contextValue}>
            {error && <ApiErrorDisplay error={error} onDismiss={clearError} />}
            {children}
        </ApiErrorContext.Provider>
    );
}

/**
 * Component to display API errors
 */
function ApiErrorDisplay({ error, onDismiss }) {
    // Determine message bar type based on error code
    const getMessageBarType = () => {
        if (error.code === 401 || error.code === 403) {
            return MessageBarType.severeWarning;
        }
        if (error.code === 429) {
            return MessageBarType.warning;
        }
        return MessageBarType.error;
    };

    // Get user-friendly message
    const getFriendlyMessage = () => {
        switch (error.code) {
            case 401:
            case 403:
                return `Authentication failed with ${error.provider}. Please check your API key.`;
            case 429:
                return `Rate limit exceeded for ${error.provider}. Please try again later.`;
            case 'ECONNREFUSED':
            case 'ENOTFOUND':
                return `Could not connect to ${error.provider}. Check your internet connection.`;
            case 'TIMEOUT':
                return `Request to ${error.provider} timed out. The service might be busy.`;
            default:
                return error.message;
        }
    };

    return (
        <MessageBar
            messageBarType={getMessageBarType()}
            isMultiline={true}
            onDismiss={onDismiss}
            dismissButtonAriaLabel="Close"
            actions={
                error.retryable ? (
                    <Stack horizontal>
                        <DefaultButton onClick={() => {/* Retry logic would go here */ }}>
                            Retry
                        </DefaultButton>
                    </Stack>
                ) : null
            }
        >
            <Stack tokens={{ childrenGap: 5 }}>
                <span>{getFriendlyMessage()}</span>
                {error.code !== 'UNKNOWN' && (
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>
                        Code: {error.code} | Provider: {error.provider}
                    </span>
                )}
            </Stack>
        </MessageBar>
    );
}

/**
 * Hook for accessing the API error context
 */
export function useApiError() {
    const context = useContext(ApiErrorContext);

    if (!context) {
        throw new Error('useApiError must be used within an ApiErrorProvider');
    }

    return context;
}

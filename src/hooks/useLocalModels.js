import { useState, useEffect, useCallback } from 'react';
import { isOllamaAvailable, listModels } from '../utils/localModels';

/**
 * Hook for using local Ollama models
 * @returns {Object} Local model state and methods
 */
export function useLocalModels() {
    const [isChecking, setIsChecking] = useState(true);
    const [ollamaAvailable, setOllamaAvailable] = useState(false);
    const [availableModels, setAvailableModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const [error, setError] = useState(null);

    // Check Ollama availability
    const checkAvailability = useCallback(async () => {
        setIsChecking(true);
        setError(null);

        try {
            const available = await isOllamaAvailable();
            setOllamaAvailable(available);

            if (available) {
                const models = await listModels();
                setAvailableModels(models || []);

                // Set first model as selected if available
                if (models && models.length > 0) {
                    setSelectedModel(models[0].name);
                }
            }
        } catch (err) {
            console.error('Error checking Ollama:', err);
            setError('Failed to connect to Ollama');
            setOllamaAvailable(false);
        } finally {
            setIsChecking(false);
        }
    }, []);

    // Initial check on mount
    useEffect(() => {
        checkAvailability();
    }, [checkAvailability]);

    // Select a model
    const selectModel = useCallback((modelName) => {
        if (availableModels.some(m => m.name === modelName)) {
            setSelectedModel(modelName);
            return true;
        }
        return false;
    }, [availableModels]);

    // Get model info
    const getModelInfo = useCallback((modelName) => {
        return availableModels.find(m => m.name === modelName) || null;
    }, [availableModels]);

    return {
        isChecking,
        ollamaAvailable,
        availableModels,
        selectedModel,
        error,
        checkAvailability,
        selectModel,
        getModelInfo
    };
}

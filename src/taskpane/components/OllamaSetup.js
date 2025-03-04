import React, { useState, useEffect } from 'react';
import {
    Stack,
    Text,
    PrimaryButton,
    DefaultButton,
    Spinner,
    MessageBar,
    MessageBarType,
    Link,
    ProgressIndicator
} from '@fluentui/react';
import { isOllamaAvailable, getAvailableLocalModels } from '../../utils/localModels';

/**
 * Component to help users set up Ollama for free AI capabilities
 */
export const OllamaSetup = ({ onComplete }) => {
    const [isChecking, setIsChecking] = useState(true);
    const [isInstalled, setIsInstalled] = useState(false);
    const [availableModels, setAvailableModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState(null);

    // Check if Ollama is available when component mounts
    useEffect(() => {
        async function checkOllama() {
            try {
                setIsChecking(true);
                const available = await isOllamaAvailable();
                setIsInstalled(available);

                if (available) {
                    const models = await getAvailableLocalModels();
                    setAvailableModels(models);

                    // Set default model if one exists
                    if (models.length > 0) {
                        setSelectedModel(models[0].name);
                    }
                }
            } catch (err) {
                setError('Error checking Ollama: ' + err.message);
            } finally {
                setIsChecking(false);
            }
        }

        checkOllama();
    }, []);

    // Open download page in browser
    const handleDownloadClick = () => {
        window.open('https://ollama.ai', '_blank');
    };

    // Simulate starting model download (in real implementation, this would use Ollama API)
    const handlePullModel = () => {
        // In a full implementation, this would call Ollama API to pull the model
        // For this mockup, we'll simulate the download
        setIsDownloading(true);
        setDownloadProgress(0);

        // Simulate progress updates
        const interval = setInterval(() => {
            setDownloadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsDownloading(false);
                    // Add model to available models
                    setAvailableModels(prev => [...prev, {
                        name: 'llama3:8b',
                        size: '4.7GB'
                    }]);
                    setSelectedModel('llama3:8b');
                    return 100;
                }
                return prev + 5;
            });
        }, 500);
    };

    const handleComplete = () => {
        if (onComplete) {
            onComplete(selectedModel);
        }
    };

    // Loading state
    if (isChecking) {
        return (
            <Stack tokens={{ childrenGap: 10 }} horizontalAlign="center">
                <Spinner label="Checking if Ollama is installed..." />
            </Stack>
        );
    }

    // Ollama not installed
    if (!isInstalled) {
        return (
            <Stack tokens={{ childrenGap: 15 }}>
                <MessageBar messageBarType={MessageBarType.info}>
                    Ollama is not installed or running. Install Ollama to use free AI models locally.
                </MessageBar>

                <Text>
                    Ollama allows you to run powerful AI models on your computer completely free,
                    with no API keys or usage limits.
                </Text>

                <Stack horizontal horizontalAlign="center">
                    <PrimaryButton
                        text="Download Ollama"
                        onClick={handleDownloadClick}
                        iconProps={{ iconName: 'Download' }}
                    />
                </Stack>

                <Text>
                    After installing, come back here and refresh this page.
                </Text>

                <Link href="https://ollama.ai/blog/getting-started" target="_blank">
                    Learn more about Ollama
                </Link>
            </Stack>
        );
    }

    // Ollama installed but no models
    if (availableModels.length === 0) {
        return (
            <Stack tokens={{ childrenGap: 15 }}>
                <MessageBar messageBarType={MessageBarType.success}>
                    Ollama is installed! Now you need to download a model.
                </MessageBar>

                <Text>
                    We recommend starting with the llama3:8b model, which provides good
                    performance while working on most computers.
                </Text>

                {isDownloading ? (
                    <Stack tokens={{ childrenGap: 10 }}>
                        <Text>Downloading llama3:8b model... This might take a few minutes.</Text>
                        <ProgressIndicator percentComplete={downloadProgress / 100} />
                    </Stack>
                ) : (
                    <PrimaryButton
                        text="Download llama3:8b Model"
                        onClick={handlePullModel}
                        iconProps={{ iconName: 'CloudDownload' }}
                    />
                )}

                <Text variant="small">
                    You can also open a command prompt and run: ollama pull llama3:8b
                </Text>
            </Stack>
        );
    }

    // Ollama installed and models available
    return (
        <Stack tokens={{ childrenGap: 15 }}>
            <MessageBar messageBarType={MessageBarType.success}>
                Ollama is installed and ready to use! You have {availableModels.length} model(s) available.
            </MessageBar>

            <Text variant="large">Available Models:</Text>

            <Stack tokens={{ childrenGap: 8 }}>
                {availableModels.map((model, index) => (
                    <Stack
                        horizontal
                        key={index}
                        tokens={{ childrenGap: 10 }}
                        horizontalAlign="space-between"
                        styles={{
                            root: {
                                padding: 10,
                                backgroundColor: selectedModel === model.name ? '#EFF6FC' : 'transparent',
                                borderRadius: 4,
                                cursor: 'pointer'
                            }
                        }}
                        onClick={() => setSelectedModel(model.name)}
                    >
                        <Text>{model.name}</Text>
                        {model.size && <Text>{model.size}</Text>}
                    </Stack>
                ))}
            </Stack>

            <Stack horizontal horizontalAlign="space-between">
                <DefaultButton
                    text="Download More Models"
                    onClick={() => window.open('https://ollama.ai/library', '_blank')}
                />

                <PrimaryButton
                    text="Use Selected Model"
                    onClick={handleComplete}
                    disabled={!selectedModel}
                />
            </Stack>
        </Stack>
    );
};

export default OllamaSetup;

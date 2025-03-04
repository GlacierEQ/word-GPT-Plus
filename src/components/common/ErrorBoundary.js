import React from 'react';
import { MessageBar, MessageBarType, PrimaryButton, Stack, Text } from '@fluentui/react';

/**
 * Error boundary component to catch and handle React errors
 */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to console
        console.error("Error caught by boundary:", error, errorInfo);

        // Update state with error details
        this.setState({ errorInfo });

        // You could also log to an error reporting service here
    }

    resetError = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    }

    render() {
        if (this.state.hasError) {
            // Render fallback UI
            return (
                <Stack tokens={{ childrenGap: 15, padding: 20 }}>
                    <MessageBar
                        messageBarType={MessageBarType.error}
                        isMultiline={true}
                    >
                        <Text variant="large">Something went wrong</Text>
                        <Text>
                            The application encountered an unexpected error. Please try refreshing the page.
                        </Text>
                    </MessageBar>

                    <Stack horizontal tokens={{ childrenGap: 10 }}>
                        <PrimaryButton
                            text="Reload Add-in"
                            onClick={() => window.location.reload()}
                        />
                        <PrimaryButton
                            text="Try to Continue"
                            onClick={this.resetError}
                        />
                    </Stack>

                    <Stack className="error-details">
                        <Text variant="medium">Error details:</Text>
                        <Text style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                            {this.state.error && this.state.error.toString()}
                        </Text>
                        {this.state.errorInfo && (
                            <Text style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 10, whiteSpace: 'pre-wrap' }}>
                                {this.state.errorInfo.componentStack}
                            </Text>
                        )}
                    </Stack>
                </Stack>
            );
        }

        // If no error, render children normally
        return this.props.children;
    }
}

import React, { useState, useEffect } from 'react';
import {
    MessageBar,
    MessageBarType,
    DefaultButton,
    Text,
    Stack,
    Icon
} from '@fluentui/react';

/**
 * Component for displaying API errors with retry capability
 * @param {Object} props - Component props
 * @param {Object} props.error - Error object to display
 * @param {Function} props.onRetry - Retry callback function
 * @param {Function} props.onDismiss - Dismiss callback function
 * @param {boolean} props.autoDismiss - Whether to auto-dismiss non-critical errors
 * @param {number} props.autoDismissDelay - Delay before auto-dismissing in ms
 * @returns {JSX.Element} Error display component
 */
export default function ErrorDisplay({
    error,
    onRetry = null,
    onDismiss = null,
    autoDismiss = true,
    autoDismissDelay = 10000
}) {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!error) return;

        // For rate limit errors with retry-after, use that as countdown
        if (error.isRateLimitError() && error.requestInfo?.headers?.['retry-after']) {
            const retryAfter = parseInt(error.requestInfo.headers['retry-after'], 10);
            setTimeLeft(retryAfter);
        } else if (error.isRateLimitError()) {
            // Default retry delay for rate limits
            setTimeLeft(30);
        }

        // Set up countdown timer if needed
        if (timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }

        // Auto-dismiss non-critical errors after delay
        if (autoDismiss && onDismiss &&
            !error.isAuthError() && !error.isRateLimitError()) {
            const timer = setTimeout(() => {
                onDismiss();
            }, autoDismissDelay);

            return () => clearTimeout(timer);
        }
    }, [error, timeLeft, autoDismiss, autoDismissDelay, onDismiss]);

    if (!error) return null;

    // Determine message bar type based on error
    const getMessageBarType = () => {
        if (error.isAuthError()) {
            return MessageBarType.severeWarning;
        }

        if (error.isRateLimitError()) {
            return MessageBarType.warning;
        }

        if (error.isServerError()) {
            return MessageBarType.error;
        }

        return MessageBarType.error;
    };

    // Can retry if the error is retriable and onRetry provided
    const canRetry = (error.isServerError() || error.isRateLimitError() || error.isTimeout()) && onRetry;

    return (
        <MessageBar
            messageBarType={getMessageBarType()}
            isMultiline={true}
            onDismiss={onDismiss}
            dismissButtonAriaLabel="Close"
            actions={canRetry && (
                <DefaultButton
                    onClick={onRetry}
                    disabled={timeLeft > 0}
                    iconProps={{ iconName: 'Refresh' }}
                >
                    {timeLeft > 0 ? `Retry in ${timeLeft}s` : 'Retry'}
                </DefaultButton>
            )}
        >
            <Stack tokens={{ childrenGap: 5 }}>
                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                    {error.isAuthError() && <Icon iconName="Permissions" />}
                    {error.isRateLimitError() && <Icon iconName="HourGlass" />}
                    {error.isServerError() && <Icon iconName="ServerError" />}

                    <Text variant="medium" style={{ fontWeight: 'bold' }}>
                        {error.displayMessage}
                    </Text>
                </Stack>

                {error.provider && (
                    <Text variant="small">
                        Provider: {error.provider}
                    </Text>
                )}

                {error.isAuthError() && (
                    <Text variant="small" style={{ fontStyle: 'italic' }}>
                        Please check your API key in Settings.
                    </Text>
                )}
            </Stack>
        </MessageBar>
    );
}

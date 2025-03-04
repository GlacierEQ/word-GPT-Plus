# API Error Handling Guide for Word-GPT-Plus

This document outlines a comprehensive approach to handling API errors across different providers in Word-GPT-Plus.

## Error Handling Architecture

### 1. Error Types Hierarchy

Create a structured error hierarchy:

```javascript
// Base API error class
class ApiError extends Error {
  constructor(message, statusCode, provider, requestInfo = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.provider = provider;
    this.requestInfo = requestInfo;
    this.timestamp = new Date();
  }
  
  isAuthError() {
    return this.statusCode === 401 || this.statusCode === 403;
  }
  
  isRateLimitError() {
    return this.statusCode === 429;
  }
  
  isServerError() {
    return this.statusCode >= 500;
  }
  
  get displayMessage() {
    return this.getUserFriendlyMessage();
  }
  
  getUserFriendlyMessage() {
    if (this.isAuthError()) {
      return `Authentication failed with ${this.provider}. Please check your API key.`;
    }
    
    if (this.isRateLimitError()) {
      return `Rate limit exceeded for ${this.provider}. Please try again later.`;
    }
    
    if (this.isServerError()) {
      return `${this.provider} server error. The service might be experiencing issues.`;
    }
    
    return `Error communicating with ${this.provider}: ${this.message}`;
  }
}

// Provider-specific errors
class OpenAIError extends ApiError {
  constructor(message, statusCode, requestInfo = {}) {
    super(message, statusCode, 'OpenAI', requestInfo);
    this.name = 'OpenAIError';
  }
  
  // OpenAI-specific error handling
  getUserFriendlyMessage() {
    if (this.message.includes('insufficient_quota')) {
      return 'Your OpenAI account has insufficient credit. Please check your billing status.';
    }
    
    if (this.message.includes('invalid_api_key')) {
      return 'Invalid OpenAI API key. Please check your key and try again.';
    }
    
    return super.getUserFriendlyMessage();
  }
}

class DeepSeekError extends ApiError {
  constructor(message, statusCode, requestInfo = {}) {
    super(message, statusCode, 'DeepSeek', requestInfo);
    this.name = 'DeepSeekError';
  }
  
  // DeepSeek-specific error handling
  getUserFriendlyMessage() {
    if (this.statusCode === 403 && this.message.includes('commercial_use_required')) {
      return 'This operation requires commercial use. Please enable commercial usage in settings and provide an API key.';
    }
    
    return super.getUserFriendlyMessage();
  }
}
```

### 2. Centralized Error Handling

Create a centralized error handler:

```javascript
// src/utils/errorHandler.js
const ErrorHandler = {
  handleApiError(error, context = {}) {
    // Log the error
    this.logError(error, context);
    
    // Determine if retry is possible
    const canRetry = this.canRetryRequest(error);
    
    // Return structured error response
    return {
      error: true,
      message: error.displayMessage || error.message,
      canRetry,
      retryDelay: this.getRetryDelay(error),
      errorCode: error.statusCode || 'unknown',
      provider: error.provider || context.provider || 'unknown'
    };
  },
  
  logError(error, context) {
    console.error('API Error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      statusCode: error.statusCode,
      provider: error.provider,
      requestInfo: error.requestInfo,
      context
    });
    
    // Could implement remote logging here
  },
  
  canRetryRequest(error) {
    // Don't retry auth errors
    if (error.isAuthError()) return false;
    
    // Retry rate limit errors
    if (error.isRateLimitError()) return true;
    
    // Retry server errors
    if (error.isServerError()) return true;
    
    // Don't retry other errors by default
    return false;
  },
  
  getRetryDelay(error) {
    if (error.isRateLimitError()) {
      // Parse retry-after header if available
      const retryAfter = error.requestInfo?.headers?.['retry-after'];
      if (retryAfter) {
        return parseInt(retryAfter, 10) * 1000;
      }
      
      // Default backoff for rate limiting
      return 5000;
    }
    
    if (error.isServerError()) {
      // Exponential backoff for server errors
      const attempt = error.requestInfo?.attempt || 1;
      return Math.min(1000 * Math.pow(2, attempt), 30000);
    }
    
    return 0;
  }
};
```

### 3. Provider-Specific Error Mapping

Map provider-specific errors:

```javascript
// src/services/api/openai.js
const parseOpenAIError = (error, requestDetails) => {
  if (error.response) {
    const { status, data } = error.response;
    
    // Extract OpenAI error message
    const message = data?.error?.message || error.message;
    
    return new OpenAIError(message, status, requestDetails);
  }
  
  if (error.request) {
    // Request made but no response received
    return new OpenAIError('No response from OpenAI API', 0, requestDetails);
  }
  
  // Something else caused the error
  return new OpenAIError(error.message, 0, requestDetails);
};

// In API client
async generateText(prompt, options) {
  const requestDetails = {
    endpoint: '/completions',
    model: options.model,
    tokenCount: estimateTokenCount(prompt)
  };
  
  try {
    const response = await this.request('/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: options.model,
        prompt,
        temperature: options.temperature
      })
    });
    
    return response;
  } catch (error) {
    throw parseOpenAIError(error, requestDetails);
  }
}
```

## UI Error Presentation

### 1. Error Components

Create reusable error UI components:

```jsx
// Error message component with retry
const ApiErrorMessage = ({ error, onRetry, onDismiss }) => {
  const [timeLeft, setTimeLeft] = useState(error.retryDelay / 1000);
  
  useEffect(() => {
    if (!error.canRetry || timeLeft <= 0) return;
    
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
  }, [error.canRetry, timeLeft]);
  
  return (
    <MessageBar
      messageBarType={getMessageBarType(error)}
      isMultiline={true}
      dismissButtonAriaLabel="Close"
      onDismiss={onDismiss}
      actions={
        error.canRetry && (
          <div>
            <DefaultButton
              onClick={onRetry}
              disabled={timeLeft > 0}
            >
              {timeLeft > 0 ? `Retry in ${timeLeft}s` : 'Retry'}
            </DefaultButton>
          </div>
        )
      }
    >
      <Text variant="medium">
        {error.message}
      </Text>
      {error.provider && (
        <Text variant="smallPlus">
          Provider: {error.provider}
        </Text>
      )}
    </MessageBar>
  );
};

// Helper function to determine MessageBar type
const getMessageBarType = (error) => {
  if (error.errorCode === 401 || error.errorCode === 403) {
    return MessageBarType.severeWarning;
  }
  
  if (error.errorCode === 429) {
    return MessageBarType.warning;
  }
  
  if (error.errorCode >= 500) {
    return MessageBarType.error;
  }
  
  return MessageBarType.error;
};
```

### 2. Error Hooks

Create a custom error management hook:

```javascript
// useApiError hook
const useApiError = () => {
  const [apiError, setApiError] = useState(null);
  
  const clearError = useCallback(() => {
    setApiError(null);
  }, []);
  
  const handleApiError = useCallback((error, context = {}) => {
    const processedError = ErrorHandler.handleApiError(error, context);
    setApiError(processedError);
    return processedError;
  }, []);
  
  // Auto-clear error after timeout (for non-critical errors)
  useEffect(() => {
    if (!apiError || apiError.errorCode === 401 || apiError.errorCode === 403) {
      // Don't auto-clear auth errors
      return;
    }
    
    const timer = setTimeout(() => {
      clearError();
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [apiError, clearError]);
  
  return {
    apiError,
    handleApiError,
    clearError
  };
};
```

## Retry Strategies

### 1. Exponential Backoff

Implement smart retry with backoff:

```javascript
// Retry utility
const withRetry = async (operation, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    shouldRetry = (error) => error.isServerError() || error.isRateLimitError()
  } = options;
  
  let attempt = 0;
  
  while (true) {
    try {
      attempt++;
      return await operation(attempt);
    } catch (error) {
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt - 1) * (0.8 + Math.random() * 0.4),
        maxDelay
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Usage
const generateTextWithRetry = async (prompt, options) => {
  return withRetry(
    async (attempt) => {
      try {
        return await apiClient.generateText(prompt, options);
      } catch (error) {
        // Add attempt information to error
        error.requestInfo = { ...error.requestInfo, attempt };
        throw error;
      }
    },
    {
      maxRetries: 3,
      shouldRetry: (error) => {
        // Don't retry auth errors or invalid requests
        if (error.statusCode === 400 || error.isAuthError()) {
          return false;
        }
        return true;
      }
    }
  );
};
```
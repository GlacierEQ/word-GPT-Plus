# Security Best Practices for Word-GPT-Plus

This document outlines security recommendations to protect user data and API credentials in Word-GPT-Plus.

## API Key Security

### Current Risks

- API keys stored in plaintext in localStorage
- Keys accessible to any script running in the same origin
- No expiration or rotation mechanism
- Difficult to revoke compromised keys

### Recommended Improvements

#### 1. Encrypted Storage

Implement simple client-side encryption for API keys:

```javascript
// Encryption using browser-native crypto
const encryptApiKey = async (apiKey) => {
  // Create a device fingerprint for the encryption key
  const fingerprint = await generateDeviceFingerprint();
  
  // Convert fingerprint to encryption key using Web Crypto API
  const encoder = new TextEncoder();
  const keyData = encoder.encode(fingerprint);
  
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  
  // Generate initialization vector
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the API key
  const encodedApiKey = encoder.encode(apiKey);
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    cryptoKey,
    encodedApiKey
  );
  
  // Store both the IV and encrypted data
  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encryptedData))
  };
};

const decryptApiKey = async (encryptedObject) => {
  // Get device fingerprint
  const fingerprint = await generateDeviceFingerprint();
  
  // Recreate the crypto key
  const encoder = new TextEncoder();
  const keyData = encoder.encode(fingerprint);
  
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  
  // Convert stored arrays back to Uint8Arrays
  const iv = new Uint8Array(encryptedObject.iv);
  const encryptedData = new Uint8Array(encryptedObject.data);
  
  // Decrypt
  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    cryptoKey,
    encryptedData
  );
  
  // Convert back to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
};

// Generate a relatively stable device fingerprint
const generateDeviceFingerprint = async () => {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset()
  ];
  
  // Add more entropy from browser-specific attributes
  if (navigator.deviceMemory) components.push(navigator.deviceMemory);
  if (navigator.hardwareConcurrency) components.push(navigator.hardwareConcurrency);
  
  // Create a hash of the components
  const encoder = new TextEncoder();
  const data = encoder.encode(components.join('|'));
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  
  // Convert hash to string
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};
```

#### 2. Session-Only Option

Add an option to store API keys for the current session only:

```javascript
class ApiKeyManager {
  constructor() {
    // In-memory storage (cleared when page refreshes)
    this.sessionKeys = new Map();
  }
  
  storeKey(keyType, value, persistent = false) {
    if (persistent) {
      // Store encrypted in localStorage
      this.storeKeyPersistently(keyType, value);
    } else {
      // Store in memory only
      this.sessionKeys.set(keyType, value);
    }
  }
  
  async getKey(keyType) {
    // Check session storage first
    if (this.sessionKeys.has(keyType)) {
      return this.sessionKeys.get(keyType);
    }
    
    // Fall back to persistent storage
    return await this.getKeyFromPersistentStorage(keyType);
  }
  
  // ... implementation of persistent storage methods
}
```

#### 3. OAuth-Based Authentication

For a more secure approach, implement OAuth flow:

```javascript
// Initiate OAuth flow (using Microsoft identity platform as example)
const initiateOAuthFlow = () => {
  const clientId = 'your-client-id';
  const redirectUri = encodeURIComponent(window.location.origin + '/auth-callback');
  const scopes = encodeURIComponent('openai.api');
  
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}`;
  
  // Open popup for auth
  window.open(authUrl, 'oauth-popup', 'width=500,height=600');
};

// Handle OAuth callback in a separate component
const handleAuthCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    // Exchange code for token (this should happen on a backend)
    const tokenResponse = await exchangeCodeForToken(code);
    // Store the token securely
    storeAuthToken(tokenResponse.access_token, tokenResponse.expires_in);
    
    // Close the popup and notify parent
    if (window.opener) {
      window.opener.postMessage({ type: 'AUTH_SUCCESS' }, window.location.origin);
      window.close();
    }
  }
};
```

## Content Security

### CSP Implementation

Add a Content Security Policy to protect against XSS:

```html
<!-- In index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://appsforoffice.microsoft.com;
  connect-src 'self' https://api.openai.com https://api.deepseek.com https://api.groq.com;
  img-src 'self' blob: data:;
  style-src 'self' 'unsafe-inline';
  worker-src 'self' blob:;
">
```

### Input Sanitization

Sanitize all user inputs and API responses:

```javascript
// Use DOMPurify for HTML sanitization
import DOMPurify from 'dompurify';

// Sanitize HTML content
const sanitizeHtml = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
};

// Display component with sanitization
const SafeHtmlDisplay = ({ htmlContent }) => {
  const sanitizedHtml = useMemo(() => sanitizeHtml(htmlContent), [htmlContent]);
  
  return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
};
```

## Data Privacy

### Minimal Data Collection

Implement a data minimization approach:

1. Only store what's necessary
2. Purge data when no longer needed
3. Use anonymized data where possible

```javascript
// Example data cleaner
const preparePromptForSubmission = (rawPrompt, apiType) => {
  // Remove any potential PII from prompt
  let cleanedPrompt = rawPrompt;
  
  // Remove email patterns
  cleanedPrompt = cleanedPrompt.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL]');
  
  // Remove phone patterns
  cleanedPrompt = cleanedPrompt.replace(/\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, '[PHONE]');
  
  // API-specific sanitization
  if (apiType === 'openai') {
    // OpenAI-specific cleaning
  } else if (apiType === 'deepseek') {
    // DeepSeek-specific cleaning
  }
  
  return cleanedPrompt;
};
```

### Local Processing

Prefer local processing when possible:

```javascript
// Example decision logic for local vs. remote
const chooseProcessingLocation = async (text, capabilities) => {
  // If text contains sensitive information patterns
  if (containsSensitivePatterns(text)) {
    // Check if local processing is available
    if (capabilities.localModelsAvailable) {
      return 'local';
    } else {
      return 'prompt_warning';  // Warn user before sending
    }
  }
  
  // If text is small enough for local processing
  if (text.length < 1000 && capabilities.embeddedModelsAvailable) {
    return 'embedded';
  }
  
  // Default to remote
  return 'remote';
};
```

## Vulnerability Prevention

### Dependency Security

Implement security checks in the build process:

```json
// package.json
{
  "scripts": {
    "security-scan": "npm audit --audit-level=high",
    "preinstall": "npx npm-force-resolutions",
    "build": "npm run security-scan && vue-cli-service build"
  },
  "resolutions": {
    "minimist": "^1.2.6",
    "node-forge": "^1.3.0"
  }
}
```

### Regular Updates

Create a process for updating dependencies:

1. Weekly automated dependency check with Dependabot
2. Monthly manual review of critical dependencies
3. Quarterly full dependency audit

## User Security Education

Add security guidance in the UI:

```jsx
// API key input with security guidance
const ApiKeyInput = ({ value, onChange, keyType }) => (
  <div className="api-key-input-container">
    <TextField
      label={`${keyType} API Key`}
      value={value}
      onChange={onChange}
      type="password"
      canRevealPassword
    />
    <MessageBar messageBarType={MessageBarType.info}>
      <div className="security-guidance">
        <p><strong>Security Tips:</strong></p>
        <ul>
          <li>Create a dedicated API key with appropriate usage limits</li>
          <li>Do not share your key or include it in shared documents</li>
          <li>Regularly rotate your API keys</li>
          <li>Check the "This is a shared device" box to avoid storing the key persistently</li>
        </ul>
      </div>
    </MessageBar>
  </div>
);
```

## Incident Response Plan

Create a plan for security incidents:

1. Identify types of potential incidents (key exposure, data breach, etc.)
2. Define response procedure for each type
3. Create communication templates
4. Document recovery steps

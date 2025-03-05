/**
 * Word GPT Plus API Client
 * Handles communication with various AI APIs
 */

class APIClient {
    constructor() {
        this.apiKey = '';
        this.apiType = 'openai'; // default API type
        this.model = 'gpt-3.5-turbo';
        this.temperature = 0.7;
        this.maxTokens = 1000;
        this.baseUrl = 'https://api.openai.com/v1';
    }

    setApiKey(key) {
        this.apiKey = key;
    }

    setApiType(type) {
        this.apiType = type;

        // Update baseUrl based on API type
        switch (type) {
            case 'openai':
                this.baseUrl = 'https://api.openai.com/v1';
                break;
            case 'azure':
                this.baseUrl = ''; // Will be set by setAzureConfig
                break;
            case 'gemini':
                this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
                break;
            case 'ollama':
                this.baseUrl = 'http://localhost:11434/api';
                break;
            case 'groq':
                this.baseUrl = 'https://api.groq.com/openai/v1';
                break;
        }
    }

    setAzureConfig(endpoint, apiVersion = '2023-05-15') {
        this.baseUrl = `${endpoint}/openai/deployments/${this.model}`;
        this.azureApiVersion = apiVersion;
    }

    setModel(model) {
        this.model = model;
    }

    setTemperature(temp) {
        this.temperature = temp;
    }

    setMaxTokens(tokens) {
        this.maxTokens = tokens;
    }

    async generateText(prompt) {
        try {
            const response = await this.makeRequest(prompt);
            return response;
        } catch (error) {
            return {
                error: true,
                message: error.message || 'Error generating text'
            };
        }
    }

    async makeRequest(prompt) {
        const headers = {
            'Content-Type': 'application/json',
        };

        let url, body;

        // Configure request based on API type
        switch (this.apiType) {
            case 'openai':
                url = `${this.baseUrl}/chat/completions`;
                headers['Authorization'] = `Bearer ${this.apiKey}`;
                body = {
                    model: this.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: this.temperature,
                    max_tokens: this.maxTokens
                };
                break;

            case 'azure':
                url = `${this.baseUrl}?api-version=${this.azureApiVersion}`;
                headers['api-key'] = this.apiKey;
                body = {
                    messages: [{ role: 'user', content: prompt }],
                    temperature: this.temperature,
                    max_tokens: this.maxTokens
                };
                break;

            case 'gemini':
                url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
                body = {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: this.temperature,
                        maxOutputTokens: this.maxTokens
                    }
                };
                break;

            case 'ollama':
                url = `${this.baseUrl}/generate`;
                body = {
                    model: this.model,
                    prompt: prompt,
                    temperature: this.temperature,
                    num_predict: this.maxTokens
                };
                break;

            case 'groq':
                url = `${this.baseUrl}/chat/completions`;
                headers['Authorization'] = `Bearer ${this.apiKey}`;
                body = {
                    model: this.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: this.temperature,
                    max_tokens: this.maxTokens
                };
                break;

            default:
                throw new Error(`Unsupported API type: ${this.apiType}`);
        }

        // Make the network request
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Process the response based on API type
        let result;
        switch (this.apiType) {
            case 'openai':
            case 'azure':
            case 'groq':
                result = data.choices[0].message.content;
                break;

            case 'gemini':
                result = data.candidates[0].content.parts[0].text;
                break;

            case 'ollama':
                result = data.response;
                break;
        }

        return { success: true, text: result };
    }
}

// Export for use in other files
window.APIClient = APIClient;

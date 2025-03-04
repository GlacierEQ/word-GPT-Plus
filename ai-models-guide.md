# AI Models Guide for Word-GPT-Plus

## Available AI Models

Word-GPT-Plus currently supports the following AI services:

1. **OpenAI API**
   - Models: GPT-3.5, GPT-4, etc.
   - Also compatible with DeepSeek and other OpenAI-compatible endpoints

2. **Azure OpenAI API**
   - Microsoft's enterprise version of OpenAI services

3. **Google Gemini Pro API**
   - Google's advanced large language model

4. **Ollama**
   - For local deployment of AI models
   - Run models on your own hardware

5. **Groq API**
   - Known for high-speed inference

## API Requirements

### OpenAI API
- **Requirement**: API Key
- **How to obtain**: 
  1. Create an account at [OpenAI Platform](https://platform.openai.com)
  2. Navigate to [API Keys section](https://platform.openai.com/account/api-keys)
  3. Create a new secret key
- **Cost**: Pay-as-you-go based on token usage

### Azure OpenAI API
- **Requirement**: API Key, Endpoint URL, Deployment Name
- **How to obtain**:
  1. Apply for access at [Azure OpenAI Service](https://go.microsoft.com/fwlink/?linkid=2222006)
  2. Create a resource in Azure Portal
  3. Deploy a model and note the deployment name
  4. Get your endpoint and API key from the Azure Portal
- **Cost**: Based on Azure pricing for OpenAI services

### Google Gemini Pro API
- **Requirement**: API Key
- **How to obtain**:
  1. Go to [Google AI Studio](https://developers.generativeai.google/)
  2. Create or login to your Google account
  3. Get API key from the Google AI Studio console
- **Cost**: Check Google's current pricing model

### Ollama (Local)
- **Requirement**: Local Ollama installation, API endpoint
- **How to obtain**:
  1. Install Ollama on your computer from [Ollama.ai](https://ollama.ai)
  2. Pull desired models using Ollama
  3. Configure Word-GPT-Plus to use local endpoint (typically http://localhost:11434)
- **Cost**: Free (uses your computer's resources)

### Groq API
- **Requirement**: API Key
- **How to obtain**:
  1. Create an account at [Groq](https://console.groq.com)
  2. Navigate to API keys section in Groq Console
  3. Generate a new API key
- **Cost**: Check Groq's current pricing model

## Setting Up Your API in Word-GPT-Plus

1. Install Word-GPT-Plus as per the quick-start guide
2. Open Word and access the add-in
3. Click the orange **Settings** button
4. Select your preferred AI service
5. Enter the required API information
6. Save your settings

## Permissions

- Word-GPT-Plus requires permission to access your chosen AI service via API
- Your API key grants the add-in permission to make requests on your behalf
- Your API usage is subject to the terms and pricing of your chosen AI provider
- The add-in requires permission to read/modify your current Word document

## Data Privacy Note

- When using cloud-based AI services (OpenAI, Azure, Google, Groq), text is sent to external servers
- When using Ollama, text is processed locally on your machine
- All API keys are stored locally in your browser's storage

# Free AI API Options for Word GPT Plus

This document outlines free alternatives to paid APIs like OpenAI, enabling Word GPT Plus to operate without subscription costs.

## Free and Open Source Options

### Local Models

1. **[Ollama](https://ollama.ai/)** - Run Llama 2, Mistral, and other models locally
   - **Features**: No API keys, fully offline, multiple model support
   - **Setup**: Install Ollama and run local server on http://localhost:11434
   - **Performance**: Depends on your hardware, but typically good for general use

2. **[LM Studio](https://lmstudio.ai/)** - User-friendly GUI for running local LLMs
   - **Features**: Visual interface, model download manager, API server
   - **Setup**: Run the application and enable local API server
   - **Performance**: Optimized for consumer hardware

3. **[LocalAI](https://localai.io/)** - API-compatible local server for multiple models
   - **Features**: Drop-in replacement for OpenAI API, same endpoints
   - **Setup**: Docker container or native installation options
   - **Performance**: Compatible with lower-end hardware

### Self-hosted Options

1. **[Jan.ai](https://jan.ai/)** - Open-source ChatGPT alternative
   - **Features**: Private, secure, runs locally, extensible
   - **Hardware Requirements**: 16GB RAM recommended

2. **[GPT4All](https://gpt4all.io/)** - Ecosystem of local LLMs
   - **Features**: Runs models on your PC or Mac
   - **Setup**: Simple desktop application

### Free Tiers/Services

1. **[Hugging Face Inference API](https://huggingface.co/inference-api)** 
   - **Free Tier**: Limited requests per month
   - **Models**: Access to thousands of open-source models

2. **[Anthropic Claude API](https://www.anthropic.com/api)**
   - **Free Tier**: Limited context windows but generous for basic use

## Integration Notes

To use these free options in Word GPT Plus:

1. **Local API Integration**:
   - Set endpoint URL to your local server (e.g., `http://localhost:11434/api`)
   - No API key required for most local setups
   - Configure model name based on what you've downloaded locally

2. **Configuration Example** (for Ollama):
   ```javascript
   {
     provider: 'local',
     baseUrl: 'http://localhost:11434/api',
     model: 'llama2'
   }
   ```

## Recommendations

For the best free experience:
- **Llama 2 7B** - Good balance of quality and performance
- **Mistral 7B** - Excellent performance for size
- **Phi-2** - Microsoft's model, very efficient

These options allow Word GPT Plus to function as a completely free add-in without subscription costs or API fees.

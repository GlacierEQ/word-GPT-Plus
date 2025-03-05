# Word-GPT-Plus Testing Guide

## Pre-Testing Setup

1. Ensure you have a Microsoft 365 account with Office development capabilities
2. Install Node.js 18.x or higher
3. Clone the repository and install dependencies:
   ```
   git clone https://github.com/yourusername/word-GPT-Plus.git
   cd word-GPT-Plus
   npm install
   ```

## Development Build

Start the development server:

```
npm run dev
```

This will start the server at http://localhost:3000

## Sideloading in Word

1. Open Word
2. Go to Insert > Add-ins > My Add-ins > Upload My Add-in
3. Browse to the manifest.xml file in the project root
4. Click Install

## Testing Scenarios

### Core Functionality

1. **Basic Text Generation**
   - Go to the "Basic" tab
   - Enter a simple prompt
   - Verify text generation works

2. **Structured Prompts**
   - Go to the "Structured" tab
   - Configure prompt parameters
   - Test generation with different tasks, tones, and lengths

3. **Image Analysis**
   - Go to the "Photos" tab
   - Upload a test image
   - Test analysis with different models
   - Verify image insertion works

### API Testing

1. **OpenAI API**
   - Configure a valid OpenAI API key
   - Test text generation
   - Test GPT-4 Vision

2. **DeepSeek Free Tier**
   - Enable non-commercial usage in settings
   - Verify image analysis works without API key
   - Test different analysis types

3. **Local Models**
   - Install Ollama and pull a model (e.g., `ollama pull llama3`)
   - Enable Ollama integration in settings
   - Test text generation with local models

### Settings Management

1. **API Key Management**
   - Add/remove API keys
   - Test persistence across sessions
   - Test separate DeepSeek key toggle

2. **Memory System**
   - Enable memory
   - Create several interactions
   - Verify memory influences future responses
   - Test memory clearing

## Common Issues and Fixes

### Office JS Not Loading

If the Office JS API doesn't load:
- Check if you're using a supported version of Office
- Try reloading the add-in
- Check browser console for errors

### API Authentication Issues

If API calls fail with 401/403 errors:
- Verify API key is correct
- Check if the key has proper permissions
- For DeepSeek, ensure commercial usage is properly configured if using an API key

### Local Models Not Found

If Ollama models aren't detected:
- Verify Ollama is running (`ollama serve`)
- Check if models are installed (`ollama list`)
- Check for CORS issues if running on non-localhost

## Reporting Issues

When reporting issues, please include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Console logs (if applicable)
5. Screenshots (if applicable)

Submit issues via GitHub or email to support@wordgptplus.com

# Embedded AI Models Guide

Word-GPT-Plus includes built-in quantized AI models that run directly in your browser with **no API key required** and **absolutely free**. This document explains how these models work and how to use them effectively.

## What are Embedded AI Models?

Embedded models are small, optimized AI models that:
- Run directly in your web browser
- Require no external API calls
- Have no usage limits or costs
- Process all data locally for privacy

## Available Embedded Models

Word-GPT-Plus includes several free quantized models:

### 1. TinyLlama 1.1B Chat
- **Size**: ~600MB (downloaded and cached in browser)
- **Best for**: General text generation tasks, longer responses
- **Quality level**: Good for a free embedded model
- **Recommended for**: Users who need decent quality without using an API

### 2. Flan-T5 Small
- **Size**: ~300MB (downloaded and cached in browser)
- **Best for**: Concise responses, following instructions
- **Quality level**: Basic but functional
- **Recommended for**: Simple tasks, users with limited system resources

### 3. DistilGPT2
- **Size**: ~350MB (downloaded and cached in browser)
- **Best for**: Creative text generation
- **Quality level**: Basic
- **Recommended for**: Creative writing, when speed matters more than quality

## Using Embedded Models

1. In Word-GPT-Plus, select the "Embedded Model" option in settings
2. Choose your preferred model from the dropdown
3. Enter your prompt and click "Generate"
4. The first use will download and cache the model (only happens once)
5. Subsequent uses will be much faster as the model is already loaded

## System Requirements

For the best experience with embedded models:

- **Memory**: At least 4GB RAM (8GB+ recommended for larger models)
- **Browser**: Modern browser (Chrome or Edge recommended)
- **Connection**: Internet connection for initial model download only
- **CPU**: Modern multi-core processor
- **GPU**: Any GPU provides significant speedups (optional)

## Advantages of Embedded Models

1. **Completely free** - no API costs ever
2. **No usage limits** - generate as much text as you want
3. **Works offline** after initial download
4. **Enhanced privacy** - data never leaves your device
5. **No authentication or API keys required**

## Limitations

Embedded models have some limitations compared to API-based solutions:

1. **Lower quality** - these are smaller models than GPT-4 or Claude
2. **Slower generation** - especially on less powerful hardware
3. **Limited context window** - can't process very long inputs
4. **Less capable** - may struggle with complex instructions
5. **Uses local resources** - requires decent hardware

## Optimizing Performance

To get the best performance from embedded models:

1. **Keep prompts concise** - shorter prompts process faster
2. **Close other applications** to free up memory
3. **Set reasonable output lengths** - longer outputs take more time
4. **Use Chrome or Edge** for best WebGPU acceleration
5. **Try different models** - some run better on certain hardware

## Technical Details

These models use WebAssembly and [transformers.js](https://xenova.github.io/transformers.js/) for browser-based inference. All models are quantized to 8-bit precision to reduce memory usage while maintaining reasonable quality.

When you first use a model, it's downloaded from Hugging Face's servers and cached in your browser's storage. The models used are open-source and freely licensed for commercial and non-commercial use.

If you're experiencing issues with embedded models, try the Ollama integration for better performance with slightly more setup, or use an API-based model if you have an API key.

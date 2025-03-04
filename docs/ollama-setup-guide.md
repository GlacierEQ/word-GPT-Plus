# No-Cost Ollama Setup Guide for Word-GPT-Plus

This guide will help you set up a completely free AI solution for Word-GPT-Plus using Ollama open source models that run locally on your computer.

## What is Ollama?

Ollama is a tool that lets you run powerful open-source AI models directly on your own computer - with no API keys, no usage limits, and no costs. Models run completely offline, giving you privacy and unlimited usage.

## Step 1: Install Ollama

1. Go to [ollama.ai](https://ollama.ai)
2. Download the installer for your operating system (Windows, macOS, or Linux)
3. Run the installer and follow the prompts
4. Once installed, Ollama will run in the background (you'll see its icon in your system tray)

## Step 2: Download a Model

You only need to do this once per model:

1. Open a command prompt/terminal
2. Run the command to download a smaller model that works well on most computers:
   ```
   ollama pull llama3:8b
   ```
3. Wait for the download to complete (this may take a few minutes depending on your internet speed)

## Step 3: Configure Word-GPT-Plus to Use Ollama

1. Open Word and launch the Word-GPT-Plus add-in
2. Go to Settings (orange button)
3. Enable the "Use local models" option
4. Select "Ollama" as your local model provider
5. Choose "llama3:8b" from the model dropdown (or another model you downloaded)
6. Save your settings

## Step 4: Start Using Your Free AI

1. Create a new document or open an existing one
2. Highlight text or place your cursor where you want AI-generated content
3. Use Word-GPT-Plus as normal - all processing will happen on your computer!

## Recommended Models for Different Needs

Ollama offers many free models. Here are good choices to download:

- **llama3:8b** - Good all-around model that works on most computers (8GB RAM minimum)
- **mistral** - Excellent performance with reasonable system requirements
- **phi3** - Microsoft's smaller model, works well for general writing tasks
- **nous-hermes2** - Good for more creative writing tasks

## Run a Model with This Command:

```
ollama pull MODEL_NAME
```

Replace MODEL_NAME with one of the models listed above.

## System Requirements

For comfortable usage:
- 16GB RAM recommended (8GB minimum)
- Modern CPU with 4+ cores
- 10GB free disk space
- Windows 10/11, macOS 12+, or Linux

## Troubleshooting

If Word-GPT-Plus can't connect to Ollama:

1. Make sure Ollama is running (check your system tray)
2. Restart Ollama if needed
3. Verify your firewall isn't blocking the connection
4. Try restarting Word

## Benefits of Local Models

- **Completely free** - no API costs ever
- **Unlimited usage** - use as much as you want
- **Privacy** - your data never leaves your computer
- **Works offline** - no internet needed after setup
- **No account required** - just install and use

## Limitations

- Requires a reasonably powerful computer
- Quality may be slightly lower than the latest commercial models
- No image processing capabilities
- Some advanced features might not be available

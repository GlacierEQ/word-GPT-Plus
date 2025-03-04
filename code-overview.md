# Word-GPT-Plus Code Overview

## Core Components

### 1. API Integrations
- **OpenAI**: Text generation, image analysis via GPT-4 Vision
- **DeepSeek**: Specialized image analysis (VL2 Base/Pro/Inspect models)
- **Google Gemini**: Alternative text generation
- **Groq**: High-speed inference for text
- **Azure OpenAI**: Enterprise OpenAI deployment support

### 2. Free & Local Options
- **Embedded Models**: Browser-based quantized models (TinyLlama, Flan-T5)
- **Ollama Integration**: Local AI models running on user's machine
- **DeepSeek Non-Commercial**: Free access for personal/educational use

### 3. User Interface
- **Structured Prompt Tab**: Guided prompt creation
- **Basic Prompt Tab**: Simple text generation
- **Photos Tab**: Image analysis and documentation

### 4. Specialized Features
- **Hawaii Legal Framework**: State/federal law and cultural context
- **Memory System**: Long-term memory across sessions
- **Image Analysis**: Specialized formats for legal/inspection documentation
- **Extension Integration**: DeepSeek Pro extension for research capabilities

## File Organization

### Main Application Components
```
/src/taskpane/
  /components/                # React components
    App.js                    # Main application component
    ImagePanel.js             # Image analysis panel
    StructuredPrompt.js       # Structured prompt builder
    EmbeddedModelPanel.js     # Embedded models interface
    OllamaSetup.js            # Ollama configuration
```

### Utilities
```
/src/utils/
  /deepseekVL.js              # DeepSeek vision-language integration
  /embeddedModels.js          # Browser-based model utilities
  /localModels.js             # Ollama integration
  /modelManager.js            # Model selection management
  /protections.js             # System safety features
  /memorySystem.js            # Long-term memory features
```

### Documentation
```
/docs/
  /image-analysis-guide.md    # Guide to image analysis features
  /ollama-setup-guide.md      # Local model setup guide
  /embedded-models-guide.md   # Browser model information
  /deepseek-setup-guide.md    # DeepSeek configuration
  /deepseek-policy.md         # Non-commercial usage policy
  /hawaii-legal-context.md    # Hawaii legal context details
  /freemium-options.md        # Free/low-cost options
  /system-protections.md      # Safety system documentation
```

## Code Structure Summary

### 1. Base Structure
- React-based Microsoft Office add-in
- Component-based UI architecture
- Modular service integrations

### 2. API Management
- Abstract provider layer for model interchangeability
- Configuration persistence in localStorage
- Multiple API support with fallback options

### 3. Protection Systems
- Memory usage monitoring
- API rate limiting
- Timeout and interruption capabilities
- Document size safety validation

### 4. Performance Optimizations
- Model caching for embedded models
- Progressive loading for better UX
- Adaptive context window sizing

## Known Issues & TODOs

1. **Component Fragmentation**: App.js has become too large and needs splitting into smaller components
2. **State Management**: Could benefit from a dedicated state management solution
3. **Settings Duplication**: Settings management is scattered across components
4. **API Error Handling**: Needs more consistent approach across providers
5. **Type Definitions**: Lack of consistent TypeScript typing

## Enhancement Roadmap

1. Split App.js into smaller functional components
2. Create a centralized settings management module
3. Implement consistent error handling across all API providers
4. Add unit tests for core utilities
5. Improve documentation with clear examples

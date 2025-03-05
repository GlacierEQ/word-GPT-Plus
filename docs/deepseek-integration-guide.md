# DeepSeek Integration Guide

This guide explains how to integrate and use DeepSeek's powerful AI models within Word-GPT-Plus.

## DeepSeek Models Overview

Word-GPT-Plus supports the following DeepSeek models:

### Text Models
- **DeepSeek Chat**: General-purpose chat model
- **DeepSeek Coder**: Specialized for code generation

### Vision Models
- **DeepSeek VL 2.0 Base**: General visual understanding
- **DeepSeek VL 2.0 Pro**: Enhanced detail recognition for expert analysis
- **DeepSeek VL 2.0 Inspect**: Specialized for inspection and defect detection

## Non-Commercial vs. Commercial Usage

DeepSeek provides two usage tiers:

### Non-Commercial Usage (Free)
- Available for personal, educational, and non-profit research
- No API key required
- Limited rate limits
- Enabled by toggling "Non-commercial usage" in settings
- Cannot be used for business or revenue-generating activities

### Commercial Usage
- Requires a DeepSeek API key
- Higher rate limits
- Available for all use cases including business applications
- Requires the "Use separate API key" toggle to be enabled
- Requires a valid DeepSeek API key

## Setting Up DeepSeek

### Non-Commercial Setup

1. Open Word-GPT-Plus
2. Click the Settings icon
3. Navigate to "DeepSeek Settings"
4. Enable "Non-commercial usage"
5. Select your preferred default model
6. Save settings

DeepSeek will now be available without requiring an API key for personal and educational use.

### Commercial Setup

1. Obtain a DeepSeek API key from [platform.deepseek.com](https://platform.deepseek.com)
2. Open Word-GPT-Plus
3. Click the Settings icon
4. Navigate to "DeepSeek Settings"
5. Disable "Non-commercial usage"
6. Enable "Use separate API key for DeepSeek models"
7. Enter your DeepSeek API key
8. Save settings

## Using DeepSeek VL Models for Image Analysis

DeepSeek Vision-Language (VL) models provide advanced image analysis capabilities:

### Available Analysis Types

1. **General Analysis**
   - Basic description and understanding of images
   - Best for: general photography, simple scenes

2. **Technical Analysis**
   - Detailed technical descriptions
   - Best for: machinery, equipment, technical documents

3. **Legal Evidence**
   - Analysis focused on details relevant for legal documentation
   - Best for: accident scenes, property damage, evidence documentation

4. **Inspection Report**
   - Structured analysis identifying issues and defects
   - Best for: property inspections, quality control

### Image Analysis Process

1. Navigate to the "Photos" tab
2. Select a DeepSeek model from the dropdown
3. Upload an image or take a photo
4. Select the analysis type
5. Choose output format
6. Click "Analyze Image"
7. Review the results
8. Click "Insert" to add the analysis to your document

### DeepSeek VL vs. GPT-4 Vision

| Feature | DeepSeek VL | GPT-4 Vision |
|---------|-------------|--------------|
| Detail Recognition | Higher (especially for technical subjects) | Good |
| Text in Images | Excellent OCR capabilities | Good |
| Technical Analysis | Specialized capabilities | General capabilities |
| Cost | Free for non-commercial use | Requires API key |
| Response Time | Fast | Variable |
| Specialized Knowledge | Strong in technical domains | Broad knowledge |

## Troubleshooting DeepSeek Integration

### Common Issues

1. **"Commercial use required" errors**
   - Solution: Enable "Non-commercial usage" or provide a valid API key

2. **Rate limit exceeded**
   - Solution: Wait and try again later, or upgrade to commercial usage

3. **Analysis timeout**
   - Solution: Try with a smaller or less complex image

4. **Low quality results**
   - Solution: Try upgrading from Base to Pro or Inspect models

### DeepSeek Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 401 | Authentication error | Check API key |
| 403 | Commercial use required | Enable commercial usage or non-commercial mode |
| 429 | Rate limit exceeded | Wait and try again |
| 500 | Server error | Try again later |
| 413 | Payload too large | Resize or compress your image |

## Advanced Configuration

### Custom Endpoint

If you're using a custom DeepSeek deployment:

1. Go to Settings > DeepSeek
2. Enter your custom API endpoint
3. Save settings

Example custom endpoint: `https://your-proxy.example.com/v1/chat/completions`

### Using OpenAI Key with DeepSeek

DeepSeek can use your OpenAI key with appropriate settings:

1. Disable "Use separate API key for DeepSeek models"
2. Ensure you have a valid OpenAI API key entered
3. Enable this only if you have confirmed your OpenAI key works with DeepSeek

## Best Practices

1. **Choose the Right Model**
   - Base: General purpose
   - Pro: Detailed analysis
   - Inspect: Technical inspection

2. **Optimize Images**
   - Resize to 1024×1024 for best results
   - Ensure good lighting and focus
   - Use PNG or high-quality JPG

3. **Select Appropriate Analysis Type**
   - Match the analysis type to your document purpose
   - Legal Evidence for documentation with legal implications
   - Inspection for property or equipment assessment

4. **Review and Edit**
   - Always review AI-generated content
   - Edit for accuracy and relevance
   - Add human expertise where needed

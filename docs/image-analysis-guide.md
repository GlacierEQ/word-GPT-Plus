# Image Analysis Guide for Word-GPT-Plus

Word-GPT-Plus includes powerful image analysis capabilities powered by multiple AI models, specifically designed for legal documentation and home inspection scenarios.

## Available Image Analysis Features

### Models

Word-GPT-Plus supports two advanced vision-language AI systems:

1. **OpenAI GPT-4 Vision**
   - General-purpose image analysis
   - Handles a wide variety of image content
   - Good for standard documentation needs

2. **DeepSeek VL2**
   - Multiple specialized models:
     - **Base**: General image understanding
     - **Pro**: Enhanced detail recognition and analysis
     - **Inspect**: Specialized for property inspection and damage assessment

### Analysis Types

Choose from specialized analysis types to get results tailored to your needs:

- **General Analysis**: Standard description and observation
- **Home Inspection**: Focuses on building issues, defects, and code compliance
- **Legal Evidence**: Objective description suitable for legal documentation
- **Property Damage**: Detailed assessment of damage types and extent
- **Accident Scene**: Analysis of positions, conditions, and relevant elements
- **Document Analysis**: Text extraction and document structure analysis

### Output Formats

Several formatting options for document insertion:

- **Standard Format**: Clean, structured analysis with image metadata
- **Formal Report**: Professional report format with headers
- **Evidence Documentation**: Formatted for legal evidence purposes
- **Inspection Report**: Specialized format for home inspections
- **Caption Only**: Condensed summary for image captions

## Using Image Analysis

### Basic Workflow

1. Navigate to the **Photos** tab in Word-GPT-Plus
2. Click **Select Image** and choose your image file
3. Select the appropriate analysis model and type
4. Click **Analyze Image**
5. Review the analysis results
6. Adjust formatting options as needed
7. Click **Insert into Document** to add to your Word document

### Tips for Best Results

#### For Home Inspection Images

- Choose **DeepSeek VL2 Inspect** model for best results
- Select **Home Inspection** analysis type
- Use **Inspection Report** format for insertion
- Include specific areas of concern in your custom prompt
- Example prompt: "Focus on potential water damage in this basement photo"

#### For Legal Documentation

- Choose **DeepSeek VL2 Pro** for detailed legal evidence
- Select **Legal Evidence** analysis type
- Use **Evidence Documentation** format
- Avoid leading questions in your prompt
- Example prompt: "Provide a factual description of this accident scene photo"

#### For Damage Assessment

- Select **Property Damage** analysis type
- Include measurements or reference objects in your photos when possible
- Use clear, well-lit images for best results
- Consider multiple angles of the same damage for comprehensive documentation

## Advanced Configuration

### DeepSeek VL2 Configuration

When using DeepSeek VL2 models, you can access advanced settings:

1. Click **Show Advanced Settings**
2. Configure the DeepSeek endpoint if using a custom deployment
3. The default endpoint will work for standard DeepSeek API access

### Image Size Considerations

- For faster analysis, keep images under 5MB
- The system automatically resizes large images for optimal processing
- Higher resolution isn't always beneficial for AI analysis
- Well-framed, properly exposed images yield better results than larger, poor quality ones

### Batch Processing

For multiple images in a single document:

1. Insert and analyze images one at a time
2. Use consistent formatting options for a uniform appearance
3. Consider using the image collection feature to organize related images

## Customizing Analysis with Prompts

Customize your analysis by adding specific instructions in the custom prompt field:

- "Focus on the structural damage to the roof"
- "Identify any visible code violations in this electrical panel"
- "Describe the condition of the foundation in detail"
- "Note any visible dates or timestamps in this evidence photo"

## Best Practices for Legal and Inspection Documentation

1. **Be consistent** with your analysis formats for long reports
2. **Be specific** about what you want the AI to focus on
3. **Use multiple images** for complete documentation of complex issues
4. **Verify AI observations** with your own expertise
5. **Include captions** for all images in legal documents
6. **Reference image numbers** in your written analysis
7. **Archive original images** separately from the document

## DeepSeek VL2 Special Requirements

### API Key Requirements

DeepSeek VL2 models require their own API key, separate from your OpenAI API key:

1. Register for a DeepSeek account at [DeepSeek Platform](https://platform.deepseek.com/)
2. Navigate to API management section
3. Generate a new API key for Vision models
4. Enter this API key in Word-GPT-Plus settings
5. Make sure to select "Use separate API key for DeepSeek models"

### Endpoint Configuration

The default DeepSeek API endpoint is pre-configured, but you can customize it if you:
- Have a self-hosted DeepSeek instance
- Are using a regional API endpoint
- Have special enterprise arrangements

To configure the endpoint:
1. Click "Show Advanced Settings" in the Photos tab
2. Enter your custom endpoint in the DeepSeek VL2 Endpoint field
3. The default value is: `https://api.deepseek.com/v1/chat/completions`

### Model Selection Guide

- **DeepSeek VL2 Base**: Good for general image descriptions, everyday documentation
- **DeepSeek VL2 Pro**: Enhanced analysis with more technical details and better observation
- **DeepSeek VL2 Inspect**: Specialized for home inspection, technical analysis, and damage assessment with domain expertise

Choose the model that best fits your documentation needs and level of detail required.

## Examples

### Home Inspection Documentation

```
HOME INSPECTION ANALYSIS (DeepSeek VL2 Inspect)
=============================================
Image: basement_corner.jpg (2048×1536 pixels)
Date: 3/15/2024

OBSERVATIONS
-----------
The image shows a basement corner with visible water damage. There is 
efflorescence (white mineral deposits) on the concrete block wall, indicating 
moisture penetration through the foundation. The wall shows a vertical crack 
approximately 1/8" wide extending from floor to ceiling. The adjacent floor 
area displays water staining and what appears to be mold growth (black spotting) 
covering an area of approximately 2-3 square feet. The concrete floor shows 
signs of deterioration near the wall junction.

RECOMMENDATIONS
-------------
* Review identified issues with a licensed foundation contractor
* Address any safety concerns immediately
* Consider further professional inspection for moisture intrusion and mold remediation
```

### Legal Evidence Documentation

```
EVIDENCE DOCUMENTATION
=====================
Image Reference: accident_scene_04.jpg
Analysis Date: 3/18/2024
Analysis Tool: DeepSeek VL2 Visual Analysis System
Image Properties: 3264×2448 pixels, 3.2 KB

VISUAL CONTENT DESCRIPTION
------------------------
The image shows an intersection with traffic signals visible from the southeast 
corner. A red sedan (appears to be a Toyota Camry, 2015-2017 model) is positioned 
in the rightmost lane with front-end damage visible on the passenger side. The 
traffic signal shows a green light for north-south traffic. Road conditions appear 
dry, and lighting conditions suggest mid-afternoon (based on shadow length and 
direction). A stop sign is visible for east-west traffic. There are skid marks 
approximately 15-20 feet in length leading to the vehicle's current position.

NOTE: This computer-assisted analysis is provided for documentation purposes and 
should be verified by qualified professionals.
```

## Troubleshooting

### Common Issues

1. **"API Key Invalid" Error**
   - Verify you've entered the correct API key in settings
   - Confirm your DeepSeek account has Vision models enabled
   - Check if your API quota or credits have been depleted

2. **Slow Analysis Response**
   - Reduce image size before uploading
   - Try a different image format (JPEG typically processes faster)
   - Check your network connection

3. **"Endpoint Unreachable" Error**
   - Verify the endpoint URL is correct
   - Check if your network blocks API requests to external services
   - Ensure your API subscription is active

4. **Low Quality Analysis**
   - Use higher quality, well-lit images
   - Be more specific in your custom prompt
   - Try a different analysis type or model

### Getting Help

For additional support with image analysis:
- Check the [DeepSeek documentation](https://platform.deepseek.com/docs)
- Visit the Word-GPT-Plus support forum
- Contact your administrator if using an enterprise deployment
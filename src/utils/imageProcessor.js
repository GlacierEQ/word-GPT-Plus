/**
 * Utilities for image processing and analysis in Word-GPT-Plus
 */

import { safelyLimitTextSize } from './protections';
import { analyzeImageWithDeepseek, DEEPSEEK_MODELS, formatDeepseekAnalysisForDocument } from './deepseekVL';

/**
 * Available image analysis models
 */
export const AVAILABLE_MODELS = {
    GPT4_VISION: 'gpt-4-vision-preview',
    DEEPSEEK_VL2_BASE: DEEPSEEK_MODELS.VL2_BASE,
    DEEPSEEK_VL2_PRO: DEEPSEEK_MODELS.VL2_PRO,
    DEEPSEEK_VL2_INSPECT: DEEPSEEK_MODELS.VL2_INSPECT
};

/**
 * Converts image to base64 for API transmission
 * @param {File|Blob} imageFile - The image file or blob
 * @returns {Promise<string>} Base64 encoded image
 */
export function imageToBase64(imageFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(imageFile);
    });
}

/**
 * Get image dimensions and metadata
 * @param {File|Blob} imageFile - The image file or blob
 * @returns {Promise<Object>} Image metadata
 */
export function getImageMetadata(imageFile) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(imageFile);

        img.onload = () => {
            // Get basic dimensions
            const metadata = {
                width: img.width,
                height: img.height,
                aspectRatio: img.width / img.height,
                size: imageFile.size,
                type: imageFile.type,
                name: imageFile.name || 'image'
            };

            // Clean up
            URL.revokeObjectURL(objectUrl);
            resolve(metadata);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image'));
        };

        img.src = objectUrl;
    });
}

/**
 * Resize image maintaining aspect ratio
 * @param {File|Blob} imageFile - The image file to resize
 * @param {number} maxDimension - Maximum width or height
 * @returns {Promise<Blob>} Resized image blob
 */
export function resizeImage(imageFile, maxDimension = 1200) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(imageFile);

        img.onload = () => {
            // Calculate new dimensions
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxDimension) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
            } else if (height > maxDimension) {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
            }

            // Draw to canvas for resizing
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob and resolve
            canvas.toBlob(blob => {
                URL.revokeObjectURL(objectUrl);
                resolve(blob);
            }, imageFile.type || 'image/jpeg', 0.92);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image for resizing'));
        };

        img.src = objectUrl;
    });
}

/**
 * Insert image into Word document at selection
 * @param {File|Blob} imageFile - Image to insert
 * @param {Object} options - Insert options (width, height, etc)
 * @returns {Promise<boolean>} Success status
 */
export async function insertImageToWord(imageFile, options = {}) {
    try {
        const base64Data = await imageToBase64(imageFile);

        return await Word.run(async (context) => {
            // Get the current selection
            const range = context.document.getSelection();

            // Convert base64 to byte array for Word API
            const image = range.insertInlinePictureFromBase64(base64Data);

            // Apply sizing if specified
            if (options.width) {
                image.width = options.width;
            }

            if (options.height) {
                image.height = options.height;
            }

            // Positioning options
            if (options.alignment) {
                switch (options.alignment) {
                    case 'left':
                        image.alignment = Word.Alignment.left;
                        break;
                    case 'center':
                        image.alignment = Word.Alignment.center;
                        break;
                    case 'right':
                        image.alignment = Word.Alignment.right;
                        break;
                }
            }

            await context.sync();
            return true;
        });
    } catch (error) {
        console.error('Error inserting image:', error);
        return false;
    }
}

/**
 * Analyze image content using selected AI model
 * @param {File|Blob} imageFile - Image to analyze
 * @param {string} apiKey - API key for image analysis
 * @param {Object} options - Analysis options including model selection
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeImage(imageFile, apiKey, options = {}) {
    try {
        // Check which model to use
        const selectedModel = options.model || AVAILABLE_MODELS.GPT4_VISION;

        // Use DeepSeek VL2 for analysis if selected
        if (selectedModel.includes('deepseek-vl')) {
            return await analyzeImageWithDeepseek(imageFile, {
                apiKey,
                model: selectedModel,
                analysisType: options.analysisType || 'general',
                prompt: options.prompt,
                endpoint: options.deepseekEndpoint,
                temperature: options.temperature || 0.2,
                maxTokens: options.maxTokens || 2048
            });
        }

        // Otherwise use GPT-4 Vision (existing functionality)
        // Resize image if needed to reduce API costs and improve speed
        const processedImage = options.resize !== false ?
            await resizeImage(imageFile, options.maxDimension || 800) :
            imageFile;

        // Convert to base64 for API transmission
        const base64Data = await imageToBase64(processedImage);

        // Prepare API call
        const endpoint = "https://api.openai.com/v1/chat/completions";

        // Build request based on analysis type
        const messages = [{
            role: "system",
            content: getImageAnalysisPrompt(options.analysisType || 'general')
        }];

        // Add the message with image content
        messages.push({
            role: "user",
            content: [
                { type: "text", text: options.prompt || "Please analyze this image in detail." },
                {
                    type: "image_url",
                    image_url: {
                        url: `data:image/${processedImage.type || 'jpeg'};base64,${base64Data}`
                    }
                }
            ]
        });

        // Make API call
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: selectedModel,
                messages,
                max_tokens: options.maxTokens || 1000
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return {
            analysis: data.choices[0].message.content,
            metadata: await getImageMetadata(imageFile),
            model: selectedModel
        };
    } catch (error) {
        console.error('Error analyzing image:', error);
        throw error;
    }
}

/**
 * Get specialized prompt for different types of image analysis
 * @param {string} analysisType - Type of analysis to perform
 * @returns {string} Specialized analysis prompt
 */
function getImageAnalysisPrompt(analysisType) {
    // Base prompt for all analyses
    let basePrompt = "You are an expert image analysis assistant with specialized knowledge in visual details. ";

    switch (analysisType.toLowerCase()) {
        case 'home_inspection':
            return basePrompt + `
        Analyze this home inspection photo with extreme detail and precision. Focus on:
        1. Identifying any visible defects, damage, or maintenance issues
        2. Detecting signs of water damage, mold, structural problems, or electrical hazards
        3. Noting the condition of materials, fixtures, and components
        4. Suggesting potential underlying issues that might need further inspection
        5. Estimating the severity of any issues (minor/moderate/major)
        6. Providing relevant building code considerations if applicable
        
        Format your response as a professional inspection report section, using clear, factual language.
        Include specific measurements when possible and refer to exact locations within the image.
      `;

        case 'legal_evidence':
            return basePrompt + `
        Analyze this legal evidence image with objective precision. Focus on:
        1. Documenting visible facts without speculation or opinion
        2. Recording time indicators (clocks, timestamps, lighting conditions)
        3. Noting the condition and position of relevant objects
        4. Identifying any visible text, markings, or identifying features
        5. Describing physical conditions or damage relevant to legal considerations
        6. Maintaining strictly factual observations without conclusions
        
        Format your response as an objective evidence description suitable for legal documentation.
        Use precise language and indicate any areas where the image is unclear or ambiguous.
      `;

        case 'property_damage':
            return basePrompt + `
        Analyze this property damage photo in detail. Focus on:
        1. The nature and extent of visible damage
        2. Potential causes of the damage based on visual evidence
        3. Affected materials and components
        4. Measurements or scale estimates of the damage area
        5. Secondary or consequential damage that may be present
        6. Visible pre-existing conditions distinct from new damage
        
        Format your response as a detailed insurance claim-ready description.
        Be precise about location, severity, and scope of damage.
      `;

        case 'accident_scene':
            return basePrompt + `
        Analyze this accident scene photo with forensic attention to detail. Focus on:
        1. The positioning of vehicles, objects, or individuals
        2. Visible damage patterns and their directional indicators
        3. Road conditions, signage, and environmental factors
        4. Skid marks, debris patterns, or other movement indicators
        5. Lighting conditions and visibility factors
        6. Timestamp indicators or time-of-day evidence
        
        Format your response as a factual scene description.
        Include spatial relationships and distances where possible.
      `;

        case 'document_analysis':
            return basePrompt + `
        Analyze this document image in detail. Focus on:
        1. Reading and transcribing all visible text accurately
        2. Identifying document type and format
        3. Noting signatures, stamps, or official markings
        4. Describing any visible alterations or damage to the document
        5. Identifying dates, reference numbers, and key information
        6. Detecting any visible security features
        
        Format your response with the transcribed content first, followed by observations about the document's format and condition.
      `;

        default: // general analysis
            return basePrompt + `
        Analyze this image in detail, providing a comprehensive description of:
        1. The main subject and important elements
        2. Relevant details that might be significant
        3. Context and setting of the image
        4. Condition of objects or subjects shown
        5. Any text or informational content visible
        
        Provide a well-structured response that focuses on objective observations.
      `;
    }
}

/**
 * Create caption for image based on analysis
 * @param {string} analysisText - Full image analysis text
 * @param {number} maxLength - Maximum caption length
 * @returns {string} Concise caption
 */
export function generateImageCaption(analysisText, maxLength = 100) {
    // Extract first sentence or first portion of analysis as caption
    const firstSentenceMatch = analysisText.match(/^[^.!?]+[.!?]/);

    if (firstSentenceMatch) {
        // Use first sentence if it's not too long
        const firstSentence = firstSentenceMatch[0].trim();
        if (firstSentence.length <= maxLength) {
            return firstSentence;
        }
    }

    // Otherwise, just truncate with ellipsis
    return analysisText.substring(0, maxLength - 3).trim() + '...';
}

/**
 * Format image analysis for Word document insertion
 * @param {Object} analysisResult - Analysis result from analyzeImage
 * @param {string} format - Format type (report, evidence, etc.)
 * @returns {string} Formatted text for document insertion
 */
export function formatImageAnalysisForDocument(analysisResult, format = 'standard') {
    // Check if this is a DeepSeek analysis
    if (analysisResult.model && analysisResult.model.includes('deepseek')) {
        // Map format types to DeepSeek format types
        const deepseekFormat =
            format === 'inspection' ? 'inspection_report' :
                format === 'evidence' ? 'legal_document' :
                    format === 'caption_only' ? 'compact' :
                        format === 'report' ? 'standard' : format;

        return formatDeepseekAnalysisForDocument(analysisResult, deepseekFormat);
    }

    // Original GPT Vision formatting (existing code)
    const { analysis, metadata } = analysisResult;

    // Basic information about the image
    const imageInfo = `Image size: ${metadata.width}x${metadata.height} pixels | File type: ${metadata.type.split('/')[1]}`;

    switch (format.toLowerCase()) {
        case 'report':
            return `
IMAGE ANALYSIS REPORT
---------------------
${imageInfo}
Date analyzed: ${new Date().toLocaleDateString()}

FINDINGS
--------
${analysis}
`;

        case 'evidence':
            return `
EVIDENCE ITEM DOCUMENTATION
--------------------------
${imageInfo}
Catalog date: ${new Date().toLocaleDateString()}

DESCRIPTION
----------
${analysis}
`;

        case 'inspection':
            return `
HOME INSPECTION PHOTO ANALYSIS
-----------------------------
${imageInfo}
Inspection date: ${new Date().toLocaleDateString()}

OBSERVATIONS
-----------
${analysis}
`;

        case 'caption_only':
            return generateImageCaption(analysis);

        default: // standard format
            return `
IMAGE ANALYSIS
-------------
${analysis}

(${imageInfo})
`;
    }
}

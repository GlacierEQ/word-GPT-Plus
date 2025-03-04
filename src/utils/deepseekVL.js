/**
 * DeepSeek VL2 integration for advanced image analysis
 * This provides higher quality image analysis for legal and home inspection contexts
 */

import { safelyLimitTextSize } from './protections';
import {
    isDeepSeekExtensionAvailable,
    searchWeb,
    performResearch
} from './deepseekExtension';

/**
 * Available DeepSeek VL2 models
 */
export const DEEPSEEK_MODELS = {
    VL2_BASE: 'deepseek-vl-2.0-base',
    VL2_PRO: 'deepseek-vl-2.0-pro',
    VL2_INSPECT: 'deepseek-vl-2.0-inspect'  // Specialized for detailed visual inspection
};

/**
 * Default system prompts for different analysis contexts
 */
export const DEEPSEEK_SYSTEM_PROMPTS = {
    // General purpose image analysis
    GENERAL: "You are a professional image analyst with expertise in visual detail extraction. Provide clear, factual analysis focused on observable elements.",

    // Home inspection specialized
    HOME_INSPECTION: `You are a certified home inspector with 20+ years of experience analyzing property conditions.
  Focus on identifying potential issues, code violations, safety concerns, and maintenance needs.
  Be precise about locations, severity levels, and provide professional recommendations.
  Use standard home inspection terminology and structure your findings in a factual report format.`,

    // Legal evidence documentation
    LEGAL_EVIDENCE: `You are a forensic image analyst with legal expertise.
  Provide objective, factual descriptions of what is visible in the image without speculation or opinion.
  Focus on elements that could be legally relevant including timestamps, identifiable features, physical conditions, and spatial relationships.
  Note if any aspects of the image appear altered or unclear.
  Your description should be suitable for legal documentation purposes.`,

    // Property damage assessment
    PROPERTY_DAMAGE: `You are an insurance claim adjuster specializing in property damage assessment.
  Provide detailed analysis of visible damage, affected materials, and estimated severity.
  Note indicators of the cause of damage when evident.
  Distinguish between recent damage and pre-existing conditions when possible.
  Focus on objective description rather than liability determination.
  Structure your analysis in a format suitable for insurance documentation.`
};

/**
 * Enhanced system prompts with web research capabilities
 */
export const DEEPSEEK_ENHANCED_PROMPTS = {
    RESEARCH_ENABLED: `
You have access to web research and retrieval tools to supplement your analysis.
When analyzing images, you can consult online information, technical documentation, 
building codes, legal regulations, or similar reference material to provide more
accurate and contextually relevant information. Always cite your sources when
providing information from external references.
  `,
    CODE_ENABLED: `
You have the capability to write and execute code to assist with image analysis.
This includes measurement calculations, color analysis, pattern recognition, and
data extraction from visual elements. When relevant, you can provide code snippets
that would help process or analyze aspects of the image.
  `
};

/**
 * Determine if commercial or non-commercial usage based on settings
 * @param {Object} options - Analysis options
 * @returns {boolean} Whether commercial usage is indicated
 */
function isCommercialUsage(options = {}) {
    return options.isCommercial === true || !options.allowNonCommercialKeyless;
}

/**
 * Get the appropriate endpoint for API access
 * @param {Object} options - Analysis options
 * @returns {string} API endpoint URL
 */
function getApiEndpoint(options = {}) {
    // Non-commercial usage without API key goes to the free tier endpoint
    if (!isCommercialUsage(options) && !options.apiKey) {
        return options.nonCommercialEndpoint || 'https://api-free.deepseek.com/v1/chat/completions';
    }

    // Otherwise use the specified or default commercial endpoint
    return options.endpoint || 'https://api.deepseek.com/v1/chat/completions';
}

/**
 * Get authorization header based on usage type and key availability
 * @param {Object} options - Analysis configuration
 * @returns {Object} Headers for API request
 */
function getAuthorizationHeaders(options = {}) {
    const headers = {
        'Content-Type': 'application/json'
    };

    // Add API key if available or if commercial use
    if (options.apiKey) {
        headers['Authorization'] = `Bearer ${options.apiKey}`;
    } else if (!isCommercialUsage(options)) {
        // For non-commercial keyless use, add appropriate headers
        headers['X-DeepSeek-Usage'] = 'non-commercial';
        headers['X-DeepSeek-Client'] = 'word-gpt-plus';
    } else {
        // Commercial usage requires API key
        throw new Error('API key required for commercial usage of DeepSeek models');
    }

    return headers;
}

/**
 * Analyze an image using DeepSeek VL2 with enhanced capabilities
 * @param {File|Blob} imageFile - The image file to analyze
 * @param {Object} options - Analysis configuration
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeImageWithDeepseek(imageFile, options = {}) {
    try {
        // Convert image to base64
        const base64 = await imageToBase64(imageFile);

        // Determine which model to use
        const modelName = options.model || DEEPSEEK_MODELS.VL2_BASE;

        // Select appropriate system prompt based on analysis type
        let systemPrompt = DEEPSEEK_SYSTEM_PROMPTS.GENERAL;
        if (options.analysisType === 'home_inspection') {
            systemPrompt = DEEPSEEK_SYSTEM_PROMPTS.HOME_INSPECTION;
        } else if (options.analysisType === 'legal_evidence') {
            systemPrompt = DEEPSEEK_SYSTEM_PROMPTS.LEGAL_EVIDENCE;
        } else if (options.analysisType === 'property_damage') {
            systemPrompt = DEEPSEEK_SYSTEM_PROMPTS.PROPERTY_DAMAGE;
        }

        // Check for DeepSeek extension availability
        const hasExtension = options.useExtension && await isDeepSeekExtensionAvailable();

        // Enhance system prompt with extended capabilities if extension is available
        if (hasExtension) {
            systemPrompt += DEEPSEEK_ENHANCED_PROMPTS.RESEARCH_ENABLED;
            systemPrompt += DEEPSEEK_ENHANCED_PROMPTS.CODE_ENABLED;
        }

        // Get the appropriate endpoint based on usage type
        const endpoint = getApiEndpoint(options);

        // Get headers based on usage type and key availability
        const headers = getAuthorizationHeaders(options);

        // Prepare the API request
        const requestData = {
            model: modelName,
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: options.prompt || 'Please analyze this image thoroughly and provide detailed observations.'
                        },
                        {
                            type: 'image_url',
                            image_url: { url: `data:image/jpeg;base64,${base64}` }
                        }
                    ]
                }
            ],
            temperature: options.temperature || 0.2,  // Lower temperature for more factual analysis
            max_tokens: options.maxTokens || 2048
        };

        // Add non-commercial usage flag to the request if applicable
        if (!options.apiKey && !isCommercialUsage(options)) {
            requestData.usage_type = 'non-commercial';
        }

        // Make API call to DeepSeek VL2
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // If extension is available and relevant to the analysis type, enhance with web research
        let enhancedAnalysis = result.choices[0].message.content;

        if (hasExtension && shouldPerformResearch(options.analysisType, enhancedAnalysis)) {
            try {
                // Extract key terms for research
                const researchTerms = extractResearchTerms(enhancedAnalysis, options.analysisType);

                // Perform web research on relevant topics
                const researchResults = await performResearch(researchTerms, {
                    depth: 'medium',
                    sources: getRelevantSources(options.analysisType)
                });

                // Enhance the analysis with research findings
                enhancedAnalysis = await enhanceAnalysisWithResearch(
                    enhancedAnalysis,
                    researchResults,
                    options.analysisType
                );
            } catch (researchError) {
                console.warn('Error enhancing analysis with research:', researchError);
                // Continue with original analysis if research enhancement fails
            }
        }

        return {
            analysis: enhancedAnalysis,
            model: modelName,
            usage: result.usage,
            metadata: await getImageMetadata(imageFile),
            enhanced: hasExtension,
            keyless: !options.apiKey && !isCommercialUsage(options)
        };
    } catch (error) {
        console.error('DeepSeek VL2 analysis error:', error);
        throw error;
    }
}

/**
 * Helper function to convert image to base64
 * @param {File|Blob} imageFile - The image file
 * @returns {Promise<string>} Base64 string without prefix
 */
async function imageToBase64(imageFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Extract just the base64 part without the data URL prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(imageFile);
    });
}

/**
 * Get basic image metadata
 * @param {File|Blob} imageFile - The image file
 * @returns {Promise<Object>} Image metadata
 */
async function getImageMetadata(imageFile) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(imageFile);

        img.onload = () => {
            // Basic metadata
            const metadata = {
                width: img.width,
                height: img.height,
                aspectRatio: img.width / img.height,
                fileSize: imageFile.size,
                fileType: imageFile.type,
                fileName: imageFile.name || 'unknown'
            };
            URL.revokeObjectURL(objectUrl);
            resolve(metadata);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image for metadata extraction'));
        };

        img.src = objectUrl;
    });
}

/**
 * Format DeepSeek VL2 analysis for document insertion
 * @param {Object} analysis - Analysis result from DeepSeek
 * @param {string} format - Format type for document
 * @returns {string} Formatted text for document
 */
export function formatDeepseekAnalysisForDocument(analysis, format = 'standard') {
    const { analysis: analysisText, metadata, model } = analysis;

    // Format based on document type
    switch (format) {
        case 'inspection_report':
            return `
HOME INSPECTION ANALYSIS (DeepSeek ${model.split('-')[2]})
=============================================
Image: ${metadata.fileName} (${metadata.width}×${metadata.height} pixels)
Date: ${new Date().toLocaleDateString()}

OBSERVATIONS
-----------
${analysisText}

RECOMMENDATIONS
-------------
* Review identified issues with a licensed contractor
* Address any safety concerns immediately
* Consider further professional inspection for any structural issues
`;

        case 'legal_document':
            return `
EVIDENCE DOCUMENTATION
=====================
Image Reference: ${metadata.fileName}
Analysis Date: ${new Date().toLocaleDateString()}
Analysis Tool: DeepSeek VL2 Visual Analysis System
Image Properties: ${metadata.width}×${metadata.height} pixels, ${(metadata.fileSize / 1024).toFixed(1)} KB

VISUAL CONTENT DESCRIPTION
------------------------
${analysisText}

NOTE: This computer-assisted analysis is provided for documentation purposes and should be verified by qualified professionals.
`;

        case 'damage_assessment':
            return `
PROPERTY DAMAGE ASSESSMENT
========================
Reference Image: ${metadata.fileName}
Assessment Date: ${new Date().toLocaleDateString()}
Image Details: ${metadata.width}×${metadata.height} pixels

DAMAGE DESCRIPTION
----------------
${analysisText}

This assessment is generated with AI assistance and should be reviewed by a qualified adjuster.
`;

        case 'compact':
            // Just the analysis text with minimal formatting
            return analysisText;

        default: // standard format
            return `
IMAGE ANALYSIS (DeepSeek VL2)
=========================
${analysisText}

Image Information:
- Filename: ${metadata.fileName}
- Dimensions: ${metadata.width}×${metadata.height} pixels
- File size: ${(metadata.fileSize / 1024).toFixed(1)} KB
- Analysis date: ${new Date().toLocaleDateString()}
`;
    }
}

/**
 * Determine if web research would be beneficial for this analysis
 * @param {string} analysisType - Type of analysis being performed
 * @param {string} initialAnalysis - Initial analysis text
 * @returns {boolean} Whether research should be performed
 */
function shouldPerformResearch(analysisType, initialAnalysis) {
    // Research is valuable for these analysis types
    const researchBeneficialTypes = [
        'home_inspection',
        'legal_evidence',
        'property_damage',
        'document_analysis'
    ];

    // Don't perform research for simple analyses
    if (initialAnalysis.length < 200) return false;

    // Check if analysis type benefits from research
    return researchBeneficialTypes.includes(analysisType);
}

/**
 * Extract key terms from analysis for research
 * @param {string} analysis - Initial analysis text
 * @param {string} analysisType - Type of analysis
 * @returns {string} Research query
 */
function extractResearchTerms(analysis, analysisType) {
    // Extract potential terms based on analysis type
    let terms = '';

    if (analysisType === 'home_inspection') {
        // Look for building issues, materials, defects
        const issues = analysis.match(/(?:damage|issue|problem|defect|crack|leak|mold|code violation)s?/gi) || [];
        const materials = analysis.match(/(?:concrete|wood|drywall|sheetrock|insulation|foundation|roof|siding)/gi) || [];
        terms = [...new Set([...issues, ...materials])].slice(0, 3).join(', ');
        return `building inspection ${terms}`;
    } else if (analysisType === 'legal_evidence') {
        // Look for legal terms, objects, conditions
        const legalTerms = analysis.match(/(?:evidence|accident|injury|damage|liability|scene|condition)/gi) || [];
        terms = [...new Set(legalTerms)].slice(0, 3).join(', ');
        return `legal documentation ${terms}`;
    } else if (analysisType === 'property_damage') {
        // Look for damage types, causes, materials
        const damageTerms = analysis.match(/(?:water damage|fire damage|structural|foundation|roof|insurance)/gi) || [];
        terms = [...new Set(damageTerms)].slice(0, 3).join(', ');
        return `property damage assessment ${terms}`;
    }

    // Default extraction for other types
    // Get most frequent non-common words
    const words = analysis.toLowerCase().split(/\W+/).filter(word =>
        word.length > 4 && !['there', 'their', 'about', 'which', 'would', 'could', 'should'].includes(word)
    );

    const wordCount = {};
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });

    const topWords = Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word]) => word);

    return topWords.join(' ');
}

/**
 * Get relevant research sources based on analysis type
 * @param {string} analysisType - Type of analysis
 * @returns {Array<string>} Relevant source types
 */
function getRelevantSources(analysisType) {
    switch (analysisType) {
        case 'home_inspection':
            return ['technical', 'regulatory', 'educational'];
        case 'legal_evidence':
            return ['academic', 'legal', 'government'];
        case 'property_damage':
            return ['technical', 'insurance', 'educational'];
        case 'document_analysis':
            return ['academic', 'technical', 'historical'];
        default:
            return ['web', 'educational'];
    }
}

/**
 * Enhance analysis with research findings
 * @param {string} analysis - Original analysis
 * @param {Object} research - Research results
 * @param {string} analysisType - Type of analysis
 * @returns {Promise<string>} Enhanced analysis
 */
async function enhanceAnalysisWithResearch(analysis, research, analysisType) {
    // If no research results, return original analysis
    if (!research || !research.findings || research.findings.length === 0) {
        return analysis;
    }

    // Extract relevant information from research
    const relevantFindings = research.findings
        .filter(finding => finding.relevance > 0.6)
        .slice(0, 3);

    if (relevantFindings.length === 0) {
        return analysis;
    }

    // Create enhancement based on analysis type
    let enhancement = '\n\n## Additional Context from Research\n\n';

    relevantFindings.forEach(finding => {
        enhancement += `- **${finding.title}**: ${finding.summary}\n`;
    });

    if (research.sources && research.sources.length > 0) {
        enhancement += '\n### Sources\n';
        research.sources
            .slice(0, 3)
            .forEach(source => {
                enhancement += `- ${source.title}: ${source.url}\n`;
            });
    }

    return analysis + enhancement;
}

import React from 'react';
import {
    Stack,
    Text,
    PrimaryButton,
    DefaultButton,
    Dropdown,
    TextField,
    Spinner,
    Image,
    MessageBar,
    MessageBarType,
    Label,
    Slider,
    ChoiceGroup,
    Toggle,
    Link,
    Icon
} from '@fluentui/react';
import {
    analyzeImage,
    insertImageToWord,
    resizeImage,
    formatImageAnalysisForDocument,
    AVAILABLE_MODELS
} from '../../utils/imageProcessor';
import {
    isDeepSeekExtensionAvailable,
    getExtensionCapabilities
} from '../../utils/deepseekExtension';

const analysisTypes = [
    { key: 'general', text: 'General Analysis' },
    { key: 'home_inspection', text: 'Home Inspection' },
    { key: 'legal_evidence', text: 'Legal Evidence' },
    { key: 'property_damage', text: 'Property Damage' },
    { key: 'accident_scene', text: 'Accident Scene' },
    { key: 'document_analysis', text: 'Document Analysis' }
];

const formatOptions = [
    { key: 'standard', text: 'Standard Format' },
    { key: 'report', text: 'Formal Report' },
    { key: 'evidence', text: 'Evidence Documentation' },
    { key: 'inspection', text: 'Inspection Report' },
    { key: 'caption_only', text: 'Caption Only' }
];

// Model selection options
const modelOptions = [
    { key: AVAILABLE_MODELS.GPT4_VISION, text: 'OpenAI GPT-4 Vision' },
    { key: AVAILABLE_MODELS.DEEPSEEK_VL2_BASE, text: 'DeepSeek VL2 Base' },
    { key: AVAILABLE_MODELS.DEEPSEEK_VL2_PRO, text: 'DeepSeek VL2 Pro' },
    { key: AVAILABLE_MODELS.DEEPSEEK_VL2_INSPECT, text: 'DeepSeek VL2 Inspect (Specialized)' }
];

export default class ImagePanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedImage: null,
            previewUrl: null,
            isAnalyzing: false,
            analysis: null,
            errorMessage: null,
            customPrompt: '',
            analysisType: 'general',
            formatType: 'standard',
            imageWidth: 500,
            alignment: 'center',
            insertOption: 'image_only',
            isInserting: false,
            selectedModel: AVAILABLE_MODELS.GPT4_VISION,
            useDeepseek: false,
            deepseekEndpoint: localStorage.getItem('deepseekEndpoint') || 'https://api.deepseek.com/v1/chat/completions',
            showAdvancedSettings: false,
            isExtensionAvailable: false,
            extensionCapabilities: null,
            useExtension: true,
            enhancedAnalysis: false,
            keylessAnalysis: false
        };

        this.fileInputRef = React.createRef();
    }

    componentDidMount() {
        // Check for DeepSeek extension
        this.checkExtensionAvailability();
    }

    componentWillUnmount() {
        // Clean up any object URLs to avoid memory leaks
        if (this.state.previewUrl) {
            URL.revokeObjectURL(this.state.previewUrl);
        }
    }

    checkExtensionAvailability = async () => {
        try {
            const isAvailable = await isDeepSeekExtensionAvailable();

            this.setState({ isExtensionAvailable: isAvailable });

            if (isAvailable) {
                const capabilities = await getExtensionCapabilities();
                this.setState({ extensionCapabilities: capabilities });
            }
        } catch (error) {
            console.warn('Error checking DeepSeek extension:', error);
        }
    };

    handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check if it's an image
        if (!file.type.startsWith('image/')) {
            this.setState({
                errorMessage: 'Selected file is not an image. Please select a valid image file.',
                selectedImage: null,
                previewUrl: null
            });
            return;
        }

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            this.setState({
                errorMessage: 'Image size exceeds 10MB limit. Please select a smaller image or resize it first.',
                selectedImage: null,
                previewUrl: null
            });
            return;
        }

        // Create preview
        const previewUrl = URL.createObjectURL(file);

        this.setState({
            selectedImage: file,
            previewUrl,
            errorMessage: null,
            analysis: null
        });
    };

    selectImageFile = () => {
        this.fileInputRef.current.click();
    };

    analyzeSelectedImage = async () => {
        const { selectedImage, analysisType, customPrompt, selectedModel, useExtension } = this.state;

        if (!selectedImage) {
            this.setState({ errorMessage: 'Please select an image to analyze' });
            return;
        }

        this.setState({ isAnalyzing: true, errorMessage: null });

        try {
            // Get appropriate API key based on model
            let apiKey = this.props.apiKey;
            let endpoint = null;

            // Use DeepSeek specific settings if it's a DeepSeek model
            if (selectedModel.includes('deepseek')) {
                if (this.props.useSeperateDeepseekKey) {
                    apiKey = this.props.deepseekApiKey;
                }
                endpoint = this.props.deepseekEndpoint || this.state.deepseekEndpoint;
            }

            // Check for non-commercial usage allowed for DeepSeek
            const isNonCommercial = this.props.deepseekNonCommercial === true;

            // Check if we should use the extension
            const canUseExtension = useExtension &&
                this.state.isExtensionAvailable &&
                selectedModel.includes('deepseek');

            // Perform analysis with selected model
            const analysisResult = await analyzeImage(selectedImage, apiKey, {
                analysisType,
                prompt: customPrompt || undefined,
                resize: true,
                maxDimension: 1000,
                model: selectedModel,
                deepseekEndpoint: endpoint,
                useExtension: canUseExtension,
                // Add flags for non-commercial usage
                allowNonCommercialKeyless: isNonCommercial,
                isCommercial: !isNonCommercial
            });

            // Set enhanced flag based on whether the extension was used
            const enhancedAnalysis = analysisResult.enhanced === true;

            // Add keyless flag to show whether API was used without a key
            const keylessAnalysis = analysisResult.keyless === true;

            this.setState({
                analysis: analysisResult,
                isAnalyzing: false,
                enhancedAnalysis,
                keylessAnalysis
            });
        } catch (error) {
            console.error('Image analysis error:', error);
            this.setState({
                errorMessage: `Error analyzing image: ${error.message}`,
                isAnalyzing: false
            });
        }
    };

    handleInsertToDocument = async () => {
        const { selectedImage, analysis, imageWidth, alignment, insertOption, formatType } = this.state;

        if (!selectedImage) {
            this.setState({ errorMessage: 'Please select an image first' });
            return;
        }

        this.setState({ isInserting: true });

        try {
            await Word.run(async (context) => {
                // Get current selection
                const range = context.document.getSelection();
                await context.sync();

                // Insert image
                if (insertOption !== 'analysis_only') {
                    // Resize image if needed
                    const resizedImage = imageWidth < 1600 ?
                        await resizeImage(selectedImage, imageWidth) :
                        selectedImage;

                    // Insert image to document
                    const success = await insertImageToWord(resizedImage, {
                        width: imageWidth,
                        alignment
                    });

                    if (!success) {
                        throw new Error('Failed to insert image');
                    }
                }

                // Insert analysis text if requested
                if (analysis && (insertOption === 'analysis_only' || insertOption === 'image_and_analysis')) {
                    // Format analysis for document insertion
                    const formattedAnalysis = formatImageAnalysisForDocument(analysis, formatType);

                    // Insert the analysis text
                    range.insertParagraph(formattedAnalysis, Word.InsertLocation.after);
                }

                await context.sync();
            });

            this.setState({
                isInserting: false,
                statusMessage: 'Successfully inserted into document'
            });

            // Clear status message after 3 seconds
            setTimeout(() => {
                this.setState({ statusMessage: null });
            }, 3000);
        } catch (error) {
            console.error('Error inserting to document:', error);
            this.setState({
                errorMessage: `Error inserting to document: ${error.message}`,
                isInserting: false
            });
        }
    };

    // Save DeepSeek endpoint to localStorage when changed
    handleDeepseekEndpointChange = (_, value) => {
        this.setState({ deepseekEndpoint: value });
        localStorage.setItem('deepseekEndpoint', value);
    };

    render() {
        const {
            previewUrl, selectedImage, isAnalyzing, analysis, errorMessage,
            customPrompt, analysisType, formatType, imageWidth, alignment,
            insertOption, isInserting, statusMessage, selectedModel,
            deepseekEndpoint, showAdvancedSettings, isExtensionAvailable,
            extensionCapabilities, useExtension, enhancedAnalysis,
            keylessAnalysis
        } = this.state;

        const isDeepseekModel = selectedModel.includes('deepseek');

        return (
            <Stack tokens={{ childrenGap: 15 }} className="image-panel">
                <Text variant="xLarge" className="panel-title">Image Analysis & Insertion</Text>

                {/* Error message */}
                {errorMessage && (
                    <MessageBar
                        messageBarType={MessageBarType.error}
                        onDismiss={() => this.setState({ errorMessage: null })}
                        isMultiline={true}
                    >
                        {errorMessage}
                    </MessageBar>
                )}

                {/* Status message */}
                {statusMessage && (
                    <MessageBar
                        messageBarType={MessageBarType.success}
                        onDismiss={() => this.setState({ statusMessage: null })}
                    >
                        {statusMessage}
                    </MessageBar>
                )}

                {/* Image selection */}
                <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="end">
                    <Stack.Item grow={1}>
                        <Label>Select Image</Label>
                        <DefaultButton
                            text={selectedImage ? "Change Image" : "Select Image"}
                            onClick={this.selectImageFile}
                            iconProps={{ iconName: 'PhotoCollection' }}
                        />
                        <input
                            type="file"
                            ref={this.fileInputRef}
                            onChange={this.handleFileSelect}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                    </Stack.Item>

                    {selectedImage && (
                        <Stack.Item>
                            <Text variant="small">
                                {selectedImage.name} ({Math.round(selectedImage.size / 1024)} KB)
                            </Text>
                        </Stack.Item>
                    )}
                </Stack>

                {/* Image preview */}
                {previewUrl && (
                    <div className="image-preview-container">
                        <Image
                            src={previewUrl}
                            alt="Selected image preview"
                            width={300}
                            height={200}
                            imageFit="cover"
                        />
                    </div>
                )}

                {/* Model selection dropdown - new */}
                <Dropdown
                    label="Analysis Model"
                    selectedKey={selectedModel}
                    options={modelOptions}
                    onChange={(_, option) => this.setState({ selectedModel: option.key })}
                />

                {/* DeepSeek specialized notice */}
                {selectedModel === AVAILABLE_MODELS.DEEPSEEK_VL2_INSPECT && (
                    <MessageBar messageBarType={MessageBarType.info}>
                        DeepSeek VL2 Inspect is specialized for detailed inspections and will provide more technical analysis.
                    </MessageBar>
                )}

                {/* Display DeepSeek Pro extension availability */}
                {isDeepseekModel && (
                    <Stack className={isExtensionAvailable ? "extension-available" : "extension-unavailable"}>
                        <Stack horizontal verticalAlign="center" horizontalAlign="space-between">
                            <Text variant="medium">
                                DeepSeek Pro Extension:
                                <span className={isExtensionAvailable ? "extension-badge-available" : "extension-badge-unavailable"}>
                                    {isExtensionAvailable ? " Available" : " Not Detected"}
                                </span>
                            </Text>

                            {!isExtensionAvailable && (
                                <Link
                                    href="https://chrome.google.com/webstore/detail/deepseek-pro/bifepkinbmimkekdmcnhlkbhmbgecfme"
                                    target="_blank"
                                >
                                    Install Extension
                                </Link>
                            )}
                        </Stack>

                        {isExtensionAvailable && (
                            <>
                                <Toggle
                                    label="Use DeepSeek Pro enhanced capabilities"
                                    checked={useExtension}
                                    onChange={(_, checked) => this.setState({ useExtension: checked })}
                                />

                                {extensionCapabilities && useExtension && (
                                    <Stack horizontal tokens={{ childrenGap: 8 }} wrap className="capability-tags">
                                        {extensionCapabilities.webSearch &&
                                            <span className="capability-tag web-tag">Web Search</span>}
                                        {extensionCapabilities.codeExecution &&
                                            <span className="capability-tag code-tag">Code</span>}
                                        {extensionCapabilities.rag &&
                                            <span className="capability-tag rag-tag">RAG</span>}
                                        {extensionCapabilities.research &&
                                            <span className="capability-tag research-tag">Research</span>}
                                    </Stack>
                                )}
                            </>
                        )}
                    </Stack>
                )}

                {/* Analysis options */}
                <Stack tokens={{ childrenGap: 10 }}>
                    <Dropdown
                        label="Analysis Type"
                        selectedKey={analysisType}
                        options={analysisTypes}
                        onChange={(_, option) => this.setState({ analysisType: option.key })}
                    />

                    {/* Advanced settings toggle */}
                    <DefaultButton
                        text={showAdvancedSettings ? "Hide Advanced Settings" : "Show Advanced Settings"}
                        iconProps={{ iconName: showAdvancedSettings ? 'ChevronUp' : 'ChevronDown' }}
                        onClick={() => this.setState({ showAdvancedSettings: !showAdvancedSettings })}
                    />

                    {/* Advanced settings */}
                    {showAdvancedSettings && (
                        <Stack tokens={{ childrenGap: 10 }} className="advanced-settings">
                            {isDeepseekModel && (
                                <TextField
                                    label="DeepSeek VL2 Endpoint"
                                    value={deepseekEndpoint}
                                    onChange={this.handleDeepseekEndpointChange}
                                    placeholder="https://api.deepseek.com/v1/chat/completions"
                                />
                            )}

                            <Text variant="small" style={{ fontStyle: 'italic' }}>
                                {isDeepseekModel
                                    ? "DeepSeek VL2 provides enhanced accuracy for legal and inspection image analysis"
                                    : "GPT-4 Vision provides general purpose image analysis"}
                            </Text>
                        </Stack>
                    )}

                    <TextField
                        label="Custom prompt (optional)"
                        multiline
                        rows={2}
                        value={customPrompt}
                        onChange={(_, value) => this.setState({ customPrompt: value })}
                        placeholder="Add specific instructions for image analysis..."
                    />

                    <PrimaryButton
                        text="Analyze Image"
                        onClick={this.analyzeSelectedImage}
                        disabled={!selectedImage || isAnalyzing}
                        iconProps={{ iconName: 'Search' }}
                    />
                </Stack>

                {/* Analysis progress */}
                {isAnalyzing && (
                    <Stack horizontal horizontalAlign="center" tokens={{ childrenGap: 10 }}>
                        <Spinner label="Analyzing image..." />
                    </Stack>
                )}

                {/* Analysis results */}
                {analysis && (
                    <Stack tokens={{ childrenGap: 10 }} className="analysis-results">
                        <Stack horizontal horizontalAlign="space-between">
                            <Text variant="mediumPlus" className="section-title">Analysis Results</Text>
                            <Stack horizontal verticalAlign="center">
                                <Text variant="small" style={{ fontStyle: 'italic' }}>
                                    {analysis.model && analysis.model.includes('deepseek')
                                        ? `DeepSeek VL2 Analysis`
                                        : `GPT-4 Vision Analysis`}
                                </Text>
                                {enhancedAnalysis && (
                                    <span className="enhanced-badge" title="Enhanced with DeepSeek Pro capabilities">
                                        <Icon iconName="Rocket" className="enhanced-icon" />
                                    </span>
                                )}
                                {keylessAnalysis && (
                                    <span className="keyless-badge" title="Using free non-commercial access">
                                        <Icon iconName="UnlockSolid" className="keyless-icon" />
                                    </span>
                                )}
                            </Stack>
                        </Stack>

                        {/* Add badge for non-commercial usage */}
                        {keylessAnalysis && (
                            <MessageBar messageBarType={MessageBarType.success}>
                                Using free non-commercial access to DeepSeek models. This image analysis is for non-commercial purposes only.
                            </MessageBar>
                        )}

                        <div className="analysis-text">
                            <Text>{analysis.analysis}</Text>
                        </div>

                        <Stack tokens={{ childrenGap: 15 }}>
                            <Dropdown
                                label="Format"
                                selectedKey={formatType}
                                options={formatOptions}
                                onChange={(_, option) => this.setState({ formatType: option.key })}
                            />

                            <Label>Image Width</Label>
                            <Slider
                                min={100}
                                max={800}
                                step={10}
                                value={imageWidth}
                                showValue
                                valueLabelFormat={value => `${value}px`}
                                onChange={value => this.setState({ imageWidth: value })}
                            />

                            <Label>Image Alignment</Label>
                            <ChoiceGroup
                                selectedKey={alignment}
                                options={[
                                    { key: 'left', text: 'Left', iconProps: { iconName: 'AlignLeft' } },
                                    { key: 'center', text: 'Center', iconProps: { iconName: 'AlignCenter' } },
                                    { key: 'right', text: 'Right', iconProps: { iconName: 'AlignRight' } }
                                ]}
                                onChange={(_, option) => this.setState({ alignment: option.key })}
                            />

                            <Label>Insert Options</Label>
                            <ChoiceGroup
                                selectedKey={insertOption}
                                options={[
                                    { key: 'image_only', text: 'Insert Image Only' },
                                    { key: 'analysis_only', text: 'Insert Analysis Text Only' },
                                    { key: 'image_and_analysis', text: 'Insert Image & Analysis' }
                                ]}
                                onChange={(_, option) => this.setState({ insertOption: option.key })}
                            />

                            <PrimaryButton
                                text="Insert into Document"
                                onClick={this.handleInsertToDocument}
                                disabled={isInserting}
                                iconProps={{ iconName: 'InsertTextBox' }}
                            />

                            {isInserting && <Spinner label="Inserting into document..." />}
                        </Stack>
                    </Stack>
                )}
            </Stack>
        );
    }
}

/**
 * Tests for the SystemIntegration component
 */

// Import Office.js mock
require('../mocks/officeMock');

describe('SystemIntegration', () => {
    // Mock dependencies
    const mockQualityStandards = {
        analyzeTextQuality: jest.fn().mockResolvedValue({
            clarity: 0.8,
            coherence: 0.9,
            engagement: 0.7,
            correctness: 0.95
        })
    };

    const mockModelManager = {
        generateText: jest.fn().mockResolvedValue('Generated text')
    };

    const mockDocumentManager = {
        insertTextAtSelection: jest.fn().mockResolvedValue(true),
        analyzeStructure: jest.fn().mockResolvedValue({
            paragraphs: 3,
            wordCount: 150,
            estimatedReadTime: 1
        })
    };

    let systemIntegration;

    beforeEach(() => {
        // Reset module registry before each test
        jest.resetModules();

        // Attach mock components to the JSDOM window
        global.window.qualityStandards = mockQualityStandards;
        global.window.modelManager = mockModelManager;
        global.window.documentManager = mockDocumentManager;

        // Import the module under test
        const SystemIntegration = require('../../src/core/system-integration.cjs');

        // Create a new instance for testing
        systemIntegration = new SystemIntegration();
    });

    test('should load component references', () => {
        // Arrange & Act
        systemIntegration.loadComponentReferences();

        // Assert
        expect(systemIntegration.components.qualityStandards).toBe(mockQualityStandards);
        expect(systemIntegration.components.modelManager).toBe(mockModelManager);
        expect(systemIntegration.components.documentManager).toBe(mockDocumentManager);
    });

    test('should analyze document structure', async () => {
        // Arrange
        systemIntegration.loadComponentReferences();
        const documentText = 'This is a test document';

        // Act
        const result = await systemIntegration.analyzeDocumentStructure(documentText);

        // Assert
        expect(mockDocumentManager.analyzeStructure).toHaveBeenCalledWith(documentText);
        expect(result).toEqual({
            paragraphs: 3,
            wordCount: 150,
            estimatedReadTime: 1
        });
    });

    test('should analyze content quality', async () => {
        // Arrange
        systemIntegration.loadComponentReferences();
        const documentText = 'This is a test document';

        // Act
        const result = await systemIntegration.analyzeContentQuality(documentText);

        // Assert
        expect(mockQualityStandards.analyzeTextQuality).toHaveBeenCalledWith(documentText);
        expect(result).toEqual({
            clarity: 0.8,
            coherence: 0.9,
            engagement: 0.7,
            correctness: 0.95
        });
    });

    test('should identify improvement areas correctly', () => {
        // Arrange
        const qualityMetrics = {
            clarity: 0.6, // below threshold
            coherence: 0.8,
            engagement: 0.5, // below threshold
            correctness: 0.9,
            conciseness: 0.7
        };

        // Act
        const improvementAreas = systemIntegration.identifyImprovementAreas(qualityMetrics);

        // Assert
        expect(improvementAreas).toContain('clarity');
        expect(improvementAreas).toContain('engagement');
        expect(improvementAreas).not.toContain('coherence');
        expect(improvementAreas).not.toContain('correctness');
        expect(improvementAreas).not.toContain('conciseness');
    });

    afterAll(() => {
        delete global.window.qualityStandards;
        delete global.window.modelManager;
        delete global.window.documentManager;
    });
});

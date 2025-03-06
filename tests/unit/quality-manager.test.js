/**
 * Unit tests for the Quality Manager module
 */

const assert = require('assert');
const sinon = require('sinon');

// Mock objects for testing
const mockPerformanceNow = sinon.stub().returns(1000);
const mockConsoleError = sinon.spy();
const mockLocalStorage = {
    getItem: sinon.stub(),
    setItem: sinon.spy()
};

// Save original objects
const originalPerformance = global.performance;
const originalConsole = global.console;
const originalLocalStorage = global.localStorage;

// Mock the global objects
global.performance = { now: mockPerformanceNow };
global.console = { ...console, error: mockConsoleError };
global.localStorage = mockLocalStorage;

// Import the module under test
const QualityManager = require('../../dist/quality-manager');

describe('QualityManager', () => {
    let qualityManager;

    beforeEach(() => {
        // Reset mock states
        mockPerformanceNow.reset();
        mockConsoleError.reset();
        mockLocalStorage.getItem.reset();
        mockLocalStorage.setItem.reset();

        // Create new instance for each test
        qualityManager = new QualityManager();
    });

    afterAll(() => {
        // Restore original objects
        global.performance = originalPerformance;
        global.console = originalConsole;
        global.localStorage = originalLocalStorage;
    });

    describe('startMeasurement', () => {
        it('should store timestamp for measurement', () => {
            mockPerformanceNow.returns(1234);
            qualityManager.startMeasurement('testMeasurement');
            expect(qualityManager.marks.testMeasurement).toBe(1234);
        });
    });

    describe('endMeasurement', () => {
        it('should calculate duration correctly', () => {
            // Setup
            mockPerformanceNow
                .onFirstCall().returns(1000)
                .onSecondCall().returns(1500);

            // Exercise
            qualityManager.startMeasurement('testMeasurement');
            mockPerformanceNow.reset(); // Reset to use second stub value
            mockPerformanceNow.returns(1500);
            const duration = qualityManager.endMeasurement('testMeasurement', 'responseTime');

            // Verify
            expect(duration).toBe(500);
            expect(qualityManager.metrics.performance.responseTime.length).toBe(1);
            expect(qualityManager.metrics.performance.responseTime[0]).toBe(500);
        });

        it('should warn when duration exceeds threshold', () => {
            // Setup
            mockPerformanceNow
                .onFirstCall().returns(1000)
                .onSecondCall().returns(7000);
            const consoleSpy = sinon.spy(console, 'warn');

            // Exercise
            qualityManager.startMeasurement('testMeasurement');
            mockPerformanceNow.reset();
            mockPerformanceNow.returns(7000);
            qualityManager.endMeasurement('testMeasurement', 'responseTime');

            // Verify
            expect(consoleSpy.calledWith(sinon.match(/Performance issue/))).toBe(true);
            consoleSpy.restore();
        });

        it('should return undefined for unknown measurements', () => {
            const result = qualityManager.endMeasurement('nonExistentMeasurement', 'responseTime');
            expect(result).toBeUndefined();
        });
    });

    describe('logError', () => {
        it('should log errors with timestamp and details', () => {
            // Exercise
            qualityManager.logError('api', 'Test error', { code: 500 });

            // Verify
            const errors = qualityManager.metrics.errors.api;
            expect(errors.length).toBe(1);
            expect(errors[0].message).toBe('Test error');
            expect(errors[0].details.code).toBe(500);
            expect(errors[0].timestamp).toBeDefined();
        });

        it('should limit error history to 50 entries', () => {
            // Fill with 51 errors
            for (let i = 0; i < 51; i++) {
                qualityManager.logError('ui', `Error ${i}`);
            }

            // Verify oldest error is removed
            expect(qualityManager.metrics.errors.ui.length).toBe(50);
            expect(qualityManager.metrics.errors.ui[0].message).toBe('Error 1');
        });
    });

    describe('assessResponseQuality', () => {
        it('should detect empty responses', () => {
            const result = qualityManager.assessResponseQuality('');
            expect(result.quality).toBe(0);
            expect(result.issues).toContain('Empty response');
        });

        it('should penalize responses that are too short', () => {
            const result = qualityManager.assessResponseQuality('Too short');
            expect(result.quality).toBeLessThan(1.0);
            expect(result.issues[0]).toMatch(/too short/i);
        });

        it('should penalize long sentences', () => {
            const longSentence = 'This is a very long sentence that exceeds the maximum recommended length because it has too many words and should be split into multiple sentences for better readability and clarity according to good writing practices that we should follow to ensure high quality responses that users will find easy to understand and process.';
            const result = qualityManager.assessResponseQuality(longSentence);
            expect(result.quality).toBeLessThan(1.0);
            expect(result.issues[0]).toMatch(/long sentences/i);
        });

        it('should penalize banned phrases', () => {
            const response = "I'm sorry, I cannot help with that request.";
            const result = qualityManager.assessResponseQuality(response);
            expect(result.quality).toBeLessThan(1.0);
            expect(result.issues[0]).toMatch(/banned phrase/i);
        });

        it('should give full score to good responses', () => {
            const goodResponse = "Here's a concise explanation of the topic. First, consider the main points. Second, review the evidence. Finally, draw conclusions based on your analysis.";
            const result = qualityManager.assessResponseQuality(goodResponse);
            expect(result.quality).toBe(1.0);
            expect(result.issues).toEqual(['No issues detected']);
        });
    });

    describe('generateQualityReport', () => {
        it('should generate a complete report', () => {
            // Mock some performance stats
            qualityManager.metrics.performance.responseTime = [1000, 2000, 3000];
            qualityManager.metrics.errors.api = [{ message: 'Test error' }];

            // Exercise
            const report = qualityManager.generateQualityReport();

            // Verify report structure
            expect(report).toHaveProperty('timestamp');
            expect(report).toHaveProperty('performance');
            expect(report).toHaveProperty('usage');
            expect(report).toHaveProperty('errorSummary');
            expect(report).toHaveProperty('qualityScore');

            // Verify report content
            expect(report.performance.avgResponseTime).toBe(2000);
            expect(report.errorSummary.apiErrors).toBe(1);
        });
    });

    describe('checkImageQuality', () => {
        it('should reject oversized images', async () => {
            const oversizedImage = { size: 11 * 1024 * 1024 }; // 11MB

            await expect(qualityManager.checkImageQuality(oversizedImage))
                .rejects
                .toThrow(/too large/);
        });

        // Additional image tests would go here in a real test suite
        // They would test dimension checks, aspect ratio, etc.
    });
});

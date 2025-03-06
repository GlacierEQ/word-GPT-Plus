/**
 * Word GPT Plus - Quality Standards
 * Defines quality standards, testing utilities, and validation methods
 */

class QualityStandards {
    constructor() {
        // Quality thresholds
        this.thresholds = {
            minCodeCoverage: 80, // Minimum test coverage percentage
            maxCyclomaticComplexity: 10, // Maximum function complexity
            maxFunctionLength: 50, // Maximum lines per function
            minDocumentationCoverage: 90, // Percentage of public methods documented
            maxDependencies: 15, // Maximum external dependencies
            maxBundleSize: 500 * 1024, // Maximum bundle size in bytes (500KB)
            maxStartupTime: 1000, // Maximum startup time in milliseconds
            maxMemoryUsage: 50 * 1024 * 1024, // Maximum memory usage (50MB)
            accessibilityLevel: 'AA', // WCAG compliance level
        };

        // Initialize collectors
        this.metrics = {
            codeCoverage: {},
            complexity: {},
            lintErrors: {},
            performance: {},
            accessibilityIssues: []
        };
    }

    /**
     * Validate code against quality standards
     * @param {string} code - Code to validate
     * @param {string} fileName - Name of the file being validated
     * @returns {Object} Validation results
     */
    validateCode(code, fileName) {
        const results = {
            fileName,
            passed: true,
            issues: [],
            metrics: {}
        };

        // Check line length
        const lines = code.split('\n');
        const longLines = lines.filter(line => line.length > 100);
        if (longLines.length > 0) {
            results.issues.push({
                type: 'style',
                message: `${longLines.length} lines exceed maximum length of 100 characters`,
                severity: 'warning'
            });
        }

        // Check function length
        const functionLengths = this.measureFunctionLengths(code);
        const longFunctions = functionLengths.filter(fn => fn.length > this.thresholds.maxFunctionLength);
        if (longFunctions.length > 0) {
            results.passed = false;
            results.issues.push({
                type: 'complexity',
                message: `${longFunctions.length} functions exceed maximum length of ${this.thresholds.maxFunctionLength} lines`,
                severity: 'error',
                details: longFunctions.map(fn => `${fn.name}: ${fn.length} lines`)
            });
        }

        // Check complexity
        const complexityResults = this.measureComplexity(code);
        const complexFunctions = complexityResults.filter(fn => fn.complexity > this.thresholds.maxCyclomaticComplexity);
        if (complexFunctions.length > 0) {
            results.passed = false;
            results.issues.push({
                type: 'complexity',
                message: `${complexFunctions.length} functions exceed maximum cyclomatic complexity of ${this.thresholds.maxCyclomaticComplexity}`,
                severity: 'error',
                details: complexFunctions.map(fn => `${fn.name}: complexity ${fn.complexity}`)
            });
        }

        // Check documentation
        const docResults = this.checkDocumentation(code);
        if (docResults.coverage < this.thresholds.minDocumentationCoverage) {
            results.issues.push({
                type: 'documentation',
                message: `Documentation coverage (${docResults.coverage}%) is below minimum threshold (${this.thresholds.minDocumentationCoverage}%)`,
                severity: 'warning'
            });
        }

        // Store metrics
        results.metrics = {
            lineCount: lines.length,
            documentationCoverage: docResults.coverage,
            averageComplexity: complexityResults.reduce((sum, fn) => sum + fn.complexity, 0) /
                (complexityResults.length || 1),
            maxComplexity: Math.max(...complexityResults.map(fn => fn.complexity), 0)
        };

        return results;
    }

    /**
     * Measure function lengths in code
     * @param {string} code - Code to analyze
     * @returns {Array<Object>} Array of function name and length pairs
     */
    measureFunctionLengths(code) {
        // Simple regex-based function detection
        // This is a simplified approach and would be more robust in a real implementation
        const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*\{|\(\s*\)\s*=>\s*\{|(\w+)\s*\([^)]*\)\s*\{/g;
        const functions = [];
        let match;

        while ((match = functionRegex.exec(code)) !== null) {
            const functionName = match[1] || match[2] || 'anonymous';
            const startPos = match.index;

            // Find the closing brace (this is simplified and doesn't handle nested functions properly)
            let braceCount = 1;
            let endPos = startPos + match[0].length;

            while (braceCount > 0 && endPos < code.length) {
                if (code[endPos] === '{') braceCount++;
                if (code[endPos] === '}') braceCount--;
                endPos++;
            }

            const functionBody = code.substring(startPos, endPos);
            const lineCount = functionBody.split('\n').length;

            functions.push({
                name: functionName,
                length: lineCount
            });
        }

        return functions;
    }

    /**
     * Measure cyclomatic complexity of functions in code
     * @param {string} code - Code to analyze
     * @returns {Array<Object>} Array of function name and complexity pairs
     */
    measureComplexity(code) {
        // This is a simplified approach; a real implementation would use an AST parser
        const functions = this.measureFunctionLengths(code);

        return functions.map(fn => {
            const functionName = fn.name;
            const startIndex = code.indexOf(functionName);
            const endIndex = startIndex + 1000; // arbitrary limit for simplicity
            const functionCode = code.substring(startIndex, endIndex);

            // Count decision points as a rough measure of complexity
            const ifCount = (functionCode.match(/if\s*\(/g) || []).length;
            const forCount = (functionCode.match(/for\s*\(/g) || []).length;
            const whileCount = (functionCode.match(/while\s*\(/g) || []).length;
            const switchCount = (functionCode.match(/switch\s*\(/g) || []).length;
            const caseCount = (functionCode.match(/case\s+/g) || []).length;
            const andCount = (functionCode.match(/&&/g) || []).length;
            const orCount = (functionCode.match(/\|\|/g) || []).length;
            const ternaryCount = (functionCode.match(/\?/g) || []).length;

            // Calculate McCabe complexity: 1 + decision points
            const complexity = 1 + ifCount + forCount + whileCount + switchCount + caseCount +
                andCount + orCount + ternaryCount;

            return {
                name: functionName,
                complexity
            };
        });
    }

    /**
     * Check documentation coverage of code
     * @param {string} code - Code to analyze
     * @returns {Object} Documentation coverage results
     */
    checkDocumentation(code) {
        // Find function declarations
        const functionRegex = /function\s+(\w+)|(\w+)\s*=\s*function|(\w+)\s*\([^)]*\)\s*{|class\s+(\w+)/g;
        const functions = [];
        let match;

        while ((match = functionRegex.exec(code)) !== null) {
            const functionName = match[1] || match[2] || match[3] || match[4] || 'anonymous';
            functions.push(functionName);
        }

        // Find JSDoc style comments
        const jsDocRegex = /\/\*\*[\s\S]*?\*\//g;
        const comments = code.match(jsDocRegex) || [];

        // Count function names that appear in comments
        let documentedFunctions = 0;
        functions.forEach(functionName => {
            for (const comment of comments) {
                if (comment.includes(functionName)) {
                    documentedFunctions++;
                    break;
                }
            }
        });

        // Calculate coverage
        const coverage = functions.length > 0 ?
            Math.round((documentedFunctions / functions.length) * 100) : 100;

        return {
            totalFunctions: functions.length,
            documentedFunctions,
            coverage
        };
    }

    /**
     * Run accessibility checks on HTML content
     * @param {string} html - HTML content to check
     * @returns {Object} Accessibility issues found
     */
    checkAccessibility(html) {
        // This would use a real accessibility testing library in production
        const issues = [];

        // Check for basic accessibility issues
        if (!html.includes('lang=')) {
            issues.push({
                rule: 'html-lang',
                impact: 'serious',
                message: 'HTML element should have a lang attribute'
            });
        }

        if (html.includes('<img') && !html.includes('alt=')) {
            issues.push({
                rule: 'image-alt',
                impact: 'critical',
                message: 'Images should have alt attributes'
            });
        }

        if (html.includes('<button') && !html.includes('aria-label')) {
            issues.push({
                rule: 'button-label',
                impact: 'moderate',
                message: 'Buttons should have accessible labels'
            });
        }

        // Store issues
        this.metrics.accessibilityIssues = [...this.metrics.accessibilityIssues, ...issues];

        return {
            issues,
            passed: issues.length === 0
        };
    }

    /**
     * Analyze bundle size and composition
     * @param {string} bundlePath - Path to JavaScript bundle
     * @returns {Promise<Object>} Bundle analysis results
     */
    async analyzeBundleSize(bundlePath) {
        // In a real implementation, this would use webpack-bundle-analyzer or similar
        try {
            const fs = require('fs');
            const stats = await fs.promises.stat(bundlePath);
            const sizeInBytes = stats.size;

            const passed = sizeInBytes <= this.thresholds.maxBundleSize;

            return {
                sizeInBytes,
                sizeInKB: Math.round(sizeInBytes / 1024),
                passed,
                percentOfThreshold: Math.round((sizeInBytes / this.thresholds.maxBundleSize) * 100)
            };
        } catch (error) {
            console.error(`Error analyzing bundle: ${error.message}`);
            return {
                error: error.message,
                passed: false
            };
        }
    }

    /**
     * Generate quality report
     * @returns {Object} Quality report data
     */
    generateQualityReport() {
        // Calculate overall quality score
        const scores = {
            codeCoverage: this.calculateCodeCoverageScore(),
            complexity: this.calculateComplexityScore(),
            performance: this.calculatePerformanceScore(),
            accessibility: this.calculateAccessibilityScore(),
            documentation: this.calculateDocumentationScore()
        };

        const overallScore = Math.round(
            (scores.codeCoverage * 0.25) +
            (scores.complexity * 0.2) +
            (scores.performance * 0.25) +
            (scores.accessibility * 0.15) +
            (scores.documentation * 0.15)
        );

        return {
            timestamp: new Date().toISOString(),
            overallScore,
            categoryScores: scores,
            metrics: this.metrics,
            recommendations: this.generateRecommendations(scores)
        };
    }

    /**
     * Calculate code coverage score (0-100)
     * @returns {number} Code coverage score
     */
    calculateCodeCoverageScore() {
        // In a real implementation, this would use actual code coverage data
        const averageCoverage = Object.values(this.metrics.codeCoverage)
            .reduce((sum, val) => sum + val, 0) /
            (Object.keys(this.metrics.codeCoverage).length || 1);

        return Math.min(100, Math.round(
            (averageCoverage / this.thresholds.minCodeCoverage) * 100
        ));
    }

    /**
     * Calculate code complexity score (0-100)
     * @returns {number} Complexity score
     */
    calculateComplexityScore() {
        // Lower complexity is better
        const complexityValues = Object.values(this.metrics.complexity);
        if (complexityValues.length === 0) return 100;

        const averageComplexity = complexityValues.reduce((sum, val) => sum + val, 0) /
            complexityValues.length;

        return Math.min(100, Math.max(0, Math.round(
            100 - (averageComplexity / this.thresholds.maxCyclomaticComplexity) * 100
        )));
    }

    /**
     * Calculate performance score (0-100)
     * @returns {number} Performance score
     */
    calculatePerformanceScore() {
        // In a real implementation, this would use actual performance metrics
        const startupTime = this.metrics.performance.startupTime || 500;
        const memoryUsage = this.metrics.performance.memoryUsage || (20 * 1024 * 1024);

        const startupScore = Math.min(100, Math.max(0, Math.round(
            100 - (startupTime / this.thresholds.maxStartupTime) * 100
        )));

        const memoryScore = Math.min(100, Math.max(0, Math.round(
            100 - (memoryUsage / this.thresholds.maxMemoryUsage) * 100
        )));

        return Math.round((startupScore + memoryScore) / 2);
    }

    /**
     * Calculate accessibility score (0-100)
     * @returns {number} Accessibility score
     */
    calculateAccessibilityScore() {
        const issueCount = this.metrics.accessibilityIssues.length;
        // Arbitrary penalty: -5 points per critical issue, -3 per serious, -1 per moderate
        const criticalIssues = this.metrics.accessibilityIssues.filter(i => i.impact === 'critical').length;
        const seriousIssues = this.metrics.accessibilityIssues.filter(i => i.impact === 'serious').length;
        const moderateIssues = this.metrics.accessibilityIssues.filter(i => i.impact === 'moderate').length;

        const penalty = (criticalIssues * 5) + (seriousIssues * 3) + (moderateIssues * 1);
        return Math.max(0, 100 - penalty);
    }

    /**
     * Calculate documentation score (0-100)
     * @returns {number} Documentation score
     */
    calculateDocumentationScore() {
        // In a real implementation, this would use actual documentation coverage data
        // Here we return 100 for simplicity
        return 100;
    }

    /**
     * Generate improvement recommendations based on scores
     * @param {Object} scores - Category scores
     * @returns {Array<string>} Recommendations
     */
    generateRecommendations(scores) {
        const recommendations = [];

        if (scores.codeCoverage < 70) {
            recommendations.push('Increase test coverage, focusing on core functionality');
        }

        if (scores.complexity < 70) {
            recommendations.push('Refactor complex functions to reduce cyclomatic complexity');
        }

        if (scores.performance < 70) {
            recommendations.push('Optimize startup time and memory usage');
        }

        if (scores.accessibility < 80) {
            recommendations.push('Address accessibility issues, prioritizing critical ones');
        }

        if (scores.documentation < 80) {
            recommendations.push('Improve code documentation, especially for public APIs');
        }

        return recommendations;
    }
}

module.exports = new QualityStandards();

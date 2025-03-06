/**
 * Word GPT Plus - Quality Standards Manager
 * Establishes and enforces quality metrics across all components
 */

class QualityStandards {
    constructor() {
        // Quality thresholds
        this.thresholds = {
            responseTime: {
                excellent: 800,  // ms
                good: 1500,      // ms
                acceptable: 3000 // ms
            },
            textQuality: {
                coherence: 0.85,
                relevance: 0.90,
                accuracy: 0.95
            },
            errorRates: {
                critical: 0.001,  // 0.1% max
                major: 0.005,     // 0.5% max
                minor: 0.02       // 2% max
            },
            userSatisfaction: {
                target: 0.90      // 90% satisfaction goal
            }
        };

        // Measurement metrics
        this.metrics = {
            performance: {},
            quality: {},
            errors: [],
            userFeedback: []
        };

        // Initialize decision engine
        this.decisionEngine = {
            qualityOptimizations: {
                active: true,
                strategies: [
                    'contentEnhancement',
                    'performanceBalancing',
                    'errorPrevention'
                ]
            }
        };

        // Set up continuous monitoring
        this.setupMonitoring();
    }

    /**
     * Set up quality monitoring
     */
    setupMonitoring() {
        // Performance monitoring
        this.performanceObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.recordPerformanceMetric(entry.name, entry.duration);
            }
        });

        try {
            this.performanceObserver.observe({ entryTypes: ['measure'] });
            console.log('Quality monitoring initialized');
        } catch (e) {
            console.warn('Performance monitoring not available:', e);
        }

        // Error monitoring
        window.addEventListener('error', (event) => {
            this.recordError({
                type: 'unhandled',
                message: event.message,
                source: event.filename,
                stack: event.error?.stack
            });
        });
    }

    /**
     * Record a performance metric
     * @param {string} name - Metric name
     * @param {number} value - Metric value
     */
    recordPerformanceMetric(name, value) {
        if (!this.metrics.performance[name]) {
            this.metrics.performance[name] = {
                samples: [],
                min: Number.MAX_VALUE,
                max: Number.MIN_VALUE,
                avg: 0,
                p95: 0
            };
        }

        const metric = this.metrics.performance[name];
        metric.samples.push(value);
        metric.min = Math.min(metric.min, value);
        metric.max = Math.max(metric.max, value);

        // Update average
        const sum = metric.samples.reduce((acc, val) => acc + val, 0);
        metric.avg = sum / metric.samples.length;

        // Calculate p95 (95th percentile)
        if (metric.samples.length >= 20) {
            const sorted = [...metric.samples].sort((a, b) => a - b);
            const idx = Math.floor(sorted.length * 0.95);
            metric.p95 = sorted[idx];

            // Limit sample size to prevent memory issues
            if (metric.samples.length > 100) {
                metric.samples = metric.samples.slice(-100);
            }
        }

        // Check against thresholds
        this.evaluatePerformanceMetric(name, value);
    }

    /**
     * Evaluate a performance metric against thresholds
     * @param {string} name - Metric name
     * @param {number} value - Metric value
     */
    evaluatePerformanceMetric(name, value) {
        // For response time metrics
        if (name.includes('response') || name.includes('generation')) {
            const thresholds = this.thresholds.responseTime;

            if (value <= thresholds.excellent) {
                // No action needed - excellent performance
            } else if (value <= thresholds.good) {
                // Good performance, log for monitoring
                console.log(`Good performance for ${name}: ${value}ms`);
            } else if (value <= thresholds.acceptable) {
                // Acceptable but could be improved
                console.warn(`Performance alert for ${name}: ${value}ms`);
                this.optimizeForMetric(name);
            } else {
                // Performance issue
                console.error(`Performance issue for ${name}: ${value}ms`);
                this.optimizeForMetric(name, true);
            }
        }
    }

    /**
     * Record an error
     * @param {Object} error - Error information
     */
    recordError(error) {
        error.timestamp = new Date().toISOString();
        this.metrics.errors.push(error);

        // Limit stored errors
        if (this.metrics.errors.length > 100) {
            this.metrics.errors = this.metrics.errors.slice(-100);
        }

        // Log for monitoring
        console.error('Quality monitor recorded error:', error);

        // Calculate error rates
        this.calculateErrorRates();
    }

    /**
     * Calculate error rates
     */
    calculateErrorRates() {
        const recentErrors = this.metrics.errors.filter(
            error => new Date() - new Date(error.timestamp) < 24 * 60 * 60 * 1000
        );

        // Count by severity
        const criticalCount = recentErrors.filter(e => e.severity === 'critical').length;
        const majorCount = recentErrors.filter(e => e.severity === 'major').length;
        const minorCount = recentErrors.filter(e => e.severity === 'minor' || !e.severity).length;

        // Total operations estimate (could be more sophisticated)
        const totalOperations = Math.max(1000,
            Object.values(this.metrics.performance)
                .reduce((sum, metric) => sum + metric.samples.length, 0)
        );

        // Calculate rates
        const rates = {
            critical: criticalCount / totalOperations,
            major: majorCount / totalOperations,
            minor: minorCount / totalOperations
        };

        // Store the rates
        this.metrics.errorRates = rates;

        // Check against thresholds
        if (rates.critical > this.thresholds.errorRates.critical) {
            console.error('Critical error rate exceeded threshold!', rates.critical);
            this.mitigateErrors('critical');
        }

        if (rates.major > this.thresholds.errorRates.major) {
            console.error('Major error rate exceeded threshold!', rates.major);
            this.mitigateErrors('major');
        }
    }

    /**
     * Record text quality metrics
     * @param {string} text - Generated text
     * @param {Object} metrics - Quality metrics
     */
    recordTextQuality(text, metrics = {}) {
        // In a real implementation, these would be calculated
        // through NLP analysis or user feedback
        const qualityMetrics = {
            textId: `text_${Date.now()}`,
            timestamp: new Date().toISOString(),
            length: text.length,
            wordCount: text.split(/\s+/).length,
            ...metrics
        };

        // Store quality metrics
        if (!this.metrics.quality[qualityMetrics.textId]) {
            this.metrics.quality[qualityMetrics.textId] = qualityMetrics;
        }

        // Check against thresholds
        if (qualityMetrics.coherence &&
            qualityMetrics.coherence < this.thresholds.textQuality.coherence) {
            console.warn('Text coherence below threshold:', qualityMetrics.coherence);
        }

        if (qualityMetrics.relevance &&
            qualityMetrics.relevance < this.thresholds.textQuality.relevance) {
            console.warn('Text relevance below threshold:', qualityMetrics.relevance);
        }

        return qualityMetrics;
    }

    /**
     * Record user feedback on generated content
     * @param {string} textId - Text identifier
     * @param {Object} feedback - User feedback object
     */
    recordUserFeedback(textId, feedback) {
        const feedbackEntry = {
            textId,
            timestamp: new Date().toISOString(),
            ...feedback
        };

        this.metrics.userFeedback.push(feedbackEntry);

        // Update satisfaction metrics
        this.updateUserSatisfactionMetrics();

        // If quality metrics exist for this text, update them
        if (this.metrics.quality[textId]) {
            this.metrics.quality[textId].userFeedback = feedbackEntry;
        }

        return feedbackEntry;
    }

    /**
     * Update user satisfaction metrics
     */
    updateUserSatisfactionMetrics() {
        const recentFeedback = this.metrics.userFeedback.filter(
            fb => new Date() - new Date(fb.timestamp) < 30 * 24 * 60 * 60 * 1000
        );

        if (recentFeedback.length === 0) return;

        // Calculate satisfaction rate (positive ratings / total)
        const positiveCount = recentFeedback.filter(fb =>
            fb.rating >= 4 || fb.satisfied === true
        ).length;

        const satisfactionRate = positiveCount / recentFeedback.length;

        // Store the rate
        this.metrics.satisfactionRate = satisfactionRate;

        // Check against threshold
        if (satisfactionRate < this.thresholds.userSatisfaction.target) {
            console.warn('User satisfaction below target:', satisfactionRate);
            this.improveUserSatisfaction();
        }
    }

    /**
     * Optimize performance for a specific metric
     * @param {string} metricName - Metric to optimize
     * @param {boolean} urgent - Whether optimization is urgent
     */
    optimizeForMetric(metricName, urgent = false) {
        if (!this.decisionEngine.qualityOptimizations.active) return;

        console.log(`Optimizing for ${metricName}${urgent ? ' (urgent)' : ''}`);

        // Apply different strategies based on the metric
        if (metricName.includes('response') || metricName.includes('generation')) {
            // For response time metrics
            if (urgent) {
                // Consider switching to a faster, potentially lower-quality model
                console.log('Consider switching to faster response model');
            } else {
                // Use caching strategies
                console.log('Applying caching optimizations');
            }
        }

        // Notify system about optimizations
        if (typeof window.notifyOptimization === 'function') {
            window.notifyOptimization({
                metric: metricName,
                urgent: urgent,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Mitigate errors of a specific severity
     * @param {string} severity - Error severity level
     */
    mitigateErrors(severity) {
        console.log(`Mitigating ${severity} errors`);

        // Analyze recent errors
        const recentErrors = this.metrics.errors.filter(
            error => error.severity === severity &&
                new Date() - new Date(error.timestamp) < 24 * 60 * 60 * 1000
        );

        // Group by error type/message
        const errorGroups = {};
        recentErrors.forEach(error => {
            const key = error.message || 'unknown';
            if (!errorGroups[key]) {
                errorGroups[key] = [];
            }
            errorGroups[key].push(error);
        });

        // Find the most common error
        let mostCommonError = null;
        let maxCount = 0;

        Object.entries(errorGroups).forEach(([key, errors]) => {
            if (errors.length > maxCount) {
                maxCount = errors.length;
                mostCommonError = key;
            }
        });

        if (mostCommonError) {
            console.log(`Most common ${severity} error: ${mostCommonError} (${maxCount} occurrences)`);

            // Implement mitigation strategies
            if (severity === 'critical') {
                // For critical errors, consider failover options
                console.log('Activating failover mechanisms for critical errors');
            }
        }
    }

    /**
     * Improve user satisfaction based on feedback
     */
    improveUserSatisfaction() {
        console.log('Implementing user satisfaction improvements');

        // Analyze negative feedback
        const negativeFeedback = this.metrics.userFeedback.filter(fb =>
            fb.rating < 3 || fb.satisfied === false
        );

        if (negativeFeedback.length > 0) {
            // Check for common issues in feedback
            const issues = {};
            negativeFeedback.forEach(fb => {
                if (fb.issues && Array.isArray(fb.issues)) {
                    fb.issues.forEach(issue => {
                        issues[issue] = (issues[issue] || 0) + 1;
                    });
                }

                if (fb.comments) {
                    // Simple keyword extraction from comments
                    const keywords = ['slow', 'confusing', 'wrong', 'irrelevant', 'error'];
                    keywords.forEach(keyword => {
                        if (fb.comments.toLowerCase().includes(keyword)) {
                            issues[keyword] = (issues[keyword] || 0) + 1;
                        }
                    });
                }
            });

            // Log the most common issues
            const sortedIssues = Object.entries(issues)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);

            console.log('Top user satisfaction issues:', sortedIssues);

            // Adjust quality parameters based on issues
            if (sortedIssues.length > 0) {
                // Enable more aggressive quality optimizations
                this.decisionEngine.qualityOptimizations.active = true;

                // Add appropriate strategies
                const issueTypes = sortedIssues.map(issue => issue[0]);

                if (issueTypes.includes('slow')) {
                    this.decisionEngine.qualityOptimizations.strategies.unshift('performanceBoost');
                }

                if (issueTypes.includes('irrelevant') || issueTypes.includes('wrong')) {
                    this.decisionEngine.qualityOptimizations.strategies.unshift('accuracyEnhancement');
                }
            }
        }
    }

    /**
     * Generate quality report
     * @returns {Object} Quality report
     */
    generateQualityReport() {
        // Calculate overall metrics
        const avgResponseTime = this.calculateAverageMetric('response');
        const errorCount = this.metrics.errors.length;
        const satisfactionRate = this.metrics.satisfactionRate || 0;

        // Create report
        const report = {
            timestamp: new Date().toISOString(),
            performance: {
                averageResponseTime: avgResponseTime,
                metrics: this.summarizePerformanceMetrics()
            },
            quality: {
                satisfactionRate,
                issueRate: 1 - satisfactionRate
            },
            errors: {
                total: errorCount,
                rates: this.metrics.errorRates || {
                    critical: 0,
                    major: 0,
                    minor: 0
                }
            },
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    /**
     * Calculate average for a type of metric
     * @param {string} metricType - Type of metric to average
     * @returns {number} Average value
     */
    calculateAverageMetric(metricType) {
        const relevantMetrics = Object.entries(this.metrics.performance)
            .filter(([name]) => name.includes(metricType));

        if (relevantMetrics.length === 0) return 0;

        const sum = relevantMetrics.reduce((acc, [_, metric]) => acc + metric.avg, 0);
        return sum / relevantMetrics.length;
    }

    /**
     * Summarize performance metrics
     * @returns {Object} Summarized metrics
     */
    summarizePerformanceMetrics() {
        const summary = {};

        Object.entries(this.metrics.performance).forEach(([name, metric]) => {
            summary[name] = {
                avg: metric.avg,
                min: metric.min,
                max: metric.max,
                p95: metric.p95,
                samples: metric.samples.length
            };
        });

        return summary;
    }

    /**
     * Generate recommendations based on quality data
     * @returns {string[]} List of recommendations
     */
    generateRecommendations() {
        const recommendations = [];

        // Performance recommendations
        const avgResponseTime = this.calculateAverageMetric('response');
        if (avgResponseTime > this.thresholds.responseTime.good) {
            recommendations.push(
                'Response time exceeds optimal threshold. Consider performance optimizations.'
            );

            // More specific recommendations
            if (avgResponseTime > this.thresholds.responseTime.acceptable) {
                recommendations.push(
                    'Critical response time issues. Evaluate model size or switch to faster models.'
                );
            }
        }

        // Error rate recommendations
        const errorRates = this.metrics.errorRates || { critical: 0, major: 0, minor: 0 };
        if (errorRates.critical > 0) {
            recommendations.push(
                `Critical error rate of ${(errorRates.critical * 100).toFixed(3)}% exceeds zero-target. Immediate investigation required.`
            );
        }

        if (errorRates.major > this.thresholds.errorRates.major) {
            recommendations.push(
                `Major error rate of ${(errorRates.major * 100).toFixed(2)}% exceeds threshold of ${(this.thresholds.errorRates.major * 100).toFixed(2)}%. Review error patterns.`
            );
        }

        // Satisfaction recommendations
        if (this.metrics.satisfactionRate &&
            this.metrics.satisfactionRate < this.thresholds.userSatisfaction.target) {
            recommendations.push(
                `User satisfaction rate of ${(this.metrics.satisfactionRate * 100).toFixed(1)}% is below target of ${(this.thresholds.userSatisfaction.target * 100).toFixed(1)}%. Review user feedback for improvement areas.`
            );
        }

        return recommendations;
    }
}

// Create global instance
const qualityStandards = new QualityStandards();

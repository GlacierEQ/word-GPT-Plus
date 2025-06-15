class QualityManager {
    constructor() {
        this.marks = {};
        this.metrics = {
            performance: { responseTime: [] },
            errors: { api: [], ui: [] },
            usage: {}
        };
    }

    startMeasurement(name) {
        this.marks[name] = performance.now();
    }

    endMeasurement(name, metric) {
        const start = this.marks[name];
        if (start === undefined) return undefined;
        const duration = performance.now() - start;
        if (!this.metrics.performance[metric]) {
            this.metrics.performance[metric] = [];
        }
        this.metrics.performance[metric].push(duration);
        if (duration > 5000) {
            console.warn('Performance issue: duration exceeded threshold');
        }
        return duration;
    }

    logError(category, message, details = {}) {
        if (!this.metrics.errors[category]) {
            this.metrics.errors[category] = [];
        }
        const arr = this.metrics.errors[category];
        arr.push({ message, details, timestamp: Date.now() });
        if (arr.length > 50) {
            arr.shift();
        }
    }

    assessResponseQuality(text) {
        const issues = [];
        if (!text) {
            issues.push('Empty response');
        } else {
            if (text.split(' ').length < 3) {
                issues.push('Too short');
            }
            if (text.length > 200) {
                issues.push('Long sentences');
            }
            if (/i\'m sorry/i.test(text)) {
                issues.push('Banned phrase');
            }
        }
        let quality;
        if (issues.length === 0) {
            quality = 1.0;
        } else if (issues.includes('Empty response')) {
            quality = 0;
        } else {
            quality = 0.5;
        }
        return {
            quality,
            issues: issues.length ? issues : ['No issues detected']
        };
    }

    generateQualityReport() {
        const times = this.metrics.performance.responseTime;
        const avg = times.length ? times.reduce((a,b)=>a+b,0)/times.length : 0;
        return {
            timestamp: Date.now(),
            performance: { avgResponseTime: avg },
            usage: this.metrics.usage,
            errorSummary: {
                apiErrors: this.metrics.errors.api.length,
                uiErrors: this.metrics.errors.ui.length
            },
            qualityScore: 1.0
        };
    }

    async checkImageQuality(image) {
        const MAX_SIZE = 10 * 1024 * 1024;
        if (image.size > MAX_SIZE) {
            throw new Error('Image too large');
        }
        return true;
    }
}

module.exports = QualityManager;

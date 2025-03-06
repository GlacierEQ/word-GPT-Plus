/**
 * Word GPT Plus - Analytics Dashboard Component
 * Provides visual insights into system performance and usage
 */

class AnalyticsDashboard {
    constructor() {
        this.container = null;
        this.charts = {};
        this.metrics = {
            responseTime: [],
            apiCalls: [],
            userSatisfaction: [],
            modelUsage: {},
            featureUsage: {}
        };

        this.colors = {
            primary: '#0078d4',
            secondary: '#2b88d8',
            accent1: '#00bcf2',
            accent2: '#107c10',
            accent3: '#ffb900',
            accent4: '#d13438',
            gray: '#605e5c',
            lightGray: '#edebe9'
        };
    }

    /**
     * Initialize the dashboard
     * @param {HTMLElement} container - Container element for the dashboard
     */
    initialize(container) {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;
        this.container.classList.add('analytics-dashboard');
        this.container.innerHTML = `
            <div class="dashboard-header">
                <h2>Analytics Dashboard</h2>
                <div class="dashboard-controls">
                    <select id="time-range-selector">
                        <option value="day">Last 24 Hours</option>
                        <option value="week" selected>Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                    </select>
                    <button id="refresh-dashboard" class="refresh-btn">
                        <span class="refresh-icon">↻</span> Refresh
                    </button>
                </div>
            </div>
            
            <div class="dashboard-summary">
                <div class="metric-card api-calls">
                    <div class="metric-value" id="metric-api-calls">-</div>
                    <div class="metric-label">API Calls</div>
                </div>
                <div class="metric-card avg-time">
                    <div class="metric-value" id="metric-response-time">-</div>
                    <div class="metric-label">Avg Response Time</div>
                </div>
                <div class="metric-card satisfaction">
                    <div class="metric-value" id="metric-satisfaction">-</div>
                    <div class="metric-label">User Satisfaction</div>
                </div>
                <div class="metric-card errors">
                    <div class="metric-value" id="metric-errors">-</div>
                    <div class="metric-label">Errors</div>
                </div>
            </div>
            
            <div class="dashboard-charts">
                <div class="chart-container">
                    <h3>Response Time</h3>
                    <div id="response-time-chart" class="chart"></div>
                </div>
                <div class="chart-container">
                    <h3>API Usage</h3>
                    <div id="api-usage-chart" class="chart"></div>
                </div>
            </div>
            
            <div class="dashboard-charts">
                <div class="chart-container">
                    <h3>Model Usage</h3>
                    <div id="model-usage-chart" class="chart"></div>
                </div>
                <div class="chart-container">
                    <h3>Feature Usage</h3>
                    <div id="feature-usage-chart" class="chart"></div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.applyStyles();
        this.loadData();
    }

    /**
     * Set up dashboard event listeners
     */
    setupEventListeners() {
        const refreshButton = document.getElementById('refresh-dashboard');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => this.refreshData());
        }

        const rangeSelector = document.getElementById('time-range-selector');
        if (rangeSelector) {
            rangeSelector.addEventListener('change', () => this.loadData());
        }
    }

    /**
     * Apply dashboard styles
     */
    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .analytics-dashboard {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #333;
                padding: 20px;
                background-color: #f9f9f9;
                border-radius: 8px;
            }
            
            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .dashboard-header h2 {
                margin: 0;
                font-weight: 600;
                color: #111;
            }
            
            .dashboard-controls {
                display: flex;
                gap: 10px;
            }
            
            .dashboard-summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 30px;
            }
            
            .metric-card {
                background-color: white;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                text-align: center;
            }
            
            .metric-value {
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 5px;
                color: ${this.colors.primary};
            }
            
            .api-calls .metric-value {
                color: ${this.colors.accent1};
            }
            
            .avg-time .metric-value {
                color: ${this.colors.accent2};
            }
            
            .satisfaction .metric-value {
                color: ${this.colors.accent3};
            }
            
            .errors .metric-value {
                color: ${this.colors.accent4};
            }
            
            .metric-label {
                font-size: 14px;
                color: ${this.colors.gray};
            }
            
            .dashboard-charts {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .chart-container {
                background-color: white;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            }
            
            .chart-container h3 {
                margin-top: 0;
                margin-bottom: 15px;
                font-size: 16px;
                font-weight: 600;
                color: #111;
            }
            
            .chart {
                height: 250px;
                width: 100%;
            }
            
            #time-range-selector {
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid ${this.colors.lightGray};
                background-color: white;
                font-family: inherit;
            }
            
            .refresh-btn {
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 8px 12px;
                background-color: ${this.colors.primary};
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-family: inherit;
                font-size: 14px;
            }
            
            .refresh-btn:hover {
                background-color: ${this.colors.secondary};
            }
            
            .refresh-icon {
                font-weight: bold;
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Load dashboard data based on selected time range
     */
    loadData() {
        // Show loading state
        this.showLoadingState();

        // Get selected time range
        const rangeSelector = document.getElementById('time-range-selector');
        const range = rangeSelector ? rangeSelector.value : 'week';

        // In a real implementation, this would load data from an API or service
        // Here we'll simulate by generating data and rendering with a delay
        setTimeout(() => {
            this.generateMockData(range);
            this.renderDashboard();
        }, 800);
    }

    /**
     * Show loading state for dashboard elements
     */
    showLoadingState() {
        const metricIds = ['metric-api-calls', 'metric-response-time', 'metric-satisfaction', 'metric-errors'];
        metricIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '...';
            }
        });

        // Clear charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.clear === 'function') {
                chart.clear();
            }
        });
    }

    /**
     * Generate mock data for visualization
     * @param {string} range - Time range to generate data for
     */
    generateMockData(range) {
        let days;
        switch (range) {
            case 'day':
                days = 1;
                break;
            case 'month':
                days = 30;
                break;
            case 'week':
            default:
                days = 7;
        }

        // Generate timeline
        const dates = [];
        const now = new Date();
        for (let i = 0; i < days; i++) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            dates.unshift(date.toISOString().split('T')[0]);
        }

        // Response time data (milliseconds)
        this.metrics.responseTime = dates.map(date => ({
            date,
            avg: 800 + Math.random() * 1200,
            min: 400 + Math.random() * 300,
            max: 1500 + Math.random() * 2000
        }));

        // API calls data
        this.metrics.apiCalls = dates.map(date => ({
            date,
            count: Math.floor(50 + Math.random() * 150)
        }));

        // User satisfaction (percentage)
        this.metrics.userSatisfaction = dates.map(date => ({
            date,
            value: 75 + Math.random() * 20
        }));

        // Model usage
        this.metrics.modelUsage = {
            'gpt-4': 42,
            'gpt-3.5-turbo': 28,
            'llama2-7b-q4': 18,
            'mistral-7b-q4': 8,
            'phi2-q4': 4
        };

        // Feature usage
        this.metrics.featureUsage = {
            'content-generation': 35,
            'recursive-perfection': 25,
            'multiverse-writing': 20,
            'document-management': 12,
            'image-processing': 8
        };

        // Calculate summary metrics
        this.metrics.summary = {
            apiCalls: this.metrics.apiCalls.reduce((sum, entry) => sum + entry.count, 0),
            avgResponseTime: Math.round(this.metrics.responseTime.reduce((sum, entry) => sum + entry.avg, 0) / this.metrics.responseTime.length),
            satisfaction: Math.round(this.metrics.userSatisfaction.reduce((sum, entry) => sum + entry.value, 0) / this.metrics.userSatisfaction.length),
            errors: Math.floor(Math.random() * 5)
        };
    }

    /**
     * Render dashboard with loaded data
     */
    renderDashboard() {
        // Update summary metrics
        document.getElementById('metric-api-calls').textContent = this.formatNumber(this.metrics.summary.apiCalls);
        document.getElementById('metric-response-time').textContent = `${this.metrics.summary.avgResponseTime}ms`;
        document.getElementById('metric-satisfaction').textContent = `${this.metrics.summary.satisfaction}%`;
        document.getElementById('metric-errors').textContent = this.metrics.summary.errors;

        // Render charts
        this.renderResponseTimeChart();
        this.renderApiUsageChart();
        this.renderModelUsageChart();
        this.renderFeatureUsageChart();
    }

    /**
     * Render response time chart
     */
    renderResponseTimeChart() {
        const chartElement = document.getElementById('response-time-chart');
        if (!chartElement) return;

        // In a real implementation, this would use a charting library like Chart.js
        // Here, we'll create a simplified visual representation

        let htmlContent = '<div class="chart-wrapper">';

        // Create a bar for each data point
        this.metrics.responseTime.forEach(entry => {
            const height = Math.max(5, (entry.avg / 3000) * 100);
            const color = entry.avg < 1000 ? this.colors.accent2 :
                (entry.avg < 2000 ? this.colors.accent3 : this.colors.accent4);

            htmlContent += `
                <div class="chart-bar-container" title="Date: ${entry.date}\nAvg: ${Math.round(entry.avg)}ms\nMin: ${Math.round(entry.min)}ms\nMax: ${Math.round(entry.max)}ms">
                    <div class="chart-bar" style="height: ${height}%; background-color: ${color}"></div>
                    <div class="chart-label">${entry.date.split('-')[2]}</div>
                </div>
            `;
        });

        htmlContent += '</div>';
        htmlContent += `
            <div class="chart-legend">
                <div class="legend-item">
                    <span class="legend-color" style="background-color: ${this.colors.accent2}"></span>
                    <span>Good (&lt;1000ms)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: ${this.colors.accent3}"></span>
                    <span>Average (1000-2000ms)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: ${this.colors.accent4}"></span>
                    <span>Slow (&gt;2000ms)</span>
                </div>
            </div>
        `;

        chartElement.innerHTML = htmlContent;

        // Add some CSS for the chart
        if (!document.getElementById('chart-styles')) {
            const chartStyles = document.createElement('style');
            chartStyles.id = 'chart-styles';
            chartStyles.textContent = `
                .chart-wrapper {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    height: 200px;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 10px;
                }
                
                .chart-bar-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                }
                
                .chart-bar {
                    width: 80%;
                    transition: height 0.5s;
                }
                
                .chart-label {
                    margin-top: 5px;
                    font-size: 12px;
                    color: #666;
                }
                
                .chart-legend {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    font-size: 12px;
                }
                
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                
                .legend-color {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border-radius: 2px;
                }
            `;
            document.head.appendChild(chartStyles);
        }
    }

    /**
     * Render API usage chart
     */
    renderApiUsageChart() {
        const chartElement = document.getElementById('api-usage-chart');
        if (!chartElement) return;

        // Simple API usage line chart
        let htmlContent = '<div class="chart-wrapper">';

        // Find max value for scaling
        const maxValue = Math.max(...this.metrics.apiCalls.map(entry => entry.count));

        // Create points for the line
        let points = '';
        const width = 100 / (this.metrics.apiCalls.length - 1);

        this.metrics.apiCalls.forEach((entry, index) => {
            const x = index * width;
            const y = 100 - ((entry.count / maxValue) * 90 + 5); // Leave 5% margins
            points += `${x},${y} `;

            htmlContent += `
                <div class="chart-point" style="left: ${x}%; bottom: ${y}%;" 
                     title="Date: ${entry.date}\nAPI Calls: ${entry.count}">
                </div>
            `;
        });

        htmlContent += `
            <svg class="chart-line" preserveAspectRatio="none" viewBox="0 0 100 100">
                <polyline points="${points}" fill="none" stroke="${this.colors.accent1}" stroke-width="2" />
            </svg>
        `;

        htmlContent += '</div>';

        // Add date labels
        htmlContent += '<div class="chart-x-labels">';
        this.metrics.apiCalls.forEach((entry, index) => {
            const width = 100 / this.metrics.apiCalls.length;
            const left = index * width;
            htmlContent += `
                <div class="chart-x-label" style="left: ${left}%">
                    ${entry.date.split('-')[2]}
                </div>
            `;
        });
        htmlContent += '</div>';

        chartElement.innerHTML = htmlContent;

        // Add styles for line chart
        if (!document.getElementById('line-chart-styles')) {
            const lineStyles = document.createElement('style');
            lineStyles.id = 'line-chart-styles';
            lineStyles.textContent = `
                .chart-line {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }
                
                .chart-point {
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background-color: ${this.colors.accent1};
                    border-radius: 50%;
                    transform: translate(-50%, 50%);
                    z-index: 2;
                }
                
                .chart-x-labels {
                    display: flex;
                    position: relative;
                    height: 20px;
                }
                
                .chart-x-label {
                    position: absolute;
                    transform: translateX(-50%);
                    font-size: 12px;
                    color: #666;
                }
            `;
            document.head.appendChild(lineStyles);
        }
    }

    /**
     * Render model usage pie chart
     */
    renderModelUsageChart() {
        const chartElement = document.getElementById('model-usage-chart');
        if (!chartElement) return;

        // Create a simple donut chart
        let htmlContent = '<div class="pie-container">';

        // Calculate total
        const total = Object.values(this.metrics.modelUsage).reduce((sum, count) => sum + count, 0);

        // Generate pie segments and legend
        let cumulativePercent = 0;
        let legendHtml = '<div class="pie-legend">';

        // Colors for pie segments
        const segmentColors = [
            this.colors.primary,
            this.colors.secondary,
            this.colors.accent1,
            this.colors.accent2,
            this.colors.accent3,
            this.colors.accent4
        ];

        Object.entries(this.metrics.modelUsage).forEach(([model, count], index) => {
            const percentage = (count / total * 100).toFixed(1);
            const color = segmentColors[index % segmentColors.length];

            // Add pie segment
            const startPercent = cumulativePercent;
            cumulativePercent += parseFloat(percentage);
            const endPercent = cumulativePercent;

            const startAngle = startPercent * 3.6; // 360 / 100 = 3.6
            const endAngle = endPercent * 3.6;

            htmlContent += this.createPieSegment(startAngle, endAngle, color, `${model}: ${percentage}%`);

            // Add legend item
            legendHtml += `
                <div class="legend-item">
                    <span class="legend-color" style="background-color: ${color}"></span>
                    <span>${model}</span>
                    <span class="legend-percent">${percentage}%</span>
                </div>
            `;
        });

        legendHtml += '</div>';
        htmlContent += '<div class="pie-hole"></div></div>' + legendHtml;

        chartElement.innerHTML = htmlContent;

        // Add styles for pie chart
        if (!document.getElementById('pie-chart-styles')) {
            const pieStyles = document.createElement('style');
            pieStyles.id = 'pie-chart-styles';
            pieStyles.textContent = `
                .pie-container {
                    position: relative;
                    width: 160px;
                    height: 160px;
                    margin: 0 auto;
                    border-radius: 50%;
                    background-color: #f5f5f5;
                    overflow: hidden;
                }
                
                .pie-segment {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    transform-origin: 50% 50%;
                    transition: all 0.3s;
                }
                
                .pie-segment:hover {
                    opacity: 0.8;
                    transform: scale(1.03);
                }
                
                .pie-hole {
                    position: absolute;
                    width: 60%;
                    height: 60%;
                    background-color: white;
                    border-radius: 50%;
                    top: 20%;
                    left: 20%;
                    box-shadow: 0 0 5px rgba(0,0,0,0.1) inset;
                }
                
                .pie-legend {
                    margin-top: 30px;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 10px;
                }
                
                .legend-percent {
                    margin-left: auto;
                    font-weight: 600;
                }
            `;
            document.head.appendChild(pieStyles);
        }
    }

    /**
     * Create a pie chart segment
     * @param {number} startAngle - Starting angle in degrees
     * @param {number} endAngle - Ending angle in degrees
     * @param {string} color - Segment color
     * @param {string} tooltip - Tooltip content
     * @returns {string} HTML for the pie segment
     */
    createPieSegment(startAngle, endAngle, color, tooltip) {
        const segment = document.createElement('div');
        segment.className = 'pie-segment';
        segment.title = tooltip;
        segment.style.backgroundColor = color;

        // Create the segment shape using skew and rotate
        // For simplicity, we'll handle segments up to 180 degrees in a special way
        const angle = endAngle - startAngle;

        if (angle <= 180) {
            // Single segment
            segment.style.transform = `rotate(${startAngle}deg) skew(${90 - angle / 2}deg)`;
            segment.style.width = '100%';
            segment.style.height = '100%';
        } else {
            // For segments > 180 degrees, we create two segments
            const html = `
                <div class="pie-segment" title="${tooltip}" 
                     style="background-color: ${color}; transform: rotate(${startAngle}deg) skew(0deg);">
                </div>
                <div class="pie-segment" title="${tooltip}" 
                     style="background-color: ${color}; transform: rotate(${startAngle + 180}deg) skew(${90 - (angle - 180) / 2}deg);">
                </div>
            `;
            return html;
        }

        return segment.outerHTML;
    }

    /**
     * Render feature usage chart
     */
    renderFeatureUsageChart() {
        const chartElement = document.getElementById('feature-usage-chart');
        if (!chartElement) return;

        // Create a horizontal bar chart
        let htmlContent = '<div class="bar-chart">';

        // Calculate total
        const total = Object.values(this.metrics.featureUsage).reduce((sum, count) => sum + count, 0);

        // Generate bars
        Object.entries(this.metrics.featureUsage)
            .sort((a, b) => b[1] - a[1]) // Sort by count descending
            .forEach(([feature, count], index) => {
                const percentage = (count / total * 100).toFixed(1);
                const barWidth = `${percentage}%`;
                const color = index % 2 === 0 ? this.colors.primary : this.colors.secondary;

                htmlContent += `
                    <div class="bar-item">
                        <div class="bar-label">${this.formatFeatureName(feature)}</div>
                        <div class="bar-container">
                            <div class="bar" style="width: ${barWidth}; background-color: ${color};" 
                                 title="${feature}: ${percentage}% (${count} uses)">
                            </div>
                            <div class="bar-value">${percentage}%</div>
                        </div>
                    </div>
                `;
            });

        htmlContent += '</div>';
        chartElement.innerHTML = htmlContent;

        // Add styles for bar chart
        if (!document.getElementById('bar-chart-styles')) {
            const barStyles = document.createElement('style');
            barStyles.id = 'bar-chart-styles';
            barStyles.textContent = `
                .bar-chart {
                    width: 100%;
                }
                
                .bar-item {
                    margin-bottom: 12px;
                }
                
                .bar-label {
                    font-size: 13px;
                    margin-bottom: 4px;
                }
                
                .bar-container {
                    position: relative;
                    height: 24px;
                    background-color: #f0f0f0;
                    border-radius: 4px;
                    overflow: hidden;
                }
                
                .bar {
                    height: 100%;
                    transition: width 0.5s;
                }
                
                .bar-value {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 12px;
                    font-weight: 600;
                    color: #333;
                }
            `;
            document.head.appendChild(barStyles);
        }
    }

    /**
     * Format a feature name for display
     * @param {string} feature - Feature identifier
     * @returns {string} Formatted feature name
     */
    formatFeatureName(feature) {
        return feature
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Format a number for display (add commas, etc.)
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    /**
     * Refresh dashboard data
     */
    refreshData() {
        this.loadData();
    }

    /**
     * Update with real metrics data
     * @param {Object} metrics - Real metrics data
     */
    updateWithRealData(metrics) {
        this.metrics = { ...this.metrics, ...metrics };
        this.renderDashboard();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsDashboard;
}

// Create global instance
const analyticsDashboard = new AnalyticsDashboard();

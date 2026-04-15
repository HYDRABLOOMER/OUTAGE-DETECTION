const Metric = require('../models/Metric');
const Alert = require('../models/Alert');
const Log = require('../models/Log');

/**
 * Anomaly Detection Service
 * Implements statistical logic for detecting outliers in latency and error rates.
 */
class DetectionService {
    constructor() {
        this.windowSize = parseInt(process.env.DETECTION_WINDOW) || 30;
        this.zThreshold = parseFloat(process.env.Z_SCORE_THRESHOLD) || 2.5;
        this.errorThreshold = parseFloat(process.env.ERROR_THRESHOLD) || 10;
    }

    /**
     * Analyze a new metric against historical data
     * @param {Object} currentMetric 
     */
    async analyze(currentMetric) {
        const { serviceName, latency, errorRate, cpuUsage, memoryUsage } = currentMetric;
        let alert = null;

        // 1. Handle Service Metrics (Latency/ErrorRate)
        if (latency !== undefined && errorRate !== undefined) {
            // Fetch recent history for this service
            const history = await Metric.find({ serviceName, latency: { $exists: true } })
                .sort({ timestamp: -1 })
                .limit(this.windowSize);

            if (history.length >= 5) {
                const latencies = history.map(m => m.latency);
                const stats = this.calculateStats(latencies);
                const zScore = stats.stdDev === 0 ? 0 : Math.abs((latency - stats.mean) / stats.stdDev);

                if (zScore > this.zThreshold) {
                    alert = await this.createAlert(serviceName, 'high', 
                        `Latency Anomaly: Z-Score ${zScore.toFixed(2)}. Current: ${latency}ms, Avg: ${stats.mean.toFixed(2)}ms`,
                        latency
                    );
                }
            }

            if (errorRate > this.errorThreshold) {
                const severity = errorRate > 50 ? 'high' : 'medium';
                alert = await this.createAlert(serviceName, severity, 
                    `High Error Rate: ${errorRate}%. Threshold: ${this.errorThreshold}%`,
                    errorRate
                );
            }
        }

        // 2. Handle System Metrics (CPU/Memory)
        if (cpuUsage !== undefined) {
            if (cpuUsage > 90) {
                alert = await this.createAlert(serviceName, 'high', `Critical CPU Usage: ${cpuUsage.toFixed(1)}%`, cpuUsage);
            } else if (cpuUsage > 75) {
                alert = await this.createAlert(serviceName, 'medium', `High CPU Warning: ${cpuUsage.toFixed(1)}%`, cpuUsage);
            }
        }

        if (memoryUsage !== undefined) {
            if (memoryUsage > 90) {
                alert = await this.createAlert(serviceName, 'high', `Critical Memory Usage: ${memoryUsage.toFixed(1)}%`, memoryUsage);
            }
        }

        return alert;
    }

    /**
     * Calculate Mean and Standard Deviation
     */
    calculateStats(values) {
        const n = values.length;
        const mean = values.reduce((a, b) => a + b, 0) / n;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        return { mean, stdDev };
    }

    /**
     * Create an alert in the database
     */
    async createAlert(serviceName, severity, message, value) {
        const alert = new Alert({
            serviceName,
            severity,
            message,
            metricValue: value
        });
        await alert.save();

        // Also log it
        await new Log({
            serviceName,
            type: 'alert',
            message: `ALERT [${severity.toUpperCase()}]: ${message}`
        }).save();

        return alert;
    }
}

module.exports = new DetectionService();

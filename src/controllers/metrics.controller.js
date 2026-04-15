const Metric = require('../models/Metric');
const Log = require('../models/Log');
const detectionService = require('../services/detectionService');
const mitigationService = require('../services/mitigationService');
const socketService = require('../services/socketService');

/**
 * Metrics Controller
 * Handles data ingestion and historical retrieval.
 */
class MetricsController {
    /**
     * Post a new metric from a service
     * @param {Object} req 
     * @param {Object} res 
     */
    async postMetric(req, res) {
        try {
            const { serviceName, latency, errorRate, requestCount, cpuUsage, memoryUsage, diskUsage, networkSpeed } = req.body;

            if (!serviceName) {
                return res.status(400).json({ error: 'serviceName is required' });
            }

            // Simple validation: either latency/errorRate OR system stats must be present
            const hasServiceMetrics = latency !== undefined && errorRate !== undefined;
            const hasSystemMetrics = cpuUsage !== undefined || memoryUsage !== undefined;

            if (!hasServiceMetrics && !hasSystemMetrics) {
                return res.status(400).json({ error: 'Metrics data missing (required: latency/errorRate OR cpu/memory stats)' });
            }

            const metricData = { 
                serviceName, 
                latency, 
                errorRate, 
                requestCount,
                cpuUsage,
                memoryUsage,
                diskUsage,
                networkSpeed
            };

            const metric = new Metric(metricData);
            await metric.save();

            // Broadcast to dashboard
            socketService.broadcastMetric(metric);

            // Trigger Anomaly Detection
            const alert = await detectionService.analyze(metric);

            if (alert) {
                // Broadcast the new alert
                socketService.broadcastAlert(alert);

                // Check for Auto-Mitigation (e.g., severe latency or high error rate)
                if (alert.severity === 'high') {
                    await mitigationService.mitigate(serviceName, alert.message);
                }
            }

            // Periodically log info
            if (Math.random() < 0.1) {
                await new Log({
                    serviceName,
                    type: 'info',
                    message: `Service status check: Normal operation.`
                }).save();
            }

            res.status(201).json({ message: 'Metric recorded', alertGenerated: !!alert });
        } catch (error) {
            console.error('Post Metric Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    /**
     * Get historical metrics for a service
     */
    async getHistory(req, res) {
        try {
            const { serviceName } = req.query;
            const filter = serviceName ? { serviceName } : {};
            const history = await Metric.find(filter)
                .sort({ timestamp: -1 })
                .limit(100);
            res.status(200).json(history);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    /**
     * Get service health status
     */
    async getStatus(req, res) {
        try {
            // Group by service and find last metric
            const status = await Metric.aggregate([
                { $sort: { timestamp: -1 } },
                {
                    $group: {
                        _id: "$serviceName",
                        lastLatency: { $first: "$latency" },
                        lastErrorRate: { $first: "$errorRate" },
                        lastSeen: { $first: "$timestamp" }
                    }
                }
            ]);
            res.status(200).json(status);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new MetricsController();

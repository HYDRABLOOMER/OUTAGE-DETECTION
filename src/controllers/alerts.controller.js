const Alert = require('../models/Alert');

/**
 * Alerts Controller
 */
class AlertsController {
    /**
     * Get historical alerts
     */
    async getAlerts(req, res) {
        try {
            const { serviceName, severity } = req.query;
            const filter = {};
            if (serviceName) filter.serviceName = serviceName;
            if (severity) filter.severity = severity;

            const alerts = await Alert.find(filter)
                .sort({ timestamp: -1 })
                .limit(50);
            res.status(200).json(alerts);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new AlertsController();

const Log = require('../models/Log');

/**
 * Logs Controller
 */
class LogsController {
    /**
     * Get system logs
     */
    async getLogs(req, res) {
        try {
            const { serviceName, type } = req.query;
            const filter = {};
            if (serviceName) filter.serviceName = serviceName;
            if (type) filter.type = type;

            const logs = await Log.find(filter)
                .sort({ timestamp: -1 })
                .limit(100);
            res.status(200).json(logs);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new LogsController();

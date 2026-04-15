const mongoose = require('mongoose');

const metricSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: true,
        index: true
    },
    // Service Metrics
    latency: {
        type: Number
    },
    errorRate: {
        type: Number
    },
    requestCount: {
        type: Number,
        default: 0
    },
    // System Metrics
    cpuUsage: {
        type: Number // Percentage
    },
    memoryUsage: {
        type: Number // Percentage
    },
    diskUsage: {
        type: Number // Percentage
    },
    networkSpeed: {
        type: Number // Mbps or similar
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('Metric', metricSchema);

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: true,
        index: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    metricValue: {
        type: Number
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'resolved'],
        default: 'active'
    }
});

module.exports = mongoose.model('Alert', alertSchema);

const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['info', 'anomaly', 'alert', 'mitigation'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('Log', logSchema);

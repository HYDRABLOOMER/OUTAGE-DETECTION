const express = require('express');
const proxy = require('express-http-proxy');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.GATEWAY_PORT || 8000;

// Security and Logging
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Service Routes (Proxies)
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';
const METRICS_SERVICE_URL = process.env.METRICS_SERVICE_URL || 'http://localhost:8002';
const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || 'http://localhost:8003';

app.use('/api/auth', proxy(AUTH_SERVICE_URL));
app.use('/api/metrics', proxy(METRICS_SERVICE_URL));
app.use('/api/alerts', proxy(ALERT_SERVICE_URL));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'API Gateway is healthy', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log(`🔗 Routing /api/auth    -> ${AUTH_SERVICE_URL}`);
    console.log(`🔗 Routing /api/metrics -> ${METRICS_SERVICE_URL}`);
    console.log(`🔗 Routing /api/alerts  -> ${ALERT_SERVICE_URL}`);
});

const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metrics.controller');

// Ingest metric
router.post('/', (req, res) => metricsController.postMetric(req, res));

// Get historical metrics
router.get('/history', (req, res) => metricsController.getHistory(req, res));

// Get current system status
router.get('/status', (req, res) => metricsController.getStatus(req, res));

module.exports = router;

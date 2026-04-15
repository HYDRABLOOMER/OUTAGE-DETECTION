const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alerts.controller');
const logsController = require('../controllers/logs.controller');

// Alerts route
router.get('/alerts', (req, res) => alertsController.getAlerts(req, res));

// Logs route
router.get('/logs', (req, res) => logsController.getLogs(req, res));

module.exports = router;

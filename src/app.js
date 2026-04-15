const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const metricsRoutes = require('./routes/metrics.routes');
const systemRoutes = require('./routes/system.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static files for dashboard
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/metrics', metricsRoutes);
app.use('/api/system', systemRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;

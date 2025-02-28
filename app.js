const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./middlewares/errorHandler');
const uploadRoutes = require('./routes/uploadRoutes');
const statusRoutes = require('./routes/statusRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (processed images)
app.use('/images', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', uploadRoutes);
app.use('/api', statusRoutes);
app.use('/api', webhookRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;
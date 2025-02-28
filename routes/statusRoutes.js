const express = require('express');
const { getStatus, downloadOutputCSV } = require('../controllers/statusController');

const router = express.Router();

// Get processing status route
router.get('/status/:requestId', getStatus);

// Download output CSV route
router.get('/download/:requestId', downloadOutputCSV);

module.exports = router;
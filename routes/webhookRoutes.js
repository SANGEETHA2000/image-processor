const express = require('express');
const { registerWebhook } = require('../controllers/webhookController');

const router = express.Router();

// Register webhook route
router.post('/webhook', registerWebhook);

module.exports = router;
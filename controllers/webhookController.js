const { StatusCodes } = require('http-status-codes');
const { buildResponse } = require('../utils/responseBuilder');
const Request = require('../models/request');

exports.registerWebhook = async (req, res) => {
    try {
        const { requestId, webhookUrl } = req.body;
        
        // Validate input
        if (!requestId || !webhookUrl) {
            return res.status(StatusCodes.BAD_REQUEST).json(
                buildResponse(false, 'requestId and webhookUrl are required')
            );
        }
        
        // Validate webhook URL format
        try {
            new URL(webhookUrl);
        } catch (error) {
            return res.status(StatusCodes.BAD_REQUEST).json(
                buildResponse(false, 'Invalid webhook URL format')
            );
        }
        
        // Find request by ID
        const request = await Request.findOne({ requestId });
        
        if (!request) {
            return res.status(StatusCodes.NOT_FOUND).json(
                buildResponse(false, `Request with ID ${requestId} not found`)
            );
        }
        
        // Update webhook URL
        request.webhookUrl = webhookUrl;
        await request.save();
        
        // Check if processing is already complete, if so send webhook now
        if (request.isProcessingComplete()) {
            // Send webhook in the background
            request.updateProgress();
        }
        
        return res.status(StatusCodes.OK).json(
            buildResponse(true, 'Webhook registered successfully', { requestId, webhookUrl })
        );
    } catch (error) {
        console.error('Webhook registration error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
            buildResponse(false, `Error registering webhook: ${error.message}`)
        );
    }
};
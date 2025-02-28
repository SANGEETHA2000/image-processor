const { StatusCodes } = require('http-status-codes');
const { generateRequestId } = require('../utils/idGenerator');
const { buildResponse } = require('../utils/responseBuilder');
const { parseCSV } = require('../services/csvParser');
const Request = require('../models/request');

exports.uploadCSV = async (req, res) => {
    try {
        // Generate a unique request ID
        const requestId = generateRequestId();
        
        // Create a new request record
        const newRequest = new Request({
            requestId,
            status: 'pending',
            originalFilename: req.file.originalname
        });
        
        await newRequest.save();
        
        // Start CSV processing in the background
        parseCSV(req.file.path, requestId)
            .catch(err => console.error(`Background CSV processing error: ${err.message}`));
            
        // Return request ID immediately
        return res.status(StatusCodes.ACCEPTED).json(
            buildResponse(true, 'CSV uploaded successfully. Processing started.', { requestId })
        );
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
            buildResponse(false, `Error uploading CSV: ${error.message}`)
        );
    }
};
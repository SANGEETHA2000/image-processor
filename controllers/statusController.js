const { StatusCodes } = require('http-status-codes');
const { buildResponse } = require('../utils/responseBuilder');
const { generateOutputCSV } = require('../services/storageService');
const Request = require('../models/request');

exports.getStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        
        // Find request by ID
        const request = await Request.findOne({ requestId });
        
        if (!request) {
            return res.status(StatusCodes.NOT_FOUND).json(
                buildResponse(false, `Request with ID ${requestId} not found`)
            );
        }
        
        // Construct response data
        const responseData = {
            requestId: request.requestId,
            status: request.status,
            progress: {
                total: request.progress.total,
                completed: request.progress.completed,
                failed: request.progress.failed,
                percentage: request.progress.total > 0 
                ? Math.round(((request.progress.completed + request.progress.failed) / request.progress.total) * 100) 
                : 0
            },
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
        };
        
        // If processing is complete, add links to download output CSV
        if (request.status === 'completed' || (request.status === 'processing' && request.progress.completed > 0)) {
            responseData.outputCSV = `/api/download/${requestId}`;
        }
        
        return res.status(StatusCodes.OK).json(
            buildResponse(true, 'Request status retrieved successfully', responseData)
        );
    } catch (error) {
        console.error('Status check error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
            buildResponse(false, `Error checking status: ${error.message}`)
        );
    }
};

exports.downloadOutputCSV = async (req, res) => {
    try {
        const { requestId } = req.params;
        
        // Find request by ID
        const request = await Request.findOne({ requestId });
        
        if (!request) {
            return res.status(StatusCodes.NOT_FOUND).json(
                buildResponse(false, `Request with ID ${requestId} not found`)
            );
        }
        
        // Check if there are any completed images
        if (request.progress.completed === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json(
                buildResponse(false, 'No processed images available yet')
            );
        }
        
        // Generate output CSV
        const { filePath, filename } = await generateOutputCSV(requestId);
        
        // Send file as attachment
        return res.download(filePath, filename, err => {
            if (err) {
                console.error('Download error:', err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
                buildResponse(false, `Error downloading CSV: ${err.message}`)
                );
            }
        });
    } catch (error) {
        console.error('Download error:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
            buildResponse(false, `Error generating output CSV: ${error.message}`)
        );
    }
};
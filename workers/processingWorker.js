const path = require('path');
require('dotenv').config({ 
    path: path.resolve(__dirname, '../.env') 
});

const { imageProcessingQueue } = require('../config/bull');
const { processImage } = require('../services/imageProcessor');

// Process jobs from the queue
imageProcessingQueue.process(async (job) => {
    try {
        console.log(`Processing job ${job.id}: ${job.data.inputUrl}`);
        return await processImage(job.data);
    } catch (error) {
        console.error(`Job ${job.id} failed: ${error.message}`);
        throw error;
    }
});

// Log job completion
imageProcessingQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed. Output URL: ${result.outputUrl}`);
});

// Log job failure
imageProcessingQueue.on('failed', (job, error) => {
    console.error(`Job ${job.id} failed with error: ${error.message}`);
});

// Log worker ready
imageProcessingQueue.on('ready', () => {
    console.log('Image processing worker is ready');
});

// Handle errors
imageProcessingQueue.on('error', (error) => {
    console.error(`Queue error: ${error.message}`);
});

// Start the worker
console.log('Image processing worker started');

if (require.main === module) {
    require('dotenv').config({ 
        path: path.resolve(__dirname, '../.env') 
    });
    console.log("URI",process.env.MONGODB_URI)
    require('mongoose').connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        waitQueueTimeoutMS: 30000,
        keepAlive: true,
        keepAliveInitialDelay: 30000
      }).then(() => {
            console.log('Worker connected to MongoDB with extended timeouts');
      }).catch(err => console.error('Worker failed to connect to MongoDB', err));
}
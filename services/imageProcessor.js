const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const sharp = require('sharp');
const { promisify } = require('util');
const { createWriteStream, mkdir } = require('fs');
const mkdirAsync = promisify(mkdir);
const Product = require('../models/product');
const Request = require('../models/request');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Process an image by downloading it, compressing it, and saving it
 */
exports.processImage = async (jobData) => {
    const { requestId, productId, serialNumber, productName, imageIndex, inputUrl } = jobData;
    
    // Create product-specific directory
    const productDir = path.join(uploadDir, `${requestId}/${productName}`);
    await mkdirAsync(productDir, { recursive: true });
    
    // Generate unique filename
    const filename = `${Date.now()}-${path.basename(new URL(inputUrl).pathname)}`;
    const outputPath = path.join(productDir, filename);
    
    try {
        // Find the product and mark image as processing
        const product = await Product.findOne({ 
            requestId,
            serialNumber
        });
        
        if (!product || !product.images[imageIndex]) {
            throw new Error('Product or image not found');
        }
        
        // Update status to processing
        product.images[imageIndex].status = 'processing';
        product.images[imageIndex].processingStartedAt = new Date();
        await product.save();
        
        // Download and process the image
        await downloadAndProcessImage(inputUrl, outputPath);
        
        // Generate public URL for the output image
        const outputUrl = `${process.env.OUTPUT_IMAGE_BASE_URL}${requestId}/${productName}/${filename}`;
        
        // Update product with processed image details
        product.images[imageIndex].outputUrl = outputUrl;
        product.images[imageIndex].status = 'completed';
        product.images[imageIndex].processingCompletedAt = new Date();
        await product.save();
        
        // Update request progress
        const request = await Request.findOne({ requestId });
        await request.updateProgress();
        
        // Check if all processing is complete and trigger webhook if needed
        if (request.isProcessingComplete() && request.webhookUrl) {
            await sendWebhookNotification(request);
        }
        
        return { success: true, outputUrl };
    } catch (error) {
        console.error(`Error processing image: ${error.message}`);
        
        // Update product with error details
        const product = await Product.findOne({ requestId, serialNumber });
        if (product && product.images[imageIndex]) {
            product.images[imageIndex].status = 'failed';
            product.images[imageIndex].errorMessage = error.message;
            product.images[imageIndex].processingCompletedAt = new Date();
            await product.save();
            
            // Update request progress
            const request = await Request.findOne({ requestId });
            await request.updateProgress();
            
            // Check if all processing is complete and trigger webhook if needed
            if (request.isProcessingComplete() && request.webhookUrl) {
                await sendWebhookNotification(request);
            }
        }
        
        throw error;
    }
};

/**
 * Download an image, compress it by 50%, and save it to the output path
 */
function downloadAndProcessImage(url, outputPath) {
    return new Promise((resolve, reject) => {
        // Determine protocol (http or https)
        const protocol = url.startsWith('https') ? https : http;
        
        protocol.get(url, (response) => {
            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to download image, status code: ${response.statusCode}`));
            }
            
            // Check if content is an image
            const contentType = response.headers['content-type'];
            if (!contentType || !contentType.startsWith('image/')) {
                return reject(new Error(`URL does not point to an image, content type: ${contentType}`));
            }
            
            // Process the image with sharp
            const transform = sharp()
                .jpeg({ quality: 50 }) // Compress by 50%
                .on('error', err => reject(new Error(`Image processing error: ${err.message}`)));
            
            const outputStream = createWriteStream(outputPath);
            outputStream.on('error', err => reject(new Error(`Failed to write output file: ${err.message}`)));
            outputStream.on('finish', resolve);
            
            // Pipe the download through sharp into the output file
            response.pipe(transform).pipe(outputStream);
        }).on('error', err => {
            reject(new Error(`Failed to download image: ${err.message}`));
        });
    });
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(request) {
    if (!request.webhookUrl) return;
    
    try {
        // Get all products for this request
        const products = await Product.find({ requestId: request.requestId });
        
        // Create the payload
        const payload = {
            requestId: request.requestId,
            status: request.status,
            progress: request.progress,
            completedAt: new Date(),
            products: products.map(product => ({
                serialNumber: product.serialNumber,
                productName: product.productName,
                images: product.images.map(image => ({
                inputUrl: image.inputUrl,
                outputUrl: image.outputUrl,
                status: image.status
                }))
            }))
        };
        
        // Send the webhook
        const webhookUrl = new URL(request.webhookUrl);
        const protocol = webhookUrl.protocol === 'https:' ? https : http;
        
        await new Promise((resolve, reject) => {
            const req = protocol.request(webhookUrl, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                }
            }, (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve();
                } else {
                    reject(new Error(`Webhook returned status code ${res.statusCode}`));
                }
            });
            
            req.on('error', reject);
            req.write(JSON.stringify(payload));
            req.end();
        });
        
        console.log(`Webhook sent successfully to ${request.webhookUrl}`);
    } catch (error) {
        console.error(`Error sending webhook: ${error.message}`);
    }
}
const fs = require('fs');
const csv = require('csv-parser');
const { imageProcessingQueue } = require('../config/bull');
const Request = require('../models/request');
const Product = require('../models/product');

exports.parseCSV = async (filePath, requestId) => {
    try {
        // Get the request document
        const request = await Request.findOne({ requestId });
        if (!request) throw new Error('Request not found');
        
        // Update status to processing
        request.status = 'processing';
        await request.save();
        
        // Parse CSV file
        const products = [];
        let totalImages = 0;
        
        await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const serialNumber = parseInt(row['S. No.'], 10);
                const productName = row['Product Name'];
                const inputImageUrls = row['Input Image Urls'].split(',').map(url => url.trim());
                
                // Create product document
                const product = {
                    requestId,
                    serialNumber,
                    productName,
                    images: inputImageUrls.map(url => ({
                    inputUrl: url,
                    status: 'pending'
                    }))
                };
                
                products.push(product);
                totalImages += inputImageUrls.length;
            })
            .on('end', resolve)
            .on('error', reject);
        });
        
        // Update request with total image count
        request.progress.total = totalImages;
        await request.save();
        
        // Save products to database
        await Product.insertMany(products);
        
        // Add image processing jobs to queue
        await addImageProcessingJobs(products, requestId);
        
        return { success: true, totalProducts: products.length, totalImages };
    } catch (error) {
        // Update request status to failed
        const request = await Request.findOne({ requestId });
        if (request) {
        request.status = 'failed';
        await request.save();
        }
        
        throw error;
    } finally {
        // Clean up temp file
        fs.unlink(filePath, () => {});
    }
};

async function addImageProcessingJobs(products, requestId) {
    for (const product of products) {
        for (let i = 0; i < product.images.length; i++) {
        const image = product.images[i];
        
        await imageProcessingQueue.add({
            requestId,
            productId: product._id,
            serialNumber: product.serialNumber,
            productName: product.productName,
            imageIndex: i,
            inputUrl: image.inputUrl
        }, {
            attempts: 3,
            backoff: {
            type: 'exponential',
            delay: 2000
            }
        });
        }
    }
}
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const Product = require('../models/product');

/**
 * Generate output CSV for a completed request
 */
exports.generateOutputCSV = async (requestId) => {
    // Get all products for this request
    const products = await Product.find({ requestId }).sort({ serialNumber: 1 });
    
    // Create CSV content
    let csvContent = 'S. No.,Product Name,Input Image Urls,Output Image Urls\n';
    
    for (const product of products) {
        // Group input URLs
        const inputUrls = product.images.map(img => img.inputUrl).join(',');
        
        // Group output URLs (in the same order as input)
        const outputUrls = product.images.map(img => img.outputUrl || '').join(',');
        
        // Add row to CSV
        csvContent += `${product.serialNumber},"${product.productName}","${inputUrls}","${outputUrls}"\n`;
    }
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '../outputs');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write to file
    const outputPath = path.join(outputDir, `${requestId}.csv`);
    await writeFileAsync(outputPath, csvContent);
    
    return {
        filePath: outputPath,
        filename: `processed_images_${requestId}.csv`
    };
}
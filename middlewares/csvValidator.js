const Joi = require('joi');
const fs = require('fs');
const csv = require('csv-parser');
const { StatusCodes } = require('http-status-codes');

exports.validateCSV = (req, res, next) => {

    // Check if file is uploaded
    if (!req.file) {
        return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No CSV file uploaded'
        });
    }
    
    // Check if uploaded file is CSV
    if (req.file.mimetype !== 'text/csv') {
        return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Uploaded file is not a CSV'
        });
    }
    
    // Check if file is empty
    if (req.file.size === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Uploaded CSV file is empty'
        });
    }
    
    // Initialize file validation
    let rowCount = 0;
    let hasValidHeader = false;
    let validationErrors = [];
    
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('headers', (headers) => {
            // Validate headers (case-insensitive)
            const expectedHeaders = ['S. No.', 'Product Name', 'Input Image Urls'];
            const sanitizedHeaders = headers.map(h => h.trim());
            
            const hasAllExpectedHeaders = expectedHeaders.every(expectedHeader => 
                sanitizedHeaders.some(header => 
                header.toLowerCase() === expectedHeader.toLowerCase()
                )
            );
            
            hasValidHeader = hasAllExpectedHeaders;
            
            if (!hasValidHeader) {
                validationErrors.push('CSV has incorrect headers. Expected: S. No., Product Name, Input Image Urls');
            }
        })
        .on('data', (row) => {
            rowCount++;
            
            // Skip validation if headers are invalid
            if (!hasValidHeader) return;
            
            // Validate each row
            const schema = Joi.object({
                'S. No.': Joi.number().required(),
                'Product Name': Joi.string().required(),
                'Input Image Urls': Joi.string().required()
            });
            
            const { error } = schema.validate(row);
            if (error) {
                validationErrors.push(`Row ${rowCount}: ${error.message}`);
            }
            
            // Validate URLs format
            if (row['Input Image Urls']) {
                const urls = row['Input Image Urls'].split(',').map(url => url.trim());
                
                if (urls.length === 0) {
                validationErrors.push(`Row ${rowCount}: No image URLs provided`);
                }
                
                urls.forEach((url, index) => {
                try {
                    new URL(url);
                } catch (err) {
                    validationErrors.push(`Row ${rowCount}: Invalid URL format at position ${index + 1}: ${url}`);
                }
                });
            }
        })
        .on('end', () => {
            // Check if any rows were processed
            if (rowCount === 0) {
                validationErrors.push('CSV file has no data rows');
            }
            
            // If there are validation errors, return them
            if (validationErrors.length > 0) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'CSV validation failed',
                errors: validationErrors
                });
            }
            
            // If validation succeeds
            next();
        })
        .on('error', (err) => {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Error parsing CSV file',
                error: err.message
            });
        });
};
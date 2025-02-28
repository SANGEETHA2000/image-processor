const express = require('express');
const multer = require('multer');
const path = require('path');
const { validateCSV } = require('../middlewares/csvValidator');
const { uploadCSV } = require('../controllers/uploadController');

const router = express.Router();

// Configure multer for CSV upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../temp'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'text/csv') {
            return cb(new Error('Only CSV files are allowed'), false);
        }
        cb(null, true);
    }
});

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../temp');
const fs = require('fs');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Upload CSV route
router.post('/upload', upload.single('csv'), validateCSV, uploadCSV);

module.exports = router;
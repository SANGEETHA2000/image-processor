const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    requestId: {
        type: String,
        required: true,
        index: true
    },
    serialNumber: {
        type: Number,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    images: [{
        inputUrl: {
        type: String,
        required: true
        },
        outputUrl: {
        type: String,
        default: null
        },
        status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
        },
        processingStartedAt: {
        type: Date
        },
        processingCompletedAt: {
        type: Date
        },
        errorMessage: {
        type: String
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
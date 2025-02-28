const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    requestId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    progress: {
        total: {
        type: Number,
        default: 0
        },
        completed: {
        type: Number,
        default: 0
        },
        failed: {
        type: Number,
        default: 0
        }
    },
    webhookUrl: {
        type: String,
        default: null
    },
    originalFilename: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Check if processing is complete
requestSchema.methods.isProcessingComplete = function() {
    return this.progress.total > 0 && 
            (this.progress.completed + this.progress.failed) >= this.progress.total;
};

// Update progress
requestSchema.methods.updateProgress = async function() {
    const stats = await mongoose.model('Product').aggregate([
        { $match: { requestId: this.requestId } },
        { $unwind: '$images' },
        { $group: {
            _id: '$images.status',
            count: { $sum: 1 }
        }
        }
    ]);
  
    // Reset progress
    this.progress.completed = 0;
    this.progress.failed = 0;
    
    // Update from stats
    stats.forEach(stat => {
        if (stat._id === 'completed') this.progress.completed = stat.count;
        if (stat._id === 'failed') this.progress.failed = stat.count;
    });
    
    // Check if processing is complete
    if (this.isProcessingComplete()) {
        this.status = this.progress.failed > 0 ? 
        (this.progress.completed > 0 ? 'completed' : 'failed') : 
        'completed';
    } else if (this.progress.completed > 0 || this.progress.failed > 0) {
        this.status = 'processing';
    }
    
    await this.save();
};

module.exports = mongoose.model('Request', requestSchema);
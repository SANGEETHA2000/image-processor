const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

exports.connectDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        await mongoose.model('Product').createIndexes();
        console.log('MongoDB indexes created successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
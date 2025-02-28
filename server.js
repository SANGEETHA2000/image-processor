require('dotenv').config();
const app = require('./app');
const { connectDatabase } = require('./config/database');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and start server
connectDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to start server!', err);
        process.exit(1);
    });
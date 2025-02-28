const { StatusCodes } = require('http-status-codes');

exports.errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = err.message || 'Something went wrong';

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
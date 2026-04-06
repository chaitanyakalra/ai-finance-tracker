/**
 * Global Error Handling Middleware
 */
export default function errorHandler(err, req, res, next) {
    const isDevMode = process.env.NODE_ENV === 'development';
    const statusCode = err.statusCode || err.status || 500;

    console.error('ERROR:', err);

    return res.status(statusCode).json({
        error: statusCode === 500 ? 'Internal Server Error' : (err.name || 'Error'),
        message: err.message || 'An unexpected error occurred.',
        statusCode,
        ...(isDevMode ? { stack: err.stack } : {}),
    });
}

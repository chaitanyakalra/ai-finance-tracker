/**
 * Centralised Express error handler.
 * Must be registered LAST as middleware in server.js.
 */
export default function errorHandler(err, req, res, next) {
    const timestamp = new Date().toISOString();
    const userId = req.user?.id ?? req.userId ?? 'unauthenticated';

    // Structured log for every error
    console.error(JSON.stringify({
        timestamp,
        method: req.method,
        path: req.path,
        userId,
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    }));

    // Mongoose ValidationError → 400 with per-field details
    if (err.name === 'ValidationError') {
        const fields = Object.entries(err.errors).map(([field, e]) => ({
            field,
            message: e.message,
        }));
        return res.status(400).json({ error: 'Validation failed.', fields });
    }

    // MongoDB duplicate key → 409
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
        return res.status(409).json({ error: 'Duplicate entry.', field, message: `A record with this ${field} already exists.` });
    }

    // Invalid JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token. Please provide a valid access token.' });
    }

    // Expired JWT
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired. Use your refresh token to get a new access token.' });
    }

    // Mongoose CastError (invalid ObjectId / bad type)
    if (err.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid ID format.', field: err.path, value: err.value });
    }

    // Generic fallback
    const statusCode = err.statusCode || err.status || 500;
    return res.status(statusCode).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Centralised Express error handler.
 * Must be registered LAST as middleware in server.js.
 *
 * All error responses follow the shape:
 * {
 *   "error":      string   — short error type / title
 *   "message":    string   — human-readable description
 *   "statusCode": number   — mirrors the HTTP status code
 *   "details":    array    — optional, populated for validation errors
 * }
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
        ...(IS_DEV && { stack: err.stack }),
    }));

    // ── Mongoose ValidationError → 400 ──────────────────────────────────────
    if (err.name === 'ValidationError') {
        const details = Object.entries(err.errors).map(([field, e]) => ({
            field,
            message: e.message,
        }));
        return res.status(400).json({
            error: 'Validation Error',
            message: 'One or more fields failed validation.',
            statusCode: 400,
            details,
        });
    }

    // ── MongoDB duplicate key → 409 ─────────────────────────────────────────
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
        return res.status(409).json({
            error: 'Conflict',
            message: `A record with this ${field} already exists.`,
            statusCode: 409,
        });
    }

    // ── Invalid JWT → 401 ────────────────────────────────────────────────────
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid token. Please provide a valid access token.',
            statusCode: 401,
        });
    }

    // ── Expired JWT → 401 ────────────────────────────────────────────────────
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Token expired. Use your refresh token to get a new access token.',
            statusCode: 401,
        });
    }

    // ── Mongoose CastError (bad ObjectId / type mismatch) → 400 ─────────────
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Bad Request',
            message: `Invalid value for field '${err.path}'.`,
            statusCode: 400,
            details: [{ field: err.path, message: `Expected a valid value but received: ${err.value}` }],
        });
    }

    // ── Generic / unhandled errors ───────────────────────────────────────────
    const statusCode = err.statusCode || err.status || 500;
    return res.status(statusCode).json({
        error: statusCode === 500 ? 'Internal Server Error' : (err.name || 'Error'),
        message: statusCode === 500 && !IS_DEV
            ? 'An unexpected error occurred. Please try again later.'
            : (err.message || 'An unexpected error occurred.'),
        statusCode,
        ...(IS_DEV && err.stack && { stack: err.stack }),
    });
}

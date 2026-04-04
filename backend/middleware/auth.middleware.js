import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/User.js';

/**
 * JWT Authentication Middleware
 * Verifies the access token, fetches current user from DB,
 * rejects inactive users, and attaches full req.user object.
 */
export async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: 'Access token required. Please provide an Authorization header with a Bearer token.',
            });
        }

        const decoded = verifyAccessToken(token);

        if (decoded.type !== 'access') {
            return res.status(401).json({ error: 'Invalid token type. Access token required.' });
        }
        if (!decoded.userId) {
            return res.status(401).json({ error: 'User ID not found in token.' });
        }

        // Fetch CURRENT user data from DB (role/status may have changed since token was issued)
        const user = await User.findOne({ id: decoded.userId }).select('id email name role status profilePic').lean();

        if (!user) {
            return res.status(401).json({ error: 'User not found. Token may be stale.' });
        }

        if (user.status === 'inactive') {
            return res.status(401).json({ error: 'Account is inactive. Contact an administrator.' });
        }

        // Attach full user object to request
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
        };

        // Backwards-compat: keep req.userId working for existing controllers
        req.userId = user.id;

        // Fire-and-forget lastLogin update — don't await to avoid latency
        User.updateOne({ id: user.id }, { lastLogin: new Date() }).exec().catch(() => {});

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token. Please provide a valid access token.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please use your refresh token to obtain a new access token.' });
        }
        return res.status(401).json({ error: 'Authentication failed.' });
    }
}

/**
 * Optional auth — silently populates req.user / req.userId if a valid token is present,
 * but never returns an error if the token is missing or invalid.
 */
export async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return next();

        const decoded = verifyAccessToken(token);
        if (decoded.type !== 'access' || !decoded.userId) return next();

        const user = await User.findOne({ id: decoded.userId }).select('id email name role status').lean();
        if (user && user.status === 'active') {
            req.user = { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status };
            req.userId = user.id;
        }
    } catch (_) {
        // Silently ignore — optional auth never blocks the request
    }
    next();
}

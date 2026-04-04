import { hasMinimumRole, canPerformAction } from '../config/permissions.js';

/**
 * Middleware factory — allows only users whose role is in allowedRoles.
 * @param {...string} allowedRoles
 */
export function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        const role = req.user?.role;
        if (!role || !allowedRoles.includes(role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `This action requires one of: [${allowedRoles.join(', ')}]. Your role: ${role ?? 'unknown'}`,
            });
        }
        next();
    };
}

/**
 * Middleware factory — user must have at minimum the specified role.
 * @param {string} minimumRole
 */
export function requireMinimumRole(minimumRole) {
    return (req, res, next) => {
        const role = req.user?.role;
        if (!role || !hasMinimumRole(role, minimumRole)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `This action requires at least the '${minimumRole}' role. Your role: ${role ?? 'unknown'}`,
            });
        }
        next();
    };
}

/**
 * Middleware factory — user must have the specific permission flag set to true.
 * @param {string} permission - e.g. 'canDeleteRecords'
 */
export function checkPermission(permission) {
    return (req, res, next) => {
        const role = req.user?.role;
        if (!role || !canPerformAction(role, permission)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `Missing permission: '${permission}'. Your role: ${role ?? 'unknown'}`,
            });
        }
        next();
    };
}

/** Shorthand: admin-only gate. */
export const adminOnly = authorizeRoles('admin');

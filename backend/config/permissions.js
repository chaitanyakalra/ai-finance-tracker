/**
 * RBAC Permission definitions
 * Each role inherits permissions cumulatively up the hierarchy.
 */

const PERMISSIONS = {
    viewer: {
        canViewRecords: true,
        canCreateRecords: false,
        canUpdateRecords: false,
        canDeleteRecords: false,
        canViewAnalytics: true,
        canViewDashboard: true,
        canManageUsers: false,
        canManageGroups: false,
    },
    analyst: {
        canViewRecords: true,
        canCreateRecords: true,
        canUpdateRecords: true,
        canDeleteRecords: false,
        canViewAnalytics: true,
        canViewDashboard: true,
        canManageUsers: false,
        canManageGroups: true,
    },
    admin: {
        canViewRecords: true,
        canCreateRecords: true,
        canUpdateRecords: true,
        canDeleteRecords: true,
        canViewAnalytics: true,
        canViewDashboard: true,
        canManageUsers: true,
        canManageGroups: true,
    },
};

// Numeric hierarchy for minimum-role checks
const ROLE_HIERARCHY = { viewer: 1, analyst: 2, admin: 3 };

/**
 * Returns the permission object for a given role.
 * @param {string} role
 * @returns {object}
 */
export function getPermissions(role) {
    return PERMISSIONS[role] ?? PERMISSIONS.viewer;
}

/**
 * Returns true if the role has the given action permission.
 * @param {string} role
 * @param {string} action - key from permission object
 * @returns {boolean}
 */
export function canPerformAction(role, action) {
    const perms = getPermissions(role);
    return perms[action] === true;
}

/**
 * Returns true if userRole meets or exceeds requiredRole in hierarchy.
 * @param {string} userRole
 * @param {string} requiredRole
 * @returns {boolean}
 */
export function hasMinimumRole(userRole, requiredRole) {
    return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? Infinity);
}

export default PERMISSIONS;

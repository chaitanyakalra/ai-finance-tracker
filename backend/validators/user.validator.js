import Joi from 'joi';

const VALID_ROLES = ['viewer', 'analyst', 'admin'];
const VALID_STATUSES = ['active', 'inactive'];

/** Schema for updating a user's role (admin only) */
export const updateRoleSchema = Joi.object({
    role: Joi.string().valid(...VALID_ROLES).required()
        .messages({
            'any.only': `role must be one of: ${VALID_ROLES.join(', ')}`,
            'any.required': 'role is required',
        }),
});

/** Schema for updating a user's status (admin only) */
export const updateStatusSchema = Joi.object({
    status: Joi.string().valid(...VALID_STATUSES).required()
        .messages({
            'any.only': `status must be one of: ${VALID_STATUSES.join(', ')}`,
            'any.required': 'status is required',
        }),
});

/** Schema for updating a user's own profile */
export const updateProfileSchema = Joi.object({
    name: Joi.string().trim().min(1).max(100).optional()
        .messages({ 'string.min': 'name cannot be empty' }),
    profilePic: Joi.string().uri().allow('', null).optional()
        .messages({ 'string.uri': 'profilePic must be a valid URL' }),
}).min(1).messages({ 'object.min': 'At least one field (name or profilePic) must be provided' });

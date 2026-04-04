import Joi from 'joi';

const CATEGORIES = [
    'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment',
    'Salary', 'Bonus', 'Investment', 'Healthcare', 'Education', 'Others',
];

const RECURRING_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];

/** Schema for creating a new expense */
export const createExpenseSchema = Joi.object({
    type: Joi.string().valid('income', 'expense').required()
        .messages({ 'any.only': 'type must be either "income" or "expense"' }),
    category: Joi.string().valid(...CATEGORIES).required()
        .messages({ 'any.only': `category must be one of: ${CATEGORIES.join(', ')}` }),
    amount: Joi.number().positive().precision(2).required()
        .messages({
            'number.positive': 'amount must be a positive number',
            'number.base': 'amount must be a valid number',
        }),
    date: Joi.date().iso().max('now').required()
        .messages({
            'date.max': 'date cannot be in the future',
            'date.format': 'date must be a valid ISO 8601 date string',
        }),
    description: Joi.string().max(500).allow('', null).optional(),
    tags: Joi.array().items(Joi.string().trim().max(50)).max(10).default([]),
    isRecurring: Joi.boolean().default(false),
    recurringFrequency: Joi.when('isRecurring', {
        is: true,
        then: Joi.string().valid(...RECURRING_FREQUENCIES).required()
            .messages({ 'any.required': 'recurringFrequency is required when isRecurring is true' }),
        otherwise: Joi.string().valid(...RECURRING_FREQUENCIES).allow(null).default(null),
    }),
    recurringEndDate: Joi.date().iso().greater(Joi.ref('date')).allow(null).optional()
        .messages({ 'date.greater': 'recurringEndDate must be after the expense date' }),
    notes: Joi.string().max(1000).allow('', null).optional(),
});

/** Schema for updating an existing expense (all fields optional) */
export const updateExpenseSchema = Joi.object({
    type: Joi.string().valid('income', 'expense').optional()
        .messages({ 'any.only': 'type must be either "income" or "expense"' }),
    category: Joi.string().valid(...CATEGORIES).optional()
        .messages({ 'any.only': `category must be one of: ${CATEGORIES.join(', ')}` }),
    amount: Joi.number().positive().precision(2).optional()
        .messages({ 'number.positive': 'amount must be a positive number' }),
    date: Joi.date().iso().max('now').optional()
        .messages({ 'date.max': 'date cannot be in the future' }),
    description: Joi.string().max(500).allow('', null).optional(),
    tags: Joi.array().items(Joi.string().trim().max(50)).max(10).optional(),
    isRecurring: Joi.boolean().optional(),
    recurringFrequency: Joi.string().valid(...RECURRING_FREQUENCIES).allow(null).optional(),
    recurringEndDate: Joi.date().iso().allow(null).optional(),
    notes: Joi.string().max(1000).allow('', null).optional(),
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

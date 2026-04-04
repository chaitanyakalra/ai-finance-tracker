/**
 * Validation middleware factory.
 * Validates req.body against a Joi schema and returns a structured 400 error on failure.
 *
 * @param {import('joi').Schema} schema - Joi schema to validate against
 * @param {'body'|'query'|'params'} [target='body'] - Request property to validate
 * @returns {import('express').RequestHandler}
 */
export function validate(schema, target = 'body') {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[target], {
            abortEarly: false,   // collect all errors, not just the first
            stripUnknown: true,  // remove keys not in schema
            convert: true,       // coerce types (e.g. string → number)
        });

        if (error) {
            const details = error.details.map((d) => ({
                field: d.path.join('.'),
                message: d.message.replace(/['"]/g, ''),
            }));
            return res.status(400).json({
                error: 'Validation Error',
                message: 'One or more fields are invalid.',
                statusCode: 400,
                details,
            });
        }

        // Replace target with the coerced + stripped value
        req[target] = value;
        next();
    };
}

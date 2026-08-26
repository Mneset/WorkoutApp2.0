const { ZodError } = require('zod');

const validate = (schema) => (req, res, next) => {
    try {
        // Use the PARSED result so schema coercion (e.g. z.coerce.number turning
        // '' or '8' into a real number) actually reaches the route/DB. Merge over the
        // raw body so any field not covered by the schema is preserved.
        req.body = { ...req.body, ...schema.parse(req.body) };
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                status: 'error',
                statuscode: 400,
                data: {
                    message: 'Validation failed',
                    errors: error.issues.map(e => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                }
            });
        }
        next(error);
    }
};

const validateQuery = (schema) => (req, res, next) => {
    try {
        schema.parse(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                status: 'error',
                statuscode: 400,
                data: {
                    message: 'Validation failed',
                    errors: error.issues.map(e => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                }
            });
        }
        next(error);
    }
};

module.exports = { validate, validateQuery };

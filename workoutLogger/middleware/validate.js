const { ZodError } = require('zod');

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                status: 'error',
                statuscode: 400,
                data: {
                    message: 'Validation failed',
                    errors: error.errors.map(e => ({
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
                    errors: error.errors.map(e => ({
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

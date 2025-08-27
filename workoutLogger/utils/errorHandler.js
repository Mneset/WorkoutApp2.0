const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');

function errorHandler(err, req, res, next) {

    if (err.status === 404) {
        console.error('Error handler:', err)
        return res.status(404).json({
            status: 'error',
            statuscode: 404,
            data: {
                result: err.message 
            }
        });
    }

    if( err.name === 'UnauthorizedError') {
        console.error('Error handler:', err)
        return res.status(401).json({
            status: 'error',
            statuscode: 401,
            data: {
                result: 'Invalid token'
            }
        });
    }

    if(err instanceof ValidationError) {
        console.error('Error handler:', err)
        return res.status(400).json({
            status: 'error',
            statuscode: 400,
            data: {
                result: err.errors.map(e => e.message).join(', ')
            }
        })
    }

    if(err instanceof UniqueConstraintError) {
        console.error('Error handler:', err)
        return res.status(400).json({
            status: 'error',
            statuscode: 400,
            data: {
                result: 'Unique constraint violation'
            }
        })
    }

    if (err instanceof ForeignKeyConstraintError) {
        console.error('Error handler:', err)
        return res.status(400).json({
            status: 'error',
            statuscode: 400,
            data: {
                result: 'Foreign key constraint violation'
            }
        })
    }
    
    if(err.status && err.status !== 500 && err.expose !== undefined) {
        console.error('Error handler:', err)
        return res.status(err.status).json({
            status: 'error',
            statuscode: err.status,
            data: {
                result: err.message
            }
        });
    }

    console.error('Error handler:', err)
    return res.status(500).json({
        status: 'error',
        statuscode: 500,
        data:{
            result: 'Internal server error'
        }
    })

}

module.exports = { errorHandler }
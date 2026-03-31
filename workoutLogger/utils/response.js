const success = (res, data, statusCode = 200) => {
    return res.status(statusCode).json({
        status: 'success',
        statuscode: statusCode,
        data: {
            result: data
        }
    });
};

const error = (res, message, statusCode = 500) => {
    return res.status(statusCode).json({
        status: 'error',
        statuscode: statusCode,
        data: {
            message: message
        }
    });
};

module.exports = { success, error };

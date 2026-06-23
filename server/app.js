const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
const routes = require('./src/routes');
const AppError = require('./src/utils/appError');

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [])
].map((origin) => origin.trim());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(helmet());
app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

app.get('/', (req, res) => {
    res.send('Badminton Booking System API is running...');
});

app.use('/api/v1', routes);

app.use((req, res, next) => {
    next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

const normalizeError = (err) => {
    if (err.name === 'JsonWebTokenError') {
        return new AppError('Invalid token. Please log in again', 401);
    }

    if (err.name === 'TokenExpiredError') {
        return new AppError('Your token has expired. Please log in again', 401);
    }

    if (err.type === 'entity.parse.failed') {
        return new AppError('Invalid JSON request body', 400);
    }

    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((item) => item.message).join('. ');
        return new AppError(message, 400);
    }

    if (err.name === 'CastError') {
        return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
    }

    if (err.code === 11000) {
        const fields = Object.keys(err.keyValue || {}).join(', ') || 'field';
        return new AppError(`Duplicate value for ${fields}`, 409);
    }

    if (!err.isOperational && err.statusCode && err.statusCode < 500 && err.expose) {
        return new AppError(err.message, err.statusCode);
    }

    return err;
};

app.use((err, req, res, next) => {
    err = normalizeError(err);
    const statusCode = err.statusCode || 500;
    const status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    if (process.env.NODE_ENV === 'production' && !err.isOperational) {
        console.error(err);
    }

    res.status(statusCode).json({
        status,
        message: err.isOperational ? err.message : 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
});

module.exports = app;

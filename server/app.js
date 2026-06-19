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

app.use((err, req, res, next) => {
    if (err.name === 'JsonWebTokenError') {
        err = new AppError('Invalid token. Please log in again', 401);
    }

    if (err.name === 'TokenExpiredError') {
        err = new AppError('Your token has expired. Please log in again', 401);
    }

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        status: err.status || 'error',
        message: err.isOperational ? err.message : 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
});

module.exports = app;

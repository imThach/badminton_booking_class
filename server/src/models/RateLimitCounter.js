const mongoose = require('mongoose');

const rateLimitCounterSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
        },
        count: {
            type: Number,
            required: true,
            default: 0,
        },
        resetAt: {
            type: Date,
            required: true,
            index: { expires: 0 },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('RateLimitCounter', rateLimitCounterSchema);

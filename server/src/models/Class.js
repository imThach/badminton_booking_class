const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title of the class is required'],
        },
        description: {
            type: String,
            required: [true, 'Description of the class is required'],
        },
        coachName: {
            type: String,
            required: [true, 'Please enter the coach name'],
        },
        level: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            required: [true, 'Please select the class level'],
        },
        startDate: {
            type: Date,
            required: [true, 'Please enter the start date of the class'],
        },
        schedule: {
            type: String,
            required: [true, 'Please enter the schedule of the class (e.g., "Mon/Wed/Fri 6-7pm")'],
        },
        location: {
            type: String,
            required: [true, 'Please enter the class location'],
        },
        maxStudents: {
            type: Number,
            required: [true, 'Please enter the maximum number of students'],
            min: [1, 'Maximum students must be greater than 0'],
        },
        currentStudents: {
            type: Number,
            default: 0,
            min: [0, 'Current students cannot be negative'],
        },
        createdBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Class', classSchema);

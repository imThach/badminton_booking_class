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
            required: [true, 'PLease enter the coach name'],
        },
        level: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            required: [true, 'PLease select the class level'],
        },
        startDate: {
            type: Date,
            required: [true, 'PLease enter the start date of the class'],
        },
        schedule: {
            type: String,
            required: [true, 'PLease enter the schedule of the class (e.g., "Mon/Wed/Fri 6-7pm")'],
        },
        location: {
            type: String,
            required: [true, 'Vui lòng nhập địa điểm học'],
        },
        maxStudents: {
            type: Number,
            required: [true, 'Vui lòng nhập số lượng học viên tối đa'],
            min: [1, 'Số lượng học viên phải lớn hơn 0'],
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
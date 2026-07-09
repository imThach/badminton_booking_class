const mongoose = require('mongoose');
const schema = new mongoose.Schema({ class: { type: mongoose.Schema.ObjectId, ref: 'Class', required: true, index: true }, startDate: { type: Date, required: true }, endDate: { type: Date, required: true }, location: { type: String, trim: true, maxlength: 200 }, capacity: { type: Number, min: 1 }, origin: { type: String, enum: ['auto','manual','transfer'], default: 'manual' }, status: { type: String, enum: ['scheduled','completed','cancelled'], default: 'scheduled' } }, { timestamps: true });
schema.index({ class: 1, startDate: 1 }, { unique: true });
module.exports = mongoose.model('ClassSession', schema);

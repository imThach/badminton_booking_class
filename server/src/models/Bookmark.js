const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
    class: { type: mongoose.Schema.ObjectId, ref: 'Class', required: true },
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

bookmarkSchema.index({ class: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);

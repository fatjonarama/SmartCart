const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: { type: Number, required: true },
  userId:    { type: Number, required: true },
  username:  { type: String, required: true },
  comment:   { type: String, required: true },
  rating:    { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
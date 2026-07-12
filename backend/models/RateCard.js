const mongoose = require('mongoose');

const rateCardSchema = new mongoose.Schema({
  orderType: {
    type: String,
    enum: ['B2B', 'B2C'],
    required: true
  },
  intraZoneRate: {
    type: Number,
    required: true
  },
  interZoneRate: {
    type: Number,
    required: true
  },
  codSurcharge: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RateCard', rateCardSchema);

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pickupAddress: {
    type: String,
    required: true
  },
  pickupArea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: true
  },
  pickupZone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: true
  },
  dropAddress: {
    type: String,
    required: true
  },
  dropArea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: true
  },
  dropZone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: true
  },
  dimensions: {
    length: {
      type: Number,
      required: true
    },
    breadth: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    }
  },
  actualWeight: {
    type: Number,
    required: true
  },
  volumetricWeight: {
    type: Number,
    required: true
  },
  billableWeight: {
    type: Number,
    required: true
  },
  orderType: {
    type: String,
    enum: ['B2B', 'B2C'],
    required: true
  },
  paymentType: {
    type: String,
    enum: ['Prepaid', 'COD'],
    required: true
  },
  charge: {
    type: Number,
    required: true
  },
  codSurcharge: {
    type: Number,
    default: 0
  },
  totalCharge: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'Picked Up', 'In Transit', 'Out For Delivery', 'Delivered', 'Failed'],
    default: 'Pending'
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rescheduledDate: {
    type: Date
  },
  trackingHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrackingHistory'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);

const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getMyOrders,
  getOrder,
  previewCharge,
  rescheduleDelivery,
  updateProfile
} = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');

// All customer routes require authentication and customer role
router.use(protect);
router.use(authorize('customer'));

// Orders
router.post('/orders', placeOrder);
router.get('/orders', getMyOrders);
router.get('/orders/:id', getOrder);

// Charge Calculation
router.post('/preview-charge', previewCharge);

// Reschedule
router.post('/reschedule', rescheduleDelivery);

// Profile
router.put('/profile', updateProfile);

module.exports = router;

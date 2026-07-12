const express = require('express');
const router = express.Router();
const {
  getAssignedOrders,
  getOrder,
  updateStatus,
  updateLocation,
  toggleAvailability
} = require('../controllers/agentController');
const { protect, authorize } = require('../middleware/auth');

// All agent routes require authentication and delivery_agent role
router.use(protect);
router.use(authorize('delivery_agent'));

// Orders
router.get('/orders', getAssignedOrders);
router.get('/orders/:id', getOrder);

// Status Update
router.post('/update-status', updateStatus);

// Location Update
router.post('/update-location', updateLocation);

// Availability Toggle
router.post('/toggle-availability', toggleAvailability);

module.exports = router;

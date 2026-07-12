const express = require('express');
const router = express.Router();
const {
  getUsersByRole,
  updateUser,
  deleteUser,
  createZone,
  getZones,
  createArea,
  getAreas,
  createRateCard,
  getRateCards,
  previewCharge,
  createOrder,
  getOrders,
  getOrder,
  assignAgent,
  autoAssign,
  overrideStatus
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Users
router.get('/users', getUsersByRole);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Zones
router.post('/zones', createZone);
router.get('/zones', getZones);

// Areas
router.post('/areas', createArea);
router.get('/areas', getAreas);

// Rate Cards
router.post('/rate-cards', createRateCard);
router.get('/rate-cards', getRateCards);

// Charge Calculation
router.post('/preview-charge', previewCharge);

// Orders
router.post('/orders', createOrder);
router.get('/orders', getOrders);
router.get('/orders/:id', getOrder);

// Agent Assignment
router.post('/assign-agent', assignAgent);
router.post('/auto-assign', autoAssign);

// Status Override
router.post('/override-status', overrideStatus);

module.exports = router;

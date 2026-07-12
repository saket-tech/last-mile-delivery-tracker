const Order = require('../models/Order');
const User = require('../models/User');
const TrackingHistory = require('../models/TrackingHistory');
const { calculateCharge } = require('../services/rateCalculationService');
const { sendOrderStatusEmail, sendRescheduledEmail } = require('../services/emailService');
const { sendOrderStatusSMS } = require('../services/smsService');

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Place Order
const placeOrder = async (req, res) => {
  try {
    const {
      pickupAddress,
      dropAddress,
      dimensions,
      actualWeight,
      orderType,
      paymentType
    } = req.body;

    // Calculate charge
    const chargeData = await calculateCharge({
      pickupAddress,
      dropAddress,
      dimensions,
      actualWeight,
      orderType,
      paymentType
    });

    // Create order
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      customer: req.user._id,
      pickupAddress,
      pickupArea: chargeData.pickupArea,
      pickupZone: chargeData.pickupZone,
      dropAddress,
      dropArea: chargeData.dropArea,
      dropZone: chargeData.dropZone,
      dimensions,
      actualWeight,
      volumetricWeight: chargeData.volumetricWeight,
      billableWeight: chargeData.billableWeight,
      orderType,
      paymentType,
      charge: chargeData.baseCharge,
      codSurcharge: chargeData.codSurcharge,
      totalCharge: chargeData.totalCharge,
      status: 'Pending'
    });

    // Create initial tracking history
    const tracking = await TrackingHistory.create({
      order: order._id,
      status: 'Pending',
      actor: req.user._id,
      actorRole: req.user.role,
      notes: 'Order placed by customer',
      timestamp: new Date()
    });

    order.trackingHistory.push(tracking._id);
    await order.save();

    // Send notification
    await sendOrderStatusEmail(req.user.email, req.user.name, order.orderNumber, 'Pending', 'Order placed successfully');
    await sendOrderStatusSMS(req.user.phone, order.orderNumber, 'Pending');

    await order.populate('customer pickupArea dropArea pickupZone dropZone assignedAgent');
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get My Orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('pickupArea dropArea pickupZone dropZone assignedAgent')
      .populate({
        path: 'trackingHistory',
        populate: { path: 'actor', select: 'name role' }
      })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Order
const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id
    })
      .populate('customer pickupArea dropArea pickupZone dropZone assignedAgent')
      .populate({
        path: 'trackingHistory',
        populate: { path: 'actor', select: 'name role' }
      });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('Order tracking history:', JSON.stringify(order.trackingHistory, null, 2));
    res.json(order);
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ message: error.message });
  }
};

// Calculate Charge (preview)
const previewCharge = async (req, res) => {
  try {
    const calculation = await calculateCharge(req.body);
    res.json(calculation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reschedule Failed Delivery
const rescheduleDelivery = async (req, res) => {
  try {
    const { orderId, newDate } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'Failed') {
      return res.status(400).json({ message: 'Only failed orders can be rescheduled' });
    }

    order.rescheduledDate = newDate;
    order.status = 'Pending';
    order.assignedAgent = null;
    await order.save();

    // Create tracking history
    const tracking = await TrackingHistory.create({
      order: order._id,
      status: 'Pending',
      actor: req.user._id,
      actorRole: req.user.role,
      notes: `Delivery rescheduled to ${newDate}`,
      timestamp: new Date()
    });

    order.trackingHistory.push(tracking._id);
    await order.save();

    // Send notification
    await sendRescheduledEmail(req.user.email, req.user.name, order.orderNumber, newDate);
    await sendOrderStatusSMS(req.user.phone, order.orderNumber, 'Rescheduled');

    await order.populate('assignedAgent');
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, phone },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getOrder,
  previewCharge,
  rescheduleDelivery,
  updateProfile
};

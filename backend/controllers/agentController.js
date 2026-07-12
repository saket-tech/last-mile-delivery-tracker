const Order = require('../models/Order');
const User = require('../models/User');
const TrackingHistory = require('../models/TrackingHistory');
const AgentLocation = require('../models/AgentLocation');
const { sendOrderStatusEmail, sendFailedDeliveryEmail } = require('../services/emailService');
const { sendOrderStatusSMS, sendFailedDeliverySMS } = require('../services/smsService');

// Get Assigned Orders
const getAssignedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ assignedAgent: req.user._id })
      .populate('customer pickupArea dropArea pickupZone dropZone')
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
      assignedAgent: req.user._id
    })
      .populate('customer pickupArea dropArea pickupZone dropZone')
      .populate({
        path: 'trackingHistory',
        populate: { path: 'actor', select: 'name role' }
      });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Order Status
const updateStatus = async (req, res) => {
  try {
    const { orderId, status, notes } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      assignedAgent: req.user._id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    order.status = status;
    await order.save();

    // Create tracking history
    const tracking = await TrackingHistory.create({
      order: order._id,
      status,
      actor: req.user._id,
      actorRole: req.user.role,
      notes: notes || `Status updated from ${oldStatus} to ${status}`,
      timestamp: new Date()
    });

    order.trackingHistory.push(tracking._id);
    await order.save();

    // Get customer details
    const customer = await User.findById(order.customer);

    // Send notifications based on status
    if (status === 'Failed' && customer) {
      await sendFailedDeliveryEmail(customer.email, customer.name, order.orderNumber);
      await sendFailedDeliverySMS(customer.phone, order.orderNumber);
    } else if (customer) {
      await sendOrderStatusEmail(customer.email, customer.name, order.orderNumber, status, notes);
      await sendOrderStatusSMS(customer.phone, order.orderNumber, status);
    }

    await order.populate('customer');
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Current Location
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, zone, area } = req.body;

    // Save location to AgentLocation collection if coordinates provided
    if (latitude && longitude) {
      const location = await AgentLocation.create({
        agent: req.user._id,
        latitude,
        longitude
      });
    }

    // Update user's current location if coordinates provided
    if (latitude && longitude) {
      req.user.currentLocation = { latitude, longitude };
    }
    
    // Update user's zone if provided
    if (zone) {
      req.user.zone = zone.trim();
    }
    
    // Store area in currentLocation as metadata if provided
    if (area) {
      req.user.currentLocation = req.user.currentLocation || {};
      req.user.currentLocation.area = area.trim();
    }
    
    await req.user.save();

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle Availability
const toggleAvailability = async (req, res) => {
  try {
    req.user.isAvailable = !req.user.isAvailable;
    await req.user.save();

    res.json({
      message: 'Availability updated',
      isAvailable: req.user.isAvailable
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAssignedOrders,
  getOrder,
  updateStatus,
  updateLocation,
  toggleAvailability
};

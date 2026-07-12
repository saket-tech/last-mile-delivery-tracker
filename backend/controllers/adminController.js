const Zone = require('../models/Zone');
const Area = require('../models/Area');
const RateCard = require('../models/RateCard');
const Order = require('../models/Order');
const User = require('../models/User');
const TrackingHistory = require('../models/TrackingHistory');
const { autoAssignAgent } = require('../services/autoAssignmentService');
const { calculateCharge } = require('../services/rateCalculationService');
const { sendOrderStatusEmail, sendFailedDeliveryEmail, sendRescheduledEmail } = require('../services/emailService');
const { sendOrderStatusSMS, sendFailedDeliverySMS } = require('../services/smsService');

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Get Users by Role
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update User
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, zone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      id,
      { name, email, phone, zone },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Zone
const createZone = async (req, res) => {
  try {
    const { name, description } = req.body;
    const zone = await Zone.create({ name, description });
    res.status(201).json(zone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Zones
const getZones = async (req, res) => {
  try {
    const zones = await Zone.find().sort({ name: 1 });
    res.json(zones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Area
const createArea = async (req, res) => {
  try {
    const { name, zone } = req.body;
    const area = await Area.create({ name, zone });
    await area.populate('zone');
    res.status(201).json(area);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Areas
const getAreas = async (req, res) => {
  try {
    const areas = await Area.find().populate('zone').sort({ name: 1 });
    res.json(areas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Rate Card
const createRateCard = async (req, res) => {
  try {
    const { orderType, intraZoneRate, interZoneRate, codSurcharge } = req.body;
    const rateCard = await RateCard.create({ orderType, intraZoneRate, interZoneRate, codSurcharge });
    res.status(201).json(rateCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Rate Cards
const getRateCards = async (req, res) => {
  try {
    const rateCards = await RateCard.find().sort({ orderType: 1 });
    res.json(rateCards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Calculate Charge (for preview before order creation)
const previewCharge = async (req, res) => {
  try {
    const calculation = await calculateCharge(req.body);
    res.json(calculation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Order for Customer
const createOrder = async (req, res) => {
  try {
    const {
      customer,
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
      customer,
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
      notes: 'Order created',
      timestamp: new Date()
    });

    order.trackingHistory.push(tracking._id);
    await order.save();

    // Get customer details for notification
    const customerUser = await User.findById(customer);
    if (customerUser) {
      await sendOrderStatusEmail(customerUser.email, customerUser.name, order.orderNumber, 'Pending', 'Order created successfully');
      await sendOrderStatusSMS(customerUser.phone, order.orderNumber, 'Pending');
    }

    await order.populate('customer pickupArea dropArea pickupZone dropZone assignedAgent');
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Orders
const getOrders = async (req, res) => {
  try {
    const { status, zone, agent } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (zone) filter.pickupZone = zone;
    if (agent) filter.assignedAgent = agent;

    const orders = await Order.find(filter)
      .populate('customer pickupArea dropArea pickupZone dropZone assignedAgent')
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
    const order = await Order.findById(req.params.id)
      .populate('customer pickupArea dropArea pickupZone dropZone assignedAgent')
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

// Manual Agent Assignment
const assignAgent = async (req, res) => {
  try {
    const { orderId, agentId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'delivery_agent') {
      return res.status(400).json({ message: 'Invalid agent' });
    }

    order.assignedAgent = agentId;
    order.status = 'Assigned';
    await order.save();

    // Create tracking history
    const tracking = await TrackingHistory.create({
      order: order._id,
      status: 'Assigned',
      actor: req.user._id,
      actorRole: req.user.role,
      notes: `Manually assigned to agent ${agent.name}`
    });

    order.trackingHistory.push(tracking._id);
    await order.save();

    // Notify customer
    const customer = await User.findById(order.customer);
    if (customer) {
      await sendOrderStatusEmail(customer.email, customer.name, order.orderNumber, 'Assigned', `Agent ${agent.name} assigned`);
      await sendOrderStatusSMS(customer.phone, order.orderNumber, 'Assigned');
    }

    await order.populate('assignedAgent');
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Auto Agent Assignment
const autoAssign = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId).populate('pickupZone');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Auto assign nearest agent - pass zone name instead of ObjectId
    const assignment = await autoAssignAgent(order.pickupZone.name);

    order.assignedAgent = assignment.agentId;
    order.status = 'Assigned';
    await order.save();

    // Create tracking history
    const tracking = await TrackingHistory.create({
      order: order._id,
      status: 'Assigned',
      actor: req.user._id,
      actorRole: req.user.role,
      notes: `Auto assigned to agent ${assignment.agentName} (${assignment.method})`
    });

    order.trackingHistory.push(tracking._id);
    await order.save();

    // Notify customer
    const customer = await User.findById(order.customer);
    if (customer) {
      await sendOrderStatusEmail(customer.email, customer.name, order.orderNumber, 'Assigned', `Agent ${assignment.agentName} assigned`);
      await sendOrderStatusSMS(customer.phone, order.orderNumber, 'Assigned');
    }

    await order.populate('assignedAgent');
    res.json({ order, assignment });
  } catch (error) {
    console.error('Auto assignment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Override Order Status
const overrideStatus = async (req, res) => {
  try {
    const { orderId, status, notes } = req.body;

    const order = await Order.findById(orderId);
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
      notes: notes || `Status overridden from ${oldStatus} to ${status}`,
      timestamp: new Date()
    });

    order.trackingHistory.push(tracking._id);
    await order.save();

    // Notify customer
    const customer = await User.findById(order.customer);
    if (customer) {
      await sendOrderStatusEmail(customer.email, customer.name, order.orderNumber, status, notes);
      await sendOrderStatusSMS(customer.phone, order.orderNumber, status);
    }

    await order.populate('assignedAgent');
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};

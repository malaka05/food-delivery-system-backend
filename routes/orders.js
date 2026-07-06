const express = require('express');
const Order = require('../models/Order');
const { protect, authorizeRoles } = require('../middleware/auth');
const { sendWhatsAppNotification } = require('../utils/whatsapp');

const router = express.Router();

const transformOrder = (order) => {
  const obj = order.toObject ? order.toObject() : order;
  obj.id = obj._id.toString();

  if (obj.customerId && obj.customerId._id) {
    obj.customer = {
      id: obj.customerId._id.toString(),
      name: obj.customerId.name,
      phone: obj.customerId.phone,
    };
    obj.customerId = obj.customerId._id.toString();
  } else if (obj.customerId) {
    obj.customerId = obj.customerId.toString();
  }

  if (obj.shopId && obj.shopId._id) {
    obj.shop = {
      id: obj.shopId._id.toString(),
      name: obj.shopId.shopName,
      location: obj.shopId.location,
    };
    obj.shopId = obj.shopId._id.toString();
  } else if (obj.shopId) {
    obj.shopId = obj.shopId.toString();
  }

  if (obj.riderId) {
    if (obj.riderId._id) {
      obj.rider = {
        id: obj.riderId._id.toString(),
        name: obj.riderId.name,
        phone: obj.riderId.phone,
      };
      obj.riderId = obj.riderId._id.toString();
    } else {
      obj.riderId = obj.riderId.toString();
    }
  }

  obj.createdAt = obj.createdAt ? obj.createdAt.toISOString() : new Date().toISOString();
  obj.updatedAt = obj.updatedAt ? obj.updatedAt.toISOString() : new Date().toISOString();
  return obj;
};

// @route   GET /api/orders
// @desc    Get orders (filtered by role)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'customer') {
      orders = await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 }).populate('riderId', 'name phone');
    } else if (req.user.role === 'shop') {
      // Get all shops owned by this user first (simplified: query by ownerId in Shop)
      const Shop = require('../models/Shop');
      const shops = await Shop.find({ ownerId: req.user._id });
      const shopIds = shops.map((s) => s._id);
      orders = await Order.find({ shopId: { $in: shopIds } }).sort({ createdAt: -1 }).populate('riderId', 'name phone');
    } else if (req.user.role === 'rider') {
      orders = await Order.find({ riderId: req.user._id }).sort({ createdAt: -1 }).populate('riderId', 'name phone');
    } else if (req.user.role === 'admin') {
      orders = await Order.find().sort({ createdAt: -1 }).populate('riderId', 'name phone');
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    res.json(orders.map(transformOrder));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/orders/available
// @desc    Get available deliveries for riders
// @access  Private (rider)
router.get('/available', protect, authorizeRoles('rider'), async (req, res) => {
  try {
    const orders = await Order.find({
      orderStatus: { $in: ['placed', 'accepted', 'preparing', 'ready'] },
      riderId: null
    });
    res.json(orders.map(transformOrder));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name phone')
      .populate('shopId', 'shopName location')
      .populate('riderId', 'name phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(transformOrder(order));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/orders
// @desc    Place a new order
// @access  Private (customer)
router.post('/', protect, authorizeRoles('customer'), async (req, res) => {
  try {
    const order = await Order.create({
      ...req.body,
      customerId: req.user._id,
      paymentStatus: 'paid',
      orderStatus: 'placed',
    });

    // Send WhatsApp notification
    try {
      if (req.user.phone) {
        await sendWhatsAppNotification(req.user.phone, 'placed', order._id);
      }
    } catch (err) {
      console.error('WhatsApp notify error:', err);
    }

    res.status(201).json(transformOrder(order));
  } catch (error) {
    const fs = require('fs');
    const logMsg = `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\nBody: ${JSON.stringify(req.body)}\nUser: ${JSON.stringify(req.user)}\n\n`;
    fs.appendFileSync('order-error.log', logMsg);
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (shop or rider)
router.put('/:id/status', protect, authorizeRoles('shop', 'rider', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: status, updatedAt: new Date() },
      { new: true }
    ).populate('customerId', 'name phone')
      .populate('shopId', 'shopName location')
      .populate('riderId', 'name phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Send WhatsApp notification
    if (order.customerId && order.customerId.phone) {
      try {
        await sendWhatsAppNotification(order.customerId.phone, status, order._id);
      } catch (err) {
        console.error('WhatsApp notify error:', err);
      }
    }

    res.json(transformOrder(order));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/orders/:id/assign-rider
// @desc    Assign rider to order
// @access  Private (rider)
router.put('/:id/assign-rider', protect, authorizeRoles('rider'), async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { riderId: req.user._id, orderStatus: 'out_for_delivery' },
      { new: true }
    ).populate('customerId', 'name phone')
      .populate('shopId', 'shopName location')
      .populate('riderId', 'name phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Send WhatsApp notification
    if (order.customerId && order.customerId.phone) {
      try {
        await sendWhatsAppNotification(order.customerId.phone, 'out_for_delivery', order._id);
      } catch (err) {
        console.error('WhatsApp notify error:', err);
      }
    }

    res.json(transformOrder(order));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

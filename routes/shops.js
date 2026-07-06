const express = require('express');
const Shop = require('../models/Shop');
const { protect, authorizeRoles } = require('../middleware/auth');
const User = require('../models/User');
const upload = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/shops
// @desc    Get all shops
// @access  Public
router.get('/', async (req, res) => {
  try {
    const shops = await Shop.find().populate('ownerId', 'name email');
    // Transform _id to id for frontend compatibility
    const transformed = shops.map((s) => {
      const obj = s.toObject();
      obj.id = obj._id.toString();
      return obj;
    });
    res.json(transformed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/shops/:id
// @desc    Get a single shop
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('ownerId', 'name email');
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    const obj = shop.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/shops
// @desc    Create a shop
// @access  Private (shop owner)
router.post('/', protect, authorizeRoles('shop', 'admin'), async (req, res) => {
  try {
    const shop = await Shop.create({ ...req.body, ownerId: req.user._id });
    const obj = shop.toObject();
    obj.id = obj._id.toString();
    res.status(201).json(obj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/shops/create-with-owner
// @desc    Create a shop and an owner simultaneously (admin only)
// @access  Private (admin)
router.post('/create-with-owner', protect, authorizeRoles('admin'), upload.single('image'), async (req, res) => {
  try {
    const { ownerName, ownerEmail, ownerPassword, shopName, description, address, deliveryTime } = req.body;
    
    // 1. Check if user already exists
    let user = await User.findOne({ email: ownerEmail });
    if (user) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // 2. Create the user
    user = await User.create({
      name: ownerName,
      email: ownerEmail,
      password: ownerPassword,
      role: 'shop',
    });

    // 3. Create the shop
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '';
    
    const shop = await Shop.create({
      shopName,
      description,
      ownerId: user._id,
      image: imagePath,
      location: { lat: 0, lng: 0, address: address || '' }, // default lat/lng
      deliveryTime: deliveryTime || '30-45 min',
      status: 'open',
      rating: 0,
      tags: [],
    });

    const obj = shop.toObject();
    obj.id = obj._id.toString();
    res.status(201).json(obj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/shops/:id
// @desc    Update a shop
// @access  Private (shop owner or admin)
router.put('/:id', protect, authorizeRoles('shop', 'admin'), async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    const obj = shop.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/shops/:id
// @desc    Delete a shop
// @access  Private (admin)
router.delete('/:id', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    await Shop.findByIdAndDelete(req.params.id);
    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

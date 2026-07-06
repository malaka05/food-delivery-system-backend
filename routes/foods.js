const express = require('express');
const Food = require('../models/Food');
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/foods?shopId=xxx
// @desc    Get foods by shop
// @access  Public
router.get('/', async (req, res) => {
  try {
    const filter = req.query.shopId ? { shopId: req.query.shopId } : {};
    const foods = await Food.find(filter);
    const transformed = foods.map((f) => {
      const obj = f.toObject();
      obj.id = obj._id.toString();
      obj.shopId = obj.shopId.toString();
      return obj;
    });
    res.json(transformed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/foods/:id
// @desc    Get single food item
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food item not found' });
    const obj = food.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/foods
// @desc    Create a food item
// @access  Private (shop owner)
router.post('/', protect, authorizeRoles('shop', 'admin'), upload.single('image'), async (req, res) => {
  try {
    const foodData = { ...req.body };
    if (req.file) {
      foodData.image = `/uploads/${req.file.filename}`;
    }
    const food = await Food.create(foodData);
    const obj = food.toObject();
    obj.id = obj._id.toString();
    res.status(201).json(obj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/foods/:id
// @desc    Update a food item
// @access  Private (shop owner)
router.put('/:id', protect, authorizeRoles('shop', 'admin'), upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }
    const food = await Food.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!food) return res.status(404).json({ message: 'Food item not found' });
    const obj = food.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/foods/:id
// @desc    Delete a food item
// @access  Private (shop owner or admin)
router.delete('/:id', protect, authorizeRoles('shop', 'admin'), async (req, res) => {
  try {
    await Food.findByIdAndDelete(req.params.id);
    res.json({ message: 'Food item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

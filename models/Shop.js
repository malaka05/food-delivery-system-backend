const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shopName: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    location: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
      address: { type: String, default: '' },
    },
    image: { type: String, default: '' },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    deliveryTime: { type: String, default: '30-45 min' },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shop', shopSchema);

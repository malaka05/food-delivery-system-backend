/**
 * Seed Script — Populates MongoDB Atlas with demo data
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Shop = require('./models/Shop');
const Food = require('./models/Food');
const Order = require('./models/Order');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Clear existing data
    await User.deleteMany({});
    await Shop.deleteMany({});
    await Food.deleteMany({});
    await Order.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create Users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('12345678', salt);

    const users = await User.insertMany([
      {
        name: 'Alex Customer',
        email: 'alex@example.com',
        password: hashedPassword,
        role: 'customer',
        phone: '+1234567890',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      },
      {
        name: 'Mahi',
        email: 'vjdmahi@gmail.com',
        password: hashedPassword,
        role: 'customer',
        phone: '0768054356',
      },
      {
        name: 'AFC Owner',
        email: 'afc@shop.com',
        password: hashedPassword,
        role: 'shop',
        phone: '+1987654321',
      },
      {
        name: 'Mr.Chai Owner',
        email: 'chai@shop.com',
        password: hashedPassword,
        role: 'shop',
        phone: '+1987654322',
      },
      {
        name: 'Food Champ Owner',
        email: 'foodchamp@shop.com',
        password: hashedPassword,
        role: 'shop',
        phone: '+1987654323',
      },
      {
        name: 'Sam Rider',
        email: 'sam@rider.com',
        password: hashedPassword,
        role: 'rider',
        phone: '+1122334455',
        avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80',
      },
      {
        name: 'Admin User',
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: 'admin',
        phone: '+1000000000',
      },
    ]);
    console.log('👤 Created users');

    const [customer, mahiCustomer, afcOwner, chaiOwner, foodChampOwner, rider, admin] = users;

    // Create Shops
    const shops = await Shop.insertMany([
      {
        ownerId: afcOwner._id,
        shopName: 'AFC',
        description: 'Authentic Fried Chicken, chicken burgers, and crispy drumsticks.',
        location: { lat: 6.9275, lng: 79.8615, address: '123 Galle Road, Colombo' },
        image: '/uploads/afc.jpg',
        status: 'open',
        rating: 4.7,
        deliveryTime: '15-30 min',
        tags: ['Chicken', 'Burgers', 'Fast Food'],
      },
      {
        ownerId: chaiOwner._id,
        shopName: 'Mr.Chai',
        description: 'Traditional hot brewed kadak chai, snacks, and rolls.',
        location: { lat: 6.9285, lng: 79.8625, address: '456 Tea Avenue, Colombo' },
        image: '/uploads/chai.jpg',
        status: 'open',
        rating: 4.9,
        deliveryTime: '10-25 min',
        tags: ['Chai', 'Tea', 'Snacks', 'Cafe'],
      },
      {
        ownerId: foodChampOwner._id,
        shopName: 'Food Champ',
        description: 'Gourmet meal combos, local specials, and thick shakes.',
        location: { lat: 6.9265, lng: 79.8605, address: '789 Food Court, Colombo' },
        image: '/uploads/food_champ.jpg',
        status: 'open',
        rating: 4.8,
        deliveryTime: '20-35 min',
        tags: ['Local', 'Combos', 'Shakes'],
      },
    ]);
    console.log('🏪 Created shops');

    const [afcShop, mrChaiShop, foodChampShop] = shops;

    // Create Foods
    const foods = await Food.insertMany([
      {
        shopId: afcShop._id,
        name: 'Crispy Fried Chicken',
        description: '4 pieces of fresh, succulent, crispy golden fried chicken.',
        price: 9.99,
        category: 'Chicken',
        image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=500&q=80',
        availability: true,
      },
      {
        shopId: afcShop._id,
        name: 'AFC Special Chicken Burger',
        description: 'Fried chicken breast fillet, lettuce, signature mayo in a toasted bun.',
        price: 6.99,
        category: 'Burgers',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80',
        availability: true,
      },
      {
        shopId: mrChaiShop._id,
        name: 'Masala Kadak Chai',
        description: 'Freshly brewed milk tea with cardamom, ginger, and aromatic spices.',
        price: 1.99,
        category: 'Tea',
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=500&q=80',
        availability: true,
      },
      {
        shopId: foodChampShop._id,
        name: 'Signature Milkshake',
        description: 'Premium creamy double-thick vanilla and chocolate milkshake.',
        price: 3.50,
        category: 'Drinks',
        image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=500&q=80',
        availability: true,
      },
      {
        shopId: foodChampShop._id,
        name: 'Champ Special Rice Basket',
        description: 'Flavored rice with cooked meat and local herbs.',
        price: 8.99,
        category: 'Local',
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80',
        availability: true,
      },
    ]);
    console.log('🍔 Created foods');

    const [chicken, burger, chai, shake, rice] = foods;

    // Create Orders
    await Order.insertMany([
      {
        customerId: customer._id,
        shopId: afcShop._id,
        riderId: rider._id,
        items: [
          { foodId: chicken._id, name: chicken.name, price: chicken.price, quantity: 2, image: chicken.image },
          { foodId: burger._id, name: burger.name, price: burger.price, quantity: 1, image: burger.image },
        ],
        totalAmount: 26.97,
        paymentStatus: 'paid',
        orderStatus: 'preparing',
        customerLocation: { lat: 6.9272, lng: 79.8620, address: '100 Main St, Apt 4B' },
      },
      {
        customerId: customer._id,
        shopId: mrChaiShop._id,
        items: [
          { foodId: chai._id, name: chai.name, price: chai.price, quantity: 2, image: chai.image },
        ],
        totalAmount: 3.98,
        paymentStatus: 'paid',
        orderStatus: 'delivered',
        customerLocation: { lat: 6.9272, lng: 79.8620, address: '100 Main St, Apt 4B' },
      },
    ]);
    console.log('📦 Created orders');

    console.log('\n🎉 Seed completed successfully!');
    console.log('Demo accounts (all use password: 12345678):');
    console.log('  Customer:   alex@example.com (or vjdmahi@gmail.com)');
    console.log('  Shop AFC:   afc@shop.com');
    console.log('  Shop Chai:  chai@shop.com');
    console.log('  Shop Champ: foodchamp@shop.com');
    console.log('  Rider:      sam@rider.com');
    console.log('  Admin:      admin@gmail.com');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDB();

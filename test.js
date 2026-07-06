require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected');
    
    // cleanup
    await User.deleteOne({ email: 'test_next@example.com' });
    
    const user = await User.create({
      name: 'Test Next',
      email: 'test_next@example.com',
      password: 'password123',
      role: 'customer'
    });
    console.log('User created:', user);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

test();

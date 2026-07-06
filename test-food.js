require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Shop = require('./models/Shop');
const jwt = require('jsonwebtoken');
const fs = require('fs');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({role: 'shop'});
  if(!user) return console.log('no shop user');
  
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const shop = await Shop.findOne({ownerId: user._id});
  if(!shop) return console.log('no shop');
  
  fs.writeFileSync('test.jpg', 'fake image data');
  const form = new FormData();
  form.append('name', 'Test');
  form.append('price', '10');
  form.append('category', 'Cat');
  form.append('shopId', shop._id.toString());
  form.append('image', new Blob([fs.readFileSync('test.jpg')], { type: 'image/jpeg' }), 'test.jpg');
  
  const r = await fetch('http://localhost:5000/api/foods', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: form
  });
  console.log(r.status, await r.text());
  process.exit();
}
run();

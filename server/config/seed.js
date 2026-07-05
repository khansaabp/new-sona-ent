require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const products = [
  {
    name: 'Galaxy Pulse X12 5G Smartphone',
    sku: 'PHN-GP-X12',
    description: '6.7" AMOLED display, 5G, 256GB storage, triple camera system.',
    category: 'Smartphones',
    brand: 'Galaxy',
    price: 42999,
    mrp: 49999,
    taxRate: 18,
    stock: 25,
    lowStockThreshold: 5,
    images: [],
    specifications: { Display: '6.7" AMOLED 120Hz', RAM: '8GB', Storage: '256GB', Battery: '5000mAh' },
    warranty: '1 Year'
  },
  {
    name: 'AeroBook Slim 14 Laptop',
    sku: 'LAP-AB-S14',
    description: 'Ultra-thin laptop with 14" FHD display, 16GB RAM, 512GB SSD.',
    category: 'Laptops',
    brand: 'AeroBook',
    price: 64999,
    mrp: 74999,
    taxRate: 18,
    stock: 15,
    lowStockThreshold: 3,
    images: [],
    specifications: { CPU: 'Intel Core i5 12th Gen', RAM: '16GB', Storage: '512GB SSD', Display: '14" FHD IPS' },
    warranty: '2 Years'
  },
  {
    name: 'SoundWave Pro Wireless Earbuds',
    sku: 'AUD-SW-PRO',
    description: 'Active noise cancellation, 30hr battery life, touch controls.',
    category: 'Audio',
    brand: 'SoundWave',
    price: 3499,
    mrp: 4999,
    taxRate: 18,
    stock: 60,
    lowStockThreshold: 10,
    images: [],
    specifications: { Battery: '30 hours', ANC: 'Yes', Bluetooth: '5.3' },
    warranty: '1 Year'
  },
  {
    name: 'TabMax 11 Pro Tablet',
    sku: 'TAB-TM-11P',
    description: '11" 2K display tablet with stylus support, 128GB.',
    category: 'Tablets',
    brand: 'TabMax',
    price: 28999,
    mrp: 32999,
    taxRate: 18,
    stock: 18,
    lowStockThreshold: 4,
    images: [],
    specifications: { Display: '11" 2K', Storage: '128GB', Stylus: 'Included' },
    warranty: '1 Year'
  },
  {
    name: 'FitTrack Active Smartwatch',
    sku: 'WCH-FT-ACT',
    description: 'AMOLED smartwatch with heart rate, SpO2, and GPS tracking.',
    category: 'Wearables',
    brand: 'FitTrack',
    price: 4999,
    mrp: 6999,
    taxRate: 18,
    stock: 40,
    lowStockThreshold: 8,
    images: [],
    specifications: { Display: '1.4" AMOLED', Battery: '7 days', GPS: 'Yes' },
    warranty: '1 Year'
  },
  {
    name: 'VividView 55" 4K Smart TV',
    sku: 'TV-VV-55K',
    description: '55-inch 4K UHD Smart TV with HDR10 and built-in streaming apps.',
    category: 'TVs & Displays',
    brand: 'VividView',
    price: 38999,
    mrp: 45999,
    taxRate: 18,
    stock: 10,
    lowStockThreshold: 2,
    images: [],
    specifications: { Resolution: '4K UHD', Size: '55"', HDR: 'HDR10+', SmartOS: 'Android TV' },
    warranty: '2 Years'
  },
  {
    name: 'CaptureX Mirrorless Camera',
    sku: 'CAM-CX-MIR',
    description: '24MP mirrorless camera with 4K video and interchangeable lens mount.',
    category: 'Cameras',
    brand: 'CaptureX',
    price: 54999,
    mrp: 62999,
    taxRate: 18,
    stock: 8,
    lowStockThreshold: 2,
    images: [],
    specifications: { Sensor: '24MP APS-C', Video: '4K 30fps', Mount: 'CX-Mount' },
    warranty: '1 Year'
  },
  {
    name: 'GameStation Pulse Controller',
    sku: 'GAM-GS-CTRL',
    description: 'Wireless gaming controller with haptic feedback and adaptive triggers.',
    category: 'Gaming',
    brand: 'GameStation',
    price: 5499,
    mrp: 6499,
    taxRate: 18,
    stock: 35,
    lowStockThreshold: 6,
    images: [],
    specifications: { Connectivity: 'Bluetooth + USB-C', Battery: '20 hours' },
    warranty: '6 Months'
  },
  {
    name: 'PowerCore 20000mAh Fast Charger',
    sku: 'ACC-PC-20K',
    description: '20000mAh power bank with 65W fast charging, dual USB-C ports.',
    category: 'Accessories',
    brand: 'PowerCore',
    price: 1999,
    mrp: 2999,
    taxRate: 18,
    stock: 80,
    lowStockThreshold: 15,
    images: [],
    specifications: { Capacity: '20000mAh', Output: '65W PD' },
    warranty: '1 Year'
  },
  {
    name: 'ChillMax Inverter Refrigerator 260L',
    sku: 'APP-CM-260',
    description: '260L double door inverter refrigerator with frost-free technology.',
    category: 'Home Appliances',
    brand: 'ChillMax',
    price: 27999,
    mrp: 32999,
    taxRate: 18,
    stock: 12,
    lowStockThreshold: 3,
    images: [],
    specifications: { Capacity: '260L', Type: 'Double Door', Compressor: 'Inverter' },
    warranty: '10 Years on Compressor'
  },
  {
    name: 'EchoBeam Bluetooth Speaker',
    sku: 'AUD-EB-SPK',
    description: 'Portable Bluetooth speaker with 360-degree sound and IPX7 rating.',
    category: 'Audio',
    brand: 'EchoBeam',
    price: 2799,
    mrp: 3999,
    taxRate: 18,
    stock: 4,
    lowStockThreshold: 5,
    images: [],
    specifications: { Battery: '12 hours', Waterproof: 'IPX7' },
    warranty: '1 Year'
  },
  {
    name: 'NovaBook Air 13 Laptop',
    sku: 'LAP-NB-A13',
    description: 'Lightweight 13" laptop with M-series chip, 8GB RAM, 256GB SSD.',
    category: 'Laptops',
    brand: 'NovaBook',
    price: 79999,
    mrp: 89999,
    taxRate: 18,
    stock: 2,
    lowStockThreshold: 3,
    images: [],
    specifications: { CPU: 'Nova M2 Chip', RAM: '8GB', Storage: '256GB SSD' },
    warranty: '1 Year'
  }
];

const seed = async () => {
  await connectDB();

  await Promise.all([User.deleteMany(), Product.deleteMany(), Order.deleteMany()]);

  const admin = await User.create({
    name: 'Shop Admin',
    email: 'admin@electroshop.com',
    password: 'admin123',
    phone: '9999900000',
    role: 'admin'
  });

  const staff = await User.create({
    name: 'Counter Staff',
    email: 'staff@electroshop.com',
    password: 'staff123',
    phone: '9999911111',
    role: 'staff'
  });

  const customer = await User.create({
    name: 'Rohan Sharma',
    email: 'customer@example.com',
    password: 'customer123',
    phone: '9999922222',
    role: 'customer',
    address: { street: '12 MG Road', city: 'Nanded', state: 'Maharashtra', pincode: '431601', country: 'India' }
  });

  await Product.insertMany(products);

  console.log('--- Seed completed ---');
  console.log('Admin login:    admin@electroshop.com / admin123');
  console.log('Staff login:    staff@electroshop.com / staff123');
  console.log('Customer login: customer@example.com / customer123');
  console.log(`${products.length} products inserted.`);

  mongoose.connection.close();
};

seed().catch(err => {
  console.error(err);
  mongoose.connection.close();
});

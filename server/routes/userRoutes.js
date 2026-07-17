const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc Get all users (admin)
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});
// @desc Get all customers with order stats (admin)
// @route GET /api/users/customers

// @desc Admin manually creates a customer
// @route POST /api/users/customers
router.post('/customers', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, email, phone, password, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // If admin doesn't set a password, generate a random one
    const finalPassword = password && password.length >= 6
      ? password
      : Math.random().toString(36).slice(-8);

    const customer = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      address,
      password: finalPassword,
      role: 'customer'
    });

    res.status(201).json({
      customer: customer.toSafeObject(),
      temporaryPassword: password ? undefined : finalPassword
    });
  } catch (err) {
    next(err);
  }
});

router.get('/customers', protect, authorize('admin'), async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const { keyword } = req.query;

    const userQuery = { role: 'customer' };
    if (keyword) {
      userQuery.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword, $options: 'i' } }
      ];
    }

    const customers = await User.find(userQuery).select('-password').sort({ createdAt: -1 });

    // Get order stats for each customer in one aggregation
    const stats = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$customer',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$grandTotal' },
          creditOutstanding: {
            $sum: {
              $cond: [
                { $in: ['$payment.status', ['unpaid', 'partial', 'overdue']] },
                '$payment.amountDue',
                0
              ]
            }
          },
          lastOrderDate: { $max: '$createdAt' }
        }
      }
    ]);

    const statsMap = {};
    stats.forEach(s => {
      statsMap[s._id.toString()] = s;
    });

    const enriched = customers.map(c => {
      const s = statsMap[c._id.toString()];
      return {
        ...c.toObject(),
        totalOrders: s?.totalOrders || 0,
        totalSpent: s?.totalSpent || 0,
        creditOutstanding: s?.creditOutstanding || 0,
        lastOrderDate: s?.lastOrderDate || null
      };
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

// @desc Get single customer with full order history (admin)
// @route GET /api/users/customers/:id
router.get('/customers/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const Order = require('../models/Order');

    const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).select('-password');
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const orders = await Order.find({ customer: req.params.id }).sort({ createdAt: -1 });

    const totalSpent = orders
      .filter(o => o.orderStatus !== 'cancelled')
      .reduce((sum, o) => sum + o.grandTotal, 0);

    const creditOutstanding = orders
      .filter(o => ['unpaid', 'partial', 'overdue'].includes(o.payment.status))
      .reduce((sum, o) => sum + o.payment.amountDue, 0);

    res.json({
      customer,
      orders,
      stats: {
        totalOrders: orders.length,
        totalSpent,
        creditOutstanding
      }
    });
  } catch (err) {
    next(err);
  }
});
// @desc Update user role/status (admin)
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { role, isActive } = req.body;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    const updated = await user.save();
    res.json(updated.toSafeObject());
  } catch (err) {
    next(err);
  }
});

// @desc Update admin notes for a customer (admin only)
// @route PUT /api/users/customers/:id/notes
router.put('/customers/:id/notes', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { adminNotes } = req.body;

    const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.adminNotes = adminNotes || '';
    await customer.save();

    res.json({ message: 'Notes updated', adminNotes: customer.adminNotes });
  } catch (err) {
    next(err);
  }
});
module.exports = router;

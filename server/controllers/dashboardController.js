const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get dashboard summary stats
// @route   GET /api/dashboard/summary
// @access  Private/Admin/Staff
const getSummary = async (req, res, next) => {
  try {
    const [totalOrders, totalProducts, totalCustomers, revenueAgg, creditAgg, lowStockCount] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'customer' }),
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]),
      Order.aggregate([
        { $match: { 'payment.method': 'credit', 'payment.status': { $in: ['unpaid', 'partial', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: '$payment.amountDue' }, count: { $sum: 1 } } }
      ]),
      Product.countDocuments({ isActive: true, $expr: { $lte: ['$stock', '$lowStockThreshold'] } })
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const creditOutstanding = creditAgg[0]?.total || 0;
    const creditInvoiceCount = creditAgg[0]?.count || 0;

    // Today's stats
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todayOrders, todayRevenueAgg, paymentBreakdown] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfDay }, orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]),
      Order.aggregate([
  { $match: { orderStatus: { $ne: 'cancelled' } } },
  {
    $group: {
      _id: {
        $cond: [
          { $and: [{ $eq: ['$payment.method', 'cash'] }, { $eq: ['$orderType', 'online'] }] },
          'cod',
          '$payment.method'
        ]
      },
      total: { $sum: '$grandTotal' },
      count: { $sum: 1 }
    }
  }
])
    ]);

    res.json({
      totalOrders,
      totalProducts,
      totalCustomers,
      totalRevenue,
      todayOrders,
      todayRevenue: todayRevenueAgg[0]?.total || 0,
      creditOutstanding,
      creditInvoiceCount,
      lowStockCount,
      paymentBreakdown
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get sales trend (last N days)
// @route   GET /api/dashboard/sales-trend?days=14
// @access  Private/Admin/Staff
const getSalesTrend = async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 14;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const trend = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, orderStatus: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$grandTotal' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill missing dates with zero
    const map = {};
    trend.forEach(t => (map[t._id] = t));
    const result = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      result.push({
        date: key,
        revenue: map[key]?.revenue || 0,
        orders: map[key]?.orders || 0
      });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// @desc    Get top selling products
// @route   GET /api/dashboard/top-products?limit=5
// @access  Private/Admin/Staff
const getTopProducts = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 5;

    const top = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          sku: { $first: '$items.sku' },
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' }
        }
      },
      { $sort: { unitsSold: -1 } },
      { $limit: limit }
    ]);

    res.json(top);
  } catch (err) {
    next(err);
  }
};

// @desc    Get sales breakdown by category
// @route   GET /api/dashboard/category-breakdown
// @access  Private/Admin/Staff
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const breakdown = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$productInfo.category', 'Unknown'] },
          revenue: { $sum: '$items.lineTotal' },
          unitsSold: { $sum: '$items.quantity' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json(breakdown);
  } catch (err) {
    next(err);
  }
};

// @desc    Get recent orders (for activity feed)
// @route   GET /api/dashboard/recent-orders?limit=10
// @access  Private/Admin/Staff
const getRecentOrders = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('invoiceNumber customerName grandTotal payment.method payment.status orderStatus createdAt');
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSummary,
  getSalesTrend,
  getTopProducts,
  getCategoryBreakdown,
  getRecentOrders
};

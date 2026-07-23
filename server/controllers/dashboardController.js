const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get dashboard summary stats
// @route   GET /api/dashboard/summary
// @access  Private/Admin/Staff
const getSummary = async (req, res, next) => {
  try {
    const [totalOrders, totalProducts, totalCustomers, revenueAgg, creditAgg, lowStockCount] = await Promise.all([
    Order.countDocuments({ isDeleted: { $ne: true } }),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'customer' }),
      Order.aggregate([
       { $match: { orderStatus: { $ne: 'cancelled' }, isDeleted: { $ne: true } } },
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
   Order.countDocuments({ createdAt: { $gte: startOfDay }, isDeleted: { $ne: true } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfDay }, orderStatus: { $ne: 'cancelled' },isDeleted: { $ne: true }  } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]),
      Order.aggregate([
  { $match: { orderStatus: { $ne: 'cancelled' }, isDeleted: { $ne: true } } },
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
      { $match: { createdAt: { $gte: startDate }, orderStatus: { $ne: 'cancelled' }, isDeleted: { $ne: true }  } },
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
      { $match: { orderStatus: { $ne: 'cancelled' }, isDeleted: { $ne: true } } },
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
      { $match: { orderStatus: { $ne: 'cancelled' }, isDeleted: { $ne: true } } },
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
   const orders = await Order.find({ isDeleted: { $ne: true } })
  .sort({ createdAt: -1 })
      .limit(limit)
      .select('invoiceNumber customerName grandTotal payment.method payment.status orderStatus createdAt');
    res.json(orders);
  } catch (err) {
    next(err);
  }
};
// @desc    Analyze customer notes for product mentions + geographic distribution
// @route   GET /api/dashboard/customer-insights
// @access  Private/Admin
const getCustomerInsights = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const Product = require('../models/Product');

    // ---- 1. Geographic distribution (from structured address data) ----
    const geoAgg = await User.aggregate([
      { $match: { role: 'customer', 'address.city': { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: { $trim: { input: { $toLower: '$address.city' } } },
          count: { $sum: 1 },
          displayName: { $first: '$address.city' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const cityDistribution = geoAgg.map(g => ({
      city: g.displayName,
      count: g.count
    }));

    const stateAgg = await User.aggregate([
      { $match: { role: 'customer', 'address.state': { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: { $trim: { input: { $toLower: '$address.state' } } },
          count: { $sum: 1 },
          displayName: { $first: '$address.state' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const stateDistribution = stateAgg.map(g => ({
      state: g.displayName,
      count: g.count
    }));

    // ---- 2. Product mention analysis from admin notes ----
    const customersWithNotes = await User.find({
      role: 'customer',
      adminNotes: { $exists: true, $ne: '' }
    }).select('name adminNotes');

    const allProducts = await Product.find({ isActive: true }).select('name brand category');

    // Count mentions: check each product name/brand against each note (case-insensitive substring match)
    const mentionCounts = {};
    const mentionedByCustomers = {}; // productName -> [customerNames]

    customersWithNotes.forEach(customer => {
      const noteLower = customer.adminNotes.toLowerCase();

      allProducts.forEach(product => {
        const nameLower = product.name.toLowerCase();
        const brandLower = product.brand.toLowerCase();

        // Match on full product name, or brand name mentioned alongside category context
        const nameMatch = noteLower.includes(nameLower);
        const brandMatch = noteLower.includes(brandLower) && brandLower.length > 3; // avoid short-brand false positives

        if (nameMatch || brandMatch) {
          const key = product.name;
          mentionCounts[key] = (mentionCounts[key] || 0) + 1;
          if (!mentionedByCustomers[key]) mentionedByCustomers[key] = [];
          if (!mentionedByCustomers[key].includes(customer.name)) {
            mentionedByCustomers[key].push(customer.name);
          }
        }
      });
    });

    const productMentions = Object.entries(mentionCounts)
      .map(([name, count]) => ({
        name,
        count,
        customers: mentionedByCustomers[name]
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ---- 3. Simple keyword frequency from notes (common recurring words, excluding stopwords) ----
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'of', 'in',
      'on', 'at', 'for', 'with', 'this', 'that', 'always', 'never', 'very', 'has', 'have',
      'customer', 'he', 'she', 'they', 'it', 'his', 'her', 'their', 'been', 'be', 'will',
      'would', 'can', 'could', 'not', 'no', 'yes', 'also', 'just', 'about', 'from'
    ]);

    const wordFreq = {};
    customersWithNotes.forEach(customer => {
      const words = customer.adminNotes
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopwords.has(w));

      words.forEach(w => {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      });
    });

    const topKeywords = Object.entries(wordFreq)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    res.json({
      cityDistribution,
      stateDistribution,
      productMentions,
      topKeywords,
      totalCustomersWithNotes: customersWithNotes.length,
      totalCustomersWithAddress: geoAgg.reduce((sum, g) => sum + g.count, 0)
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSummary,
  getSalesTrend,
  getTopProducts,
  getCategoryBreakdown,
  getRecentOrders,
  getCustomerInsights
};
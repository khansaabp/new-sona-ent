const express = require('express');
const {
  getSummary,
  getSalesTrend,
  getTopProducts,
  getCategoryBreakdown,
  getRecentOrders,
  getCustomerInsights
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin', 'staff'));

router.get('/summary', getSummary);
router.get('/sales-trend', getSalesTrend);
router.get('/top-products', getTopProducts);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/recent-orders', getRecentOrders);
router.get('/customer-insights', authorize('admin'), getCustomerInsights);
module.exports = router;

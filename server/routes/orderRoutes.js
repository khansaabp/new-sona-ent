const express = require('express');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  recordPayment,
  getCreditOutstanding,
  updateInvoiceNumber
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/', protect, getOrders);
router.get('/meta/credit-outstanding', protect, authorize('admin', 'staff'), getCreditOutstanding);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, authorize('admin', 'staff'), updateOrderStatus);
router.put('/:id/pay', protect, authorize('admin', 'staff'), recordPayment);
router.put('/:id/invoice-number', protect, authorize('admin'), updateInvoiceNumber);

module.exports = router;

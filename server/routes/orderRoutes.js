const express = require('express');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  recordPayment,
  getCreditOutstanding,
  updateInvoiceNumber,
  searchCustomers,
  deleteOrder,
  getDeletedOrders,
  restoreOrder,
  permanentlyDeleteOrder
} = require('../controllers/orderController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/', protect, getOrders);
router.get('/meta/credit-outstanding', protect, authorize('admin', 'staff'), getCreditOutstanding);
router.get('/meta/search-customers', protect, authorize('admin', 'staff'), searchCustomers);
router.get('/meta/search-customers', protect, authorize('admin', 'staff'), searchCustomers);
router.get('/meta/deleted', protect, authorize('admin'), getDeletedOrders);
router.delete('/:id', protect, authorize('admin'), deleteOrder);
router.put('/:id/restore', protect, authorize('admin'), restoreOrder);
router.delete('/:id/permanent', protect, authorize('admin'), permanentlyDeleteOrder);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, authorize('admin', 'staff'), updateOrderStatus);
router.put('/:id/pay', protect, authorize('admin', 'staff'), recordPayment);
router.put('/:id/invoice-number', protect, authorize('admin'), updateInvoiceNumber);

module.exports = router;

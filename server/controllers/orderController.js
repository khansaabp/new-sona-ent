const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// Generates a sequential-ish invoice number: INV-YYYYMMDD-XXXX
const generateInvoiceNumber = async () => {
  const today = new Date();
  const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(
    today.getDate()
  ).padStart(2, '0')}`;
  const countToday = await Order.countDocuments({
    invoiceNumber: { $regex: `^INV-${datePart}` }
  });
  const seq = String(countToday + 1).padStart(4, '0');
  return `INV-${datePart}-${seq}`;
};

// @desc    Create new order / generate bill (cash or credit)
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const {
      items, // [{ product: id, quantity }]
      payment, // { method: 'cash' | 'credit' | 'card' | 'upi' | 'netbanking', creditTermsDays, amountPaid, transactionRef }
      discount = 0,
      shippingFee = 0,
      billingType = 'retail',
      orderType = 'pos',
      shippingAddress,
      notes,
      customerName,
      customerPhone
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items provided' });
    }
    if (!payment || !payment.method) {
      return res.status(400).json({ message: 'Payment method is required' });
    }

    let subtotal = 0;
    let taxAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      const lineTotal = product.price * item.quantity;
const lineTax = 0; // GST already included in price

subtotal += lineTotal;
taxAmount += lineTax;

      orderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        image: product.images?.[0] || '',
        quantity: item.quantity,
        price: product.price,
        taxRate: product.taxRate,
        lineTotal
      });

      // Decrement stock
      product.stock -= item.quantity;
      await product.save();
    }

    const grandTotal = Math.round((subtotal - discount + shippingFee) * 100) / 100;

    const paymentData = {
      method: payment.method,
      amountPaid: payment.method === 'credit' ? Number(payment.amountPaid || 0) : grandTotal,
      transactionRef: payment.transactionRef || ''
    };

    if (payment.method === 'credit') {
      const termsDays = Number(payment.creditTermsDays || 30);
      paymentData.creditTermsDays = termsDays;
      const due = new Date();
      due.setDate(due.getDate() + termsDays);
      paymentData.dueDate = due;
    }

    const invoiceNumber = await generateInvoiceNumber();

    const order = await Order.create({
      invoiceNumber,
      customer: req.user._id,
      customerName: customerName || req.user.name,
      customerPhone: customerPhone || req.user.phone,
      items: orderItems,
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      discount,
      shippingFee,
      grandTotal,
      payment: paymentData,
      billingType,
      orderType,
      shippingAddress,
      notes
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

// @desc    Get all orders (admin) or own orders (customer)
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res, next) => {
  try {
 const { status, paymentStatus, paymentMethod, invoiceSearch, page = 1, limit = 10 } = req.query;

const query = {};
if (req.user.role === 'customer') {
  query.customer = req.user._id;
}
if (status) query.orderStatus = status;
if (invoiceSearch) {
  query.invoiceNumber = { $regex: invoiceSearch, $options: 'i' };
}
    if (paymentStatus) query['payment.status'] = paymentStatus;
    if (paymentMethod) query['payment.method'] = paymentMethod;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('customer', 'name email'),
      Order.countDocuments(query)
    ]);

    res.json({ orders, page: Number(page), pages: Math.ceil(total / Number(limit)), total });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single order / invoice
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name email phone address');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.role === 'customer' && order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
};

// @desc    Update order status (shipped/delivered/etc)
// @route   PUT /api/orders/:id/status
// @access  Private/Staff/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.orderStatus = orderStatus;
    await order.save();
    res.json(order);
  } catch (err) {
    next(err);
  }
};

// @desc    Record a payment against a credit invoice
// @route   PUT /api/orders/:id/pay
// @access  Private/Staff/Admin
const recordPayment = async (req, res, next) => {
  try {
    const { amount, transactionRef } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.payment.method !== 'credit') {
      return res.status(400).json({ message: 'Payments can only be recorded against credit invoices' });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than zero' });
    }

    order.payment.amountPaid += Number(amount);
    if (transactionRef) order.payment.transactionRef = transactionRef;

    await order.save(); // pre-save hook recalculates amountDue/status

    res.json(order);
  } catch (err) {
    next(err);
  }
};

// @desc    Get outstanding credit invoices (accounts receivable)
// @route   GET /api/orders/meta/credit-outstanding
// @access  Private/Staff/Admin
const getCreditOutstanding = async (req, res, next) => {
  try {
    const orders = await Order.find({
      'payment.method': 'credit',
      'payment.status': { $in: ['unpaid', 'partial', 'overdue'] }
    })
      .sort({ 'payment.dueDate': 1 })
      .populate('customer', 'name email phone');

    // Mark overdue dynamically
    const now = new Date();
    const enriched = orders.map(o => {
      const obj = o.toObject();
      if (obj.payment.dueDate && new Date(obj.payment.dueDate) < now && obj.payment.status !== 'paid') {
        obj.payment.status = 'overdue';
      }
      return obj;
    });

    const totalOutstanding = enriched.reduce((sum, o) => sum + o.payment.amountDue, 0);

    res.json({ orders: enriched, totalOutstanding });
  } catch (err) {
    next(err);
  }
};
// @desc    Update invoice number (admin only)
// @route   PUT /api/orders/:id/invoice-number
// @access  Private/Admin
const updateInvoiceNumber = async (req, res, next) => {
  try {
    const { invoiceNumber } = req.body;

    // Validate invoice number provided
    if (!invoiceNumber || !invoiceNumber.trim()) {
      return res.status(400).json({ message: 'Invoice number is required' });
    }

    const trimmed = invoiceNumber.trim().toUpperCase();

    // Check if invoice number already exists on another order
    const existing = await Order.findOne({
      invoiceNumber: trimmed,
      _id: { $ne: req.params.id }
    });

    if (existing) {
      return res.status(400).json({
        message: `Invoice number ${trimmed} is already used by another order`
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldInvoiceNumber = order.invoiceNumber;
    order.invoiceNumber = trimmed;
    await order.save();

    res.json({
      message: `Invoice number updated from ${oldInvoiceNumber} to ${trimmed}`,
      order
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  recordPayment,
  getCreditOutstanding,
  updateInvoiceNumber
};

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    image: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }, // unit price at time of sale (may be overridden)
    originalPrice: { type: Number }, // catalog price at time of sale, for reference
    priceOverridden: { type: Boolean, default: false },
    overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    taxRate: { type: Number, required: true, default: 18 },
    lineTotal: { type: Number, required: true } // qty * price (excl tax)
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['cash', 'credit', 'card', 'upi', 'netbanking'],
      required: true
    },
    // For credit billing
    creditTermsDays: { type: Number, default: 0 }, // e.g. 30 days credit
    dueDate: { type: Date },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['paid', 'partial', 'unpaid', 'overdue'],
      default: 'unpaid'
    },
    transactionRef: { type: String }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    items: { type: [orderItemSchema], required: true, validate: v => v.length > 0 },
    subtotal: { type: Number, required: true }, // sum of lineTotals before tax
    taxAmount: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    payment: { type: paymentSchema, required: true },
    billingType: { type: String, enum: ['retail', 'wholesale'], default: 'retail' },
    orderType: { type: String, enum: ['online', 'pos'], default: 'online' },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending'
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String
    },
    notes: { type: String }
  },
  { timestamps: true }
);

orderSchema.pre('save', function (next) {
  if (this.payment.method === 'credit') {
    this.payment.amountDue = this.grandTotal - this.payment.amountPaid;
    if (this.payment.amountDue <= 0) {
      this.payment.status = 'paid';
      this.payment.amountDue = 0;
    } else if (this.payment.amountPaid > 0) {
      this.payment.status = 'partial';
    } else if (this.payment.dueDate && this.payment.dueDate < new Date()) {
      this.payment.status = 'overdue';
    } else {
      this.payment.status = 'unpaid';
    }
  } else {
    // cash, card, upi, netbanking are settled at point of sale
    this.payment.amountPaid = this.grandTotal;
    this.payment.amountDue = 0;
    this.payment.status = 'paid';
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

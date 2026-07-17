const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      required: true,
      enum: [
        'Refrigerators',
        'AC',
        'washing machines',
        'Audio',
        'Wearables',
        'TVs & Displays',
        'Inverter',
        'cooking',
        'Accessories',
        'Home Appliances'
      ]
    },
    brand: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 18, min: 0, max: 100 }, // GST %
    stock: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    images: [{ type: String }],
    specifications: { type: Map, of: String },
    warranty: { type: String, default: '1 Year' },
  isActive: { type: Boolean, default: true },
isApproved: { type: Boolean, default: false },
approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
approvedAt: { type: Date },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 }
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', brand: 'text', category: 'text' });

productSchema.virtual('discountPercent').get(function () {
  if (!this.mrp || this.mrp === 0) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);

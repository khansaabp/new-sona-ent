const Product = require('../models/Product');

// @desc    Get all products with filters, search, pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const { keyword, category, brand, minPrice, maxPrice, sort, page = 1, limit = 12, showAll } = req.query;

    const isStaffOrAdmin = req.user && ['admin', 'staff'].includes(req.user.role);

    const query = { isActive: true };

    // Only show approved products to customers/guests.
    // Staff/admin can pass ?showAll=true to see unapproved ones too (e.g. in dashboard).
    if (!isStaffOrAdmin || showAll !== 'true') {
      query.isApproved = true;
    }

    if (keyword) {
      query.$text = { $search: keyword };
    }
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };
    if (sort === 'name') sortOption = { name: 1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(Number(limit)),
      Product.countDocuments(query)
    ]);

    res.json({
      products,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Block customers from viewing unapproved product detail pages directly via URL
    const isStaffOrAdmin = req.user && ['admin', 'staff'].includes(req.user.role);
    if ((!product.isApproved || !product.isActive) && !isStaffOrAdmin) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
};

// @desc    Get distinct categories and brands (for filters)
// @route   GET /api/products/meta/filters
// @access  Public
const getFilterMeta = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isActive: true, isApproved: true });
    const brands = await Product.distinct('brand', { isActive: true, isApproved: true });
    res.json({ categories, brands });
  } catch (err) {
    next(err);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const payload = { ...req.body };

    // Admin-created products auto-approve. Staff-created products need admin review.
    if (req.user.role === 'admin') {
      payload.isApproved = true;
      payload.approvedBy = req.user._id;
      payload.approvedAt = new Date();
    } else {
      payload.isApproved = false;
    }

    const product = await Product.create(payload);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // If staff edits an already-approved product, send it back for admin re-review.
    // Admin edits keep their own approval status as-is (they can toggle it directly if needed).
    if (req.user.role === 'staff' && product.isApproved) {
      req.body.isApproved = false;
    }

    Object.assign(product, req.body);
    const updated = await product.save();
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete product (soft delete)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.isActive = false;
    await product.save();
    res.json({ message: 'Product removed' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get low stock products
// @route   GET /api/products/meta/low-stock
// @access  Private/Admin
const getLowStock = async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    }).sort({ stock: 1 });
    res.json(products);
  } catch (err) {
    next(err);
  }
};
// @desc    Get products pending approval
// @route   GET /api/products/meta/pending-approval
// @access  Private/Admin
const getPendingApproval = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, isApproved: false }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    next(err);
  }
};

// @desc    Approve a product (makes it visible to customers)
// @route   PUT /api/products/:id/approve
// @access  Private/Admin
const approveProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.isApproved = true;
    product.approvedBy = req.user._id;
    product.approvedAt = new Date();
    await product.save();

    res.json({ message: `${product.name} approved and is now visible to customers`, product });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject / unapprove a product (hides it from customers)
// @route   PUT /api/products/:id/reject
// @access  Private/Admin
const rejectProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.isApproved = false;
    product.approvedBy = undefined;
    product.approvedAt = undefined;
    await product.save();

    res.json({ message: `${product.name} hidden from customers`, product });
  } catch (err) {
    next(err);
  }
};
module.exports = {
  getProducts,
  getProductById,
  getFilterMeta,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStock,
  getPendingApproval,
  approveProduct,
  rejectProduct
};
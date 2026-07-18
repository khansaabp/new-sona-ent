const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Recalculate a product's average rating and review count
const recalculateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  const rating = stats[0]?.avgRating || 0;
  const numReviews = stats[0]?.count || 0;

  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(rating * 10) / 10,
    numReviews
  });
};

// @desc    Get all reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

// @desc    Check if the logged-in customer can review this product
// @route   GET /api/products/:id/can-review
// @access  Private
const canReview = async (req, res, next) => {
  try {
    const existingReview = await Review.findOne({
      product: req.params.id,
      customer: req.user._id
    });

    if (existingReview) {
      return res.json({ canReview: false, reason: 'already_reviewed', existingReview });
    }

    // Check if customer has a delivered order containing this product
    const order = await Order.findOne({
      customer: req.user._id,
      isDeleted: { $ne: true },
      orderStatus: 'delivered',
      'items.product': req.params.id
    });

    if (!order) {
      return res.json({ canReview: false, reason: 'not_purchased' });
    }

    res.json({ canReview: true, orderId: order._id });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit a review
// @route   POST /api/products/:id/reviews
// @access  Private
const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const existing = await Review.findOne({ product: productId, customer: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Verify purchase for the "verified purchase" badge (not mandatory to allow review)
    const order = await Order.findOne({
      customer: req.user._id,
      isDeleted: { $ne: true },
      orderStatus: 'delivered',
      'items.product': productId
    });

    const review = await Review.create({
      product: productId,
      customer: req.user._id,
      customerName: req.user.name,
      order: order?._id,
      rating,
      comment: comment || '',
      verifiedPurchase: !!order
    });

    await recalculateProductRating(productId);

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a review (owner or admin)
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const isOwner = review.customer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    const productId = review.product;
    await review.deleteOne();
    await recalculateProductRating(productId);

    res.json({ message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProductReviews, canReview, createReview, deleteReview };
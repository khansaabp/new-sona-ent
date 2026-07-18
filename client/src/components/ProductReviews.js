import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';
import StarRating from './StarRating';
import './ProductReviews.css';

const ProductReviews = ({ productId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [canReviewData, setCanReviewData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchReviews = () => {
    api.get(`/products/${productId}/reviews`).then(res => setReviews(res.data));
  };

  useEffect(() => {
    fetchReviews();
    if (user && user.role === 'customer') {
      api.get(`/products/${productId}/can-review`).then(res => setCanReviewData(res.data));
    }
  }, [productId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/products/${productId}/reviews`, { rating, comment });
      setShowForm(false);
      setComment('');
      setRating(5);
      fetchReviews();
      setCanReviewData({ canReview: false, reason: 'already_reviewed' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    await api.delete(`/products/${productId}/reviews/${reviewId}`);
    fetchReviews();
  };

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="product-reviews">
      <div className="product-reviews__header">
        <h2>Customer Reviews</h2>
        {reviews.length > 0 && (
          <div className="product-reviews__summary">
            <StarRating rating={avgRating} size={20} />
            <span className="mono">{avgRating.toFixed(1)} out of 5</span>
            <span className="text-muted">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
          </div>
        )}
      </div>

      {user?.role === 'customer' && canReviewData?.canReview && !showForm && (
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
          Write a review
        </button>
      )}

      {user?.role === 'customer' && canReviewData && !canReviewData.canReview && canReviewData.reason === 'not_purchased' && (
        <p className="text-muted" style={{ fontSize: 13 }}>
          Only customers who have received a delivered order for this product can leave a review.
        </p>
      )}

      {showForm && (
        <form className="card review-form" onSubmit={handleSubmit}>
          {error && <div className="error-banner">{error}</div>}
          <div className="field">
            <label className="label">Your rating</label>
            <StarRating rating={rating} size={26} interactive onChange={setRating} />
          </div>
          <div className="field">
            <label className="label">Your review (optional)</label>
            <textarea
              className="textarea"
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              maxLength={1000}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit review'}
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="review-list">
        {reviews.length === 0 ? (
          <p className="text-muted" style={{ marginTop: 16 }}>No reviews yet. Be the first to review this product.</p>
        ) : (
          reviews.map(review => (
            <div className="review-item card" key={review._id}>
              <div className="review-item__header">
                <div>
                  <span style={{ fontWeight: 600 }}>{review.customerName}</span>
                  {review.verifiedPurchase && (
                    <span className="tag tag-green" style={{ marginLeft: 8, fontSize: 10 }}>Verified Purchase</span>
                  )}
                </div>
                <span className="text-muted" style={{ fontSize: 12 }}>{formatDate(review.createdAt)}</span>
              </div>
              <StarRating rating={review.rating} size={14} />
              {review.comment && <p className="review-item__comment">{review.comment}</p>}
              {(user?.role === 'admin' || user?._id === review.customer) && (
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => handleDelete(review._id)}>
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';
import './Cart.css';

const Cart = () => {
  const { items, updateQuantity, removeItem, subtotal, taxTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();



  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h2>Your cart is empty</h2>
          <p className="text-muted">Add products from the catalog to get started.</p>
          <Link to="/shop" className="btn btn-primary" style={{ marginTop: 16 }}>Browse catalog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="cart-title">Your Cart</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {items.map(({ product, quantity }) => (
            <div className="cart-item card" key={product._id}>
              <div className="cart-item__glyph">◆</div>
              <div className="cart-item__info">
                <Link to={`/product/${product._id}`} className="cart-item__name">{product.name}</Link>
                <div className="text-muted mono" style={{ fontSize: 12 }}>SKU: {product.sku}</div>
                <div className="mono">{formatCurrency(product.price)} / unit</div>
              </div>
              <div className="qty-stepper">
                <button onClick={() => updateQuantity(product._id, quantity - 1)} aria-label="Decrease quantity">−</button>
                <span className="mono">{quantity}</span>
                <button
                  onClick={() => updateQuantity(product._id, Math.min(product.stock, quantity + 1))}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <div className="cart-item__total mono">{formatCurrency(product.price * quantity)}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => removeItem(product._id)}>Remove</button>
            </div>
          ))}
        </div>

        <div className="cart-summary card">
          <h2 className="cart-summary__title">Order Summary</h2>
     <div className="cart-summary__row">
  <span className="text-secondary">Subtotal (GST incl.)</span>
  <span className="mono">{formatCurrency(subtotal)}</span>
</div>
<div className="cart-summary__divider"></div>
<div className="cart-summary__row cart-summary__total">
  <span>Total</span>
  <span className="mono">{formatCurrency(subtotal)}</span>
</div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={handleCheckout}>
            Proceed to checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;

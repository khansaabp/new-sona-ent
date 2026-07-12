import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatCurrency } from '../utils/format';
import './Checkout.css';

const paymentMethods = [
  { id: 'cash', label: 'Cash', desc: 'Pay in full at checkout / counter' },
  { id: 'upi', label: 'UPI', desc: 'Pay via UPI app, settled instantly' },
  { id: 'card', label: 'Card', desc: 'Debit / Credit card payment' },
  { id: 'credit', label: 'Credit Account', desc: 'Bill now, pay later (approved customers)' }
];

const Checkout = () => {
  const { items, subtotal, taxTotal, clearCart } = useCart();
  const { user } = useAuth();
  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';
  const navigate = useNavigate();

  const [method, setMethod] = useState('cash');
  const [creditTermsDays, setCreditTermsDays] = useState(30);
  const [advancePaid, setAdvancePaid] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [transactionRef, setTransactionRef] = useState('');
  const [address, setAddress] = useState(user?.address || {});
  const [orderType, setOrderType] = useState('online');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const grandTotal = Math.max(0, subtotal - Number(discount || 0));

  const handlePlaceOrder = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = {
        items: items.map(i => ({ product: i.product._id, quantity: i.quantity })),
        payment: {
          method,
          creditTermsDays: method === 'credit' ? Number(creditTermsDays) : undefined,
          amountPaid: method === 'credit' ? Number(advancePaid || 0) : undefined,
          transactionRef: ['upi', 'card'].includes(method) ? transactionRef : undefined
        },
        discount: Number(discount || 0),
        shippingAddress: address,
        orderType,
        customerName: user.name,
        customerPhone: user.phone
      };

      const { data } = await api.post('/orders', payload);
      clearCart();
      navigate(`/orders/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="page-container empty-state">
        <h2>Nothing to checkout</h2>
        <p className="text-muted">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="cart-title">Checkout &amp; Billing</h1>

      {error && <div className="error-banner">{error}</div>}

      <div className="checkout-layout">
        <div className="checkout-main">
          <section className="card checkout-section">
            <h2>Order type</h2>
            <div className="radio-grid">
              <label className={`radio-card ${orderType === 'online' ? 'radio-card--active' : ''}`}>
                <input type="radio" name="orderType" value="online" checked={orderType === 'online'} onChange={() => setOrderType('online')} />
                <div>
                  <div className="radio-card__title">Online delivery</div>
                  <div className="text-muted">Shipped to your address</div>
                </div>
              </label>
              <label className={`radio-card ${orderType === 'pos' ? 'radio-card--active' : ''}`}>
                <input type="radio" name="orderType" value="pos" checked={orderType === 'pos'} onChange={() => setOrderType('pos')} />
                <div>
                  <div className="radio-card__title">In-store pickup</div>
                  <div className="text-muted">Collect from the shop counter</div>
                </div>
              </label>
            </div>
          </section>

          {orderType === 'online' && (
            <section className="card checkout-section">
              <h2>Shipping address</h2>
              <div className="field-grid">
                <div className="field">
                  <label className="label">Street address</label>
                  <input className="input" value={address.street || ''} onChange={e => setAddress(a => ({ ...a, street: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="label">City</label>
                  <input className="input" value={address.city || ''} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="label">State</label>
                  <input className="input" value={address.state || ''} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="label">Pincode</label>
                  <input className="input" value={address.pincode || ''} onChange={e => setAddress(a => ({ ...a, pincode: e.target.value }))} />
                </div>
              </div>
            </section>
          )}

          <section className="card checkout-section">
            <h2>Billing &amp; payment method</h2>
            <div className="radio-grid radio-grid--2col">
              {paymentMethods.map(pm => (
                <label key={pm.id} className={`radio-card ${method === pm.id ? 'radio-card--active' : ''}`}>
                  <input type="radio" name="method" value={pm.id} checked={method === pm.id} onChange={() => setMethod(pm.id)} />
                  <div>
                    <div className="radio-card__title">{pm.label}</div>
                    <div className="text-muted">{pm.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {['upi', 'card'].includes(method) && (
              <div className="field" style={{ marginTop: 16 }}>
                <label className="label">Transaction reference / UTR (optional)</label>
                <input className="input" value={transactionRef} onChange={e => setTransactionRef(e.target.value)} placeholder="e.g. UPI ref number" />
              </div>
            )}

            {method === 'credit' && (
              <div className="credit-box">
                <div className="field-grid">
                  <div className="field">
                    <label className="label">Credit term (days)</label>
                    <select className="select" value={creditTermsDays} onChange={e => setCreditTermsDays(e.target.value)}>
                      <option value={15}>15 days</option>
                      <option value={30}>30 days</option>
                      <option value={45}>45 days</option>
                      <option value={60}>60 days</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="label">Advance payment now (optional)</label>
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      className="input"
                      value={advancePaid}
                      onChange={e => setAdvancePaid(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
                  Remaining balance of <strong className="mono">{formatCurrency(grandTotal - Number(advancePaid || 0))}</strong> will be
                  due within {creditTermsDays} days of invoice date. Credit billing is for approved accounts only.
                </p>
              </div>
            )}
          </section>
{isStaffOrAdmin && (
          <section className="card checkout-section">
            <h2>Discount</h2>
            <div className="field" style={{ maxWidth: 220 }}>
              <label className="label">Discount amount (₹)</label>
              <input type="number" min="0" className="input" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0.00" />
            </div>
          </section>)}
        </div>

        <div className="cart-summary card">
          <h2 className="cart-summary__title">Invoice Preview</h2>
          {items.map(({ product, quantity }) => (
            <div className="cart-summary__row" key={product._id}>
              <span className="text-secondary" style={{ fontSize: 13 }}>{product.name} × {quantity}</span>
              <span className="mono" style={{ fontSize: 13 }}>{formatCurrency(product.price * quantity)}</span>
            </div>
          ))}
          <div className="cart-summary__divider"></div>
          <div className="cart-summary__row">
            <span className="text-secondary">Subtotal</span>
            <span className="mono">{formatCurrency(subtotal)}</span>
          </div>
         <div className="cart-summary__row">
  <span className="text-secondary">GST (included in price)</span>
  <span className="mono text-muted">incl.</span>
</div>
          {isStaffOrAdmin && (
          <div className="cart-summary__row">
            <span className="text-secondary">Discount</span>
            <span className="mono">- {formatCurrency(discount || 0)}</span>
          </div>)}
          <div className="cart-summary__divider"></div>
          <div className="cart-summary__row cart-summary__total">
            <span>Grand Total</span>
            <span className="mono">{formatCurrency(grandTotal)}</span>
          </div>

          {method === 'credit' && (
            <div className="cart-summary__row" style={{ marginTop: 8 }}>
              <span className="tag tag-amber">Credit · {creditTermsDays} days</span>
              <span className="mono">{formatCurrency(grandTotal - Number(advancePaid || 0))} due</span>
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={handlePlaceOrder} disabled={loading}>
            {loading ? 'Generating invoice...' : 'Place order & generate invoice'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

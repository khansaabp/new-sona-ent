import React, { useState, useEffect,  } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency } from '../utils/format';
import './DashboardBilling.css';

const paymentMethods = [
  { id: 'cash', label: 'Cash' },
  { id: 'upi', label: 'UPI' },
  { id: 'card', label: 'Card' },
  { id: 'credit', label: 'Credit Account' }
];

const DashboardBilling = () => {
  const navigate = useNavigate();

  // Customer selection
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searching, setSearching] = useState(false);

  // Product selection
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [cartItems, setCartItems] = useState([]); // [{ product, quantity }]

  // Billing details
  const [method, setMethod] = useState('cash');
  const [creditTermsDays, setCreditTermsDays] = useState(30);
  const [advancePaid, setAdvancePaid] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [orderType, setOrderType] = useState('pos');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Search customers
  useEffect(() => {
    if (customerSearch.trim().length < 2) {
      setCustomerResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      api.get(`/orders/meta/search-customers?keyword=${encodeURIComponent(customerSearch)}`)
        .then(res => setCustomerResults(res.data))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Search products
  useEffect(() => {
    if (productSearch.trim().length < 2) {
      setProductResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api.get(`/products?keyword=${encodeURIComponent(productSearch)}&limit=8`)
        .then(res => setProductResults(res.data.products));
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

const addToCart = (product) => {
  setCartItems(prev => {
    const existing = prev.find(i => i.product._id === product._id);
    if (existing) {
      return prev.map(i =>
        i.product._id === product._id
          ? { ...i, quantity: Math.min(i.quantity + 1, product.stock) }
          : i
      );
    }
    return [...prev, { product, quantity: 1, customPrice: product.price }];
  });
  setProductSearch('');
  setProductResults([]);
};

  const updateQty = (productId, qty) => {
    setCartItems(prev =>
      prev
        .map(i => (i.product._id === productId ? { ...i, quantity: qty } : i))
        .filter(i => i.quantity > 0)
    );
  };
const updatePrice = (productId, price) => {
  setCartItems(prev =>
    prev.map(i => (i.product._id === productId ? { ...i, customPrice: price } : i))
  );
};

const resetPrice = (productId) => {
  setCartItems(prev =>
    prev.map(i => (i.product._id === productId ? { ...i, customPrice: i.product.price } : i))
  );
};
  const removeItem = (productId) => {
    setCartItems(prev => prev.filter(i => i.product._id !== productId));
  };

const subtotal = cartItems.reduce((sum, i) => sum + (i.customPrice ?? i.product.price) * i.quantity, 0);
const grandTotal = Math.max(0, subtotal - Number(discount || 0));
  const handleGenerateInvoice = async () => {
    setError('');
    if (!selectedCustomer) {
      setError('Please select a customer first');
      return;
    }
    if (cartItems.length === 0) {
      setError('Please add at least one product');
      return;
    }

    setLoading(true);
    try {
     const payload = {
  customerId: selectedCustomer._id,
  customerName: selectedCustomer.name,
  customerPhone: selectedCustomer.phone,
  items: cartItems.map(i => ({
    product: i.product._id,
    quantity: i.quantity,
    overridePrice: i.customPrice !== i.product.price ? i.customPrice : undefined
  })),
        payment: {
          method,
          creditTermsDays: method === 'credit' ? Number(creditTermsDays) : undefined,
          amountPaid: method === 'credit' ? Number(advancePaid || 0) : undefined
        },
        discount: Number(discount || 0),
        orderType,
        shippingAddress: selectedCustomer.address
      };

      const { data } = await api.post('/orders', payload);
      navigate(`/orders/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1>New Sale</h1>
          <p className="text-muted">Bill an order on behalf of a customer (POS / phone / walk-in orders)</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="billing-layout">
        <div className="billing-main">

          {/* Step 1: Customer */}
          <section className="card checkout-section">
            <h2>1. Select customer</h2>
            {selectedCustomer ? (
              <div className="selected-customer">
                <div>
                  <div style={{ fontWeight: 700 }}>{selectedCustomer.name}</div>
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    {selectedCustomer.email} {selectedCustomer.phone && `· ${selectedCustomer.phone}`}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCustomer(null)}>Change</button>
              </div>
            ) : (
              <div>
                <input
                  className="input"
                  placeholder="Search customer by name, email, or phone..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                />
                {searching && <div className="text-muted" style={{ fontSize: 13, marginTop: 8 }}>Searching...</div>}
                {customerResults.length > 0 && (
                  <div className="search-results">
                    {customerResults.map(c => (
                      <button
                        key={c._id}
                        className="search-result-item"
                        onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomerResults([]); }}
                      >
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>{c.email} {c.phone && `· ${c.phone}`}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Step 2: Products */}
          <section className="card checkout-section">
            <h2>2. Add products</h2>
            <input
              className="input"
              placeholder="Search product by name, SKU, or brand..."
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
            />
            {productResults.length > 0 && (
              <div className="search-results">
                {productResults.map(p => (
                  <button key={p._id} className="search-result-item" onClick={() => addToCart(p)} disabled={p.stock === 0}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {formatCurrency(p.price)} · {p.stock} in stock {p.stock === 0 && '(out of stock)'}
                    </div>
                  </button>
                ))}
              </div>
            )}
{cartItems.length > 0 && (
  <div className="billing-cart">
    {cartItems.map(({ product, quantity, customPrice }) => {
      const priceChanged = customPrice !== product.price;
      return (
        <div className="billing-cart-item" key={product._id}>
          <div className="billing-cart-item__info">
            <div style={{ fontWeight: 600 }}>{product.name}</div>
            <div className="price-edit">
              <span className="text-muted mono" style={{ fontSize: 12 }}>₹</span>
              <input
                type="number"
                min="0"
                className="price-edit__input mono"
                value={customPrice}
                onChange={e => updatePrice(product._id, Number(e.target.value))}
              />
              <span className="text-muted mono" style={{ fontSize: 12 }}>/ unit</span>
              {priceChanged && (
                <>
                  <span className="tag tag-amber" style={{ fontSize: 10 }}>Custom price</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 8px', fontSize: 11 }}
                    onClick={() => resetPrice(product._id)}
                    title={`Reset to catalog price ₹${product.price}`}
                  >
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="qty-stepper">
            <button onClick={() => updateQty(product._id, quantity - 1)}>−</button>
            <span className="mono">{quantity}</span>
            <button onClick={() => updateQty(product._id, Math.min(product.stock, quantity + 1))}>+</button>
          </div>
          <div className="mono" style={{ minWidth: 90, textAlign: 'right' }}>
            {formatCurrency(customPrice * quantity)}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => removeItem(product._id)}>Remove</button>
        </div>
      );
    })}
  </div>
)}
          </section>

          {/* Step 3: Payment */}
          <section className="card checkout-section">
            <h2>3. Payment method</h2>
            <div className="radio-grid radio-grid--2col">
              {paymentMethods.map(pm => (
                <label key={pm.id} className={`radio-card ${method === pm.id ? 'radio-card--active' : ''}`}>
                  <input type="radio" name="method" checked={method === pm.id} onChange={() => setMethod(pm.id)} />
                  <div className="radio-card__title">{pm.label}</div>
                </label>
              ))}
            </div>

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
                    <label className="label">Advance paid now</label>
                    <input type="number" min="0" className="input" value={advancePaid} onChange={e => setAdvancePaid(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <div className="field" style={{ maxWidth: 220, marginTop: 16 }}>
              <label className="label">Discount (₹)</label>
              <input type="number" min="0" className="input" value={discount} onChange={e => setDiscount(e.target.value)} />
            </div>

            <div className="field" style={{ maxWidth: 260 }}>
              <label className="label">Order type</label>
              <select className="select" value={orderType} onChange={e => setOrderType(e.target.value)}>
                <option value="pos">In-store / POS</option>
                <option value="online">Online (phone order)</option>
              </select>
            </div>
          </section>
        </div>

        <div className="cart-summary card">
          <h2 className="cart-summary__title">Invoice Preview</h2>
          {cartItems.map(({ product, quantity }) => (
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
            <span className="text-secondary">Discount</span>
            <span className="mono">- {formatCurrency(discount || 0)}</span>
          </div>
          <div className="cart-summary__divider"></div>
          <div className="cart-summary__row cart-summary__total">
            <span>Grand Total</span>
            <span className="mono">{formatCurrency(grandTotal)}</span>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 16 }}
            onClick={handleGenerateInvoice}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate invoice'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardBilling;
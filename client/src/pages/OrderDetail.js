import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';
import './Invoice.css';

const statusTag = (status) => {
  const map = { paid: 'tag-green', partial: 'tag-amber', unpaid: 'tag-muted', overdue: 'tag-red' };
  return map[status] || 'tag-muted';
};

const OrderDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  const fetchOrder = () => {
    api.get(`/orders/${id}`).then(res => setOrder(res.data)).catch(err => setError(err.response?.data?.message || 'Order not found'));
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <div className="page-container empty-state">{error}</div>;
  if (!order) return <div className="page-container empty-state">Loading invoice...</div>;

  const isStaff = user?.role === 'admin' || user?.role === 'staff';

  const handleRecordPayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) return;
    setPayLoading(true);
    try {
      await api.put(`/orders/${id}/pay`, { amount: Number(payAmount) });
      setPayAmount('');
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Link to="/orders" className="text-muted" style={{ fontSize: 13 }}>&larr; All orders</Link>

      <div className="invoice card">
        <div className="invoice__header">
          <div>
            <div className="brand" style={{ marginBottom: 8 }}>
              <span className="brand__mark">⌁</span>
              <span className="brand__text">New<span className="brand__accent">Sona Enterprises</span></span>
            </div>
            <div className="text-muted">GSTIN: 27ABCDE1234F1Z5</div>
            <div className="text-muted">nagar parishad complex,akola road, Hingoli, Maharashtra, India</div>
          </div>
          <div className="invoice__meta">
            <h2 className="mono">{order.invoiceNumber}</h2>
            <div className="text-muted">{formatDateTime(order.createdAt)}</div>
            <div style={{ marginTop: 8 }}>
              <span className={`tag ${statusTag(order.payment.status)}`}>{order.payment.status.toUpperCase()}</span>{' '}
              <span className="tag tag-cyan">{order.payment.method.toUpperCase()}</span>{' '}
              <span className="tag tag-muted">{order.orderStatus.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="invoice__parties">
          <div>
            <div className="text-muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Billed to</div>
            <div style={{ fontWeight: 700 }}>{order.customerName}</div>
            {order.customerPhone && <div className="text-muted">{order.customerPhone}</div>}
            {order.shippingAddress?.street && (
              <div className="text-muted">
                {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
              </div>
            )}
          </div>
          {order.payment.method === 'credit' && (
            <div>
              <div className="text-muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Credit terms</div>
              <div>Due date: <strong>{formatDate(order.payment.dueDate)}</strong></div>
              <div>{order.payment.creditTermsDays} day credit term</div>
            </div>
          )}
        </div>

        <table className="invoice__table">
          <thead>
            <tr>
              <th>Item</th>
              <th>SKU</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Tax %</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.sku}>
                <td>{item.name}</td>
                <td className="mono text-muted">{item.sku}</td>
                <td className="mono">{item.quantity}</td>
                <td className="mono">{formatCurrency(item.price)}</td>
                <td className="mono">{item.taxRate}%</td>
                <td className="mono">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice__totals">
          <div className="invoice__totals-row">
            <span className="text-secondary">Subtotal</span>
            <span className="mono">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="invoice__totals-row">
            <span className="text-secondary">GST</span>
            <span className="mono">{formatCurrency(order.taxAmount)}</span>
          </div>
          <div className="invoice__totals-row">
            <span className="text-secondary">Discount</span>
            <span className="mono">- {formatCurrency(order.discount)}</span>
          </div>
          {order.shippingFee > 0 && (
            <div className="invoice__totals-row">
              <span className="text-secondary">Shipping</span>
              <span className="mono">{formatCurrency(order.shippingFee)}</span>
            </div>
          )}
          <div className="invoice__totals-divider"></div>
          <div className="invoice__totals-row invoice__totals-grand">
            <span>Grand Total</span>
            <span className="mono">{formatCurrency(order.grandTotal)}</span>
          </div>
          {order.payment.method === 'credit' && (
            <>
              <div className="invoice__totals-row">
                <span className="text-secondary">Amount paid</span>
                <span className="mono">{formatCurrency(order.payment.amountPaid)}</span>
              </div>
              <div className="invoice__totals-row" style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>
                <span>Balance due</span>
                <span className="mono">{formatCurrency(order.payment.amountDue)}</span>
              </div>
            </>
          )}
        </div>

        {isStaff && order.payment.method === 'credit' && order.payment.amountDue > 0 && (
          <div className="invoice__pay-section">
            <h3>Record a payment against this invoice</h3>
            <div className="invoice__pay-row">
              <input
                type="number"
                min="0"
                max={order.payment.amountDue}
                className="input"
                placeholder={`Up to ${formatCurrency(order.payment.amountDue)}`}
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handleRecordPayment} disabled={payLoading}>
                {payLoading ? 'Recording...' : 'Record payment'}
              </button>
            </div>
          </div>
        )}

        <div className="invoice__actions">
          <button className="btn btn-ghost" onClick={() => window.print()}>Print invoice</button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

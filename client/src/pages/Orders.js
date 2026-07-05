import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDateTime } from '../utils/format';
import './Orders.css';

const statusTag = (status) => {
  const map = {
    paid: 'tag-green',
    partial: 'tag-amber',
    unpaid: 'tag-muted',
    overdue: 'tag-red'
  };
  return map[status] || 'tag-muted';
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders').then(res => setOrders(res.data.orders)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container empty-state">Loading orders...</div>;

  if (orders.length === 0) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h2>No orders yet</h2>
          <p className="text-muted">Your invoices will appear here once you place an order.</p>
          <Link to="/shop" className="btn btn-primary" style={{ marginTop: 16 }}>Browse catalog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="cart-title">My Orders</h1>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Items</th>
              <th>Method</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td className="mono">{order.invoiceNumber}</td>
                <td className="text-muted">{formatDateTime(order.createdAt)}</td>
                <td>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                <td><span className="tag tag-cyan">{order.payment.method}</span></td>
                <td><span className={`tag ${statusTag(order.payment.status)}`}>{order.payment.status}</span></td>
                <td><span className="tag tag-muted">{order.orderStatus}</span></td>
                <td className="mono">{formatCurrency(order.grandTotal)}</td>
                <td><Link to={`/orders/${order._id}`} className="btn btn-ghost btn-sm">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;

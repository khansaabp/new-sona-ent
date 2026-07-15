import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDateTime } from '../utils/format';
import './DashboardOrders.css';

const statusTag = (status) => {
  const map = { paid: 'tag-green', partial: 'tag-amber', unpaid: 'tag-muted', overdue: 'tag-red' };
  return map[status] || 'tag-muted';
};

const orderStatusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

const DashboardOrders = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ status: '', paymentMethod: '', paymentStatus: '' });
  const [loading, setLoading] = useState(true);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.invoiceSearch) params.set('invoiceSearch', filters.invoiceSearch);
    if (filters.status) params.set('status', filters.status);
    if (filters.paymentMethod) params.set('paymentMethod', filters.paymentMethod);
    if (filters.paymentStatus) params.set('paymentStatus', filters.paymentStatus);
    params.set('page', page);
    params.set('limit', 10);

    try {
      const { data } = await api.get(`/orders?${params.toString()}`);
      setOrders(data.orders);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleStatusChange = async (orderId, orderStatus) => {
    setOrders(prev => prev.map(o => (o._id === orderId ? { ...o, orderStatus } : o)));
    await api.put(`/orders/${orderId}/status`, { orderStatus });
  };

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1>Orders &amp; Billing</h1>
          <p className="text-muted">{pagination.total} total orders</p>
        </div>
      </div>

      <div className="order-filters card">
          <input
    className="input"
    placeholder="Search invoice number..."
    style={{ maxWidth: 220 }}
    value={filters.invoiceSearch || ''}
    onChange={e => setFilters(f => ({ ...f, invoiceSearch: e.target.value }))}
  />
        <select className="select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All order statuses</option>
          {orderStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="select" value={filters.paymentMethod} onChange={e => setFilters(f => ({ ...f, paymentMethod: e.target.value }))}>
          <option value="">All payment methods</option>
          <option value="cash">Cash</option>
          <option value="credit">Credit</option>
          <option value="card">Card</option>
          <option value="upi">UPI</option>
          <option value="netbanking">Netbanking</option>
        </select>
        <select className="select" value={filters.paymentStatus} onChange={e => setFilters(f => ({ ...f, paymentStatus: e.target.value }))}>
          <option value="">All payment statuses</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div className="empty-state">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">No orders found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Method</th>
                <th>Payment</th>
                <th>Order Status</th>
                <th>Total</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td className="mono">{order.invoiceNumber}</td>
                  <td>{order.customerName}</td>
                  <td><span className="tag tag-cyan">{order.payment.method}</span></td>
                  <td><span className={`tag ${statusTag(order.payment.status)}`}>{order.payment.status}</span></td>
                  <td>
                    <select
                      className="select select-sm"
                      value={order.orderStatus}
                      onChange={e => handleStatusChange(order._id, e.target.value)}
                    >
                      {orderStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="mono">{formatCurrency(order.grandTotal)}</td>
                  <td className="text-muted">{formatDateTime(order.createdAt)}</td>
                  <td><Link to={`/orders/${order._id}`} className="btn btn-ghost btn-sm">Invoice</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`btn btn-sm ${p === pagination.page ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => fetchOrders(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardOrders;

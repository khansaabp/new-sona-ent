import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate, formatDateTime, getPaymentMethodLabel } from '../utils/format';
import StatCard from '../components/StatCard';
import './DashboardCustomers.css';
import { exportCustomerProfileToPDF } from '../utils/exportData';

const statusTag = (status) => {
  const map = { paid: 'tag-green', partial: 'tag-amber', unpaid: 'tag-muted', overdue: 'tag-red' };
  return map[status] || 'tag-muted';
};

const DashboardCustomerDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

useEffect(() => {
  api.get(`/users/customers/${id}`)
    .then(res => {
      setData(res.data);
      setNotes(res.data.customer.adminNotes || '');
    })
    .catch(err => setError(err.response?.data?.message || 'Customer not found'));
}, [id]);
const handleSaveNotes = async () => {
  setSavingNotes(true);
  setNotesSaved(false);
  try {
    await api.put(`/users/customers/${id}/notes`, { adminNotes: notes });
    setNotesSaved(true);
    setEditingNotes(false);
    setTimeout(() => setNotesSaved(false), 2500);
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to save notes');
  } finally {
    setSavingNotes(false);
  }
};

  if (error) return <div className="empty-state">{error}</div>;
  if (!data) return <div className="empty-state">Loading customer...</div>;

  const { customer, orders, stats } = data;

  return (
    <div>
      <Link to="/dashboard/customers" className="text-muted" style={{ fontSize: 13 }}>&larr; All customers</Link>
<div className="dash-header" style={{ marginTop: 12 }}>
  <div>
    <h1>{customer.name}</h1>
    <p className="text-muted">
      Customer since {formatDate(customer.createdAt)}
      {!customer.isActive && <span className="tag tag-red" style={{ marginLeft: 8 }}>Inactive</span>}
    </p>
  </div>
  <button
    className="btn btn-ghost"
    onClick={() => exportCustomerProfileToPDF(customer, orders, stats)}
  >
    ⬇ Download profile (PDF)
  </button>
</div>

      <div className="customer-profile card">
  <div className="customer-profile__row">
    <span className="text-muted">Email</span>
    <span>{customer.email}</span>
  </div>
  <div className="customer-profile__row">
    <span className="text-muted">Phone</span>
    <span>{customer.phone || 'Not provided'}</span>
  </div>
  <div className="customer-profile__row">
    <span className="text-muted">Address</span>
    <span>
      {customer.address?.street
        ? `${customer.address.street}, ${customer.address.city}, ${customer.address.state} ${customer.address.pincode}`
        : 'Not provided'}
    </span>
  </div>
</div>

<div className="card admin-notes-card">
  <div className="admin-notes-header">
    <div>
      <h2 className="admin-notes-title">Admin Notes</h2>
      <span className="tag tag-red mono" style={{ fontSize: 10 }}>Admin only · Not visible to customer</span>
    </div>
    {!editingNotes && (
      <button className="btn btn-ghost btn-sm" onClick={() => setEditingNotes(true)}>
        {notes ? 'Edit' : '+ Add note'}
      </button>
    )}
  </div>

  {notesSaved && <div className="success-banner">Notes saved</div>}

  {editingNotes ? (
    <div>
      <textarea
        className="textarea"
        rows={5}
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="e.g. Prefers phone contact, always pays credit invoices on time, requested discount on bulk orders..."
      />
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button className="btn btn-primary btn-sm" onClick={handleSaveNotes} disabled={savingNotes}>
          {savingNotes ? 'Saving...' : 'Save notes'}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setNotes(customer.adminNotes || ''); setEditingNotes(false); }}
        >
          Cancel
        </button>
      </div>
    </div>
  ) : (
    <p className="admin-notes-text">
      {notes ? notes : <span className="text-muted">No notes added yet.</span>}
    </p>
  )}
</div>

      <div className="stat-grid">
        <StatCard label="Total Orders" value={stats.totalOrders} tone="cyan" />
        <StatCard label="Total Spent" value={formatCurrency(stats.totalSpent)} tone="green" />
        <StatCard
          label="Credit Outstanding"
          value={formatCurrency(stats.creditOutstanding)}
          tone={stats.creditOutstanding > 0 ? 'amber' : 'default'}
        />
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <h2 className="customer-orders-title">Order History</h2>
        {orders.length === 0 ? (
          <div className="empty-state">No orders yet.</div>
        ) : (
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
                  <td><span className="tag tag-cyan">{getPaymentMethodLabel(order)}</span></td>
                  <td><span className={`tag ${statusTag(order.payment.status)}`}>{order.payment.status}</span></td>
                  <td><span className="tag tag-muted">{order.orderStatus}</span></td>
                  <td className="mono">{formatCurrency(order.grandTotal)}</td>
                  <td><Link to={`/orders/${order._id}`} className="btn btn-ghost btn-sm">Invoice</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DashboardCustomerDetail;
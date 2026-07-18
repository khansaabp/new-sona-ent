import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/format';
import StatCard from '../components/StatCard';
import './DashboardCustomers.css';
import { exportCustomersToExcel, exportCustomersToPDF } from '../utils/exportData';

const emptyCustomerForm = { name: '', email: '', phone: '', password: '', street: '', city: '', state: '', pincode: '' };

const DashboardCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyCustomerForm);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const fetchCustomers = useCallback(async (keyword = '') => {
    setLoading(true);
    try {
      const params = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
      const { data } = await api.get(`/users/customers${params}`);
      setCustomers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers(search);
  };
  const handleChange = (e) => {
  const { name, value } = e.target;
  setForm(f => ({ ...f, [name]: value }));
};

const handleAddCustomer = async (e) => {
  e.preventDefault();
  setAddError('');
  setAddSuccess('');

  if (!form.name.trim()) {
    setAddError('Name is required');
    return;
  }
  if (!form.email.trim() && !form.phone.trim()) {
    setAddError('Please provide either an email or a phone number');
    return;
  }

  setAddLoading(true);
  try {
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password || undefined,
      address: {
        street: form.street,
        city: form.city,
        state: form.state,
        pincode: form.pincode
      }
    };
    const { data } = await api.post('/users/customers', payload);
    setAddSuccess(
      data.temporaryPassword
        ? `Customer created. Temporary password: ${data.temporaryPassword}`
        : 'Customer created successfully'
    );
    setForm(emptyCustomerForm);
    fetchCustomers();
    setTimeout(() => {
      setShowAddForm(false);
      setAddSuccess('');
    }, 3000);
  } catch (err) {
    setAddError(err.response?.data?.message || 'Failed to create customer');
  } finally {
    setAddLoading(false);
  }
};

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalCreditOutstanding = customers.reduce((sum, c) => sum + c.creditOutstanding, 0);

  return (
    <div>
<div className="dash-header">
  <div>
    <h1>Customers</h1>
    <p className="text-muted">{totalCustomers} registered customers</p>
  </div>
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    <button
      className="btn btn-ghost"
      onClick={() => exportCustomersToExcel(customers)}
      disabled={customers.length === 0}
    >
      ⬇ Export Excel
    </button>
    <button
      className="btn btn-ghost"
      onClick={() => exportCustomersToPDF(customers)}
      disabled={customers.length === 0}
    >
      ⬇ Export PDF
    </button>
    <Link to="/dashboard/billing" className="btn btn-amber">+ New sale (bill customer)</Link>
    <button className="btn btn-primary" onClick={() => { setShowAddForm(v => !v); setAddError(''); setAddSuccess(''); }}>
      + Add customer
    </button>
  </div>
</div>

{showAddForm && (
  <div className="card product-form">
    <h2>Add new customer</h2>
    {addError && <div className="error-banner">{addError}</div>}
    {addSuccess && <div className="success-banner">{addSuccess}</div>}
    <form onSubmit={handleAddCustomer}>
      <div className="field-grid">
        <div className="field">
          <label className="label">Full name</label>
          <input className="input" name="name" required value={form.name} onChange={handleChange} />
        </div>
       <div className="field">
  <label className="label">Email (optional)</label>
  <input
    className="input"
    type="email"
    name="email"
    placeholder="Leave blank if customer has no email"
    value={form.email}
    onChange={handleChange}
  />
</div>
<div className="field">
  <label className="label">Phone</label>
  <input
    className="input"
    name="phone"
    placeholder="Required if no email is provided"
    value={form.phone}
    onChange={handleChange}
  />
</div>
        <div className="field">
          <label className="label">Password (optional)</label>
          <input className="input" type="text" name="password" placeholder="Leave blank to auto-generate" value={form.password} onChange={handleChange} />
        </div>
        <div className="field">
          <label className="label">Street</label>
          <input className="input" name="street" value={form.street} onChange={handleChange} />
        </div>
        <div className="field">
          <label className="label">City</label>
          <input className="input" name="city" value={form.city} onChange={handleChange} />
        </div>
        <div className="field">
          <label className="label">State</label>
          <input className="input" name="state" value={form.state} onChange={handleChange} />
        </div>
        <div className="field">
          <label className="label">Pincode</label>
          <input className="input" name="pincode" value={form.pincode} onChange={handleChange} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-primary" type="submit" disabled={addLoading}>
          {addLoading ? 'Creating...' : 'Create customer'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
      </div>
    </form>
  </div>
)}

      <div className="stat-grid">
        <StatCard label="Total Customers" value={totalCustomers} tone="cyan" />
        <StatCard label="Total Revenue from Customers" value={formatCurrency(totalRevenue)} tone="green" />
        <StatCard label="Credit Outstanding" value={formatCurrency(totalCreditOutstanding)} tone="amber" />
      </div>

      <form onSubmit={handleSearch} className="customer-search">
      <input
  className="input"
  placeholder="Search by name, email, phone, or address..."
  value={search}
  onChange={e => setSearch(e.target.value)}
/>
        <button className="btn btn-primary btn-sm" type="submit">Search</button>
        {search && (
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() => { setSearch(''); fetchCustomers(''); }}
          >
            Clear
          </button>
        )}
      </form>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div className="empty-state">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="empty-state">No customers found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Credit Due</th>
                <th>Last Order</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                 <td className="text-muted">{c.email || '—'}</td>
                  <td className="text-muted">{c.phone || '-'}</td>
                  <td className="mono">{c.totalOrders}</td>
                  <td className="mono">{formatCurrency(c.totalSpent)}</td>
                  <td className="mono" style={{ color: c.creditOutstanding > 0 ? 'var(--accent-amber)' : undefined }}>
                    {formatCurrency(c.creditOutstanding)}
                  </td>
                  <td className="text-muted">{c.lastOrderDate ? formatDate(c.lastOrderDate) : '-'}</td>
                  <td className="text-muted">{formatDate(c.createdAt)}</td>
                  <td>
                    <Link to={`/dashboard/customers/${c._id}`} className="btn btn-ghost btn-sm">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DashboardCustomers;
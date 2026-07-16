import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/format';
import StatCard from '../components/StatCard';
import './DashboardCustomers.css';

const DashboardCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
      </div>

      <div className="stat-grid">
        <StatCard label="Total Customers" value={totalCustomers} tone="cyan" />
        <StatCard label="Total Revenue from Customers" value={formatCurrency(totalRevenue)} tone="green" />
        <StatCard label="Credit Outstanding" value={formatCurrency(totalCreditOutstanding)} tone="amber" />
      </div>

      <form onSubmit={handleSearch} className="customer-search">
        <input
          className="input"
          placeholder="Search by name, email, or phone..."
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
                  <td className="text-muted">{c.email}</td>
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
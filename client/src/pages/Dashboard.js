import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import StatCard from '../components/StatCard';
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from '../utils/format';
import './Dashboard.css';

const COLORS = ['#00D9C0', '#FFB627', '#5B9DFF', '#4ADE80', '#FF5C5C', '#C792EA', '#5C6E7A'];

const statusTag = (status) => {
  const map = { paid: 'tag-green', partial: 'tag-amber', unpaid: 'tag-muted', overdue: 'tag-red' };
  return map[status] || 'tag-muted';
};

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [days, setDays] = useState(14);

  useEffect(() => {
    api.get('/dashboard/summary').then(res => setSummary(res.data));
    api.get('/dashboard/top-products?limit=5').then(res => setTopProducts(res.data));
    api.get('/dashboard/category-breakdown').then(res => setCategoryData(res.data));
    api.get('/dashboard/recent-orders?limit=8').then(res => setRecentOrders(res.data));
  }, []);

  useEffect(() => {
    api.get(`/dashboard/sales-trend?days=${days}`).then(res => setTrend(res.data));
  }, [days]);

  if (!summary) return <div className="empty-state">Loading dashboard...</div>;

  const paymentTotals = summary.paymentBreakdown.reduce((acc, p) => {
    acc[p._id] = p.total;
    return acc;
  }, {});

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="text-muted">Live sales, billing, and inventory snapshot</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Revenue" value={formatCurrency(summary.totalRevenue)} sub={`${summary.totalOrders} total orders`} tone="cyan" />
        <StatCard label="Today's Revenue" value={formatCurrency(summary.todayRevenue)} sub={`${summary.todayOrders} orders today`} tone="green" />
        <StatCard label="Credit Outstanding" value={formatCurrency(summary.creditOutstanding)} sub={`${summary.creditInvoiceCount} unpaid invoices`} tone="amber" />
        <StatCard label="Low Stock Items" value={summary.lowStockCount} sub={`${summary.totalProducts} products active`} tone={summary.lowStockCount > 0 ? 'red' : 'default'} />
      </div>

      <div className="dash-grid">
        <div className="card chart-card chart-card--wide">
          <div className="chart-card__header">
            <h2>Sales trend</h2>
            <div className="chart-toggle">
              {[7, 14, 30].map(d => (
                <button key={d} className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setDays(d)}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D9C0" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#00D9C0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#232E38" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#5C6E7A', fontSize: 11 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5C6E7A', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: '#1A222B', border: '1px solid #232E38', borderRadius: 8, fontSize: 13 }}
                labelStyle={{ color: '#93A4B0' }}
                formatter={(value, name) => name === 'revenue' ? [formatCurrency(value), 'Revenue'] : [value, 'Orders']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#00D9C0" fill="url(#revenueGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h2>Payment methods</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={summary.paymentBreakdown}
                dataKey="total"
                nameKey="_id"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {summary.paymentBreakdown.map((entry, index) => (
                  <Cell key={entry._id} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1A222B', border: '1px solid #232E38', borderRadius: 8, fontSize: 13 }}
                formatter={(value, name) => [formatCurrency(value), name]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="payment-mini-stats">
            <div className="mono">Cash: {formatCurrency(paymentTotals.cash || 0)}</div>
            <div className="mono">Credit: {formatCurrency(paymentTotals.credit || 0)}</div>
          </div>
        </div>

        <div className="card chart-card">
          <h2>Top selling products</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232E38" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#5C6E7A', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#93A4B0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1A222B', border: '1px solid #232E38', borderRadius: 8, fontSize: 13 }}
                formatter={(value) => [value, 'Units sold']}
              />
              <Bar dataKey="unitsSold" fill="#FFB627" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h2>Revenue by category</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="revenue"
                nameKey="_id"
                outerRadius={85}
                label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={entry._id} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1A222B', border: '1px solid #232E38', borderRadius: 8, fontSize: 13 }}
                formatter={(value, name) => [formatCurrency(value), name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card chart-card--wide">
          <div className="chart-card__header">
            <h2>Recent orders</h2>
            <Link to="/dashboard/orders" className="text-muted">View all &rarr;</Link>
          </div>
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Method</th>
                <th>Status</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order._id}>
                  <td className="mono"><Link to={`/orders/${order._id}`}>{order.invoiceNumber}</Link></td>
                  <td>{order.customerName}</td>
                 <td><span className="tag tag-cyan">{getPaymentMethodLabel(order)}</span></td>
                  <td><span className={`tag ${statusTag(order.payment.status)}`}>{order.payment.status}</span></td>
                  <td className="mono">{formatCurrency(order.grandTotal)}</td>
                  <td className="text-muted">{formatDateTime(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

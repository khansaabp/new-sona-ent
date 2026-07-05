import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/format';
import StatCard from '../components/StatCard';

const statusTag = (status) => {
  const map = { paid: 'tag-green', partial: 'tag-amber', unpaid: 'tag-muted', overdue: 'tag-red' };
  return map[status] || 'tag-muted';
};

const DashboardCredit = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/orders/meta/credit-outstanding').then(res => setData(res.data));
  }, []);

  if (!data) return <div className="empty-state">Loading credit accounts...</div>;

  const overdueCount = data.orders.filter(o => o.payment.status === 'overdue').length;

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1>Credit Accounts</h1>
          <p className="text-muted">Accounts receivable from "bill now, pay later" invoices</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Outstanding" value={formatCurrency(data.totalOutstanding)} tone="amber" />
        <StatCard label="Open Credit Invoices" value={data.orders.length} tone="cyan" />
        <StatCard label="Overdue Invoices" value={overdueCount} tone={overdueCount > 0 ? 'red' : 'default'} />
      </div>

      <div className="card" style={{ overflowX: 'auto', marginTop: 8 }}>
        {data.orders.length === 0 ? (
          <div className="empty-state">No outstanding credit invoices. 🎉</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Due Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map(order => (
                <tr key={order._id}>
                  <td className="mono">{order.invoiceNumber}</td>
                  <td>{order.customerName}</td>
                  <td className="text-muted">{order.customer?.phone || '-'}</td>
                  <td className="mono">{formatCurrency(order.grandTotal)}</td>
                  <td className="mono">{formatCurrency(order.payment.amountPaid)}</td>
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{formatCurrency(order.payment.amountDue)}</td>
                  <td className="text-muted">{formatDate(order.payment.dueDate)}</td>
                  <td><span className={`tag ${statusTag(order.payment.status)}`}>{order.payment.status}</span></td>
                  <td><Link to={`/orders/${order._id}`} className="btn btn-ghost btn-sm">Settle</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DashboardCredit;

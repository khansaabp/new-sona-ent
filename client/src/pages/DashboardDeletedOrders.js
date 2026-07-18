import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDateTime } from '../utils/format';

const DashboardDeletedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeleted = () => {
    setLoading(true);
    api.get('/orders/meta/deleted')
      .then(res => setOrders(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const handleRestore = async (id) => {
    try {
      await api.put(`/orders/${id}/restore`);
      fetchDeleted();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restore invoice');
    }
  };

  const handlePermanentDelete = async (id, invoiceNumber) => {
    if (!window.confirm(`Permanently delete invoice ${invoiceNumber}? This cannot be undone.`)) return;
    try {
      await api.delete(`/orders/${id}/permanent`);
      fetchDeleted();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to permanently delete invoice');
    }
  };

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1>Deleted Invoices</h1>
          <p className="text-muted">{orders.length} invoice{orders.length !== 1 ? 's' : ''} in trash</p>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">Trash is empty. 🎉</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Deleted By</th>
                <th>Deleted On</th>
                <th>Reason</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td className="mono">{order.invoiceNumber}</td>
                  <td>{order.customer?.name || order.customerName}</td>
                  <td className="mono">{formatCurrency(order.grandTotal)}</td>
                  <td className="text-muted">{order.deletedBy?.name || '-'}</td>
                  <td className="text-muted">{formatDateTime(order.deletedAt)}</td>
                  <td className="text-muted">{order.deleteReason || '-'}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleRestore(order._id)}>
                      Restore
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handlePermanentDelete(order._id, order.invoiceNumber)}
                    >
                      Delete forever
                    </button>
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

export default DashboardDeletedOrders;
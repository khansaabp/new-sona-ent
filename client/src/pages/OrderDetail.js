import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, formatDateTime, getPaymentMethodLabel } from '../utils/format';
import './Invoice.css';

const statusTag = (status) => {
  const map = { paid: 'tag-green', partial: 'tag-amber', unpaid: 'tag-muted', overdue: 'tag-red' };
  return map[status] || 'tag-muted';
};
// Calculate CGST and SGST from GST-inclusive price
const calculateGSTBreakdown = (items) => {
  let taxableValue = 0;
  let totalCGST = 0;
  let totalSGST = 0;

  items.forEach(item => {
    const rate = item.taxRate || 0;
    const lineTotal = item.price * item.quantity;

    if (rate > 0) {
      // Extract GST from inclusive price
      const gstAmount = (lineTotal * rate) / (100 + rate);
      const taxable = lineTotal - gstAmount;
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;

      taxableValue += taxable;
      totalCGST += cgst;
      totalSGST += sgst;
    } else {
      // Zero-rated item — full amount is the "value", no tax portion
      taxableValue += lineTotal;
    }
  });

  const totalGST = Math.round((totalCGST + totalSGST) * 100) / 100;

  return {
    taxableValue: Math.round(taxableValue * 100) / 100,
    cgst: Math.round(totalCGST * 100) / 100,
    sgst: Math.round(totalSGST * 100) / 100,
    totalGST,
    isTaxable: totalGST > 0 // false if every item in the order is 0% GST
  };
};

const OrderDetail = () => {
 const { id } = useParams();
const { user } = useAuth();
const navigate = useNavigate();
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [deleteReason, setDeleteReason] = useState('');
const [deleteLoading, setDeleteLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const gstBreakdown = order ? calculateGSTBreakdown(order.items) : null;
  const [payLoading, setPayLoading] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(false);
const [newInvoiceNumber, setNewInvoiceNumber] = useState('');
const [invoiceEditLoading, setInvoiceEditLoading] = useState(false);
const [invoiceEditError, setInvoiceEditError] = useState('');
const [invoiceEditSuccess, setInvoiceEditSuccess] = useState('');

  const fetchOrder = () => {
    api.get(`/orders/${id}`).then(res => setOrder(res.data)).catch(err => setError(err.response?.data?.message || 'Order not found'));
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <div className="page-container empty-state">{error}</div>;
if (!order) return <div className="page-container empty-state">Loading invoice...</div>;

// const gstBreakdown = calculateGSTBreakdown(order.items);

  const isStaff = user?.role === 'admin' || user?.role === 'staff';

  const handleEditInvoiceNumber = async () => {
  setInvoiceEditError('');
  setInvoiceEditSuccess('');
  setInvoiceEditLoading(true);
  try {
    const { data } = await api.put(`/orders/${id}/invoice-number`, {
      invoiceNumber: newInvoiceNumber
    });
    setInvoiceEditSuccess(data.message);
    setEditingInvoice(false);
    fetchOrder(); // refresh order with new invoice number
  } catch (err) {
    setInvoiceEditError(
      err.response?.data?.message || 'Failed to update invoice number'
    );
  } finally {
    setInvoiceEditLoading(false);
  }
};
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
const handleDeleteInvoice = async () => {
  setDeleteLoading(true);
  try {
    await api.delete(`/orders/${id}`, { data: { reason: deleteReason } });
    navigate('/dashboard/orders', { replace: true });
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to delete invoice');
  } finally {
    setDeleteLoading(false);
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
      <span className="brand__text">New<span className="brand__accent">SonaEnterprises</span></span>
    </div>
    {gstBreakdown.isTaxable && (
      <div className="text-muted">GSTIN: 27ABCDE1234F1Z5</div>
    )}
    <div className="text-muted">nagar parishad complex,akola road, Hingoli, Maharashtra, India.</div>
      <div className="text-muted">8483094199</div>
       <div className="text-muted">9404866766</div>
    <div className="invoice__doc-type">
      {gstBreakdown.isTaxable ? 'TAX INVOICE' : 'BILL OF SALE'}
    </div>
  </div>
  <div className="invoice__meta">
  {/* Invoice number display and edit */}
  {!editingInvoice ? (
    <div className="invoice__number-row">
      <h2 className="mono">{order.invoiceNumber}</h2>
      {user?.role === 'admin' && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setNewInvoiceNumber(order.invoiceNumber);
            setEditingInvoice(true);
            setInvoiceEditError('');
            setInvoiceEditSuccess('');
          }}
          title="Edit invoice number"
        >
          ✎ Edit
        </button>
      )}
    </div>
  ) : (
    <div className="invoice__number-edit">
      <input
        className="input"
        value={newInvoiceNumber}
        onChange={e => setNewInvoiceNumber(e.target.value.toUpperCase())}
        placeholder="e.g. INV-20240615-0042"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 14 }}
        autoFocus
      />
      {invoiceEditError && (
        <div className="error-banner" style={{ marginTop: 8 }}>
          {invoiceEditError}
        </div>
      )}
      <div className="invoice__number-edit-actions">
        <button
          className="btn btn-primary btn-sm"
          onClick={handleEditInvoiceNumber}
          disabled={invoiceEditLoading || !newInvoiceNumber.trim()}
        >
          {invoiceEditLoading ? 'Saving...' : 'Save'}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setEditingInvoice(false);
            setInvoiceEditError('');
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )}

  {invoiceEditSuccess && (
    <div className="success-banner" style={{ marginTop: 8 }}>
      {invoiceEditSuccess}
    </div>
  )}

  <div className="text-muted">{formatDateTime(order.createdAt)}</div>
            <div style={{ marginTop: 8 }}>
             <span className={`tag ${statusTag(order.payment.status)}`}>{order.payment.status.toUpperCase()}</span>{' '}
<span className="tag tag-cyan">{getPaymentMethodLabel(order).toUpperCase()}</span>{' '}
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
      {gstBreakdown.isTaxable && <th>Tax %</th>}
      <th>Line Total</th>
    </tr>
  </thead>
  <tbody>
    {order.items.map(item => (
      <tr key={item.sku}>
        <td>
          {item.name}
          {item.priceOverridden && (
            <span className="tag tag-amber" style={{ marginLeft: 8, fontSize: 10 }}>
              Custom price
            </span>
          )}
        </td>
        <td className="mono text-muted">{item.sku}</td>
        <td className="mono">{item.quantity}</td>
        <td className="mono">
          {formatCurrency(item.price)}
          {item.priceOverridden && item.originalPrice && (
            <div className="text-muted" style={{ fontSize: 11, textDecoration: 'line-through' }}>
              {formatCurrency(item.originalPrice)}
            </div>
          )}
        </td>
        {gstBreakdown.isTaxable && <td className="mono">{item.taxRate}%</td>}
        <td className="mono">{formatCurrency(item.lineTotal)}</td>
      </tr>
    ))}
  </tbody>
</table>
      {gstBreakdown.isTaxable && (
  <div className="invoice__gst-table">
    {/* <h4 className="invoice__gst-title">GST Breakdown</h4> */}
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Taxable Value</th>
          <th>GST Rate</th>
          <th>CGST</th>
          <th>SGST</th>
          <th>Total GST</th>
        </tr>
      </thead>
      <tbody>
        {order.items.filter(item => (item.taxRate || 0) > 0).map(item => {
          const rate = item.taxRate;
          const lineTotal = item.price * item.quantity;
          const gstAmt = (lineTotal * rate) / (100 + rate);
          const taxable = lineTotal - gstAmt;
          const cgst = gstAmt / 2;
          const sgst = gstAmt / 2;
          return (
            <tr key={item.sku}>
              <td>{item.name}</td>
              <td className="mono">{formatCurrency(taxable)}</td>
              <td className="mono">{rate}%</td>
              <td className="mono">{formatCurrency(cgst)}</td>
              <td className="mono">{formatCurrency(sgst)}</td>
              <td className="mono">{formatCurrency(gstAmt)}</td>
            </tr>
          );
        })}
        <tr className="invoice__gst-total-row">
          <td><strong>Total</strong></td>
          <td className="mono"><strong>{formatCurrency(gstBreakdown.taxableValue)}</strong></td>
          <td></td>
          <td className="mono"><strong>{formatCurrency(gstBreakdown.cgst)}</strong></td>
          <td className="mono"><strong>{formatCurrency(gstBreakdown.sgst)}</strong></td>
          <td className="mono"><strong>{formatCurrency(gstBreakdown.totalGST)}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>
)}

<div className="invoice__totals">

          <div className="invoice__totals-row">
            <span className="text-secondary">Subtotal</span>
            <span className="mono">{formatCurrency(order.subtotal)}</span>
          </div>
{gstBreakdown.isTaxable ? (
  <>
    <div className="invoice__totals-row">
      <span className="text-secondary">Taxable Value</span>
      <span className="mono">{formatCurrency(gstBreakdown.taxableValue)}</span>
    </div>
    <div className="invoice__totals-row">
      <span className="text-secondary">CGST</span>
      <span className="mono">{formatCurrency(gstBreakdown.cgst)}</span>
    </div>
    <div className="invoice__totals-row">
      <span className="text-secondary">SGST</span>
      <span className="mono">{formatCurrency(gstBreakdown.sgst)}</span>
    </div>
    <div className="invoice__totals-row">
      <span className="text-secondary">Total GST</span>
      <span className="mono">{formatCurrency(gstBreakdown.totalGST)}</span>
    </div>
  </>
) : (
  <div className="invoice__totals-row">
    <span className="text-secondary">Amount</span>
    <span className="mono">{formatCurrency(gstBreakdown.taxableValue)}</span>
  </div>
)}
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
  {user?.role === 'admin' && (
    <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
      Delete invoice
    </button>
  )}
  <button className="btn btn-ghost" onClick={() => window.print()}>Print invoice</button>
</div>

{showDeleteConfirm && (
  <div className="delete-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
    <div className="delete-modal card" onClick={e => e.stopPropagation()}>
      <h3>Delete Invoice {order.invoiceNumber}?</h3>
      <p className="text-secondary" style={{ marginBottom: 16 }}>
        This will remove the invoice from all reports and dashboards, and restore
        {' '}{order.items.reduce((sum, i) => sum + i.quantity, 0)} unit(s) back to inventory stock.
        The invoice can be recovered later from the Deleted Invoices page.
      </p>
      <div className="field">
        <label className="label">Reason for deletion (optional)</label>
        <input
          className="input"
          value={deleteReason}
          onChange={e => setDeleteReason(e.target.value)}
          placeholder="e.g. Duplicate entry, customer cancelled, billing error"
        />
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button className="btn btn-danger" onClick={handleDeleteInvoice} disabled={deleteLoading}>
          {deleteLoading ? 'Deleting...' : 'Yes, delete invoice'}
        </button>
        <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default OrderDetail;

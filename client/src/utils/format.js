export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(value || 0);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
// Returns the correct display label for a payment method based on order type
export const getPaymentMethodLabel = (order) => {
  if (!order?.payment?.method) return '';

  if (order.payment.method === 'cash' && order.orderType === 'online') {
    return 'COD';
  }

  const labels = {
    cash: 'Cash',
    credit: 'Credit',
    card: 'Card',
    upi: 'UPI',
    netbanking: 'Netbanking'
  };

  return labels[order.payment.method] || order.payment.method;
};
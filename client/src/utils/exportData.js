import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './format';

// Export customers to Excel (.xlsx)
export const exportCustomersToExcel = (customers, shopName = 'New Sona Enterprises') => {
  const rows = customers.map(c => ({
    'Name': c.name,
    'Email': c.email,
    'Phone': c.phone || '-',
    'Total Orders': c.totalOrders,
    'Total Spent (₹)': c.totalSpent,
    'Credit Outstanding (₹)': c.creditOutstanding,
    'Last Order Date': c.lastOrderDate ? formatDate(c.lastOrderDate) : '-',
    'Joined On': formatDate(c.createdAt),
    'Status': c.isActive ? 'Active' : 'Inactive'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto column widths
  worksheet['!cols'] = [
    { wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 12 },
    { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 10 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');

  const fileName = `${shopName.replace(/\s+/g, '-')}-Customers-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Export customers to PDF
export const exportCustomersToPDF = (customers, shopName = 'New Sona Enterprises') => {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Header
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(shopName, 14, 16);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Customer Directory Report', 14, 23);
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 29);
  doc.text(`Total Customers: ${customers.length}`, 14, 34);

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalCredit = customers.reduce((sum, c) => sum + c.creditOutstanding, 0);
  doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}   |   Total Credit Outstanding: ${formatCurrency(totalCredit)}`, 14, 39);

  // Table
  autoTable(doc, {
    startY: 45,
    head: [['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Credit Due', 'Last Order', 'Joined', 'Status']],
    body: customers.map(c => [
      c.name,
      c.email,
      c.phone || '-',
      c.totalOrders,
      formatCurrency(c.totalSpent),
      formatCurrency(c.creditOutstanding),
      c.lastOrderDate ? formatDate(c.lastOrderDate) : '-',
      formatDate(c.createdAt),
      c.isActive ? 'Active' : 'Inactive'
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [0, 148, 133], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 248] },
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' },
      3: { halign: 'center' }
    }
  });

  const fileName = `${shopName.replace(/\s+/g, '-')}-Customers-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

// Export a single customer's full profile + order history to PDF
export const exportCustomerProfileToPDF = (customer, orders, stats, shopName = 'New Sona Enterprises') => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(shopName, 14, 16);

  doc.setFontSize(12);
  doc.text('Customer Profile', 14, 24);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  let y = 34;
  doc.text(`Name: ${customer.name}`, 14, y); y += 6;
  doc.text(`Email: ${customer.email}`, 14, y); y += 6;
  doc.text(`Phone: ${customer.phone || 'Not provided'}`, 14, y); y += 6;
  if (customer.address?.street) {
    doc.text(
      `Address: ${customer.address.street}, ${customer.address.city}, ${customer.address.state} ${customer.address.pincode}`,
      14, y
    );
    y += 6;
  }
  doc.text(`Customer since: ${formatDate(customer.createdAt)}`, 14, y); y += 10;

  doc.setFont(undefined, 'bold');
  doc.text(
    `Total Orders: ${stats.totalOrders}   |   Total Spent: ${formatCurrency(stats.totalSpent)}   |   Credit Due: ${formatCurrency(stats.creditOutstanding)}`,
    14, y
  );
  y += 6;

  autoTable(doc, {
    startY: y + 4,
    head: [['Invoice', 'Date', 'Items', 'Method', 'Payment Status', 'Order Status', 'Total']],
    body: orders.map(o => [
      o.invoiceNumber,
      formatDate(o.createdAt),
      o.items.length,
      o.payment.method.toUpperCase(),
      o.payment.status,
      o.orderStatus,
      formatCurrency(o.grandTotal)
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [0, 148, 133], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 248] },
    columnStyles: { 6: { halign: 'right' } }
  });

  const fileName = `${customer.name.replace(/\s+/g, '-')}-Profile-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};
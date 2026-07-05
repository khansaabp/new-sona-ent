seed
# ElectroShop — MERN Consumer Electronics Store

A full-stack e-commerce application for a retail consumer electronics shop, built with MongoDB, Express, React, and Node.js (MERN). Includes online catalog browsing, a shopping cart, checkout with **cash and credit billing**, GST-compliant invoices, and a **role-based interactive dashboard** with sales analytics.

## Features

### Storefront
- Product catalog with search, category/brand filters, sorting, and pagination
- Product detail pages with specifications, stock status, pricing/discounts
- Cart and checkout flow

### Billing (Cash & Credit)
- Multiple payment methods at checkout: **Cash, UPI, Card, Credit Account**
- Credit billing: configurable credit term (15/30/45/60 days), optional advance payment, automatic due-date calculation, and balance-due tracking
- Auto-generated GST invoices (`INV-YYYYMMDD-XXXX`) with printable invoice view
- Staff/admin can record partial or full payments against outstanding credit invoices
- Order/payment status tracked: paid, partial, unpaid, overdue

### Interactive Dashboard (Admin/Staff)
- Revenue, today's revenue, credit outstanding, low-stock alerts
- Sales trend area chart (7/14/30 day toggle)
- Payment method breakdown (pie chart)
- Top-selling products (bar chart)
- Revenue by category (pie chart)
- Recent orders feed
- Orders & billing management with status updates and filters
- Credit accounts (accounts receivable) view with payment recording
- Inventory management (add/edit/remove products, low-stock filter)

## Tech Stack
- **Frontend:** React 18, React Router, Recharts, Axios
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB
- **Auth:** JWT + bcrypt, role-based (customer / staff / admin)

## Project Structure
```
electro-shop/
├── server/              # Express API
│   ├── config/          # DB connection + seed script
│   ├── models/          # User, Product, Order
│   ├── controllers/      # Business logic (auth, products, orders, dashboard)
│   ├── routes/           # Express routers
│   ├── middleware/       # Auth + error handling
│   └── server.js
└── client/              # React app
    └── src/
        ├── components/   # Header, Footer, ProductCard, DashboardSidebar, etc.
        ├── pages/         # Home, Shop, Cart, Checkout, Orders, Dashboard, etc.
        ├── context/       # Auth + Cart context
        └── utils/         # API client, formatters
```

## Setup

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally (or a connection string to MongoDB Atlas)

### 2. Backend setup
```bash
cd server
cp .env.example .env     # edit MONGO_URI / JWT_SECRET as needed
npm install
npm run seed              # populates sample products + demo users
npm run dev                # starts API on http://localhost:5000
```

### 3. Frontend setup
```bash
cd client
npm install
npm start                  # starts React app on http://localhost:3000
```

The React app expects the API at `http://localhost:5000/api` by default. To override, set `REACT_APP_API_URL` in a `.env` file inside `client/`.

## Demo Accounts (after running `npm run seed`)
| Role     | Email                     | Password    |
|----------|---------------------------|--------------|
| Admin    | admin@electroshop.com     | admin123     |
| Staff    | staff@electroshop.com     | staff123     |
| Customer | customer@example.com      | customer123  |

Admin and Staff accounts can access `/dashboard`. Customers can browse, place orders (cash/credit/UPI/card), and view their invoices under "My Orders".

## How Cash vs Credit Billing Works
1. At checkout, the customer/staff selects a payment method.
2. **Cash / UPI / Card:** the order is marked `paid` immediately, `amountPaid = grandTotal`.
3. **Credit Account:** the customer selects a credit term (e.g. 30 days), optionally pays an advance. The system calculates a due date and `amountDue = grandTotal - amountPaid`. Status is `unpaid`, `partial`, or `overdue` based on payments and due date.
4. Staff/Admin can record additional payments against any credit invoice from the invoice page or the **Credit Accounts** dashboard, which recalculates the balance and status automatically.

## Notes
- Stock is decremented at order time and validated against available inventory.
- All monetary values are stored/displayed in INR with GST calculated per product (`taxRate` field, default 18%).
- The dashboard routes (`/api/dashboard/*`) and inventory write routes are restricted to `admin`/`staff` roles via middleware.

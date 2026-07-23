import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import DashboardLayout from './pages/DashboardLayout';
import Dashboard from './pages/Dashboard';
import DashboardOrders from './pages/DashboardOrders';
import DashboardCredit from './pages/DashboardCredit';
import DashboardProducts from './pages/DashboardProducts';
import DashboardCustomers from './pages/DashboardCustomers';
import DashboardCustomerDetail from './pages/DashboardCustomerDetail';
import DashboardBilling from './pages/DashboardBilling';
import DashboardDeletedOrders from './pages/DashboardDeletedOrders';
import ForgotPassword from './pages/ForgotPassword';
import DashboardInsights from './pages/DashboardInsights';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="app-shell">
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
<Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute roles={['admin', 'staff']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
<Route path="orders" element={<DashboardOrders />} />
<Route path="credit" element={<DashboardCredit />} />
<Route path="customers" element={<DashboardCustomers />} />
<Route path="customers/:id" element={<DashboardCustomerDetail />} />
<Route path="billing" element={<DashboardBilling />} />
<Route path="products" element={<DashboardProducts />} />
<Route path="deleted-orders" element={<DashboardDeletedOrders />} />
<Route path="insights" element={<DashboardInsights />} />

              </Route>
            </Routes>
            <Footer />
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

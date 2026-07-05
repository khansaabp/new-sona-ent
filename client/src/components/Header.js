import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="brand">
          <span className="brand__mark">⌁</span>
          <span className="brand__text">
            New <span className="brand__accent">Sona Enterprises</span>
          </span>
        </Link>

        <nav className={`site-nav ${menuOpen ? 'site-nav--open' : ''}`}>
          <Link to="/shop" onClick={() => setMenuOpen(false)}>Shop</Link>
          <Link to="/orders" onClick={() => setMenuOpen(false)}>My Orders</Link>
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          )}
        </nav>

        <div className="site-header__actions">
          <Link to="/cart" className="cart-link" aria-label={`Cart, ${itemCount} items`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </Link>

          {user ? (
            <div className="user-menu">
              <span className="user-menu__name">{user.name.split(' ')[0]}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Sign in</Link>
          )}

          <button className="nav-toggle" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

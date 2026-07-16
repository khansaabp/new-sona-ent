import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardSidebar.css';
const links = [
  { to: '/dashboard', label: 'Overview', icon: '◧', exact: true },
  { to: '/dashboard/billing', label: 'New Sale', icon: '⊕' },
  { to: '/dashboard/orders', label: 'Orders & Billing', icon: '▤' },
  { to: '/dashboard/credit', label: 'Credit Accounts', icon: '◔' },
  { to: '/dashboard/customers', label: 'Customers', icon: '◍' },
  { to: '/dashboard/products', label: 'Inventory', icon: '▣' }
];

const DashboardSidebar = () => {
  const { user } = useAuth();

  return (
    <aside className="dash-sidebar">
      <div className="dash-sidebar__role">
        <span className="tag tag-cyan mono">{user?.role?.toUpperCase()}</span>
        <div className="dash-sidebar__name">{user?.name}</div>
      </div>
      <nav className="dash-sidebar__nav">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.exact}
            className={({ isActive }) => `dash-sidebar__link ${isActive ? 'dash-sidebar__link--active' : ''}`}
          >
            <span className="dash-sidebar__icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default DashboardSidebar;

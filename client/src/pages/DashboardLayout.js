import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from '../components/DashboardSidebar';

const DashboardLayout = () => (
  <div className="dashboard-shell">
    <DashboardSidebar />
    <main className="dashboard-main">
      <Outlet />
    </main>
  </div>
);

export default DashboardLayout;

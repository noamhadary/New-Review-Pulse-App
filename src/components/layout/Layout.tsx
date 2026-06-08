import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content — offset for fixed topbar and sidebar */}
      <main
        className="pt-28 md:pr-64 min-h-screen"
        style={{ backgroundColor: '#f8f9fa' }}
      >
        <Outlet />
      </main>
    </div>
  );
}

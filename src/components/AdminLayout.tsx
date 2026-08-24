'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('Admin');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.success && data.data) {
        setUserName(data.data.name);
      }
    }
    fetchSession();
  }, []);

  async function handleLogout() {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        router.push('/login/admin');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  const navItems = [
    { label: '📊 Dashboard', path: '/admin' },
    { label: '📋 All Orders', path: '/admin/orders' },
    { label: '👤 Customers', path: '/admin/customers' },
    { label: '🚚 Delivery Agents', path: '/admin/agents' },
    { label: '🌐 Zones Config', path: '/admin/zones' },
    { label: '📍 Areas/Pincodes', path: '/admin/areas' },
    { label: '💰 Rate Cards', path: '/admin/rate-cards' },
    { label: '💵 COD Charges', path: '/admin/cod-charges' },
  ];

  return (
    <div className="dashboard-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="landing-logo">📦 LMD Admin</div>
        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle Menu"
        >
          ☰
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h2>📦 LMD Admin</h2>
          <p>Logged in as {userName}</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={pathname === item.path ? 'active' : ''}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout}>🚪 Logout</button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

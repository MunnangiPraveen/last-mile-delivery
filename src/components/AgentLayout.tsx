'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('Agent');
  const [availability, setAvailability] = useState('AVAILABLE');
  const [mobileOpen, setMobileOpen] = useState(false);

  async function fetchSession() {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.success && data.data) {
        setUserName(data.data.name);

        // Fetch agent's availability state by listing agents
        const agentProfileRes = await fetch('/api/admin/agents'); // Easy way to get profile details or check availability
        const agentProfileData = await agentProfileRes.json();
        if (agentProfileData.success && agentProfileData.data) {
          const currentAgent = agentProfileData.data.find((a: any) => a.id === data.data.userId);
          if (currentAgent && currentAgent.agentProfile) {
            setAvailability(currentAgent.agentProfile.availability);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching session:', err);
    }
  }

  useEffect(() => {
    fetchSession();
  }, []);

  async function handleAvailabilityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    try {
      const res = await fetch('/api/agent/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setAvailability(newStatus);
      }
    } catch (err) {
      console.error('Failed to update availability:', err);
    }
  }

  async function handleLogout() {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        router.push('/login/agent');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  const navItems = [
    { label: '📊 Dashboard', path: '/agent' },
    { label: '📋 Assigned Deliveries', path: '/agent/orders' },
  ];

  return (
    <div className="dashboard-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="landing-logo">🚚 LMD Agent</div>
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
          <h2>🚚 LMD Agent</h2>
          <p style={{ color: 'var(--gray-300)' }}>{userName}</p>
          <div style={{ marginTop: '0.75rem' }}>
            <label htmlFor="avail-select" style={{ fontSize: 'var(--font-size-xs)', display: 'block', color: 'var(--gray-400)', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              AVAILABILITY STATE
            </label>
            <select
              id="avail-select"
              value={availability}
              onChange={handleAvailabilityChange}
              className="form-select"
              style={{
                background: 'var(--gray-800)',
                color: 'var(--white)',
                borderColor: 'var(--gray-700)',
                padding: '4px 8px',
                fontSize: '12px'
              }}
            >
              <option value="AVAILABLE">🟢 Available</option>
              <option value="BUSY">🟡 Busy</option>
              <option value="OFFLINE">⚫ Offline</option>
            </select>
          </div>
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

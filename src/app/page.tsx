import Link from 'next/link';

export default function Home() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-logo">📦 LMD Tracker</div>
        <Link href="/register" className="btn btn-secondary btn-sm">
          Register
        </Link>
      </header>

      <main className="landing-main">
        <h1>Last-Mile Delivery<br />Tracker</h1>
        <p>
          Professional delivery management platform. Track orders, manage agents,
          and optimize your last-mile delivery operations.
        </p>

        <div className="portal-grid">
          <Link href="/login/customer" className="portal-card">
            <div className="portal-icon">👤</div>
            <h3>Customer Portal</h3>
            <p>Create orders, track deliveries, and manage your shipments.</p>
          </Link>

          <Link href="/login/agent" className="portal-card">
            <div className="portal-icon">🚚</div>
            <h3>Agent Portal</h3>
            <p>View assigned deliveries, update status, and manage availability.</p>
          </Link>

          <Link href="/login/admin" className="portal-card">
            <div className="portal-icon">⚙️</div>
            <h3>Admin Portal</h3>
            <p>Manage zones, rates, agents, and monitor all operations.</p>
          </Link>
        </div>
      </main>

      <footer className="landing-footer">
        &copy; {new Date().getFullYear()} Last-Mile Delivery Tracker. Built for logistics excellence.
      </footer>
    </div>
  );
}

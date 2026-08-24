'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AgentLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Login failed.');
        setLoading(false);
        return;
      }

      if (data.data.role !== 'AGENT') {
        setError('This portal is for delivery agents only. Please use the correct login portal.');
        setLoading(false);
        return;
      }

      router.push(data.data.redirect);
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  function useDemoLogin() {
    setEmail('agent@demo.com');
    setPassword('Agent@123');
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🚚 Delivery Agent Login</h1>
        <p className="subtitle">Sign in to manage your deliveries</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-section">
          <p>Try the demo account</p>
          <button type="button" className="demo-btn" onClick={useDemoLogin}>
            ✨ Use Demo Agent Login
          </button>
        </div>

        <div className="login-links">
          <p>
            <Link href="/login/customer">Customer Login</Link> · <Link href="/login/admin">Admin Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

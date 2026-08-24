'use client';

import { useState, useEffect } from 'react';

export default function CustomerNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
      } else {
        setError(data.error || 'Failed to load notifications');
      }
    } catch {
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function markAllAsRead() {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        // Refresh local state to marked read
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>🔔 Notifications</h1>
          <p>Updates and alerts about your shipments</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn btn-secondary btn-sm">
            Mark all as read
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>All caught up!</h3>
            <p>You don&apos;t have any notifications at the moment.</p>
          </div>
        ) : (
          <div>
            {notifications.map((notif) => (
              <div key={notif.id} className={`notification-item ${notif.isRead ? '' : 'unread'}`}>
                <div className={`notification-dot ${notif.isRead ? 'read' : ''}`}></div>
                <div className="notification-content">
                  <div className="notification-title">{notif.title}</div>
                  <div className="notification-message">{notif.message}</div>
                  <div className="notification-time">
                    {new Date(notif.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

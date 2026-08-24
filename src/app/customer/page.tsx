'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CustomerDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, notificationsRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/notifications')
        ]);

        const ordersData = await ordersRes.json();
        const notificationsData = await notificationsRes.json();

        if (ordersData.success) {
          setOrders(ordersData.data || []);
        } else {
          setError(ordersData.error || 'Failed to fetch orders');
        }

        if (notificationsData.success) {
          setNotifications(notificationsData.data || []);
        }
      } catch (err: any) {
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  // Calculate statistics
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status)).length;
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length;
  const failedOrders = orders.filter(o => o.status === 'FAILED').length;

  const recentOrders = orders.slice(0, 5);
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>📊 Customer Dashboard</h1>
          <p>Overview of your delivery shipments and activity</p>
        </div>
        <Link href="/customer/orders/new" className="btn btn-primary">
          📦 Create New Order
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Shipments</span>
          <span className="stat-value">{totalOrders}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Deliveries</span>
          <span className="stat-value">{activeOrders}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Successful Deliveries</span>
          <span className="stat-value">{deliveredOrders}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Failed Deliveries</span>
          <span className="stat-value">{failedOrders}</span>
        </div>
      </div>

      <div className="detail-grid">
        {/* Recent Orders Card */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3>Recent Orders</h3>
            <Link href="/customer/orders" className="text-sm font-bold">View All &rarr;</Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <p>No orders created yet. Click Create New Order to begin.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tracking #</th>
                    <th>To Address</th>
                    <th>Type</th>
                    <th>Charge</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="clickable-row">
                      <td className="font-mono">
                        <Link href={`/customer/orders/${order.id}`}>
                          {order.trackingNumber}
                        </Link>
                      </td>
                      <td>{order.dropAddress} ({order.dropPincode})</td>
                      <td>{order.orderType}</td>
                      <td>₹{order.totalCharge}</td>
                      <td>
                        <span className={`badge badge-${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notifications Card */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3>Recent Notifications</h3>
            <Link href="/customer/notifications" className="text-sm font-bold">View All &rarr;</Link>
          </div>

          {recentNotifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔔</div>
              <p>No notifications yet.</p>
            </div>
          ) : (
            <div>
              {recentNotifications.map((notif) => (
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
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AgentDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.success) {
          setOrders(data.data || []);
        } else {
          setError(data.error || 'Failed to fetch orders');
        }
      } catch (err: any) {
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  // Calculate statistics
  const totalAssigned = orders.length;
  const pendingDeliveries = orders.filter(o => o.status === 'CREATED').length;
  const pickedUpDeliveries = orders.filter(o => o.status === 'PICKED_UP').length;
  const transitDeliveries = orders.filter(o => o.status === 'IN_TRANSIT').length;
  const outForDelivery = orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length;
  const deliveredDeliveries = orders.filter(o => o.status === 'DELIVERED').length;
  const failedDeliveries = orders.filter(o => o.status === 'FAILED').length;

  const inTransitCount = pickedUpDeliveries + transitDeliveries;

  // Active orders list (all except Delivered and Failed)
  const activeDeliveries = orders.filter(o => !['DELIVERED', 'FAILED'].includes(o.status));

  return (
    <div>
      <div className="page-header">
        <h1>📊 Agent Dashboard</h1>
        <p>Real-time delivery operations dashboard</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Assigned</span>
          <span className="stat-value">{totalAssigned}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending Pickup</span>
          <span className="stat-value">{pendingDeliveries}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">In Transit</span>
          <span className="stat-value">{inTransitCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Out for Delivery</span>
          <span className="stat-value">{outForDelivery}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Delivered</span>
          <span className="stat-value">{deliveredDeliveries}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Failed</span>
          <span className="stat-value">{failedDeliveries}</span>
        </div>
      </div>

      {/* Active assigned shipments table */}
      <div className="card">
        <h3 className="mb-4">Active Shipments Assigned to You</h3>

        {activeDeliveries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚚</div>
            <h3>No active deliveries</h3>
            <p>You have no active shipments assigned at the moment. Update availability if offline.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tracking Number</th>
                  <th>Pickup Address</th>
                  <th>Drop Address</th>
                  <th>Payment</th>
                  <th>Charge</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeDeliveries.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono">{order.trackingNumber}</td>
                    <td>{order.pickupAddress} ({order.pickupPincode})</td>
                    <td>{order.dropAddress} ({order.dropPincode})</td>
                    <td>{order.paymentType}</td>
                    <td>₹{order.totalCharge}</td>
                    <td>
                      <span className={`badge badge-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <Link href={`/agent/orders/${order.id}`} className="btn btn-primary btn-sm">
                        Process Delivery &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

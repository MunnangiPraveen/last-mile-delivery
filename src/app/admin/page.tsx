'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, customersRes, agentsRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/admin/customers'),
          fetch('/api/admin/agents')
        ]);

        const ordersData = await ordersRes.json();
        const customersData = await customersRes.json();
        const agentsData = await agentsRes.json();

        if (ordersData.success) setOrders(ordersData.data || []);
        if (customersData.success) setCustomers(customersData.data || []);
        if (agentsData.success) setAgents(agentsData.data || []);

        if (!ordersData.success || !customersData.success || !agentsData.success) {
          setError('Failed to load some dashboard data');
        }
      } catch (err: any) {
        setError('Failed to fetch admin stats');
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

  // Today's orders (created since midnight)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter(o => new Date(o.createdAt) >= startOfToday).length;

  const pendingOrders = orders.filter(o => o.status === 'CREATED').length;
  const pickedUpCount = orders.filter(o => o.status === 'PICKED_UP').length;
  const transitCount = orders.filter(o => o.status === 'IN_TRANSIT').length;
  const inTransitOrders = pickedUpCount + transitCount;
  const outForDeliveryOrders = orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length;
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length;
  const failedOrders = orders.filter(o => o.status === 'FAILED').length;

  const totalCustomers = customers.length;
  const totalAgents = agents.length;
  const availableAgents = agents.filter(a => a.agentProfile?.availability === 'AVAILABLE').length;

  // Calculate total revenue
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalCharge, 0);

  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>📊 Admin Control Dashboard</h1>
          <p>System-wide logistics oversight and configurations</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/orders/new" className="btn btn-primary">
            📦 Create Order (On Behalf)
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Main Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Shipments</span>
          <span className="stat-value">{totalOrders}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Today&apos;s Shipments</span>
          <span className="stat-value">{todayOrders}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Customers</span>
          <span className="stat-value">{totalCustomers}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Agents</span>
          <span className="stat-value">{totalAgents} (Available: {availableAgents})</span>
        </div>
      </div>

      {/* Status Stats Grid */}
      <h3 className="mb-4">Operational Status Summary</h3>
      <div className="stats-grid mb-8">
        <div className="stat-card">
          <span className="stat-label">Pending Assign / Pickup</span>
          <span className="stat-value">{pendingOrders}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">In Transit</span>
          <span className="stat-value">{inTransitOrders}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Out for Delivery</span>
          <span className="stat-value">{outForDeliveryOrders}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Delivered Successfully</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>{deliveredOrders}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Failed Deliveries</span>
          <span className="stat-value" style={{ color: 'var(--error)' }}>{failedOrders}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Booked Value</span>
          <span className="stat-value">₹{Math.round(totalRevenue * 100) / 100}</span>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="card">
        <div className="flex-between mb-4">
          <h3>Recent Operations Orders</h3>
          <Link href="/admin/orders" className="text-sm font-bold">View All Operations Orders &rarr;</Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>No orders created in the database yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tracking Number</th>
                  <th>Customer</th>
                  <th>Pickup Pincode</th>
                  <th>Drop Pincode</th>
                  <th>Billable Weight</th>
                  <th>Payment Type</th>
                  <th>Total Surcharge</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono">{order.trackingNumber}</td>
                    <td>{order.customer?.name} ({order.customer?.email})</td>
                    <td>{order.pickupPincode}</td>
                    <td>{order.dropPincode}</td>
                    <td>{order.billableWeight} kg</td>
                    <td>{order.paymentType}</td>
                    <td className="font-bold">₹{order.totalCharge}</td>
                    <td>
                      <span className={`badge badge-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className="btn btn-secondary btn-sm">
                        Manage &amp; Assign
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

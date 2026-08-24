'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminOrdersList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [statusFilter, setStatusFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const [agentsRes, zonesRes] = await Promise.all([
          fetch('/api/admin/agents'),
          fetch('/api/admin/zones')
        ]);
        const agentsData = await agentsRes.json();
        const zonesData = await zonesRes.json();

        if (agentsData.success) setAgents(agentsData.data || []);
        if (zonesData.success) setZones(zonesData.data || []);
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    }
    fetchFilterOptions();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (zoneFilter) params.append('zone', zoneFilter);
      if (agentFilter) params.append('agentId', agentFilter);
      if (typeFilter) params.append('orderType', typeFilter);
      if (paymentFilter) params.append('paymentType', paymentFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      } else {
        setError(data.error || 'Failed to load orders');
      }
    } catch {
      setError('An error occurred while loading orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, zoneFilter, agentFilter, typeFilter, paymentFilter, searchQuery]);

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>📋 All Operations Shipments</h1>
          <p>Search, filter, and assign/manage all orders in the system</p>
        </div>
        <Link href="/admin/orders/new" className="btn btn-primary">
          📦 Create New Order
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters Bar */}
      <div className="card mb-6">
        <h3 className="mb-3">Filter &amp; Search Shipments</h3>
        <div className="filters-bar">
          <div className="form-group mb-0">
            <input
              type="text"
              className="form-input"
              placeholder="Search by Tracking #"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="form-group mb-0">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="CREATED">Created</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div className="form-group mb-0">
            <select
              className="form-select"
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
            >
              <option value="">All Zones</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group mb-0">
            <select
              className="form-select"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
            >
              <option value="">All Agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group mb-0">
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="B2B">B2B</option>
              <option value="B2C">B2C</option>
            </select>
          </div>

          <div className="form-group mb-0">
            <select
              className="form-select"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="">All Payments</option>
              <option value="PREPAID">PREPAID</option>
              <option value="COD">COD</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No orders found</h3>
            <p>No orders matched your search or filters.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tracking Number</th>
                <th>Customer Name</th>
                <th>Pickup Address</th>
                <th>Drop Address</th>
                <th>Billable Wt</th>
                <th>Type</th>
                <th>Payment</th>
                <th>Agent Assigned</th>
                <th>Total Charge</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const assignedAgent = order.assignments?.find((a: any) => a.isActive)?.agent;
                return (
                  <tr key={order.id}>
                    <td className="font-mono">{order.trackingNumber}</td>
                    <td>{order.customer?.name}</td>
                    <td>{order.pickupAddress} ({order.pickupPincode})</td>
                    <td>{order.dropAddress} ({order.dropPincode})</td>
                    <td>{order.billableWeight} kg</td>
                    <td>{order.orderType}</td>
                    <td>{order.paymentType}</td>
                    <td>
                      {assignedAgent ? (
                        <span className="font-bold">{assignedAgent.name}</span>
                      ) : (
                        <span className="text-gray" style={{ fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td className="font-bold">₹{order.totalCharge}</td>
                    <td>
                      <span className={`badge badge-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className="btn btn-secondary btn-sm">
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

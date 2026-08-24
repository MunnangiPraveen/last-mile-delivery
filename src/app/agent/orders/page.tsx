'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AgentOrdersList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setOrders(data.data || []);
      } else {
        setError(data.error || 'Failed to load orders');
      }
    } catch {
      setError('An error occurred while fetching orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, searchQuery]);

  return (
    <div>
      <div className="page-header">
        <h1>📋 Assigned Deliveries</h1>
        <p>Manage and process all assigned shipment deliveries</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters Bar */}
      <div className="card mb-6">
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
            <h3>No assigned deliveries found</h3>
            <p>No shipments match the selected filters.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tracking Number</th>
                <th>Pickup Address</th>
                <th>Drop Address</th>
                <th>Weight (Billable)</th>
                <th>Type</th>
                <th>Payment</th>
                <th>Total Charge</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="font-mono">{order.trackingNumber}</td>
                  <td>{order.pickupAddress} ({order.pickupPincode})</td>
                  <td>{order.dropAddress} ({order.dropPincode})</td>
                  <td>{order.actualWeight} kg ({order.billableWeight} kg)</td>
                  <td>{order.orderType}</td>
                  <td>{order.paymentType}</td>
                  <td className="font-bold">₹{order.totalCharge}</td>
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
  );
}

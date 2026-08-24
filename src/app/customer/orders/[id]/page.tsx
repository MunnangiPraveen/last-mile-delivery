'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function OrderDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reschedule Form States
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  async function fetchOrderDetails() {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
      } else {
        setError(data.error || 'Failed to load order details');
      }
    } catch {
      setError('An error occurred while fetching order details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  async function handleRescheduleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newDate) {
      setRescheduleError('Please select a valid date');
      return;
    }

    setRescheduleError('');
    setRescheduleLoading(true);

    try {
      const res = await fetch(`/api/orders/${id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDate,
          reason: rescheduleReason
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowReschedule(false);
        setNewDate('');
        setRescheduleReason('');
        // Refresh details
        await fetchOrderDetails();
      } else {
        setRescheduleError(data.error || 'Failed to reschedule order');
      }
    } catch {
      setRescheduleError('Connection error, please try again.');
    } finally {
      setRescheduleLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="card">
        <div className="alert alert-error">{error || 'Order not found'}</div>
        <div className="mt-4">
          <Link href="/customer" className="btn btn-secondary">&larr; Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const assignedAgent = order.assignments?.find((a: any) => a.isActive)?.agent;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>📦 Order Details &amp; Tracking</h1>
          <p className="font-mono">Tracking ID: {order.trackingNumber}</p>
        </div>
        <Link href="/customer/orders" className="btn btn-secondary">
          &larr; Back to Orders
        </Link>
      </div>

      <div className="detail-grid">
        {/* Left column - Status, addresses, agent, breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Alert */}
          <div className={`alert ${order.status === 'DELIVERED' ? 'alert-success' : order.status === 'FAILED' ? 'alert-error' : 'alert-info'}`}>
            <span className="font-bold">Current Status: </span>
            <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span>
            {order.status === 'FAILED' && (
              <button
                onClick={() => setShowReschedule(true)}
                className="btn btn-primary btn-sm"
                style={{ marginLeft: '1rem' }}
              >
                🔄 Reschedule Delivery
              </button>
            )}
          </div>

          {/* Reschedule Modal */}
          {showReschedule && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h2>Reschedule Failed Shipment</h2>
                  <button className="modal-close" onClick={() => setShowReschedule(false)}>&times;</button>
                </div>
                {rescheduleError && <div className="alert alert-error">{rescheduleError}</div>}
                <form onSubmit={handleRescheduleSubmit}>
                  <div className="form-group">
                    <label htmlFor="newDate">Preferred Delivery Date *</label>
                    <input
                      id="newDate"
                      type="date"
                      className="form-input"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reason">Reschedule Reason / Instructions</label>
                    <textarea
                      id="reason"
                      className="form-input"
                      rows={3}
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      placeholder="e.g. Call before delivery, drop at gate"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary flex-1" disabled={rescheduleLoading}>
                      {rescheduleLoading ? 'Processing...' : 'Confirm Reschedule'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowReschedule(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Details Card */}
          <div className="card">
            <h3 className="mb-4">Shipment Specifications</h3>
            <div className="detail-row">
              <dt>Pickup Address</dt>
              <dd>{order.pickupAddress} ({order.pickupPincode})</dd>
            </div>
            <div className="detail-row">
              <dt>Drop Address</dt>
              <dd>{order.dropAddress} ({order.dropPincode})</dd>
            </div>
            <div className="detail-row">
              <dt>Pickup Zone</dt>
              <dd>{order.pickupZone?.name || 'Default/Fallback'}</dd>
            </div>
            <div className="detail-row">
              <dt>Drop Zone</dt>
              <dd>{order.dropZone?.name || 'Default/Fallback'}</dd>
            </div>
            <div className="detail-row">
              <dt>Order Type</dt>
              <dd>{order.orderType}</dd>
            </div>
            <div className="detail-row">
              <dt>Payment Method</dt>
              <dd>{order.paymentType}</dd>
            </div>
          </div>

          {/* Package Details */}
          <div className="card">
            <h3 className="mb-4">Package Specifications</h3>
            <div className="detail-row">
              <dt>Actual Weight</dt>
              <dd>{order.actualWeight} kg</dd>
            </div>
            <div className="detail-row">
              <dt>Dimensions (L x B x H)</dt>
              <dd>{order.length} x {order.breadth} x {order.height} cm</dd>
            </div>
            <div className="detail-row">
              <dt>Volumetric Weight</dt>
              <dd>{order.volumetricWeight} kg</dd>
            </div>
            <div className="detail-row">
              <dt>Billable Weight</dt>
              <dd className="font-bold">{order.billableWeight} kg</dd>
            </div>
          </div>

          {/* Agent info */}
          <div className="card">
            <h3 className="mb-4">Delivery Agent Assignment</h3>
            {assignedAgent ? (
              <div>
                <div className="detail-row">
                  <dt>Name</dt>
                  <dd>{assignedAgent.name}</dd>
                </div>
                <div className="detail-row">
                  <dt>Email</dt>
                  <dd>{assignedAgent.email}</dd>
                </div>
              </div>
            ) : (
              <p className="text-gray text-sm">No delivery agent assigned yet. Admin will assign an agent soon.</p>
            )}
          </div>
        </div>

        {/* Right column - Pricing & Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Charge Breakdown */}
          <div className="card">
            <h3 className="mb-4">Pricing Breakdown</h3>
            <div className="charge-breakdown">
              <div className="charge-row">
                <span>Base Delivery Charge:</span>
                <span>₹{order.baseCharge}</span>
              </div>
              <div className="charge-row">
                <span>COD Surcharge:</span>
                <span>₹{order.codSurcharge}</span>
              </div>
              <div className="charge-row total">
                <span>Total Amount Charged:</span>
                <span>₹{order.totalCharge}</span>
              </div>
            </div>
          </div>

          {/* Reschedules list if any */}
          {order.reschedules && order.reschedules.length > 0 && (
            <div className="card">
              <h3 className="mb-4 font-bold">Rescheduling History</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date Requested</th>
                      <th>Target Date</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.reschedules.map((res: any) => (
                      <tr key={res.id}>
                        <td>{new Date(res.createdAt).toLocaleDateString()}</td>
                        <td className="font-bold">{new Date(res.newDate).toLocaleDateString()}</td>
                        <td>{res.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Timeline Card */}
          <div className="card">
            <h3 className="mb-4">Immutable Tracking Timeline</h3>
            {order.trackingHistory?.length === 0 ? (
              <p className="text-gray">No tracking records yet.</p>
            ) : (
              <div className="timeline mt-4">
                {order.trackingHistory.map((item: any, idx: number) => (
                  <div key={item.id} className="timeline-item">
                    <div className={`timeline-dot ${idx === 0 ? 'active' : ''} ${item.newStatus === 'DELIVERED' ? 'delivered' : item.newStatus === 'FAILED' ? 'failed' : ''}`}></div>
                    <div className="timeline-content">
                      <div className="timeline-status">
                        Status updated to: <span className={`badge badge-${item.newStatus.toLowerCase()}`}>{item.newStatus}</span>
                      </div>
                      <div className="timeline-time">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                      <div className="timeline-actor">
                        Updated by: {item.actor?.name} ({item.actor?.role})
                      </div>
                      {item.note && (
                        <div className="timeline-note">
                          Note: &quot;{item.note}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

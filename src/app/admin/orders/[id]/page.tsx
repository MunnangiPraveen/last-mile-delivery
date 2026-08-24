'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function AdminOrderDetails({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<any | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Actions states
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');

  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideNote, setOverrideNote] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideError, setOverrideError] = useState('');

  async function fetchDetails() {
    try {
      const [orderRes, agentsRes] = await Promise.all([
        fetch(`/api/orders/${id}`),
        fetch('/api/admin/agents')
      ]);

      const orderData = await orderRes.json();
      const agentsData = await agentsRes.json();

      if (orderData.success) {
        setOrder(orderData.data);
        setOverrideStatus(orderData.data.status);
      } else {
        setError(orderData.error || 'Failed to load order');
      }

      if (agentsData.success) {
        setAgents(agentsData.data || []);
      }
    } catch {
      setError('An error occurred while loading order details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDetails();
  }, [id]);

  async function handleManualAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAgentId) {
      setAssignError('Please select a delivery agent');
      return;
    }

    setAssignError('');
    setAssignLoading(true);

    try {
      const res = await fetch(`/api/orders/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgentId })
      });

      const data = await res.json();
      if (data.success) {
        setSelectedAgentId('');
        await fetchDetails();
      } else {
        setAssignError(data.error || 'Manual assignment failed');
      }
    } catch {
      setAssignError('Connection error, please try again.');
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleAutoAssign() {
    setAssignError('');
    setAssignLoading(true);

    try {
      const res = await fetch(`/api/orders/${id}/auto-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (data.success) {
        await fetchDetails();
      } else {
        setAssignError(data.error || 'Auto assignment failed');
      }
    } catch (err: any) {
      setAssignError(err.message || 'Connection error');
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleStatusOverride(e: React.FormEvent) {
    e.preventDefault();
    setOverrideError('');
    setOverrideLoading(true);

    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: overrideStatus,
          note: overrideNote.trim() || 'Admin status override'
        })
      });

      const data = await res.json();
      if (data.success) {
        setOverrideNote('');
        await fetchDetails();
      } else {
        setOverrideError(data.error || 'Status override failed');
      }
    } catch {
      setOverrideError('Connection error, please try again.');
    } finally {
      setOverrideLoading(false);
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
          <Link href="/admin" className="btn btn-secondary">&larr; Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const activeAssignment = order.assignments?.find((a: any) => a.isActive);
  const assignedAgent = activeAssignment?.agent;

  // Filter available agents (AVAILABLE or BUSY, excluding OFFLINE)
  const assignableAgents = agents.filter(a => a.agentProfile && a.agentProfile.availability !== 'OFFLINE');

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>⚙️ Manage Order</h1>
          <p className="font-mono">Tracking ID: {order.trackingNumber}</p>
        </div>
        <Link href="/admin/orders" className="btn btn-secondary">
          &larr; Back to Orders
        </Link>
      </div>

      <div className="detail-grid">
        {/* Left Column: Details & Assignments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Panel */}
          <div className="card">
            <h3>Shipment Status</h3>
            <p className="mt-2">
              Current Status: <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span>
            </p>
          </div>

          {/* Manual / Auto Assign Panel */}
          <div className="card">
            <h3>Agent Assignment</h3>

            {assignedAgent ? (
              <div className="alert alert-success mt-2">
                Currently Assigned Agent: <span className="font-bold">{assignedAgent.name}</span> ({assignedAgent.email})
              </div>
            ) : (
              <div className="alert alert-warning mt-2">
                This shipment is currently unassigned.
              </div>
            )}

            {assignError && <div className="alert alert-error mt-2">{assignError}</div>}

            <form onSubmit={handleManualAssign} className="mt-4">
              <div className="form-group">
                <label htmlFor="agent-select">Select Agent to Assign Manually</label>
                <select
                  id="agent-select"
                  className="form-select"
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  disabled={assignLoading}
                >
                  <option value="">-- Choose Agent --</option>
                  {assignableAgents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Workload: {a.agentProfile?.currentWorkload || 0} - {a.agentProfile?.zone?.name || 'No Zone'}) [{a.agentProfile?.availability}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1" disabled={assignLoading}>
                  Assign Agent
                </button>
                <button
                  type="button"
                  onClick={handleAutoAssign}
                  className="btn btn-secondary"
                  disabled={assignLoading}
                >
                  ⚡ Trigger Auto-Assign
                </button>
              </div>
            </form>
          </div>

          {/* Admin Override Panel */}
          <div className="card">
            <h3>Admin Status Override</h3>
            <p className="text-sm text-gray mt-1">Admin status overrides bypass normal lifecycle validations. A tracking record will still be created.</p>

            {overrideError && <div className="alert alert-error mt-2">{overrideError}</div>}

            <form onSubmit={handleStatusOverride} className="mt-4">
              <div className="form-group">
                <label htmlFor="status-select">Select Target Status</label>
                <select
                  id="status-select"
                  className="form-select"
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  disabled={overrideLoading}
                >
                  <option value="CREATED">Created</option>
                  <option value="PICKED_UP">Picked Up</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="override-note">Reason / Note for Override</label>
                <textarea
                  id="override-note"
                  className="form-input"
                  rows={2}
                  placeholder="e.g. Admin override: incorrect scan, manual delivery verification"
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  disabled={overrideLoading}
                />
              </div>

              <button type="submit" className="btn btn-danger btn-block" disabled={overrideLoading}>
                Force Apply Status Override
              </button>
            </form>
          </div>

          {/* Specifications Card */}
          <div className="card">
            <h3>Addresses &amp; Customer info</h3>
            <div className="detail-row mt-4">
              <dt>Customer</dt>
              <dd className="font-bold">{order.customer?.name} ({order.customer?.email})</dd>
            </div>
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
          </div>
        </div>

        {/* Right Column: Pricing, Specs & Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Charge Breakdown */}
          <div className="card">
            <h3>Pricing Breakdown</h3>
            <div className="charge-breakdown mt-4">
              <div className="charge-row">
                <span>Base Charge:</span>
                <span>₹{order.baseCharge}</span>
              </div>
              <div className="charge-row">
                <span>COD Surcharge:</span>
                <span>₹{order.codSurcharge}</span>
              </div>
              <div className="charge-row total">
                <span>Total Charge:</span>
                <span>₹{order.totalCharge}</span>
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="card">
            <h3>Package Details</h3>
            <div className="detail-row mt-4">
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
            <div className="detail-row">
              <dt>Rate Card Type</dt>
              <dd>{order.rateType || 'Custom'}</dd>
            </div>
          </div>

          {/* Rescheduling History */}
          {order.reschedules && order.reschedules.length > 0 && (
            <div className="card">
              <h3>Rescheduling History</h3>
              <div className="table-container mt-4">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
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
            <h3>Immutable Tracking Timeline</h3>
            {order.trackingHistory?.length === 0 ? (
              <p className="text-gray mt-4">No tracking records found.</p>
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

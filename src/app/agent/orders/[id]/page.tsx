'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function AgentOrderProcess({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status update states
  const [note, setNote] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');

  async function fetchOrderDetails() {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
      } else {
        setError(data.error || 'Failed to load shipment details');
      }
    } catch {
      setError('An error occurred while fetching shipment details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  async function handleStatusUpdate(nextStatus: string) {
    setUpdateError('');
    setUpdateLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          note: note.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setNote('');
        // Refresh details
        await fetchOrderDetails();
      } else {
        setUpdateError(data.error || 'Failed to update delivery status');
      }
    } catch {
      setUpdateError('Connection error, please try again.');
    } finally {
      setUpdateLoading(false);
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
          <Link href="/agent" className="btn btn-secondary">&larr; Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Determine allowed transitions
  const currentStatus = order.status;
  const isCompletedOrFailed = ['DELIVERED', 'FAILED'].includes(currentStatus);

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>📦 Process Delivery</h1>
          <p className="font-mono">Tracking ID: {order.trackingNumber}</p>
        </div>
        <Link href="/agent/orders" className="btn btn-secondary">
          &larr; Back to Deliveries
        </Link>
      </div>

      {updateError && <div className="alert alert-error mb-6">{updateError}</div>}

      <div className="detail-grid">
        {/* Action Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 className="mb-4">Update Delivery Status</h3>

            {isCompletedOrFailed ? (
              <div className={`alert ${currentStatus === 'DELIVERED' ? 'alert-success' : 'alert-error'}`}>
                This delivery is completed with status: <span className="font-bold">{currentStatus}</span>
              </div>
            ) : (
              <div>
                <p className="mb-4">
                  Current Status: <span className={`badge badge-${currentStatus.toLowerCase()}`}>{currentStatus}</span>
                </p>

                <div className="form-group">
                  <label htmlFor="note">Optional status update note</label>
                  <textarea
                    id="note"
                    className="form-input"
                    rows={3}
                    placeholder="e.g. Received at pickup hub, out for home delivery, recipient unavailable"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="mt-4">
                  {currentStatus === 'CREATED' && (
                    <button
                      onClick={() => handleStatusUpdate('PICKED_UP')}
                      className="btn btn-primary btn-block btn-lg"
                      disabled={updateLoading}
                    >
                      📦 Mark as Picked Up
                    </button>
                  )}

                  {currentStatus === 'PICKED_UP' && (
                    <button
                      onClick={() => handleStatusUpdate('IN_TRANSIT')}
                      className="btn btn-primary btn-block btn-lg"
                      disabled={updateLoading}
                    >
                      🚚 Mark as In Transit
                    </button>
                  )}

                  {currentStatus === 'IN_TRANSIT' && (
                    <button
                      onClick={() => handleStatusUpdate('OUT_FOR_DELIVERY')}
                      className="btn btn-primary btn-block btn-lg"
                      disabled={updateLoading}
                    >
                      🛵 Mark as Out for Delivery
                    </button>
                  )}

                  {currentStatus === 'OUT_FOR_DELIVERY' && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        onClick={() => handleStatusUpdate('DELIVERED')}
                        className="btn btn-success flex-1 btn-lg"
                        disabled={updateLoading}
                      >
                        ✅ Mark as Delivered
                      </button>
                      <button
                        onClick={() => handleStatusUpdate('FAILED')}
                        className="btn btn-danger flex-1 btn-lg"
                        disabled={updateLoading}
                      >
                        ❌ Mark as Failed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Details Card */}
          <div className="card">
            <h3 className="mb-4">Shipment Details</h3>
            <div className="detail-row">
              <dt>Pickup Address</dt>
              <dd className="font-bold">{order.pickupAddress} ({order.pickupPincode})</dd>
            </div>
            <div className="detail-row">
              <dt>Drop Address</dt>
              <dd className="font-bold">{order.dropAddress} ({order.dropPincode})</dd>
            </div>
            <div className="detail-row">
              <dt>Payment Mode</dt>
              <dd className="font-bold">{order.paymentType}</dd>
            </div>
            <div className="detail-row">
              <dt>Total Collectable Amount</dt>
              <dd className="font-bold" style={{ fontSize: '1.1rem' }}>
                {order.paymentType === 'COD' ? `₹${order.totalCharge} (Collect COD)` : '₹0.00 (Prepaid)'}
              </dd>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Specifications */}
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
              <dt>Billable Weight</dt>
              <dd>{order.billableWeight} kg</dd>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="card">
            <h3 className="mb-4">Tracking History</h3>
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

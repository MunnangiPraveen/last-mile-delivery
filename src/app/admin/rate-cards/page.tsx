'use client';

import { useState, useEffect } from 'react';

export default function AdminRateCardsConfig() {
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit form states
  const [orderType, setOrderType] = useState('B2C');
  const [zoneType, setZoneType] = useState('INTRA_ZONE');
  const [ratePerKg, setRatePerKg] = useState('10');
  const [minCharge, setMinCharge] = useState('50');
  const [isActive, setIsActive] = useState(true);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  async function fetchRateCards() {
    try {
      const res = await fetch('/api/admin/rate-cards');
      const data = await res.json();
      if (data.success) {
        setRateCards(data.data || []);
      } else {
        setError(data.error || 'Failed to load rate cards');
      }
    } catch {
      setError('Connection error, failed to load rate cards');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRateCards();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (parseFloat(ratePerKg) < 0 || parseFloat(minCharge) < 0) {
      setFormError('Rates and minimum charges cannot be negative');
      return;
    }

    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch('/api/admin/rate-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType,
          zoneType,
          ratePerKg: parseFloat(ratePerKg),
          minCharge: parseFloat(minCharge),
          isActive
        })
      });

      const data = await res.json();
      if (data.success) {
        await fetchRateCards();
      } else {
        setFormError(data.error || 'Failed to save rate card');
      }
    } catch {
      setFormError('Connection error, please try again.');
    } finally {
      setFormLoading(false);
    }
  }

  function handleEditClick(rc: any) {
    setOrderType(rc.orderType);
    setZoneType(rc.zoneType);
    setRatePerKg(rc.ratePerKg.toString());
    setMinCharge(rc.minCharge.toString());
    setIsActive(rc.isActive);
  }

  return (
    <div>
      <div className="page-header">
        <h1>💰 Delivery Rate Cards</h1>
        <p>Configure base rates per kilogram and minimum charges for B2B/B2C shipments</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="detail-grid">
        {/* Rate Cards List */}
        <div className="card">
          <h3 className="mb-4 font-bold">Active Rate Cards</h3>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          ) : rateCards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💰</div>
              <p>No rate cards configured. Define rates using the panel to the right.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order Type</th>
                    <th>Zone Type</th>
                    <th>Rate / Kg</th>
                    <th>Min Charge</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rateCards.map((rc) => (
                    <tr key={rc.id}>
                      <td className="font-bold">{rc.orderType}</td>
                      <td className="font-mono">{rc.zoneType}</td>
                      <td className="font-bold">₹{rc.ratePerKg} / kg</td>
                      <td>₹{rc.minCharge}</td>
                      <td>
                        {rc.isActive ? (
                          <span className="badge badge-delivered">Active</span>
                        ) : (
                          <span className="badge badge-failed">Disabled</span>
                        )}
                      </td>
                      <td>
                        <button onClick={() => handleEditClick(rc)} className="btn btn-secondary btn-sm">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Rate Form */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 className="mb-4">Configure Rate Card</h3>
          {formError && <div className="alert alert-error">{formError}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="order-type">Order Type *</label>
                <select
                  id="order-type"
                  className="form-select"
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  disabled={formLoading}
                >
                  <option value="B2C">B2C</option>
                  <option value="B2B">B2B</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="zone-type">Zone Type *</label>
                <select
                  id="zone-type"
                  className="form-select"
                  value={zoneType}
                  onChange={(e) => setZoneType(e.target.value)}
                  disabled={formLoading}
                >
                  <option value="INTRA_ZONE">Intra-Zone (Same Zone)</option>
                  <option value="INTER_ZONE">Inter-Zone (Cross Zone)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="rate-per-kg">Rate per Kg (₹) *</label>
                <input
                  id="rate-per-kg"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={ratePerKg}
                  onChange={(e) => setRatePerKg(e.target.value)}
                  required
                  disabled={formLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="min-charge">Minimum Surcharge (₹) *</label>
                <input
                  id="min-charge"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={minCharge}
                  onChange={(e) => setMinCharge(e.target.value)}
                  required
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={formLoading}
                />
                Rate Card is Active
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg mt-4" disabled={formLoading}>
              {formLoading ? 'Saving...' : 'Save Rate Card Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

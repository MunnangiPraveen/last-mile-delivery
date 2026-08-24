'use client';

import { useState, useEffect } from 'react';

export default function AdminCodChargesConfig() {
  const [codCharges, setCodCharges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [orderType, setOrderType] = useState('B2C');
  const [surcharge, setSurcharge] = useState('50');
  const [isActive, setIsActive] = useState(true);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  async function fetchCodCharges() {
    try {
      const res = await fetch('/api/admin/cod-charges');
      const data = await res.json();
      if (data.success) {
        setCodCharges(data.data || []);
      } else {
        setError(data.error || 'Failed to load COD charges');
      }
    } catch {
      setError('Connection error, failed to load COD charges');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCodCharges();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (parseFloat(surcharge) < 0) {
      setFormError('Surcharge cannot be negative');
      return;
    }

    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch('/api/admin/cod-charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType,
          surcharge: parseFloat(surcharge),
          isActive
        })
      });

      const data = await res.json();
      if (data.success) {
        await fetchCodCharges();
      } else {
        setFormError(data.error || 'Failed to save COD charge setting');
      }
    } catch {
      setFormError('Connection error, please try again.');
    } finally {
      setFormLoading(false);
    }
  }

  function handleEditClick(cod: any) {
    setOrderType(cod.orderType);
    setSurcharge(cod.surcharge.toString());
    setIsActive(cod.isActive);
  }

  return (
    <div>
      <div className="page-header">
        <h1>💵 COD Surcharge Configuration</h1>
        <p>Configure cash collection surcharges for COD orders (Prepaid shipments bypass these rules)</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="detail-grid">
        {/* COD Charges List */}
        <div className="card">
          <h3 className="mb-4 font-bold">Configured COD Surcharges</h3>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          ) : codCharges.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💵</div>
              <p>No COD charges configured. Set COD charges on the right.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order Type</th>
                    <th>COD Surcharge (₹)</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {codCharges.map((cod) => (
                    <tr key={cod.id}>
                      <td className="font-bold">{cod.orderType}</td>
                      <td className="font-bold">₹{cod.surcharge}</td>
                      <td>
                        {cod.isActive ? (
                          <span className="badge badge-delivered">Active</span>
                        ) : (
                          <span className="badge badge-failed">Disabled</span>
                        )}
                      </td>
                      <td>
                        <button onClick={() => handleEditClick(cod)} className="btn btn-secondary btn-sm">
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

        {/* Create/Edit COD Form */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 className="mb-4">Configure COD Surcharge</h3>
          {formError && <div className="alert alert-error">{formError}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="order-type-select">Order Type *</label>
              <select
                id="order-type-select"
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
              <label htmlFor="surcharge-input">COD Surcharge Amount (₹) *</label>
              <input
                id="surcharge-input"
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={surcharge}
                onChange={(e) => setSurcharge(e.target.value)}
                required
                disabled={formLoading}
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={formLoading}
                />
                COD Charge is Active
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg mt-4" disabled={formLoading}>
              {formLoading ? 'Saving...' : 'Save COD Charge Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

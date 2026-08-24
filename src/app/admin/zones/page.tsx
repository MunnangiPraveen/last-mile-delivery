'use client';

import { useState, useEffect } from 'react';

export default function AdminZonesConfig() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  async function fetchZones() {
    try {
      const res = await fetch('/api/admin/zones');
      const data = await res.json();
      if (data.success) {
        setZones(data.data || []);
      } else {
        setError(data.error || 'Failed to load zones');
      }
    } catch {
      setError('Failed to fetch zones from server');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchZones();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) {
      setFormError('Zone name is required');
      return;
    }

    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch('/api/admin/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, isDefault })
      });

      const data = await res.json();
      if (data.success) {
        setName('');
        setDescription('');
        setIsDefault(false);
        await fetchZones();
      } else {
        setFormError(data.error || 'Failed to create zone');
      }
    } catch {
      setFormError('Connection error, please try again.');
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>🌐 Zones Configuration</h1>
        <p>Manage and configure logistics delivery zones</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="detail-grid">
        {/* Zones List */}
        <div className="card">
          <h3 className="mb-4 font-bold">Configured Zones</h3>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          ) : zones.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🌐</div>
              <p>No zones configured. Add a zone to get started.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Zone Name</th>
                    <th>Description</th>
                    <th>Default Fallback</th>
                    <th>Areas Mapped</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z) => (
                    <tr key={z.id}>
                      <td className="font-bold">{z.name}</td>
                      <td>{z.description || 'No Description'}</td>
                      <td>{z.isDefault ? <span className="badge badge-delivered">Yes (Fallback)</span> : 'No'}</td>
                      <td>{z.areas?.length || 0} pincodes/areas</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Zone Form */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 className="mb-4">Create New Delivery Zone</h3>
          {formError && <div className="alert alert-error">{formError}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Zone Name *</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="e.g. North, South, Central"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={formLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="form-input"
                rows={3}
                placeholder="Describe the regional coverage of this zone"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={formLoading}
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  disabled={formLoading}
                />
                Use as Fallback Zone (for unmatched pincodes)
              </label>
              <span className="form-hint">Setting this as default will override any previous default zone.</span>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg mt-4" disabled={formLoading}>
              {formLoading ? 'Creating...' : 'Create Zone'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

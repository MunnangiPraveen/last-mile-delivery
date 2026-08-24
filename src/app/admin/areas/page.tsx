'use client';

import { useState, useEffect } from 'react';

export default function AdminAreasConfig() {
  const [areas, setAreas] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [pincode, setPincode] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  async function fetchInitialData() {
    try {
      const [areasRes, zonesRes] = await Promise.all([
        fetch('/api/admin/areas'),
        fetch('/api/admin/zones')
      ]);

      const areasData = await areasRes.json();
      const zonesData = await zonesRes.json();

      if (areasData.success) setAreas(areasData.data || []);
      if (zonesData.success) setZones(zonesData.data || []);

      if (!areasData.success || !zonesData.success) {
        setError('Failed to load areas or zones configuration');
      }
    } catch {
      setError('Connection error, failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !pincode || !selectedZoneId) {
      setFormError('All fields are required');
      return;
    }

    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch('/api/admin/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pincode, zoneId: selectedZoneId })
      });

      const data = await res.json();
      if (data.success) {
        setName('');
        setPincode('');
        setSelectedZoneId('');
        await fetchInitialData();
      } else {
        setFormError(data.error || 'Failed to map pincode');
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
        <h1>📍 Areas &amp; Pincodes Mapping</h1>
        <p>Map pincodes to logistics zones to enable rate calculation and auto-assignment</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="detail-grid">
        {/* Areas list */}
        <div className="card">
          <h3 className="mb-4 font-bold">Mapped Pincodes</h3>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          ) : areas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📍</div>
              <p>No areas mapped. Enter mapping details to the right to define a pincode-to-zone association.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Pincode</th>
                    <th>Area Name</th>
                    <th>Associated Zone</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map((area) => (
                    <tr key={area.id}>
                      <td className="font-mono font-bold">{area.pincode}</td>
                      <td>{area.name}</td>
                      <td>
                        <span className="badge badge-created">{area.zone?.name}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form to add mapping */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 className="mb-4">Add Pincode Mapping</h3>
          {formError && <div className="alert alert-error">{formError}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="pincode">Pincode *</label>
              <input
                id="pincode"
                type="text"
                className="form-input"
                placeholder="e.g. 500001"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                required
                disabled={formLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">Area Name *</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="e.g. Madhapur, Connaught Place"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={formLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="zone-select">Associated Zone *</label>
              <select
                id="zone-select"
                className="form-select"
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                required
                disabled={formLoading}
              >
                <option value="">-- Choose Zone --</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg mt-4" disabled={formLoading}>
              {formLoading ? 'Creating...' : 'Create Pincode Mapping'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

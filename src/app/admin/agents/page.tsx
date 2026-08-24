'use client';

import { useState, useEffect } from 'react';

export default function AdminAgentsList() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch('/api/admin/agents');
        const data = await res.json();
        if (data.success) {
          setAgents(data.data || []);
        } else {
          setError(data.error || 'Failed to load delivery agents');
        }
      } catch {
        setError('Failed to fetch agents from server');
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>🚚 Delivery Agents Directory</h1>
        <p>Monitor delivery agent status, current workload, and regional zone coverage</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : agents.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🚚</div>
            <h3>No agents registered</h3>
            <p>No agent accounts found in the database.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Zone Coverage</th>
                <th>Current Workload</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => {
                const profile = a.agentProfile;
                return (
                  <tr key={a.id}>
                    <td className="font-bold">{a.name}</td>
                    <td>{a.email}</td>
                    <td>{profile?.phone || 'Not Specified'}</td>
                    <td>{profile?.zone?.name || <span className="text-gray" style={{ fontStyle: 'italic' }}>None (Fallback default)</span>}</td>
                    <td className="font-bold">{profile?.currentWorkload || 0} active orders</td>
                    <td>
                      <span className={`badge badge-${profile?.availability?.toLowerCase() || 'offline'}`}>
                        {profile?.availability || 'OFFLINE'}
                      </span>
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

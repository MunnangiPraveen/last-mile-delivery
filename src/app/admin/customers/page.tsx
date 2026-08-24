'use client';

import { useState, useEffect } from 'react';

export default function AdminCustomersList() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch('/api/admin/customers');
        const data = await res.json();
        if (data.success) {
          setCustomers(data.data || []);
        } else {
          setError(data.error || 'Failed to load customers');
        }
      } catch {
        setError('Failed to fetch customers from server');
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>👤 Customers Directory</h1>
        <p>View all registered customer accounts and their shipping metrics</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h3>No customers registered</h3>
            <p>No customer accounts found in the database.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Email Address</th>
                <th>Joined Date</th>
                <th>Total Orders Booked</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="font-bold">{c.name}</td>
                  <td>{c.email}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="font-bold">{c._count?.orders || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

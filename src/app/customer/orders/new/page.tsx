'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateOrder() {
  const router = useRouter();
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupPincode, setPickupPincode] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [dropPincode, setDropPincode] = useState('');

  const [length, setLength] = useState('10');
  const [breadth, setBreadth] = useState('10');
  const [height, setHeight] = useState('10');
  const [actualWeight, setActualWeight] = useState('1');

  const [orderType, setOrderType] = useState<'B2B' | 'B2C'>('B2C');
  const [paymentType, setPaymentType] = useState<'PREPAID' | 'COD'>('PREPAID');

  const [preview, setPreview] = useState<any | null>(null);
  const [calcError, setCalcError] = useState('');
  const [calcLoading, setCalcLoading] = useState(false);

  const [submitError, setSubmitError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  async function calculatePreview() {
    setCalcError('');
    setCalcLoading(true);
    try {
      const res = await fetch('/api/orders/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupPincode,
          dropPincode,
          length: parseFloat(length),
          breadth: parseFloat(breadth),
          height: parseFloat(height),
          actualWeight: parseFloat(actualWeight),
          orderType,
          paymentType
        })
      });

      const data = await res.json();
      if (data.success) {
        setPreview(data.data);
      } else {
        setPreview(null);
        setCalcError(data.error || 'Failed to calculate rate');
      }
    } catch {
      setPreview(null);
      setCalcError('Error connecting to rate calculator');
    } finally {
      setCalcLoading(false);
    }
  }

  // Trigger preview calculation whenever relevant inputs change
  useEffect(() => {
    if (!pickupPincode || !dropPincode || !length || !breadth || !height || !actualWeight) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(() => {
      calculatePreview();
    }, 500);

    return () => clearTimeout(timer);
  }, [pickupPincode, dropPincode, length, breadth, height, actualWeight, orderType, paymentType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setSubmitLoading(true);

    if (!preview) {
      setSubmitError('Please wait until the rate calculation completes');
      setSubmitLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupAddress,
          pickupPincode,
          dropAddress,
          dropPincode,
          length: parseFloat(length),
          breadth: parseFloat(breadth),
          height: parseFloat(height),
          actualWeight: parseFloat(actualWeight),
          orderType,
          paymentType
        })
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/customer/orders/${data.data.id}`);
      } else {
        setSubmitError(data.error || 'Failed to create order');
      }
    } catch {
      setSubmitError('Failed to connect to the server');
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>📦 Create New Order</h1>
        <p>Enter package specifications and address details to book a delivery</p>
      </div>

      {submitError && <div className="alert alert-error mb-6">{submitError}</div>}

      <form onSubmit={handleSubmit} className="detail-grid">
        {/* Left Side - Inputs */}
        <div className="card">
          <h3 className="mb-4">Order Details</h3>

          <div className="form-group">
            <label>Order Type</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="radio"
                  name="orderType"
                  value="B2C"
                  checked={orderType === 'B2C'}
                  onChange={() => setOrderType('B2C')}
                />
                B2C (Retail Customer)
              </label>
              <label style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="radio"
                  name="orderType"
                  value="B2B"
                  checked={orderType === 'B2B'}
                  onChange={() => setOrderType('B2B')}
                />
                B2B (Business Client)
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Payment Method</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="radio"
                  name="paymentType"
                  value="PREPAID"
                  checked={paymentType === 'PREPAID'}
                  onChange={() => setPaymentType('PREPAID')}
                />
                Prepaid
              </label>
              <label style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="radio"
                  name="paymentType"
                  value="COD"
                  checked={paymentType === 'COD'}
                  onChange={() => setPaymentType('COD')}
                />
                Cash on Delivery (COD)
              </label>
            </div>
          </div>

          <hr className="mb-4 mt-4" style={{ borderColor: 'var(--gray-200)' }} />

          <h4 className="mb-3">Addresses</h4>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pickupPincode">Pickup Pincode *</label>
              <input
                id="pickupPincode"
                type="text"
                className="form-input"
                placeholder="e.g. 500001"
                value={pickupPincode}
                onChange={(e) => setPickupPincode(e.target.value)}
                required
              />
              <span className="form-hint">Accepts any pincode</span>
            </div>

            <div className="form-group">
              <label htmlFor="dropPincode">Drop Pincode *</label>
              <input
                id="dropPincode"
                type="text"
                className="form-input"
                placeholder="e.g. 110001"
                value={dropPincode}
                onChange={(e) => setDropPincode(e.target.value)}
                required
              />
              <span className="form-hint">Accepts any pincode</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="pickupAddress">Pickup Address *</label>
            <textarea
              id="pickupAddress"
              className="form-input"
              rows={2}
              placeholder="Full pickup street address"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dropAddress">Drop Address *</label>
            <textarea
              id="dropAddress"
              className="form-input"
              rows={2}
              placeholder="Full destination address"
              value={dropAddress}
              onChange={(e) => setDropAddress(e.target.value)}
              required
            />
          </div>

          <hr className="mb-4 mt-4" style={{ borderColor: 'var(--gray-200)' }} />

          <h4 className="mb-3">Package Specifications</h4>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="actualWeight">Actual Weight (kg) *</label>
              <input
                id="actualWeight"
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                value={actualWeight}
                onChange={(e) => setActualWeight(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="length">Length (cm) *</label>
              <input
                id="length"
                type="number"
                step="0.1"
                min="0.1"
                className="form-input"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="breadth">Breadth (cm) *</label>
              <input
                id="breadth"
                type="number"
                step="0.1"
                min="0.1"
                className="form-input"
                value={breadth}
                onChange={(e) => setBreadth(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="height">Height (cm) *</label>
              <input
                id="height"
                type="number"
                step="0.1"
                min="0.1"
                className="form-input"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Right Side - Charge Preview */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 className="mb-4">Charge Preview</h3>

          {calcLoading && (
            <div className="loading-spinner" style={{ padding: '2rem' }}>
              <div className="spinner"></div>
            </div>
          )}

          {calcError && (
            <div className="alert alert-error">
              {calcError}
            </div>
          )}

          {!preview && !calcLoading && !calcError && (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>Enter addresses and package parameters to compute charge preview.</p>
            </div>
          )}

          {preview && !calcLoading && (
            <div className="charge-breakdown">
              <div className="charge-row">
                <span>Pickup Zone:</span>
                <span className="font-bold">{preview.pickupZoneName}</span>
              </div>
              <div className="charge-row">
                <span>Drop Zone:</span>
                <span className="font-bold">{preview.dropZoneName}</span>
              </div>
              <div className="charge-row">
                <span>Rate Type:</span>
                <span className="font-bold">{preview.rateType}</span>
              </div>

              <hr className="mb-2 mt-2" style={{ borderColor: 'var(--gray-200)' }} />

              <div className="charge-row">
                <span>Actual Weight:</span>
                <span>{preview.actualWeight} kg</span>
              </div>
              <div className="charge-row">
                <span>Volumetric Weight:</span>
                <span>{preview.volumetricWeight} kg</span>
              </div>
              <div className="charge-row">
                <span>Billable Weight:</span>
                <span className="font-bold">{preview.billableWeight} kg</span>
              </div>

              <hr className="mb-2 mt-2" style={{ borderColor: 'var(--gray-200)' }} />

              <div className="charge-row">
                <span>Base Charge:</span>
                <span>₹{preview.baseCharge}</span>
              </div>
              <div className="charge-row">
                <span>COD Surcharge:</span>
                <span>₹{preview.codSurcharge}</span>
              </div>

              <div className="charge-row total">
                <span>Total Charge:</span>
                <span>₹{preview.totalCharge}</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg mt-6"
                disabled={submitLoading}
              >
                {submitLoading ? 'Creating Shipment...' : 'Confirm & Create Order'}
              </button>
            </div>
          )}

          <div className="mt-4 text-center">
            <Link href="/customer" className="btn btn-secondary btn-block">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

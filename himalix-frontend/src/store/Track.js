import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import StoreFooter from './Footer';

export default function Track() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState(null);

  const handleSearch = async (trackingCode) => {
    if (!trackingCode.trim()) return;
    setLoading(true);
    setError('');
    setOrderData(null);
    try {
      const res = await fetch(`/api/store/orders/track/${encodeURIComponent(trackingCode.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Order not found');
      }
      setOrderData(data.order);
      setSearchParams({ code: trackingCode.trim() });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      setCode(urlCode);
      handleSearch(urlCode);
    }
  }, [searchParams]);

  const onSubmit = (e) => {
    e.preventDefault();
    handleSearch(code);
  };

  const getOrderType = (orderData) => {
    if (orderData.order_code && orderData.order_code.startsWith('HMX-')) {
      return 'store';
    }
    if (orderData.items && orderData.items.length > 0) {
      const firstItem = orderData.items[0];
      if (firstItem.category === '3D Service') return '3d';
      if (firstItem.category === 'Web Service') return 'web';
      if (firstItem.is_project) return 'project';
    }
    return 'store';
  };

  const isCancelledStatus = (status) => {
    const s = String(status).toLowerCase();
    return s === 'cancelled' || s === 'declined' || s === 'archived';
  };

  const getStepLabel = (step) => {
    if (step === 'estimated') return 'PRICE QUOTED';
    if (step === 'approved') return 'APPROVED & PAID';
    return step.replace('_', ' ').toUpperCase();
  };

  const getSteps = (status, type) => {
    const normStatus = String(status).toLowerCase();
    
    if (type === '3d') {
      const allSteps = ['pending_review', 'estimated', 'approved', 'printing', 'completed'];
      let mapped = normStatus;
      if (normStatus === 'delivered') mapped = 'completed';
      const curIndex = allSteps.indexOf(mapped);
      return allSteps.map((step, idx) => ({
        label: getStepLabel(step),
        active: idx <= curIndex,
        current: idx === curIndex
      }));
    } else if (type === 'web') {
      const allSteps = ['unread', 'in_discussion', 'proposal_sent', 'accepted'];
      let mapped = normStatus;
      if (normStatus === 'delivered' || normStatus === 'completed') mapped = 'accepted';
      const curIndex = allSteps.indexOf(mapped);
      return allSteps.map((step, idx) => ({
        label: getStepLabel(step),
        active: idx <= curIndex,
        current: idx === curIndex
      }));
    } else if (type === 'project') {
      const allSteps = ['pending', 'accepted', 'in_progress', 'completed'];
      let mapped = normStatus;
      if (normStatus === 'delivered') mapped = 'completed';
      const curIndex = allSteps.indexOf(mapped);
      return allSteps.map((step, idx) => ({
        label: getStepLabel(step),
        active: idx <= curIndex,
        current: idx === curIndex
      }));
    } else {
      const allSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
      let mapped = normStatus;
      if (normStatus === 'completed') mapped = 'delivered';
      const curIndex = allSteps.indexOf(mapped);
      return allSteps.map((step, idx) => ({
        label: getStepLabel(step),
        active: idx <= curIndex,
        current: idx === curIndex
      }));
    }
  };

  return (
    <div className="store-page" style={{ paddingTop: '100px', minHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, maxWidth: '800px', width: '100%', margin: '0 auto', padding: '0 var(--space-6) var(--space-12)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '10px' }}>
            <i className="fa-light fa-sharp fa-location-crosshairs" style={{ color: 'var(--accent)', marginRight: '10px' }} />
            Track Your Order
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>
            Enter your 8-digit tracking or service order code (e.g. 3D-XXXX, WEB-XXXX) to retrieve status updates.
          </p>
        </div>

        {/* Tracking Code Input Form */}
        <form onSubmit={onSubmit} style={{ background: 'var(--bg-2)', border: '1px solid var(--border-strong)', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 3D-178298736, WEB-102 or Store Order Code..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ flex: 1, textTransform: 'uppercase', padding: '14px', background: 'var(--bg-1)', border: '1px solid var(--border)' }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }} disabled={loading}>
              {loading ? 'Searching...' : 'Track'}
            </button>
          </div>
        </form>

        {error && (
          <div className="alert alert-danger" style={{ borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-light fa-sharp fa-circle-exclamation" /> {error}
          </div>
        )}

        {/* Tracking Details Display */}
        {orderData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Summary Banner */}
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '24px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Order Tracking Code</span>
                <h2 style={{ fontSize: '20px', color: 'var(--accent)', fontWeight: 700, margin: '2px 0 0 0' }}>{orderData.order_code}</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Status</span>
                <div style={{ margin: '4px 0 0 0' }}>
                  <span style={{ 
                    background: orderData.status === 'delivered' || orderData.status === 'completed' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', 
                    color: orderData.status === 'delivered' || orderData.status === 'completed' ? 'var(--success)' : '#f59e0b',
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    {orderData.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Stepper Status Timeline */}
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '24px', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                Tracking Timeline
              </h3>
              
              {isCancelledStatus(orderData.status) ? (
                <div className="alert alert-danger" style={{ margin: 0 }}>
                  <i className="fa-light fa-sharp fa-circle-xmark" /> This transaction has been cancelled/closed.
                </div>
              ) : (
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflowX: 'auto', padding: '15px 0' }}>
                  {getSteps(orderData.status, getOrderType(orderData)).map((step, idx, arr) => (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minWidth: '90px' }}>
                      {/* Connection Line */}
                      {idx < arr.length - 1 && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '13px', 
                          left: '50%', 
                          width: '100%', 
                          height: '2px', 
                          background: step.active && arr[idx+1].active ? 'var(--accent)' : 'var(--border-strong)', 
                          zIndex: 1 
                        }} />
                      )}
                      
                      {/* Step Indicator Dot */}
                      <div style={{ 
                        width: '26px', 
                        height: '26px', 
                        borderRadius: '50%', 
                        background: step.active ? 'var(--accent)' : 'var(--bg-2)',
                        border: `2px solid ${step.active ? 'var(--accent)' : 'var(--border-strong)'}`,
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: step.active ? 'var(--bg-1)' : 'var(--text-3)',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        boxShadow: 'none'
                      }}>
                        {step.active ? '✓' : idx + 1}
                      </div>
                      
                      <span style={{ 
                        fontSize: '11px', 
                        marginTop: '10px', 
                        textAlign: 'center', 
                        color: step.current ? 'var(--text-0)' : step.active ? 'var(--text-1)' : 'var(--text-2)',
                        fontWeight: step.current ? '700' : '500',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.3px'
                      }}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Items */}
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '24px', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                Order Items
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orderData.items.map((item, idx) => {
                  const customSpecs = (() => {
                    if (!item.custom_responses) return null;
                    try {
                      return typeof item.custom_responses === 'string' ? JSON.parse(item.custom_responses) : item.custom_responses;
                    } catch(e) { return null; }
                  })();

                  return (
                    <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center', borderBottom: idx < orderData.items.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: idx < orderData.items.length - 1 ? '16px' : '0' }}>
                      <div style={{ width: '60px', height: '60px', background: 'var(--bg-3)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                        <img 
                          src={item.image_url || (item.category === '3D Service' ? '/3d_placeholder.svg' : item.category === 'Web Service' ? '/web_placeholder.svg' : '/placeholder.svg')} 
                          alt={item.product_name} 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          onError={e => { e.target.src = '/placeholder.svg'; }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-0)' }}>{item.product_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                          Qty: {item.quantity} • Rate: Rs. {Number(item.price).toLocaleString()}
                        </div>
                        
                        {/* Custom choice specs display */}
                        {customSpecs && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px', fontSize: '11px', color: 'var(--text-2)' }}>
                            {customSpecs.material && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Material: {customSpecs.material}</span>}
                            {customSpecs.color && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Color: {customSpecs.color}</span>}
                            {customSpecs.infill !== undefined && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Infill: {customSpecs.infill}%</span>}
                            {customSpecs.layerHeight && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Layer: {customSpecs.layerHeight}mm</span>}
                            {customSpecs.rental_meta && (
                              <>
                                <span style={{ background: 'rgba(212, 160, 23, 0.1)', color: 'var(--accent)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--accent)' }}>Rental Duration: {customSpecs.rental_meta.duration} Days</span>
                                <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Start Date: {customSpecs.rental_meta.startDate}</span>
                                {customSpecs.rental_meta.endDate && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>End Date: {customSpecs.rental_meta.endDate}</span>}
                                <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Security Deposit: Rs. {Number(customSpecs.rental_meta.deposit).toLocaleString()}</span>
                                {customSpecs.rental_meta.rentalPrice && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Rental Charge: Rs. {Number(customSpecs.rental_meta.rentalPrice).toLocaleString()}</span>}
                              </>
                            )}
                          </div>
                        )}

                        {item.category === 'Web Service' && customSpecs && (
                          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-2)', padding: '10px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                            <strong>Inquiry Specifications:</strong>
                            <div style={{ marginTop: '4px' }}>Budget: {customSpecs.budgetRange ? customSpecs.budgetRange.replace('_', ' ') : 'N/A'}</div>
                            <div>Description: {customSpecs.description || item.custom_responses}</div>
                          </div>
                        )}
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--accent)' }}>
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Address and Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="grid-mobile-1">
              
              {/* Delivery Details */}
              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '24px', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Delivery Details
                </h3>
                {orderData.delivery_address ? (
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-1)' }}>
                    <div><strong>Recipient:</strong> {orderData.delivery_address.full_name || 'Valued Customer'}</div>
                    <div><strong>Contact Number:</strong> {orderData.delivery_address.phone || 'N/A'}</div>
                    <div><strong>Address Line:</strong> {orderData.delivery_address.address_line || 'Digital delivery'}</div>
                    <div><strong>City/District:</strong> {orderData.delivery_address.city || ''}, {orderData.delivery_address.district || ''}</div>
                  </div>
                ) : (
                  <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>No physical delivery address required.</span>
                )}
              </div>

              {/* Pricing Summary */}
              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '24px', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Pricing Summary
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-2)' }}>Subtotal</span>
                    <span>Rs. {Number(orderData.total_amount - (orderData.shipping_cost || 0) - (orderData.sales_tax || 0)).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-2)' }}>Sales Tax</span>
                    <span>Rs. {Number(orderData.sales_tax || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-2)' }}>Shipping Charge</span>
                    <span>Rs. {Number(orderData.shipping_cost || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '8px', fontWeight: 'bold', fontSize: '14.5px', color: 'var(--text-0)' }}>
                    <span>Total Paid</span>
                    <span style={{ color: 'var(--accent)' }}>Rs. {Number(orderData.total_amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
      <StoreFooter />
    </div>
  );
}

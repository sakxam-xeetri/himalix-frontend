import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { useCart } from './CartContext';
import { useAuth } from '../auth/AuthContext';
import StoreFooter from './Footer';
import LocationPicker from '../components/LocationPicker';

export default function Cart() {
  const { items, itemCount, totalAmount, updateQty, removeItem, clearCart } = useCart();
  const { user, authFetch, systemConfig } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state || {};
  const checkoutType = locationState.checkoutType || 'cart'; // 'cart' | '3d' | 'web'
  const is3D = checkoutType === '3d';

  const [step, setStep]         = useState(() => (locationState.checkoutType && locationState.checkoutType !== 'cart') ? 'checkout' : 'cart');
  const [orderCode, setOrderCode] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  /* Wallet */
  const [wallet, setWallet]     = useState(null);
  const [walletUse, setWalletUse] = useState(false);

  /* Shipping */
  const [shipping, setShipping] = useState(null);

  /* EULA agreement */
  const [agreedEula, setAgreedEula] = useState(false);

  // Compute items, count, total amount based on type
  let checkoutItems = items;
  let checkoutItemCount = itemCount;
  let checkoutTotalAmount = totalAmount;

  if (is3D) {
    checkoutItems = [{
      product_id: '3d-print',
      product_name: `3D Print Job: ${locationState.printData.filename || 'model.stl'}`,
      price: locationState.printData.price || 100,
      quantity: 1,
      category: '3D Service',
      image_url: '/3d_placeholder.svg',
      is_3d: true
    }];
    checkoutItemCount = 1;
    checkoutTotalAmount = locationState.printData.price || 100;
  }

  /* Address form */
  const [address, setAddress] = useState(() => {
    let sa = {};
    if (user?.shipping_address) {
      try { sa = typeof user.shipping_address === 'string' ? JSON.parse(user.shipping_address) : user.shipping_address; } catch(e){}
    }
    return {
      full_name: user?.name || '',
      phone: user?.phone || '',
      address_line: sa.addressLine || '',
      city: sa.city || '',
      district: sa.district || '',
      lat: sa.lat || '',
      lng: sa.lng || '',
    };
  });

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    authFetch('/api/store/wallet').then(r => r.json()).then(d => setWallet(d.wallet));

    // Prefill default checkout address
    authFetch('/api/store/profile/addresses')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const def = data.find(a => a.is_default) || data[0];
          if (def) {
            setAddress(p => ({
              ...p,
              full_name: def.full_name || p.full_name || '',
              phone: def.phone || p.phone || '',
              address_line: def.address_line || '',
              city: def.city || '',
              district: def.district || '',
              lat: def.lat || '',
              lng: def.lng || ''
            }));
          }
        }
      })
      .catch(() => {});
  }, [user, authFetch, navigate]);

  /* Calculate shipping when address has coords */
  useEffect(() => {
    const { lat, lng } = address;
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;
    authFetch(`/api/store/orders/shipping?lat=${lat}&lng=${lng}`)
      .then(r => r.json())
      .then(d => setShipping(d))
      .catch(() => {});
  }, [address.lat, address.lng, authFetch]);

  const walletBalance   = wallet?.balance || 0;
  const subtotal        = checkoutTotalAmount;
  const taxRate         = (parseFloat(systemConfig?.salesTaxRate) || 0) / 100;
  const salesTax        = subtotal * taxRate;
  const shippingCost    = shipping ? (shipping.shipping_cost || 0) : 0;
  const totalBeforeWallet = subtotal + salesTax + shippingCost;
  const canUseWallet    = walletBalance >= totalBeforeWallet;
  const walletDeduction = (walletUse && canUseWallet) ? totalBeforeWallet : 0;
  const grandTotal      = totalBeforeWallet - walletDeduction;

  useEffect(() => {
    if (walletUse && !canUseWallet) {
      setWalletUse(false);
    }
  }, [walletBalance, totalBeforeWallet, walletUse, canUseWallet]);

  const formatPrice = n => `Rs. ${Number(n).toLocaleString('en-NP')}`;

  const handleCheckout = async () => {
    if (!address.full_name || !address.phone || !address.address_line || !address.city || !address.district || !address.lat || !address.lng) {
      setCheckoutError('Please fill in all address fields and provide your map location.');
      return;
    }
    if (!agreedEula) {
      setCheckoutError('You must agree to the End User License Agreement (EULA) before placing the order.');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      if (is3D) {
        // Place 3D Printing order
        const payload = {
          material: locationState.printData.material,
          color: locationState.printData.color,
          layer_height_mm: locationState.printData.layerHeight,
          infill_percentage: locationState.printData.infill,
          quantity: locationState.printData.qty,
          notes: locationState.printData.notes,
          fileUrl: locationState.printData.file_url,
          filename: locationState.printData.filename,
          price: locationState.printData.price,
          address: {
            full_name: address.full_name,
            phone: address.phone,
            address_line: address.address_line,
            city: address.city,
            district: address.district,
            province: 'Bagmati',
            lat: parseFloat(address.lat),
            lng: parseFloat(address.lng)
          },
          customFields: JSON.stringify(locationState.printData.customResponses)
        };

        const res = await authFetch('/api/3d', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || data.message || 'Checkout failed');
        setOrderCode(data.order_code || `3D-${data.order?.id || Date.now()}`);
        setStep('success');
      } else {
        // Normal storefront checkout
        const res = await authFetch('/api/store/orders', {
          method: 'POST',
          body: JSON.stringify({
            address,
            use_wallet: walletUse,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || data.message || 'Checkout failed');
        setOrderCode(data.order_code || data.order?.order_code || '');
        await clearCart();
        setStep('success');
      }
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const addrField = (id, label, name, placeholder, type = 'text', half = false) => (
    <div className="form-group" style={half ? {} : {}}>
      <label htmlFor={id} className="form-label">{label}</label>
      <input
        id={id}
        type={type}
        className="form-input"
        placeholder={placeholder}
        value={address[name] || ''}
        onChange={e => setAddress(p => ({ ...p, [name]: e.target.value }))}
        disabled={checkoutLoading}
      />
    </div>
  );

  /* ── ORDER SUCCESS ── */
  if (step === 'success') {
    return (
      <div className="store-page">
        <div className="order-success">
          <div className="order-success__icon">
            <i className="fa-light fa-sharp fa-circle-check" />
          </div>
          <h1 className="order-success__title">Order Placed!</h1>
          {orderCode && (
            <div style={{ textAlign: 'center', margin: '16px 0' }}>
              <div className="order-success__code" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: 'bold', color: 'var(--accent)', background: 'var(--bg-3)', padding: '10px 20px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                <i className="fa-light fa-sharp fa-hashtag" /> {orderCode}
              </div>
              <div style={{ marginTop: '12px' }}>
                <Link to={`/store/track?code=${orderCode}`} className="btn btn-outline btn-sm">
                  <i className="fa-light fa-sharp fa-location-crosshairs" style={{ marginRight: '6px' }} /> Track Live Status
                </Link>
              </div>
            </div>
          )}
          <p style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)', maxWidth: 400, textAlign: 'center' }}>
            Your transaction has been processed successfully. You can track details live using the tracker link above.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/store/profile" className="btn btn-primary">
              <i className="fa-light fa-sharp fa-user" /> View Orders
            </Link>
            <Link to="/store" className="btn btn-outline">
              <i className="fa-light fa-sharp fa-store" /> Continue Shopping
            </Link>
          </div>
        </div>
        <StoreFooter />
      </div>
    );
  }

  const hasRentals = checkoutItems.some(item => 
    (item.is_project && item.project_type === 'rent') || 
    (item.product_name && item.product_name.includes('(Rental'))
  );

  return (
    <div className="store-page" style={{ paddingTop: '100px', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <div className="cart-layout" style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: 'var(--space-6) var(--space-6) var(--space-16)', width: '100%', flex: 1 }}>
        
        {/* ── LEFT COLUMN: Cart items OR Checkout form ── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Rental warning alert */}
          {hasRentals && (
            <div className="alert alert-warning" style={{ marginBottom: '16px', borderLeft: '4px solid #f59e0b', background: 'rgba(245, 158, 11, 0.08)', color: 'var(--text-0)', padding: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12.5px', borderRadius: '4px' }}>
              <i className="fa-light fa-sharp fa-triangle-exclamation" style={{ color: '#f59e0b', fontSize: '16px', marginTop: '2px' }} />
              <div>
                <strong>Rental Terms Notice:</strong> You are renting physical project components. They must be returned in perfect working condition. Any damage, modification, or failure to return the items within the selected duration will result in penalty charges up to 100% of the replacement price and forfeiture of your deposit.
              </div>
            </div>
          )}

          {step === 'cart' ? (
            <div className="cart-items">
              <div className="cart-items__header">
                <span className="cart-items__title">Your Cart</span>
                <span className="cart-items__count">{checkoutItemCount} item{checkoutItemCount !== 1 ? 's' : ''}</span>
              </div>

              {checkoutItems.length === 0 ? (
                <div className="cart-empty">
                  <div className="cart-empty__icon">
                    <i className="fa-light fa-sharp fa-bag-shopping" />
                  </div>
                  <p className="cart-empty__text">Your cart is empty.</p>
                  <Link to="/store" className="btn btn-outline">
                    <i className="fa-light fa-sharp fa-store" /> Browse Products
                  </Link>
                </div>
              ) : (
                <>
                  {checkoutItems.map(item => {
                    const parsed = (() => {
                      if (item.custom_responses) {
                        try {
                          return typeof item.custom_responses === 'string' ? JSON.parse(item.custom_responses) : item.custom_responses;
                        } catch (e) { return null; }
                      }
                      if (item.is_3d || is3D) return locationState.printData;
                      return null;
                    })();

                    return (
                      <div key={item.id || item.product_id} className="cart-item">
                        <div className="cart-item__img">
                          <img
                            src={item.image_url || '/placeholder.svg'}
                            alt={item.product_name}
                            onError={e => { e.target.src = '/placeholder.svg'; }}
                          />
                        </div>
                        <div className="cart-item__body">
                          <div className="cart-item__category">{item.category}</div>
                          <div className="cart-item__name">{item.product_name}</div>
                          
                          {/* Display custom specs and choices */}
                          {parsed && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px', marginBottom: '8px', fontSize: '11px', color: 'var(--text-3)' }}>
                              {parsed.material && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Material: {parsed.material}</span>}
                              {parsed.color && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Color: {parsed.color}</span>}
                              {parsed.infill && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Infill: {parsed.infill}%</span>}
                              {parsed.layerHeight && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Layer: {parsed.layerHeight}mm</span>}
                              {parsed.projectType && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Project: {parsed.projectType.replace('_', ' ').toUpperCase()}</span>}
                              {parsed.budgetRange && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Budget: {parsed.budgetRange.replace('_', ' ')}</span>}
                              {parsed.companyName && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Company: {parsed.companyName}</span>}
                              {parsed.filename && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)', textDecoration: 'underline' }}>File: {parsed.filename}</span>}
                              {parsed.rental_meta && (
                                <>
                                  <span style={{ background: 'rgba(212, 160, 23, 0.1)', color: 'var(--accent)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--accent)' }}>Rental Duration: {parsed.rental_meta.duration} Days</span>
                                  <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Start Date: {parsed.rental_meta.startDate}</span>
                                  {parsed.rental_meta.endDate && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>End Date: {parsed.rental_meta.endDate}</span>}
                                  <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Security Deposit: Rs. {Number(parsed.rental_meta.deposit).toLocaleString()}</span>
                                  <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Rental Charge: Rs. {Number(parsed.rental_meta.rentalPrice).toLocaleString()}</span>
                                </>
                              )}
                            </div>
                          )}

                          <div className="cart-item__actions">
                            <span className="cart-item__price">{formatPrice(item.price * item.quantity)}</span>
                            
                            {/* Hide quantity controls and show simplified remove for service orders and projects */}
                            {(item.is_3d || item.is_project || is3D) ? (
                              <div className="cart-item__controls">
                                <button className="cart-item__remove" onClick={() => removeItem(item.id || item.product_id)} aria-label="Remove item" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '11px', border: '1px solid var(--border)' }}>
                                  <i className="fa-light fa-sharp fa-trash" /> Remove
                                </button>
                              </div>
                            ) : (
                              <div className="cart-item__controls">
                                <div className="qty-control">
                                  <button className="qty-control__btn" onClick={() => updateQty(item.id, item.quantity - 1)} aria-label="Decrease">
                                    <i className="fa-light fa-sharp fa-minus" />
                                  </button>
                                  <span className="qty-control__val" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {item.quantity}
                                  </span>
                                  <button 
                                    className="qty-control__btn" 
                                    onClick={() => updateQty(item.id, item.quantity + 1)} 
                                    aria-label="Increase"
                                    disabled={item.quantity >= item.stock_quantity}
                                    title={item.quantity >= item.stock_quantity ? "Maximum available stock reached" : "Increase quantity"}
                                  >
                                    <i className="fa-light fa-sharp fa-plus" />
                                  </button>
                                </div>
                                <button className="cart-item__remove" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.product_name}`}>
                                  <i className="fa-light fa-sharp fa-trash" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          ) : (
            /* ── CHECKOUT FORM ── */
            <div className="checkout-address">
              <div className="checkout-address__header">
                {!is3D && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setStep('cart')}
                    style={{ marginRight: 'var(--space-4)', float: 'left' }}
                  >
                    <i className="fa-light fa-sharp fa-arrow-left" />
                  </button>
                )}
                Delivery & Contact Checkout Address
              </div>
              <div className="checkout-address__body">
                {is3D && (
                  <div style={{ background: 'var(--bg-3)', border: '1px solid var(--accent)', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fa-light fa-sharp fa-print" style={{ color: 'var(--accent)', fontSize: '18px' }} />
                    <div style={{ fontSize: '13px' }}>
                      You are checking out for: <strong style={{ color: 'var(--accent)' }}>Custom 3D Printing Service</strong>
                    </div>
                  </div>
                )}
                {checkoutError && (
                  <div className="alert alert-danger">
                    <i className="fa-light fa-sharp fa-circle-exclamation" /> {checkoutError}
                  </div>
                )}
                <div className="checkout-address__row">
                  {addrField('addr-name', 'Full Name', 'full_name', 'Your full name')}
                  {addrField('addr-phone', 'Phone Number', 'phone', '98XXXXXXXX', 'tel')}
                </div>
                {addrField('addr-line', 'Address Line', 'address_line', 'Street, Ward, Area')}
                <div className="checkout-address__row">
                  {addrField('addr-city', 'City / Municipality', 'city', 'e.g. Kathmandu')}
                  {addrField('addr-district', 'District', 'district', 'e.g. Kathmandu')}
                </div>
                <div className="form-group">
                  <label className="form-label">Map Location (Pinpoint on map)</label>
                  <LocationPicker 
                    lat={address.lat} 
                    lng={address.lng} 
                    onChange={(lat, lng) => setAddress(p => ({ ...p, lat, lng }))} 
                  />
                </div>
                <div className="checkout-address__row" style={{ alignItems: 'flex-end' }}>
                  {addrField('addr-lat', 'Latitude', 'lat', '27.7029', 'number')}
                  {addrField('addr-lng', 'Longitude', 'lng', '85.3072', 'number')}
                  <div className="form-group" style={{ flex: '0 0 auto' }}>
                    <button 
                      type="button" 
                      className="btn btn-outline"
                      onClick={() => {
                        if (!navigator.geolocation) {
                          alert('Geolocation is not supported by this browser. Please select your location on the map manually.');
                          return;
                        }

                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setAddress(p => ({ 
                              ...p, 
                              lat: pos.coords.latitude.toFixed(6), 
                              lng: pos.coords.longitude.toFixed(6) 
                            }));
                          },
                          (err) => {
                            console.error('HTML5 Geolocation Error:', err);
                            if (err.code === 1) { // PERMISSION_DENIED
                              alert('Location access was denied. Please grant location permissions in your browser or input coordinates manually.');
                            } else if (err.code === 2) { // POSITION_UNAVAILABLE
                              alert('Location information is unavailable. Please verify your device GPS/network signal or locate manually.');
                            } else if (err.code === 3) { // TIMEOUT
                              alert('The location request timed out. Please try again or select your location manually.');
                            } else {
                              alert('An unknown error occurred while retrieving location.');
                            }
                          },
                          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                        );
                      }}
                    >
                      <i className="fa-light fa-sharp fa-location-crosshairs" /> Auto-Locate
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginBottom: 'var(--space-4)' }}>
                  <i className="fa-light fa-sharp fa-circle-info" style={{ color: 'var(--accent)' }} />
                  {' '}Providing precise coordinates enables accurate shipping cost calculation.
                </p>

                {/* CENTRALIZED EULA LICENSE AGREEMENT */}
                <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>End User License & Service Agreement (EULA)</label>
                  <div style={{ height: '110px', overflowY: 'auto', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '10px', fontSize: '11px', color: 'var(--text-2)', lineHeight: '1.5', fontFamily: 'sans-serif', marginBottom: '12px' }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>HIMALIX LABS - END USER LICENSE & SERVICE AGREEMENT</p>
                    <p style={{ margin: '0 0 8px 0' }}>1. Acceptance of Terms: By completing this transaction, you agree to be bound by these terms.</p>
                    <p style={{ margin: '0 0 8px 0' }}>2. Rental Services: If renting components or equipment, you agree to return all parts in their original, undamaged, and fully functional condition within the selected rental duration. Security deposits will be forfeited, and additional penalty fees equal to 100% of the item cost will apply if products are returned damaged, altered, or late.</p>
                    <p style={{ margin: '0 0 8px 0' }}>3. Custom Services (3D Printing & Web Agency): Estimates provided are initial quotes. 3D printing outputs depend on client-provided models. Web engineering delivery is governed by standard development lifecycle guidelines.</p>
                    <p style={{ margin: '0 0 8px 0' }}>4. Payments and Wallets: All wallet deductions are final. Refund processing is subject to admin verification.</p>
                    <p style={{ margin: '0 0 8px 0' }}>5. Liability: Himalix Labs is not responsible for any indirect or consequential damages arising from component usage.</p>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-0)' }}>
                    <input
                      type="checkbox"
                      checked={agreedEula}
                      onChange={e => setAgreedEula(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    I have read and agree to the End User License & Service Agreement (EULA) *
                  </label>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: Order Summary ── */}
        <div className="order-summary">
          {/* Wallet & Coupon */}
          <div className="order-summary__card">
            <div className="order-summary__header">Discounts</div>
            <div className="wallet-coupon">
              <div className="wallet-coupon__label">
                <i className="fa-light fa-sharp fa-wallet" /> Wallet Credit
              </div>
              {wallet && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
                    {formatPrice(walletBalance)} available
                  </span>
                  <label className="toggle" style={{ flexShrink: 0 }} title={!canUseWallet ? "Insufficient wallet balance to cover order total in full" : ""}>
                    <input
                      type="checkbox"
                      checked={walletUse}
                      onChange={e => setWalletUse(e.target.checked)}
                      disabled={!canUseWallet}
                    />
                    <span className="toggle__track" />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Summary card */}
          <div className="order-summary__card">
            <div className="order-summary__header">Order Summary</div>
            <div className="order-summary__body">
              <div className="order-summary__row">
                <span>Subtotal ({checkoutItemCount} items)</span>
                <span className="order-summary__value">{formatPrice(subtotal)}</span>
              </div>
              <div className="order-summary__row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Sales Tax ({systemConfig?.salesTaxRate || 0}%)</span>
                  <span className="order-summary__value">{formatPrice(salesTax)}</span>
                </div>
                {checkoutItems.length > 0 && !is3D && (
                  <div className="tax-breakdown" style={{ paddingLeft: 'var(--space-3)', marginTop: 'var(--space-1)', fontSize: 'var(--text-xxs)', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {checkoutItems.map(item => {
                      const itemTotal = item.price * item.quantity;
                      const itemTax = itemTotal * taxRate;
                      return (
                        <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>• {item.product_name} (Rs. {Number(itemTotal).toLocaleString('en-NP')})</span>
                          <span>{formatPrice(itemTax)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="order-summary__row">
                <span>Shipping</span>
                <span className="order-summary__value">
                  {shipping ? formatPrice(shippingCost) : '—'}
                </span>
              </div>
              {walletUse && walletDeduction > 0 && (
                <div className="order-summary__row">
                  <span>Wallet Credit</span>
                  <span className="order-summary__value order-summary__value--discount">
                    −{formatPrice(walletDeduction)}
                  </span>
                </div>
              )}
              <div className="order-summary__row order-summary__row--total">
                <span>Total</span>
                <span className="order-summary__value order-summary__value--gold">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            {shipping && (
              <div style={{ padding: '0 var(--space-6) var(--space-4)' }}>
                <div className="shipping-info">
                  <div className="shipping-info__row">
                    <span className="shipping-info__label">Distance</span>
                    <span className="shipping-info__value">{shipping.distance_km?.toFixed(1)} km</span>
                  </div>
                  <div className="shipping-info__row">
                    <span className="shipping-info__label">ETA</span>
                    <span className="shipping-info__value">{shipping.eta_days} day{shipping.eta_days !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ padding: '0 var(--space-6) var(--space-5)' }}>
              {step === 'cart' ? (
                <button
                  className="btn btn-primary btn-full btn-lg"
                  onClick={() => { if (checkoutItems.length > 0) setStep('checkout'); }}
                  disabled={checkoutItems.length === 0}
                >
                  <i className="fa-light fa-sharp fa-arrow-right" /> Proceed to Checkout
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-full btn-lg"
                  onClick={handleCheckout}
                  disabled={checkoutLoading || (!agreedEula && step === 'checkout')}
                >
                  {checkoutLoading
                    ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Placing Order…</>
                    : <><i className="fa-light fa-sharp fa-check" /> Place Order</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
      <StoreFooter />
    </div>
  );
}

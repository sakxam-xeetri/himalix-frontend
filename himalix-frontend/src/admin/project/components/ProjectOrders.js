import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import LoadingScreen from '../../../components/LoadingScreen';

export default function ProjectOrders() {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/project/orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await authFetch(`/api/admin/project/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
        if (activeOrder && activeOrder.id === id) {
          setActiveOrder(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order record?')) return;
    try {
      const res = await authFetch(`/api/admin/project/orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders(orders.filter(o => o.id !== id));
      }
    } catch (e) {}
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="admin-section fade-in">
      <div className="admin-table-header">
        <div>
          <h2 className="admin-table-header__title">Project Orders</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: '4px' }}>
            Track and process tech project inquiries, purchases, and rentals.
          </p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Project Name</th>
              <th>Buyer</th>
              <th>Type</th>
              <th>Price</th>
              <th>Status</th>
              <th>Created</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td><strong>{o.project_name}</strong></td>
                <td>
                  <div style={{ fontSize: 'var(--text-sm)' }}><strong>{o.buyer_name}</strong></div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>{o.buyer_email}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>{o.buyer_phone}</div>
                  {o.buyer_notes && (
                    <div style={{ fontSize: 'var(--text-xxs)', color: 'var(--accent)', marginTop: 4, fontStyle: 'italic' }}>
                      Notes: {o.buyer_notes}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`badge badge--neutral`}>{o.order_type}</span>
                  {o.order_type === 'rent' && (
                    <div style={{ fontSize: '10px', color: 'var(--accent)', marginTop: 4 }}>
                      {o.rental_duration_days} Days ({o.rental_start_date} to {o.rental_end_date})
                    </div>
                  )}
                </td>
                <td>
                  Rs. {Number(o.price).toLocaleString()}
                  {o.order_type === 'rent' && (
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: 4 }}>
                      Rate: Rs. {Number(o.rental_rate).toLocaleString()}<br/>
                      Deposit: Rs. {Number(o.rental_deposit).toLocaleString()}
                    </div>
                  )}
                </td>
                <td>
                  <select 
                    className="form-select" 
                    value={o.status} 
                    onChange={e => handleStatusChange(o.id, e.target.value)}
                    disabled={updatingId === o.id}
                    style={{ padding: '2px 8px', fontSize: 'var(--text-xs)', width: 'auto' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td style={{ fontSize: 'var(--text-xs)' }}>
                  {new Date(o.created_at).toLocaleString()}
                </td>
                <td className="text-right">
                  <div className="admin-table__actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setActiveOrder(o)} title="View Details" style={{ height: '30px', padding: '0 8px', fontSize: 'var(--text-xs)' }}>
                      <i className="fa-light fa-sharp fa-eye" /> View
                    </button>
                    <button className="admin-table__action-btn admin-table__action-btn--danger" onClick={() => handleDelete(o.id)} title="Delete Record">
                      <i className="fa-light fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan="8" className="text-center py-8">No project orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
 
      {/* Detailed Project Order Viewer Modal */}
      {activeOrder && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveOrder(null); }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="admin-modal" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', width: '90%', maxWidth: '750px', borderRadius: 'var(--radius-md)', padding: 'var(--space-6)' }}>
            <div className="admin-modal__content">
              <div className="admin-modal__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                <h2 className="page-title" style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Project Order Details #{activeOrder.id}</h2>
                <button type="button" className="btn btn-ghost" onClick={() => setActiveOrder(null)} aria-label="Close dialog" style={{ padding: '4px' }}>
                  <i className="fa-light fa-sharp fa-xmark" />
                </button>
              </div>
 
              <div className="admin-modal__body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                  
                  {/* Left: Order Info */}
                  <div>
                    <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Order Info</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '16px' }}>
                      <div><strong>Project:</strong> {activeOrder.project_name}</div>
                      <div><strong>Type:</strong> {activeOrder.order_type.toUpperCase()}</div>
                      <div><strong>Price:</strong> Rs. {Number(activeOrder.price).toLocaleString()}</div>
                      {activeOrder.order_type === 'rent' && (
                        <>
                          <div><strong>Rental Period:</strong> {activeOrder.rental_duration_days} Days ({activeOrder.rental_start_date} to {activeOrder.rental_end_date})</div>
                          <div><strong>Rental Rate:</strong> Rs. {Number(activeOrder.rental_rate).toLocaleString()}</div>
                          <div><strong>Security Deposit:</strong> Rs. {Number(activeOrder.rental_deposit).toLocaleString()}</div>
                          <div><strong>Payment Method:</strong> {activeOrder.payment_method || 'N/A'}</div>
                          <div><strong>Payment Status:</strong> {activeOrder.payment_status || 'N/A'}</div>
                        </>
                      )}
                      <div><strong>Status:</strong> {activeOrder.status.toUpperCase()}</div>
                      <div><strong>Submitted Date:</strong> {new Date(activeOrder.created_at).toLocaleString()}</div>
                    </div>

                    <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Buyer Notes</h3>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', fontSize: '13px', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                      {activeOrder.buyer_notes || 'No notes left by buyer.'}
                    </pre>
                  </div>

                  {/* Right: Buyer Profile & Location */}
                  <div>
                    <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Customer Profile</h3>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', background: 'var(--bg-1)', padding: '12px', border: '1px solid var(--border)' }}>
                      {activeOrder.user_avatar_url ? (
                        <img 
                          src={activeOrder.user_avatar_url} 
                          alt={activeOrder.buyer_name} 
                          style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} 
                        />
                      ) : (
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                          <i className="fa-light fa-sharp fa-user" />
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                        <div><strong>Name:</strong> {activeOrder.buyer_name || 'Guest'}</div>
                        <div><strong>Email:</strong> {activeOrder.buyer_email}</div>
                        <div><strong>Phone:</strong> {activeOrder.buyer_phone || 'N/A'}</div>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Profile Location</h3>
                    {activeOrder.address_line ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', background: 'var(--bg-1)', padding: '12px', border: '1px solid var(--border)' }}>
                        <div><strong>Address:</strong> {activeOrder.address_line}</div>
                        <div><strong>City:</strong> {activeOrder.city}</div>
                        <div><strong>District:</strong> {activeOrder.district}</div>
                        <div><strong>Province:</strong> {activeOrder.province}</div>
                        {activeOrder.lat && activeOrder.lng && (
                          <>
                            <div><strong>Coords:</strong> Lat: {activeOrder.lat}, Lng: {activeOrder.lng}</div>
                            <div>
                              <strong>Google Maps:</strong>{' '}
                              <a 
                                href={`https://maps.google.com/?q=${activeOrder.lat},${activeOrder.lng}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 600 }}
                              >
                                View on Map
                              </a>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>No profile location coordinates/address on file.</div>
                    )}
                  </div>

                </div>
              </div>

              <div className="admin-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setActiveOrder(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

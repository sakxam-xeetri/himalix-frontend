import React, { useState, useEffect } from 'react';

export default function StoreEmailReceivers({ authFetch }) {
  const [receivers, setReceivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [newReceiver, setNewReceiver] = useState({
    id: null,
    email_address: '',
    notify_on_order_placed: true,
    notify_on_low_stock: true,
    notify_on_user_registered: true
  });

  useEffect(() => {
    fetchReceivers();
  }, []);

  const fetchReceivers = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await authFetch('/api/store/admin/notification-receivers');
      if (!res.ok) throw new Error('Failed to fetch email receivers');
      const data = await res.json();
      setReceivers(data || []);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'danger', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddReceiver = async (e) => {
    e.preventDefault();
    if (!newReceiver.email_address.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      const isUpdating = newReceiver.id !== null;
      const url = isUpdating
        ? `/api/store/admin/notification-receivers/${newReceiver.id}`
        : '/api/store/admin/notification-receivers';

      const res = await authFetch(url, {
        method: isUpdating ? 'PUT' : 'POST',
        body: JSON.stringify(newReceiver)
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to save receiver');
      
      setNewReceiver({
        id: null,
        email_address: '',
        notify_on_order_placed: true,
        notify_on_low_stock: true,
        notify_on_user_registered: true
      });
      setMsg({ type: 'success', text: 'Email receiver saved successfully!' });
      await fetchReceivers();
    } catch (err) {
      setMsg({ type: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReceiver = async (id, email) => {
    if (!window.confirm(`Are you sure you want to delete receiver: ${email}?`)) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await authFetch(`/api/store/admin/notification-receivers/${id}`, {
        method: 'DELETE'
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to delete receiver');
      setMsg({ type: 'success', text: 'Receiver deleted successfully!' });
      await fetchReceivers();
    } catch (err) {
      setMsg({ type: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-section fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="admin-view-title" style={{ margin: 0 }}>Store Email Notification Alert Receivers</h2>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type} mb-6`} style={{ maxWidth: 800 }}>
          <i className={`fa-light fa-sharp fa-${msg.type === 'success' ? 'circle-check' : 'circle-exclamation'}`} />
          {msg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Form panel */}
        <form onSubmit={handleAddReceiver} className="flex flex-col gap-4" style={{ border: '1px solid var(--border)', padding: 'var(--space-4)', background: 'var(--bg-secondary)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--accent)', fontWeight: 600, margin: 0 }}>
            {newReceiver.id ? 'Edit Recipient Settings' : 'Add New Recipient'}
          </h3>
          
          <div className="form-group mb-0">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@example.com"
              value={newReceiver.email_address}
              onChange={e => setNewReceiver({ ...newReceiver, email_address: e.target.value })}
              required
              disabled={newReceiver.id !== null}
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-0)' }}
            />
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <label className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--text-1)' }}>
              <input 
                type="checkbox" 
                checked={newReceiver.notify_on_order_placed} 
                onChange={e => setNewReceiver({ ...newReceiver, notify_on_order_placed: e.target.checked })} 
              />
              Notify on New Orders
            </label>
            <label className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--text-1)' }}>
              <input 
                type="checkbox" 
                checked={newReceiver.notify_on_low_stock} 
                onChange={e => setNewReceiver({ ...newReceiver, notify_on_low_stock: e.target.checked })} 
              />
              Notify on Low Stock Warnings
            </label>
            <label className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--text-1)' }}>
              <input 
                type="checkbox" 
                checked={newReceiver.notify_on_user_registered} 
                onChange={e => setNewReceiver({ ...newReceiver, notify_on_user_registered: e.target.checked })} 
              />
              Notify on User Registrations
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            {newReceiver.id && (
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setNewReceiver({ id: null, email_address: '', notify_on_order_placed: true, notify_on_low_stock: true, notify_on_user_registered: true })}
              >
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {newReceiver.id ? 'Update Receiver' : 'Add Receiver'}
            </button>
          </div>
        </form>

        {/* List panel */}
        {loading ? (
          <div className="spinner" />
        ) : (
          <div className="admin-table-wrap" style={{ margin: 0 }}>
            <table className="admin-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Recipient Email</th>
                  <th>New Orders</th>
                  <th>Low Stock</th>
                  <th>New Users</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receivers.map((item) => (
                  <tr key={item.id}>
                    <td><strong className="font-mono">{item.email_address}</strong></td>
                    <td>
                      <i className={`fa-light fa-${item.notify_on_order_placed ? 'check text-success' : 'xmark text-danger'}`} />
                    </td>
                    <td>
                      <i className={`fa-light fa-${item.notify_on_low_stock ? 'check text-success' : 'xmark text-danger'}`} />
                    </td>
                    <td>
                      <i className={`fa-light fa-${item.notify_on_user_registered ? 'check text-success' : 'xmark text-danger'}`} />
                    </td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setNewReceiver({
                            id: item.id,
                            email_address: item.email_address,
                            notify_on_order_placed: !!item.notify_on_order_placed,
                            notify_on_low_stock: !!item.notify_on_low_stock,
                            notify_on_user_registered: !!item.notify_on_user_registered
                          })}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteReceiver(item.id, item.email_address)}
                          disabled={saving}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {receivers.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center' }}>No notification receivers configured.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

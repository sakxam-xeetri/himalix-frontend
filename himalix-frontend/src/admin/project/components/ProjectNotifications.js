import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import LoadingScreen from '../../../components/LoadingScreen';

export default function ProjectNotifications() {
  const { authFetch } = useAuth();
  const [receivers, setReceivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);

  useEffect(() => {
    fetchReceivers();
  }, []);

  const fetchReceivers = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/project/notifications/receivers');
      const data = await res.json();
      setReceivers(data.receivers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this recipient email?')) return;
    try {
      await authFetch(`/api/admin/project/notifications/receivers/${id}`, { method: 'DELETE' });
      setReceivers(receivers.filter(r => r.id !== id));
    } catch (e) {}
  };

  const openEditModal = (receiver = null) => {
    if (receiver) {
      setEditModal({ ...receiver });
    } else {
      setEditModal({ email_address: '', notify_on_order: true, notify_on_status_change: true, active: true });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editModal.id) {
        await authFetch(`/api/admin/project/notifications/receivers/${editModal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editModal)
        });
      } else {
        await authFetch('/api/admin/project/notifications/receivers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editModal)
        });
      }
      setEditModal(null);
      fetchReceivers();
    } catch (e) {}
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="admin-section fade-in">
      <div className="admin-table-header">
        <div>
          <h2 className="admin-table-header__title">Project Email Alerts</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: '4px' }}>
            Configure receivers to get SMTP notification emails on project events.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openEditModal()}>
          <i className="fa-light fa-plus mr-2"></i> Add Recipient
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Recipient Email</th>
              <th>Notify on Order</th>
              <th>Notify on Status Change</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {receivers.map(r => (
              <tr key={r.id}>
                <td>#{r.id}</td>
                <td><strong>{r.email_address}</strong></td>
                <td>
                  <i className={`fa-light fa-${r.notify_on_order ? 'check text-success' : 'xmark text-danger'}`}></i>
                </td>
                <td>
                  <i className={`fa-light fa-${r.notify_on_status_change ? 'check text-success' : 'xmark text-danger'}`}></i>
                </td>
                <td>
                  <span className={`badge badge--neutral`}>
                    {r.active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="text-right">
                  <div className="admin-table__actions">
                    <button className="admin-table__action-btn" onClick={() => openEditModal(r)} title="Edit">
                      <i className="fa-light fa-pen"></i>
                    </button>
                    <button className="admin-table__action-btn admin-table__action-btn--danger" onClick={() => handleDelete(r.id)} title="Delete">
                      <i className="fa-light fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {receivers.length === 0 && (
              <tr><td colSpan="6" className="text-center py-8">No email notification receivers defined.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Modal */}
      {editModal && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditModal(null); }}>
          <div className="admin-modal" style={{ maxWidth: 450 }}>
            <div className="admin-modal__content">
              <div className="admin-modal__header">
                <span className="admin-modal__title">{editModal.id ? 'Edit Recipient' : 'Add Recipient'}</span>
                <button className="admin-modal__close" onClick={() => setEditModal(null)}>
                  <i className="fa-light fa-xmark"></i>
                </button>
              </div>
              <form onSubmit={handleSave} className="admin-modal__body" style={{ gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" required
                    value={editModal.email_address} onChange={e => setEditModal({ ...editModal, email_address: e.target.value })}
                  />
                </div>

                <div className="form-group flex items-center gap-2 mt-2">
                  <input type="checkbox" id="notify_order" checked={editModal.notify_on_order}
                    onChange={e => setEditModal({ ...editModal, notify_on_order: e.target.checked })}
                  />
                  <label htmlFor="notify_order" style={{ cursor: 'pointer' }}>Notify on New Project Order</label>
                </div>

                <div className="form-group flex items-center gap-2">
                  <input type="checkbox" id="notify_status" checked={editModal.notify_on_status_change}
                    onChange={e => setEditModal({ ...editModal, notify_on_status_change: e.target.checked })}
                  />
                  <label htmlFor="notify_status" style={{ cursor: 'pointer' }}>Notify on Order Status Change</label>
                </div>

                <div className="form-group flex items-center gap-2">
                  <input type="checkbox" id="active_receiver" checked={editModal.active}
                    onChange={e => setEditModal({ ...editModal, active: e.target.checked })}
                  />
                  <label htmlFor="active_receiver" style={{ cursor: 'pointer' }}>Active (Receive emails)</label>
                </div>

                <div className="admin-modal__footer" style={{ borderTop: 'none', padding: 0, marginTop: 'var(--space-4)' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setEditModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Recipient</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

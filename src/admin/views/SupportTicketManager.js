import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import useBatchSelection from '../../hooks/useBatchSelection';
import BatchCheckbox from '../components/BatchCheckbox';
import BatchActionBar from '../components/BatchActionBar';
import BatchToast from '../components/BatchToast';
import { exportToCsv } from '../utils/csvExport';

export default function SupportTicketManager({
  tickets,
  loading,
  activeTicket,
  activeTicketMessages,
  ticketMessagesLoading,
  adminReplyText,
  onSelectTicket,
  onSendReply,
  onUpdateStatus,
  onReplyTextChange,
  onRefresh,
}) {
  const { authFetch } = useAuth();

  const {
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isSelected,
    isSelectedAll,
    isIndeterminate,
    selectionCount
  } = useBatchSelection();

  const [batchLoading, setBatchLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleBatchStatus = async (status) => {
    setBatchLoading(true);
    try {
      const res = await authFetch('/api/store/admin/batch-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'support_tickets', ids: selectedIds, status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Batch status update failed');
      clearSelection();
      if (onRefresh) onRefresh();
      setToast({ message: `Successfully updated status for ${selectedIds.length} tickets`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    setBatchLoading(true);
    try {
      const res = await authFetch('/api/store/admin/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'support_tickets', ids: selectedIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Batch delete failed');
      clearSelection();
      if (onRefresh) onRefresh();
      setToast({ message: `Successfully deleted ${selectedIds.length} tickets`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleExportCsv = () => {
    const exportData = tickets.filter(t => selectedIds.includes(t.id));
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'User Email', key: 'user_email' },
      { header: 'Subject', key: 'subject' },
      { header: 'Category', key: 'category' },
      { header: 'Status', key: 'status' },
      { header: 'Updated At', key: (t) => new Date(t.updated_at).toLocaleString() }
    ];
    exportToCsv(exportData, columns, 'support_tickets_export');
  };

  if (activeTicket) {
    return (
      <div>
        <h2 className="admin-view-title">Support Tickets</h2>

        <button onClick={() => onSelectTicket(null)} className="btn btn-outline btn-sm" style={{ marginBottom: 'var(--space-4)' }}>
          <i className="fa-light fa-sharp fa-arrow-left" style={{ marginRight: '6px' }} /> Back to Tickets
        </button>

        {/* Ticket header bar */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>Ticket #{activeTicket.id}: {activeTicket.subject}</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
              User: {activeTicket.user_name || activeTicket.user_email} • Category: {activeTicket.category}
            </span>
          </div>
          <select value={activeTicket.status} onChange={e => onUpdateStatus(activeTicket.id, e.target.value)} className="form-select" style={{ padding: '4px 8px', fontSize: '12px' }}>
            <option value="open">Open</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Chat thread */}
        <div style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '300px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '350px' }}>
            {ticketMessagesLoading ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}><div className="spinner" /></div>
            ) : activeTicketMessages.map(m => {
              const isMe = m.sender_role === 'admin';
              return (
                <div key={m.id} style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  backgroundColor: isMe ? 'var(--bg-3)' : 'var(--bg-1)',
                  border: '1px solid var(--border-strong)',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  <strong style={{ display: 'block', fontSize: '10px', color: isMe ? 'var(--accent)' : 'var(--text-0)', marginBottom: '2px' }}>
                    {m.sender_name} ({m.sender_role})
                  </strong>
                  <p style={{ margin: 0, color: 'var(--text-1)', whiteSpace: 'pre-wrap' }}>{m.message}</p>
                  <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-3)', marginTop: '4px', textAlign: 'right' }}>
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Reply form */}
          <form onSubmit={onSendReply} style={{ display: 'flex', gap: '8px', borderTop: '1px dashed var(--border)', paddingTop: '12px', marginTop: 'auto' }}>
            <input
              type="text"
              placeholder="Type reply..."
              className="form-input"
              value={adminReplyText}
              onChange={e => onReplyTextChange(e.target.value)}
              style={{ flex: 1, fontSize: '12px', padding: '6px' }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }}>Send</button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Tickets list view ── */
  return (
    <div>
      <h2 className="admin-view-title">Support Tickets</h2>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}><div className="spinner" /></div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">No support tickets found.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <BatchCheckbox
                    checked={isSelectedAll(tickets)}
                    indeterminate={isIndeterminate(tickets)}
                    onChange={() => toggleSelectAll(tickets)}
                  />
                </th>
                <th>ID</th><th>User</th><th>Subject</th><th>Category</th><th>Status</th><th>Updated</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => {
                const selected = isSelected(t.id);
                return (
                  <tr key={t.id} className={selected ? 'row-selected' : ''}>
                    <td>
                      <BatchCheckbox
                        checked={selected}
                        onChange={() => toggleSelect(t.id)}
                      />
                    </td>
                    <td>#{t.id}</td>
                    <td>{t.user_name || t.user_email}</td>
                    <td><strong>{t.subject}</strong></td>
                    <td>{t.category}</td>
                    <td>
                      <span className={`badge ${t.status === 'open' ? 'badge-warning' : t.status === 'replied' ? 'badge-success' : 'badge-danger'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>{new Date(t.updated_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => onSelectTicket(t)}>Open Chat</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!activeTicket && (
        <BatchActionBar
          selectionCount={selectionCount}
          onClearSelection={clearSelection}
          onExportCsv={handleExportCsv}
          loading={batchLoading}
          actions={[
            {
              label: 'Close Selected',
              icon: 'lock',
              onClick: () => handleBatchStatus('closed')
            },
            {
              label: 'Set Open',
              icon: 'unlock',
              onClick: () => handleBatchStatus('open')
            },
            {
              label: 'Delete Selected',
              icon: 'trash',
              variant: 'danger',
              confirm: `Are you sure you want to delete ${selectionCount} support tickets permanently?`,
              onClick: handleBatchDelete
            }
          ]}
        />
      )}
      {toast && <BatchToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

import React, { useState, useEffect } from 'react';

export default function MessageManager({ token, authFetch }) {
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [activeMsg, setActiveMsg] = useState(null);

  // Fetch messages
  const fetchMessages = async () => {
    setMsgLoading(true);
    try {
      const res = await authFetch('/api/admin/messages');
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setMsgLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await authFetch(`/api/admin/messages/${id}/read`, {
        method: 'PUT'
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: 1 } : m));
        if (activeMsg && activeMsg.id === id) {
          setActiveMsg(prev => ({ ...prev, is_read: 1 }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await authFetch(`/api/admin/messages/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id));
        if (activeMsg && activeMsg.id === id) {
          setActiveMsg(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-messages" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Title Header instead of tabs */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <i className="fa-light fa-sharp fa-inbox" />
          Contact Inquiries ({messages.filter(m => !m.is_read).length} unread)
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: activeMsg ? '1fr 1.2fr' : '1fr', gap: 'var(--space-6)' }}>
        {/* Messages List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Inquiries Inbox</span>
            <button className="btn btn-ghost btn-sm" onClick={fetchMessages} disabled={msgLoading}>
              <i className="fa-light fa-sharp fa-rotate" /> Refresh
            </button>
          </div>

          {msgLoading ? <div className="spinner" /> : messages.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxHeight: '65vh', overflowY: 'auto' }}>
              {messages.map(m => (
                <div 
                  key={m.id}
                  className="cms-section-card"
                  style={{ 
                    cursor: 'pointer',
                    borderLeft: m.is_read ? '1px solid var(--border)' : '3px solid var(--accent)',
                    background: activeMsg && activeMsg.id === m.id ? 'var(--bg-3)' : 'var(--bg-1)'
                  }}
                  onClick={() => {
                    setActiveMsg(m);
                    if (!m.is_read) handleMarkAsRead(m.id);
                  }}
                >
                  <div className="cms-section-card__body" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div className="flex justify-between items-start">
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-0)' }}>{m.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{formatDate(m.created_at)}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.subject || 'No Subject'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <i className="fa-light fa-sharp fa-envelope-open empty-state-icon" />
              <p>No inquiries received yet.</p>
            </div>
          )}
        </div>

        {/* Details Pane */}
        {activeMsg && (
          <div className="cms-section-card" style={{ background: 'var(--bg-1)', display: 'flex', flexDirection: 'column' }}>
            <div className="cms-section-card__header">
              <div className="cms-section-card__title">
                <i className="fa-light fa-sharp fa-message" /> Inquiry Details
              </div>
              <div className="flex gap-2">
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMessage(activeMsg.id)}>
                  <i className="fa-light fa-sharp fa-trash" /> Delete
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setActiveMsg(null)}>
                  <i className="fa-light fa-sharp fa-xmark" /> Close
                </button>
              </div>
            </div>
            <div className="cms-section-card__body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', fontSize: '13px', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)' }}>
                <div><strong>From:</strong> {activeMsg.name}</div>
                <div><strong>Email:</strong> <a href={`mailto:${activeMsg.email}`} style={{ color: 'var(--info)' }}>{activeMsg.email}</a></div>
                <div><strong>Date:</strong> {formatDate(activeMsg.created_at)}</div>
                <div><strong>Status:</strong> {activeMsg.is_read ? 'Read' : 'Unread'}</div>
              </div>

              <div style={{ fontSize: '13px' }}>
                <strong>Subject:</strong> {activeMsg.subject || 'No Subject'}
              </div>

              <div style={{ flex: 1, background: 'var(--bg-0)', border: '1px solid var(--border)', padding: 'var(--space-4)', fontSize: '14px', whiteSpace: 'pre-line', color: 'var(--text-1)', minHeight: '150px' }}>
                {activeMsg.message}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

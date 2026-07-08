import React, { useState, useEffect, useCallback } from 'react';

export default function CommunicationsHub({ authFetch, token, user }) {
  const [activeTab, setActiveTab] = useState('tickets'); // tickets, inbox, crm

  // Support Tickets State
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [activeTicketMessages, setActiveTicketMessages] = useState([]);
  const [ticketMessagesLoading, setTicketMessagesLoading] = useState(false);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Contact Inbox State
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [activeMsg, setActiveMsg] = useState(null);

  // CRM Users State
  const [users, setUsers] = useState([]);
  const [crmLoading, setCrmLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [crmSearch, setCrmSearch] = useState('');

  const fetchTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const res = await authFetch('/api/store/admin/support-tickets');
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (e) {
      console.error(e);
    } finally {
      setTicketsLoading(false);
    }
  }, [authFetch]);

  const fetchInbox = useCallback(async () => {
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
  }, [authFetch]);

  const fetchCRM = useCallback(async () => {
    setCrmLoading(true);
    try {
      const res = await authFetch('/api/store/admin/users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : (data.users || []));
    } catch (e) {
      console.error(e);
    } finally {
      setCrmLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (activeTab === 'tickets') fetchTickets();
    if (activeTab === 'inbox') fetchInbox();
    if (activeTab === 'crm') fetchCRM();
  }, [activeTab, fetchTickets, fetchInbox, fetchCRM]);

  // Support Ticket Actions
  const handleSelectTicket = async (ticket) => {
    setActiveTicket(ticket);
    if (!ticket) return;
    setTicketMessagesLoading(true);
    try {
      const res = await authFetch(`/api/store/admin/support-tickets/${ticket.id}/messages`);
      const d = await res.json();
      if (res.ok) setActiveTicketMessages(d.messages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTicketMessagesLoading(false);
    }
  };

  const handleSendAdminReply = async (e) => {
    e.preventDefault();
    if (!adminReplyText.trim()) return;
    try {
      const res = await authFetch(`/api/store/admin/support-tickets/${activeTicket.id}/reply`, {
        method: 'POST', body: JSON.stringify({ message: adminReplyText })
      });
      if (res.ok) {
        setActiveTicketMessages(prev => [...prev, {
          id: Date.now(), ticket_id: activeTicket.id, sender_id: user.id,
          message: adminReplyText, sender_name: user.name || user.email,
          sender_role: 'admin', created_at: new Date().toISOString()
        }]);
        setAdminReplyText('');
        setTickets(prev => prev.map(t => t.id === activeTicket.id ? { ...t, status: 'replied' } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTicketStatus = async (ticketId, status) => {
    try {
      const res = await authFetch(`/api/store/admin/support-tickets/${ticketId}/status`, {
        method: 'PUT', body: JSON.stringify({ status })
      });
      if (res.ok) {
        setActiveTicket(prev => prev && prev.id === ticketId ? { ...prev, status } : prev);
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Contact Inbox Actions
  const handleMarkAsRead = async (id) => {
    try {
      const res = await authFetch(`/api/admin/messages/${id}/read`, { method: 'PUT' });
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
      const res = await authFetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
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
    return new Date(isoStr).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // CRM Search Filter
  const filteredUsers = users.filter(u => {
    if (!crmSearch.trim()) return true;
    const query = crmSearch.toLowerCase();
    return u.name?.toLowerCase().includes(query) ||
           u.email?.toLowerCase().includes(query) ||
           u.phone?.toLowerCase().includes(query);
  });

  return (
    <div className="admin-communications fade-in">
      {/* Title Header */}
      <div className="admin-table-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="admin-table-header__title">Communications Hub</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: '4px' }}>
            Manage client correspondence, support tickets, and review customer database profiles.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
        <button 
          className={`btn btn-sm ${activeTab === 'tickets' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('tickets')}
        >
          <i className="fa-light fa-sharp fa-headset" style={{ marginRight: '6px' }} />
          Support Tickets
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'inbox' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('inbox')}
        >
          <i className="fa-light fa-sharp fa-inbox" style={{ marginRight: '6px' }} />
          Contact Inbox
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'crm' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('crm')}
        >
          <i className="fa-light fa-sharp fa-address-book" style={{ marginRight: '6px' }} />
          Customer CRM
        </button>
      </div>

      {/* Sub-tab content panes */}
      {activeTab === 'tickets' && (
        <div style={{ display: 'grid', gridTemplateColumns: activeTicket ? '320px 1fr' : '1fr', gap: '20px' }}>
          {/* Tickets List */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ fontSize: '14px' }}>Tickets Directory</strong>
              <button className="btn btn-ghost btn-sm" onClick={fetchTickets} disabled={ticketsLoading} style={{ padding: '4px' }}>
                <i className="fa-light fa-sharp fa-rotate" />
              </button>
            </div>

            {ticketsLoading ? (
              <div className="spinner" />
            ) : tickets.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0', fontSize: '12px' }}>No tickets found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto' }}>
                {tickets.map(t => (
                  <div 
                    key={t.id}
                    className="cms-section-card"
                    style={{ 
                      cursor: 'pointer',
                      borderLeft: t.status === 'open' ? '3px solid var(--accent)' : '1px solid var(--border)',
                      background: activeTicket && activeTicket.id === t.id ? 'var(--bg-3)' : 'var(--bg-1)',
                      padding: '12px'
                    }}
                    onClick={() => handleSelectTicket(t)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>
                      <span>Ticket #{t.id}</span>
                      <span>{new Date(t.updated_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.subject}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>{t.category}</span>
                      <span className={`badge ${t.status === 'open' ? 'badge--warning' : t.status === 'replied' ? 'badge--success' : 'badge--danger'}`} style={{ fontSize: '9px', padding: '1px 4px' }}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Messaging Pane */}
          {activeTicket ? (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '16px', display: 'flex', flexDirection: 'column', height: '65vh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px' }}>{activeTicket.subject}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                    Client: {activeTicket.user_name || activeTicket.user_email} • Category: {activeTicket.category}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select 
                    value={activeTicket.status} 
                    onChange={e => handleUpdateTicketStatus(activeTicket.id, e.target.value)} 
                    className="form-select" 
                    style={{ padding: '2px 8px', fontSize: '12px', height: '30px', width: '100px' }}
                  >
                    <option value="open">Open</option>
                    <option value="replied">Replied</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTicket(null)}>
                    <i className="fa-light fa-sharp fa-xmark" />
                  </button>
                </div>
              </div>

              {/* Chat messages view */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px', marginBottom: '16px' }}>
                {ticketMessagesLoading ? (
                  <div className="spinner" />
                ) : activeTicketMessages.map(m => {
                  const isMe = m.sender_role === 'admin';
                  return (
                    <div 
                      key={m.id} 
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        backgroundColor: isMe ? 'var(--bg-3)' : 'var(--bg-1)',
                        border: '1px solid var(--border-strong)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        position: 'relative'
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '10px', color: isMe ? 'var(--accent)' : 'var(--text-0)', marginBottom: '4px' }}>
                        {m.sender_name} ({m.sender_role})
                      </strong>
                      <p style={{ margin: 0, color: 'var(--text-1)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{m.message}</p>
                      <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-3)', marginTop: '6px', textAlign: 'right' }}>
                        {formatDate(m.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chat Reply Form */}
              <form onSubmit={handleSendAdminReply} style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Type reply to client..." 
                  className="form-input"
                  value={adminReplyText}
                  onChange={e => setAdminReplyText(e.target.value)}
                  style={{ fontSize: '13px' }}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px' }}>Reply</button>
              </form>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', height: '40vh', color: 'var(--text-3)' }}>
              Select a support ticket from the directory to start chatting.
            </div>
          )}
        </div>
      )}

      {activeTab === 'inbox' && (
        <div style={{ display: 'grid', gridTemplateColumns: activeMsg ? '320px 1fr' : '1fr', gap: '20px' }}>
          {/* Messages Directory */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ fontSize: '14px' }}>Inbox Messages</strong>
              <button className="btn btn-ghost btn-sm" onClick={fetchInbox} disabled={msgLoading} style={{ padding: '4px' }}>
                <i className="fa-light fa-sharp fa-rotate" />
              </button>
            </div>

            {msgLoading ? (
              <div className="spinner" />
            ) : messages.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0', fontSize: '12px' }}>No messages found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto' }}>
                {messages.map(m => (
                  <div 
                    key={m.id}
                    className="cms-section-card"
                    style={{ 
                      cursor: 'pointer',
                      borderLeft: m.is_read ? '1px solid var(--border)' : '3px solid var(--accent)',
                      background: activeMsg && activeMsg.id === m.id ? 'var(--bg-3)' : 'var(--bg-1)',
                      padding: '12px'
                    }}
                    onClick={() => {
                      setActiveMsg(m);
                      if (!m.is_read) handleMarkAsRead(m.id);
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>
                      <span>Client: {m.name}</span>
                      <span>{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.subject || 'No Subject'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inquiry Details Pane */}
          {activeMsg ? (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '20px', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '15px' }}>{activeMsg.subject || 'No Subject'}</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMessage(activeMsg.id)}>
                    <i className="fa-light fa-sharp fa-trash" /> Delete
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveMsg(null)}>
                    <i className="fa-light fa-sharp fa-xmark" />
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', background: 'var(--bg-tertiary)', padding: '12px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                <div><strong>Sender:</strong> {activeMsg.name}</div>
                <div><strong>Email:</strong> <a href={`mailto:${activeMsg.email}`} style={{ color: 'var(--info)' }}>{activeMsg.email}</a></div>
                <div><strong>Date Received:</strong> {formatDate(activeMsg.created_at)}</div>
                <div><strong>Status:</strong> {activeMsg.is_read ? 'Opened & Read' : 'Unopened'}</div>
              </div>

              <div style={{ flex: 1, background: 'var(--bg-0)', border: '1px solid var(--border)', padding: '16px', fontSize: '13px', whiteSpace: 'pre-line', color: 'var(--text-1)', minHeight: '180px' }}>
                {activeMsg.message}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', height: '40vh', color: 'var(--text-3)' }}>
              Select a contact inquiry message to view details.
            </div>
          )}
        </div>
      )}

      {activeTab === 'crm' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedUser ? '320px 1fr' : '1fr', gap: '20px' }}>
          {/* CRM Users List */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <input 
                  type="text" 
                  placeholder="Search clients..." 
                  className="form-input"
                  value={crmSearch}
                  onChange={e => setCrmSearch(e.target.value)}
                  style={{ fontSize: '13px', paddingLeft: '32px' }}
                />
                <i className="fa-light fa-sharp fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              </div>
            </div>

            {crmLoading ? (
              <div className="spinner" />
            ) : filteredUsers.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0', fontSize: '12px' }}>No clients found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto' }}>
                {filteredUsers.map(u => (
                  <div 
                    key={u.id}
                    className="cms-section-card"
                    style={{ 
                      cursor: 'pointer',
                      background: selectedUser && selectedUser.id === u.id ? 'var(--bg-3)' : 'var(--bg-1)',
                      padding: '12px',
                      border: '1px solid var(--border)'
                    }}
                    onClick={() => setSelectedUser(u)}
                  >
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-0)' }}>
                      {u.name || 'Anonymous User'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px', wordBreak: 'break-all' }}>
                      {u.email}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '10px', color: 'var(--text-3)' }}>
                      <span>Joined: {new Date(u.created_at).toLocaleDateString()}</span>
                      <span className={`badge ${u.role === 'admin' ? 'badge--danger' : 'badge--info'}`} style={{ padding: '0 4px', fontSize: '9px' }}>
                        {u.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CRM Profile Details */}
          {selectedUser ? (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '16px' }}>
                  <i className="fa-light fa-sharp fa-circle-user" style={{ marginRight: '6px', color: 'var(--accent)' }} />
                  Client Profile
                </h4>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedUser(null)}>
                  <i className="fa-light fa-sharp fa-xmark" />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: 'var(--bg-tertiary)', padding: '16px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                <div><strong>Full Name:</strong> <div style={{ marginTop: '4px', fontSize: '15px', fontWeight: 600 }}>{selectedUser.name || 'N/A'}</div></div>
                <div><strong>Email Address:</strong> <div style={{ marginTop: '4px', fontSize: '14px', wordBreak: 'break-all' }}><a href={`mailto:${selectedUser.email}`} style={{ color: 'var(--info)' }}>{selectedUser.email}</a></div></div>
                <div><strong>Phone Number:</strong> <div style={{ marginTop: '4px' }}>{selectedUser.phone || 'Not Provided'}</div></div>
                <div><strong>Joined Date:</strong> <div style={{ marginTop: '4px' }}>{new Date(selectedUser.created_at).toLocaleDateString()}</div></div>
                <div><strong>System Account Role:</strong> <div style={{ marginTop: '4px', textTransform: 'capitalize' }}>{selectedUser.role}</div></div>
                <div><strong>Avatar Status:</strong> <div style={{ marginTop: '4px' }}>{selectedUser.avatar_url ? 'Has Custom Avatar' : 'Default Placeholder'}</div></div>
              </div>

              {/* Action Toolbar for CRM */}
              <div>
                <h5 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginBottom: '12px' }}>Quick Communications</h5>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <a href={`mailto:${selectedUser.email}`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <i className="fa-light fa-sharp fa-paper-plane" /> Send Email
                  </a>
                  {selectedUser.phone && (
                    <a href={`tel:${selectedUser.phone}`} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <i className="fa-light fa-sharp fa-phone" /> Call Client
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', height: '40vh', color: 'var(--text-3)' }}>
              Select a customer from the registry directory list to view profile CRM history.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

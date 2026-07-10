import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import LocationPicker from '../components/LocationPicker';

export default function Profile() {
  const { user, setUser, authFetch, logout } = useAuth();
  const navigate = useNavigate();
  
  const [tab, setTab] = useState('orders');

  /* Store Orders */
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  /* 3D Printing Orders */
  const [printOrders, setPrintOrders] = useState([]);
  const [printsLoading, setPrintsLoading] = useState(false);
  const [payingPrintId, setPayingPrintId] = useState(null);

  /* Web Agency Inquiries */
  const [webInquiries, setWebInquiries] = useState([]);
  const [webLoading, setWebLoading] = useState(false);

  /* Wallet & History */
  const [wallet, setWallet] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialMsg, setSocialMsg] = useState('');

  /* Wishlist */
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  /* Project Orders for Downloads */
  const [projectOrders, setProjectOrders] = useState([]);
  const [downloadsLoading, setDownloadsLoading] = useState(false);

  /* Web Inquiry Workspace States */
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryMessages, setInquiryMessages] = useState([]);
  const [inquiryRevisions, setInquiryRevisions] = useState([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newRevision, setNewRevision] = useState({ client_notes: '', priority: 'medium' });

  /* Support Tickets States */
  const [supportTickets, setSupportTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [ticketMsgLoading, setTicketMsgLoading] = useState(false);
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({ subject: '', category: 'Store', message: '' });
  const [createTicketLoading, setCreateTicketLoading] = useState(false);

  /* Profile Form */
  const [profileForm, setProfileForm] = useState({ 
    name: '', 
    phone: '', 
    addressLine: '',
    city: '',
    district: '',
    province: '',
    lat: '',
    lng: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  /* Password form */
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  // Load profile details
  useEffect(() => {
    if (user) {
      let sa = {};
      if (user.shipping_address) {
        if (typeof user.shipping_address === 'string') {
          try { sa = JSON.parse(user.shipping_address); } catch (e) { sa = { addressLine: user.shipping_address }; }
        } else {
          sa = user.shipping_address;
        }
      }
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        addressLine: sa?.addressLine || '',
        city: sa?.city || '',
        district: sa?.district || '',
        province: sa?.province || '',
        lat: sa?.lat || '',
        lng: sa?.lng || ''
      });
    }
  }, [user]);

  // Fetch orders and wallet on load
  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    authFetch('/api/store/orders/my')
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : (d.orders || [])))
      .finally(() => setOrdersLoading(false));

    authFetch('/api/store/wallet')
      .then(r => r.json())
      .then(d => setWallet(d.wallet))
      .catch(e => console.error(e));
  }, [user, authFetch]);

  // Tab specific data loaders
  useEffect(() => {
    if (!user) return;
    if (tab === 'prints') {
      setPrintsLoading(true);
      authFetch('/api/3d')
        .then(r => r.json())
        .then(d => setPrintOrders(d.orders || []))
        .finally(() => setPrintsLoading(false));
    } else if (tab === 'web') {
      setWebLoading(true);
      authFetch('/api/web')
        .then(r => r.json())
        .then(d => setWebInquiries(d.inquiries || []))
        .finally(() => setWebLoading(false));
    } else if (tab === 'wallet') {
      setHistoryLoading(true);
      authFetch('/api/store/wallet/history')
        .then(r => r.json())
        .then(d => setHistory(d.history || []))
        .finally(() => setHistoryLoading(false));
    } else if (tab === 'wishlist') {
      setWishlistLoading(true);
      authFetch('/api/store/wishlist')
        .then(r => r.json())
        .then(d => setWishlist(d.wishlist || []))
        .finally(() => setWishlistLoading(false));
    } else if (tab === 'downloads') {
      setDownloadsLoading(true);
      authFetch('/api/project/orders/my')
        .then(r => r.json())
        .then(d => setProjectOrders(d.orders || []))
        .finally(() => setDownloadsLoading(false));
    } else if (tab === 'tickets') {
      setTicketsLoading(true);
      authFetch('/api/support')
        .then(r => r.json())
        .then(d => setSupportTickets(d.tickets || []))
        .finally(() => setTicketsLoading(false));
    }
  }, [tab, user, authFetch]);

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const res = await authFetch(`/api/store/wishlist/${productId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setWishlist(prev => prev.filter(item => item.product_id !== productId));
      }
    } catch (e) {
      console.error('Failed to remove from wishlist:', e);
    }
  };

  const handlePayPrintQuote = async (orderId, price) => {
    if (!window.confirm(`Are you sure you want to pay Rs. ${Number(price).toLocaleString()} for this 3D print quote?`)) return;
    setPayingPrintId(orderId);
    try {
      const res = await authFetch(`/api/3d/checkout/${orderId}`, {
        method: 'POST'
      });
      const d = await res.json();
      if (res.ok) {
        alert(d.message || 'Payment successful!');
        if (d.wallet_balance !== undefined) {
          setUser(prev => ({ ...prev, wallet_balance: d.wallet_balance }));
        }
        setPrintOrders(prev => prev.map(p => p.id === orderId ? { ...p, status: 'approved', payment_status: 'paid', payment_method: 'store_credit' } : p));
      } else {
        alert(d.error || 'Failed to pay quote.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Failed to approve quotation.');
    } finally {
      setPayingPrintId(null);
    }
  };

  const handleSelectInquiry = async (inq) => {
    setSelectedInquiry(inq);
    if (!inq) return;
    setWorkspaceLoading(true);
    try {
      const [msgRes, revRes] = await Promise.all([
        authFetch(`/api/web/${inq.id}/messages`).then(r => r.json()),
        authFetch(`/api/web/${inq.id}/revisions`).then(r => r.json())
      ]);
      setInquiryMessages(msgRes.messages || []);
      setInquiryRevisions(revRes.revisions || []);
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleSendWorkspaceMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await authFetch(`/api/web/${selectedInquiry.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: newMessage })
      });
      if (res.ok) {
        const userMsg = {
          id: Date.now(),
          inquiry_id: selectedInquiry.id,
          sender_id: user.id,
          message: newMessage,
          sender_name: user.name || user.email,
          sender_role: user.role,
          created_at: new Date().toISOString()
        };
        setInquiryMessages(prev => [...prev, userMsg]);
        setNewMessage('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddWorkspaceRevision = async (e) => {
    e.preventDefault();
    if (!newRevision.client_notes.trim()) return;
    try {
      const res = await authFetch(`/api/web/${selectedInquiry.id}/revisions`, {
        method: 'POST',
        body: JSON.stringify(newRevision)
      });
      const d = await res.json();
      if (res.ok) {
        alert(d.message || 'Revision request logged.');
        const loggedRev = {
          id: Date.now(),
          inquiry_id: selectedInquiry.id,
          client_notes: newRevision.client_notes,
          priority: newRevision.priority,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        setInquiryRevisions(prev => [loggedRev, ...prev]);
        setNewRevision({ client_notes: '', priority: 'medium' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveWebProposal = async (inqId) => {
    if (!window.confirm('Are you sure you want to accept this proposal quotation?')) return;
    try {
      const res = await authFetch(`/api/web/${inqId}/approve-proposal`, {
        method: 'PUT'
      });
      if (res.ok) {
        alert('Proposal accepted successfully!');
        setSelectedInquiry(prev => ({ ...prev, status: 'accepted' }));
        setWebInquiries(prev => prev.map(w => w.id === inqId ? { ...w, status: 'accepted' } : w));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    if (!ticket) return;
    setTicketMsgLoading(true);
    try {
      const res = await authFetch(`/api/support/${ticket.id}`);
      const d = await res.json();
      if (res.ok) {
        setTicketMessages(d.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch ticket messages:', err);
    } finally {
      setTicketMsgLoading(false);
    }
  };

  const handleSendTicketReply = async (e) => {
    e.preventDefault();
    if (!newTicketMessage.trim()) return;
    try {
      const res = await authFetch(`/api/support/${selectedTicket.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: newTicketMessage })
      });
      if (res.ok) {
        const loggedMsg = {
          id: Date.now(),
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          message: newTicketMessage,
          sender_name: user.name || user.email,
          sender_role: user.role,
          created_at: new Date().toISOString()
        };
        setTicketMessages(prev => [...prev, loggedMsg]);
        setNewTicketMessage('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSupportTicket = async (e) => {
    e.preventDefault();
    setCreateTicketLoading(true);
    try {
      const res = await authFetch('/api/support', {
        method: 'POST',
        body: JSON.stringify(newTicketForm)
      });
      const d = await res.json();
      if (res.ok) {
        alert('Support ticket created successfully!');
        setNewTicketForm({ subject: '', category: 'Store', message: '' });
        setCreateTicketOpen(false);
        const listRes = await authFetch('/api/support');
        const listData = await listRes.json();
        setSupportTickets(listData.tickets || []);
      } else {
        alert(d.error || 'Failed to open ticket.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreateTicketLoading(false);
    }
  };

  const handleCloseTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to mark this ticket as closed?')) return;
    try {
      const res = await authFetch(`/api/support/${ticketId}/close`, {
        method: 'PUT'
      });
      if (res.ok) {
        alert('Ticket closed.');
        setSelectedTicket(prev => prev && prev.id === ticketId ? { ...prev, status: 'closed' } : prev);
        setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'closed' } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const payload = {
        name: profileForm.name,
        phone: profileForm.phone,
        shipping_address: {
          addressLine: profileForm.addressLine,
          city: profileForm.city,
          district: profileForm.district,
          province: profileForm.province,
          lat: profileForm.lat,
          lng: profileForm.lng
        }
      };
      const res = await authFetch('/api/auth/update', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message);
      setProfileMsg('Profile settings updated successfully.');
      setUser(d.user);
    } catch (err) {
      setProfileMsg(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);

    setAvatarUploading(true);
    setProfileMsg('');
    try {
      const res = await authFetch('/api/auth/upload-avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Avatar upload failed');
      setUser(prev => ({ ...prev, avatar_url: data.avatarUrl }));
      setProfileMsg('Avatar uploaded successfully!');
    } catch (err) {
      setProfileMsg(err.message || 'Failed to upload avatar.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'danger', text: 'New passwords do not match.' });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg({ type: '', text: '' });
    try {
      const res = await authFetch('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Password update failed');
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordMsg({ type: 'danger', text: err.message });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSocialClaim = async (platform) => {
    setSocialLoading(true);
    setSocialMsg('');
    try {
      const res = await authFetch('/api/store/wallet/social-claim', {
        method: 'POST',
        body: JSON.stringify({ platform }),
      });
      const d = await res.json();
      setSocialMsg(d.message || 'Claimed!');
      if (res.ok && d.wallet) setWallet(d.wallet);
    } catch {
      setSocialMsg('Failed to claim reward.');
    } finally {
      setSocialLoading(false);
    }
  };

  const handleSocialClick = async (platform, url) => {
    if (url) {
      window.open(url, '_blank');
    }
    await handleSocialClaim(platform);
  };

  const statusBadge = (status) => {
    const map = {
      pending: 'badge-warning',
      pending_review: 'badge-warning',
      pricing_assigned: 'badge-gold',
      confirmed: 'badge-gold',
      processing: 'badge-gold',
      in_printing: 'badge-gold',
      shipped: 'badge-success',
      delivered: 'badge-success',
      completed: 'badge-success',
      unread: 'badge-warning',
      contacted: 'badge-success',
      cancelled: 'badge-danger',
    };
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status.replace('_', ' ')}</span>;
  };

  const formatPrice = n => `Rs. ${Number(n || 0).toLocaleString('en-NP')}`;
  const formatDate  = s => new Date(s).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' });

  const resolveAvatar = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return url;
  };

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: 'var(--space-12)' }}>
      <div className="page-header">
        <h1 className="page-title">User Workspace</h1>
        <p className="page-subtitle">Manage retail purchases, custom 3D mesh printing files, web proposals, and wallet tokens.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 'var(--space-8)', marginTop: 'var(--space-6)' }} className="grid-mobile-1">
        
        {/* Workspace Sidebar Tabs */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)', padding: 'var(--space-5)', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', margin: '0 auto var(--space-3) auto', backgroundColor: 'var(--bg-1)', border: '1px solid var(--border-strong)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContents: 'center' }}>
              {user?.avatar_url ? (
                <img src={resolveAvatar(user.avatar_url)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <i className="fa-light fa-sharp fa-user-astronaut" style={{ fontSize: '2.5rem', margin: 'auto' }} />
              )}
            </div>
            <strong style={{ display: 'block', fontSize: 'var(--text-base)', color: 'var(--text-0)' }}>{user?.name || user?.email}</strong>
            <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px' }}>{user?.role}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {[
              { id: 'orders', label: 'Store Orders', icon: 'box' },
              { id: 'prints', label: '3D Print Jobs', icon: 'print' },
              { id: 'web', label: 'Custom Project', icon: 'laptop-code' },
              { id: 'wallet', label: 'Wallet & Referrals', icon: 'wallet' },
              { id: 'wishlist', label: 'My Wishlist', icon: 'heart' },
              { id: 'tickets', label: 'Support Tickets', icon: 'ticket' },
              { id: 'profile', label: 'Edit Profile', icon: 'user-pen' }
            ].map(tabItem => (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id)}
                className="btn btn-outline btn-full"
                style={{
                  justifyContent: 'flex-start',
                  border: '1px solid transparent',
                  backgroundColor: tab === tabItem.id ? 'var(--bg-3)' : 'transparent',
                  color: tab === tabItem.id ? 'var(--accent)' : 'var(--text-2)',
                  borderRadius: '0px'
                }}
              >
                <i className={`fa-light fa-sharp fa-${tabItem.icon}`} style={{ marginRight: '8px', width: '18px' }} />
                {tabItem.label}
              </button>
            ))}
            <button
              onClick={() => { logout(); navigate('/signin'); }}
              className="btn btn-outline btn-full text-danger"
              style={{ justifyContent: 'flex-start', borderRadius: '0px', marginTop: 'var(--space-4)' }}
            >
              <i className="fa-light fa-sharp fa-right-from-bracket" style={{ marginRight: '8px', width: '18px' }} />
              Logout
            </button>
          </div>
        </aside>

        {/* Dynamic Content Panel */}
        <div style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)', padding: 'var(--space-6)' }}>
          
          {/* TAB 1: RETAIL STORE ORDERS */}
          {tab === 'orders' && (
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>Store Orders</h2>
              {ordersLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}><div className="spinner" /></div>
              ) : orders.length === 0 ? (
                <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-3)' }}>No retail purchases found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {orders.map(order => (
                    <div 
                      key={order.id} 
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      style={{ border: '1px solid var(--border-strong)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-1)', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>Order #{order.tracking_code || order.id}</strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-3)', display: 'block' }}>Placed on {formatDate(order.created_at)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span className="font-mono">{formatPrice(order.total_amount || order.total)}</span>
                          {statusBadge(order.status)}
                        </div>
                      </div>

                      {/* Expandable Order Details */}
                      {selectedOrder?.id === order.id && (
                        <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)' }}>
                          <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textTransform: 'uppercase' }}>Items Summary</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                            {order.items?.map((item, idx) => {
                              const customSpecs = (() => {
                                if (!item.custom_responses) return null;
                                try {
                                  return typeof item.custom_responses === 'string' ? JSON.parse(item.custom_responses) : item.custom_responses;
                                } catch(e) { return null; }
                              })();
                              return (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', fontSize: '13px', borderBottom: idx < order.items.length - 1 ? '1px dashed var(--border)' : 'none', paddingBottom: '6px', marginBottom: '4px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{item.product_name || item.name} (x{item.quantity})</span>
                                    <span className="font-mono">{formatPrice(item.price * item.quantity)}</span>
                                  </div>
                                  {customSpecs && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px', fontSize: '11px', color: 'var(--text-3)' }}>
                                      {customSpecs.material && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Material: {customSpecs.material}</span>}
                                      {customSpecs.color && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Color: {customSpecs.color}</span>}
                                      {customSpecs.infill !== undefined && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Infill: {customSpecs.infill}%</span>}
                                      {customSpecs.layerHeight && <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Layer: {customSpecs.layerHeight}mm</span>}
                                      {customSpecs.rental_meta && (
                                        <>
                                          <span style={{ background: 'rgba(212, 160, 23, 0.1)', color: 'var(--accent)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--accent)' }}>Rental Duration: {customSpecs.rental_meta.duration} Days</span>
                                          <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Start Date: {customSpecs.rental_meta.startDate}</span>
                                          <span style={{ background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>Security Deposit: Rs. {Number(customSpecs.rental_meta.deposit).toLocaleString()}</span>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {order.shipping_address && (
                            <div style={{ marginTop: '12px', fontSize: '13px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                              <strong>Delivery Details:</strong>
                              <p style={{ color: 'var(--text-2)', marginTop: '2px' }}>{typeof order.shipping_address === 'string' ? order.shipping_address : `${order.shipping_address.addressLine}, ${order.shipping_address.city}`}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 3D PRINTING ORDERS */}
          {tab === 'prints' && (
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>3D Printing Queue</h2>
              {printsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}><div className="spinner" /></div>
              ) : printOrders.length === 0 ? (
                <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-3)' }}>No submitted 3D print mesh models.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {printOrders.map(print => (
                    <div key={print.id} style={{ border: '1px solid var(--border-strong)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{print.filename}</strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-3)', display: 'block' }}>
                            {print.material} • Infill: {print.infill_percentage}% • {print.color} • x{print.quantity}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span className="font-mono" style={{ color: print.price ? 'var(--accent)' : 'var(--text-3)' }}>
                            {print.price ? formatPrice(print.price) : 'Pending Quote'}
                          </span>
                          {statusBadge(print.status)}
                        </div>
                      </div>
                      {print.notes && (
                        <div style={{ fontSize: '12px', color: 'var(--text-2)', backgroundColor: 'var(--bg-2)', padding: '6px 12px', marginTop: '10px' }}>
                          <strong>Notes:</strong> {print.notes}
                        </div>
                      )}
                      {print.status === 'estimated' && (
                        <div style={{ marginTop: '12px', borderTop: '1px dashed var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>
                            Quotation ready. Deducts <strong>Rs. {Number(print.price).toLocaleString()}</strong> from wallet balance.
                          </span>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handlePayPrintQuote(print.id, print.price)}
                            style={{ padding: '4px 12px', fontSize: '11px' }}
                            disabled={payingPrintId === print.id}
                          >
                            {payingPrintId === print.id ? 'Processing...' : 'Approve & Pay (Wallet)'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WEB AGENCY INQUIRIES */}
          {tab === 'web' && (
            <div>
              {selectedInquiry ? (
                <div>
                  <button 
                    onClick={() => handleSelectInquiry(null)} 
                    className="btn btn-outline btn-sm" 
                    style={{ marginBottom: 'var(--space-4)' }}
                  >
                    <i className="fa-light fa-sharp fa-arrow-left" style={{ marginRight: '6px' }} /> Back to Inquiry List
                  </button>

                  <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-strong)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0 }}>Project Workspace: {selectedInquiry.project_type.replace('_', ' ').toUpperCase()}</h3>
                      {statusBadge(selectedInquiry.status)}
                    </div>

                    {/* Progress Bar Milestone */}
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-3)', marginBottom: '6px' }}>
                        <span>Discussion</span>
                        <span>Proposal</span>
                        <span>Development</span>
                        <span>Review</span>
                        <span>Completed</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-3)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ 
                          height: '100%', 
                          background: 'var(--accent)', 
                          width: selectedInquiry.status === 'unread' || selectedInquiry.status === 'in_discussion' ? '20%' :
                                 selectedInquiry.status === 'proposal_sent' ? '40%' :
                                 selectedInquiry.status === 'accepted' ? '60%' :
                                 selectedInquiry.status === 'in_progress' ? '80%' :
                                 selectedInquiry.status === 'completed' ? '100%' : '0%',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                  </div>

                  {selectedInquiry.status === 'proposal_sent' && (
                    <div style={{ border: '1px solid var(--warning)', background: 'rgba(234, 179, 8, 0.1)', padding: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <strong style={{ display: 'block', color: 'var(--text-0)' }}>Proposal Quotation is Ready!</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>Please review proposal details and approve to begin development work.</span>
                      </div>
                      <button className="btn btn-primary" onClick={() => handleApproveWebProposal(selectedInquiry.id)}>
                        Approve Proposal
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }} className="grid-mobile-1">
                    
                    {/* CRM Message Block */}
                    <div style={{ border: '1px solid var(--border)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', background: 'var(--bg-1)' }}>
                      <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px', fontSize: '14px', textTransform: 'uppercase', color: 'var(--accent)' }}>
                        <i className="fa-light fa-sharp fa-comments" style={{ marginRight: '6px' }} /> Client-Technician Chat
                      </h4>
                      <div style={{ height: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px', marginBottom: '12px' }}>
                        {inquiryMessages.length === 0 ? (
                          <div style={{ margin: 'auto', color: 'var(--text-3)', fontSize: '12px' }}>No messages exchanged yet. Send a note to the developer!</div>
                        ) : (
                          inquiryMessages.map(m => {
                            const isMe = m.sender_id === user.id;
                            return (
                              <div key={m.id} style={{
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                backgroundColor: isMe ? 'var(--bg-3)' : 'var(--bg-2)',
                                border: '1px solid var(--border-strong)',
                                padding: '8px 12px',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                <strong style={{ color: isMe ? 'var(--accent)' : 'var(--text-0)', display: 'block', fontSize: '10px' }}>
                                  {m.sender_name} ({m.sender_role})
                                </strong>
                                <span style={{ color: 'var(--text-1)', whiteSpace: 'pre-wrap' }}>{m.message}</span>
                                <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-3)', marginTop: '4px', textAlign: 'right' }}>
                                  {formatDate(m.created_at)}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <form onSubmit={handleSendWorkspaceMessage} style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                        <input 
                          type="text" 
                          placeholder="Type response..." 
                          value={newMessage} 
                          onChange={e => setNewMessage(e.target.value)} 
                          className="form-input" 
                          style={{ flex: 1, fontSize: '12px', padding: '6px' }}
                          required 
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Send</button>
                      </form>
                    </div>

                    {/* Revisions Requests Form & List */}
                    <div style={{ border: '1px solid var(--border)', padding: 'var(--space-4)', background: 'var(--bg-1)' }}>
                      <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px', fontSize: '14px', textTransform: 'uppercase', color: 'var(--accent)' }}>
                        <i className="fa-light fa-sharp fa-code-pull-request" style={{ marginRight: '6px' }} /> Revision Tickets
                      </h4>
                      
                      {/* Revision Form */}
                      {['accepted', 'in_progress', 'completed'].includes(selectedInquiry.status) ? (
                        <form onSubmit={handleAddWorkspaceRevision} style={{ marginBottom: '16px', borderBottom: '1px dashed var(--border)', paddingBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <textarea 
                            placeholder="Describe requested change or feature adjustments..." 
                            value={newRevision.client_notes} 
                            onChange={e => setNewRevision(prev => ({ ...prev, client_notes: e.target.value }))}
                            className="form-input"
                            style={{ fontSize: '12px', padding: '6px', minHeight: '50px', resize: 'vertical' }}
                            required
                          />
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select 
                              className="form-input"
                              value={newRevision.priority}
                              onChange={e => setNewRevision(prev => ({ ...prev, priority: e.target.value }))}
                              style={{ fontSize: '11px', padding: '4px', flex: 1 }}
                            >
                              <option value="low">Low Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="high">High Priority</option>
                              <option value="critical">Critical (Blocker)</option>
                            </select>
                            <button type="submit" className="btn btn-outline btn-sm" style={{ padding: '6px 12px' }}>Request</button>
                          </div>
                        </form>
                      ) : (
                        <div style={{ background: 'var(--bg-3)', padding: '8px', fontSize: '11px', color: 'var(--text-3)', marginBottom: '12px' }}>
                          Revisions are enabled once proposal is approved.
                        </div>
                      )}

                      <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {inquiryRevisions.length === 0 ? (
                          <div style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'center', padding: '10px 0' }}>No revision tickets logged.</div>
                        ) : (
                          inquiryRevisions.map(rev => (
                            <div key={rev.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '2px', fontSize: '11px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>Priority: {rev.priority.toUpperCase()}</span>
                                <span className={`badge ${rev.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{rev.status}</span>
                              </div>
                              <p style={{ margin: '4px 0', color: 'var(--text-1)' }}>{rev.client_notes}</p>
                              {rev.admin_notes && <p style={{ margin: '4px 0 0 0', color: 'var(--warning)', fontStyle: 'italic' }}><strong>Dev response:</strong> {rev.admin_notes}</p>}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div>
                  <h2 style={{ fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>Custom Project Requests</h2>
                  {webLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}><div className="spinner" /></div>
                  ) : webInquiries.length === 0 ? (
                    <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-3)' }}>No custom project inquiries found.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {webInquiries.map(inq => (
                        <div 
                          key={inq.id} 
                          onClick={() => handleSelectInquiry(inq)}
                          style={{ border: '1px solid var(--border-strong)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-1)', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>{inq.project_type.toUpperCase().replace('_', ' ')}</strong>
                              <span style={{ fontSize: '12px', color: 'var(--text-3)', display: 'block' }}>
                                Budget Range: {inq.budget_range.replace('_', ' ')} • Submitted on {formatDate(inq.created_at)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {statusBadge(inq.status)}
                              <i className="fa-light fa-sharp fa-chevron-right" style={{ color: 'var(--text-3)' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WALLET & REFERRALS */}
          {tab === 'wallet' && wallet && (
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>Wallet ledger</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div style={{ border: '1px solid var(--border)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-1)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Current Balance</span>
                  <strong style={{ display: 'block', fontSize: 'var(--text-xl)', color: 'var(--accent)', marginTop: '4px' }}>{formatPrice(wallet.balance)}</strong>
                </div>
                <div style={{ border: '1px solid var(--border)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-1)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Total Earned Rewards</span>
                  <strong style={{ display: 'block', fontSize: 'var(--text-xl)', color: 'var(--text-0)', marginTop: '4px' }}>{formatPrice(wallet.total_earned)}</strong>
                </div>
                <div style={{ border: '1px solid var(--border)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-1)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Referral Signups</span>
                  <strong style={{ display: 'block', fontSize: 'var(--text-xl)', color: 'var(--text-0)', marginTop: '4px' }}>{wallet.referral_count || 0}</strong>
                </div>
              </div>

              {/* Referral Code share Box */}
              <div style={{ border: '1px solid var(--border-strong)', padding: 'var(--space-5)', backgroundColor: 'var(--bg-3)', marginBottom: 'var(--space-6)' }}>
                <strong style={{ display: 'block', fontSize: 'var(--text-sm)' }}>Invite Friends & Earn Credits</strong>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '8px' }}>
                  <input type="text" readOnly value={wallet.referral_code || ''} className="form-input font-mono" style={{ textTransform: 'uppercase', width: '200px' }} />
                  <button className="btn btn-primary btn-sm" onClick={() => navigator.clipboard.writeText(wallet.referral_code || '')}>Copy Code</button>
                </div>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>
                  Get Rs. 100 credited to your wallet whenever someone signs up and places their first order with your referral code.
                </span>
              </div>

              {/* Click Social rewards claim */}
              {wallet && (
                <div style={{ border: '1px solid var(--border)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
                  <strong style={{ display: 'block', fontSize: 'var(--text-sm)', marginBottom: '8px' }}>Social Tasks</strong>
                  <p style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '12px' }}>Earn a one-time store credit bonus by supporting Himalix Labs socials.</p>
                  {socialMsg && <div className="alert alert-success" style={{ marginBottom: '12px' }}>{socialMsg}</div>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {/* YouTube */}
                    <button 
                      className={`btn btn-sm ${wallet.claimed_platforms?.includes('youtube') ? 'btn-outline' : 'btn-primary'}`}
                      onClick={() => handleSocialClick('youtube', wallet.social_youtube_url)} 
                      disabled={socialLoading || wallet.claimed_platforms?.includes('youtube')}
                      style={{ cursor: wallet.claimed_platforms?.includes('youtube') ? 'default' : 'pointer' }}
                    >
                      <i className="fa-brands fa-youtube" style={{ marginRight: '6px', color: wallet.claimed_platforms?.includes('youtube') ? 'var(--text-3)' : '#ff0000' }} />
                      {wallet.claimed_platforms?.includes('youtube') 
                        ? `YouTube Claimed (Rs. ${wallet.social_youtube_reward || 50})` 
                        : `Subscribe (Rs. ${wallet.social_youtube_reward || 50})`
                      }
                    </button>

                    {/* Instagram */}
                    <button 
                      className={`btn btn-sm ${wallet.claimed_platforms?.includes('instagram') ? 'btn-outline' : 'btn-primary'}`}
                      onClick={() => handleSocialClick('instagram', wallet.social_instagram_url)} 
                      disabled={socialLoading || wallet.claimed_platforms?.includes('instagram')}
                      style={{ cursor: wallet.claimed_platforms?.includes('instagram') ? 'default' : 'pointer' }}
                    >
                      <i className="fa-brands fa-instagram" style={{ marginRight: '6px', color: wallet.claimed_platforms?.includes('instagram') ? 'var(--text-3)' : '#e1306c' }} />
                      {wallet.claimed_platforms?.includes('instagram') 
                        ? `Instagram Claimed (Rs. ${wallet.social_instagram_reward || 25})` 
                        : `Follow (Rs. ${wallet.social_instagram_reward || 25})`
                      }
                    </button>

                    {/* Facebook */}
                    <button 
                      className={`btn btn-sm ${wallet.claimed_platforms?.includes('facebook') ? 'btn-outline' : 'btn-primary'}`}
                      onClick={() => handleSocialClick('facebook', wallet.social_facebook_url)} 
                      disabled={socialLoading || wallet.claimed_platforms?.includes('facebook')}
                      style={{ cursor: wallet.claimed_platforms?.includes('facebook') ? 'default' : 'pointer' }}
                    >
                      <i className="fa-brands fa-facebook" style={{ marginRight: '6px', color: wallet.claimed_platforms?.includes('facebook') ? 'var(--text-3)' : '#1877f2' }} />
                      {wallet.claimed_platforms?.includes('facebook') 
                        ? `Facebook Claimed (Rs. ${wallet.social_facebook_reward || 50})` 
                        : `Like/Follow (Rs. ${wallet.social_facebook_reward || 50})`
                      }
                    </button>
                  </div>
                </div>
              )}

              {/* Transactions list */}
              {historyLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
              ) : history.length > 0 ? (
                <div>
                  <h3 style={{ fontSize: 'var(--text-sm)', marginBottom: '12px', color: 'var(--text-2)' }}>Transaction History</h3>
                  <div style={{ border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                    {history.map((tx, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: idx === history.length - 1 ? 'none' : '1px solid var(--border)', backgroundColor: 'var(--bg-1)' }}>
                        <div>
                          <span style={{ fontSize: '13px', display: 'block', color: 'var(--text-1)' }}>{tx.description}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{formatDate(tx.created_at)}</span>
                        </div>
                        <span className="font-mono" style={{ color: tx.type === 'credit' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                          {tx.type === 'credit' ? '+' : '-'}{formatPrice(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 5: EDIT PROFILE */}
          {tab === 'profile' && (
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>Profile Settings</h2>
              
              {profileMsg && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>{profileMsg}</div>}
              
              {/* Profile image upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
                <div style={{ width: '64px', height: '64px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {user?.avatar_url ? (
                    <img src={resolveAvatar(user.avatar_url)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <i className="fa-light fa-sharp fa-user-astronaut" style={{ fontSize: '2rem' }} />
                  )}
                </div>
                <div>
                  <label htmlFor="avatar-upload-input" className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                    {avatarUploading ? 'Uploading...' : 'Upload Avatar'}
                  </label>
                  <input id="avatar-upload-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} disabled={avatarUploading} />
                  <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>PNG, JPG or WEBP (Max 5MB)</span>
                </div>
              </div>

              {/* Profile inputs */}
              <form onSubmit={handleProfileSave} className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="text" readOnly value={user?.email || ''} className="form-input" style={{ opacity: 0.6 }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="text" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="form-input" placeholder="E.g. +977-9801..." />
                </div>

                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input type="text" value={profileForm.addressLine} onChange={e => setProfileForm(p => ({ ...p, addressLine: e.target.value }))} className="form-input" placeholder="e.g. 123 Tech Avenue" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input type="text" value={profileForm.city} onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">District</label>
                    <input type="text" value={profileForm.district} onChange={e => setProfileForm(p => ({ ...p, district: e.target.value }))} className="form-input" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Province</label>
                    <input type="text" value={profileForm.province} onChange={e => setProfileForm(p => ({ ...p, province: e.target.value }))} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Delivery Coordinates</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="text" placeholder="Latitude" value={profileForm.lat} onChange={e => setProfileForm(p => ({ ...p, lat: e.target.value }))} className="form-input" style={{ flex: 1 }} />
                      <input type="text" placeholder="Longitude" value={profileForm.lng} onChange={e => setProfileForm(p => ({ ...p, lng: e.target.value }))} className="form-input" style={{ flex: 1 }} />
                      <button 
                        type="button" 
                        className="btn btn-outline"
                        style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: '6px' }}
                        onClick={() => {
                          let completed = false;

                          const fallbackToIP = () => {
                            if (completed) return;
                            completed = true;

                            authFetch('/api/store/orders/ip-location')
                              .then(res => {
                                if (!res.ok) throw new Error('Proxy IP Geolocation error');
                                return res.json();
                              })
                              .then(data => {
                                if (data.success && data.latitude && data.longitude) {
                                  setProfileForm(p => ({
                                    ...p,
                                    lat: data.latitude.toFixed(6),
                                    lng: data.longitude.toFixed(6),
                                    city: p.city || data.city || '',
                                    district: p.district || data.city || '',
                                    province: p.province || data.region || ''
                                  }));
                                } else {
                                  throw new Error('Coordinates missing in response');
                                }
                              })
                              .catch(ipErr => {
                                console.error('IP lookup failed:', ipErr);
                                alert('Could not fetch location via GPS or IP lookup. Please select on the map manually.');
                              });
                          };

                          if (!navigator.geolocation) {
                            fallbackToIP();
                            return;
                          }

                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              if (completed) return;
                              completed = true;
                              setProfileForm(p => ({
                                ...p,
                                lat: pos.coords.latitude.toFixed(6),
                                lng: pos.coords.longitude.toFixed(6)
                              }));
                            },
                            (err) => {
                              console.warn('GPS failed, trying IP fallback:', err.message);
                              if (!completed) {
                                fallbackToIP();
                              }
                            },
                            { enableHighAccuracy: false, timeout: 6000, maximumAge: 15000 }
                          );
                        }}
                      >
                        <i className="fa-light fa-sharp fa-location-crosshairs" /> Auto-Locate
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Map Location (Pinpoint on map)</label>
                  <LocationPicker 
                    lat={profileForm.lat} 
                    lng={profileForm.lng} 
                    onChange={(lat, lng) => setProfileForm(p => ({ ...p, lat, lng }))} 
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 'var(--space-2)' }} disabled={profileSaving}>
                  {profileSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </form>

              {/* Password update local accounts */}
              {!user?.google_id && (
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-5)' }}>
                  <h3 style={{ fontSize: 'var(--text-sm)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>Change Password</h3>
                  {passwordMsg.text && <div className={`alert alert-${passwordMsg.type}`} style={{ marginBottom: 'var(--space-3)' }}>{passwordMsg.text}</div>}
                  <form onSubmit={handlePasswordChange} className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div className="form-group">
                      <label className="form-label">Current Password</label>
                      <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} className="form-input" required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                      <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} className="form-input" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} className="form-input" required />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary animate-hover" style={{ alignSelf: 'flex-start' }} disabled={passwordSaving}>
                      {passwordSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB: WISHLIST */}
          {tab === 'wishlist' && (
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>My Wishlist</h2>
              {wishlistLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}><div className="spinner" /></div>
              ) : wishlist.length === 0 ? (
                <div style={{ padding: 'var(--space-10)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-3)', border: '1px dashed var(--border)', borderRadius: '4px' }}>
                  <i className="fa-light fa-sharp fa-heart-crack" style={{ fontSize: '2.5rem', marginBottom: '12px', color: 'var(--text-3)' }} />
                  <span>Your wishlist is empty. Browse the store to save components!</span>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
                  {wishlist.map(item => (
                    <div key={item.product_id} style={{ border: '1px solid var(--border-strong)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-1)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <img 
                        src={item.image_url || '/placeholder.svg'} 
                        alt={item.name} 
                        style={{ width: '100%', height: '140px', objectFit: 'contain', background: 'var(--bg-0)', padding: '8px' }} 
                        onError={e => { e.target.src = '/placeholder.svg'; }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600 }}>{item.category}</span>
                      <strong style={{ fontSize: '13px', color: 'var(--text-0)', height: '36px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {item.name}
                      </strong>
                      <span className="font-mono" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>Rs. {Number(item.price).toLocaleString()}</span>
                      <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '8px' }}>
                        <Link to={`/store/product/${item.slug || item.product_id}`} className="btn btn-primary btn-sm" style={{ flex: 1, padding: '6px 0', fontSize: '11px', textAlign: 'center', justifyContent: 'center' }}>
                          View
                        </Link>
                        <button 
                          onClick={() => handleRemoveFromWishlist(item.product_id)} 
                          className="btn btn-outline btn-sm text-danger" 
                          style={{ padding: '6px 10px', borderColor: 'var(--border)' }}
                          title="Remove from Wishlist"
                        >
                          <i className="fa-light fa-sharp fa-trash" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: DOWNLOADS CENTER */}
          {tab === 'downloads' && (
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>Downloads Center</h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)', marginBottom: 'var(--space-6)' }}>
                Access source code repositories, wiring schematics, CAD files, and technical manuals for projects you have purchased or rented.
              </p>

              {downloadsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}><div className="spinner" /></div>
              ) : projectOrders.length === 0 ? (
                <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-3)', border: '1px dashed var(--border)' }}>
                  <i className="fa-light fa-sharp fa-download" style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'block', color: 'var(--text-3)' }} />
                  You haven't ordered any custom projects yet. Explore the <Link to="/project" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Projects Gallery</Link>!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {projectOrders.map(order => {
                    const isDeliverableAvailable = ['accepted', 'in_progress', 'completed'].includes(order.status);
                    return (
                      <div key={order.id} style={{ border: '1px solid var(--border-strong)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-1)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <img src={order.image_url || '/placeholder.svg'} alt={order.project_name} style={{ width: '48px', height: '48px', objectFit: 'cover', background: 'var(--bg-3)' }} onError={e => { e.target.src = '/placeholder.svg'; }} />
                            <div>
                              <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--text-0)' }}>{order.project_name}</strong>
                              <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block' }}>Type: {order.order_type === 'rent' ? 'Rental' : 'Purchase'} • Order #{order.id}</span>
                            </div>
                          </div>
                          <div>
                            {statusBadge(order.status)}
                          </div>
                        </div>

                        {order.order_type === 'rent' && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', background: 'rgba(212, 160, 23, 0.08)', border: '1px solid rgba(212, 160, 23, 0.2)', padding: '10px 14px', borderRadius: '4px', fontSize: '12.5px', marginTop: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fa-light fa-sharp fa-calendar-days" style={{ color: 'var(--accent)' }} />
                              <strong>Rental Period:</strong> {order.rental_duration_days} Days ({order.rental_start_date} to {order.rental_end_date})
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fa-light fa-sharp fa-money-bill-wave" style={{ color: 'var(--accent)' }} />
                              <strong>Rental Rate:</strong> Rs. {Number(order.rental_rate).toLocaleString()}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fa-light fa-sharp fa-shield-halved" style={{ color: 'var(--accent)' }} />
                              <strong>Deposit:</strong> Rs. {Number(order.rental_deposit).toLocaleString()}
                            </div>
                          </div>
                        )}

                        {isDeliverableAvailable ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: 'var(--space-2)', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                            <a 
                              href={`/uploads/projects/project_${order.project_id}_code.zip`} 
                              download
                              className="btn btn-outline btn-sm"
                              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '12px' }}
                              onClick={(e) => { e.preventDefault(); alert('Downloading project source repository (Mock)...'); }}
                            >
                              <i className="fa-light fa-sharp fa-file-zip" style={{ color: 'var(--accent)' }} /> Source Code (ZIP)
                            </a>
                            <a 
                              href={`/uploads/projects/project_${order.project_id}_schematics.pdf`} 
                              download
                              className="btn btn-outline btn-sm"
                              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '12px' }}
                              onClick={(e) => { e.preventDefault(); alert('Downloading wiring schematics PDF (Mock)...'); }}
                            >
                              <i className="fa-light fa-sharp fa-file-pdf" style={{ color: 'var(--accent)' }} /> Schematics (PDF)
                            </a>
                            <a 
                              href={`/uploads/projects/project_${order.project_id}_model.stl`} 
                              download
                              className="btn btn-outline btn-sm"
                              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '12px' }}
                              onClick={(e) => { e.preventDefault(); alert('Downloading CAD enclosure STL model (Mock)...'); }}
                            >
                              <i className="fa-light fa-sharp fa-cube" style={{ color: 'var(--accent)' }} /> Enclosure File (STL)
                            </a>
                            <a 
                              href={`/uploads/projects/project_${order.project_id}_manual.pdf`} 
                              download
                              className="btn btn-outline btn-sm"
                              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '12px' }}
                              onClick={(e) => { e.preventDefault(); alert('Downloading project documentation manual (Mock)...'); }}
                            >
                              <i className="fa-light fa-sharp fa-file-lines" style={{ color: 'var(--accent)' }} /> User Manual (PDF)
                            </a>
                          </div>
                        ) : (
                          <div style={{ background: 'var(--bg-3)', padding: '10px', fontSize: '12px', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-light fa-sharp fa-circle-info" style={{ color: 'var(--warning)' }} />
                            Deliverables will be available for download once the administrator reviews and accepts your request.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: SUPPORT TICKETS */}
          {tab === 'tickets' && (
            <div>
              {selectedTicket ? (
                <div>
                  <button 
                    onClick={() => handleSelectTicket(null)} 
                    className="btn btn-outline btn-sm" 
                    style={{ marginBottom: 'var(--space-4)' }}
                  >
                    <i className="fa-light fa-sharp fa-arrow-left" style={{ marginRight: '6px' }} /> Back to Tickets List
                  </button>

                  <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-strong)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>Ticket: {selectedTicket.subject}</h3>
                      <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Category: {selectedTicket.category} • Created {formatDate(selectedTicket.created_at)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {statusBadge(selectedTicket.status)}
                      {selectedTicket.status !== 'closed' && (
                        <button 
                          className="btn btn-outline btn-sm text-danger" 
                          onClick={() => handleCloseTicket(selectedTicket.id)}
                          style={{ padding: '4px 10px', fontSize: '11px' }}
                        >
                          Close Ticket
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message History */}
                  <div style={{ border: '1px solid var(--border)', background: 'var(--bg-1)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '300px', marginBottom: 'var(--space-4)' }}>
                    <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', fontSize: '14px', textTransform: 'uppercase', color: 'var(--accent)', margin: 0 }}>
                      Dialogue History
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '350px' }}>
                      {ticketMsgLoading ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}><div className="spinner" /></div>
                      ) : ticketMessages.map(m => {
                        const isMe = m.sender_id === user.id;
                        return (
                          <div key={m.id} style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            backgroundColor: isMe ? 'var(--bg-3)' : 'var(--bg-2)',
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
                              {formatDate(m.created_at)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {selectedTicket.status !== 'closed' ? (
                      <form onSubmit={handleSendTicketReply} style={{ display: 'flex', gap: '8px', borderTop: '1px dashed var(--border)', paddingTop: '12px', marginTop: 'auto' }}>
                        <input 
                          type="text" 
                          placeholder="Type reply message..." 
                          className="form-input" 
                          value={newTicketMessage} 
                          onChange={e => setNewTicketMessage(e.target.value)} 
                          style={{ flex: 1, fontSize: '12px', padding: '6px' }}
                          required 
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }}>Reply</button>
                      </form>
                    ) : (
                      <div style={{ background: 'var(--bg-3)', padding: '10px', fontSize: '12px', color: 'var(--text-3)', textAlign: 'center' }}>
                        This ticket is marked as resolved and closed. You cannot send replies.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                    <h2 style={{ fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)', margin: 0, flex: 1 }}>
                      Support Tickets
                    </h2>
                    <button className="btn btn-primary btn-sm" onClick={() => setCreateTicketOpen(true)}>
                      <i className="fa-light fa-sharp fa-plus" style={{ marginRight: '6px' }} /> Open New Ticket
                    </button>
                  </div>

                  {/* Create Ticket Modal / Box */}
                  {createTicketOpen && (
                    <div style={{ border: '1px solid var(--border-strong)', background: 'var(--bg-1)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
                        <strong style={{ fontSize: '14px', textTransform: 'uppercase' }}>Open a Support Ticket</strong>
                        <button className="btn btn-ghost" onClick={() => setCreateTicketOpen(false)} style={{ padding: 4 }}><i className="fa-light fa-sharp fa-xmark" /></button>
                      </div>
                      <form onSubmit={handleCreateSupportTicket} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-mobile-1">
                          <div className="form-group">
                            <label className="form-label">Subject</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={newTicketForm.subject} 
                              onChange={e => setNewTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                              required 
                              style={{ fontSize: '12px', padding: '6px' }}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Category</label>
                            <select 
                              className="form-input" 
                              value={newTicketForm.category} 
                              onChange={e => setNewTicketForm(prev => ({ ...prev, category: e.target.value }))}
                              style={{ fontSize: '12px', padding: '6px' }}
                            >
                              <option value="Store">Store Purchases</option>
                              <option value="3D Printing">3D Printing Service</option>
                              <option value="Web Agency">Custom Project</option>
                              <option value="Wallet">Wallet & Referral Credits</option>
                              <option value="Account">Account Issues</option>
                              <option value="Other">Other General Inquiries</option>
                            </select>
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Message Details</label>
                          <textarea 
                            className="form-input" 
                            value={newTicketForm.message} 
                            onChange={e => setNewTicketForm(prev => ({ ...prev, message: e.target.value }))}
                            required 
                            style={{ fontSize: '12px', padding: '6px', minHeight: '80px', resize: 'vertical' }}
                          />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={createTicketLoading}>
                          {createTicketLoading ? 'Creating Ticket...' : 'Submit Support Ticket'}
                        </button>
                      </form>
                    </div>
                  )}

                  {ticketsLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}><div className="spinner" /></div>
                  ) : supportTickets.length === 0 ? (
                    <div style={{ padding: 'var(--space-10)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-3)', border: '1px dashed var(--border)', borderRadius: '4px' }}>
                      <i className="fa-light fa-sharp fa-ticket" style={{ fontSize: '2.5rem', marginBottom: '12px', color: 'var(--text-3)' }} />
                      <span>No support tickets logged. If you run into issues, open a ticket!</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {supportTickets.map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => handleSelectTicket(t)}
                          style={{ border: '1px solid var(--border-strong)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-1)', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong style={{ color: 'var(--text-0)' }}>{t.subject}</strong>
                              <span style={{ fontSize: '12px', color: 'var(--text-3)', display: 'block' }}>
                                Category: {t.category} • Last updated {formatDate(t.updated_at)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              {statusBadge(t.status)}
                              <i className="fa-light fa-sharp fa-chevron-right" style={{ color: 'var(--text-3)' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

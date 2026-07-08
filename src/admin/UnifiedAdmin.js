import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/batch.css';

/* -- Reused Store Admin Components -- */
import AdminDashboard from './store/components/AdminDashboard';
import ProductCatalog from './store/components/ProductCatalog';
import ProductEditor from './store/components/ProductEditor';
import UserManager from './store/components/UserManager';
import ReviewManager from './store/components/ReviewManager';
import SettingsManager from './store/components/SettingsManager';
import LogsManager from './store/components/LogsManager';
import NotificationBell from './store/components/NotificationBell';

/* -- Reused Project Admin Components -- */
import ProjectManager from './project/components/ProjectManager';
import CustomProjectRequests from './project/components/CustomProjectRequests';
import ProjectNotifications from './project/components/ProjectNotifications';

/* -- Reused Portfolio Admin Components -- */
import CrudSection from './portfolio/components/CrudSection';
import StoreEmailReceivers from './portfolio/components/StoreEmailReceivers';
import DatabaseManager from './portfolio/components/DatabaseManager';

/* -- Extracted View Components -- */
import CouponManager from './views/CouponManager';
import PrintFormDesigner from './views/PrintFormDesigner';

import HeroContentEditor from './views/HeroContentEditor';
import UnifiedOrders from './views/UnifiedOrders';
import CommunicationsHub from './views/CommunicationsHub';
/* ─────────────────────────────────────────────────────────────
   SIDEBAR INFORMATION ARCHITECTURE
   Grouped by admin workflow, following Hick's Law (9 groups)
   ───────────────────────────────────────────────────────────── */
const SIDEBAR_CONFIG = [
  {
    group: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid-2' },
    ]
  },
  {
    group: 'Orders & Requests',
    items: [
      { id: 'unified_orders', label: 'All Orders', icon: 'receipt' },
    ]
  },
  {
    group: 'Catalog',
    items: [
      { id: 'products', label: 'Store Products', icon: 'tag' },
      { id: 'projects', label: 'Project Catalog', icon: 'folder-tree' },
      { id: 'custom_requests', label: 'Custom Requests', icon: 'square-question' },
    ]
  },
  {
    group: 'Communications',
    items: [
      { id: 'communications', label: 'Inbox & Support', icon: 'comments' },
    ]
  },
  {
    group: 'Customers',
    items: [
      { id: 'users', label: 'User Accounts', icon: 'users' },
      { id: 'reviews', label: 'Product Reviews', icon: 'star' },
    ]
  },
  {
    group: 'Website CMS',
    items: [
      { id: 'cms_hero', label: 'Hero & About', icon: 'house' },
      { id: 'cms_team', label: 'Team Members', icon: 'people-group' },
      { id: 'cms_testimonials', label: 'Testimonials', icon: 'comments' },
    ]
  },
  {
    group: 'Settings',
    items: [
      { id: 'settings', label: 'System Config', icon: 'gears' },
      { id: 'print_form', label: '3D Print Config', icon: 'sliders' },
      { id: 'coupons', label: 'Coupon Codes', icon: 'ticket' },
      { id: 'email_receivers', label: 'Email Alerts', icon: 'envelope-open-text' },
      { id: 'project_emails', label: 'Project Alerts', icon: 'bell' },
    ]
  },
  {
    group: 'System',
    items: [
      { id: 'logs', label: 'Activity Logs', icon: 'file-shield' },
      { id: 'database', label: 'Database Manager', icon: 'database' },
    ]
  }
];

export default function UnifiedAdmin() {
  const { user, token, authFetch, logout, systemConfig } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  /* ── Sidebar State ── */
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('hx_admin_tab') || 'dashboard';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('hx_admin_collapsed') === 'true';
  });

  /* ── Search State ── */
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  /* ── Persist active tab ── */
  useEffect(() => {
    localStorage.setItem('hx_admin_tab', activeTab);
  }, [activeTab]);

  /* ── Persist sidebar collapsed ── */
  useEffect(() => {
    localStorage.setItem('hx_admin_collapsed', sidebarCollapsed ? 'true' : 'false');
  }, [sidebarCollapsed]);

  /* ── Click outside search ── */
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Search filter ── */
  const searchResults = SIDEBAR_CONFIG.flatMap(g => g.items).filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const getSidebarBadge = (tabId) => {
    if (!commandCenterData || !commandCenterData.stats) return 0;
    const { stats } = commandCenterData;
    if (tabId === 'unified_orders') {
      return (stats.pendingStoreOrders || 0) + 
             (stats.pendingPrintOrders || 0) + 
             (stats.unreadWebInquiries || 0) + 
             (stats.pendingProjectOrders || 0);
    }
    if (tabId === 'communications') {
      return (stats.openSupportTickets || 0) + 
             (stats.unreadContactMessages || 0);
    }
    return 0;
  };

  /* ── Redirect non-admins ── */
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  /* ─────────────────────────────────────────────
     DATA STATES
     ───────────────────────────────────────────── */
  const [commandCenterData, setCommandCenterData] = useState(null);
  const [commandCenterLoading, setCommandCenterLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [storeOrders, setStoreOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodModal, setProdModal] = useState(null);
  const [prodSaving, setProdSaving] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);

  /* ── 3D Printing States ── */
  const [printOrders, setPrintOrders] = useState([]);
  const [printsLoading, setPrintsLoading] = useState(false);




  /* ── Support Tickets ── */
  const [supportTickets, setSupportTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [activeTicketMessages, setActiveTicketMessages] = useState([]);
  const [ticketMessagesLoading, setTicketMessagesLoading] = useState(false);
  const [adminReplyText, setAdminReplyText] = useState('');

  /* ── Coupons ── */
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  const [couponSaving, setCouponSaving] = useState(false);

  /* ── CMS ── */
  const [cmsContent, setCmsContent] = useState({});
  const [cmsLoading, setCmsLoading] = useState(false);
  const [cmsSaving, setCmsSaving] = useState(false);
  const [cmsMsg, setCmsMsg] = useState('');

  /* ── Form Designers ── */
  const [filamentInfo, setFilamentInfo] = useState({
    PLA: { rate: 10.00, available: true },
    PETG: { rate: 15.00, available: true },
    ABS: { rate: 15.00, available: true },
    Resin: { rate: 30.00, available: true },
    ASA: { rate: 20.00, available: true },
    TPU: { rate: 25.00, available: true },
    setupFee: 50.00,
    minOrderPrice: 100.00
  });
  const [formDesign3d, setFormDesign3d] = useState({ setupFee: 50, minOrderPrice: 100, fields: [] });

  /* ─────────────────────────────────────────────
     DATA LOADING — by active tab
     ───────────────────────────────────────────── */
  const loadStats = useCallback(async () => {
    setCommandCenterLoading(true);
    try {
      const res = await authFetch('/api/store/admin/command-center');
      const data = await res.json();
      setCommandCenterData(data);
    } catch (e) {
      console.error('Failed to load dashboard stats:', e);
    } finally {
      setCommandCenterLoading(false);
    }
  }, [authFetch]);

  const loadData = useCallback(async () => {
    loadStats();
    if (activeTab === 'products') {
      setProdLoading(true);
      try {
        const res = await authFetch('/api/store/admin/products');
        const data = await res.json();
        setProducts(data.products || []);
      } catch (e) { console.error(e); } finally { setProdLoading(false); }
    }
    else if (activeTab === 'users') {
      try {
        const res = await authFetch('/api/store/admin/users');
        const data = await res.json();
        setUsersList(Array.isArray(data) ? data : (data.users || []));
      } catch (e) { console.error(e); }
    }
    else if (activeTab === 'reviews') {
      try {
        const res = await authFetch('/api/store/admin/reviews');
        const data = await res.json();
        setReviewsList(Array.isArray(data) ? data : (data.reviews || []));
      } catch (e) { console.error(e); }
    }
    else if (activeTab === 'print_form') {
      try {
        const setRes = await authFetch('/api/store/admin/settings');
        const setData = await setRes.json();
        if (setData.filamentInfo3d) {
          try { setFilamentInfo(JSON.parse(setData.filamentInfo3d)); } catch {}
        }
        if (setData.formDesign3d) {
          try { setFormDesign3d(JSON.parse(setData.formDesign3d)); } catch {}
        }
      } catch (e) { console.error(e); }
    }

    else if (activeTab === 'coupons') {
      setCouponsLoading(true);
      try {
        const res = await authFetch('/api/store/admin/coupons');
        const data = await res.json();
        setCoupons(data.coupons || []);
      } catch (e) { console.error(e); } finally { setCouponsLoading(false); }
    }
    else if (activeTab.startsWith('cms_')) {
      setCmsLoading(true);
      try {
        const res = await authFetch('/api/admin/content');
        const data = await res.json();
        const rawContent = data.content || {};
        if (rawContent.services && Array.isArray(rawContent.services.items)) {
          rawContent.services.items = rawContent.services.items.map(item => ({
            ...item,
            features: Array.isArray(item.features) ? item.features.join('\\n') : (item.features || '')
          }));
        }
        setCmsContent(rawContent);
      } catch (e) { console.error(e); } finally { setCmsLoading(false); }
    }
  }, [activeTab, authFetch, loadStats]);
  useEffect(() => { loadData(); }, [loadData]);

  /* ─────────────────────────────────────────────
     ACTION HANDLERS
     ───────────────────────────────────────────── */
  const handleSaveSettings = async (payload) => {
    try {
      const res = await authFetch('/api/store/admin/settings', {
        method: 'PUT', body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      alert('Settings saved successfully!');
    } catch { alert('Failed to save settings.'); }
  };

  /* Store products */
  const handleSaveProduct = async (productData, id) => {
    setProdSaving(true);
    try {
      const isNew = !id;
      const url = isNew ? '/api/store/admin/products' : `/api/store/admin/products/${id}`;
      const res = await authFetch(url, {
        method: isNew ? 'POST' : 'PUT', body: JSON.stringify(productData),
      });
      if (!res.ok) throw new Error();
      setProdModal(null);
      loadData();
    } catch { alert('Failed to save product'); } finally { setProdSaving(false); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await authFetch(`/api/store/admin/products/${id}`, { method: 'DELETE' });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) { console.error(e); }
  };

  /* Store orders */
  const handleUpdateOrderStatus = async (orderId, fields) => {
    try {
      const res = await authFetch(`/api/store/admin/orders/${orderId}/status`, {
        method: 'PUT', body: JSON.stringify(fields),
      });
      if (res.ok) {
        setStoreOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...fields } : o));
      }
    } catch (e) { console.error(e); }
  };

  /* 3D Printing */
  const handleUpdatePrintOrder = async (id, price, status) => {
    try {
      const res = await authFetch(`/api/store/admin/printing/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price, status })
      });
      if (res.ok) {
        setPrintOrders(prev => prev.map(p => p.id === id ? { ...p, price, status } : p));
        alert('Order updated successfully');
      }
    } catch (e) { console.error(e); }
  };

  /* Web inquiries */
  const handleUpdateWebInquiry = async (id, status, notes) => {
    try {
      const res = await authFetch(`/api/store/admin/web-inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: notes })
      });
      if (res.ok) {
        setWebInquiries(prev => prev.map(w => w.id === id ? { ...w, status, admin_notes: notes } : w));
        alert('Inquiry updated successfully');
      }
    } catch (e) { console.error(e); }
  };

  /* Support tickets */
  const handleSelectTicket = async (ticket) => {
    setActiveTicket(ticket);
    if (!ticket) return;
    setTicketMessagesLoading(true);
    try {
      const res = await authFetch(`/api/store/admin/support-tickets/${ticket.id}/messages`);
      const d = await res.json();
      if (res.ok) setActiveTicketMessages(d.messages || []);
    } catch (err) { console.error(err); } finally { setTicketMessagesLoading(false); }
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
        setSupportTickets(prev => prev.map(t => t.id === activeTicket.id ? { ...t, status: 'replied' } : t));
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateTicketStatus = async (ticketId, status) => {
    try {
      const res = await authFetch(`/api/store/admin/support-tickets/${ticketId}/status`, {
        method: 'PUT', body: JSON.stringify({ status })
      });
      if (res.ok) {
        setActiveTicket(prev => prev && prev.id === ticketId ? { ...prev, status } : prev);
        setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
        alert('Ticket status updated successfully');
      }
    } catch (err) { console.error(err); }
  };

  /* Coupons */
  const handleSaveCoupon = async (couponData, id) => {
    setCouponSaving(true);
    try {
      const isNew = !id;
      const url = isNew ? '/api/store/admin/coupons' : `/api/store/admin/coupons/${id}`;
      const res = await authFetch(url, {
        method: isNew ? 'POST' : 'PUT', body: JSON.stringify(couponData)
      });
      const d = await res.json();
      if (res.ok) {
        alert(d.message || 'Coupon saved successfully!');
        loadData();
      } else { alert(d.error || 'Failed to save coupon.'); }
    } catch { alert('Failed to save coupon.'); } finally { setCouponSaving(false); }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await authFetch(`/api/store/admin/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) { alert('Coupon deleted.'); setCoupons(prev => prev.filter(c => c.id !== id)); }
    } catch (err) { console.error(err); }
  };

  /* CMS */
  const handleSaveCMS = async (section, newData) => {
    setCmsSaving(true);
    setCmsMsg('');
    try {
      let payload = newData;
      if (section === 'services' && Array.isArray(newData.items)) {
        payload = {
          items: newData.items.map(item => ({
            ...item,
            features: typeof item.features === 'string' ? item.features.split('\n').map(f => f.trim()).filter(Boolean) : (item.features || [])
          }))
        };
      }
      const res = await authFetch(`/api/admin/content/${section}`, {
        method: 'PUT', body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setCmsContent(prev => ({ ...prev, [section]: newData }));
      setCmsMsg('Content updated successfully.');
      setTimeout(() => setCmsMsg(''), 3000);
    } catch { setCmsMsg('Failed to update content.'); } finally { setCmsSaving(false); }
  };

  /* Database backup */
  const handleExportDatabaseBackup = async () => {
    try {
      alert('Generating SQL dump backup. This might take a moment...');
      const res = await authFetch('/api/store/admin/database/backup');
      if (!res.ok) throw new Error('Database export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `himalix_backup_${Date.now()}.sql`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { console.error(err); alert('Failed to export database backup.'); }
  };

  if (!user || user.role !== 'admin') return null;

  /* ── Find current tab label for breadcrumb ── */
  const currentLabel = SIDEBAR_CONFIG.flatMap(g => g.items).find(i => i.id === activeTab)?.label || 'Admin';

  return (
    <div className="admin-shell">

      {/* ══════════════════════════════════════════════
          SIDEBAR — collapsible icon-only mode
          ══════════════════════════════════════════════ */}
      <aside className={`admin-sidebar${mobileOpen ? ' admin-sidebar--mobile-open' : ''}${sidebarCollapsed ? ' admin-sidebar--collapsed' : ''}`}>
        {/* Logo */}
        <div className="admin-sidebar__logo" style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
          {systemConfig?.siteLogo ? (
            <img
              src={systemConfig.siteLogo}
              alt="HX"
              style={{
                height: '22px', width: 'auto',
                filter: (systemConfig.siteLogoInversion === 'invert_dark' && theme === 'dark') ||
                  (systemConfig.siteLogoInversion === 'invert_light' && theme === 'light')
                  ? 'invert(1)' : 'none'
              }}
            />
          ) : 'HX'}
          {!sidebarCollapsed && (
            <>
              <span>ADMIN</span>
              <span className="admin-sidebar__logo-badge">CONSOLE</span>
            </>
          )}
        </div>

        {/* Nav groups */}
        <nav className="admin-sidebar__nav">
          {SIDEBAR_CONFIG.map(group => (
            <div key={group.group} className="admin-sidebar__group">
              {!sidebarCollapsed && (
                <span className="admin-sidebar__group-label">{group.group}</span>
              )}
              {group.items.map(item => {
                const badge = getSidebarBadge(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                    className={`admin-sidebar__btn${activeTab === item.id ? " admin-sidebar__btn--active" : ""}`}
                    title={sidebarCollapsed ? item.label : undefined}
                    style={{ position: "relative" }}
                  >
                    <i className={`fa-light fa-sharp fa-${item.icon}`} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                    {badge > 0 && (
                      <span 
                        style={{
                          position: sidebarCollapsed ? "absolute" : "static",
                          top: sidebarCollapsed ? "2px" : "auto",
                          right: sidebarCollapsed ? "2px" : "auto",
                          marginLeft: sidebarCollapsed ? "0" : "auto",
                          backgroundColor: "var(--accent)",
                          color: "var(--bg-0)",
                          fontSize: "10px",
                          fontWeight: 700,
                          borderRadius: "50%",
                          width: "18px",
                          height: "18px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: "18px"
                        }}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Back to site */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)', marginTop: 'auto' }}>
            <button className="admin-sidebar__btn" onClick={() => navigate('/')} title={sidebarCollapsed ? 'Back to Site' : undefined}>
              <i className="fa-light fa-sharp fa-arrow-left" />
              {!sidebarCollapsed && 'Back to Site'}
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="admin-sidebar__footer" style={{ flexDirection: sidebarCollapsed ? 'column' : 'row', gap: sidebarCollapsed ? '8px' : undefined }}>
          {!sidebarCollapsed && (
            <div className="admin-sidebar__footer-user">
              <span>Signed in as</span>
              <strong className="admin-sidebar__footer-email">{user.email}</strong>
            </div>
          )}
          <button onClick={toggleTheme} className="btn btn-outline btn-sm" style={{ padding: '8px', borderRadius: '0px' }} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            <i className={`fa-light fa-sharp fa-${theme === 'dark' ? 'sun' : 'moon'}`} />
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT AREA
          ══════════════════════════════════════════════ */}
      <main className={`admin-main${sidebarCollapsed ? ' admin-main--collapsed' : ''}`}>

        {/* Top bar */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="admin-topbar__hamburger"
              onClick={() => setMobileOpen(prev => !prev)}
              aria-label="Toggle Sidebar"
              style={{ background: 'none', border: 'none', color: 'var(--text-0)', cursor: 'pointer', fontSize: '1.2rem', display: 'none', padding: '4px' }}
            >
              <i className="fa-light fa-sharp fa-bars" />
            </button>

            {/* Collapse toggle (desktop) */}
            <button
              onClick={() => setSidebarCollapsed(prev => !prev)}
              className="admin-sidebar-toggle hide-mobile"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: '14px', padding: '4px' }}
            >
              <i className={`fa-light fa-sharp fa-${sidebarCollapsed ? 'sidebar-flip' : 'sidebar'}`} />
            </button>

            <div className="admin-topbar__breadcrumb">
              <i className="fa-light fa-sharp fa-house-chimney" />
              <span>Admin</span>
              <i className="fa-light fa-sharp fa-chevron-right" style={{ fontSize: '9px' }} />
              <strong>{currentLabel}</strong>
            </div>

            {/* Jump search */}
            <div className="admin-topbar__search" ref={searchRef} style={{ position: 'relative', width: '220px', marginLeft: 'var(--space-4)' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Jump to feature..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  style={{
                    width: '100%', padding: '6px 10px 6px 30px', fontSize: '11.5px', borderRadius: '4px',
                    border: '1px solid var(--border-strong)', background: 'var(--bg-3)', color: 'var(--text-0)', outline: 'none'
                  }}
                />
                <i className="fa-light fa-sharp fa-magnifying-glass" style={{ position: 'absolute', left: '10px', fontSize: '11px', color: 'var(--text-3)' }} />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <i className="fa-light fa-sharp fa-xmark" style={{ fontSize: '11px', color: 'var(--text-3)' }} />
                  </button>
                )}
              </div>

              {searchOpen && searchQuery && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%',
                  background: 'var(--bg-2)', border: '1px solid var(--border-strong)',
                  boxShadow: 'var(--shadow-md)', borderRadius: '4px', zIndex: 1000, maxHeight: '200px', overflowY: 'auto'
                }}>
                  {searchResults.length === 0 ? (
                    <div style={{ padding: '8px 12px', fontSize: '11.5px', color: 'var(--text-3)' }}>No match found</div>
                  ) : (
                    searchResults.map(item => (
                      <button
                        key={item.id} type="button"
                        onClick={() => { setActiveTab(item.id); setSearchQuery(''); setSearchOpen(false); }}
                        style={{
                          width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px',
                          color: 'var(--text-1)', borderBottom: '1px solid var(--border)', borderRadius: '0px'
                        }}
                      >
                        <i className={`fa-light fa-sharp fa-${item.icon}`} style={{ color: 'var(--accent)', width: '14px' }} />
                        <span>{item.label}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right side: bell, user, backup, logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <NotificationBell onViewAllLogs={() => setActiveTab('logs')} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-3)',
                border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)', fontFamily: 'var(--font-mono)'
              }}>
                {user.email ? user.email.substring(0, 2).toUpperCase() : 'AD'}
              </div>
              <span className="hide-mobile" style={{ fontSize: '12px', color: 'var(--text-2)' }}>{user.email}</span>
            </div>

            <button
              onClick={handleExportDatabaseBackup}
              className="btn btn-outline btn-sm text-info"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '0px' }}
            >
              <i className="fa-light fa-sharp fa-download" /> <span className="hide-mobile">Backup DB</span>
            </button>

            <button onClick={() => { logout(); navigate('/signin'); }} className="btn btn-ghost btn-sm text-danger" style={{ borderRadius: '0px' }}>
              <i className="fa-light fa-sharp fa-right-from-bracket" /> <span className="hide-mobile">Logout</span>
            </button>
          </div>
        </header>

        {/* ═══════════════════════════════════
            CONTENT VIEWS — Tab Router
            ═══════════════════════════════════ */}
        <div className="admin-content">

          {/* -- DASHBOARD -- */}
          {activeTab === 'dashboard' && (
            <AdminDashboard data={commandCenterData} loading={commandCenterLoading} setActiveTab={setActiveTab} />
          )}

          {/* -- UNIFIED ORDERS PIPELINE -- */}
          {activeTab === 'unified_orders' && (
            <UnifiedOrders authFetch={authFetch} onRefreshStats={loadStats} />
          )}

          {/* -- PRODUCTS -- */}
          {activeTab === 'products' && (
            <div className="admin-products">
              <ProductCatalog products={products} loading={prodLoading} onEdit={setProdModal} onDelete={handleDeleteProduct} onRefresh={loadData} />
              {prodModal && (
                <ProductEditor
                  product={prodModal === 'new' ? null : prodModal}
                  saving={prodSaving}
                  onSave={handleSaveProduct}
                  onClose={() => setProdModal(null)}
                  authFetch={authFetch}
                />
              )}
            </div>
          )}

          {/* ── USERS ── */}
          {activeTab === 'users' && <UserManager users={usersList} authFetch={authFetch} onLoad={loadData} />}

          {/* ── REVIEWS ── */}
          {activeTab === 'reviews' && <ReviewManager reviews={reviewsList} authFetch={authFetch} onLoad={loadData} />}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && <SettingsManager authFetch={authFetch} />}

          {/* ── LOGS ── */}
          {activeTab === 'logs' && <LogsManager authFetch={authFetch} />}

          {/* ── DATABASE ── */}
          {activeTab === 'database' && <DatabaseManager authFetch={authFetch} />}

          {/* ── PROJECTS ── */}
          {activeTab === 'projects' && <ProjectManager />}
          {activeTab === 'project_orders' && <ProjectOrders />}
          {activeTab === 'custom_requests' && <CustomProjectRequests />}
          {activeTab === 'project_emails' && <ProjectNotifications />}

          {/* -- EMAIL RECEIVERS -- */}
          {activeTab === 'email_receivers' && <StoreEmailReceivers authFetch={authFetch} />}

          {/* ── 3D PRINT FORM DESIGNER ── */}
          {activeTab === 'print_form' && (
            <PrintFormDesigner
              formDesign={formDesign3d}
              filamentInfo={filamentInfo}
              onFormDesignChange={setFormDesign3d}
              onSave={async () => {
                const matField = formDesign3d.fields.find(f => f.id === 'material');
                const updatedFilament = { ...filamentInfo };
                if (matField && Array.isArray(matField.options)) {
                  matField.options.forEach(o => { updatedFilament[o.name] = { rate: o.rate, available: true }; });
                }
                updatedFilament.setupFee = formDesign3d.setupFee;
                updatedFilament.minOrderPrice = formDesign3d.minOrderPrice;
                await handleSaveSettings({ formDesign3d: JSON.stringify(formDesign3d), "3d_filament_info": JSON.stringify(updatedFilament) });
              }}
            />
          )}



          {/* -- COMMUNICATIONS HUB -- */}
          {activeTab === 'communications' && (
            <CommunicationsHub authFetch={authFetch} />
          )}

          {/* ── COUPONS ── */}
          {activeTab === 'coupons' && (
            <CouponManager
              coupons={coupons}
              loading={couponsLoading}
              saving={couponSaving}
              onSave={handleSaveCoupon}
              onDelete={handleDeleteCoupon}
              onRefresh={loadData}
            />
          )}

          {/* ── CMS: Team & Testimonials ── */}
          {(activeTab === 'cms_team' || activeTab === 'cms_testimonials') && (
            <div>
              {cmsMsg && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>{cmsMsg}</div>}
              {cmsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}><div className="spinner" /></div>
              ) : (
                <>
                  {activeTab === 'cms_team' && (
                    <CrudSection sectionName="team" label="Team Member" schema={[
                      { key: 'name', label: 'Member Name', type: 'text', required: true },
                      { key: 'role', label: 'Role / Designation', type: 'text', required: true },
                      { key: 'bio', label: 'Short Biography', type: 'textarea', multiline: true },
                      { key: 'image_url', label: 'Avatar Image', type: 'image' },
                      { key: 'email', label: 'Email Address', type: 'text' },
                      { key: 'phone', label: 'Phone Number', type: 'text' },
                      { key: 'sayings', label: "Your Name's Sayings", type: 'textarea', multiline: true },
                      { key: 'endpoint', label: 'Custom Profile Endpoint (URL Friendly, Max 25 chars)', type: 'text' },
                      { key: 'instagram', label: 'Instagram Link', type: 'text' },
                      { key: 'linkedin', label: 'LinkedIn Link', type: 'text' },
                      { key: 'github', label: 'GitHub Link', type: 'text' },
                      { key: 'facebook', label: 'Facebook Link', type: 'text' }
                    ]} token={token} apiUrl="/api/admin/upload/portfolio" authFetch={authFetch} />
                  )}
                  {activeTab === 'cms_testimonials' && (
                    <CrudSection sectionName="testimonials" label="Testimonial" schema={[
                      { key: 'client_name', label: 'Client Name', type: 'text', required: true },
                      { key: 'client_title', label: 'Client Title', type: 'text' },
                      { key: 'company', label: 'Company', type: 'text' },
                      { key: 'content', label: 'Review Text', type: 'textarea', multiline: true, required: true },
                      { key: 'rating', label: 'Rating (1-5)', type: 'number', required: true },
                      { key: 'image_url', label: 'Client Avatar', type: 'image' }
                    ]} token={token} apiUrl="/api/admin/upload/portfolio" authFetch={authFetch} />
                  )}
                </>
              )}
            </div>
          )}

          {/* ── CMS: Hero & Content ── */}
          {activeTab === 'cms_hero' && (
            <HeroContentEditor
              cmsContent={cmsContent}
              loading={cmsLoading}
              saving={cmsSaving}
              message={cmsMsg}
              onSave={handleSaveCMS}
            />
          )}

        </div>
      </main>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="admin-modal-overlay" onClick={() => setMobileOpen(false)} style={{ zIndex: 190 }} />
      )}
    </div>
  );
}


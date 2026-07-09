import React, { useState, useEffect } from 'react';
import FileUploadZone from '../../../components/FileUploadZone';

export default function SettingsManager({ authFetch }) {
  const [form, setForm] = useState({
    googleClientId: '',
    googleClientSecret: '',
    googleAuthEnabled: false,
    lowStockThreshold: 5,
    salesTaxRate: 13,
    maintenanceMode: false,
    storeBannerText: '',
    deliveryPerKmRate: 15,
    deliveryMinCharge: 50,
    deliveryFreeThreshold: 2000,
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false,
    emergencyContactPhone: '',
    emergencyContactEmail: '',
    // 3D printing
    ratePla: 10.00,
    ratePetg: 15.00,
    rateAbs: 15.00,
    rateResin: 30.00,
    rateAsa: 20.00,
    rateTpu: 25.00,
    setupFee: 50.00,
    minOrderPrice: 100.00,
    // Custom logo
    siteLogo: '',
    siteLogoInversion: 'invert_dark',
    // Social rewards configuration
    socialYoutubeUrl: '',
    socialYoutubeReward: 50.00,
    socialInstagramUrl: '',
    socialInstagramReward: 25.00,
    socialFacebookUrl: '',
    socialFacebookReward: 50.00,
    siteUrl: ''
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'success' | 'danger', text: '' }
  const [activeTab, setActiveTab] = useState('general');

  // Raw DB Settings State
  const [rawSettings, setRawSettings] = useState([]);
  const [rawLoading, setRawLoading] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  // Email Receivers State
  const [emailReceivers, setEmailReceivers] = useState([]);
  const [emailReceiversLoading, setEmailReceiversLoading] = useState(false);
  const [newReceiver, setNewReceiver] = useState({ id: null, email_address: '', notify_on_order_placed: true, notify_on_low_stock: true, notify_on_user_registered: true });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/store/admin/settings');
      const data = await res.json();
      setForm(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error(err);
      setMsg({ type: 'danger', text: 'Failed to load system settings' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRawSettings = async () => {
    setRawLoading(true);
    setMsg(null);
    try {
      const res = await authFetch('/api/store/admin/settings/raw');
      if (!res.ok) throw new Error('Failed to fetch raw settings');
      const data = await res.json();
      setRawSettings(data || []);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'danger', text: 'Failed to load raw settings' });
    } finally {
      setRawLoading(false);
    }
  };

  const fetchEmailReceivers = async () => {
    setEmailReceiversLoading(true);
    setMsg(null);
    try {
      const res = await authFetch('/api/store/admin/notification-receivers');
      if (!res.ok) throw new Error('Failed to fetch email receivers');
      const data = await res.json();
      setEmailReceivers(data || []);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'danger', text: 'Failed to load email receivers' });
    } finally {
      setEmailReceiversLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMsg(null);
    if (tab === 'raw') {
      fetchRawSettings();
    } else if (tab === 'emails') {
      fetchEmailReceivers();
    } else {
      fetchSettings();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await authFetch('/api/store/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(form)
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to save settings');
      setMsg({ type: 'success', text: 'System settings saved successfully!' });
    } catch (err) {
      setMsg({ type: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Raw Settings Handlers
  const handleAddRaw = async (e) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await authFetch('/api/store/admin/settings/raw', {
        method: 'POST',
        body: JSON.stringify({ key_name: newKey.trim(), key_value: newValue })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to save setting');
      setNewKey('');
      setNewValue('');
      setMsg({ type: 'success', text: `Setting "${d.key_name}" added/updated successfully!` });
      await fetchRawSettings();
    } catch (err) {
      setMsg({ type: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRaw = async (key) => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await authFetch('/api/store/admin/settings/raw', {
        method: 'POST',
        body: JSON.stringify({ key_name: key, key_value: editingValue })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to update setting');
      setEditingKey(null);
      setMsg({ type: 'success', text: `Setting "${key}" updated successfully!` });
      await fetchRawSettings();
    } catch (err) {
      setMsg({ type: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRaw = async (key) => {
    if (!window.confirm(`Are you sure you want to delete setting: "${key}"?`)) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await authFetch(`/api/store/admin/settings/raw/${key}`, {
        method: 'DELETE'
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to delete setting');
      setMsg({ type: 'success', text: `Setting "${key}" deleted successfully!` });
      await fetchRawSettings();
    } catch (err) {
      setMsg({ type: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Email Receiver Handlers
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
      setNewReceiver({ id: null, email_address: '', notify_on_order_placed: true, notify_on_low_stock: true, notify_on_user_registered: true });
      setMsg({ type: 'success', text: 'Email receiver saved successfully!' });
      await fetchEmailReceivers();
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
      await fetchEmailReceivers();
    } catch (err) {
      setMsg({ type: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  return (
    <div className="admin-settings">
      <div className="flex justify-between items-center mb-6">
        <h2 className="page-title">System Settings</h2>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type} mb-6`} style={{ maxWidth: 800 }}>
          <i className={`fa-light fa-sharp fa-${msg.type === 'success' ? 'circle-check' : 'circle-exclamation'}`} />
          {msg.text}
        </div>
      )}

      <div className="flex gap-6" style={{ maxWidth: 900 }}>
        {/* Settings categories sidebar */}
        <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'general' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleTabChange('general')}
            style={{ textAlign: 'left', justifyContent: 'flex-start' }}
          >
            <i className="fa-light fa-sharp fa-sliders" /> General
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'shipping' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleTabChange('shipping')}
            style={{ textAlign: 'left', justifyContent: 'flex-start' }}
          >
            <i className="fa-light fa-sharp fa-truck" /> Shipping Rules
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'smtp' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleTabChange('smtp')}
            style={{ textAlign: 'left', justifyContent: 'flex-start' }}
          >
            <i className="fa-light fa-sharp fa-envelope" /> SMTP Configuration
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'google' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleTabChange('google')}
            style={{ textAlign: 'left', justifyContent: 'flex-start' }}
          >
            <i className="fa-brands fa-google" /> Google OAuth
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'logo' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleTabChange('logo')}
            style={{ textAlign: 'left', justifyContent: 'flex-start' }}
          >
            <i className="fa-light fa-sharp fa-image" /> Brand Logo
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'social' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleTabChange('social')}
            style={{ textAlign: 'left', justifyContent: 'flex-start' }}
          >
            <i className="fa-light fa-sharp fa-share-nodes" /> Social Tasks
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'raw' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleTabChange('raw')}
            style={{ textAlign: 'left', justifyContent: 'flex-start' }}
          >
            <i className="fa-light fa-sharp fa-database" /> Raw DB Settings
          </button>
        </div>

        {/* Configurations Form or Raw Table */}
        {activeTab === 'raw' ? (
          <div style={{ flex: 1 }}>
            <h3 className="section-title mb-4" style={{ fontSize: 'var(--text-sm)' }}>Raw Key-Value Settings Database</h3>

            {/* Add New Key Form */}
            <form onSubmit={handleAddRaw} className="flex gap-2 mb-6 items-end" style={{ border: '1px solid var(--border)', padding: 'var(--space-4)', background: '#141414' }}>
              <div className="form-group mb-0" style={{ flex: 1 }}>
                <label className="form-label">Key Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. custom_config_key"
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                  required
                />
              </div>
              <div className="form-group mb-0" style={{ flex: 1 }}>
                <label className="form-label">Key Value</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 100 or true or text-value"
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '38px', minWidth: '100px' }} disabled={saving}>
                Add Key
              </button>
            </form>

            {/* Spreadsheet Table View */}
            {rawLoading ? <div className="spinner" /> : (
              <div className="admin-table-wrap">
                <table className="admin-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Key Name</th>
                      <th>Key Value</th>
                      <th style={{ textAlign: 'right', minWidth: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawSettings.map((item) => (
                      <tr key={item.key_name}>
                        <td className="font-mono" style={{ fontWeight: 'bold', color: 'var(--text-1)' }}>
                          {item.key_name}
                        </td>
                        <td>
                          {editingKey === item.key_name ? (
                            <input
                              type="text"
                              className="form-input"
                              style={{ width: '100%', height: '30px', padding: 'var(--space-1) var(--space-2)' }}
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                            />
                          ) : (
                            <span className="font-mono" style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                              {item.key_value}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2 justify-end">
                            {editingKey === item.key_name ? (
                              <>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleUpdateRaw(item.key_name)}
                                  disabled={saving}
                                >
                                  Save
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => setEditingKey(null)}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={() => {
                                    setEditingKey(item.key_name);
                                    setEditingValue(item.key_value || '');
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteRaw(item.key_name)}
                                  disabled={saving}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ flex: 1 }} className="form-settings-grid">
            {activeTab === 'general' && (
              <div className="settings-section">
                <h3 className="section-title mb-4" style={{ fontSize: 'var(--text-sm)' }}>General Store Parameters</h3>

                <div className="form-group">
                  <label className="form-label">Store Announcement Banner</label>
                  <input
                    className="form-input"
                    placeholder="Welcome message or discount alert"
                    value={form.storeBannerText}
                    onChange={e => setForm({ ...form, storeBannerText: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Site URL (Frontend Public URL)</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="e.g. https://himalix.store"
                    value={form.siteUrl || ''}
                    onChange={e => setForm({ ...form, siteUrl: e.target.value })}
                  />
                </div>

                <div className="flex gap-4">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Sales VAT/Tax Rate (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 13"
                      value={form.salesTaxRate}
                      onChange={e => setForm({ ...form, salesTaxRate: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Low Stock Warning Threshold</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 5"
                      value={form.lowStockThreshold}
                      onChange={e => setForm({ ...form, lowStockThreshold: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Support Helpline Phone</label>
                    <input
                      className="form-input"
                      placeholder="e.g. 9801234567"
                      value={form.emergencyContactPhone}
                      onChange={e => setForm({ ...form, emergencyContactPhone: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Support Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. support@himalix.store"
                      value={form.emergencyContactEmail}
                      onChange={e => setForm({ ...form, emergencyContactEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="maintenanceMode"
                    checked={form.maintenanceMode}
                    onChange={e => setForm({ ...form, maintenanceMode: e.target.checked })}
                  />
                  <label htmlFor="maintenanceMode" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                    Enable Maintenance Mode (Restricts public storefront browsing)
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="settings-section">
                <h3 className="section-title mb-4" style={{ fontSize: 'var(--text-sm)' }}>Distance-Based Delivery Fees</h3>

                <div className="form-group">
                  <label className="form-label">Minimum Shipping Charge (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 50.00"
                    value={form.deliveryMinCharge}
                    onChange={e => setForm({ ...form, deliveryMinCharge: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rate Per Kilometer (Rs. / KM)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 15.00"
                    value={form.deliveryPerKmRate}
                    onChange={e => setForm({ ...form, deliveryPerKmRate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Free Delivery Minimum Order Threshold (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 2000.00"
                    value={form.deliveryFreeThreshold}
                    onChange={e => setForm({ ...form, deliveryFreeThreshold: e.target.value })}
                  />
                </div>
              </div>
            )}

            {activeTab === 'smtp' && (
              <div className="settings-section">
                <h3 className="section-title mb-4" style={{ fontSize: 'var(--text-sm)' }}>SMTP Email Server Settings</h3>
                
                <div className="form-group mb-4" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label" style={{ fontWeight: 500 }}>SMTP Host</label>
                  <input
                    className="form-input"
                    placeholder="e.g. smtp.mailtrap.io or smtp.gmail.com"
                    value={form.smtpHost || ''}
                    onChange={e => setForm({ ...form, smtpHost: e.target.value })}
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-0)' }}
                  />
                </div>

                <div className="form-group mb-4" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label" style={{ fontWeight: 500 }}>SMTP Port</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 587 or 465"
                    value={form.smtpPort || ''}
                    onChange={e => setForm({ ...form, smtpPort: e.target.value })}
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-0)' }}
                  />
                </div>

                <div className="form-group mb-4" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label" style={{ fontWeight: 500 }}>SMTP Username / User Email</label>
                  <input
                    className="form-input"
                    placeholder="e.g. your_email@domain.com"
                    value={form.smtpUser || ''}
                    onChange={e => setForm({ ...form, smtpUser: e.target.value })}
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-0)' }}
                  />
                </div>

                <div className="form-group mb-4" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label" style={{ fontWeight: 500 }}>SMTP Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="SMTP Account Password"
                    value={form.smtpPass || ''}
                    onChange={e => setForm({ ...form, smtpPass: e.target.value })}
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-0)' }}
                  />
                </div>

                <div className="form-group flex items-center gap-2 mt-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'var(--space-4)' }}>
                  <input
                    type="checkbox"
                    id="smtpSecure"
                    checked={!!form.smtpSecure}
                    onChange={e => setForm({ ...form, smtpSecure: e.target.checked })}
                    style={{ width: 'auto', cursor: 'pointer' }}
                  />
                  <label htmlFor="smtpSecure" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', fontWeight: 500 }}>
                    Use SSL/TLS (Port 465) / Secure Connection
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'google' && (
              <div className="settings-section">
                <h3 className="section-title mb-4" style={{ fontSize: 'var(--text-sm)' }}>Google Client Credentials</h3>

                <div className="form-group">
                  <label className="form-label">Google Client ID</label>
                  <input
                    className="form-input"
                    placeholder="XXXXXX-XXXXXX.apps.googleusercontent.com"
                    value={form.googleClientId}
                    onChange={e => setForm({ ...form, googleClientId: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Google Client Secret</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Google Developer Console OAuth Secret"
                    value={form.googleClientSecret}
                    onChange={e => setForm({ ...form, googleClientSecret: e.target.value })}
                  />
                </div>

                <div className="form-group flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="googleAuthEnabled"
                    checked={form.googleAuthEnabled}
                    onChange={e => setForm({ ...form, googleAuthEnabled: e.target.checked })}
                  />
                  <label htmlFor="googleAuthEnabled" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                    Enable Google One-Tap/Social Authentication
                  </label>
                </div>
              </div>
            )}



            {activeTab === 'logo' && (
              <div className="settings-section">
                <h3 className="section-title mb-4" style={{ fontSize: 'var(--text-sm)' }}>Himalix Labs Logo Customization</h3>
                
                <div className="form-group mb-4">
                  <label className="form-label" style={{ fontWeight: 500, marginBottom: 'var(--space-2)' }}>Upload Flat Black Logo Image</label>
                  <FileUploadZone
                    value={form.siteLogo || ''}
                    onChange={url => setForm({ ...form, siteLogo: url })}
                    token={localStorage.getItem('himalix-token')}
                    apiUrl="/api/store/admin"
                    label="Himalix Logo"
                  />
                </div>

                {form.siteLogo && (
                  <div className="logo-preview-block mt-6" style={{ background: 'var(--bg-secondary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: 'var(--space-4)' }}>
                    <h4 style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)', color: 'var(--text-0)', fontWeight: 600 }}>Theme Inversion Preview</h4>
                    
                    <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                      {/* Light theme preview box */}
                      <div style={{ flex: 1, padding: '2rem', background: '#ffffff', color: '#000000', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd' }}>
                        <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 600 }}>Light Background</span>
                        <img 
                          src={form.siteLogo} 
                          alt="Himalix Light Preview" 
                          style={{ 
                            height: '40px', 
                            width: 'auto', 
                            filter: form.siteLogoInversion === 'invert_light' ? 'invert(1)' : 'none' 
                          }} 
                        />
                      </div>

                      {/* Dark theme preview box */}
                      <div style={{ flex: 1, padding: '2rem', background: '#0f0f0f', color: '#ffffff', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #333' }}>
                        <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 600 }}>Dark Background</span>
                        <img 
                          src={form.siteLogo} 
                          alt="Himalix Dark Preview" 
                          style={{ 
                            height: '40px', 
                            width: 'auto', 
                            filter: form.siteLogoInversion === 'invert_dark' ? 'invert(1)' : 'none' 
                          }} 
                        />
                      </div>
                    </div>

                    <div className="form-group mb-0">
                      <label className="form-label" style={{ fontWeight: 500, marginBottom: 'var(--space-2)' }}>Inversion Preference</label>
                      <select 
                        className="form-select"
                        value={form.siteLogoInversion}
                        onChange={e => setForm({ ...form, siteLogoInversion: e.target.value })}
                        style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: 'var(--space-2)', color: 'var(--text-0)', outline: 'none' }}
                      >
                        <option value="invert_dark">Invert color on Dark Background (Recommended)</option>
                        <option value="invert_light">Invert color on Light Background</option>
                        <option value="none">No Inversion (Keep flat black logo on both)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'social' && (
              <div className="settings-section">
                <h3 className="section-title mb-4" style={{ fontSize: 'var(--text-sm)' }}>Social Media Follow Rewards</h3>

                <div style={{ border: '1px solid var(--border)', padding: 'var(--space-4)', background: '#141414', marginBottom: 'var(--space-4)' }}>
                  <h4 style={{ fontSize: '13px', color: '#ff0000', marginBottom: 'var(--space-3)' }}>
                    <i className="fa-brands fa-youtube" style={{ marginRight: '6px' }} /> YouTube Reward Configuration
                  </h4>
                  <div className="form-group mb-3">
                    <label className="form-label">YouTube Channel URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="e.g. https://youtube.com/c/HimalixLabs"
                      value={form.socialYoutubeUrl || ''}
                      onChange={e => setForm({ ...form, socialYoutubeUrl: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reward Amount (Rs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="e.g. 50.00"
                      value={form.socialYoutubeReward || ''}
                      onChange={e => setForm({ ...form, socialYoutubeReward: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border)', padding: 'var(--space-4)', background: '#141414', marginBottom: 'var(--space-4)' }}>
                  <h4 style={{ fontSize: '13px', color: '#e1306c', marginBottom: 'var(--space-3)' }}>
                    <i className="fa-brands fa-instagram" style={{ marginRight: '6px' }} /> Instagram Reward Configuration
                  </h4>
                  <div className="form-group mb-3">
                    <label className="form-label">Instagram Profile URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="e.g. https://instagram.com/himalix.labs"
                      value={form.socialInstagramUrl || ''}
                      onChange={e => setForm({ ...form, socialInstagramUrl: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reward Amount (Rs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="e.g. 25.00"
                      value={form.socialInstagramReward || ''}
                      onChange={e => setForm({ ...form, socialInstagramReward: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border)', padding: 'var(--space-4)', background: '#141414' }}>
                  <h4 style={{ fontSize: '13px', color: '#1877f2', marginBottom: 'var(--space-3)' }}>
                    <i className="fa-brands fa-facebook" style={{ marginRight: '6px' }} /> Facebook Reward Configuration
                  </h4>
                  <div className="form-group mb-3">
                    <label className="form-label">Facebook Page URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="e.g. https://facebook.com/himalixlabs"
                      value={form.socialFacebookUrl || ''}
                      onChange={e => setForm({ ...form, socialFacebookUrl: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reward Amount (Rs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="e.g. 50.00"
                      value={form.socialFacebookReward || ''}
                      onChange={e => setForm({ ...form, socialFacebookReward: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }} className="flex justify-end">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <i className="fa-light fa-sharp fa-spinner-third fa-spin" /> : <i className="fa-light fa-sharp fa-floppy-disk" />}
                {saving ? ' Saving...' : ' Save Configurations'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Pagination from '../../../components/Pagination';
import useBatchSelection from '../../../hooks/useBatchSelection';
import BatchCheckbox from '../../components/BatchCheckbox';
import BatchActionBar from '../../components/BatchActionBar';
import BatchToast from '../../components/BatchToast';
import { exportToCsv } from '../../utils/csvExport';

export default function UserManager({ users, authFetch, onLoad }) {
  const [search, setSearch] = useState('');
  const [balanceModal, setBalanceModal] = useState(null); // holds user object
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceType, setBalanceType] = useState('deposit'); // 'deposit' or 'refund'
  const [balanceRef, setBalanceRef] = useState('');
  const [passwordModal, setPasswordModal] = useState(null); // holds user object
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Task 6 State
  const [detailsModal, setDetailsModal] = useState(null); // holds user lookup info
  const [detailsLoading, setDetailsLoading] = useState(false);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setBalanceModal(null);
        setPasswordModal(null);
        setDetailsModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenDetails = async (u) => {
    setDetailsLoading(true);
    try {
      const res = await authFetch(`/api/store/admin/users/${u.id}/details`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch details');
      setDetailsModal(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filtered = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleRole = async (u) => {
    const nextRole = u.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to change ${u.email}'s role to ${nextRole}?`)) return;

    try {
      const res = await authFetch(`/api/store/admin/users/${u.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: nextRole })
      });
      if (!res.ok) throw new Error('Failed to update role');
      onLoad();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`DANGER: Are you sure you want to delete the account for ${u.email}? This action is permanent.`)) return;

    try {
      const res = await authFetch(`/api/store/admin/users/${u.id}`, {
        method: 'DELETE'
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to delete user');
      alert(d.message || 'User deleted successfully');
      onLoad();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    if (!balanceAmount || isNaN(balanceAmount) || Number(balanceAmount) <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // If we are deducting (e.g. refund/purchase reversal but negative), amount is negative
      const amountSign = balanceType === 'purchase' ? -Number(balanceAmount) : Number(balanceAmount);
      const res = await authFetch(`/api/store/admin/users/${balanceModal.id}/credit`, {
        method: 'POST',
        body: JSON.stringify({
          amount: amountSign,
          type: balanceType,
          reference_id: balanceRef.trim() || undefined
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to adjust balance');
      
      setBalanceModal(null);
      setBalanceAmount('');
      setBalanceRef('');
      onLoad();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`/api/store/admin/users/${passwordModal.id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to reset password');
      
      setPasswordModal(null);
      setNewPassword('');
      alert('Password updated successfully');
      onLoad();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    setBatchLoading(true);
    try {
      const res = await authFetch('/api/store/admin/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'users', ids: selectedIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Batch delete failed');
      clearSelection();
      onLoad();
      setToast({ message: `Successfully deleted ${selectedIds.length} users`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchRoleChange = async (role) => {
    setBatchLoading(true);
    try {
      const res = await authFetch('/api/store/admin/batch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Batch update failed');
      clearSelection();
      onLoad();
      setToast({ message: `Successfully updated role to ${role} for ${selectedIds.length} users`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleExportCsv = () => {
    const exportData = users.filter(u => selectedIds.includes(u.id));
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Email', key: 'email' },
      { header: 'Role', key: 'role' },
      { header: 'Auth Provider', key: 'auth_provider' },
      { header: 'Wallet Balance', key: 'wallet_balance' },
      { header: 'Order Count', key: 'order_count' },
      { header: 'Joined Date', key: (u) => new Date(u.created_at).toLocaleDateString() }
    ];
    exportToCsv(exportData, columns, 'users_export');
  };

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="admin-users">
      <div className="flex justify-between items-center mb-6">
        <h2 className="page-title">User Accounts ({users.length})</h2>
        <div className="form-group mb-0" style={{ maxWidth: 300, flex: 1 }}>
          <input 
            className="form-input" 
            placeholder="Search email or role..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <BatchCheckbox
                  checked={isSelectedAll(paginated)}
                  indeterminate={isIndeterminate(paginated)}
                  onChange={() => toggleSelectAll(paginated)}
                />
              </th>
              <th>ID</th>
              <th>Customer Email</th>
              <th>Role</th>
              <th>Auth Provider</th>
              <th>Wallet Balance</th>
              <th>Orders Placed</th>
              <th>Joined Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(u => {
              const selected = isSelected(u.id);
              return (
                <tr key={u.id} className={selected ? 'row-selected' : ''}>
                  <td>
                    <BatchCheckbox
                      checked={selected}
                      onChange={() => toggleSelect(u.id)}
                    />
                  </td>
                  <td data-label="ID">#{u.id}</td>
                  <td data-label="Customer Email">
                    <div className="flex items-center gap-2">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                      ) : (
                        <i className="fa-light fa-sharp fa-user-circle text-lg" style={{ color: 'var(--text-3)' }} />
                      )}
                      <span className="font-semibold">{u.email}</span>
                    </div>
                  </td>
                  <td data-label="Role">
                    <span className={`badge badge--${u.role === 'admin' ? 'warning' : 'info'}`} style={{ textTransform: 'uppercase' }}>
                      {u.role}
                    </span>
                  </td>
                  <td data-label="Auth Provider" style={{ textTransform: 'capitalize' }}>{u.auth_provider || 'local'}</td>
                  <td data-label="Wallet Balance" className="font-mono" style={{ color: 'var(--accent)' }}>
                    Rs. {Number(u.wallet_balance).toFixed(2)}
                  </td>
                  <td data-label="Orders Placed">{u.order_count || 0}</td>
                  <td data-label="Joined Date">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td data-label="Actions">
                    <div className="flex gap-2 justify-end">
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => handleOpenDetails(u)}
                        disabled={detailsLoading}
                        title="View Consolidated User Account Details"
                        style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <i className="fa-light fa-sharp fa-circle-info" /> Details
                      </button>
                      <button 
                        className="btn btn-outline btn-sm" 
                        onClick={() => {
                          setBalanceModal(u);
                          setBalanceType('deposit');
                          setError('');
                        }}
                        title="Adjust Wallet Balance"
                      >
                        <i className="fa-light fa-sharp fa-wallet" /> Credit
                      </button>
                      {u.auth_provider !== 'google' && (
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => {
                            setPasswordModal(u);
                            setError('');
                          }}
                          title="Reset Password"
                        >
                          <i className="fa-light fa-sharp fa-key" /> PW
                        </button>
                      )}
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => handleToggleRole(u)}
                        title="Toggle Role"
                      >
                        <i className="fa-light fa-sharp fa-arrows-repeat" /> Role
                      </button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDeleteUser(u)}
                        title="Delete User Account"
                      >
                        <i className="fa-light fa-sharp fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-3)' }}>
                  No users match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination 
        currentPage={currentPage}
        totalPages={Math.ceil(filtered.length / itemsPerPage)}
        onPageChange={setCurrentPage}
      />

      {/* Adjust Wallet Balance Modal */}
      {balanceModal && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setBalanceModal(null); }}>
          <div className="admin-modal">
            <div className="admin-modal__content" style={{ maxWidth: 450 }}>
              <div className="admin-modal__header">
                <h2 className="page-title">Adjust Wallet Balance</h2>
                <button type="button" className="btn btn-ghost" onClick={() => setBalanceModal(null)}>
                  <i className="fa-light fa-sharp fa-xmark" />
                </button>
              </div>
              <form onSubmit={handleAdjustBalance} className="admin-modal__body">
                {error && <div className="alert alert-danger mb-4">{error}</div>}
                
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <strong>User Email:</strong> {balanceModal.email}<br/>
                  <strong>Current Balance:</strong> Rs. {Number(balanceModal.wallet_balance).toFixed(2)}
                </div>

                <div className="form-group">
                  <label className="form-label">Adjustment Type</label>
                  <select className="form-select" value={balanceType} onChange={e => setBalanceType(e.target.value)}>
                    <option value="deposit">Deposit (Credit Account)</option>
                    <option value="refund">Refund (Credit Account)</option>
                    <option value="purchase">Debit Adjustment (Charge Account)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Amount (Rs.)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    required 
                    placeholder="e.g. 1000.00" 
                    value={balanceAmount} 
                    onChange={e => setBalanceAmount(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reference / Reason</label>
                  <input 
                    className="form-input" 
                    placeholder="e.g. eSewa manual deposit ref #81728" 
                    value={balanceRef} 
                    onChange={e => setBalanceRef(e.target.value)} 
                  />
                </div>

                <div className="admin-modal__footer mt-6 flex justify-between">
                  <button type="button" className="btn btn-outline" onClick={() => setBalanceModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Processing...' : 'Confirm Adjustment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {passwordModal && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setPasswordModal(null); }}>
          <div className="admin-modal">
            <div className="admin-modal__content" style={{ maxWidth: 400 }}>
              <div className="admin-modal__header">
                <h2 className="page-title">Reset Password</h2>
                <button type="button" className="btn btn-ghost" onClick={() => setPasswordModal(null)}>
                  <i className="fa-light fa-sharp fa-xmark" />
                </button>
              </div>
              <form onSubmit={handleResetPassword} className="admin-modal__body">
                {error && <div className="alert alert-danger mb-4">{error}</div>}
                
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <strong>User Email:</strong> {passwordModal.email}
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    required 
                    placeholder="Enter at least 6 characters" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                  />
                </div>

                <div className="admin-modal__footer mt-6 flex justify-between">
                  <button type="button" className="btn btn-outline" onClick={() => setPasswordModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detailed User Lookup Modal (Task 6) */}
      {detailsModal && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDetailsModal(null); }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
          <div className="admin-modal" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', width: '95%', maxWidth: '1000px', maxHeight: '90vh', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
            <div className="admin-modal__header" style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="page-title" style={{ margin: 0, fontSize: 'var(--text-lg)' }}>
                Consolidated Account Lookup: {detailsModal.user?.email}
              </h2>
              <button type="button" className="btn btn-ghost" onClick={() => setDetailsModal(null)} style={{ padding: '4px' }}>
                <i className="fa-light fa-sharp fa-xmark" />
              </button>
            </div>

            <div className="admin-modal__body" style={{ padding: 'var(--space-6)', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', height: '100%' }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                {/* Profile Card */}
                <div style={{ background: 'var(--bg-primary)', padding: 'var(--space-4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)' }}>User Profile</h3>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
                    {detailsModal.user?.avatar_url ? (
                      <img src={detailsModal.user.avatar_url} alt="" style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid var(--border)' }} />
                    ) : (
                      <i className="fa-light fa-sharp fa-user-astronaut" style={{ fontSize: '40px', color: 'var(--text-3)' }} />
                    )}
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{detailsModal.user?.name || 'No Display Name'}</h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>User ID: #{detailsModal.user?.id}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    <div><strong>Email:</strong> {detailsModal.user?.email}</div>
                    <div><strong>Role:</strong> {detailsModal.user?.role?.toUpperCase()}</div>
                    <div><strong>Provider:</strong> {detailsModal.user?.auth_provider?.toUpperCase()}</div>
                    <div><strong>Phone:</strong> {detailsModal.user?.phone || 'N/A'}</div>
                    <div><strong>Referral Code:</strong> {detailsModal.user?.referral_code || 'N/A'}</div>
                    <div><strong>Joined:</strong> {new Date(detailsModal.user?.created_at).toLocaleString()}</div>
                  </div>
                </div>

                {/* Delivery Locations */}
                <div style={{ background: 'var(--bg-primary)', padding: 'var(--space-4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)' }}>Delivery Addresses</h3>
                  {detailsModal.addresses?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {detailsModal.addresses.map((a, i) => (
                        <div key={a.id} style={{ border: '1px solid var(--border)', padding: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', fontSize: '11px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong>{a.label?.toUpperCase()} {a.is_default === 1 && <span style={{ color: 'var(--accent)' }}>(DEFAULT)</span>}</strong>
                            <span>{a.full_name} ({a.phone})</span>
                          </div>
                          <div>{a.address_line}, {a.city}, {a.district}, {a.province}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-3)' }}>No addresses saved.</p>
                  )}
                </div>

                {/* Login IPs & Sessions */}
                <div style={{ background: 'var(--bg-primary)', padding: 'var(--space-4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)' }}>Active & Past Session IPs</h3>
                  {detailsModal.sessions?.length > 0 ? (
                    <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '11px', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '4px' }}>IP Address</th>
                            <th style={{ padding: '4px' }}>Date</th>
                            <th style={{ padding: '4px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailsModal.sessions.map((s, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '4px', fontFamily: 'var(--font-mono)' }}>{s.ip_address}</td>
                              <td style={{ padding: '4px' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                              <td style={{ padding: '4px' }}>{s.revoked_at ? 'Logged Out' : 'Active'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-3)' }}>No session history.</p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                {/* Wallet Balance & Activity */}
                <div style={{ background: 'var(--bg-primary)', padding: 'var(--space-4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)' }}>Wallet Activity</h3>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent)' }}>
                      Balance: Rs. {Number(detailsModal.wallet?.balance).toFixed(2)}
                    </span>
                  </div>
                  {detailsModal.wallet?.transactions?.length > 0 ? (
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '11px', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '4px' }}>Amount</th>
                            <th style={{ padding: '4px' }}>Type</th>
                            <th style={{ padding: '4px' }}>Description</th>
                            <th style={{ padding: '4px' }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailsModal.wallet.transactions.map((t, idx) => (
                            <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '4px', fontFamily: 'var(--font-mono)', color: t.amount >= 0 ? '#4caf50' : '#f44336' }}>
                                {t.amount >= 0 ? '+' : ''}{Number(t.amount).toFixed(2)}
                              </td>
                              <td style={{ padding: '4px', textTransform: 'capitalize' }}>{t.type}</td>
                              <td style={{ padding: '4px' }}>{t.description}</td>
                              <td style={{ padding: '4px' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-3)' }}>No wallet transaction ledger history.</p>
                  )}
                </div>

                {/* Orders Placed */}
                <div style={{ background: 'var(--bg-primary)', padding: 'var(--space-4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)' }}>Order History</h3>
                  {detailsModal.orders?.length > 0 ? (
                    <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {detailsModal.orders.map(o => (
                        <div key={o.id} style={{ border: '1px solid var(--border)', padding: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', fontSize: '11px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
                            <span>Order #{o.id} ({new Date(o.created_at).toLocaleDateString()})</span>
                            <span style={{ color: 'var(--accent)' }}>Rs. {Number(o.total_amount).toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-2)', marginBottom: '4px' }}>
                            <span>Tracking: <code>{o.tracking_code || 'N/A'}</code></span>
                            <span style={{ textTransform: 'uppercase' }}>{o.status}</span>
                          </div>
                          {o.items?.length > 0 && (
                            <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '4px', marginTop: '4px', color: 'var(--text-3)' }}>
                              {o.items.map((item, idx) => (
                                <div key={idx}>- {item.name} x {item.quantity} (Rs. {Number(item.price).toFixed(2)})</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-3)' }}>No orders placed yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="admin-modal__footer" style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setDetailsModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <BatchActionBar
        selectionCount={selectionCount}
        onClearSelection={clearSelection}
        onExportCsv={handleExportCsv}
        loading={batchLoading}
        actions={[
          {
            label: 'Make Admin',
            icon: 'shield',
            onClick: () => handleBatchRoleChange('admin')
          },
          {
            label: 'Make Customer',
            icon: 'user',
            onClick: () => handleBatchRoleChange('customer')
          },
          {
            label: 'Delete Selected',
            icon: 'trash',
            variant: 'danger',
            confirm: `Are you sure you want to delete ${selectionCount} user accounts permanently?`,
            onClick: handleBatchDelete
          }
        ]}
      />
      {toast && <BatchToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

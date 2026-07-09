import React, { useState, useEffect } from 'react';
import { exportToCsv } from '../../utils/csvExport';

export default function LogsManager({ authFetch }) {
  const [logs, setLogs] = useState(null);
  const [activityData, setActivityData] = useState({ logs: [], total: 0, totalPages: 1, actionTypes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('activity');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivityLogs();
    } else {
      fetchLegacyLogs();
    }
  }, [activeTab, currentPage, actionFilter]);

  const fetchLegacyLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/store/admin/logs');
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError(err.message || 'Error loading system logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: search,
        action: actionFilter
      });
      const res = await authFetch(`/api/store/admin/activity-logs?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch activity logs');
      const data = await res.json();
      setActivityData(data);
    } catch (err) {
      setError(err.message || 'Error loading activity logs');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearch('');
    setActionFilter('');
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    if (activeTab === 'activity') {
      fetchActivityLogs();
    }
  };

  const getActionIcon = (action) => {
    const act = String(action).toLowerCase();
    if (act.includes('created') || act.includes('register')) return <i className="fa-light fa-sharp fa-user-plus text-info" />;
    if (act.includes('login')) return <i className="fa-light fa-sharp fa-right-to-bracket text-success" />;
    if (act.includes('order_placed')) return <i className="fa-light fa-sharp fa-bag-shopping text-warning" />;
    if (act.includes('status_update')) return <i className="fa-light fa-sharp fa-rotate text-info" />;
    if (act.includes('balance') || act.includes('credit') || act.includes('debit')) return <i className="fa-light fa-sharp fa-wallet text-success" />;
    if (act.includes('delete')) return <i className="fa-light fa-sharp fa-trash-can text-danger" />;
    if (act.includes('setting')) return <i className="fa-light fa-sharp fa-sliders-up text-warning" />;
    if (act.includes('ticket')) return <i className="fa-light fa-sharp fa-ticket-airline text-info" />;
    return <i className="fa-light fa-sharp fa-bell text-muted" />;
  };

  const getActionBadgeClass = (action) => {
    const act = String(action).toLowerCase();
    if (act.includes('created')) return 'badge-info';
    if (act.includes('login')) return 'badge-success';
    if (act.includes('placed')) return 'badge-warning';
    if (act.includes('deleted')) return 'badge-danger';
    return 'badge-neutral';
  };

  // Processing client-side filter for legacy tabs
  let legacyDataArray = [];
  if (logs) {
    if (activeTab === 'wallet') legacyDataArray = logs.walletTransactions || [];
    else if (activeTab === 'claims') legacyDataArray = logs.socialClaims || [];
    else if (activeTab === 'contact') legacyDataArray = logs.contactMessages || [];
  }

  const filteredLegacy = legacyDataArray.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (activeTab === 'wallet') {
      return (
        (item.user_email || '').toLowerCase().includes(q) ||
        (item.type || '').toLowerCase().includes(q) ||
        (item.reference_id || '').toLowerCase().includes(q)
      );
    } else if (activeTab === 'claims') {
      return (
        (item.user_email || '').toLowerCase().includes(q) ||
        (item.platform || '').toLowerCase().includes(q)
      );
    } else if (activeTab === 'contact') {
      return (
        (item.name || '').toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q) ||
        (item.subject || '').toLowerCase().includes(q) ||
        (item.message || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPagesLegacy = Math.ceil(filteredLegacy.length / itemsPerPage) || 1;
  const legacyStartIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLegacyItems = filteredLegacy.slice(legacyStartIndex, legacyStartIndex + itemsPerPage);

  const formatPrice = (n) => `Rs. ${Number(n).toFixed(2)}`;

  const handleExportCsv = () => {
    if (activeTab === 'activity') {
      const columns = [
        { header: 'ID', key: 'id' },
        { header: 'Action', key: 'action' },
        { header: 'Summary', key: 'summary' },
        { header: 'User Email', key: 'user_email' },
        { header: 'User Role', key: 'user_role' },
        { header: 'IP Address', key: 'ip_address' },
        { header: 'Created At', key: 'created_at' }
      ];
      exportToCsv(activityData.logs, columns, 'activity_logs');
    } else if (activeTab === 'wallet') {
      const columns = [
        { header: 'ID', key: 'id' },
        { header: 'User Email', key: 'user_email' },
        { header: 'Amount', key: 'amount' },
        { header: 'Type', key: 'type' },
        { header: 'Reference ID', key: 'reference_id' },
        { header: 'Created At', key: 'created_at' }
      ];
      exportToCsv(logs?.walletTransactions || [], columns, 'wallet_ledger');
    } else if (activeTab === 'claims') {
      const columns = [
        { header: 'User Email', key: 'user_email' },
        { header: 'Platform', key: 'platform' },
        { header: 'Claimed At', key: 'claimed_at' }
      ];
      exportToCsv(logs?.socialClaims || [], columns, 'social_claims');
    } else if (activeTab === 'contact') {
      const columns = [
        { header: 'ID', key: 'id' },
        { header: 'Name', key: 'name' },
        { header: 'Email', key: 'email' },
        { header: 'Subject', key: 'subject' },
        { header: 'Message', key: 'message' },
        { header: 'Created At', key: 'created_at' }
      ];
      exportToCsv(logs?.contactMessages || [], columns, 'contact_messages');
    }
  };

  return (
    <div className="logs-manager">
      <div className="flex justify-between items-center mb-6">
        <h2 className="page-title">Ecosystem Action Logs</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-outline" 
            onClick={handleExportCsv}
            disabled={activeTab === 'activity' ? !activityData.logs.length : !legacyDataArray.length}
          >
            <i className="fa-light fa-file-csv" style={{ marginRight: '6px' }} /> Export CSV
          </button>
          <button 
            className="btn btn-outline" 
            onClick={activeTab === 'activity' ? fetchActivityLogs : fetchLegacyLogs}
          >
            <i className="fa-light fa-sharp fa-rotate" /> Refresh Feed
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'activity' ? 'admin-tab-btn--active' : ''}`}
          onClick={() => handleTabChange('activity')}
        >
          Ecosystem Activity Feed
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'wallet' ? 'admin-tab-btn--active' : ''}`}
          onClick={() => handleTabChange('wallet')}
        >
          Wallet Ledger
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'claims' ? 'admin-tab-btn--active' : ''}`}
          onClick={() => handleTabChange('claims')}
        >
          Social Claims
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'contact' ? 'admin-tab-btn--active' : ''}`}
          onClick={() => handleTabChange('contact')}
        >
          Helpline Messages
        </button>
      </div>

      {/* Filters */}
      <div className="admin-filters mb-6">
        <form onSubmit={handleSearchSubmit} className="admin-filters__search-form">
          <div className="admin-filters__search-input-wrap">
            <i className="fa-light fa-sharp fa-magnifying-glass admin-filters__search-icon" />
            <input
              type="text"
              className="form-input admin-filters__search-input"
              placeholder={activeTab === 'activity' ? "Search activity logs by user or summary..." : "Search ledger / helpline messages..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        {activeTab === 'activity' && (
          <div className="admin-filters__select-wrap">
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
              className="form-select"
            >
              <option value="">All Action Types</option>
              {activityData.actionTypes.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <div className="spinner" />
        </div>
      ) : error ? (
        <div className="alert alert-danger">
          <i className="fa-light fa-sharp fa-circle-exclamation" /> {error}
        </div>
      ) : (
        <>
          {/* Logs Table */}
          <div className="admin-table-wrap">
            {activeTab === 'activity' && (
              activityData.logs.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                  <i className="fa-light fa-sharp fa-file-excel text-4xl mb-4" style={{ color: 'var(--text-3)' }} />
                  <p>No activity logs found matching the filter criteria.</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Type</th>
                      <th>Action</th>
                      <th>Summary</th>
                      <th>Operator</th>
                      <th>IP Address</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityData.logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ textAlign: 'center' }}>{getActionIcon(log.action)}</td>
                        <td data-label="Action">
                          <span className={`badge ${getActionBadgeClass(log.action)}`} style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                            {log.action}
                          </span>
                        </td>
                        <td data-label="Summary" style={{ maxWidth: '350px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {log.summary}
                        </td>
                        <td data-label="Operator">
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{log.user_email || 'System / Guest'}</span>
                            {log.user_role && <span className="text-muted" style={{ fontSize: '10px' }}>{log.user_role}</span>}
                          </div>
                        </td>
                        <td data-label="IP Address" className="font-mono" style={{ fontSize: '11px' }}>
                          {log.ip_address || '—'}
                        </td>
                        <td data-label="Timestamp" style={{ fontSize: '11px' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeTab !== 'activity' && (
              filteredLegacy.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                  <i className="fa-light fa-sharp fa-file-excel text-4xl mb-4" style={{ color: 'var(--text-3)' }} />
                  <p>No matching logs found.</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    {activeTab === 'wallet' && (
                      <tr>
                        <th>ID</th>
                        <th>User Email</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Reference ID</th>
                        <th>Created At</th>
                      </tr>
                    )}
                    {activeTab === 'claims' && (
                      <tr>
                        <th>User Email</th>
                        <th>Platform</th>
                        <th>Claimed At</th>
                      </tr>
                    )}
                    {activeTab === 'contact' && (
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Subject</th>
                        <th>Message</th>
                        <th>Date</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {activeTab === 'wallet' && paginatedLegacyItems.map((tx) => (
                      <tr key={tx.id}>
                        <td data-label="ID" className="font-mono">#{tx.id}</td>
                        <td data-label="User Email">{tx.user_email || `User #${tx.user_id}`}</td>
                        <td data-label="Amount" className="font-mono" style={{ color: tx.amount < 0 ? 'var(--danger)' : 'var(--accent)' }}>
                          {tx.amount < 0 ? '-' : '+'}{formatPrice(Math.abs(tx.amount))}
                        </td>
                        <td data-label="Type">
                          <span className={`badge badge--${tx.type === 'deposit' ? 'success' : tx.type === 'purchase' ? 'info' : 'warning'}`} style={{ textTransform: 'uppercase' }}>
                            {tx.type}
                          </span>
                        </td>
                        <td data-label="Reference ID" className="font-mono">{tx.reference_id || 'N/A'}</td>
                        <td data-label="Created At">{new Date(tx.created_at).toLocaleString('en-NP')}</td>
                      </tr>
                    ))}
                    {activeTab === 'claims' && paginatedLegacyItems.map((claim, index) => (
                      <tr key={`${claim.user_id}-${claim.platform}-${index}`}>
                        <td data-label="User Email">{claim.user_email || `User #${claim.user_id}`}</td>
                        <td data-label="Platform" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }} className="font-mono">{claim.platform}</td>
                        <td data-label="Claimed At">{new Date(claim.claimed_at).toLocaleString('en-NP')}</td>
                      </tr>
                    ))}
                    {activeTab === 'contact' && paginatedLegacyItems.map((msg) => (
                      <tr key={msg.id}>
                        <td data-label="Name"><strong>{msg.name}</strong></td>
                        <td data-label="Email" className="font-mono">{msg.email}</td>
                        <td data-label="Subject">{msg.subject || 'No Subject'}</td>
                        <td data-label="Message" style={{ maxWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-all' }}>{msg.message}</td>
                        <td data-label="Date">{new Date(msg.created_at).toLocaleString('en-NP')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>

          {/* Pagination */}
          {((activeTab === 'activity' && activityData.totalPages > 1) || 
            (activeTab !== 'activity' && totalPagesLegacy > 1)) && (
            <div className="flex justify-between items-center mt-6">
              <div style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)' }}>
                {activeTab === 'activity' ? (
                  `Showing page ${currentPage} of ${activityData.totalPages} (${activityData.total} logs total)`
                ) : (
                  `Showing ${legacyStartIndex + 1} - ${Math.min(legacyStartIndex + itemsPerPage, filteredLegacy.length)} of ${filteredLegacy.length} logs`
                )}
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                  Page {currentPage} of {activeTab === 'activity' ? activityData.totalPages : totalPagesLegacy}
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setCurrentPage(p => Math.min(activeTab === 'activity' ? activityData.totalPages : totalPagesLegacy, p + 1))}
                  disabled={currentPage === (activeTab === 'activity' ? activityData.totalPages : totalPagesLegacy)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

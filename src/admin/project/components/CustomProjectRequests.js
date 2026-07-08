import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import LoadingScreen from '../../../components/LoadingScreen';
import Pagination from '../../../components/Pagination';
import useBatchSelection from '../../../hooks/useBatchSelection';
import BatchCheckbox from '../../components/BatchCheckbox';
import BatchActionBar from '../../components/BatchActionBar';
import BatchToast from '../../components/BatchToast';
import { exportToCsv } from '../../utils/csvExport';

export default function CustomProjectRequests() {
  const { authFetch } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/project/custom-requests');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await authFetch(`/api/admin/project/custom-requests/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
        if (activeRequest && activeRequest.id === id) {
          setActiveRequest(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this custom project request?')) return;
    try {
      const res = await authFetch(`/api/admin/project/custom-requests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRequests(requests.filter(r => r.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBatchStatusChange = async (status) => {
    setBatchLoading(true);
    try {
      const res = await authFetch('/api/admin/project/batch-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'custom_project_requests', ids: selectedIds, status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Batch status change failed');
      clearSelection();
      fetchRequests();
      setToast({ message: `Successfully updated status for ${selectedIds.length} requests`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    setBatchLoading(true);
    try {
      const res = await authFetch('/api/admin/project/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'custom_project_requests', ids: selectedIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Batch delete failed');
      clearSelection();
      fetchRequests();
      setToast({ message: `Successfully deleted ${selectedIds.length} requests`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleExportCsv = () => {
    const exportData = requests.filter(r => selectedIds.includes(r.id));
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Project Name', key: 'project_name' },
      { header: 'Client Name', key: 'client_name' },
      { header: 'Client Email', key: 'client_email' },
      { header: 'Client Phone', key: 'client_phone' },
      { header: 'Project Type', key: 'project_type' },
      { header: 'Description', key: 'description' },
      { header: 'Detailed Requirements', key: 'long_description' },
      { header: 'Status', key: 'status' },
      { header: 'Submitted At', key: (r) => new Date(r.created_at).toLocaleString() }
    ];
    exportToCsv(exportData, columns, 'custom_project_requests_export');
  };

  if (loading) return <LoadingScreen />;

  const paginated = requests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="admin-section fade-in">
      <div className="admin-table-header">
        <div>
          <h2 className="admin-table-header__title">Custom Project Requests</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: '4px' }}>
            Manage custom engineering design requests submitted by clients.
          </p>
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
              <th>Request ID</th>
              <th>Project Name</th>
              <th>Client Info</th>
              <th>Type</th>
              <th>Short Objective</th>
              <th>Status</th>
              <th>Created</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(r => {
              const selected = isSelected(r.id);
              return (
                <tr key={r.id} className={selected ? 'row-selected' : ''}>
                  <td>
                    <BatchCheckbox
                      checked={selected}
                      onChange={() => toggleSelect(r.id)}
                    />
                  </td>
                  <td>#{r.id}</td>
                  <td><strong>{r.project_name}</strong></td>
                  <td>
                    <div style={{ fontSize: 'var(--text-sm)' }}><strong>{r.client_name}</strong></div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>{r.client_email}</div>
                    {r.client_phone && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>{r.client_phone}</div>}
                  </td>
                  <td>
                    <span className={`badge badge--neutral`} style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                      {r.project_type}
                    </span>
                  </td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.description}
                  </td>
                  <td>
                    <select 
                      className="form-select" 
                      value={r.status} 
                      onChange={e => handleStatusChange(r.id, e.target.value)}
                      disabled={updatingId === r.id}
                      style={{ padding: '2px 8px', fontSize: 'var(--text-xs)', width: 'auto' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)' }}>
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="text-right">
                    <div className="admin-table__actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setActiveRequest(r)} title="View Details" style={{ height: '30px', padding: '0 8px', fontSize: 'var(--text-xs)' }}>
                        <i className="fa-light fa-sharp fa-eye" /> View
                      </button>
                      <button className="admin-table__action-btn admin-table__action-btn--danger" onClick={() => handleDelete(r.id)} title="Delete Record">
                        <i className="fa-light fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {requests.length === 0 && (
              <tr><td colSpan="9" className="text-center py-8">No custom project requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination 
        currentPage={currentPage}
        totalPages={Math.ceil(requests.length / itemsPerPage)}
        onPageChange={setCurrentPage}
      />

      {/* Detailed Viewer Modal */}
      {activeRequest && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveRequest(null); }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="admin-modal" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', width: '90%', maxWidth: '750px', borderRadius: 'var(--radius-md)', padding: 'var(--space-6)' }}>
            <div className="admin-modal__content">
              <div className="admin-modal__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                <h2 className="page-title" style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Custom Request Details #{activeRequest.id}</h2>
                <button type="button" className="btn btn-ghost" onClick={() => setActiveRequest(null)} aria-label="Close dialog" style={{ padding: '4px' }}>
                  <i className="fa-light fa-sharp fa-xmark" />
                </button>
              </div>

              <div className="admin-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <h5 style={{ color: 'var(--text-2)', fontSize: '12px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Project Name</h5>
                    <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{activeRequest.project_name}</div>
                  </div>
                  <div>
                    <h5 style={{ color: 'var(--text-2)', fontSize: '12px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Project Type</h5>
                    <span className="badge badge--neutral" style={{ textTransform: 'uppercase' }}>{activeRequest.project_type}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <div>
                    <h5 style={{ color: 'var(--text-2)', fontSize: '12px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Client Name</h5>
                    <div>{activeRequest.client_name}</div>
                  </div>
                  <div>
                    <h5 style={{ color: 'var(--text-2)', fontSize: '12px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Client Contact Info</h5>
                    <div style={{ fontSize: '13px' }}>Email: {activeRequest.client_email}</div>
                    {activeRequest.client_phone && <div style={{ fontSize: '13px' }}>Phone: {activeRequest.client_phone}</div>}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <h5 style={{ color: 'var(--text-2)', fontSize: '12px', margin: '0 0 6px 0', textTransform: 'uppercase' }}>Brief Objective / Description</h5>
                  <p style={{ background: 'var(--bg-3)', padding: '12px', borderRadius: '4px', margin: 0, fontSize: '13px', border: '1px solid var(--border)' }}>
                    {activeRequest.description}
                  </p>
                </div>

                {activeRequest.long_description && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <h5 style={{ color: 'var(--text-2)', fontSize: '12px', margin: '0 0 6px 0', textTransform: 'uppercase' }}>Detailed Requirements (Long Description)</h5>
                    <p style={{ background: 'var(--bg-3)', padding: '12px', borderRadius: '4px', margin: 0, fontSize: '13px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
                      {activeRequest.long_description}
                    </p>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <div>
                    <h5 style={{ color: 'var(--text-2)', fontSize: '12px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Submitted At</h5>
                    <div style={{ fontSize: '13px' }}>{new Date(activeRequest.created_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <h5 style={{ color: 'var(--text-2)', fontSize: '12px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Status</h5>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select 
                        className="form-select" 
                        value={activeRequest.status} 
                        onChange={e => handleStatusChange(activeRequest.id, e.target.value)}
                        style={{ padding: '4px 10px', fontSize: 'var(--text-xs)', width: 'auto' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setActiveRequest(null)}>Close</button>
              </div>
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
            label: 'Set Pending',
            icon: 'clock',
            onClick: () => handleBatchStatusChange('pending')
          },
          {
            label: 'Set Contacted',
            icon: 'comment',
            onClick: () => handleBatchStatusChange('contacted')
          },
          {
            label: 'Set Completed',
            icon: 'check',
            onClick: () => handleBatchStatusChange('completed')
          },
          {
            label: 'Set Cancelled',
            icon: 'xmark',
            onClick: () => handleBatchStatusChange('cancelled')
          },
          {
            label: 'Delete Selected',
            icon: 'trash',
            variant: 'danger',
            confirm: `Are you sure you want to delete ${selectionCount} requests permanently?`,
            onClick: handleBatchDelete
          }
        ]}
      />
      {toast && <BatchToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

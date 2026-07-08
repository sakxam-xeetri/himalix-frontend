import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import useBatchSelection from '../../hooks/useBatchSelection';
import BatchCheckbox from '../components/BatchCheckbox';
import BatchActionBar from '../components/BatchActionBar';
import BatchToast from '../components/BatchToast';
import { exportToCsv } from '../utils/csvExport';

const PRINT_STATUSES = [
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'estimated', label: 'Price Quoted' },
  { value: 'approved', label: 'Approved & Paid' },
  { value: 'printing', label: 'Printing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function PrintOrdersManager({ orders, loading, onUpdateOrder, onRefresh }) {
  const { authFetch } = useAuth();
  const [activeOrder, setActiveOrder] = useState(null);

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
        body: JSON.stringify({ type: 'printing_orders', ids: selectedIds, status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Batch status update failed');
      clearSelection();
      if (onRefresh) onRefresh();
      setToast({ message: `Successfully updated status for ${selectedIds.length} orders`, type: 'success' });
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
        body: JSON.stringify({ type: 'printing_orders', ids: selectedIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Batch delete failed');
      clearSelection();
      if (onRefresh) onRefresh();
      setToast({ message: `Successfully deleted ${selectedIds.length} orders`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleExportCsv = () => {
    const exportData = orders.filter(print => selectedIds.includes(print.id));
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'User Email', key: 'user_email' },
      { header: 'Filename', key: 'filename' },
      { header: 'Material', key: 'material' },
      { header: 'Color', key: 'color' },
      { header: 'Quantity', key: 'quantity' },
      { header: 'Price', key: 'price' },
      { header: 'Status', key: 'status' }
    ];
    exportToCsv(exportData, columns, 'printing_orders_export');
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}><div className="spinner" /></div>;
  }

  return (
    <div>
      <h2 className="admin-view-title">3D Printing Request Manager</h2>

      {orders.length === 0 ? (
        <div className="empty-state">No print jobs submitted.</div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <BatchCheckbox
                      checked={isSelectedAll(orders)}
                      indeterminate={isIndeterminate(orders)}
                      onChange={() => toggleSelectAll(orders)}
                    />
                  </th>
                  <th>User</th><th>Model File</th><th>Material</th><th>Color</th>
                  <th>Qty</th><th>Manual Price</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(print => {
                  const selected = isSelected(print.id);
                  return (
                    <tr key={print.id} className={selected ? 'row-selected' : ''}>
                      <td>
                        <BatchCheckbox
                          checked={selected}
                          onChange={() => toggleSelect(print.id)}
                        />
                      </td>
                      <td>{print.user_name || print.user_email}</td>
                      <td>
                        <a href={print.file_url} target="_blank" rel="noreferrer" style={{ color: 'var(--info)', textDecoration: 'underline' }}>
                          {print.filename}
                        </a>
                      </td>
                      <td>{print.material}</td>
                      <td>{print.color}</td>
                      <td>{print.quantity}</td>
                      <td>
                        <input type="number" defaultValue={print.price || ''} id={`price-${print.id}`}
                          placeholder="Set Rs." className="form-input font-mono" style={{ width: '100px', padding: '4px 8px' }} />
                      </td>
                      <td>
                        <select defaultValue={print.status} id={`status-${print.id}`} className="form-select" style={{ padding: '4px 8px', fontSize: '12px' }}>
                          {PRINT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </td>
                      <td style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setActiveOrder(print)}>
                          <i className="fa-light fa-sharp fa-eye" /> View
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => {
                          const p = document.getElementById(`price-${print.id}`).value;
                          const s = document.getElementById(`status-${print.id}`).value;
                          onUpdateOrder(print.id, p, s);
                        }}>Save</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Detail Modal ── */}
          {activeOrder && (
            <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveOrder(null); }}>
              <div className="admin-modal" style={{ maxWidth: '750px' }}>
                <div className="admin-modal__content">
                  <div className="admin-modal__header">
                    <h2 className="page-title">3D Print Request #{activeOrder.id}</h2>
                    <button type="button" className="btn btn-ghost" onClick={() => setActiveOrder(null)}><i className="fa-light fa-sharp fa-xmark" /></button>
                  </div>
                  <div className="admin-modal__body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                      {/* Left — Job specs */}
                      <div>
                        <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Job Specifications</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '16px' }}>
                          <div><strong>File:</strong>{' '}<a href={activeOrder.file_url} target="_blank" rel="noreferrer" style={{ color: 'var(--info)', textDecoration: 'underline' }}>{activeOrder.filename}</a></div>
                          <div><strong>Material:</strong> {activeOrder.material}</div>
                          <div><strong>Color:</strong> {activeOrder.color}</div>
                          <div><strong>Quantity:</strong> {activeOrder.quantity}</div>
                          <div><strong>Layer Height:</strong> {activeOrder.layer_height_mm} mm</div>
                          <div><strong>Infill:</strong> {activeOrder.infill_percentage}%</div>
                          <div><strong>Est. Weight:</strong> {activeOrder.estimated_weight_g || 'Pending'} g</div>
                          <div><strong>Price:</strong> Rs. {activeOrder.price ? Number(activeOrder.price).toFixed(2) : 'Pending'}</div>
                          <div><strong>Status:</strong> {activeOrder.status.toUpperCase().replace('_', ' ')}</div>
                        </div>
                        <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Process Job</h3>
                        <div className="form-group">
                          <label className="form-label">Set Price (Rs.)</label>
                          <input type="number" id={`modal-price-${activeOrder.id}`} defaultValue={activeOrder.price || ''} className="form-input" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Job Status</label>
                          <select id={`modal-status-${activeOrder.id}`} defaultValue={activeOrder.status} className="form-select">
                            {PRINT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Right — Customer + Shipping */}
                      <div>
                        <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Customer</h3>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', background: 'var(--bg-1)', padding: '12px', border: '1px solid var(--border)' }}>
                          {activeOrder.user_avatar_url ? (
                            <img src={activeOrder.user_avatar_url} alt="" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: 'var(--text-2)' }}>
                              <i className="fa-light fa-sharp fa-sharp fa-user" />
                            </div>
                          )}
                          <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div><strong>Name:</strong> {activeOrder.user_name || 'Guest'}</div>
                            <div><strong>Email:</strong> {activeOrder.user_email}</div>
                            <div><strong>Phone:</strong> {activeOrder.user_phone || 'N/A'}</div>
                          </div>
                        </div>
                        <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Shipping</h3>
                        {activeOrder.address_line ? (
                          <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-1)', padding: '12px', border: '1px solid var(--border)' }}>
                            <div><strong>To:</strong> {activeOrder.address_full_name || activeOrder.user_name || 'N/A'}</div>
                            <div><strong>Address:</strong> {activeOrder.address_line}, {activeOrder.address_city}</div>
                            <div><strong>District:</strong> {activeOrder.address_district}, {activeOrder.address_province}</div>
                            {activeOrder.address_lat && activeOrder.address_lng && (
                              <div><a href={`https://maps.google.com/?q=${activeOrder.address_lat},${activeOrder.address_lng}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>View on Map</a></div>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>No shipping address on file</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="admin-modal__footer mt-6 flex justify-end gap-2">
                    <button type="button" className="btn btn-outline" onClick={() => setActiveOrder(null)}>Close</button>
                    <button type="button" className="btn btn-primary" onClick={async () => {
                      const p = document.getElementById(`modal-price-${activeOrder.id}`).value;
                      const s = document.getElementById(`modal-status-${activeOrder.id}`).value;
                      await onUpdateOrder(activeOrder.id, p, s);
                      setActiveOrder(null);
                    }}>
                      <i className="fa-light fa-sharp fa-floppy-disk" /> Save & Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <BatchActionBar
        selectionCount={selectionCount}
        onClearSelection={clearSelection}
        onExportCsv={handleExportCsv}
        loading={batchLoading}
        actions={[
          {
            label: 'In Printing',
            icon: 'print',
            onClick: () => handleBatchStatus('printing')
          },
          {
            label: 'Completed',
            icon: 'check',
            onClick: () => handleBatchStatus('completed')
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

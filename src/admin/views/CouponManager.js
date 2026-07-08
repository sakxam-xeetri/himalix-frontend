import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import useBatchSelection from '../../hooks/useBatchSelection';
import BatchCheckbox from '../components/BatchCheckbox';
import BatchActionBar from '../components/BatchActionBar';
import BatchToast from '../components/BatchToast';
import { exportToCsv } from '../utils/csvExport';

export default function CouponManager({ coupons, loading, saving, onSave, onDelete, onRefresh }) {
  const { authFetch } = useAuth();
  const [editor, setEditor] = useState(null); // null | 'new' | coupon object

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

  const handleBatchDelete = async () => {
    setBatchLoading(true);
    try {
      const res = await authFetch('/api/store/admin/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'coupons', ids: selectedIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Batch delete failed');
      clearSelection();
      if (onRefresh) onRefresh();
      setToast({ message: `Successfully deleted ${selectedIds.length} coupons`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchToggleActive = async (isActive) => {
    setBatchLoading(true);
    try {
      const res = await authFetch('/api/store/admin/batch-toggle-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'coupons', ids: selectedIds, is_active: isActive })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Batch update failed');
      clearSelection();
      if (onRefresh) onRefresh();
      setToast({ message: `Successfully updated ${selectedIds.length} coupons`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleExportCsv = () => {
    const exportData = coupons.filter(c => selectedIds.includes(c.id));
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Code', key: 'code' },
      { header: 'Description', key: 'description' },
      { header: 'Discount Type', key: 'discount_type' },
      { header: 'Discount Value', key: 'discount_value' },
      { header: 'Min Order Amount', key: 'min_order_amount' },
      { header: 'Max Discount Amount', key: 'max_discount_amount' },
      { header: 'Usage Limit', key: 'usage_limit' },
      { header: 'Usage Count', key: 'usage_count' },
      { header: 'Expires At', key: 'expires_at' },
      { header: 'Is Active', key: (c) => c.is_active ? 'Yes' : 'No' }
    ];
    exportToCsv(exportData, columns, 'coupons_export');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 className="admin-view-title" style={{ margin: 0 }}>Coupon Codes Manager</h2>
        {!editor && (
          <button className="btn btn-primary btn-sm" onClick={() => setEditor('new')}>
            <i className="fa-light fa-sharp fa-plus" style={{ marginRight: '6px' }} /> New Coupon
          </button>
        )}
      </div>

      {/* ── Editor Form ── */}
      {editor ? (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: 'var(--space-5)' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
            {editor === 'new' ? 'Create Coupon' : `Edit: ${editor.code}`}
          </h3>
          <form onSubmit={e => {
            e.preventDefault();
            const payload = {
              code: e.target.code.value,
              description: e.target.description.value,
              discount_type: e.target.discount_type.value,
              discount_value: parseFloat(e.target.discount_value.value),
              min_order_amount: parseFloat(e.target.min_order_amount.value || 0),
              max_discount_amount: e.target.max_discount_amount.value ? parseFloat(e.target.max_discount_amount.value) : null,
              usage_limit: e.target.usage_limit.value ? parseInt(e.target.usage_limit.value) : null,
              per_user_limit: parseInt(e.target.per_user_limit.value || 1),
              starts_at: e.target.starts_at.value || null,
              expires_at: e.target.expires_at.value || null,
              is_active: e.target.is_active.checked ? 1 : 0
            };
            onSave(payload, editor === 'new' ? null : editor.id).then(() => setEditor(null));
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }} className="grid-mobile-1">
              <div className="form-group">
                <label className="form-label">Coupon Code</label>
                <input name="code" type="text" placeholder="e.g. LAB50" defaultValue={editor === 'new' ? '' : editor.code} required className="form-input" style={{ textTransform: 'uppercase' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Discount Type</label>
                <select name="discount_type" defaultValue={editor === 'new' ? 'fixed' : editor.discount_type} className="form-select">
                  <option value="fixed">Fixed Amount (Rs.)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }} className="grid-mobile-1">
              <div className="form-group">
                <label className="form-label">Discount Value</label>
                <input name="discount_value" type="number" step="0.01" defaultValue={editor === 'new' ? '' : editor.discount_value} required className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Min Order Amount (Rs.)</label>
                <input name="min_order_amount" type="number" step="0.01" defaultValue={editor === 'new' ? '0' : editor.min_order_amount} className="form-input" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }} className="grid-mobile-1">
              <div className="form-group">
                <label className="form-label">Max Discount (Rs.)</label>
                <input name="max_discount_amount" type="number" step="0.01" placeholder="Unlimited" defaultValue={editor === 'new' ? '' : (editor.max_discount_amount || '')} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Total Usage Limit</label>
                <input name="usage_limit" type="number" placeholder="Unlimited" defaultValue={editor === 'new' ? '' : (editor.usage_limit || '')} className="form-input" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }} className="grid-mobile-1">
              <div className="form-group">
                <label className="form-label">Per User Limit</label>
                <input name="per_user_limit" type="number" defaultValue={editor === 'new' ? '1' : editor.per_user_limit} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input name="description" type="text" defaultValue={editor === 'new' ? '' : (editor.description || '')} className="form-input" placeholder="e.g. 15% off referral discount" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }} className="grid-mobile-1">
              <div className="form-group">
                <label className="form-label">Starts At</label>
                <input name="starts_at" type="datetime-local" defaultValue={editor === 'new' || !editor.starts_at ? '' : new Date(editor.starts_at).toISOString().slice(0, 16)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Expires At</label>
                <input name="expires_at" type="datetime-local" defaultValue={editor === 'new' || !editor.expires_at ? '' : new Date(editor.expires_at).toISOString().slice(0, 16)} className="form-input" />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input name="is_active" id="coupon_active" type="checkbox" defaultChecked={editor === 'new' ? true : !!editor.is_active} />
              <label htmlFor="coupon_active" style={{ fontSize: '13px', cursor: 'pointer' }}>Active & redeemable</label>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Coupon'}</button>
              <button type="button" className="btn btn-outline" onClick={() => setEditor(null)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        /* ── Coupons Table ── */
        <>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}><div className="spinner" /></div>
          ) : coupons.length === 0 ? (
            <div className="empty-state">No coupons yet. Create one above!</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <BatchCheckbox
                        checked={isSelectedAll(coupons)}
                        indeterminate={isIndeterminate(coupons)}
                        onChange={() => toggleSelectAll(coupons)}
                      />
                    </th>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Discount</th>
                    <th>Min Order</th>
                    <th>Used</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => {
                    const selected = isSelected(c.id);
                    return (
                      <tr key={c.id} className={selected ? 'row-selected' : ''}>
                        <td>
                          <BatchCheckbox
                            checked={selected}
                            onChange={() => toggleSelect(c.id)}
                          />
                        </td>
                        <td><strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{c.code}</strong></td>
                        <td>{c.description || 'N/A'}</td>
                        <td>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `Rs. ${c.discount_value}`}</td>
                        <td>Rs. {c.min_order_amount}</td>
                        <td>{c.usage_count} / {c.usage_limit || '∞'}</td>
                        <td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}</td>
                        <td>
                          <span className={`badge ${c.is_active ? 'badge--success' : 'badge--danger'}`}>
                            {c.is_active ? 'Active' : 'Offline'}
                          </span>
                        </td>
                        <td style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditor(c)}>
                            <i className="fa-light fa-sharp fa-pen" /> Edit
                          </button>
                          <button className="btn btn-ghost btn-sm text-danger" onClick={() => onDelete(c.id)}>
                            <i className="fa-light fa-sharp fa-trash" /> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
            label: 'Activate Selected',
            icon: 'check',
            variant: 'success',
            onClick: () => handleBatchToggleActive(true)
          },
          {
            label: 'Deactivate Selected',
            icon: 'ban',
            variant: 'warning',
            onClick: () => handleBatchToggleActive(false)
          },
          {
            label: 'Delete Selected',
            icon: 'trash',
            variant: 'danger',
            confirm: `Are you sure you want to delete ${selectionCount} coupons permanently?`,
            onClick: handleBatchDelete
          }
        ]}
      />
      {toast && <BatchToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

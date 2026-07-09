import React, { useState, useEffect, useCallback } from 'react';
import OrderDetailPanel from './OrderDetailPanel';
import useBatchSelection from '../../hooks/useBatchSelection';
import BatchCheckbox from '../components/BatchCheckbox';
import BatchActionBar from '../components/BatchActionBar';
import BatchToast from '../components/BatchToast';
import { exportToCsv } from '../utils/csvExport';

export default function UnifiedOrders({ authFetch, onRefreshStats }) {
  const [storeOrders, setStoreOrders] = useState([]);
  const [printOrders, setPrintOrders] = useState([]);
  const [webInquiries, setWebInquiries] = useState([]);
  const [projectOrders, setProjectOrders] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTabFilter, setActiveTabFilter] = useState('all'); // all, store, print, web, project
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, active, completed, cancelled
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

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
    clearSelection();
  }, [activeTabFilter, clearSelection]);

  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    try {
      const [resStore, resPrint, resWeb, resProject] = await Promise.all([
        authFetch('/api/store/admin/orders').then(r => r.json()).catch(() => ({ orders: [] })),
        authFetch('/api/store/admin/printing').then(r => r.json()).catch(() => ({ orders: [] })),
        authFetch('/api/store/admin/web-inquiries').then(r => r.json()).catch(() => ({ inquiries: [] })),
        authFetch('/api/admin/project/orders').then(r => r.json()).catch(() => ({ orders: [] }))
      ]);

      setStoreOrders(Array.isArray(resStore) ? resStore : (resStore.orders || []));
      setPrintOrders(resPrint.orders || []);
      setWebInquiries(resWeb.inquiries || []);
      setProjectOrders(resProject.orders || []);
    } catch (e) {
      console.error('Failed to load unified orders:', e);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  // Normalize order list
  const getNormalizedOrders = () => {
    const list = [];

    // Store orders
    storeOrders.forEach(o => {
      list.push({
        id: o.id,
        date: o.created_at,
        customer_name: o.shipping_name || o.user_name || 'Guest',
        customer_email: o.user_email || 'N/A',
        type: 'store',
        summary: o.items ? o.items.map(item => `${item.product_name || item.name} (x${item.quantity})`).join(', ') : 'Store Order',
        price: parseFloat(o.total || 0),
        status: o.status,
        original: o
      });
    });

    // 3D Print requests
    printOrders.forEach(o => {
      list.push({
        id: o.id,
        date: o.created_at,
        customer_name: o.user_name || 'Guest',
        customer_email: o.user_email,
        type: 'print',
        summary: `3D Print: ${o.filename} (${o.material} - ${o.color})`,
        price: o.price ? parseFloat(o.price) : 0,
        status: o.status,
        original: o
      });
    });

    // Web Agency inquiries
    webInquiries.forEach(o => {
      list.push({
        id: o.id,
        date: o.created_at,
        customer_name: o.name,
        customer_email: o.email,
        type: 'web',
        summary: `Web Agency: ${o.project_type?.replace('_', ' ')} (${o.budget_range?.replace('_', ' ')})`,
        price: 0, // Inquiries don't have final price in table
        status: o.status,
        original: o
      });
    });

    // Project Catalog orders
    projectOrders.forEach(o => {
      // Exclude unified project orders from duplicate listing in Unified Orders list
      if (o.is_unified) return;

      list.push({
        id: o.id,
        date: o.created_at || o.date,
        customer_name: o.buyer_name,
        customer_email: o.buyer_email,
        type: 'project',
        summary: `Catalog Project: ${o.project_name} (${o.order_type === 'rent' ? 'rental' : 'purchase'})`,
        price: parseFloat(o.price || 0),
        status: o.status,
        original: o
      });
    });

    return list;
  };

  const handleUpdateOrder = async (id, param1, param2) => {
    setUpdatingId(id);
    try {
      if (selectedType === 'store') {
        // param1 is fields payload
        const res = await authFetch(`/api/store/admin/orders/${id}/status`, {
          method: 'PUT', body: JSON.stringify(param1),
        });
        if (res.ok) {
          setStoreOrders(prev => prev.map(o => o.id === id ? { ...o, ...param1 } : o));
          setSelectedOrder(prev => prev && prev.id === id ? { ...prev, ...param1 } : prev);
        }
      } else if (selectedType === 'print') {
        // param1 = price, param2 = status
        const res = await authFetch(`/api/store/admin/printing/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ price: param1, status: param2 })
        });
        if (res.ok) {
          setPrintOrders(prev => prev.map(o => o.id === id ? { ...o, price: param1, status: param2 } : o));
          setSelectedOrder(prev => prev && prev.id === id ? { ...prev, price: param1, status: param2 } : prev);
        }
      } else if (selectedType === 'web') {
        // param1 = status, param2 = notes
        const res = await authFetch(`/api/store/admin/web-inquiries/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: param1, admin_notes: param2 })
        });
        if (res.ok) {
          setWebInquiries(prev => prev.map(o => o.id === id ? { ...o, status: param1, admin_notes: param2 } : o));
          setSelectedOrder(prev => prev && prev.id === id ? { ...prev, status: param1, admin_notes: param2 } : prev);
        }
      } else if (selectedType === 'project') {
        // param1 = status
        const res = await authFetch(`/api/admin/project/orders/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: param1 })
        });
        if (res.ok) {
          setProjectOrders(prev => prev.map(o => o.id === id ? { ...o, status: param1 } : o));
          setSelectedOrder(prev => prev && prev.id === id ? { ...prev, status: param1 } : prev);
        }
      }
      if (onRefreshStats) onRefreshStats();
    } catch (e) {
      console.error('Update failed:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBatchDelete = async () => {
    setBatchLoading(true);
    
    // Group selected IDs by type
    const grouped = {};
    selectedIds.forEach(idStr => {
      const parts = String(idStr).split('-');
      if (parts.length === 2) {
        const [type, id] = parts;
        const numId = parseInt(id, 10);
        if (!grouped[type]) {
          grouped[type] = [];
        }
        grouped[type].push(numId);
      }
    });

    try {
      // Build array of promises to delete per type
      const promises = Object.entries(grouped).map(([type, ids]) => {
        if (!ids.length) return Promise.resolve();
        let url = '/api/store/admin/batch-delete';
        let bodyType = '';

        if (type === 'store') {
          bodyType = 'orders';
        } else if (type === 'print') {
          bodyType = 'printing_orders';
        } else if (type === 'web') {
          bodyType = 'web_inquiries';
        } else if (type === 'project') {
          url = '/api/admin/project/batch-delete';
          bodyType = 'project_orders';
        }

        return authFetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: bodyType, ids })
        }).then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || `Failed to delete ${type} items`);
          }
          return res.json();
        });
      });

      await Promise.all(promises);
      clearSelection();
      fetchAllOrders();
      if (onRefreshStats) onRefreshStats();
      setToast({ message: `Successfully deleted ${selectedIds.length} items`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchStatus = async (statusKey) => {
    setBatchLoading(true);

    const STATUS_MAP = {
      processing: {
        store: 'processing',
        print: 'printing',
        web: 'in_discussion',
        project: 'in_progress'
      },
      completed: {
        store: 'completed',
        print: 'completed',
        web: 'accepted',
        project: 'completed'
      }
    };

    // Group selected IDs by type
    const grouped = {};
    selectedIds.forEach(idStr => {
      const parts = String(idStr).split('-');
      if (parts.length === 2) {
        const [type, id] = parts;
        const numId = parseInt(id, 10);
        if (!grouped[type]) {
          grouped[type] = [];
        }
        grouped[type].push(numId);
      }
    });

    try {
      const promises = Object.entries(grouped).map(([type, ids]) => {
        if (!ids.length) return Promise.resolve();
        let url = '/api/store/admin/batch-status';
        let bodyType = '';

        if (type === 'store') {
          bodyType = 'orders';
        } else if (type === 'print') {
          bodyType = 'printing_orders';
        } else if (type === 'web') {
          bodyType = 'web_inquiries';
        } else if (type === 'project') {
          url = '/api/admin/project/batch-status';
          bodyType = 'project_orders';
        }

        // Determine the actual status string for this type
        let actualStatus = statusKey;
        if (activeTabFilter === 'all') {
          const typeMap = STATUS_MAP[statusKey];
          if (typeMap && typeMap[type]) {
            actualStatus = typeMap[type];
          }
        }

        return authFetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: bodyType, ids, status: actualStatus })
        }).then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || `Failed to update status for ${type} items`);
          }
          return res.json();
        });
      });

      await Promise.all(promises);
      clearSelection();
      fetchAllOrders();
      if (onRefreshStats) onRefreshStats();
      setToast({ message: `Successfully updated status for ${selectedIds.length} items`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleExportCsv = () => {
    const exportData = filteredAndSorted.filter(o => selectedIds.includes(`${o.type}-${o.id}`));
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Type', key: 'type' },
      { header: 'Client Name', key: 'customer_name' },
      { header: 'Client Email', key: 'customer_email' },
      { header: 'Summary', key: 'summary' },
      { header: 'Price', key: 'price' },
      { header: 'Status', key: 'status' },
      { header: 'Date', key: (o) => new Date(o.date).toLocaleDateString() }
    ];
    exportToCsv(exportData, columns, `${activeTabFilter}_orders_export`);
  };

  const handleOpenDrawer = (normalized) => {
    setSelectedOrder(normalized.original);
    setSelectedType(normalized.type);
    setDrawerOpen(true);
  };

  const getStatusLabel = (status) => {
    return status?.toUpperCase().replace('_', ' ') || 'PENDING';
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'pending_review':
      case 'unread':
        return 'badge--warning';
      case 'completed':
      case 'delivered':
      case 'accepted':
      case 'pricing_assigned':
      case 'proposal_sent':
      case 'in_discussion':
      case 'processing':
      case 'in_printing':
      case 'printing':
      case 'approved':
      case 'shipped':
        return 'badge--success';
      case 'cancelled':
      case 'declined':
        return 'badge--danger';
      default:
        return 'badge--info';
    }
  };

  // Filters mapping
  const normalized = getNormalizedOrders();

  const filteredAndSorted = normalized
    .filter(o => {
      // Type Tab Filter
      if (activeTabFilter !== 'all' && o.type !== activeTabFilter) return false;

      // Status Group Filter
      if (statusFilter !== 'all') {
        const s = o.status?.toLowerCase();
        if (statusFilter === 'pending') {
          if (s !== 'pending' && s !== 'pending_review' && s !== 'unread' && s !== 'estimated') return false;
        } else if (statusFilter === 'active') {
          if (
            s !== 'processing' &&
            s !== 'printing' &&
            s !== 'in_printing' &&
            s !== 'in_discussion' &&
            s !== 'proposal_sent' &&
            s !== 'shipped' &&
            s !== 'pricing_assigned' &&
            s !== 'confirmed' &&
            s !== 'approved' &&
            s !== 'accepted' &&
            s !== 'in_progress'
          ) return false;
        } else if (statusFilter === 'completed') {
          if (s !== 'completed' && s !== 'delivered' && s !== 'accepted') return false;
        } else if (statusFilter === 'cancelled') {
          if (s !== 'cancelled' && s !== 'declined') return false;
        }
      }

      // Search Filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesId = o.id.toString().includes(query);
        const matchesClient = o.customer_name?.toLowerCase().includes(query) || o.customer_email?.toLowerCase().includes(query);
        const matchesSummary = o.summary?.toLowerCase().includes(query);
        return matchesId || matchesClient || matchesSummary;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date_asc') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'price_asc') return a.price - b.price;
      return 0;
    });

  const filteredAndSortedWithCompoundIds = filteredAndSorted.map(o => ({
    ...o,
    id: `${o.type}-${o.id}`
  }));

  const isActiveOrder = (o) => {
    const s = o.status?.toLowerCase();
    return s !== 'completed' && s !== 'delivered' && s !== 'cancelled' && s !== 'declined' && s !== 'archived';
  };

  const getCount = (type) => {
    if (type === 'all') return normalized.filter(isActiveOrder).length;
    return normalized.filter(o => o.type === type && isActiveOrder(o)).length;
  };

  const getBatchActions = () => {
    if (activeTabFilter === 'all') {
      return [
        { label: 'Set In Progress', icon: 'clock', onClick: () => handleBatchStatus('processing') },
        { label: 'Set Completed', icon: 'check', onClick: () => handleBatchStatus('completed') },
        { label: 'Delete Selected', icon: 'trash', variant: 'danger', confirm: `Are you sure you want to delete ${selectionCount} items?`, onClick: handleBatchDelete }
      ];
    }
    if (activeTabFilter === 'store') {
      return [
        { label: 'Set Processing', icon: 'clock', onClick: () => handleBatchStatus('processing') },
        { label: 'Set Completed', icon: 'check', onClick: () => handleBatchStatus('completed') },
        { label: 'Delete Selected', icon: 'trash', variant: 'danger', confirm: `Are you sure you want to delete ${selectionCount} orders?`, onClick: handleBatchDelete }
      ];
    }
    if (activeTabFilter === 'print') {
      return [
        { label: 'In Printing', icon: 'print', onClick: () => handleBatchStatus('printing') },
        { label: 'Set Completed', icon: 'check', onClick: () => handleBatchStatus('completed') },
        { label: 'Delete Selected', icon: 'trash', variant: 'danger', confirm: `Are you sure you want to delete ${selectionCount} requests?`, onClick: handleBatchDelete }
      ];
    }
    if (activeTabFilter === 'web') {
      return [
        { label: 'Set In Discussion', icon: 'comments', onClick: () => handleBatchStatus('in_discussion') },
        { label: 'Set Proposal Sent', icon: 'paper-plane', onClick: () => handleBatchStatus('proposal_sent') },
        { label: 'Delete Selected', icon: 'trash', variant: 'danger', confirm: `Are you sure you want to delete ${selectionCount} inquiries?`, onClick: handleBatchDelete }
      ];
    }
    if (activeTabFilter === 'project') {
      return [
        { label: 'In Progress', icon: 'clock', onClick: () => handleBatchStatus('in_progress') },
        { label: 'Set Completed', icon: 'check', onClick: () => handleBatchStatus('completed') },
        { label: 'Delete Selected', icon: 'trash', variant: 'danger', confirm: `Are you sure you want to delete ${selectionCount} orders?`, onClick: handleBatchDelete }
      ];
    }
    return [];
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <div className="spinner" />
        <p style={{ marginTop: '12px', color: 'var(--text-3)' }}>Loading unified orders & requests pipeline...</p>
      </div>
    );
  }

  return (
    <div className="admin-unified-orders fade-in">
      <div className="admin-table-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="admin-table-header__title">Unified Orders Pipeline</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: '4px' }}>
            Consolidated pipeline for physical products, 3D printing jobs, web projects, and software orders.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchAllOrders}>
          <i className="fa-light fa-sharp fa-rotate" style={{ marginRight: '6px' }} /> Refresh Pipeline
        </button>
      </div>

      {/* Stats Counter Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '16px', borderRadius: '4px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>Total Queue</div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{getCount('all')}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '16px', borderRadius: '4px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>E-Store Orders</div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: '#38bdf8' }}>{getCount('store')}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '16px', borderRadius: '4px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>3D Print Requests</div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: '#c084fc' }}>{getCount('print')}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '16px', borderRadius: '4px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>Web Agency Leads</div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: '#4ade80' }}>{getCount('web')}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '16px', borderRadius: '4px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>Project Catalog</div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: '#fb923c' }}>{getCount('project')}</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '16px', marginBottom: '20px' }}>
        {/* Type Tabs Filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <button className={`btn btn-sm ${activeTabFilter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTabFilter('all')}>
            All ({getCount('all')})
          </button>
          <button className={`btn btn-sm ${activeTabFilter === 'store' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTabFilter('store')}>
            E-Store ({getCount('store')})
          </button>
          <button className={`btn btn-sm ${activeTabFilter === 'print' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTabFilter('print')}>
            3D Prints ({getCount('print')})
          </button>
          <button className={`btn btn-sm ${activeTabFilter === 'web' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTabFilter('web')}>
            Web Agency ({getCount('web')})
          </button>
          <button className={`btn btn-sm ${activeTabFilter === 'project' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTabFilter('project')}>
            Projects ({getCount('project')})
          </button>
        </div>

        {/* Search, Status and Sort Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by Order ID, client, details..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input"
              style={{ fontSize: '13px', paddingLeft: '32px' }}
            />
            <i className="fa-light fa-sharp fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select" style={{ width: '130px', height: '36px', fontSize: '12px' }}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending / Unread</option>
              <option value="active">Active/In Process</option>
              <option value="completed">Completed/Accepted</option>
              <option value="cancelled">Cancelled/Declined</option>
            </select>

            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="form-select" style={{ width: '130px', height: '36px', fontSize: '12px' }}>
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="price_desc">Price: High-to-Low</option>
              <option value="price_asc">Price: Low-to-High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Unified Table */}
      {filteredAndSorted.length === 0 ? (
        <div className="empty-state">No matching orders or requests found.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <BatchCheckbox
                    checked={isSelectedAll(filteredAndSortedWithCompoundIds)}
                    indeterminate={isIndeterminate(filteredAndSortedWithCompoundIds)}
                    onChange={() => toggleSelectAll(filteredAndSortedWithCompoundIds)}
                  />
                </th>
                <th style={{ width: '70px' }}>ID</th>
                <th style={{ width: '110px' }}>Type</th>
                <th>Client</th>
                <th>Summary / Details</th>
                <th style={{ width: '100px' }}>Total Price</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '120px' }}>Date</th>
                <th style={{ width: '90px' }} className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map(o => {
                const compoundId = `${o.type}-${o.id}`;
                const selected = isSelected(compoundId);
                return (
                  <tr key={compoundId} className={selected ? 'row-selected' : ''}>
                    <td>
                      <BatchCheckbox
                        checked={selected}
                        onChange={() => toggleSelect(compoundId)}
                      />
                    </td>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>#{o.id}</strong>
                      {o.original?.tracking_code && (
                        <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: '2px', letterSpacing: '0.2px' }}>
                          {o.original.tracking_code}
                        </div>
                      )}
                    </td>
                    <td>
                      <span 
                        style={{ 
                          fontSize: '10px', 
                          padding: '2px 6px', 
                          borderRadius: '3px', 
                          fontWeight: 600,
                          backgroundColor: 
                            o.type === 'store' ? 'rgba(56, 189, 248, 0.15)' :
                            o.type === 'print' ? 'rgba(192, 132, 252, 0.15)' :
                            o.type === 'web' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(251, 146, 60, 0.15)',
                          color:
                            o.type === 'store' ? '#38bdf8' :
                            o.type === 'print' ? '#c084fc' :
                            o.type === 'web' ? '#4ade80' : '#fb923c'
                        }}
                      >
                        {o.type === 'store' ? 'E-Store' :
                         o.type === 'print' ? '3D Print' :
                         o.type === 'web' ? 'Web Agency' : 'Project'}
                      </span>
                    </td>
                    <td>
                      <div><strong>{o.customer_name}</strong></div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{o.customer_email}</div>
                    </td>
                    <td>
                      <div style={{ 
                        fontSize: '12px', 
                        maxWidth: '300px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {o.summary}
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '13px' }}>
                        {o.type === 'web' ? 'N/A' : `Rs. ${o.price.toFixed(2)}`}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge ${getStatusClass(o.status)}`}>
                        {getStatusLabel(o.status)}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                      {new Date(o.date).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <button className="btn btn-primary btn-sm" onClick={() => handleOpenDrawer(o)}>
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-out detail drawer */}
      {drawerOpen && (
        <OrderDetailPanel
          order={selectedOrder}
          type={selectedType}
          updating={updatingId !== null}
          onUpdate={handleUpdateOrder}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedOrder(null);
            setSelectedType(null);
          }}
        />
      )}

      <BatchActionBar
        selectionCount={selectionCount}
        onClearSelection={clearSelection}
        onExportCsv={handleExportCsv}
        loading={batchLoading}
        actions={getBatchActions()}
      />
      {toast && <BatchToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

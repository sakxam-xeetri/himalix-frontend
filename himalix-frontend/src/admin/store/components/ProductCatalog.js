import React, { useState, useEffect } from 'react';
import Pagination from '../../../components/Pagination';
import { useAuth } from '../../../auth/AuthContext';
import useBatchSelection from '../../../hooks/useBatchSelection';
import BatchCheckbox from '../../components/BatchCheckbox';
import BatchActionBar from '../../components/BatchActionBar';
import BatchToast from '../../components/BatchToast';
import { exportToCsv } from '../../utils/csvExport';

export default function ProductCatalog({
  products,
  loading,
  onEdit,
  onDelete,
  onRefresh
}) {
  const { authFetch } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');

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
    setCurrentPage(1);
    clearSelection();
  }, [search, categoryFilter, stockFilter, sortBy, clearSelection]);

  if (loading) return <div className="spinner" />;

  // Dynamically extract unique categories
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Filtering & Sorting logic
  const filteredAndSorted = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      
      let matchStock = true;
      if (stockFilter === 'in_stock') {
        matchStock = p.stock_quantity > 0;
      } else if (stockFilter === 'out_of_stock') {
        matchStock = p.stock_quantity <= 0;
      } else if (stockFilter === 'outsourced') {
        matchStock = p.stock_type === 'outsourced';
      }

      return matchSearch && matchCategory && matchStock;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') {
        return parseFloat(a.price) - parseFloat(b.price);
      } else if (sortBy === 'price_desc') {
        return parseFloat(b.price) - parseFloat(a.price);
      } else if (sortBy === 'stock_asc') {
        return a.stock_quantity - b.stock_quantity;
      } else if (sortBy === 'stock_desc') {
        return b.stock_quantity - a.stock_quantity;
      } else if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      } else if (sortBy === 'id_desc') {
        return b.id - a.id;
      }
      return 0;
    });

  const handleBatchDelete = async () => {
    setBatchLoading(true);
    try {
      const res = await authFetch('/api/store/admin/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'products', ids: selectedIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Batch delete failed');
      clearSelection();
      if (onRefresh) onRefresh();
      setToast({ message: `Successfully deleted ${selectedIds.length} products`, type: 'success' });
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
        body: JSON.stringify({ type: 'products', ids: selectedIds, is_active: isActive })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Batch active toggle failed');
      clearSelection();
      if (onRefresh) onRefresh();
      setToast({ message: `Successfully updated status for ${selectedIds.length} products`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleExportCsv = () => {
    const exportData = products.filter(p => selectedIds.includes(p.id));
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Name', key: 'name' },
      { header: 'SKU', key: 'sku' },
      { header: 'Category', key: 'category' },
      { header: 'Price', key: 'price' },
      { header: 'Stock Qty', key: 'stock_quantity' },
      { header: 'Stock Type', key: 'stock_type' },
      { header: 'Status', key: (p) => p.is_active ? 'Active' : 'Inactive' }
    ];
    exportToCsv(exportData, columns, 'products_export');
  };

  return (
    <div className="admin-products" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Header and Controls */}
      <div className="admin-products__header" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div>
            <h2 className="page-title" style={{ margin: 0 }}>Product Catalog</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>
              Showing {filteredAndSorted.length} of {products.length} products
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => onEdit('new')}>
            <i className="fa-light fa-sharp fa-plus" /> Add Product
          </button>
        </div>

        {/* Filter Controls Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)', width: '100%' }}>
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)' }}>Search</label>
            <input 
              className="form-input" 
              placeholder="Search by name or SKU..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)' }}>Category</label>
            <select className="form-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'ALL CATEGORIES' : cat.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)' }}>Stock Status</label>
            <select className="form-select" value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
              <option value="all">ALL STOCK STATES</option>
              <option value="in_stock">IN STOCK</option>
              <option value="out_of_stock">OUT OF STOCK</option>
              <option value="outsourced">OUTSOURCED</option>
            </select>
          </div>
          
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)' }}>Sort By</label>
            <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="stock_desc">Stock: High to Low</option>
              <option value="id_desc">Newest Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* List of Products Table */}
      {filteredAndSorted.length > 0 ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <BatchCheckbox
                      checked={isSelectedAll(filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage))}
                      indeterminate={isIndeterminate(filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage))}
                      onChange={() => toggleSelectAll(filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage))}
                    />
                  </th>
                  <th style={{ width: '60px' }}>ID</th>
                  <th style={{ width: '60px' }}>Image</th>
                  <th>Product Name</th>
                  <th style={{ width: '120px' }}>SKU</th>
                  <th style={{ width: '150px' }}>Category</th>
                  <th style={{ width: '130px' }}>Price</th>
                  <th style={{ width: '120px' }}>Stock</th>
                  <th style={{ width: '100px' }}>Status</th>
                  <th className="text-right" style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(p => {
                  const isOutOfStock = p.stock_quantity <= 0 && p.stock_type !== 'outsourced';
                  const isOutsourced = p.stock_type === 'outsourced';
                  const selected = isSelected(p.id);

                  return (
                    <tr key={p.id} className={selected ? 'row-selected' : ''}>
                      <td>
                        <BatchCheckbox
                          checked={selected}
                          onChange={() => toggleSelect(p.id)}
                        />
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>#{p.id}</td>
                      <td>
                        {p.image_url ? (
                          <img 
                            src={p.image_url} 
                            alt={p.name} 
                            style={{ width: 40, height: 40, objectFit: 'cover', border: '1px solid var(--border)', borderRadius: '4px' }} 
                            onError={e => { e.target.src = '/placeholder.svg'; }} 
                          />
                        ) : (
                          <div style={{ width: 40, height: 40, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: '4px' }}>
                            <i className="fa-light fa-sharp fa-image text-lg" style={{ color: 'var(--text-3)' }} />
                          </div>
                        )}
                      </td>
                      <td><strong>{p.name}</strong></td>
                      <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>{p.sku || 'N/A'}</code></td>
                      <td><span style={{ textTransform: 'uppercase', fontSize: '10.5px', fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.3px' }}>{p.category || 'Uncategorized'}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>Rs. {Number(p.price).toLocaleString('en-NP')}</td>
                      <td>
                        {isOutOfStock ? (
                          <span className="badge badge--danger" style={{ fontSize: '10px' }}>Out of Stock</span>
                        ) : isOutsourced ? (
                          <span className="badge badge--warning" style={{ fontSize: '10px' }}>Outsourced</span>
                        ) : (
                          <span className="badge badge--success" style={{ fontSize: '10px' }}>{p.stock_quantity} In Stock</span>
                        )}
                      </td>
                      <td>
                        {p.is_active ? (
                          <span className="badge badge--success" style={{ fontSize: '10px' }}>Active</span>
                        ) : (
                          <span className="badge badge--neutral" style={{ fontSize: '10px' }}>Inactive</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="admin-table__actions">
                          <button className="admin-table__action-btn" onClick={() => onEdit(p)} title="Edit">
                            <i className="fa-light fa-sharp fa-pen-to-square" />
                          </button>
                          <button className="admin-table__action-btn admin-table__action-btn--danger" onClick={() => onDelete(p.id)} title="Delete">
                            <i className="fa-light fa-sharp fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage}
            totalPages={Math.ceil(filteredAndSorted.length / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <div className="empty-state">
          <i className="fa-light fa-sharp fa-box-open empty-state-icon" />
          <p>No products match your filters.</p>
        </div>
      )}

      <BatchActionBar
        selectionCount={selectionCount}
        onClearSelection={clearSelection}
        onExportCsv={handleExportCsv}
        loading={batchLoading}
        actions={[
          {
            label: 'Activate',
            icon: 'check',
            onClick: () => handleBatchToggleActive(true)
          },
          {
            label: 'Deactivate',
            icon: 'ban',
            onClick: () => handleBatchToggleActive(false)
          },
          {
            label: 'Delete Selected',
            icon: 'trash',
            variant: 'danger',
            confirm: `Are you sure you want to delete ${selectionCount} products permanently?`,
            onClick: handleBatchDelete
          }
        ]}
      />
      {toast && <BatchToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

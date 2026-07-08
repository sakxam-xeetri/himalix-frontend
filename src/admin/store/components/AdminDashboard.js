import React from 'react';

export default function AdminDashboard({ data, loading, setActiveTab }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!data) {
    return <div className="empty-state">No dashboard data available.</div>;
  }

  const { stats, recentOrders } = data;

  const handleOrderClick = (orderType) => {
    setActiveTab('unified_orders');
  };

  const getOrderBadgeClass = (type) => {
    switch (type) {
      case 'store': return 'badge-info';
      case '3d_printing': return 'badge-success';
      case 'web_inquiry': return 'badge-warning';
      case 'project': return 'badge-primary';
      default: return 'badge-neutral';
    }
  };

  const getOrderStatusBadgeClass = (status) => {
    const s = String(status || '').toLowerCase();
    if (['delivered', 'completed', 'paid', 'accepted'].includes(s)) return 'badge-success';
    if (['cancelled', 'failed', 'rejected'].includes(s)) return 'badge-danger';
    if (['pending', 'unread', 'pending_review'].includes(s)) return 'badge-warning';
    return 'badge-info';
  };

  const formatOrderType = (type) => {
    switch (type) {
      case 'store': return 'Store Order';
      case '3d_printing': return '3D Print';
      case 'web_inquiry': return 'Web Agency';
      case 'project': return 'Project Order';
      default: return type;
    }
  };

  return (
    <div className="admin-dashboard">
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 className="page-title">Command Center</h2>
          <p className="page-subtitle">Central intelligence and ecosystem operations overview</p>
        </div>
      </div>

      {/* Grid for critical operations metrics */}
      <div className="admin-stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        {/* Row 1: Active orders by module */}
        <div className="admin-stat-card cursor-pointer" onClick={() => setActiveTab('unified_orders')}>
          <div className="admin-stat-card__header">
            <span className="admin-stat-card__label">Pending Store Orders</span>
            <span className="admin-stat-card__icon text-info">
              <i className="fa-light fa-sharp fa-box-open" />
            </span>
          </div>
          <div className="admin-stat-card__value">{stats.pendingStoreOrders || 0}</div>
        </div>

        <div className="admin-stat-card cursor-pointer" onClick={() => setActiveTab('unified_orders')}>
          <div className="admin-stat-card__header">
            <span className="admin-stat-card__label">Active 3D Print Queue</span>
            <span className="admin-stat-card__icon text-success">
              <i className="fa-light fa-sharp fa-print" />
            </span>
          </div>
          <div className="admin-stat-card__value">{stats.pendingPrintOrders || 0}</div>
        </div>

        <div className="admin-stat-card cursor-pointer" onClick={() => setActiveTab('unified_orders')}>
          <div className="admin-stat-card__header">
            <span className="admin-stat-card__label">Unread Web Inquiries</span>
            <span className="admin-stat-card__icon text-warning">
              <i className="fa-light fa-sharp fa-laptop-code" />
            </span>
          </div>
          <div className="admin-stat-card__value">{stats.unreadWebInquiries || 0}</div>
        </div>

        <div className="admin-stat-card cursor-pointer" onClick={() => setActiveTab('unified_orders')}>
          <div className="admin-stat-card__header">
            <span className="admin-stat-card__label">Pending Project Orders</span>
            <span className="admin-stat-card__icon text-primary">
              <i className="fa-light fa-sharp fa-microchip" />
            </span>
          </div>
          <div className="admin-stat-card__value">{stats.pendingProjectOrders || 0}</div>
        </div>
      </div>

      {/* Grid for secondary operational indicators */}
      <div className="admin-stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="admin-stat-card cursor-pointer" onClick={() => setActiveTab('products')}>
          <div className="admin-stat-card__header">
            <span className="admin-stat-card__label">Low Stock Products</span>
            <span className="admin-stat-card__icon text-danger">
              <i className="fa-light fa-sharp fa-triangle-exclamation" />
            </span>
          </div>
          <div className="admin-stat-card__value" style={{ color: stats.lowStockProducts > 0 ? 'var(--danger)' : 'inherit' }}>
            {stats.lowStockProducts || 0}
          </div>
        </div>

        <div className="admin-stat-card cursor-pointer" onClick={() => setActiveTab('communications')}>
          <div className="admin-stat-card__header">
            <span className="admin-stat-card__label">Unresponded Tickets</span>
            <span className="admin-stat-card__icon text-warning">
              <i className="fa-light fa-sharp fa-ticket" />
            </span>
          </div>
          <div className="admin-stat-card__value" style={{ color: stats.openSupportTickets > 0 ? 'var(--warning)' : 'inherit' }}>
            {stats.openSupportTickets || 0}
          </div>
        </div>

        <div className="admin-stat-card cursor-pointer" onClick={() => setActiveTab('users')}>
          <div className="admin-stat-card__header">
            <span className="admin-stat-card__label">New Users Today</span>
            <span className="admin-stat-card__icon text-info">
              <i className="fa-light fa-sharp fa-user-plus" />
            </span>
          </div>
          <div className="admin-stat-card__value">{stats.newUsersToday || 0}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__header">
            <span className="admin-stat-card__label">Monthly Store Revenue</span>
            <span className="admin-stat-card__icon text-success">
              <i className="fa-light fa-sharp fa-money-bill-wave" />
            </span>
          </div>
          <div className="admin-stat-card__value">Rs. {Number(stats.monthlyRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Unified Recent Orders List */}
      <div className="admin-dashboard__recent">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-1)' }}>
            Ecosystem Activity Feed (Latest 10 Inquiries & Orders)
          </h3>
        </div>
        {recentOrders && recentOrders.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Order/Inquiry ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Submitted At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o, idx) => (
                  <tr key={`${o.order_type}-${o.id}-${idx}`}>
                    <td data-label="Type">
                      <span className={`badge ${getOrderBadgeClass(o.order_type)}`}>
                        {formatOrderType(o.order_type)}
                      </span>
                    </td>
                    <td data-label="ID">
                      <strong>#{o.id}</strong> {o.tracking_code && <code className="text-muted" style={{ fontSize: '11px', marginLeft: '6px' }}>({o.tracking_code})</code>}
                    </td>
                    <td data-label="Customer">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{o.customer_name || 'Anonymous'}</span>
                        <span className="text-muted" style={{ fontSize: '11px' }}>{o.customer_email}</span>
                      </div>
                    </td>
                    <td data-label="Amount">
                      {o.amount !== null && o.amount !== undefined ? `Rs. ${Number(o.amount).toFixed(2)}` : <span className="text-muted">—</span>}
                    </td>
                    <td data-label="Status">
                      <span className={`badge ${getOrderStatusBadgeClass(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td data-label="Submitted At">
                      {new Date(o.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td data-label="Action">
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => handleOrderClick(o.order_type)}
                        style={{ padding: '2px 8px', fontSize: '12px' }}
                      >
                        <i className="fa-light fa-sharp fa-arrow-right" style={{ marginRight: '4px' }} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No recent activities found.</div>
        )}
      </div>
    </div>
  );
}

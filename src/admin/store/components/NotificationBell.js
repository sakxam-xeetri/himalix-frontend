import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../auth/AuthContext';

export default function NotificationBell({ onViewAllLogs }) {
  const { authFetch } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await authFetch('/api/store/admin/notifications');
      if (res.ok) {
        const d = await res.json();
        const list = d.notifications || [];
        setNotifications(list);

        // Compute unread count based on last viewed timestamp
        const lastViewed = localStorage.getItem('hx_last_viewed_notification_time') || '1970-01-01T00:00:00.000Z';
        const unread = list.filter(n => new Date(n.created_at) > new Date(lastViewed)).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds for live notifications
    const interval = setInterval(fetchNotifications, 30000);

    // Event listener for outside click to close dropdown
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Mark read when opening
      handleMarkAllRead();
    }
  };

  const handleMarkAllRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem('hx_last_viewed_notification_time', now);
    setUnreadCount(0);
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

  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className="btn btn-ghost notification-bell__trigger" 
        aria-label="View notifications"
      >
        <i className="fa-light fa-sharp fa-bell" style={{ fontSize: '18px' }} />
        {unreadCount > 0 && (
          <span className="badge badge-danger notification-bell__badge">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown__header">
            <h4>
              Ecosystem Logs
            </h4>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead} 
                className="btn-link" 
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-dropdown__body">
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
                No recent activity logs.
              </div>
            ) : (
              notifications.map((item) => (
                <div 
                  key={item.id} 
                  className="notification-item"
                >
                  <div style={{ fontSize: '16px', marginTop: '2px' }}>
                    {getActionIcon(item.action)}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ color: 'var(--text-0)', lineHeight: '1.4' }}>{item.summary}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>
                      <span>{item.user_email || 'System'}</span>
                      <span>{formatTime(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="notification-dropdown__footer">
            <button 
              onClick={() => { setIsOpen(false); onViewAllLogs(); }}
              className="btn btn-ghost btn-sm" 
              style={{ width: '100%', fontSize: '12px' }}
            >
              See All Activity Logs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

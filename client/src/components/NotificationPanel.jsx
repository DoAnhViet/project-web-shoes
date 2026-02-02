import { useNotification } from '../context/NotificationContext';
import './NotificationPanel.css';

export default function NotificationPanel({ isOpen, onClose }) {
  const { notificationHistory, clearNotificationHistory } = useNotification();

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'vừa mới';
    if (minutes < 60) return `${minutes}p trước`;
    if (hours < 24) return `${hours}h trước`;
    if (days < 7) return `${days}d trước`;
    return timestamp.toLocaleDateString('vi-VN');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="notification-panel-overlay" onClick={onClose}></div>
      <div className="notification-panel">
        <div className="notification-panel-header">
          <h3>Thông báo</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="notification-panel-content">
          {notificationHistory.length === 0 ? (
            <div className="empty-state">
              <p>📭 Không có thông báo nào</p>
            </div>
          ) : (
            <div className="notification-list">
              {notificationHistory.map(notif => (
                <div key={notif.id} className="notification-item">
                  <div className="notification-item-icon">🔔</div>
                  <div className="notification-item-content">
                    <p className="notification-item-message">{notif.message}</p>
                    <span className="notification-item-time">
                      {formatTime(notif.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notificationHistory.length > 0 && (
          <div className="notification-panel-footer">
            <button className="clear-btn" onClick={clearNotificationHistory}>
              Xóa tất cả
            </button>
          </div>
        )}
      </div>
    </>
  );
}

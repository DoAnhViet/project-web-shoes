import { useNotification } from '../context/NotificationContext';
import './Notification.css';

export default function NotificationDisplay() {
  const { notifications } = useNotification();

  return (
    <div className="notification-container">
      {notifications.map(notif => (
        <div key={notif.id} className="notification-item">
          <span className="notification-icon">🔔</span>
          <span className="notification-message">{notif.message}</span>
        </div>
      ))}
    </div>
  );
}

import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState([]);

  const addNotification = useCallback((message, duration = 3000) => {
    const id = Date.now();
    const notification = { id, message, timestamp: new Date() };
    
    // Add to display notifications
    setNotifications(prev => [...prev, notification]);
    
    // Add to history
    setNotificationHistory(prev => [notification, ...prev].slice(0, 20)); // Keep last 20

    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, duration);

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearNotificationHistory = useCallback(() => {
    setNotificationHistory([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      notificationHistory,
      addNotification, 
      removeNotification,
      clearNotificationHistory
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

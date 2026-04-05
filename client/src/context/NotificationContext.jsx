import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext();

// Helper to get notification key per user
const getNotificationKey = (userId) => {
    return userId ? `notifications_user_${userId}` : 'notifications_guest';
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Load notification history when user changes
  const loadUserNotifications = useCallback((userId) => {
    setCurrentUserId(userId);
    try {
      const key = getNotificationKey(userId);
      const saved = localStorage.getItem(key);
      if (saved) {
        setNotificationHistory(JSON.parse(saved));
      } else {
        setNotificationHistory([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotificationHistory([]);
    }
    // Clear active notifications on user change
    setNotifications([]);
  }, []);

  // Save notification history when it changes
  useEffect(() => {
    if (currentUserId !== null) {
      const key = getNotificationKey(currentUserId);
      localStorage.setItem(key, JSON.stringify(notificationHistory));
    }
  }, [notificationHistory, currentUserId]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (!event.key) return;
      const currentKey = getNotificationKey(currentUserId);
      if (event.key === currentKey || (currentUserId === null && event.key === 'notifications_guest')) {
        try {
          const newHistory = event.newValue ? JSON.parse(event.newValue) : [];
          setNotificationHistory(newHistory);
        } catch (err) {
          console.error('Error syncing notifications from storage event:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [currentUserId]);

  const addNotification = useCallback((message, duration = 3000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, timestamp: new Date().toISOString() };
    
    // Add to display notifications
    setNotifications(prev => [...prev, notification]);
    
    // Add to history
    setNotificationHistory(prev => [notification, ...prev].slice(0, 20));

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
    if (currentUserId !== null) {
      const key = getNotificationKey(currentUserId);
      localStorage.removeItem(key);
    }
  }, [currentUserId]);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      notificationHistory,
      addNotification, 
      removeNotification,
      clearNotificationHistory,
      loadUserNotifications
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

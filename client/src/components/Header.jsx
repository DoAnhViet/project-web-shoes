import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import NotificationPanel from './NotificationPanel';
import './Header.css';

export default function Header() {
  const { getTotalItems } = useCart();
  const { notificationHistory } = useNotification();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <header className="header">
      <div className="logo">
        <Link to="/">
          <svg viewBox="0 0 24 24" width="50" height="50">
            <path fill="currentColor" d="M21 8.719L7.836 14.303C6.74 14.768 5.818 15 5.075 15c-.836 0-1.445-.295-1.819-.884-.485-.76-.273-1.982.559-3.272.494-.754 1.122-1.446 1.734-2.108-.144.234-1.415 2.349-.025 3.345.275.197.618.298 1.02.298.86 0 1.962-.378 3.277-.944L21 8.719z" />
          </svg>
        </Link>
      </div>
      <nav className="nav-menu">
        <a href="#" className="nav-item">New & Featured</a>
        <a href="#" className="nav-item">Men</a>
        <a href="#" className="nav-item">Women</a>
        <a href="#" className="nav-item">Kids</a>
        <a href="#" className="nav-item sale">Sale</a>
      </nav>
      <div className="header-actions">
        <button className="icon-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button>
        <button 
          className="icon-btn bell-icon" 
          title="Notifications"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
        >
          🔔
          {notificationHistory.length > 0 && (
            <span className="notification-badge">{notificationHistory.length}</span>
          )}
        </button>
        <NotificationPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
        <Link to="/cart" className="icon-btn cart-btn" title="Shopping Cart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="8" cy="21" r="1"></circle>
            <circle cx="19" cy="21" r="1"></circle>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
          </svg>
          {getTotalItems() > 0 && <span className="cart-badge">{getTotalItems()}</span>}
        </Link>
        <Link to="/admin" className="admin-link-btn">Admin</Link>
      </div>
    </header>
  );
}

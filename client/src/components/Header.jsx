import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from './NotificationPanel';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const { getTotalItems } = useCart();
  const { getWishlistCount } = useWishlist();
  const { notificationHistory } = useNotification();
  const { user } = useAuth();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Check if user is admin
  const isAdmin = user?.role === 'Admin';

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

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
        <Link to="/" className="nav-item">New & Featured</Link>
        <Link to="/products/men" className="nav-item">Men</Link>
        <Link to="/products/women" className="nav-item">Women</Link>
        <Link to="/products/kids" className="nav-item">Kids</Link>
        <Link to="/products/sale" className="nav-item sale">Sale</Link>
      </nav>
      <div className="header-actions">
        {/* Search */}
        <div className="search-container">
          {isSearchOpen && (
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </form>
          )}
          <button 
            className="icon-btn search-btn"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
        </div>
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
        <Link to="/wishlist" className="icon-btn wishlist-btn" title="Wishlist">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          {getWishlistCount() > 0 && <span className="wishlist-badge">{getWishlistCount()}</span>}
        </Link>
        {user && (
          <Link to="/orders" className="icon-btn orders-btn" title="My Orders">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
          </Link>
        )}
        <Link to="/cart" className="icon-btn cart-btn" title="Shopping Cart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="8" cy="21" r="1"></circle>
            <circle cx="19" cy="21" r="1"></circle>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
          </svg>
          {getTotalItems() > 0 && <span className="cart-badge">{getTotalItems()}</span>}
        </Link>
        {isAdmin && <Link to="/admin" className="admin-link-btn">Admin</Link>}
      </div>
    </header>
  );
}

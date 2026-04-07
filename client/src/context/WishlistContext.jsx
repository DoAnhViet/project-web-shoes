import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const WishlistContext = createContext();

// Helper to get wishlist key per user
const getWishlistKey = (userId) => {
  return userId ? `wishlist_user_${userId}` : 'wishlist_guest';
};

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addNotification } = useNotification();
  const { user } = useAuth();

  // Load wishlist from localStorage when user changes
  useEffect(() => {
    try {
      const wishlistKey = getWishlistKey(user?.id);
      const savedWishlist = localStorage.getItem(wishlistKey);
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      } else {
        setWishlist([]);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      setWishlist([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      const wishlistKey = getWishlistKey(user?.id);
      localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
    }
  }, [wishlist, isLoading, user?.id]);

  // Add product to wishlist
  const addToWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        addNotification(`ℹ️ "${product.name}" đã có trong danh sách yêu thích`, 2000);
        return prev;
      }
      addNotification(`❤️ Đã thêm "${product.name}" vào yêu thích`, 3000);
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        brand: product.brand,
        addedAt: new Date().toISOString()
      }];
    });
  };

  // Remove from wishlist
  const removeFromWishlist = (productId) => {
    setWishlist(prev => {
      const product = prev.find(item => item.id === productId);
      if (product) {
        addNotification(`💔 Đã xóa "${product.name}" khỏi yêu thích`, 2000);
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  // Toggle wishlist
  const toggleWishlist = (product) => {
    const exists = wishlist.some(item => item.id === product.id);
    if (exists) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  // Clear wishlist
  const clearWishlist = () => {
    setWishlist([]);
    addNotification('🗑️ Đã xóa tất cả sản phẩm yêu thích', 2000);
  };

  // Get wishlist count
  const getWishlistCount = () => {
    return wishlist.length;
  };

  const value = {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    getWishlistCount
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}

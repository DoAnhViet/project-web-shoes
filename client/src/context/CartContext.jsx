import { createContext, useContext, useState, useEffect } from 'react';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthContext';

const CartContext = createContext();

// Helper to get cart key per user
const getCartKey = (userId) => {
    return userId ? `cart_user_${userId}` : 'cart_guest';
};

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addNotification } = useNotification();
    const { user } = useAuth();

    // Load cart from localStorage when user changes and enrich with latest product data
    useEffect(() => {
        const loadCartWithProductData = async () => {
            try {
                const cartKey = getCartKey(user?.id);
                const savedCart = localStorage.getItem(cartKey);
                if (savedCart) {
                    const cartItems = JSON.parse(savedCart);
                    
                    // Fetch latest product data to ensure bulkDiscountRules is present
                    const enrichedCart = await Promise.all(
                        cartItems.map(async (item) => {
                            if (!item.bulkDiscountRules) {
                                try {
                                    const response = await fetch(`http://localhost:5240/api/products/${item.id}`);
                                    if (response.ok) {
                                        const product = await response.json();
                                        return {
                                            ...item,
                                            bulkDiscountRules: product.bulkDiscountRules
                                        };
                                    }
                                } catch {
                                    console.log('Could not fetch product data for:', item.id);
                                }
                            }
                            return item;
                        })
                    );
                    
                    setCart(enrichedCart);
                } else {
                    setCart([]);
                }
            } catch (error) {
                console.error('Error loading cart:', error);
                setCart([]);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadCartWithProductData();
    }, [user?.id]);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (!isLoading) {
            const cartKey = getCartKey(user?.id);
            localStorage.setItem(cartKey, JSON.stringify(cart));
        }
    }, [cart, isLoading, user?.id]);

    // Add product to cart
    const addToCart = (product, quantity = 1) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(
                item => item.id === product.id &&
                    item.size === product.size &&
                    item.color === product.color
            );

            let newCart;
            if (existingItem) {
                // Update quantity if item already exists
                newCart = prevCart.map(item =>
                    item.id === product.id &&
                        item.size === product.size &&
                        item.color === product.color
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                // Add new item
                newCart = [
                    ...prevCart,
                    {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        imageUrl: product.imageUrl,
                        brand: product.brand,
                        size: product.size,
                        color: product.color,
                        quantity,
                        stock: product.stock,
                        bulkDiscountRules: product.bulkDiscountRules
                    }
                ];
            }

            // Show notification
            addNotification(`✅ Đã thêm "${product.name}" vào giỏ hàng`, 3000);

            return newCart;
        });
    };

    // Remove item from cart
    const removeFromCart = (id, size, color) => {
        setCart(prevCart =>
            prevCart.filter(
                item => !(item.id === id && item.size === size && item.color === color)
            )
        );
    };

    // Update item quantity
    const updateQuantity = (id, size, color, quantity) => {
        if (quantity <= 0) {
            removeFromCart(id, size, color);
            return;
        }

        setCart(prevCart =>
            prevCart.map(item =>
                item.id === id && item.size === size && item.color === color
                    ? { ...item, quantity: Math.min(quantity, item.stock) }
                    : item
            )
        );
    };

    // Clear entire cart
    const clearCart = () => {
        setCart([]);
        
        // Clear from localStorage for current user
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser?.id) {
            const cartKey = `cart_user_${currentUser.id}`;
            localStorage.removeItem(cartKey);
        }
        
        // Add notification
        try {
            const notificationContext = window.notificationContext;
            if (notificationContext) {
                notificationContext.addNotification('🧹 Giỏ hàng đã được làm mới', 2000);
            }
        } catch {
            console.log('Cart cleared successfully');
        }
    };

    // Get total price
    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    // Get total items count
    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    // Get total items (without quantity)
    const getCartItemsCount = () => {
        return cart.length;
    };

    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
        getCartItemsCount
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
}

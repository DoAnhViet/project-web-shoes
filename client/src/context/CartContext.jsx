import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load cart from localStorage on mount
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                setCart(JSON.parse(savedCart));
            }
        } catch (error) {
            console.error('Error loading cart:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (!isLoading) {
            localStorage.setItem('cart', JSON.stringify(cart));
        }
    }, [cart, isLoading]);

    // Add product to cart
    const addToCart = (product, quantity = 1) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(
                item => item.id === product.id &&
                    item.size === product.size &&
                    item.color === product.color
            );

            if (existingItem) {
                // Update quantity if item already exists
                return prevCart.map(item =>
                    item.id === product.id &&
                        item.size === product.size &&
                        item.color === product.color
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                // Add new item
                return [
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
                        stock: product.stock
                    }
                ];
            }
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

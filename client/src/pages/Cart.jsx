import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../api/api';
import './Cart.css';

function Cart() {
    const navigate = useNavigate();
    const { cart, removeFromCart, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart();
    const { user } = useAuth();
    const [showCheckout, setShowCheckout] = useState(false);
    const [orderCreated, setOrderCreated] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        paymentMethod: 'cod'
    });

    const [paymentDetails, setPaymentDetails] = useState({
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: ''
    });

    const [paymentError, setPaymentError] = useState('');

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // Calculate bulk discount for an item
    const calculateBulkDiscount = (item) => {
        if (!item.bulkDiscountRules) return 0;
        
        try {
            const rules = JSON.parse(item.bulkDiscountRules);
            // Find the highest applicable discount
            const applicableRule = rules
                .filter(rule => item.quantity >= rule.minQty)
                .sort((a, b) => b.discount - a.discount)[0];
            
            if (applicableRule) {
                return (item.price * item.quantity * applicableRule.discount) / 100;
            }
        } catch (e) {
            console.error('Error parsing bulk discount rules:', e);
        }
        return 0;
    };

    // Calculate total with bulk discounts
    const getTotalWithBulkDiscount = () => {
        let total = 0;
        let totalDiscount = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            const discount = calculateBulkDiscount(item);
            total += itemTotal;
            totalDiscount += discount;
        });
        
        return { total, discount: totalDiscount, finalTotal: total - totalDiscount };
    };

    const priceBreakdown = getTotalWithBulkDiscount();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        setPaymentError('');

        if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
            alert('Vui lòng điền đầy đủ thông tin');
            return;
        }

        // Validate payment method
        if (!formData.paymentMethod) {
            setPaymentError('Vui lòng chọn phương thức thanh toán');
            return;
        }

        // Create order via API
        const orderId = 'ORD' + Date.now().toString(36).toUpperCase();

        // Prepare API order data
        const apiOrderData = {
            userId: user?.id || null,
            fullName: formData.fullName,
            email: formData.email || user?.email || '',
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            district: '',
            ward: '',
            note: '',
            paymentMethod: formData.paymentMethod,
            discount: priceBreakdown.discount,
            items: cart.map(item => ({
                productId: item.id,
                productName: item.name,
                productImage: item.imageUrl || item.image || '',
                size: item.size || '',
                color: item.color || '',
                price: item.price,
                quantity: item.quantity
            }))
        };

        try {
            console.log('📦 Creating order via API:', apiOrderData);
            const response = await ordersApi.create(apiOrderData);
            const createdOrder = response.data;
                console.log('✅ Order created successfully:', createdOrder);

                // Save to localStorage for order history
                const localOrder = {
                    orderId: createdOrder.orderCode || orderId,
                    id: createdOrder.id,
                    orderCode: createdOrder.orderCode,
                    orderDate: new Date().toISOString(),
                    shippingInfo: formData,
                    items: cart,
                    total: createdOrder.total,
                    status: 'pending',
                    paymentMethod: formData.paymentMethod,
                    paymentStatus: formData.paymentMethod === 'cod' ? 'pending' : 'completed'
                };

                const orders = JSON.parse(localStorage.getItem('orders') || '[]');
                orders.unshift(localOrder);
                localStorage.setItem('orders', JSON.stringify(orders));

                setOrderCreated(localOrder);
                clearCart();
        } catch (error) {
            console.error('❌ Network error:', error);
            setPaymentError('Không thể tạo đơn hàng: ' + (error.response?.data?.message || error.message));
        }
    };

    // If the cart becomes empty while on the checkout form, hide checkout
    useEffect(() => {
        if (cart.length === 0 && showCheckout) {
            // Use setTimeout to avoid synchronous setState in effect
            setTimeout(() => setShowCheckout(false), 0);
        }
    }, [cart.length, showCheckout]);

    if (cart.length === 0 && !showCheckout) {
        return (
            <div className="cart-container">
                <div className="cart-empty">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <h2>Giỏ hàng trống</h2>
                    <p>Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                    <Link to="/" className="continue-shopping-btn">
                        Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
        );
    }

    if (orderCreated) {
        return (
            <div className="cart-container">
                <div className="order-success">
                    <div className="success-icon">✓</div>
                    <h2>Đặt hàng thành công!</h2>
                    <p className="order-id">Mã đơn hàng: <strong>#{orderCreated.orderCode || orderCreated.orderId}</strong></p>
                    <p className="order-time">{new Date(orderCreated.orderDate).toLocaleString('vi-VN')}</p>

                    <div className="order-summary-info">
                        <div className="info-group">
                            <h4>Giao tới:</h4>
                            <p>{orderCreated.shippingInfo?.fullName}</p>
                            <p>{orderCreated.shippingInfo?.address}</p>
                            {orderCreated.shippingInfo?.city && <p>{orderCreated.shippingInfo.city}</p>}
                            <p>{orderCreated.shippingInfo?.phone}</p>
                        </div>
                        <div className="info-group">
                            <h4>Tóm tắt đơn hàng:</h4>
                            <p>{orderCreated.items?.length || 0} sản phẩm</p>
                            <p className="total-price">{formatPrice(orderCreated.total || 0)}</p>
                        </div>
                    </div>

                    <div className="success-actions">
                        <button
                            className="view-orders-btn"
                            onClick={() => navigate('/orders')}
                        >
                            Xem lịch sử đơn hàng
                        </button>
                        <button
                            className="continue-shopping-btn"
                            onClick={() => navigate('/')}
                        >
                            Tiếp tục mua sắm
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-container">
            <header className="page-header">
                <div className="page-header-top">
                    <Link to="/" className="btn-back">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Quay lại
                    </Link>
                </div>
                <h1>🛒 Giỏ hàng</h1>
                <p className="page-subtitle">({getTotalItems()} sản phẩm)</p>
            </header>

            <div className="cart-content">
                <div className="cart-items-section">
                    <div className="cart-items">
                        {cart.map((item, index) => (
                            <div key={index} className="cart-item">
                                <div className="item-image">
                                    <img src={item.imageUrl} alt={item.name} />
                                </div>
                                <div className="item-details">
                                    <h3>{item.name}</h3>
                                    <p className="item-brand">{item.brand}</p>
                                    <div className="item-variants">
                                        <span className="variant">Size: {item.size}</span>
                                        <span className="variant" style={{ backgroundColor: item.color === 'Đen' ? '#000' : item.color === 'Trắng' ? '#f5f5f5' : item.color }}>
                                            {item.color}
                                        </span>
                                    </div>
                                    {/* Show sale price and original price */}
                                    <div className="item-price-wrapper">
                                        <p className="item-price">{formatPrice(item.price)}</p>
                                        {item.discountPercent > 0 && item.originalPrice && (
                                            <p className="item-original-price" style={{textDecoration: 'line-through', color: '#999', fontSize: '0.85em'}}>
                                                {formatPrice(item.originalPrice)}
                                            </p>
                                        )}
                                        {item.discountPercent > 0 && (
                                            <span className="item-discount-badge" style={{background: '#ff4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75em'}}>
                                                -{item.discountPercent}%
                                            </span>
                                        )}
                                    </div>
                                    {/* Show bulk discount if applicable */}
                                    {calculateBulkDiscount(item) > 0 && (
                                        <div className="bulk-discount-badge">
                                            🎁 Giảm {formatPrice(calculateBulkDiscount(item))}
                                        </div>
                                    )}
                                </div>
                                <div className="item-quantity">
                                    <button
                                        className="qty-btn"
                                        onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max={item.stock}
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.id, item.size, item.color, parseInt(e.target.value) || 1)}
                                        className="qty-input"
                                    />
                                    <button
                                        className="qty-btn"
                                        onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                                        disabled={item.quantity >= item.stock}
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="item-total">
                                    {formatPrice(item.price * item.quantity)}
                                </div>
                                <button
                                    className="item-remove"
                                    onClick={() => removeFromCart(item.id, item.size, item.color)}
                                    title="Xóa khỏi giỏ hàng"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18"></path>
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Checkout Form */}
                    {showCheckout && (
                        <div className="checkout-section">
                            <h2>Thông tin giao hàng</h2>
                            <form onSubmit={handleCheckout} className="checkout-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Họ và tên *</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            placeholder="Nguyễn Văn A"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="email@example.com"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Số điện thoại *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="0123456789"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Thành phố/Tỉnh</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            placeholder="TP. Hồ Chí Minh"
                                        />
                                    </div>
                                </div>
                                <div className="form-group full">
                                    <label>Địa chỉ giao hàng *</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Số nhà, tên đường..."
                                        rows="3"
                                        required
                                    ></textarea>
                                </div>
                                <div className="form-group">
                                    <label>Mã bưu chính</label>
                                    <input
                                        type="text"
                                        name="postalCode"
                                        value={formData.postalCode}
                                        onChange={handleInputChange}
                                        placeholder="700000"
                                    />
                                </div>

                                {/* Payment Method Selection */}
                                <div className="form-group full payment-method-section">
                                    <label>Phương thức thanh toán *</label>
                                    <div className="payment-options">
                                        <label className="payment-option">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cod"
                                                checked={formData.paymentMethod === 'cod'}
                                                onChange={(e) => {
                                                    setFormData(prev => ({ ...prev, paymentMethod: e.target.value }));
                                                    setPaymentError('');
                                                }}
                                            />
                                            <span className="payment-label">
                                                <strong>💵 Thanh toán khi nhận hàng (COD)</strong>
                                                <small>Thanh toán trực tiếp cho nhân viên giao hàng</small>
                                            </span>
                                        </label>

                                        <label className="payment-option">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="banking"
                                                checked={formData.paymentMethod === 'banking'}
                                                onChange={(e) => {
                                                    setFormData(prev => ({ ...prev, paymentMethod: e.target.value }));
                                                    setPaymentError('');
                                                }}
                                            />
                                            <span className="payment-label">
                                                <strong>🏦 Chuyển khoản QR Banking</strong>
                                                <small>DO ANH VIET - 1907 3349 9870 13 - TECHCOMBANK</small>
                                            </span>
                                        </label>
                                    </div>
                                    
                                    {/* QR Banking Info */}
                                    {formData.paymentMethod === 'banking' && (
                                        <div className="bank-qr-section" style={{textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '12px', marginTop: '15px'}}>
                                            <img 
                                                src="/qr-banking.png" 
                                                alt="QR Banking" 
                                                style={{width: '200px', height: 'auto', marginBottom: '15px', borderRadius: '8px'}}
                                            />
                                            <div style={{textAlign: 'left', padding: '15px', background: '#fff', borderRadius: '8px'}}>
                                                <p><strong>🏦 Ngân hàng:</strong> TECHCOMBANK</p>
                                                <p><strong>👤 Chủ TK:</strong> DO ANH VIET</p>
                                                <p><strong>💳 Số TK:</strong> 1907 3349 9870 13</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {paymentError && (
                                    <div className="payment-error-box">
                                        {paymentError}
                                    </div>
                                )}

                                <div className="checkout-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setShowCheckout(false)}>
                                        Quay lại
                                    </button>
                                    <button type="submit" className="order-btn">
                                        Đặt hàng ({getTotalItems()} sản phẩm)
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Cart Summary */}
                <aside className="cart-summary">
                    <div className="summary-card">
                        <h3>Tổng tiền</h3>

                        <div className="summary-row">
                            <span>Tạm tính:</span>
                            <span>{formatPrice(priceBreakdown.total)}</span>
                        </div>

                        {priceBreakdown.discount > 0 && (
                            <div className="summary-row discount-row">
                                <span>🎁 Giảm giá số lượng:</span>
                                <span className="discount-value">-{formatPrice(priceBreakdown.discount)}</span>
                            </div>
                        )}

                        <div className="summary-row">
                            <span>Phí vận chuyển:</span>
                            <span>Miễn phí</span>
                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-total">
                            <span>Thành tiền:</span>
                            <span className="total-price">{formatPrice(priceBreakdown.finalTotal)}</span>
                        </div>

                        {!showCheckout && (
                            <button
                                className="checkout-btn"
                                onClick={() => setShowCheckout(true)}
                            >
                                Tiếp tục thanh toán
                            </button>
                        )}

                        {showCheckout && (
                            <button
                                className="checkout-btn active"
                                disabled
                            >
                                Đang nhập thông tin...
                            </button>
                        )}

                        <button
                            className="continue-btn"
                            onClick={() => window.location.href = '/'}
                        >
                            Tiếp tục mua sắm
                        </button>

                        <button
                            className="clear-btn"
                            onClick={() => {
                                if (window.confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
                                    clearCart();
                                    // if user was on checkout form, hide it and return to empty cart view
                                    setShowCheckout(false);
                                }
                            }}
                        >
                            Xóa toàn bộ giỏ hàng
                        </button>
                    </div>

                    {/* Order Summary */}
                    <div className="summary-card items-summary">
                        <h3>Chi tiết đơn hàng</h3>
                        <div className="items-list">
                            {cart.map((item, index) => (
                                <div key={index} className="summary-item">
                                    <span>{item.name} (x{item.quantity})</span>
                                    <span>{formatPrice(item.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default Cart;


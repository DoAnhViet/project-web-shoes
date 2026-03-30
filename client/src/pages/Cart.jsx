import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

function Cart() {
    const navigate = useNavigate();
    const { cart, removeFromCart, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart();
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

        // Validate online payment details
        if (formData.paymentMethod === 'card') {
            if (!paymentDetails.cardNumber || !paymentDetails.cardName || !paymentDetails.expiryDate || !paymentDetails.cvv) {
                setPaymentError('Vui lòng điền đầy đủ thông tin thẻ');
                return;
            }

            // Validate card number (basic validation)
            if (paymentDetails.cardNumber.replace(/\s/g, '').length !== 16) {
                setPaymentError('Số thẻ phải có 16 chữ số');
                return;
            }

            // Validate CVV
            if (paymentDetails.cvv.length !== 3) {
                setPaymentError('CVV phải có 3 chữ số');
                return;
            }

            // Validate expiry date format
            if (!/^\d{2}\/\d{2}$/.test(paymentDetails.expiryDate)) {
                setPaymentError('Ngày hết hạn phải có định dạng MM/YY');
                return;
            }
        } else if (formData.paymentMethod === 'bank') {
            // For bank transfer, just show notification
            alert('Bạn sẽ nhận được thông tin chuyển khoản sau khi đặt hàng');
        } else if (formData.paymentMethod === 'ewallet') {
            // For e-wallet, redirect to payment gateway
            alert('Bạn sẽ được chuyển hướng đến trang thanh toán');
        }

        // Create order
        const order = {
            id: Math.random().toString(36).substr(2, 9),
            customerInfo: formData,
            items: cart,
            totalPrice: getTotalPrice(),
            totalItems: getTotalItems(),
            date: new Date().toLocaleString('vi-VN'),
            status: 'pending',
            paymentMethod: formData.paymentMethod,
            paymentStatus: formData.paymentMethod === 'cod' ? 'pending' : 'completed'
        };

        // Save order to localStorage
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));

        setOrderCreated(order);
        clearCart();
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
                    <p className="order-id">Mã đơn hàng: <strong>#{orderCreated.id}</strong></p>
                    <p className="order-time">{orderCreated.date}</p>

                    <div className="order-summary-info">
                        <div className="info-group">
                            <h4>Giao tới:</h4>
                            <p>{orderCreated.customerInfo.fullName}</p>
                            <p>{orderCreated.customerInfo.address}</p>
                            {orderCreated.customerInfo.city && <p>{orderCreated.customerInfo.city}</p>}
                            <p>{orderCreated.customerInfo.phone}</p>
                        </div>
                        <div className="info-group">
                            <h4>Tóm tắt đơn hàng:</h4>
                            <p>{orderCreated.totalItems} sản phẩm</p>
                            <p className="total-price">{formatPrice(orderCreated.totalPrice)}</p>
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
                                    <p className="item-price">{formatPrice(item.price)}</p>
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
                                                value="bank"
                                                checked={formData.paymentMethod === 'bank'}
                                                onChange={(e) => {
                                                    setFormData(prev => ({ ...prev, paymentMethod: e.target.value }));
                                                    setPaymentError('');
                                                }}
                                            />
                                            <span className="payment-label">
                                                <strong>🏦 Chuyển khoản ngân hàng</strong>
                                                <small>Bạn sẽ nhận thông tin chuyển khoản</small>
                                            </span>
                                        </label>

                                        <label className="payment-option">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="card"
                                                checked={formData.paymentMethod === 'card'}
                                                onChange={(e) => {
                                                    setFormData(prev => ({ ...prev, paymentMethod: e.target.value }));
                                                    setPaymentError('');
                                                }}
                                            />
                                            <span className="payment-label">
                                                <strong>💳 Thẻ tín dụng/Ghi nợ</strong>
                                                <small>Visa, Mastercard, v.v...</small>
                                            </span>
                                        </label>

                                        <label className="payment-option">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="ewallet"
                                                checked={formData.paymentMethod === 'ewallet'}
                                                onChange={(e) => {
                                                    setFormData(prev => ({ ...prev, paymentMethod: e.target.value }));
                                                    setPaymentError('');
                                                }}
                                            />
                                            <span className="payment-label">
                                                <strong>📱 Ví điện tử</strong>
                                                <small>Momo, ZaloPay, v.v...</small>
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Card Payment Form */}
                                {formData.paymentMethod === 'card' && (
                                    <div className="card-payment-section">
                                        <h4>Thông tin thẻ thanh toán</h4>

                                        <div className="form-group full">
                                            <label>Số thẻ *</label>
                                            <input
                                                type="text"
                                                placeholder="1234 5678 9012 3456"
                                                value={paymentDetails.cardNumber}
                                                onChange={(e) => {
                                                    let value = e.target.value.replace(/\D/g, '');
                                                    if (value.length > 16) value = value.slice(0, 16);
                                                    const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
                                                    setPaymentDetails(prev => ({ ...prev, cardNumber: formatted }));
                                                }}
                                                maxLength="19"
                                            />
                                        </div>

                                        <div className="form-group full">
                                            <label>Tên chủ thẻ *</label>
                                            <input
                                                type="text"
                                                placeholder="NGUYEN VAN A"
                                                value={paymentDetails.cardName}
                                                onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardName: e.target.value.toUpperCase() }))}
                                            />
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Ngày hết hạn *</label>
                                                <input
                                                    type="text"
                                                    placeholder="MM/YY"
                                                    value={paymentDetails.expiryDate}
                                                    onChange={(e) => {
                                                        let value = e.target.value.replace(/\D/g, '');
                                                        if (value.length >= 2) {
                                                            value = value.slice(0, 2) + '/' + value.slice(2, 4);
                                                        }
                                                        setPaymentDetails(prev => ({ ...prev, expiryDate: value }));
                                                    }}
                                                    maxLength="5"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>CVV *</label>
                                                <input
                                                    type="text"
                                                    placeholder="123"
                                                    value={paymentDetails.cvv}
                                                    onChange={(e) => {
                                                        let value = e.target.value.replace(/\D/g, '');
                                                        if (value.length > 3) value = value.slice(0, 3);
                                                        setPaymentDetails(prev => ({ ...prev, cvv: value }));
                                                    }}
                                                    maxLength="3"
                                                />
                                            </div>
                                        </div>

                                        <div className="card-warning">
                                            ⚠️ Thông tin thẻ của bạn được mã hóa và bảo mật 100%
                                        </div>
                                    </div>
                                )}

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


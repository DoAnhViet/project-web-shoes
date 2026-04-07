import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ordersApi } from '../api/api';
import './Orders.css';

function Orders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const { addNotification } = useNotification();

    const normalizeOrder = (order) => ({
        id: order.id || order.orderId,
        orderId: order.id || order.orderId,
        orderCode: order.orderCode || order.code || `#${order.id || order.orderId}`,
        status: order.status || 'pending',
        paymentMethod: order.paymentMethod || 'cod',
        paymentStatus: order.paymentStatus || 'pending',
        subtotal: Number(order.subtotal || order.total || 0),
        shipping: Number(order.shipping || order.shippingFee || 0),
        shippingFee: Number(order.shippingFee || order.shipping || 0),
        discount: Number(order.discount || 0),
        total: Number(order.total || 0),
        createdAt: order.createdAt || order.orderDate || order.date,
        email: order.email || order.customerEmail,
        fullName: order.fullName || order.customerName || order.customerInfo?.fullName,
        phone: order.phone || order.customerPhone || order.customerInfo?.phone,
        address: order.address || order.shippingInfo?.address || order.customerInfo?.address,
        city: order.city || order.shippingInfo?.city,
        district: order.district || order.shippingInfo?.district,
        ward: order.ward || order.shippingInfo?.ward,
        note: order.note || order.shippingInfo?.note,
        items: Array.isArray(order.items)
            ? order.items.map(item => ({
                productId: item.productId || item.id,
                name: item.productName || item.name,
                image: item.productImage || item.imageUrl || item.image,
                size: item.size,
                color: item.color,
                price: Number(item.price || 0),
                quantity: Number(item.quantity || item.qty || 0),
                lineTotal: Number(item.lineTotal || item.price * item.quantity || 0)
              }))
            : []
    });

    const getStoredOrders = () => {
        try {
            const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            const filteredOrders = savedOrders.filter(order => {
                if (!user) return false;
                return String(order.userId) === String(user.id)
                    || String(order.email) === String(user.email)
                    || String(order.orderUserId) === String(user.id);
            });

            return [...filteredOrders]
                .map(normalizeOrder)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Error loading orders from localStorage:', error);
            return [];
        }
    };

    const loadStoredOrders = () => {
        setOrders(getStoredOrders());
    };

    const loadOrdersFromApi = async () => {
        if (!user?.id) {
            loadStoredOrders();
            setLoading(false);
            return;
        }

        try {
            setLoadError(null);
            setLoading(true);
            const response = await ordersApi.getByUser(user.id);
            const apiOrders = response.data?.items || [];

            if (apiOrders.length === 0) {
                const localOrders = getStoredOrders();
                if (localOrders.length > 0) {
                    setOrders(localOrders);
                    setLoading(false);
                    return;
                }
            }

            setOrders(apiOrders.map(normalizeOrder));
        } catch (error) {
            console.error('Error loading orders from API:', error);
            setLoadError('Không thể tải đơn hàng từ server. Hiển thị dữ liệu cục bộ.');
            loadStoredOrders();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrdersFromApi();

        const handleStorage = (event) => {
            if (event.key === 'orders' || event.key === 'lastOrderSync') {
                loadOrdersFromApi();
            }
        };

        const handleFocus = () => {
            loadOrdersFromApi();
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('focus', handleFocus);
        };
    }, [user]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
            return;
        }

        let hasApiError = false;
        try {
            // Try to cancel via API first
            await ordersApi.cancel(orderId);
        } catch (error) {
            console.error('API cancel failed, updating locally:', error);
            hasApiError = true;
        }

        // Update local storage
        const updatedOrders = orders.map(order => {
            const currentOrderId = order.orderId || order.id;
            if (currentOrderId === orderId) {
                return { ...order, status: 'cancelled' };
            }
            return order;
        });
        setOrders(updatedOrders);
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        localStorage.setItem('lastOrderSync', Date.now().toString());
        
        if (!hasApiError) {
            addNotification('✅ Đơn hàng đã được hủy thành công', 3000);
        } else {
            addNotification('✅ Đơn hàng đã được hủy (chỉ cục bộ)', 3000);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'pending': { label: 'Chờ xác nhận', color: '#f59e0b', icon: '⏳' },
            'confirmed': { label: 'Đã xác nhận', color: '#3b82f6', icon: '✓' },
            'shipping': { label: 'Đang giao', color: '#8b5cf6', icon: '🚚' },
            'delivered': { label: 'Đã giao', color: '#10b981', icon: '✅' },
            'cancelled': { label: 'Đã hủy', color: '#ef4444', icon: '✕' }
        };
        const statusInfo = statusMap[status] || { label: status, color: '#6b7280', icon: '•' };
        return statusInfo;
    };

    const getPaymentMethodLabel = (method) => {
        const methodMap = {
            'cod': '💵 COD',
            'bank': '🏦 Chuyển khoản',
            'card': '💳 Thẻ tín dụng',
            'momo': '📱 MoMo',
            'ewallet': '📱 Ví điện tử'
        };
        return methodMap[method] || method;
    };

    const getPaymentStatusBadge = (status) => {
        const statusMap = {
            'pending': { label: 'Chưa thanh toán', color: '#f59e0b' },
            'completed': { label: 'Đã thanh toán', color: '#10b981' }
        };
        return statusMap[status] || { label: status, color: '#6b7280' };
    };

    if (loading) {
        return (
            <div className="orders-container">
                <div className="orders-empty">
                    <h2>Đang tải đơn hàng...</h2>
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="orders-container">
                <div className="orders-empty">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 2H3v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-6"></path>
                        <path d="M9 8h6M9 12h6M9 16h6"></path>
                    </svg>
                    <h2>Chưa có đơn hàng nào</h2>
                    <p>Hãy mua sắm ngay để tạo đơn hàng đầu tiên!</p>
                    <Link to="/" className="continue-shopping-btn">
                        Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="orders-container">
            <header className="page-header">
                <div className="page-header-top">
                    <Link to="/" className="btn-back">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Quay lại
                    </Link>
                </div>
                <h1>📋 Lịch sử đơn hàng</h1>
                <p className="page-subtitle">({orders.length} đơn hàng)</p>
                {loadError && <div className="orders-error">{loadError}</div>}
            </header>

            <div className="orders-list">
                {orders.map((order) => {
                    const statusInfo = getStatusBadge(order.status);
                    const orderId = order.id;
                    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '';
                    const customerInfo = {
                        fullName: order.fullName,
                        address: order.address,
                        phone: order.phone,
                        ward: order.ward,
                        district: order.district,
                        city: order.city,
                    };
                    const items = order.items || [];
                    const total = order.total || 0;
                    const subtotal = order.subtotal || total;
                    const shipping = order.shippingFee || 0;
                    
                    return (
                        <div key={orderId} className="order-card">
                            <div className="order-header">
                                <div className="order-info">
                                    <h3>Đơn hàng {order.orderCode || `#${orderId}`}</h3>
                                    <p className="order-date">{orderDate}</p>
                                </div>
                                <div className="order-meta">
                                    <span
                                        className="order-status"
                                        style={{ backgroundColor: statusInfo.color }}
                                    >
                                        {statusInfo.icon} {statusInfo.label}
                                    </span>
                                    <span className="order-total">{formatPrice(total)}</span>
                                </div>
                            </div>

                            <div className="order-customer">
                                <h4>Thông tin giao hàng</h4>
                                <p><strong>{customerInfo.fullName}</strong></p>
                                <p>{customerInfo.address}</p>
                                {(customerInfo.city || customerInfo.district) && (
                                    <p>{customerInfo.ward}, {customerInfo.district}, {customerInfo.city}</p>
                                )}
                                <p>Điện thoại: {customerInfo.phone}</p>
                            </div>

                            <div className="order-payment-info">
                                <h4>Thông tin thanh toán</h4>
                                <div className="payment-details">
                                    <div className="payment-row">
                                        <span className="label">Phương thức:</span>
                                        <span className="value">{getPaymentMethodLabel(order.paymentMethod)}</span>
                                    </div>
                                    <div className="payment-row">
                                        <span className="label">Trạng thái:</span>
                                        <span
                                            className="value payment-status"
                                            style={{ backgroundColor: getPaymentStatusBadge(order.paymentStatus).color }}
                                        >
                                            {getPaymentStatusBadge(order.paymentStatus).label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="order-items">
                                <h4>Sản phẩm ({items.length})</h4>
                                <div className="items-list">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="order-item">
                                            <img src={item.imageUrl || item.image} alt={item.name} />
                                            <div className="item-info">
                                                <p className="item-name">{item.name}</p>
                                                <p className="item-variant">
                                                    {item.brand && `${item.brand} - `}
                                                    {item.size && `Size: ${item.size}`}
                                                    {item.color && ` - ${item.color}`}
                                                </p>
                                                <p className="item-qty">Số lượng: {item.quantity}</p>
                                            </div>
                                            <div className="item-price">
                                                <p>{formatPrice(item.price)}</p>
                                                <p className="item-total">{formatPrice(item.price * item.quantity)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="order-summary">
                                <div className="summary-row">
                                    <span>Tạm tính:</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Phí vận chuyển:</span>
                                    <span>{shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}</span>
                                </div>
                                <div className="summary-divider"></div>
                                <div className="summary-total">
                                    <span>Thành tiền:</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                            </div>

                            <div className="order-actions">
                                <Link to={`/order/${orderId}`} className="btn-view-detail">
                                    Xem chi tiết →
                                </Link>
                                {order.status === 'pending' && (
                                    <button 
                                        className="btn-cancel-order"
                                        onClick={() => handleCancelOrder(orderId)}
                                    >
                                        🚫 Hủy đơn hàng
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Link to="/" className="continue-shopping">
                Tiếp tục mua sắm
            </Link>
        </div>
    );
}

export default Orders;

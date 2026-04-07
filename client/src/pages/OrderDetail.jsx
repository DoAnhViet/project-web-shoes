import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { ordersApi } from '../api/api';
import './OrderDetail.css';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  useEffect(() => {
    // Load order from API first, then fallback to localStorage
    const loadOrder = async () => {
      setLoading(true);
      try {
        // Try API first - by code
        const response = await ordersApi.getByCode(orderId);
        if (response.data) {
          // Transform API response to match our UI format
          const apiOrder = response.data;
          setOrder({
            orderId: apiOrder.orderCode || apiOrder.id,
            id: apiOrder.id,
            orderCode: apiOrder.orderCode,
            orderDate: apiOrder.createdAt,
            shippingInfo: {
              fullName: apiOrder.fullName,
              phone: apiOrder.phone,
              email: apiOrder.email,
              address: apiOrder.address,
              city: apiOrder.city || '',
              district: apiOrder.district || '',
              ward: apiOrder.ward || '',
              note: apiOrder.note || '',
            },
            items: (apiOrder.items || []).map(item => ({
              id: item.productId,
              name: item.productName,
              imageUrl: item.productImage,
              image: item.productImage,
              size: item.size,
              color: item.color,
              price: item.price,
              quantity: item.quantity
            })),
            subtotal: apiOrder.subtotal,
            shippingFee: apiOrder.shippingFee,
            shipping: apiOrder.shippingFee,
            discount: apiOrder.discount,
            total: apiOrder.total,
            status: apiOrder.status?.toLowerCase() || 'pending',
            paymentMethod: apiOrder.paymentMethod?.toLowerCase() || 'cod',
            paymentStatus: apiOrder.paymentStatus || 'pending'
          });
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.log('API fetch failed, trying localStorage:', apiError);
      }

      // Fallback to localStorage
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const found = orders.find(o => o.orderId === orderId || o.orderCode === orderId);
      setOrder(found || null);
      setLoading(false);
    };
    loadOrder();

    // Poll for status updates every 10 seconds
    const interval = setInterval(async () => {
      try {
        const response = await ordersApi.getByCode(orderId);
        if (response.data) {
          const apiOrder = response.data;
          setOrder(prev => {
            if (!prev) return prev;
            const newStatus = apiOrder.status?.toLowerCase() || prev.status;
            const newPaymentStatus = apiOrder.paymentStatus || prev.paymentStatus;
            if (newStatus !== prev.status || newPaymentStatus !== prev.paymentStatus) {
              return { ...prev, status: newStatus, paymentStatus: newPaymentStatus };
            }
            return prev;
          });
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
      return;
    }

    try {
      // Cancel via API using numeric id
      if (order?.id) {
        await ordersApi.cancel(order.id);
      }
      addNotification('✅ Đơn hàng đã được hủy thành công', 3000);
    } catch (error) {
      console.error('API cancel failed:', error);
    }

    // Update local storage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedOrders = orders.map(o => {
      const currentOrderId = o.orderId || o.id;
      if (currentOrderId === orderId) {
        return { ...o, status: 'cancelled' };
      }
      return o;
    });
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    
    // Update current order state
    setOrder(prev => ({ ...prev, status: 'cancelled' }));
    addNotification('✅ Đơn hàng đã được hủy', 3000);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateValue, includeTime = false) => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'N/A';
    return includeTime 
      ? date.toLocaleString('vi-VN')
      : date.toLocaleDateString('vi-VN');
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: 'Chờ xác nhận', color: 'orange', icon: '⏳' },
      confirmed: { label: 'Đã xác nhận', color: 'blue', icon: '✓' },
      shipping: { label: 'Đang giao hàng', color: 'purple', icon: '🚚' },
      delivered: { label: 'Đã giao hàng', color: 'green', icon: '✅' },
      cancelled: { label: 'Đã hủy', color: 'red', icon: '✕' }
    };
    return statusMap[status] || statusMap.pending;
  };

  const getPaymentMethodName = (method) => {
    const methods = {
      cod: 'Thanh toán khi nhận hàng (COD)',
      banking: 'Chuyển khoản QR Banking',
      bank: 'Chuyển khoản ngân hàng'
    };
    return methods[method] || method;
  };

  const getTimelineSteps = () => {
    const steps = [
      { key: 'pending', label: 'Đặt hàng', icon: '📋' },
      { key: 'confirmed', label: 'Xác nhận', icon: '✓' },
      { key: 'shipping', label: 'Đang giao', icon: '🚚' },
      { key: 'delivered', label: 'Hoàn thành', icon: '✅' }
    ];

    const statusOrder = ['pending', 'confirmed', 'shipping', 'delivered'];
    const currentIndex = statusOrder.indexOf(order?.status);

    return steps.map((step, index) => ({
      ...step,
      active: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  if (loading) {
    return (
      <div className="order-detail-container">
        <div className="loading-state">
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail-container">
        <div className="not-found">
          <h2>Không tìm thấy đơn hàng</h2>
          <p>Đơn hàng không tồn tại hoặc đã bị xóa</p>
          <Link to="/orders" className="btn-primary">Xem lịch sử đơn hàng</Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const timelineSteps = getTimelineSteps();

  return (
    <div className="order-detail-container">
      {/* Back Button */}
      <div className="header-actions">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>
        {order.status === 'pending' && (
          <button className="btn-cancel-order" onClick={handleCancelOrder}>
            🚫 Hủy đơn hàng
          </button>
        )}
      </div>

      {/* Order Header */}
      <div className="order-detail-header">
        <div className="header-left">
          <h1>Chi tiết đơn hàng</h1>
          <div className="order-id-display">
            <span className="label">Mã đơn:</span>
            <span className="order-id">{order.orderId}</span>
          </div>
          <p className="order-date">
            Đặt ngày: {formatDate(order.orderDate, true)}
          </p>
        </div>
        <div className="header-right">
          <span className={`status-badge ${statusInfo.color}`}>
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Timeline */}
      {order.status !== 'cancelled' && (
        <div className="order-timeline-section">
          <h3>Trạng thái đơn hàng</h3>
          <div className="timeline-track">
            {timelineSteps.map((step, index) => (
              <div 
                key={step.key} 
                className={`timeline-item ${step.active ? 'active' : ''} ${step.current ? 'current' : ''}`}
              >
                <div className="timeline-dot">
                  <span>{step.icon}</span>
                </div>
                <span className="timeline-label">{step.label}</span>
                {index < timelineSteps.length - 1 && (
                  <div className={`timeline-line ${step.active ? 'active' : ''}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancelled Notice */}
      {order.status === 'cancelled' && (
        <div className="cancelled-notice">
          <span className="icon">✕</span>
          <div>
            <h4>Đơn hàng đã bị hủy</h4>
            <p>Đơn hàng này đã được hủy và không thể khôi phục</p>
          </div>
        </div>
      )}

      <div className="order-detail-content">
        {/* Left Column */}
        <div className="detail-left">
          {/* Shipping Info */}
          <div className="detail-card">
            <h3>📍 Thông tin giao hàng</h3>
            <div className="card-content">
              <p className="recipient-name">{order.shippingInfo?.fullName}</p>
              <p>{order.shippingInfo?.phone}</p>
              <p>{order.shippingInfo?.email}</p>
              <p className="address">
                {order.shippingInfo?.address}, {order.shippingInfo?.ward}, {order.shippingInfo?.district}, {order.shippingInfo?.city}
              </p>
              {order.shippingInfo?.note && (
                <p className="note">Ghi chú: {order.shippingInfo.note}</p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="detail-card">
            <h3>💳 Thông tin thanh toán</h3>
            <div className="card-content">
              <p><strong>Phương thức:</strong> {getPaymentMethodName(order.paymentMethod)}</p>
              <p>
                <strong>Trạng thái:</strong>{' '}
                <span className={`payment-status ${order.paymentStatus}`}>
                  {order.paymentStatus === 'completed' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                </span>
              </p>
              {order.paymentMethod === 'bank' && order.paymentStatus === 'pending' && (
                <div className="bank-info">
                  <p><strong>Ngân hàng:</strong> Vietcombank</p>
                  <p><strong>Số TK:</strong> 1234567890123</p>
                  <p><strong>Chủ TK:</strong> CÔNG TY KICKS VIETNAM</p>
                  <p className="transfer-note">* Nội dung CK: {order.orderId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="detail-card">
            <h3>📦 Sản phẩm ({order.items?.length || 0})</h3>
            <div className="items-list">
              {order.items?.map((item, index) => (
                <div key={index} className="order-item">
                  <img src={item.imageUrl || item.image} alt={item.name} />
                  <div className="item-info">
                    <p className="item-name">{item.name}</p>
                    {item.size && <p className="item-variant">Size: {item.size}</p>}
                    {item.color && <p className="item-variant">Màu: {item.color}</p>}
                    <p className="item-quantity">Số lượng: {item.quantity}</p>
                  </div>
                  <div className="item-price">
                    <p className="unit-price">{formatPrice(item.price)}</p>
                    <p className="total-price">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="detail-right">
          <div className="summary-card">
            <h3>Tổng đơn hàng</h3>
            
            <div className="summary-rows">
              <div className="summary-row">
                <span>Tạm tính</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Phí vận chuyển</span>
                <span>{(order.shipping || order.shippingFee) === 0 ? 'Miễn phí' : formatPrice(order.shipping || order.shippingFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="summary-row discount">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>Tổng cộng</span>
              <span>{formatPrice(order.total)}</span>
            </div>

            {/* Actions */}
            <div className="summary-actions">
              {order.status === 'pending' && (
                <button className="btn-cancel" onClick={handleCancelOrder}>
                  Hủy đơn hàng
                </button>
              )}
              <Link to="/products" className="btn-continue">
                Tiếp tục mua sắm
              </Link>
              <button className="btn-support" onClick={() => alert('Liên hệ: 1900 1234')}>
                Liên hệ hỗ trợ
              </button>
            </div>
          </div>

          {/* Estimated Delivery */}
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <div className="delivery-estimate">
              <span className="icon">📅</span>
              <div>
                <p className="label">Dự kiến giao hàng</p>
                <p className="date">
                  {(() => {
                    const orderDate = new Date(order.orderDate);
                    if (isNaN(orderDate.getTime())) return 'N/A';
                    const from = new Date(orderDate.getTime() + 3*24*60*60*1000);
                    const to = new Date(orderDate.getTime() + 5*24*60*60*1000);
                    return `${from.toLocaleDateString('vi-VN')} - ${to.toLocaleDateString('vi-VN')}`;
                  })()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

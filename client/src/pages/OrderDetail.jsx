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
  const [error, setError] = useState(null);
  const { addNotification } = useNotification();

  const normalizeOrder = (orderData) => ({
    id: orderData.id || orderData.orderId,
    orderId: orderData.orderCode || orderData.orderId || orderData.id,
    orderCode: orderData.orderCode || `#${orderData.id || orderData.orderId}`,
    status: orderData.status || 'pending',
    paymentMethod: orderData.paymentMethod || 'cod',
    paymentStatus: orderData.paymentStatus || 'pending',
    subtotal: Number(orderData.subtotal || orderData.total || 0),
    shippingFee: Number(orderData.shippingFee || orderData.shipping || 0),
    discount: Number(orderData.discount || 0),
    total: Number(orderData.total || 0),
    createdAt: orderData.createdAt || orderData.orderDate || orderData.date,
    fullName: orderData.fullName || orderData.customerName || orderData.shippingInfo?.fullName,
    email: orderData.email || orderData.customerEmail || orderData.shippingInfo?.email,
    phone: orderData.phone || orderData.customerPhone || orderData.shippingInfo?.phone,
    address: orderData.address || orderData.shippingInfo?.address,
    ward: orderData.ward || orderData.shippingInfo?.ward,
    district: orderData.district || orderData.shippingInfo?.district,
    city: orderData.city || orderData.shippingInfo?.city,
    note: orderData.note || orderData.shippingInfo?.note,
    items: Array.isArray(orderData.items)
      ? orderData.items.map(item => ({
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

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await ordersApi.getById(orderId);
        setOrder(normalizeOrder(response.data));
      } catch (err) {
        console.error('Error loading order detail:', err);
        setError('Không thể tải thông tin đơn hàng từ server.');
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const found = orders.find(o => String(o.orderId) === String(orderId) || String(o.id) === String(orderId));
        if (found) {
          setOrder(normalizeOrder(found));
        }
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
      return;
    }

    try {
      await ordersApi.cancel(order.id);
      addNotification('✅ Đơn hàng đã được hủy thành công', 3000);
      setOrder(prev => ({ ...prev, status: 'cancelled' }));
    } catch (error) {
      console.error('API cancel failed:', error);
      addNotification('⚠️ Không thể hủy đơn hàng từ server.', 3000);
    }

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedOrders = orders.map(o => {
      const currentOrderId = o.orderId || o.id;
      if (String(currentOrderId) === String(order.id)) {
        return { ...o, status: 'cancelled' };
      }
      return o;
    });
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
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
      bank: 'Chuyển khoản ngân hàng',
      card: 'Thẻ tín dụng/Ghi nợ',
      momo: 'Ví MoMo'
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
        <div className="not-found">
          <h2>Đang tải thông tin đơn hàng...</h2>
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
  const estimateDateRange = (() => {
    const created = new Date(order.createdAt);
    if (isNaN(created.getTime())) return 'N/A';
    const from = new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000);
    const to = new Date(created.getTime() + 5 * 24 * 60 * 60 * 1000);
    return `${from.toLocaleDateString('vi-VN')} - ${to.toLocaleDateString('vi-VN')}`;
  })();

  return (
    <div className="order-detail-container">
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

      <div className="order-detail-header">
        <div className="header-left">
          <h1>Chi tiết đơn hàng</h1>
          <div className="order-id-display">
            <span className="label">Mã đơn:</span>
            <span className="order-id">{order.orderCode}</span>
          </div>
          <p className="order-date">Đặt ngày: {formatDate(order.createdAt, true)}</p>
        </div>
        <div className="header-right">
          <span className={`status-badge ${statusInfo.color}`}>
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>
      </div>

      {order.status !== 'cancelled' && (
        <div className="order-timeline-section">
          <h3>Trạng thái đơn hàng</h3>
          <div className="timeline-track">
            {timelineSteps.map((step, index) => (
              <div
                key={step.key}
                className={`timeline-item ${step.active ? 'active' : ''} ${step.current ? 'current' : ''}`}>
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

      {order.status === 'cancelled' && (
        <div className="cancelled-notice">
          <span className="icon">✕</span>
          <div>
            <h4>Đơn hàng đã bị hủy</h4>
            <p>Đơn hàng này đã được hủy và không thể khôi phục</p>
          </div>
        </div>
      )}

      {error && (
        <div className="order-error">
          <p>{error}</p>
        </div>
      )}

      <div className="order-detail-content">
        <div className="detail-left">
          <div className="detail-card">
            <h3>📍 Thông tin giao hàng</h3>
            <div className="card-content">
              <p className="recipient-name">{order.fullName}</p>
              <p>{order.phone}</p>
              <p>{order.email}</p>
              <p className="address">
                {order.address}
                {order.ward ? `, ${order.ward}` : ''}
                {order.district ? `, ${order.district}` : ''}
                {order.city ? `, ${order.city}` : ''}
              </p>
              {order.note && <p className="note">Ghi chú: {order.note}</p>}
            </div>
          </div>

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
                  <p className="transfer-note">* Nội dung CK: {order.orderCode}</p>
                </div>
              )}
            </div>
          </div>

          <div className="detail-card">
            <h3>📦 Sản phẩm ({order.items?.length || 0})</h3>
            <div className="items-list">
              {order.items?.map((item, index) => (
                <div key={index} className="order-item">
                  <img src={item.image} alt={item.name} />
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
                <span>{order.shippingFee === 0 ? 'Miễn phí' : formatPrice(order.shippingFee)}</span>
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

          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <div className="delivery-estimate">
              <span className="icon">📅</span>
              <div>
                <p className="label">Dự kiến giao hàng</p>
                <p className="date">{estimateDateRange}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

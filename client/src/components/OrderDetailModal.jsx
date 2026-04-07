import React from 'react';
import './OrderDetailModal.css';

function OrderDetailModal({ order, onClose }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'badge-pending';
      case 'confirmed': return 'badge-confirmed';
      case 'shipping': return 'badge-shipping';
      case 'delivered': return 'badge-delivered';
      case 'cancelled': return 'badge-cancelled';
      default: return 'badge-pending';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'shipping': 'Đang giao hàng',
      'delivered': 'Đã giao hàng',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getPaymentStatusText = (status) => {
    return status === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán';
  };

  const getPaymentMethodName = (method) => {
    const methodMap = {
      'cod': 'Thanh toán khi nhận hàng',
      'card': 'Thẻ tín dụng',
      'bank': 'Chuyển khoản ngân hàng',
      'momo': 'Ví Momo'
    };
    return methodMap[method] || method;
  };

  if (!order) return null;

  return (
    <div className="order-detail-modal-overlay" onClick={onClose}>
      <div className="order-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="order-detail-header">
          <div className="order-detail-title">
            <h1>Đơn hàng #{order.orderId}</h1>
            <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>
          <button className="order-detail-close" onClick={onClose} title="Đóng">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="order-detail-content">
          {/* Order Info Row */}
          <div className="info-group">
            <div className="info-item">
              <label>Mã đơn:</label>
              <span>{order.orderId}</span>
            </div>
            <div className="info-item">
              <label>Ngày đặt:</label>
              <span>{formatDate(order.orderDate)}</span>
            </div>
            <div className="info-item">
              <label>Trạng thái:</label>
              <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="section">
            <h3>👤 Khách hàng</h3>
            <div className="info-group">
              <div className="info-item">
                <label>Họ tên:</label>
                <span>{order.shippingInfo?.fullName || order.customerInfo?.fullName || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Điện thoại:</label>
                <span>{order.shippingInfo?.phone || order.customerInfo?.phone || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{order.shippingInfo?.email || order.customerInfo?.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="section">
            <h3>📍 Địa chỉ giao hàng</h3>
            <div className="address-info">
              <p><strong>Địa chỉ:</strong> {order.shippingInfo?.address || order.customerInfo?.address || 'N/A'}</p>
              <p><strong>Phường/Xã:</strong> {order.shippingInfo?.ward || order.customerInfo?.ward || 'N/A'}</p>
              <p><strong>Quận/Huyện:</strong> {order.shippingInfo?.district || order.customerInfo?.district || 'N/A'}</p>
              <p><strong>Tỉnh/Thành phố:</strong> {order.shippingInfo?.city || order.customerInfo?.city || 'N/A'}</p>
              {(order.shippingInfo?.note || order.customerInfo?.note) && (
                <p className="note-info"><strong>Ghi chú:</strong> {order.shippingInfo?.note || order.customerInfo?.note}</p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="section">
            <h3>💳 Thanh toán</h3>
            <div className="info-group">
              <div className="info-item">
                <label>Phương thức:</label>
                <span>{getPaymentMethodName(order.paymentMethod)}</span>
              </div>
              <div className="info-item">
                <label>Trạng thái:</label>
                <span className={getPaymentStatusText(order.paymentStatus) === 'Đã thanh toán' ? 'payment-done' : 'payment-pending'}>
                  {getPaymentStatusText(order.paymentStatus)}
                </span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="section">
            <h3>📦 Sản phẩm đặt hàng</h3>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Đơn giá</th>
                  <th>SL</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="product-cell">
                      <div className="product-info">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="product-image" />
                        )}
                        <div className="product-details">
                          <span className="product-name">{item.name}</span>
                          {item.size && <span className="product-variant">Size: {item.size}</span>}
                          {item.color && <span className="product-variant">Màu: {item.color}</span>}
                        </div>
                      </div>
                    </td>
                    <td>{formatPrice(item.price)}</td>
                    <td className="center">{item.quantity}</td>
                    <td className="right">{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Price Summary */}
          <div className="section price-summary">
            <h3>💰 Tổng cộng</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Tạm tính:</span>
                <span className="value">{formatPrice(order.subtotal || 0)}</span>
              </div>
              {order.discount > 0 && (
                <div className="summary-item discount">
                  <span className="label">Giảm giá:</span>
                  <span className="value">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="summary-item">
                <span className="label">Phí vận chuyển:</span>
                <span className="value">
                  {order.shipping === 0 || order.shipping === undefined ? 'Miễn phí' : formatPrice(order.shipping)}
                </span>
              </div>
              <div className="summary-item total">
                <span className="label">Tổng cộng:</span>
                <span className="value">{formatPrice(order.total || order.totalPrice || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailModal;


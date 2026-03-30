import { Link, useParams } from 'react-router-dom';
import './OrderConfirmation.css';

function OrderConfirmation() {
  const { orderId } = useParams();
  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  const order = orders.find(o => o.id === orderId);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getPaymentMethodLabel = (method) => {
    const methodMap = {
      'cod': '💵 Thanh toán khi nhận hàng',
      'bank': '🏦 Chuyển khoản ngân hàng',
      'card': '💳 Thẻ tín dụng/Ghi nợ',
      'momo': '📱 Ví MoMo'
    };
    return methodMap[method] || method;
  };

  if (!order) {
    return (
      <div className="confirmation-container">
        <div className="not-found">
          <h2>Không tìm thấy đơn hàng</h2>
          <p>Đơn hàng này không tồn tại hoặc đã bị xóa</p>
          <Link to="/" className="btn-primary">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-container">
      {/* Success Animation */}
      <div className="success-animation">
        <div className="checkmark-circle">
          <div className="checkmark"></div>
        </div>
      </div>

      <div className="confirmation-header">
        <h1>🎉 Đặt hàng thành công!</h1>
        <p>Cảm ơn bạn đã mua sắm tại KICKS</p>
      </div>

      <div className="order-confirmation-card">
        <div className="order-id-section">
          <span className="label">Mã đơn hàng:</span>
          <span className="order-id">#{order.id}</span>
        </div>
        <p className="order-date">Đặt lúc: {order.dateFormatted || order.date}</p>

        {/* Order Status Timeline */}
        <div className="order-timeline">
          <div className="timeline-step active">
            <div className="step-dot"></div>
            <div className="step-info">
              <span className="step-title">Đơn hàng đã đặt</span>
              <span className="step-time">{order.dateFormatted || order.date}</span>
            </div>
          </div>
          <div className="timeline-step">
            <div className="step-dot"></div>
            <div className="step-info">
              <span className="step-title">Xác nhận đơn hàng</span>
              <span className="step-time">Đang chờ</span>
            </div>
          </div>
          <div className="timeline-step">
            <div className="step-dot"></div>
            <div className="step-info">
              <span className="step-title">Đang giao hàng</span>
              <span className="step-time">-</span>
            </div>
          </div>
          <div className="timeline-step">
            <div className="step-dot"></div>
            <div className="step-info">
              <span className="step-title">Giao hàng thành công</span>
              <span className="step-time">-</span>
            </div>
          </div>
        </div>

        <div className="confirmation-details">
          <div className="detail-section">
            <h3>📍 Địa chỉ giao hàng</h3>
            <div className="detail-content">
              <p className="recipient-name">{order.customerInfo.fullName}</p>
              <p>{order.customerInfo.phone}</p>
              <p>{order.customerInfo.address}</p>
              <p>
                {order.customerInfo.district && `${order.customerInfo.district}, `}
                {order.customerInfo.city}
              </p>
              {order.customerInfo.note && (
                <p className="note"><em>Ghi chú: {order.customerInfo.note}</em></p>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h3>💳 Thanh toán</h3>
            <div className="detail-content">
              <p>{getPaymentMethodLabel(order.paymentMethod)}</p>
              <p className={`payment-status ${order.paymentStatus}`}>
                {order.paymentStatus === 'completed' ? '✅ Đã thanh toán' : '⏳ Chờ thanh toán'}
              </p>
            </div>
          </div>
        </div>

        {/* Bank Transfer Instructions */}
        {order.paymentMethod === 'bank' && order.paymentStatus === 'pending' && (
          <div className="bank-transfer-notice">
            <h4>📌 Hướng dẫn chuyển khoản</h4>
            <div className="bank-details">
              <p><strong>Ngân hàng:</strong> Vietcombank</p>
              <p><strong>Số tài khoản:</strong> 1234567890</p>
              <p><strong>Chủ TK:</strong> KICKS SHOE STORE</p>
              <p><strong>Nội dung:</strong> {order.id} - {order.customerInfo.phone}</p>
            </div>
            <p className="transfer-note">
              Vui lòng chuyển khoản trong vòng 24h. Đơn hàng sẽ được xử lý sau khi nhận được thanh toán.
            </p>
          </div>
        )}

        {/* Order Items */}
        <div className="order-items-section">
          <h3>📦 Sản phẩm đã đặt ({order.totalItems} sản phẩm)</h3>
          <div className="order-items-list">
            {order.items.map((item, idx) => (
              <div key={idx} className="order-item">
                <img src={item.imageUrl} alt={item.name} />
                <div className="item-details">
                  <p className="item-name">{item.name}</p>
                  <p className="item-variant">{item.brand} • Size {item.size} • {item.color}</p>
                  <p className="item-quantity">Số lượng: {item.quantity}</p>
                </div>
                <div className="item-price">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary-section">
          <div className="summary-row">
            <span>Tạm tính:</span>
            <span>{formatPrice(order.totalPrice)}</span>
          </div>
          <div className="summary-row">
            <span>Phí vận chuyển:</span>
            <span>{order.shippingFee === 0 ? 'Miễn phí' : formatPrice(order.shippingFee || 0)}</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-total">
            <span>Tổng cộng:</span>
            <span>{formatPrice(order.totalAmount || order.totalPrice)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="confirmation-actions">
        <Link to="/orders" className="btn-secondary">
          📋 Xem lịch sử đơn hàng
        </Link>
        <Link to="/" className="btn-primary">
          🛍️ Tiếp tục mua sắm
        </Link>
      </div>

      {/* Support Info */}
      <div className="support-info">
        <p>Cần hỗ trợ? Liên hệ hotline: <strong>1900 1234</strong> hoặc email: <strong>support@kicks.vn</strong></p>
      </div>
    </div>
  );
}

export default OrderConfirmation;

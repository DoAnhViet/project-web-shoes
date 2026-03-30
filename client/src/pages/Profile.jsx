import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const { user, isLoading, error, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  
  // Loyalty points state
  const [pointsData, setPointsData] = useState(null);
  const [pointsLoading, setPointsLoading] = useState(true);

  // Load loyalty points
  useEffect(() => {
    const loadPoints = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`http://localhost:5240/api/points/${user.id}`);
        const data = await response.json();
        setPointsData(data);
      } catch (err) {
        console.error('Error loading points:', err);
      } finally {
        setPointsLoading(false);
      }
    };
    
    loadPoints();
  }, [user?.id]);

  if (isLoading) {
    return <div className="profile-container">Đang tải...</div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    // Trim whitespace from all fields
    const trimmedData = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone?.trim() || '',
      address: formData.address?.trim() || '',
    };

    if (!trimmedData.fullName) {
      setLocalError('Họ và tên không được để trống');
      return;
    }

    try {
      await updateProfile(trimmedData);
      setSuccessMessage('Cập nhật thông tin thành công');
      setIsEditing(false);
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1>Thông Tin Cá Nhân</h1>

        {error && <div className="error-message">{error}</div>}
        {localError && <div className="error-message">{localError}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {/* Loyalty Points Card */}
        <div className="loyalty-points-card">
          <h3>🎁 Điểm Thưởng</h3>
          {pointsLoading ? (
            <p>Đang tải...</p>
          ) : pointsData ? (
            <div className="points-info">
              <div className="points-balance">
                <span className="points-number">{pointsData.points}</span>
                <span className="points-label">điểm</span>
              </div>
              <div className="points-value">
                ≈ {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pointsData.redeemValue)} giảm giá
              </div>
              <div className="points-stats">
                <div className="stat">
                  <span className="stat-value">{pointsData.totalEarned}</span>
                  <span className="stat-label">Tổng tích</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{pointsData.totalRedeemed}</span>
                  <span className="stat-label">Đã đổi</span>
                </div>
              </div>
              <div className="points-rates">
                <small>💰 {pointsData.rates.earnRate}</small>
                <small>🎁 {pointsData.rates.redeemRate}</small>
              </div>
            </div>
          ) : (
            <p>Không thể tải điểm thưởng</p>
          )}
        </div>

        {!isEditing ? (
          <div className="profile-info">
            <div className="info-group">
              <label>Họ và tên:</label>
              <p>{user.fullName}</p>
            </div>

            <div className="info-group">
              <label>Email:</label>
              <p>{user.email}</p>
            </div>

            <div className="info-group">
              <label>Điện thoại:</label>
              <p>{user.phone || 'Chưa cập nhật'}</p>
            </div>

            <div className="info-group">
              <label>Địa chỉ:</label>
              <p>{user.address || 'Chưa cập nhật'}</p>
            </div>

            <div className="profile-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  setFormData({
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone || '',
                    address: user.address || '',
                  });
                  setIsEditing(true);
                }}
              >
                Chỉnh Sửa
              </button>
              <button className="btn-danger" onClick={handleLogout}>
                Đăng Xuất
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="fullName">Họ và tên</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Điện thoại</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Địa chỉ</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Nhập địa chỉ"
                rows="4"
              />
            </div>

            <div className="profile-actions">
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Đang cập nhật...' : 'Lưu Thay Đổi'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

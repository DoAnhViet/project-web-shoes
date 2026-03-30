import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import './ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetInfo, setResetInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    setResetInfo(null);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
      
      // Demo mode: Show reset link directly
      if (response.data.resetToken) {
        setResetInfo({
          token: response.data.resetToken,
          link: response.data.resetLink
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h1>Quên mật khẩu</h1>
        <p className="description">
          Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
          
          {/* Demo mode: Show reset link */}
          {resetInfo && (
            <div className="demo-info">
              <p><strong>🔧 Demo Mode:</strong></p>
              <p>Token: <code>{resetInfo.token}</code></p>
              <Link to={resetInfo.link} className="reset-link">
                Click here to reset password →
              </Link>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-submit"
            disabled={isLoading}
          >
            {isLoading ? 'Đang gửi...' : 'Gửi link đặt lại'}
          </button>
        </form>

        <div className="back-link">
          <Link to="/login">← Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;

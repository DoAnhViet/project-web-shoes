import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [localError, setLocalError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setLocalError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    const trimmedFullName = formData.fullName.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedAddress = formData.address.trim();
    const trimmedPassword = formData.password.trim();
    const trimmedConfirmPassword = formData.confirmPassword.trim();

    if (!trimmedFullName || !trimmedEmail || !trimmedPhone || !trimmedAddress || !trimmedPassword || !trimmedConfirmPassword) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (!formData.agreeTerms) {
      setLocalError('You must agree to the terms and conditions');
      return;
    }

    const phoneDigitsOnly = trimmedPhone.replace(/\D/g, '');
    if (phoneDigitsOnly.length < 10 || phoneDigitsOnly.length > 12) {
      setLocalError('Phone number must be 10-12 digits');
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (trimmedPassword.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      await register(trimmedEmail, trimmedPassword, trimmedFullName, trimmedPhone, trimmedAddress);
      navigate('/');
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      {/* Left Side - Image */}
      <div className="auth-image-side">
        <img 
          src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200" 
          alt="Sneakers" 
          className="auth-bg-image"
        />
        <div className="auth-logo">KICKS</div>
      </div>

      {/* Right Side - Form */}
      <div className="auth-form-side">
        <h1>Register</h1>
        <p className="auth-subtitle" style={{ cursor: 'default', textDecoration: 'none' }}>
          Your journey starts here
        </p>

        {(error || localError) && (
          <div className="error-message">{error || localError}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              required
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Address"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              required
            />
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="agreeTerms"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
            />
            <label htmlFor="agreeTerms">
              I agree to the <a href="#">Terms & Conditions</a> and <a href="#">Privacy Policy</a>
            </label>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
            <span className="arrow">→</span>
          </button>
        </form>

        {/* Social Login */}
        <div className="social-buttons">
          <button className="social-btn" type="button">
            <svg viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>
          <button className="social-btn" type="button">
            <svg viewBox="0 0 24 24" fill="#000">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
          </button>
          <button className="social-btn" type="button">
            <svg viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
        </div>

        <p className="auth-link">
          Already have an account?
          <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

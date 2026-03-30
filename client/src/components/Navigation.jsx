import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

export default function Navigation() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      {/* Top Bar */}
      <div className="nav-top-bar">
        <div className="nav-container">
          <div className="nav-top-left">
          </div>
          <div className="nav-top-right">
            <Link to="/stores" className="nav-top-link">
              Find a Store
            </Link>
            <span className="nav-divider">|</span>
            <Link to="/help" className="nav-top-link">
              Help
            </Link>
            <span className="nav-divider">|</span>
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="nav-top-link">
                  Hi, {user?.fullName || 'User'}
                </Link>
                <span className="nav-divider">|</span>
                <button className="nav-top-link nav-top-btn" onClick={handleLogout}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/register" className="nav-top-link">
                  Join Us
                </Link>
                <span className="nav-divider">|</span>
                <Link to="/login" className="nav-top-link">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

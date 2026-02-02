import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin role (role "Admin" or role value 1)
  const isAdmin = user?.role === 'Admin' || user?.role === 1;
  
  if (!isAdmin) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        maxWidth: '600px',
        margin: '40px auto'
      }}>
        <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>
          Truy cập bị từ chối
        </h2>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
          Bạn không có quyền truy cập trang này. Chỉ tài khoản Admin mới có thể vào trang quản trị.
        </p>
        <a 
          href="/" 
          style={{ 
            display: 'inline-block',
            padding: '10px 24px',
            backgroundColor: '#111',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '24px',
            fontSize: '15px',
            fontWeight: '500'
          }}
        >
          Về trang chủ
        </a>
      </div>
    );
  }

  return children;
}

import { useState } from 'react';
import api from '../api/api';

export default function DebugAuth() {
  const [email, setEmail] = useState('huanvu210@gmail.com');
  const [checkResult, setCheckResult] = useState(null);
  const [resetResult, setResetResult] = useState(null);

  const handleCheckUser = async () => {
    try {
      const response = await api.get(`/auth/check/${email}`);
      setCheckResult(response.data);
      console.log('Check user result:', response.data);
    } catch (error) {
      setCheckResult({ error: error.message });
      console.error('Error:', error);
    }
  };

  const handleResetPassword = async () => {
    try {
      const response = await api.post('/auth/reset-password', { email });
      setResetResult(response.data);
      alert('Password has been reset!');
      console.log('Reset result:', response.data);
    } catch (error) {
      setResetResult({ error: error.message });
      console.error('Error:', error);
      alert('Failed to reset password');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Debug Authentication</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          style={{ padding: '10px', width: '300px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleCheckUser} style={{ padding: '10px 20px', marginRight: '10px' }}>
          Check User Status
        </button>
        <button onClick={handleResetPassword} style={{ padding: '10px 20px' }}>
          Reset Password to: huanvu210
        </button>
      </div>

      {checkResult && (
        <div style={{ background: '#f0f0f0', padding: '10px', marginBottom: '20px' }}>
          <h3>User Status:</h3>
          <pre>{JSON.stringify(checkResult, null, 2)}</pre>
        </div>
      )}

      {resetResult && (
        <div style={{ background: '#f0f0f0', padding: '10px', marginBottom: '20px' }}>
          <h3>Reset Result:</h3>
          <pre>{JSON.stringify(resetResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

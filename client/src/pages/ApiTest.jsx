import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ApiTest.css';

const API_BASE = 'http://localhost:5000/api';

function ApiTest() {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('/products');
  const [body, setBody] = useState('');

  const presetEndpoints = [
    { name: 'Get All Products', method: 'GET', endpoint: '/products', body: '' },
    { name: 'Get Product by ID', method: 'GET', endpoint: '/products/1', body: '' },
    { name: 'Get All Categories', method: 'GET', endpoint: '/categories', body: '' },
    { name: 'Get Category by ID', method: 'GET', endpoint: '/categories/1', body: '' },
    { name: 'Search Products', method: 'GET', endpoint: '/products?search=Nike', body: '' },
    { name: 'Filter by Category', method: 'GET', endpoint: '/products?categoryId=1', body: '' },
    { name: 'Create Product', method: 'POST', endpoint: '/products', body: JSON.stringify({
      name: "New Shoe",
      description: "Test product",
      price: 1500000,
      stock: 10,
      imageUrl: "https://example.com/image.jpg",
      categoryId: 1,
      brand: "Test Brand",
      size: "42",
      color: "Black"
    }, null, 2) },
    { name: 'Update Product', method: 'PUT', endpoint: '/products/1', body: JSON.stringify({
      id: 1,
      name: "Updated Shoe",
      description: "Updated description",
      price: 2000000,
      stock: 20,
      imageUrl: "https://example.com/image.jpg",
      categoryId: 1,
      brand: "Updated Brand",
      size: "43",
      color: "White"
    }, null, 2) },
    { name: 'Delete Product', method: 'DELETE', endpoint: '/products/1', body: '' },
  ];

  const handlePreset = (preset) => {
    setMethod(preset.method);
    setEndpoint(preset.endpoint);
    setBody(preset.body);
    setResponse(null);
    setError(null);
  };

  const sendRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = body;
      }

      const res = await fetch(`${API_BASE}${endpoint}`, options);
      
      const contentType = res.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        data: data,
        headers: Object.fromEntries(res.headers.entries()),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 400 && status < 500) return 'warning';
    if (status >= 500) return 'error';
    return 'info';
  };

  return (
    <div className="api-test-container">
      <header className="api-header">
        <div className="header-left">
          <h1>🧪 API Tester</h1>
          <p>Test your ShoeStore API endpoints</p>
        </div>
        <div className="header-right">
          <span className="api-base">{API_BASE}</span>
          <Link to="/" className="back-btn">← Back to Store</Link>
        </div>
      </header>

      <div className="api-content">
        {/* Sidebar - Preset Endpoints */}
        <aside className="api-sidebar">
          <h3>Preset Endpoints</h3>
          <div className="preset-list">
            {presetEndpoints.map((preset, idx) => (
              <button
                key={idx}
                className={`preset-btn ${method === preset.method && endpoint === preset.endpoint ? 'active' : ''}`}
                onClick={() => handlePreset(preset)}
              >
                <span className={`method-badge ${preset.method.toLowerCase()}`}>
                  {preset.method}
                </span>
                <span className="preset-name">{preset.name}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Area */}
        <main className="api-main">
          {/* Request Builder */}
          <div className="request-builder">
            <h3>Request</h3>
            <div className="request-row">
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="method-select">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/products"
                className="endpoint-input"
              />
              <button onClick={sendRequest} disabled={loading} className="send-btn">
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>

            {(method === 'POST' || method === 'PUT') && (
              <div className="body-section">
                <label>Request Body (JSON)</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{"key": "value"}'
                  rows="10"
                />
              </div>
            )}
          </div>

          {/* Response Area */}
          <div className="response-area">
            <h3>Response</h3>
            
            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Sending request...</p>
              </div>
            )}

            {error && (
              <div className="error-state">
                <span className="error-icon">❌</span>
                <p>{error}</p>
              </div>
            )}

            {response && (
              <div className="response-content">
                <div className="response-meta">
                  <span className={`status-badge ${getStatusColor(response.status)}`}>
                    {response.status} {response.statusText}
                  </span>
                </div>

                <div className="response-tabs">
                  <button 
                    className={`tab ${activeTab === 'body' ? 'active' : ''}`}
                    onClick={() => setActiveTab('body')}
                  >
                    Body
                  </button>
                  <button 
                    className={`tab ${activeTab === 'headers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('headers')}
                  >
                    Headers
                  </button>
                </div>

                {activeTab === 'body' && (
                  <pre className="response-body">
                    {typeof response.data === 'object' 
                      ? JSON.stringify(response.data, null, 2)
                      : response.data || '(Empty response)'}
                  </pre>
                )}

                {activeTab === 'headers' && (
                  <pre className="response-body">
                    {JSON.stringify(response.headers, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {!loading && !error && !response && (
              <div className="empty-state">
                <span className="empty-icon">📡</span>
                <p>Select a preset or build your request and click Send</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ApiTest;

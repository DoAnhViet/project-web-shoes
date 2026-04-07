import axios from 'axios';

const API_BASE_URL = 'http://localhost:5240/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    // For orders, try both 'user' and 'currentUser' keys
    let user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    
    // Log API calls for debugging
    console.log('🔍 API Call:', config.method?.toUpperCase(), config.url, config.headers);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const productsApi = {
  getAll: (params = {}) => {
    if (!params.pageSize) {
      params.pageSize = 10000;
    }
    return api.get('/products', { params });
  },
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`)
};

export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

export const reviewsApi = {
  getByProduct: (productId, pageNumber = 1, pageSize = 10) => 
    api.get('/reviews', { params: { productId, pageNumber, pageSize } }),
  getById: (id) => api.get(`/reviews/${id}`),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  getStats: (productId) => api.get(`/reviews/stats/${productId}`)
};

export const ordersApi = {
  getAll: (params) => api.get('/orders', { params }),
  getByUser: (userId, params = {}) => api.get(`/orders/user/${userId}`, { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getByCode: (orderCode) => api.get(`/orders/code/${orderCode}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  updatePaymentStatus: (id, paymentStatus) => api.put(`/orders/${id}/payment-status`, { paymentStatus }),
  cancel: (id) => api.delete(`/orders/${id}`),
  getStats: () => api.get('/orders/stats')
};

export const usersApi = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

export const salesApi = {
  getAll: () => api.get('/sales'),
  getActive: () => api.get('/sales/active'),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  delete: (id) => api.delete(`/sales/${id}`),
  addProduct: (saleId, productId) => api.post(`/sales/${saleId}/products`, { productId }),
  removeProduct: (saleId, productId) => api.delete(`/sales/${saleId}/products/${productId}`)
};

// Helper to get or generate session ID for guest cart
const getSessionId = () => {
  let sessionId = localStorage.getItem('cartSessionId');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('cartSessionId', sessionId);
  }
  return sessionId;
};

export const cartsApi = {
  // Get cart (auto-detect guest/user)
  getCart: (userId = null) => {
    if (userId) {
      return api.get(`/carts/user/${userId}`);
    }
    return api.get(`/carts/session/${getSessionId()}`);
  },
  
  // Add item to cart
  addItem: (item, userId = null) => {
    if (userId) {
      return api.post(`/carts/user/${userId}/items`, item);
    }
    return api.post(`/carts/session/${getSessionId()}/items`, item);
  },
  
  // Update cart item quantity
  updateItem: (itemId, quantity) => api.put(`/carts/items/${itemId}`, { quantity }),
  
  // Remove item from cart
  removeItem: (itemId) => api.delete(`/carts/items/${itemId}`),
  
  // Clear cart
  clearCart: (userId = null) => {
    if (userId) {
      return api.delete(`/carts/user/${userId}`);
    }
    return api.delete(`/carts/session/${getSessionId()}`);
  },
  
  // Merge guest cart to user cart after login
  mergeCart: (userId) => api.post(`/carts/merge/${userId}`, { sessionId: getSessionId() }),
  
  // Get cart count
  getCount: (userId = null) => {
    if (userId) {
      return api.get(`/carts/count/user/${userId}`);
    }
    return api.get(`/carts/count/session/${getSessionId()}`);
  },
  
  // Get session ID (useful for debugging)
  getSessionId
};

export default api;
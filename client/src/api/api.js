import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
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
  getById: (id) => api.get(`/orders/${id}`),
  getByCode: (orderCode) => api.get(`/orders/code/${orderCode}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  updatePaymentStatus: (id, paymentStatus) => api.put(`/orders/${id}/payment-status`, { paymentStatus }),
  cancel: (id) => api.delete(`/orders/${id}`),
  getStats: () => api.get('/orders/stats')
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
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5055/api';

export const productsApi = {
  getAll: (params) => axios.get(`${API_BASE_URL}/products`, { params }),
  getById: (id) => axios.get(`${API_BASE_URL}/products/${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/products`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/products/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/products/${id}`)
};

export const categoriesApi = {
  getAll: () => axios.get(`${API_BASE_URL}/categories`),
  getById: (id) => axios.get(`${API_BASE_URL}/categories/${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/categories`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/categories/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/categories/${id}`)
};

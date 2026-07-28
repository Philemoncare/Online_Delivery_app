import axios from 'axios';

const getBaseURL = (port) => `http://127.0.0.1:${port}/api/v1`;

const API_CONFIG = {
  auth: getBaseURL(8000),
  rest: getBaseURL(8001),
  order: getBaseURL(8002),
  ai: getBaseURL(8005)
};

const api = axios.create();

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (fd) => axios.post(`${API_CONFIG.auth}/auth/login`, fd),
  register: (data) => axios.post(`${API_CONFIG.auth}/auth/register`, data),
  getMe: () => api.get(`${API_CONFIG.auth}/auth/me`),
  updateMe: (data) => api.put(`${API_CONFIG.auth}/auth/me`, data),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`${API_CONFIG.auth}/auth/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export const restaurantApi = {
  getRestaurants: () => axios.get(`${API_CONFIG.rest}/restaurants`),
  getRestaurant: (id) => axios.get(`${API_CONFIG.rest}/restaurants/${id}`),
  getMenu: (id) => axios.get(`${API_CONFIG.rest}/restaurants/${id}/menu`),
  submitReview: (orderId, data) => api.post(`${API_CONFIG.rest}/reviews/orders/${orderId}/review`, data),
  getFeaturedItems: () => axios.get(`${API_CONFIG.rest}/public/featured-items`),
  getCategories: () => axios.get(`${API_CONFIG.rest}/public/categories`),
  getPromotions: () => axios.get(`${API_CONFIG.rest}/public/promotions`),
  submitInquiry: (data) => axios.post(`${API_CONFIG.rest}/public/inquiries`, data),
};

export const orderApi = {
  createOrder: (data) => api.post(`${API_CONFIG.order}/orders`, data),
  getOrders: () => api.get(`${API_CONFIG.order}/orders`),
  getOrder: (id) => api.get(`${API_CONFIG.order}/orders/${id}`),
  cancelOrder: (id) => api.post(`${API_CONFIG.order}/orders/${id}/cancel`),
};

export const aiApi = {
  chat: (message) => axios.post(`${API_CONFIG.ai}/ai/chat`, { message }),
};

export default api;

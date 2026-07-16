import axios from 'axios';

const getBaseURL = (port) => `http://127.0.0.1:${port}/api/v1`;

const API_CONFIG = {
  auth: getBaseURL(8000),
  rest: getBaseURL(8001),
  order: getBaseURL(8002),
  payment: getBaseURL(8004)
};

const api = axios.create();

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => axios.post(`${API_CONFIG.auth}/auth/login`, credentials),
  register: (data) => axios.post(`${API_CONFIG.auth}/auth/register`, data),
  getMe: () => api.get(`${API_CONFIG.auth}/auth/me`),
  getUsers: () => api.get(`${API_CONFIG.auth}/admin/users`),
  updateUser: (id, data) => api.patch(`${API_CONFIG.auth}/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`${API_CONFIG.auth}/admin/users/${id}`),
  getAuditLogs: () => api.get(`${API_CONFIG.auth}/admin/audit-logs`),
  getSettings: () => api.get(`${API_CONFIG.auth}/admin/settings`),
  updateSettings: (data) => api.post(`${API_CONFIG.auth}/admin/settings`, data),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`${API_CONFIG.auth}/auth/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export const restaurantApi = {
  getRestaurants: () => api.get(`${API_CONFIG.rest}/admin/restaurants`),
  createRestaurant: (data) => api.post(`${API_CONFIG.rest}/admin/restaurants`, data),
  updateStatus: (id, is_open) => api.patch(`${API_CONFIG.rest}/admin/restaurants/${id}/status`, { is_open }),
  updateRestaurant: (id, data) => api.put(`${API_CONFIG.rest}/restaurants/${id}`, data),
  deleteRestaurant: (id) => api.delete(`${API_CONFIG.rest}/admin/restaurants/${id}`),
  getRestaurantDetails: (id) => api.get(`${API_CONFIG.rest}/restaurants/${id}`),
  getMenu: (id) => api.get(`${API_CONFIG.rest}/restaurants/${id}/menu`),
};

export const orderApi = {
  getAnalytics: (range = 'all') => api.get(`${API_CONFIG.order}/admin/analytics?range=${range}`),
  getRestaurantStats: () => api.get(`${API_CONFIG.order}/admin/restaurants-stats`),
  getMerchantStats: (id) => api.get(`${API_CONFIG.order}/restaurants/${id}/sales-stats`),
  getOrders: () => api.get(`${API_CONFIG.order}/orders`),
  getDisputes: () => api.get(`${API_CONFIG.order}/disputes`),
  resolveDispute: (id) => api.patch(`${API_CONFIG.order}/disputes/${id}/resolve`),
};

export const paymentApi = {
  getPayments: () => api.get(`${API_CONFIG.payment}/api/v1/admin/payments`),
};

export default api;

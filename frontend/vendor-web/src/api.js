import axios from 'axios';

const getBaseURL = (port) => `http://127.0.0.1:${port}/api/v1`;

const API_CONFIG = {
  auth: getBaseURL(8000),
  rest: getBaseURL(8001),
  order: getBaseURL(8002)
};

const api = axios.create();

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vendor_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vendor_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => axios.post(`${API_CONFIG.auth}/auth/login`, credentials),
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
  getMine: () => api.get(`${API_CONFIG.rest}/restaurants/mine`),
  createRestaurant: (data) => api.post(`${API_CONFIG.rest}/restaurants`, data),
  updateProfile: (id, data) => api.put(`${API_CONFIG.rest}/restaurants/${id}`, data),
  getMenu: (id) => api.get(`${API_CONFIG.rest}/restaurants/${id}/menu`),
  addMenuItem: (id, data) => api.post(`${API_CONFIG.rest}/restaurants/${id}/menu`, data),
  updateMenuItem: (itemId, data) => api.put(`${API_CONFIG.rest}/menu-items/${itemId}`, data),
  deleteMenuItem: (itemId) => api.delete(`${API_CONFIG.rest}/menu-items/${itemId}`),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`${API_CONFIG.rest}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export const orderApi = {
  getOrders: (restaurantId) => api.get(`${API_CONFIG.order}/orders?restaurant_id=${restaurantId}`),
  updateStatus: (orderId, status) => api.patch(`${API_CONFIG.order}/orders/${orderId}/status`, { status }),
  getStats: (restaurantId) => api.get(`${API_CONFIG.order}/restaurants/${restaurantId}/sales-stats`),
};

export default api;

import axios from 'axios';
import { Platform } from 'react-native';

const getHost = () => Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

const AUTH_URL = `http://${getHost()}:8000/api/v1`;
const DELV_URL = `http://${getHost()}:8003/api/v1`;

export const authApi = {
  login: (email, password) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    return axios.post(`${AUTH_URL}/auth/login`, params);
  },
  getMe: (token) => axios.get(`${AUTH_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
  updateMe: (userData, token) => axios.put(`${AUTH_URL}/auth/me`, userData, { headers: { Authorization: `Bearer ${token}` } }),
  uploadImage: (formData, token) => axios.post(`${AUTH_URL}/auth/upload`, formData, {
    headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
    }
  }),
};

export const deliveryApi = {
  getAvailable: (token) => axios.get(`${DELV_URL}/deliveries/available`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  acceptDelivery: (id, riderId, token) => axios.post(`${DELV_URL}/deliveries/${id}/accept?rider_id=${riderId}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateStatus: (id, status, lat, lng, token) => axios.patch(`${DELV_URL}/deliveries/${id}/status?status=${status}&lat=${lat}&lng=${lng}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getSummary: (riderId, token) => axios.get(`${DELV_URL}/deliveries/rider/${riderId}/summary`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

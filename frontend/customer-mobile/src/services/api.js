import axios from 'axios';
import { Platform } from 'react-native';

// DYNAMIC ROUTING FOR LOCAL VS GATEWAY
const getBase = (port) => {
    // In React Native 'localhost' refers to the phone.
    // Use 10.0.2.2 for Android Emulator, or your machine's IP for physical devices.
    const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${host}:${port}/api/v1`;
};

const AUTH_URL = getBase(8000);
const REST_URL = getBase(8001);
const ORDER_URL = getBase(8002);
const PAY_URL = getBase(8004);
const DELV_URL = getBase(8003);

export const authApi = {
  login: (email, password) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    return axios.post(`${AUTH_URL}/auth/login`, params);
  },
  register: (userData) => axios.post(`${AUTH_URL}/auth/register`, userData),
  getMe: (token) => axios.get(`${AUTH_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
  updateMe: (userData, token) => axios.put(`${AUTH_URL}/auth/me`, userData, { headers: { Authorization: `Bearer ${token}` } }),
  uploadImage: (formData, token) => axios.post(`${AUTH_URL}/auth/upload`, formData, {
    headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
    }
  }),
};

export const restaurantApi = {
  getRestaurants: (lat, lng, search) => axios.get(`${REST_URL}/restaurants`, { params: { lat, lng, search } }),
  getMenu: (id) => axios.get(`${REST_URL}/restaurants/${id}/menu`),
  searchFood: (q) => axios.get(`${REST_URL}/menu-items/search`, { params: { q } }),
};

export const walletApi = {
    getBalance: (userId, token) => axios.get(`${AUTH_URL}/users/${userId}/wallet`, { headers: { Authorization: `Bearer ${token}` } }),
    getTransactions: (userId, token) => axios.get(`${AUTH_URL}/users/${userId}/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
};

export const orderApi = {
  placeOrder: (orderData, token) => axios.post(`${ORDER_URL}/orders`, orderData, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getOrders: (customerId, token) => axios.get(`${ORDER_URL}/customers/${customerId}/orders`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getOrder: (id, token) => axios.get(`${ORDER_URL}/orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

export const paymentApi = {
    simulateSuccess: (orderId, transactionRef) => axios.post(`${PAY_URL}/payments/momo/callback`, {
        transaction_ref: transactionRef,
        status: "SUCCESS"
    }),
    getPaymentForOrder: (orderId) => axios.get(`${PAY_URL}/payments/order/${orderId}`)
};

export const deliveryApi = {
    trackDelivery: (orderId) => axios.get(`${DELV_URL}/deliveries/${orderId}/track`)
};

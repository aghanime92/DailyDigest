import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Configure axios
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Get Gmail OAuth URL
export const getGmailAuthUrl = async () => {
  const response = await api.get('/auth/gmail/url');
  return response.data.url;
};

// Handle OAuth callback
export const handleGmailCallback = async (code: string) => {
  const response = await api.post('/auth/gmail/callback', { code });
  return response.data;
};

// Get user connection status
export const getUserStatus = async (email: string) => {
  const response = await api.get(`/auth/status?email=${encodeURIComponent(email)}`);
  return response.data;
};

// Admin login
export const adminLogin = async (secretKey: string) => {
  const response = await api.post('/admin/login', { secretKey });
  return response.data;
};

// Admin logout
export const adminLogout = async () => {
  const response = await api.post('/admin/logout');
  return response.data;
};

// Get all connected users (admin only)
export const getConnectedUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data.users;
};

// Trigger sync for a user (admin only)
export const syncUserEmails = async (userId: string) => {
  const response = await api.post(`/admin/users/${userId}/sync`);
  return response.data;
};

// Revoke a user's connection (admin only)
export const revokeUserConnection = async (userId: string) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = 'http://192.168.18.82:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      await AsyncStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

// Asset API
export const assetAPI = {
  // Get all assets
  getAssets: async (params = {}) => {
    try {
      const response = await api.get('/assets', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching assets:', error);
      throw error;
    }
  },

  // Get single asset
  getAsset: async (assetId) => {
    try {
      const response = await api.get(`/assets/${assetId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching asset:', error);
      throw error;
    }
  },

  // Check in/out asset
  checkInOut: async (assetId, action, location = null) => {
    try {
      const response = await api.post(`/assets/${assetId}/${action}`, {
        location,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error ${action} asset:`, error);
      throw error;
    }
  },

  // Update asset location
  updateLocation: async (assetId, location) => {
    try {
      const response = await api.put(`/assets/${assetId}/location`, {
        location,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating asset location:', error);
      throw error;
    }
  },
};

// Auth API
export const authAPI = {
  // Login
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token } = response.data;
      await AsyncStorage.setItem('authToken', token);
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  },
};

// Analytics API
export const analyticsAPI = {
  // Get dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get asset analytics
  getAssetAnalytics: async (assetId) => {
    try {
      const response = await api.get(`/analytics/assets/${assetId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching asset analytics:', error);
      throw error;
    }
  },
};

// Offline storage helpers
export const offlineStorage = {
  // Store data for offline use
  storeData: async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error storing data:', error);
    }
  },

  // Retrieve stored data
  getData: async (key) => {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  },

  // Store offline actions
  storeOfflineAction: async (action) => {
    try {
      const actions = await offlineStorage.getData('offlineActions') || [];
      actions.push({ ...action, timestamp: new Date().toISOString() });
      await offlineStorage.storeData('offlineActions', actions);
    } catch (error) {
      console.error('Error storing offline action:', error);
    }
  },

  // Get pending offline actions
  getOfflineActions: async () => {
    try {
      return await offlineStorage.getData('offlineActions') || [];
    } catch (error) {
      console.error('Error getting offline actions:', error);
      return [];
    }
  },

  // Clear offline actions
  clearOfflineActions: async () => {
    try {
      await AsyncStorage.removeItem('offlineActions');
    } catch (error) {
      console.error('Error clearing offline actions:', error);
    }
  },
};

export default api;

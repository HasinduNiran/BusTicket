import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For Expo development - multiple fallback options
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Using your computer's actual IP address
    return 'http://192.168.8.102:5000/api'; // Your main network IP
    // Alternatives if the above doesn't work:
    // return 'http://192.168.184.1:5000/api';
    // return 'http://10.0.2.2:5000/api'; // Android emulator
  }
  return 'http://localhost:5000/api'; // Production
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance with shorter timeout for better demo experience
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3000, // Reduced timeout for faster fallback to demo mode
});

// Add request interceptor for auth token
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

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials) => {
    try {
      console.log('Attempting login with credentials:', { email: credentials.email, password: '***' });
      const response = await api.post('/auth/login', credentials);
      console.log('Login response:', response.data);
      
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      }
      return response;
    } catch (error) {
      console.error('Login API error:', error.response?.data || error.message);
      throw error;
    }
  },
  logout: async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      return api.post('/auth/logout');
    } catch (error) {
      throw error;
    }
  },
  getStoredUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }
};

// Routes API
export const routesAPI = {
  getAll: () => api.get('/routes'),
  getById: (id) => api.get(`/routes/${id}`),
  getConductorRoutes: () => api.get('/routes/conductor/assigned'), // Updated to use new endpoint
};

// Stops API
export const stopsAPI = {
  getByRoute: (routeId, direction = 'forward', category = 'normal') => 
    api.get(`/stops/route/${routeId}?direction=${direction}&category=${category}`),
};

// Route Sections API
export const routeSectionsAPI = {
  getByRoute: (routeId, category) => api.get(`/route-sections/route/${routeId}/category/${category}`),
};

// Fares API
export const faresAPI = {
  calculate: (routeId, fromSection, toSection, category) => 
    api.post('/stops/calculate-fare', { routeId, fromSection, toSection, category }),
};

// Sections API  
export const sectionsAPI = {
  getByCategory: (category) => api.get(`/sections/category/${category}`),
};

// Tickets API
export const ticketsAPI = {
  create: (ticketData) => api.post('/tickets/generate', ticketData),
  getAll: () => api.get('/tickets'),
  getConductorTickets: (conductorId) => api.get(`/tickets/conductor/${conductorId}`),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
};

// Buses API
export const busesAPI = {
  getAll: () => api.get('/buses'),
  getById: (id) => api.get(`/buses/${id}`),
  getConductorBuses: () => api.get('/buses/conductor/assigned'), // Get buses for conductor's assigned route
  getByRoute: (routeId) => api.get(`/buses?routeId=${routeId}`),
};

export default api;

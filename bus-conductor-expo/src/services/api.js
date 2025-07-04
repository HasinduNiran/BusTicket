import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    // const token = AsyncStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
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
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
};

// Routes API
export const routesAPI = {
  getAll: () => api.get('/busRoutes'),
  getById: (id) => api.get(`/busRoutes/${id}`),
};

// Route Sections API
export const routeSectionsAPI = {
  getByRoute: (routeId, category) => api.get(`/routeSections/route/${routeId}?category=${category}`),
};

// Tickets API
export const ticketsAPI = {
  create: (ticketData) => api.post('/tickets', ticketData),
  getAll: () => api.get('/tickets'),
};

export default api;

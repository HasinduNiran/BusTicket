import axios from 'axios';

const BASE_URL = 'http://10.0.2.2:5000/api'; // Android emulator localhost
// For physical device, replace with your computer's IP: 'http://192.168.1.x:5000/api'

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          this.clearAuthToken();
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.api.defaults.headers.common['Authorization'];
  }

  // Auth endpoints
  async login(email, password) {
    return this.api.post('/auth/login', { email, password });
  }

  async getCurrentUser() {
    return this.api.get('/auth/me');
  }

  // Routes endpoints
  async getRoutes() {
    return this.api.get('/routes');
  }

  async getRoute(routeId) {
    return this.api.get(`/routes/${routeId}`);
  }

  // Stops endpoints
  async getStopsForRoute(routeId) {
    return this.api.get(`/stops/route/${routeId}`);
  }

  async getStopBySection(routeId, sectionNumber) {
    return this.api.get(`/stops/route/${routeId}/section/${sectionNumber}`);
  }

  async calculateFare(routeId, fromSection, toSection) {
    return this.api.post('/stops/calculate-fare', {
      routeId,
      fromSection,
      toSection,
    });
  }

  // Tickets endpoints
  async generateTicket(ticketData) {
    return this.api.post('/tickets/generate', ticketData);
  }

  async getMyTickets() {
    return this.api.get('/tickets/my-tickets');
  }

  async getTicketByNumber(ticketNumber) {
    return this.api.get(`/tickets/number/${ticketNumber}`);
  }

  async cancelTicket(ticketId) {
    return this.api.patch(`/tickets/${ticketId}/cancel`);
  }

  // Fares endpoints
  async calculateFareDetail(routeId, fromSection, toSection) {
    return this.api.post('/fares/calculate', {
      routeId,
      fromSection,
      toSection,
    });
  }

  async getFareMatrix(routeId) {
    return this.api.get(`/fares/matrix/${routeId}`);
  }
}

export const apiService = new ApiService();

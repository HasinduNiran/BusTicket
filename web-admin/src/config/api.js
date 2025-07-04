// API Configuration
const API_CONFIG = {
  // Local development
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  
  // For production hosting, you can set REACT_APP_API_URL environment variable
  // or directly change the URL here for your hosted backend
};

export default API_CONFIG;

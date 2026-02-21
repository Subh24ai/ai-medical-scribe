import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_VERSION = 'v1';

const api = axios.create({
  baseURL: `${API_URL}/api/${API_VERSION}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now()
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const endpoints = {
  // Auth
  login: '/auth/login',
  register: '/auth/register',
  profile: '/auth/profile',
  
  // Patients
  patients: '/patients',
  patientById: (id) => `/patients/${id}`,
  patientSearch: '/patients/search',
  
  // Consultations
  consultations: '/consultations',
  consultationById: (id) => `/consultations/${id}`,
  startConsultation: '/consultations',
  completeConsultation: (id) => `/consultations/${id}/complete`,
  consultationHistory: (patientId) => `/consultations/patient/${patientId}`,
  
  // Prescriptions
  prescriptions: '/prescriptions',
  prescriptionById: (id) => `/prescriptions/${id}`,
  finalizePrescription: (id) => `/prescriptions/${id}/finalize`,
  sendPrescription: (id) => `/prescriptions/${id}/send`,
  
  // Payments
  payments: '/payments',
  createPayment: '/payments/create',
  verifyPayment: '/payments/verify',
  
  // Drugs
  drugs: '/drugs',
  drugSearch: '/drugs/search',
  drugInteractions: '/drugs/interactions',
  
  // Analytics
  analytics: '/analytics',
  dashboardStats: '/analytics/dashboard',
  revenueReport: '/analytics/revenue',
  
  // Settings
  clinicSettings: '/clinics/settings',
  updateSettings: '/clinics/settings'
};
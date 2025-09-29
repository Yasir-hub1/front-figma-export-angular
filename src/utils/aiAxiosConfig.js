// src/utils/aiAxiosConfig.js - Configuración específica para AI Assistant
import axios from 'axios';

export const API_URL = 'http://localhost:5002/api';

const aiAxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token a las peticiones
aiAxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores SIN cerrar sesión automáticamente
aiAxiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // NO cerrar sesión automáticamente, solo logear el error
    if (error.response && error.response.status === 401) {
      console.warn("🔐 Error de autenticación detectado en AI Assistant:", error.response.data);
      // Marcar el error como de autenticación para manejo específico
      error.isAuthError = true;
    }
    
    if (error.response && error.response.status === 403) {
      console.warn("🚫 Error de permisos detectado en AI Assistant:", error.response.data);
      error.isPermissionError = true;
    }
    
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      console.warn("🌐 Error de red detectado en AI Assistant:", error.message);
      error.isNetworkError = true;
    }
    
    return Promise.reject(error);
  }
);

export default aiAxiosInstance;

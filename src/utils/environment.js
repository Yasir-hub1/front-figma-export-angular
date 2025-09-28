// src/utils/environment.js
// Configuración de variables de entorno para la aplicación

const environment = {
    apiUrl: process.env.REACT_APP_API_URL || 'http://134.209.50.92:5002/api',
    socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://134.209.50.92:5002',
    appName: 'Figma Flutter Generator'
  };
  
  export default environment;
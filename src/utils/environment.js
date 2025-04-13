// src/utils/environment.js
// Configuración de variables de entorno para la aplicación

const environment = {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',
    appName: 'Figma Angular Generator'
  };
  
  export default environment;
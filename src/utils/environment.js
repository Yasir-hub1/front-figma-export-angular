// src/utils/environment.js
// Configuración de variables de entorno para la aplicación

const environment = {
    apiUrl: process.env.REACT_APP_API_URL || 'http://45.55.145.232/api/api',
    socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://45.55.145.232',
    appName: 'Figma Angular Generator'
  };
  
  export default environment;
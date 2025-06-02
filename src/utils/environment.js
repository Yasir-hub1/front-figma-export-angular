// src/utils/environment.js
// Configuración de variables de entorno para la aplicación

const environment = {
    apiUrl: process.env.REACT_APP_API_URL || 'http://159.203.124.196/api/api',
    socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://159.203.124.196',
    appName: 'Figma Angular Generator'
  };
  
  export default environment;
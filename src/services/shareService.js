// frontend/src/services/shareService.js - CORREGIDO
import axiosInstance from '../utils/axiosConfig';

const shareService = {
  // Generar enlace de compartir
  generateShareLink: async (projectId, settings) => {
    try {
      console.log('🔗 Generando enlace de compartir:', { projectId, settings });
      
      // CAMBIAR ESTA LÍNEA:
      const response = await axiosInstance.post(`/share/${projectId}`, settings);
      
      console.log('✅ Enlace de compartir generado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error generando enlace de compartir:', error);
      throw new Error(error.response?.data?.message || 'Error al generar enlace de compartir');
    }
  },

  // Unirse a proyecto mediante enlace (ESTA YA ESTÁ CORRECTA)
  joinProjectByLink: async (shareToken) => {
    try {
      console.log('🤝 Uniéndose a proyecto con token:', shareToken);
      
      // Verificar si hay token en localStorage
      const token = localStorage.getItem('token');
      console.log('🔑 Token en localStorage:', token ? 'Presente' : 'No presente');
      
      const response = await axiosInstance.get(`/share/join/${shareToken}`);
      
      console.log('✅ Respuesta de unirse al proyecto:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error uniéndose al proyecto:', error);
      throw new Error(error.response?.data?.message || 'Error al unirse al proyecto');
    }
  },

  // Actualizar configuración de compartir
  updateShareSettings: async (projectId, settings) => {
    try {
      console.log('⚙️ Actualizando configuración de compartir:', { projectId, settings });
      
      // CAMBIAR ESTA LÍNEA:
      const response = await axiosInstance.put(`/share/${projectId}/settings`, settings);
      
      console.log('✅ Configuración de compartir actualizada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error actualizando configuración de compartir:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar configuración de compartir');
    }
  },

  // Revocar enlace de compartir
  revokeShareLink: async (projectId) => {
    try {
      console.log('🚫 Revocando enlace de compartir:', projectId);
      
      // CAMBIAR ESTA LÍNEA:
      const response = await axiosInstance.delete(`/share/${projectId}`);
      
      console.log('✅ Enlace de compartir revocado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error revocando enlace de compartir:', error);
      throw new Error(error.response?.data?.message || 'Error al revocar enlace de compartir');
    }
  },

  // Obtener información de compartir
  getShareInfo: async (projectId) => {
    try {
      console.log('📊 Obteniendo información de compartir:', projectId);
      
      // CAMBIAR ESTA LÍNEA:
      const response = await axiosInstance.get(`/share/${projectId}/info`);
      
      console.log('✅ Información de compartir obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo información de compartir:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener información de compartir');
    }
  }
};

export default shareService;
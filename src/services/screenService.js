// src/services/screenService.js - CORREGIDO
import axios from '../utils/axiosConfig';

const screenService = {
  // Obtener todas las screens de un proyecto
  getScreens: async (projectId) => {
    try {
      console.log('Obteniendo screens para proyecto:', projectId);
      const response = await axios.get(`/screens/project/${projectId}`);
      console.log('Screens obtenidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en getScreens:', error);
      throw error.response?.data || { message: 'Error al obtener screens' };
    }
  },

  // Obtener una screen específica
  getScreen: async (screenId) => {
    try {
      const response = await axios.get(`/screens/${screenId}`);
      return response.data;
    } catch (error) {
      console.error('Error en getScreen:', error);
      throw error.response?.data || { message: 'Error al obtener screen' };
    }
  },

  // Crear una nueva screen
  createScreen: async (projectId, screenData) => {
    try {
      console.log('Creando screen:', { projectId, screenData });
      const response = await axios.post('/screens', {
        ...screenData,
        projectId: projectId
      });
      console.log('Screen creada:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en createScreen:', error);
      throw error.response?.data || { message: 'Error al crear screen' };
    }
  },

  // Actualizar una screen
  updateScreen: async ( screenId, screenData) => {
    try {
      const response = await axios.put(`/screens/${screenId}`, screenData);
      return response.data;
    } catch (error) {
      console.error('Error en updateScreen:', error);
      throw error.response?.data || { message: 'Error al actualizar screen' };
    }
  },

  // Eliminar una screen
  deleteScreen: async (projectId, screenId) => {
    try {
      console.log("SCREEND ID ",screenId);
      const response = await axios.delete(`/screens/${screenId}`);
      return response.data;
    } catch (error) {
      console.error('Error en deleteScreen:', error);
      throw error.response?.data || { message: 'Error al eliminar screen' };
    }
  },

  // Reordenar screens
  reorderScreens: async (projectId, screenIds) => {
    try {
      const response = await axios.put(`/screens/project/${projectId}/reorder`, {
        screenIds: screenIds
      });
      return response.data;
    } catch (error) {
      console.error('Error en reorderScreens:', error);
      throw error.response?.data || { message: 'Error al reordenar screens' };
    }
  }
};

export default screenService;
// src/services/elementService.js - CORREGIDO
import axios from '../utils/axiosConfig';

const API_BASE_URL = 'http://159.203.124.196/api';

const elementService = {
  // CORRECCIÓN: Crear un nuevo elemento (agregando screenId al payload)
  createElement: async (screenId, elementData) => {
    try {
      // Agregar screenId a los datos del elemento
      const elementWithScreen = {
        ...elementData,
        screenId: screenId
      };
      
      const response = await axios.post(`/components`, elementWithScreen);
      return response.data;
    } catch (error) {
      console.error('Error en createElement:', error);
      throw new Error(error.response?.data?.message || 'Error al crear elemento');
    }
  },

  // Obtener elementos de una screen (esta ya está correcta)
  getElements: async (screenId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/components/screen/${screenId}`);
      return response.data;
    } catch (error) {
      console.error('Error en getElements:', error);
      // Si es 404, devolver array vacío en lugar de error
      if (error.response?.status === 404) {
        return [];
      }
      throw new Error(error.response?.data?.message || 'Error al obtener elementos');
    }
  },

  // CORRECCIÓN: Actualizar un elemento (agregando screenId si es necesario)
  updateElement: async (elementId, elementData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/components/${elementId}`, elementData);
      return response.data;
    } catch (error) {
      console.error('Error en updateElement:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar elemento');
    }
  },

  // Eliminar un elemento (mantener como está)
  deleteElement: async (elementId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/components/${elementId}`);
      return response.data;
    } catch (error) {
      console.error('Error en deleteElement:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar elemento');
    }
  },

  // CORRECCIÓN: duplicateElement - igual que delete
  duplicateElement: async (elementId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/components/${elementId}/duplicate`);
      return response.data;
    } catch (error) {
      console.error('Error en duplicateElement:', error);
      throw new Error(error.response?.data?.message || 'Error al duplicar elemento');
    }
  },

  exportToFlutter: async (screenId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/components/export/flutter/${screenId}`);
      return response.data;
    } catch (error) {
      console.error('Error en exportToFlutter:', error);
      throw new Error(error.response?.data?.message || 'Error al exportar a Flutter');
    }
  }
};

export default elementService;
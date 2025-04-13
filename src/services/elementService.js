// src/services/elementService.js
import axios from '../utils/axiosConfig';

const elementService = {
  // Obtener elementos de un proyecto
  getElements: async (projectId) => {
    try {
      const response = await axios.get(`/components/project/${projectId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener elementos' };
    }
  },

  // Crear un nuevo elemento
  createElement: async (elementData) => {
    try {
      const response = await axios.post('/components', elementData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al crear el elemento' };
    }
  },

  // Actualizar un elemento
  updateElement: async (id, elementData) => {
    try {
      const response = await axios.put(`/components/${id}`, elementData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar el elemento' };
    }
  },

  // Eliminar un elemento
  deleteElement: async (id) => {
    try {
      const response = await axios.delete(`/components/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al eliminar el elemento' };
    }
  },

  // Duplicar un elemento
  duplicateElement: async (id) => {
    try {
      const response = await axios.post(`/components/${id}/duplicate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al duplicar el elemento' };
    }
  },

  // Exportar a Angular
  exportToAngular: async (projectId) => {
    try {
      const response = await axios.get(`/components/export/${projectId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al exportar a Angular' };
    }
  }
};

export default elementService;
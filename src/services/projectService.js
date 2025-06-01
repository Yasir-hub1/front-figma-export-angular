// src/services/projectService.js - CORREGIDO
import axios from '../utils/axiosConfig';

const projectService = {
  // Obtener todos los proyectos
  getProjects: async () => {
    try {
      const response = await axios.get('/projects');
      return response.data;
    } catch (error) {
      console.error('Error en getProjects:', error);
      throw error.response?.data || { message: 'Error al obtener proyectos' };
    }
  },

  // CORRECCIÓN: Obtener un proyecto por ID 
  getProject: async (id) => {
    try {
      console.log('Obteniendo proyecto con ID:', id);
      const response = await axios.get(`/projects/${id}`);
      console.log('Proyecto obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en getProject:', error);
      throw error.response?.data || { message: 'Error al obtener el proyecto' };
    }
  },

  // Crear un nuevo proyecto
  createProject: async (projectData) => {
    try {
      const response = await axios.post('/projects', projectData);
      return response.data;
    } catch (error) {
      console.error('Error en createProject:', error);
      throw error.response?.data || { message: 'Error al crear el proyecto' };
    }
  },

  // Actualizar un proyecto
  updateProject: async (id, projectData) => {
    try {
      const response = await axios.put(`/projects/${id}`, projectData);
      return response.data;
    } catch (error) {
      console.error('Error en updateProject:', error);
      throw error.response?.data || { message: 'Error al actualizar el proyecto' };
    }
  },

  // Eliminar un proyecto
  deleteProject: async (id) => {
    try {
      const response = await axios.delete(`/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error en deleteProject:', error);
      throw error.response?.data || { message: 'Error al eliminar el proyecto' };
    }
  },

  // Añadir colaborador a un proyecto
  addCollaborator: async (projectId, userId) => {
    try {
      console.log('Añadiendo colaborador:', { projectId, userId });
      
      const response = await axios.post(
        `/projects/${projectId}/collaborators`, 
        { collaboratorId: userId }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error completo en addCollaborator:', error);
      throw error.response?.data || { message: 'Error al añadir colaborador' };
    }
  },

  // Obtener colaboradores de un proyecto
  getCollaborators: async (projectId) => {
    try {
      const response = await axios.get(`/projects/${projectId}/collaborators`);
      return response.data;
    } catch (error) {
      console.error('Error en getCollaborators:', error);
      throw error.response?.data || { message: 'Error al obtener colaboradores' };
    }
  },

  // Eliminar colaborador de un proyecto
  removeCollaborator: async (projectId, userId) => {
    try {
      const response = await axios.delete(`/projects/${projectId}/collaborators/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error en removeCollaborator:', error);
      throw error.response?.data || { message: 'Error al eliminar colaborador' };
    }
  },

  // Buscar usuarios para añadir como colaboradores
  searchUsers: async (searchTerm) => {
    try {
      const response = await axios.get(`/auth/search?query=${searchTerm}`);
      return response.data;
    } catch (error) {
      console.error('Error en searchUsers:', error);
      throw error.response?.data || { message: 'Error al buscar usuarios' };
    }
  },

  // Obtener usuarios activos en un proyecto
  getActiveUsers: async (projectId) => {
    try {
      const response = await axios.get(`/projects/${projectId}/active-users`);
      return response.data;
    } catch (error) {
      console.error('Error en getActiveUsers:', error);
      throw error.response?.data || { message: 'Error al obtener usuarios activos' };
    }
  }
};

export default projectService;
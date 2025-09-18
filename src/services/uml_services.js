// src/services/uml_services.js - Servicios para UML
import axios from '../utils/axiosConfig';

// No necesitamos API_BASE_URL porque axios ya está configurado con la baseURL

// Servicio para manejar diagramas
const diagramService = {
  // Obtener todos los diagramas de un proyecto
  getDiagrams: async (projectId) => {
    try {
      console.log('Obteniendo diagramas para proyecto:', projectId);
      const response = await axios.get(`/diagrams/project/${projectId}`);
      console.log('Diagramas obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en getDiagrams:', error);
      throw error.response?.data || { message: 'Error al obtener diagramas' };
    }
  },

  // Obtener un diagrama específico
  getDiagram: async (diagramId) => {
    try {
      const response = await axios.get(`/diagrams/${diagramId}`);
      return response.data;
    } catch (error) {
      console.error('Error en getDiagram:', error);
      throw error.response?.data || { message: 'Error al obtener diagrama' };
    }
  },

  // Crear un nuevo diagrama
  createDiagram: async (projectId, diagramData) => {
    try {
      console.log('Creando diagrama:', { projectId, diagramData });
      const response = await axios.post('/diagrams', {
        ...diagramData,
        projectId: projectId
      });
      console.log('Diagrama creado:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en createDiagram:', error);
      throw error.response?.data || { message: 'Error al crear diagrama' };
    }
  },

  // Actualizar un diagrama
  updateDiagram: async (diagramId, diagramData) => {
    try {
      const response = await axios.put(`/diagrams/${diagramId}`, diagramData);
      return response.data;
    } catch (error) {
      console.error('Error en updateDiagram:', error);
      throw error.response?.data || { message: 'Error al actualizar diagrama' };
    }
  },

  // Eliminar un diagrama
  deleteDiagram: async (diagramId) => {
    try {
      console.log("Eliminando diagrama:", diagramId);
      const response = await axios.delete(`/diagrams/${diagramId}`);
      return response.data;
    } catch (error) {
      console.error('Error en deleteDiagram:', error);
      throw error.response?.data || { message: 'Error al eliminar diagrama' };
    }
  },

  // Reordenar diagramas
  reorderDiagrams: async (projectId, diagramIds) => {
    try {
      const response = await axios.put(`/diagrams/project/${projectId}/reorder`, {
        diagramIds: diagramIds
      });
      return response.data;
    } catch (error) {
      console.error('Error en reorderDiagrams:', error);
      throw error.response?.data || { message: 'Error al reordenar diagramas' };
    }
  }
};

// Servicio para manejar elementos UML
const umlElementService = {
  // Obtener elementos UML y conexiones de un diagrama
  getUMLElements: async (diagramId) => {
    try {
      console.log('Obteniendo elementos UML para diagrama:', diagramId);
      const response = await axios.get(`/uml-elements/diagram/${diagramId}`);
      console.log('Elementos UML obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en getUMLElements:', error);
      // Si es 404, devolver arrays vacíos en lugar de error
      if (error.response?.status === 404) {
        return { elements: [], connections: [] };
      }
      throw error.response?.data || { message: 'Error al obtener elementos UML' };
    }
  },

  // Crear un nuevo elemento UML
  createUMLElement: async (diagramId, elementData) => {
    try {
      const elementWithDiagram = {
        ...elementData,
        diagramId: diagramId
      };

      console.log('Creating UML element via service:', elementWithDiagram);
      const response = await axios.post(`/uml-elements`, elementWithDiagram);
      console.log('UML element service response:', response.data);
      
      // Return the element from the response
      return response.data.element || response.data;
    } catch (error) {
      console.error('Error en createUMLElement:', error);
      throw new Error(error.response?.data?.message || 'Error al crear elemento UML');
    }
  },

  // Actualizar un elemento UML
  updateUMLElement: async (elementId, elementData) => {
    try {
      console.log('Updating UML element via service:', elementId, elementData);
      const response = await axios.put(`/uml-elements/${elementId}`, elementData);
      console.log('UML element update response:', response.data);
      
      // Return the element from the response
      return response.data.element || response.data;
    } catch (error) {
      console.error('Error en updateUMLElement:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar elemento UML');
    }
  },

  // Eliminar un elemento UML
  deleteUMLElement: async (elementId) => {
    try {
      console.log('Deleting UML element via service:', elementId);
      const response = await axios.delete(`/uml-elements/${elementId}`);
      console.log('UML element delete response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en deleteUMLElement:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar elemento UML');
    }
  },

  // Duplicar un elemento UML
  duplicateUMLElement: async (elementId) => {
    try {
      console.log('🔄 Duplicating UML element via service:', elementId);
      console.log('🔄 Request URL:', `/uml-elements/${elementId}/duplicate`);
      
      const response = await axios.post(`/uml-elements/${elementId}/duplicate`, {
        offsetX: 20,
        offsetY: 20
      });
      
      console.log('🔄 UML element duplicate response:', response.data);
      console.log('🔄 Response status:', response.status);
      console.log('🔄 Element in response:', response.data.element);
      
      // Return the element from the response
      return response.data.element || response.data;
    } catch (error) {
      console.error('❌ Error en duplicateUMLElement:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Error al duplicar elemento UML');
    }
  },

  // Crear una nueva conexión
  createConnection: async (diagramId, connectionData) => {
    try {
      console.log('Creating UML connection via service:', diagramId, connectionData);
      
      const connectionWithDiagram = {
        ...connectionData,
        diagramId: diagramId
      };

      console.log('Connection data to send:', connectionWithDiagram);
      const response = await axios.post(`/uml-connections`, connectionWithDiagram);
      console.log('UML connection service response:', response.data);
      
      // Return the connection from the response
      return response.data.connection || response.data;
    } catch (error) {
      console.error('Error en createConnection:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Error al crear conexión UML');
    }
  },

  // Actualizar una conexión
  updateConnection: async (connectionId, connectionData) => {
    try {
      console.log('Updating UML connection via service:', connectionId, connectionData);
      const response = await axios.put(`/uml-connections/${connectionId}`, connectionData);
      console.log('UML connection update response:', response.data);
      
      // Return the connection from the response
      return response.data.connection || response.data;
    } catch (error) {
      console.error('Error en updateConnection:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar conexión');
    }
  },

  // Eliminar una conexión
  deleteConnection: async (connectionId) => {
    try {
      console.log('Deleting UML connection via service:', connectionId);
      const response = await axios.delete(`/uml-connections/${connectionId}`);
      console.log('UML connection delete response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en deleteConnection:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar conexión');
    }
  },

  // Exportar diagrama a diferentes formatos UML
  exportToUML: async (diagramId) => {
    try {
      console.log('Iniciando exportación UML para diagrama:', diagramId);

      if (!diagramId) {
        throw new Error('ID de diagrama no válido para exportación');
      }

      const exportPayload = {
        formats: ['plantuml', 'xmi', 'json', 'image'],
        includeStyles: true,
        includeMetadata: true
      };

      console.log('Enviando request a:', `/uml-elements/export/uml/${diagramId}`);

      const response = await axios.post(
        `/uml-elements/export/uml/${diagramId}`,
        exportPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      console.log('Respuesta de exportación UML:', {
        status: response.status,
        data: response.data ? 'Datos recibidos' : 'Sin datos',
        diagramName: response.data?.diagramName,
        elementsCount: response.data?.elementsCount,
        hasPlantUML: !!response.data?.plantUML,
        hasXMI: !!response.data?.xmi
      });

      if (!response.data) {
        throw new Error('No se recibieron datos del servidor');
      }

      if (!response.data.plantUML && !response.data.xmi && !response.data.json) {
        throw new Error('El servidor no devolvió código UML válido');
      }

      return response.data;
    } catch (error) {
      console.error('Error en exportToUML:', error);

      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('No se encontró el diagrama para exportar');
        } else if (error.response.status === 403) {
          throw new Error('No tienes permisos para exportar este diagrama');
        } else if (error.response.status === 401) {
          throw new Error('No estás autenticado. Inicia sesión de nuevo');
        } else if (error.response.status === 500) {
          throw new Error('Error del servidor al procesar la exportación: ' +
                         (error.response.data?.message || 'Error interno'));
        } else {
          throw new Error(`Error ${error.response.status}: ${error.response.data?.message || error.response.statusText}`);
        }
      }

      throw new Error(error.response?.data?.message || error.message || 'Error al exportar a UML');
    }
  },

  // Generar código desde diagrama UML
  generateCode: async (diagramId, language = 'java') => {
    try {
      const response = await axios.post(`/uml-elements/generate-code/${diagramId}`, {
        language: language,
        includeComments: true,
        includeGettersSetters: true
      });
      return response.data;
    } catch (error) {
      console.error('Error al generar código:', error);
      throw new Error(error.response?.data?.message || 'Error al generar código');
    }
  },

  // Importar desde archivo UML
  importFromUML: async (diagramId, fileData) => {
    try {
      const formData = new FormData();
      formData.append('file', fileData);

      const response = await axios.post(`/uml-elements/import/${diagramId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al importar UML:', error);
      throw new Error(error.response?.data?.message || 'Error al importar archivo UML');
    }
  },

  // Validar diagrama UML
  validateDiagram: async (diagramId) => {
    try {
      const response = await axios.post(`/uml-elements/validate/${diagramId}`);
      return response.data;
    } catch (error) {
      console.error('Error al validar diagrama:', error);
      throw new Error(error.response?.data?.message || 'Error al validar diagrama');
    }
  }
};

// Exportar servicios
export { diagramService, umlElementService };
export default { diagramService, umlElementService };
// src/services/elementService.js - CORREGIDO
import axios from '../utils/axiosConfig';

const API_BASE_URL = 'http://localhost:5000/api';

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

  // exportToFlutter: async (screenId) => {
  //   try {
  //     const response = await axios.post(`${API_BASE_URL}/components/export/flutter/${screenId}`);
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error en exportToFlutter:', error);
  //     throw new Error(error.response?.data?.message || 'Error al exportar a Flutter');
  //   }
  // },

// Método exportToFlutter corregido para tu elementService.js

exportToFlutter: async (screenId) => {
  try {
    console.log('📤 Iniciando exportación a Flutter para screen:', screenId);
    
    // Verificar que el screenId es válido
    if (!screenId) {
      throw new Error('ID de screen no válido para exportación');
    }
    
    // Primero obtenemos los elementos de la pantalla para verificar que hay elementos para exportar
    try {
      const elements = await elementService.getElements(screenId);
      
      if (!elements || elements.length === 0) {
        console.log('⚠️ No hay elementos para exportar en esta pantalla - continuando con pantalla vacía');
      } else {
        console.log(`✅ Se exportarán ${elements.length} elementos con sus estilos y posiciones`);
      }
    } catch (elementsError) {
      console.log('⚠️ No se pudieron obtener elementos, continuando con exportación...');
    }
    
    // Preparar payload con indicaciones explícitas para incluir estilos y posiciones
    const exportPayload = {
      includeStyles: true,
      includePositions: true
    };
    
    console.log('🔄 Enviando request a:', `${API_BASE_URL}/components/export/flutter/${screenId}`);
    console.log('📦 Payload:', exportPayload);
    
    // CORRECCIÓN: Usar la URL correcta que coincida con tu backend
    const response = await axios.post(
      `${API_BASE_URL}/components/export/flutter/${screenId}`,  // URL corregida
      exportPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // IMPORTANTE: Asegurar que se envía el token de autenticación
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    console.log('✅ Respuesta del servidor:', {
      status: response.status,
      data: response.data ? 'Datos recibidos' : 'Sin datos',
      screenName: response.data?.screenName,
      elementsCount: response.data?.elementsCount,
      hasWidget: !!response.data?.widget,
      hasScreen: !!response.data?.screen,
      hasPubspec: !!response.data?.pubspec
    });
    
    // Validar que recibimos datos válidos
    if (!response.data) {
      throw new Error('No se recibieron datos del servidor');
    }
    
    if (!response.data.screen && !response.data.widget) {
      throw new Error('El servidor no devolvió código Flutter válido');
    }
    
    console.log('✅ Datos de exportación recibidos correctamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error en exportToFlutter:', error);
    
    // Log detallado del error para debugging
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    // Mejorar el mensaje de error para ser más específico
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('No se encontró la pantalla para exportar');
      } else if (error.response.status === 403) {
        throw new Error('No tienes permisos para exportar esta pantalla');
      } else if (error.response.status === 401) {
        throw new Error('No estás autenticado. Inicia sesión de nuevo');
      } else if (error.response.status === 500) {
        throw new Error('Error del servidor al procesar la exportación: ' +
                       (error.response.data?.message || 'Error interno'));
      } else {
        throw new Error(`Error ${error.response.status}: ${error.response.data?.message || error.response.statusText}`);
      }
    }
    
    throw new Error(error.response?.data?.message || error.message || 'Error al exportar a Flutter');
  }
}



  
};

export default elementService;
// src/context/EditorContext.js - CON SOCKET.IO INTEGRADO
import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import projectService from '../services/projectService';
import screenService from '../services/screenService';
import elementService from '../services/elementService';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const EditorContext = createContext();

const initialState = {
  project: null,
  screens: [],
  currentScreen: null,
  elements: [], // Elementos de la screen actual
  selectedElement: null,
  loading: true,
  error: null,
  zoom: 1,
  position: { x: 0, y: 0 },
  gridVisible: false,
  snapToGrid: false,
  exportModalOpen: false,
  exportContent: null,
  exportLoading: false,
  elementInteractions: {},
  // Estados de Socket.IO
  socket: null,
  connected: false,
  users: []
};

function editorReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_PROJECT':
      return { ...state, project: action.payload };
    
    case 'SET_SCREENS':
      // NORMALIZAR screens para estructura consistente
      const normalizedScreens = action.payload.map(screen => {
        if (screen.screen) {
          // Si tiene estructura anidada, usar la interna
          return screen.screen;
        }
        return screen;
      });
      return { ...state, screens: normalizedScreens };
    
    case 'SET_CURRENT_SCREEN':
      // NORMALIZAR currentScreen
      const normalizedCurrentScreen = action.payload?.screen || action.payload;
      return { 
        ...state, 
        currentScreen: normalizedCurrentScreen,
        elements: [], 
        selectedElement: null 
      };
    
    case 'ADD_SCREEN':
      // NORMALIZAR nueva screen antes de añadir
      const newScreen = action.payload?.screen || action.payload;
      // Verificar que no exista ya (prevenir duplicados)
      const exists = state.screens.some(screen => screen._id === newScreen._id);
      if (exists) {
        console.log('⚠️ Screen ya existe, no se agrega:', newScreen._id);
        return state;
      }
      return { ...state, screens: [...state.screens, newScreen] };
    
    case 'UPDATE_SCREEN':
      const updatedScreen = action.payload?.screen || action.payload;
      return {
        ...state,
        screens: state.screens.map(screen =>
          screen._id === updatedScreen._id ? updatedScreen : screen
        ),
        currentScreen: state.currentScreen?._id === updatedScreen._id ? updatedScreen : state.currentScreen
      };
    
    case 'DELETE_SCREEN':
      const filteredScreens = state.screens.filter(screen => screen._id !== action.payload);
      return {
        ...state,
        screens: filteredScreens,
        currentScreen: state.currentScreen?._id === action.payload 
          ? (filteredScreens.length > 0 ? filteredScreens[0] : null) 
          : state.currentScreen,
        elements: state.currentScreen?._id === action.payload ? [] : state.elements
      };
    
    case 'SET_ELEMENTS':
      return { ...state, elements: action.payload || [] };
    
    case 'ADD_ELEMENT':
      return { ...state, elements: [...state.elements, action.payload] };
    
    case 'UPDATE_ELEMENT':
      return {
        ...state,
        elements: state.elements.map(element =>
          element._id === action.payload._id ? action.payload : element
        ),
        selectedElement: state.selectedElement?._id === action.payload._id ? action.payload : state.selectedElement
      };
    
    case 'DELETE_ELEMENT':
      return {
        ...state,
        elements: state.elements.filter(element => element._id !== action.payload),
        selectedElement: state.selectedElement?._id === action.payload ? null : state.selectedElement
      };
    
    case 'SELECT_ELEMENT':
      return { ...state, selectedElement: action.payload };
    
    case 'SET_VIEWPORT':
      return { ...state, zoom: action.payload.zoom, position: action.payload.position };
    
    case 'SET_GRID_VISIBLE':
      return { ...state, gridVisible: action.payload };
    
    case 'SET_SNAP_TO_GRID':
      return { ...state, snapToGrid: action.payload };
    
    case 'SET_EXPORT_MODAL':
      return { ...state, exportModalOpen: action.payload.open, exportContent: action.payload.content };
    
    case 'SET_EXPORT_LOADING':
      return { ...state, exportLoading: action.payload };
    
    case 'SET_ELEMENT_INTERACTION':
      return {
        ...state,
        elementInteractions: {
          ...state.elementInteractions,
          [action.payload.elementId]: action.payload.interaction
        }
      };
    
    case 'REMOVE_ELEMENT_INTERACTION':
      const { [action.payload]: removed, ...remainingInteractions } = state.elementInteractions;
      return { ...state, elementInteractions: remainingInteractions };
    
    // Acciones de Socket.IO
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };
    
    case 'SET_USERS':
      return { ...state, users: action.payload };
    
    default:
      return state;
  }
}

export function EditorProvider({ children, projectId }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const { currentUser } = useAuth();
  
  console.log('🏗️ EditorProvider iniciado con projectId:', projectId);
  console.log('- Tipo de projectId:', typeof projectId);
  console.log('- Es válido:', /^[a-f\d]{24}$/i.test(projectId));

  // Inicializar Socket.IO
  useEffect(() => {
    if (!projectId || !currentUser) return;

    console.log('🔌 Inicializando Socket.IO para proyecto:', projectId);

    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Conectado a Socket.IO');
      dispatch({ type: 'SET_CONNECTED', payload: true });
      
      // Autenticar
      newSocket.emit('authenticate', {
        userId: currentUser.id,
        username: currentUser.username,
        token: localStorage.getItem('token')
      });
      
      // Unirse al proyecto
      newSocket.emit('join-project', {
        projectId: projectId
      });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Desconectado de Socket.IO');
      dispatch({ type: 'SET_CONNECTED', payload: false });
    });

    newSocket.on('user-joined', (data) => {
      console.log('👤 Usuario se unió al proyecto:', data.user);
      dispatch({ type: 'SET_USERS', payload: data.activeUsers });
    });
    
    newSocket.on('user-left', (data) => {
      console.log('👋 Usuario abandonó el proyecto:', data.user);
      dispatch({ type: 'SET_USERS', payload: data.activeUsers });
    });

    // Manejar actualizaciones de diseño
    newSocket.on('design-updated', (data) => {
      console.log('🔄 Actualización de diseño recibida:', data);
      
      if (data.type === 'element-added') {
        dispatch({ type: 'ADD_ELEMENT', payload: data.element });
      } else if (data.type === 'element-updated') {
        dispatch({ type: 'UPDATE_ELEMENT', payload: data.element });
      } else if (data.type === 'element-deleted') {
        dispatch({ type: 'DELETE_ELEMENT', payload: data.elementId });
      } else if (data.type === 'screen-added') {
        // NORMALIZAR screen antes de dispatch
        const screen = data.screen?.screen || data.screen;
        dispatch({ type: 'ADD_SCREEN', payload: screen });
      } else if (data.type === 'screen-updated') {
        const screen = data.screen?.screen || data.screen;
        dispatch({ type: 'UPDATE_SCREEN', payload: screen });
      } else if (data.type === 'screen-deleted') {
        dispatch({ type: 'DELETE_SCREEN', payload: data.screenId });
      }
    });

     // NUEVOS EVENTOS ESPECÍFICOS PARA MEJOR MANEJO COLABORATIVO
     newSocket.on('screen-added-collaborative', (data) => {
      console.log('📱 Screen añadida colaborativamente:', data);
      const screen = data.screen?.screen || data.screen;
      dispatch({ type: 'ADD_SCREEN', payload: screen });
    });

    newSocket.on('screen-updated-collaborative', (data) => {
      console.log('📝 Screen actualizada colaborativamente:', data);
      const screen = data.screen?.screen || data.screen;
      dispatch({ type: 'UPDATE_SCREEN', payload: screen });
    });

    newSocket.on('screen-deleted-collaborative', (data) => {
      console.log('🗑️ Screen eliminada colaborativamente:', data);
      dispatch({ type: 'DELETE_SCREEN', payload: data.screenId });
    });

    newSocket.on('element-added-collaborative', (data) => {
      console.log('➕ Elemento añadido colaborativamente:', data);
      dispatch({ type: 'ADD_ELEMENT', payload: data.element });
    });

    newSocket.on('element-updated-collaborative', (data) => {
      console.log('✏️ Elemento actualizado colaborativamente:', data);
      dispatch({ type: 'UPDATE_ELEMENT', payload: data.element });
    });

    newSocket.on('element-deleted-collaborative', (data) => {
      console.log('🗑️ Elemento eliminado colaborativamente:', data);
      dispatch({ type: 'DELETE_ELEMENT', payload: data.elementId });
    });
  
      // NUEVO: Manejo de sincronización
      newSocket.on('sync-requested', (data) => {
        console.log('🔄 Solicitud de sincronización recibida:', data);
        
        // Si tenemos elementos en la screen solicitada, enviarlos
        if (data.screenId === state.currentScreen?._id && state.elements.length > 0) {
          newSocket.emit('sync-response', {
            projectId: projectId,
            screenId: data.screenId,
            elements: state.elements,
            requestedBySocketId: data.requestedBy.socketId
          });
        }
      });
  
      newSocket.on('sync-data', (data) => {
        console.log('📥 Datos de sincronización recibidos:', data);
        
        // Solo aplicar si es para la screen actual
        if (data.screenId === state.currentScreen?._id) {
          dispatch({ type: 'SET_ELEMENTS', payload: data.elements });
        }
      });

    // Manejar interacciones con elementos
    newSocket.on('element-interaction', (data) => {
      console.log('🎯 Interacción recibida:', data);
      dispatch({
        type: 'SET_ELEMENT_INTERACTION',
        payload: {
          elementId: data.elementId,
          interaction: {
            userId: data.userId,
            username: data.username,
            action: data.action
          }
        }
      });
    });

    newSocket.on('element-interaction-end', (data) => {
      console.log('🏁 Fin de interacción:', data);
      dispatch({ type: 'REMOVE_ELEMENT_INTERACTION', payload: data.elementId });
    });

    dispatch({ type: 'SET_SOCKET', payload: newSocket });

    return () => {
      console.log('🔌 Cerrando conexión Socket.IO');
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [projectId, currentUser]);

  // Cargar proyecto inicial
  useEffect(() => {
    if (projectId) {
      console.log('🚀 Iniciando carga del proyecto:', projectId);
      loadProject();
    } else {
      console.error('❌ No se proporcionó projectId al EditorProvider');
      dispatch({ type: 'SET_ERROR', payload: 'ID de proyecto no válido' });
    }
  }, [projectId]);

  // Cargar elementos cuando cambia la screen actual
  useEffect(() => {
    if (state.currentScreen?._id) {
      fetchElements(state.currentScreen._id);
    }
  }, [state.currentScreen?._id, projectId]);

  const loadProject = async () => {
    try {
      console.log('🔄 Iniciando carga del proyecto:', projectId);
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      if (!projectId) {
        throw new Error('ID de proyecto no proporcionado');
      }
      
      console.log('📁 Obteniendo datos del proyecto...');
      const project = await projectService.getProject(projectId);
      console.log('✅ Proyecto obtenido:', project.name);
      dispatch({ type: 'SET_PROJECT', payload: project });
      
      console.log('📱 Obteniendo screens del proyecto...');
      const screens = await screenService.getScreens(projectId);
      console.log(`✅ ${screens.length} screens obtenidas`);
      
      // Si no hay screens, crear una por defecto
      if (screens.length === 0) {
        console.log('🆕 Creando screen por defecto...');
        try {
          const defaultScreen = await screenService.createScreen(projectId, {
            name: 'Pantalla Principal',
            canvas: {
              width: project.canvas?.width || 360,
              height: project.canvas?.height || 640,
              background: '#FFFFFF'
            }
          });
          console.log('✅ Screen por defecto creada:', defaultScreen.name);
          
          const updatedScreens = [defaultScreen];
          dispatch({ type: 'SET_SCREENS', payload: updatedScreens });
          dispatch({ type: 'SET_CURRENT_SCREEN', payload: defaultScreen });
        } catch (screenError) {
          console.error('❌ Error al crear screen por defecto:', screenError);
          dispatch({ type: 'SET_SCREENS', payload: [] });
          dispatch({ type: 'SET_ERROR', payload: 'No se pudo crear la pantalla inicial' });
        }
      } else {
        dispatch({ type: 'SET_SCREENS', payload: screens });
        console.log('🎯 Seleccionando primera screen:', screens[0].name);
        dispatch({ type: 'SET_CURRENT_SCREEN', payload: screens[0] });
      }
      
      console.log('🎉 Proyecto cargado exitosamente');
      
    } catch (error) {
      console.error('❌ Error al cargar proyecto:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Error al cargar el proyecto' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Función para cargar elementos de una screen específica
  const fetchElements = async (screenId) => {
    try {
      console.log('📦 Cargando elementos para screen:', screenId);
      
      if (!screenId) {
        console.log('⚠️ No hay screenId, limpiando elementos');
        dispatch({ type: 'SET_ELEMENTS', payload: [] });
        return;
      }
      
      const elements = await elementService.getElements(screenId);
      console.log(`✅ ${elements.length} elementos cargados para screen ${screenId}`);
      dispatch({ type: 'SET_ELEMENTS', payload: elements });
    } catch (error) {
      console.error('❌ Error al cargar elementos:', error);
      if (error.response?.status === 404 || error.message.includes('404') || error.message.includes('Not Found')) {
        console.log('📝 Screen sin elementos, estableciendo array vacío');
        dispatch({ type: 'SET_ELEMENTS', payload: [] });
      } else {
        console.error('💥 Error real al cargar elementos:', error.message);
        dispatch({ type: 'SET_ELEMENTS', payload: [] });
      }
    }
  };

  const getDataScreenForProject = async (projectId, screenId) => {
    console.log('📱 Obteniendo screens del proyecto...');
    const screens = await screenService.getScreens(projectId);
    console.log(`✅ ${screens.length} screens obtenidas`);
  
    dispatch({ type: 'SET_SCREENS', payload: screens });
  
    const selectedScreen = screens.find(screen => screen._id === screenId);
  
    if (selectedScreen) {
      console.log('🎯 Seleccionando screen:', selectedScreen.name);
      fetchElements(screenId);
      dispatch({ type: 'SET_CURRENT_SCREEN', payload: selectedScreen });
    } else {
      console.warn(`⚠️ Screen con ID ${screenId} no encontrada. Seleccionando la primera por defecto.`);
      dispatch({ type: 'SET_CURRENT_SCREEN', payload: screens[0] });
    }
  };

  // Funciones de Screen con Socket.IO
  const createScreen = async (name) => {
    try {
      const screenData = {
        name,
        canvas: {
          width: state.project?.canvas?.width || 360,
          height: state.project?.canvas?.height || 640,
          background: '#FFFFFF'
        }
      };
      
      const response = await screenService.createScreen(projectId, screenData);
      console.log('📱 Respuesta del servidor al crear screen:', response);
      
      // NORMALIZAR respuesta del servidor
      const newScreen = response?.screen || response;
      
      // Actualizar estado local primero
      dispatch({ type: 'ADD_SCREEN', payload: newScreen });
      
      // Notificar a otros usuarios
      if (state.socket && state.connected) {
        state.socket.emit('update-design', {
          projectId: projectId,
          type: 'screen-added',
          screen: newScreen // Enviar screen normalizada
        });
      }
      
      // Seleccionar la nueva screen
      setCurrentScreen(newScreen);
      console.log('✅ Screen creada y seleccionada:', newScreen.name);
      
      return newScreen;
    } catch (error) {
      console.error('❌ Error al crear screen:', error);
      throw error;
    }
  };
  const updateScreen = async (screenId, screenData) => {
    try {
      console.log('🔄 Actualizando screen:', screenId, screenData);
      const response = await screenService.updateScreen(screenId, screenData);
      
      // NORMALIZAR respuesta
      const updatedScreen = response?.screen || response;
      
      // Actualizar estado local
      dispatch({ type: 'UPDATE_SCREEN', payload: updatedScreen });
      
      // Notificar a otros usuarios
      if (state.socket && state.connected) {
        state.socket.emit('update-design', {
          projectId: projectId,
          type: 'screen-updated',
          screen: updatedScreen
        });
      }
      
      return updatedScreen;
    } catch (error) {
      console.error('❌ Error al actualizar screen:', error);
      throw error;
    }
  };

  const deleteScreen = async (screenId) => {
    try {
      await screenService.deleteScreen(projectId, screenId);
      
      // Actualizar estado local
      dispatch({ type: 'DELETE_SCREEN', payload: screenId });
      
      // Notificar a otros usuarios
      if (state.socket && state.connected) {
        state.socket.emit('update-design', {
          projectId: projectId,
          type: 'screen-deleted',
          screenId: screenId
        });
      }
    } catch (error) {
      console.error('❌ Error al eliminar screen:', error);
      throw error;
    }
  };


  // NUEVA FUNCIÓN: Solicitar sincronización cuando se cambia de screen
 const setCurrentScreen = (screen) => {
    console.log('🎯 Cambiando a screen:', screen?.name, screen?._id);
    // NORMALIZAR screen antes de dispatch
    const normalizedScreen = screen?.screen || screen;
    dispatch({ type: 'SET_CURRENT_SCREEN', payload: normalizedScreen });
  };

  // FUNCIONES ELEMENTO CORREGIDAS
  const createElement = async (elementData) => {
    try {
      if (!state.currentScreen?._id) {
        throw new Error('No hay screen seleccionada');
      }
      
      const newElement = await elementService.createElement(state.currentScreen._id, elementData);
      
      // Actualizar estado local
      dispatch({ type: 'ADD_ELEMENT', payload: newElement });
      
      // Notificar a otros usuarios
      if (state.socket && state.connected) {
        state.socket.emit('update-design', {
          projectId: projectId,
          type: 'element-added',
          element: newElement
        });
      }
      
      return newElement;
    } catch (error) {
      console.error('❌ Error al crear elemento:', error);
      throw error;
    }
  };

  const updateElement = async (elementId, elementData) => {
    try {
      if (!state.currentScreen?._id) {
        throw new Error('No hay screen seleccionada');
      }
      
      const updatedElement = await elementService.updateElement(elementId, elementData);
      
      // Actualizar estado local
      dispatch({ type: 'UPDATE_ELEMENT', payload: updatedElement });
      
      // Notificar a otros usuarios
      if (state.socket && state.connected) {
        state.socket.emit('update-design', {
          projectId: projectId,
          type: 'element-updated',
          element: updatedElement
        });
      }
      
      return updatedElement;
    } catch (error) {
      console.error('❌ Error al actualizar elemento:', error);
      throw error;
    }
  };

  const deleteElement = async (elementId) => {
    try {
      if (!state.currentScreen?._id) {
        throw new Error('No hay screen seleccionada');
      }
      
      // Eliminar del servidor primero
      await elementService.deleteElement(elementId);
      
      // Actualizar estado local
      dispatch({ type: 'DELETE_ELEMENT', payload: elementId });
      
      // Notificar a otros usuarios
      if (state.socket && state.connected) {
        state.socket.emit('update-design', {
          projectId: projectId,
          type: 'element-deleted',
          elementId
        });
      }
      
    } catch (error) {
      console.error('❌ Error al eliminar elemento:', error);
      throw error;
    }
  };
  
  const duplicateElement = async (elementId) => {
    try {
      if (!state.currentScreen?._id) {
        throw new Error('No hay screen seleccionada');
      }
      
      console.log('📋 Duplicando elemento:', {
        elementId,
        screenId: state.currentScreen._id,
        screenName: state.currentScreen.name
      });
      
      const duplicatedElement = await elementService.duplicateElement(elementId);
      
      // Actualizar estado local
      dispatch({ type: 'ADD_ELEMENT', payload: duplicatedElement });
      
      // Notificar a otros usuarios vía Socket.IO
      if (state.socket && state.connected) {
        state.socket.emit('update-design', {
          projectId: projectId,
          type: 'element-added',
          element: duplicatedElement
        });
      }
      
      console.log('✅ Elemento duplicado exitosamente:', duplicatedElement);
      return duplicatedElement;
    } catch (error) {
      console.error('❌ Error al duplicar elemento:', error);
      throw error;
    }
  };

  const selectElement = (elementId, element = null) => {
    if (elementId && element) {
      dispatch({ type: 'SELECT_ELEMENT', payload: element });
    } else if (elementId) {
      const foundElement = state.elements.find(el => el._id === elementId);
      dispatch({ type: 'SELECT_ELEMENT', payload: foundElement || null });
    } else {
      dispatch({ type: 'SELECT_ELEMENT', payload: null });
    }
  };

  // Funciones de viewport
  const updateViewport = (zoom, position) => {
    dispatch({ type: 'SET_VIEWPORT', payload: { zoom, position } });
  };

  const setGridVisible = (visible) => {
    dispatch({ type: 'SET_GRID_VISIBLE', payload: visible });
  };

  const setSnapToGrid = (snap) => {
    dispatch({ type: 'SET_SNAP_TO_GRID', payload: snap });
  };

  // Funciones de exportación
// Función exportToFlutter corregida para EditorContext.js

// Función exportToFlutter corregida para tu EditorContext.js
const exportToFlutter = async () => {
  try {
    // Verificar que hay una screen seleccionada
    if (!state.currentScreen?._id) {
      throw new Error('No hay screen seleccionada para exportar');
    }
    
    console.log('📤 Iniciando exportación a Flutter:', {
      screenId: state.currentScreen._id,
      screenName: state.currentScreen.name,
      projectId: projectId,
      elementsCount: state.elements.length
    });
    
    dispatch({ type: 'SET_EXPORT_LOADING', payload: true });
    
    // Asegurar que tenemos elementos para exportar (opcional, puede ser diseño vacío)
    if (state.elements.length === 0) {
      console.log('⚠️ La pantalla no tiene elementos, exportando diseño vacío');
    }
    
    console.log('🔄 Llamando a elementService.exportToFlutter...');
    
    // CORRECCIÓN: Usar el servicio existente con el nuevo endpoint
    const exportData = await elementService.exportToFlutter(state.currentScreen._id);
    
    console.log('✅ Datos de exportación recibidos:', {
      screenName: exportData.screenName,
      elementsCount: exportData.elementsCount,
      hasWidget: !!exportData.widget,
      hasScreen: !!exportData.screen,
      hasPubspec: !!exportData.pubspec,
      hasReadme: !!exportData.readme
    });
    
    // Validar que recibimos los datos esperados
    if (!exportData.screen && !exportData.widget) {
      throw new Error('No se recibió código Flutter válido del servidor');
    }
    
    // Actualizar el estado con los nuevos datos de exportación
    dispatch({ 
      type: 'SET_EXPORT_MODAL', 
      payload: { 
        open: true, 
        content: {
          widget: exportData.widget,           // Solo el widget componente
          screen: exportData.screen,           // Aplicación completa con MaterialApp
          pubspec: exportData.pubspec,         // pubspec.yaml
          readme: exportData.readme,           // README.md
          fullCode: exportData.fullCode,       // Código completo (para compatibilidad)
          screenName: exportData.screenName,   // Nombre de la pantalla
          projectName: exportData.projectName, // Nombre del proyecto
          elementsCount: exportData.elementsCount, // Número de elementos
          canvasSize: exportData.canvasSize,   // Tamaño del canvas
          timestamp: exportData.timestamp      // Timestamp de exportación
        }
      } 
    });
    
    console.log('🎉 Modal de exportación abierto exitosamente');
    
    return exportData;
  } catch (error) {
    console.error('❌ Error al exportar:', error);
    
    // Mejorar el manejo de errores específicos
    let errorMessage = 'Error desconocido al exportar';
    
    if (error.response) {
      // Error de axios/HTTP
      const status = error.response.status;
      const serverMessage = error.response.data?.message;
      
      switch (status) {
        case 404:
          errorMessage = `No se encontró la pantalla "${state.currentScreen?.name || 'desconocida'}" para exportar`;
          break;
        case 403:
          errorMessage = 'No tienes permisos para exportar esta pantalla';
          break;
        case 500:
          errorMessage = serverMessage || 'Error interno del servidor al generar el código Flutter';
          break;
        default:
          errorMessage = serverMessage || `Error del servidor (${status})`;
      }
    } else if (error.message) {
      if (error.message.includes('screen')) {
        errorMessage = `Error con la pantalla: ${error.message}`;
      } else if (error.message.includes('Network')) {
        errorMessage = 'Error de conexión. Verifica tu internet y vuelve a intentar';
      } else {
        errorMessage = error.message;
      }
    }
    
    // Actualizar el estado de error
    dispatch({ type: 'SET_ERROR', payload: errorMessage });
    
    // Re-lanzar el error para que el componente pueda manejarlo
    throw new Error(errorMessage);
  } finally {
    dispatch({ type: 'SET_EXPORT_LOADING', payload: false });
  }
};
  const setExportModalOpen = (open) => {
    dispatch({ 
      type: 'SET_EXPORT_MODAL', 
      payload: { open, content: state.exportContent } 
    });
  };

  // Funciones de interacción con Socket.IO
  const notifyElementInteraction = (elementId, action) => {
    if (!state.socket || !state.connected || !currentUser) return;
    
    console.log('🎯 Notificando interacción:', elementId, action);
    
    state.socket.emit('element-interaction', {
      projectId: projectId,
      elementId,
      userId: currentUser.id,
      username: currentUser.username,
      action
    });
  };

  const endElementInteraction = (elementId) => {
    if (!state.socket || !state.connected) return;
    
    console.log('🏁 Finalizando interacción:', elementId);
    
    state.socket.emit('element-interaction-end', {
      projectId: projectId,
      elementId
    });
  };

  const value = {
    // Estado
    ...state,
    
    // Funciones de Screen
    createScreen,
    updateScreen,
    deleteScreen,
    setCurrentScreen,
    fetchElements,
    
    // Funciones de Elementos
    createElement,
    updateElement,
    deleteElement,
    duplicateElement,
    selectElement,
    
    // Funciones de viewport
    updateViewport,
    setGridVisible,
    setSnapToGrid,
    
    // Funciones de exportación
    exportToFlutter,
    setExportModalOpen,
    
    // Funciones de interacción
    notifyElementInteraction,
    endElementInteraction
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor debe ser usado dentro de EditorProvider');
  }
  return context;
};

export { EditorContext };
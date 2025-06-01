// src/context/EditorContext.js - CORREGIDO
import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import  projectService  from '../services/projectService';
import  screenService  from '../services/screenService';
import  elementService  from '../services/elementService';

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
  elementInteractions: {}
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
      return { ...state, screens: action.payload };
    
    case 'SET_CURRENT_SCREEN':
      return { 
        ...state, 
        currentScreen: action.payload,
        elements: [], // Limpiar elementos cuando cambia la screen
        selectedElement: null // Deseleccionar elemento
      };
    
    case 'ADD_SCREEN':
      return { ...state, screens: [...state.screens, action.payload] };
    
    case 'UPDATE_SCREEN':
      return {
        ...state,
        screens: state.screens.map(screen =>
          screen._id === action.payload._id ? action.payload : screen
        ),
        currentScreen: state.currentScreen?._id === action.payload._id ? action.payload : state.currentScreen
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
    
    // CORREGIDO: Solo actualizar selectedElement, no hacer toggle
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
    
    default:
      return state;
  }
}

export function EditorProvider({ children, projectId }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  console.log('🏗️ EditorProvider iniciado con projectId:', projectId);
  console.log('- Tipo de projectId:', typeof projectId);
  console.log('- Es válido:', /^[a-f\d]{24}$/i.test(projectId));

  // Cargar proyecto inicial
  useEffect(() => {
    if (projectId) {
      console.log('🚀 Iniciando carga del proyecto:', projectId);
      loadProject();
    } else {
      console.error('❌ No se proporcionó projectId al EditorProvider');
      console.error('❌ projectId recibido:', projectId);
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
        // Seleccionar la primera screen por defecto
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
  }

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
      // Si es 404, solo establecer elementos vacíos sin mostrar error
      if (error.response?.status === 404 || error.message.includes('404') || error.message.includes('Not Found')) {
        console.log('📝 Screen sin elementos, estableciendo array vacío');
        dispatch({ type: 'SET_ELEMENTS', payload: [] });
      } else {
        console.error('💥 Error real al cargar elementos:', error.message);
        dispatch({ type: 'SET_ELEMENTS', payload: [] });
      }
    }
  };

  const getDataScreeForProject = async (projectId, screedId) => {
    console.log('📱 Obteniendo screens del proyecto...');
    const screens = await screenService.getScreens(projectId);
    console.log(`✅ ${screens.length} screens obtenidas`);
  
    dispatch({ type: 'SET_SCREENS', payload: screens });
  
    // Buscar la screen que coincida con el screedId
    const selectedScreen = screens.find(screen => screen._id === screedId);
  
    if (selectedScreen) {
      console.log('🎯 Seleccionando screen:', selectedScreen.name);
      fetchElements(screedId)
      dispatch({ type: 'SET_CURRENT_SCREEN', payload: selectedScreen });
    } else {
      console.warn(`⚠️ Screen con ID ${screedId} no encontrada. Seleccionando la primera por defecto.`);
      dispatch({ type: 'SET_CURRENT_SCREEN', payload: screens[0] });
    }
  };

  // Funciones de Screen
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
      
      const newScreen = await screenService.createScreen(projectId, screenData);
      dispatch({ type: 'ADD_SCREEN', payload: newScreen });
      
      // Cambiar a la nueva screen
      setCurrentScreen(newScreen);
      console.log('🎉 Nueva screen creada:', newScreen);
      getDataScreeForProject(projectId, newScreen?.screen?._id || newScreen?._id);
      return newScreen;
    } catch (error) {
      console.error('Error al crear screen:', error);
      throw error;
    }
  };

  const updateScreen = async (screenId, screenData) => {
    try {
      console.log('🔄 Actualizando screen:', projectId, screenId, screenData);
      const updatedScreen = await screenService.updateScreen(screenId, screenData);
      dispatch({ type: 'UPDATE_SCREEN', payload: updatedScreen });
      getDataScreeForProject(projectId, screenId)
      return updatedScreen;
    } catch (error) {
      console.error('Error al actualizar screen:', error);
      throw error;
    }
  };

  const deleteScreen = async (screenId) => {
    try {
      await screenService.deleteScreen(projectId, screenId);
      dispatch({ type: 'DELETE_SCREEN', payload: screenId });
    } catch (error) {
      console.error('Error al eliminar screen:', error);
      throw error;
    }
  };

  const setCurrentScreen = (screen) => {
    dispatch({ type: 'SET_CURRENT_SCREEN', payload: screen });
  };

  // Funciones de Elementos
  const createElement = async (elementData) => {
    try {
      if (!state.currentScreen?._id) {
        throw new Error('No hay screen seleccionada');
      }
      
      const newElement = await elementService.createElement(state.currentScreen._id, elementData);
      dispatch({ type: 'ADD_ELEMENT', payload: newElement });
      return newElement;
    } catch (error) {
      console.error('Error al crear elemento:', error);
      throw error;
    }
  };

  const updateElement = async (elementId, elementData) => {
    try {
      if (!state.currentScreen?._id) {
        throw new Error('No hay screen seleccionada');
      }
      
      const updatedElement = await elementService.updateElement(elementId, elementData);
      dispatch({ type: 'UPDATE_ELEMENT', payload: updatedElement });
      return updatedElement;
    } catch (error) {
      console.error('Error al actualizar elemento:', error);
      throw error;
    }
  };

  const deleteElement = async (elementId) => {
    try {
      if (!state.currentScreen?._id) {
        throw new Error('No hay screen seleccionada');
      }
      
      await elementService.deleteElement(elementId);
      dispatch({ type: 'DELETE_ELEMENT', payload: elementId });
    } catch (error) {
      console.error('Error al eliminar elemento:', error);
      throw error;
    }
  };
  
  const duplicateElement = async (elementId) => {
    try {
      if (!state.currentScreen?._id) {
        throw new Error('No hay screen seleccionada');
      }
      
      const duplicatedElement = await elementService.duplicateElement(elementId);
      dispatch({ type: 'ADD_ELEMENT', payload: duplicatedElement });
      return duplicatedElement;
    } catch (error) {
      console.error('Error al duplicar elemento:', error);
      throw error;
    }
  }

  // CORREGIDO: selectElement - Sin toggle, solo establecer
  const selectElement = (elementId, element = null) => {
    if (elementId && element) {
      // Si se proporciona el elemento completo, usarlo
      dispatch({ type: 'SELECT_ELEMENT', payload: element });
    } else if (elementId) {
      // Si solo se proporciona el ID, buscar el elemento
      const foundElement = state.elements.find(el => el._id === elementId);
      dispatch({ type: 'SELECT_ELEMENT', payload: foundElement || null });
    } else {
      // Si no se proporciona nada, deseleccionar
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
  const exportToFlutter = async () => {
    try {
      if (!state.currentScreen?._id) {
        throw new Error('No hay screen seleccionada para exportar');
      }
      
      dispatch({ type: 'SET_EXPORT_LOADING', payload: true });
      
      const exportData = await elementService.exportToFlutter(state.currentScreen._id);
      
      dispatch({ 
        type: 'SET_EXPORT_MODAL', 
        payload: { open: true, content: exportData } 
      });
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar: ' + (error.message || 'Error desconocido'));
      throw error;
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

  // Funciones de interacción
  const notifyElementInteraction = (elementId, action) => {
    dispatch({
      type: 'SET_ELEMENT_INTERACTION',
      payload: {
        elementId,
        interaction: {
          username: 'Usuario',
          action
        }
      }
    });
  };

  const endElementInteraction = (elementId) => {
    dispatch({ type: 'REMOVE_ELEMENT_INTERACTION', payload: elementId });
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
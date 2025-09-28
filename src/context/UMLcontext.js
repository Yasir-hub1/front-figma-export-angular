// src/context/UMLContext.js - Contexto para Diagramador UML
import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import projectService from '../services/projectService';
import { diagramService, umlElementService } from '../services/uml_services';
import shareService from '../services/shareService';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const UMLContext = createContext();

const initialState = {
  project: null,
  diagrams: [],
  currentDiagram: null,
  umlElements: [], // Clases, interfaces, etc.
  connections: [], // Relaciones entre elementos
  selectedElement: null,
  selectedConnection: null,
  shareSettings: null, // Configuración de compartir proyecto
  loading: true,
  error: null,
  zoom: 1,
  position: { x: 0, y: 0 },
  gridVisible: true,
  snapToGrid: true,
  exportModalOpen: false,
  exportContent: null,
  exportLoading: false,
  elementInteractions: {},
  // Estados de Socket.IO
  socket: null,
  connected: false,
  users: [],
  // Estados específicos UML
  diagramType: 'class', // class, sequence, usecase, activity
  showStereotypes: true,
  showVisibility: true,
  showOperations: true,
  showAttributes: true
};

// Tipos de elementos UML disponibles
export const UML_ELEMENT_TYPES = {
  CLASS: 'class',
  INTERFACE: 'interface',
  ABSTRACT_CLASS: 'abstract_class',
  ENUM: 'enum',
  PACKAGE: 'package',
  COMPONENT: 'component',
  ACTOR: 'actor',
  USE_CASE: 'use_case',
  NOTE: 'note'
};

// Tipos de relaciones UML
export const UML_RELATIONSHIP_TYPES = {
  ASSOCIATION: 'association',
  AGGREGATION: 'aggregation',
  COMPOSITION: 'composition',
  INHERITANCE: 'inheritance',
  REALIZATION: 'realization',
  DEPENDENCY: 'dependency',
  USE: 'use',
  INCLUDE: 'include',
  EXTEND: 'extend'
};

// Visibilidad UML
export const UML_VISIBILITY = {
  PUBLIC: '+',
  PRIVATE: '-',
  PROTECTED: '#',
  PACKAGE: '~'
};

function umlReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_PROJECT':
      return { ...state, project: action.payload };

    case 'SET_DIAGRAMS':
      // Asegurar que action.payload sea un array
      const payloadArray = Array.isArray(action.payload) ? action.payload : [];
      const normalizedDiagrams = payloadArray.map(diagram => {
        if (diagram && diagram.diagram) {
          return diagram.diagram;
        }
        return diagram;
      });
      return { ...state, diagrams: normalizedDiagrams };

    case 'SET_CURRENT_DIAGRAM':
      const normalizedCurrentDiagram = action.payload?.diagram || action.payload;
      return {
        ...state,
        currentDiagram: normalizedCurrentDiagram,
        umlElements: [],
        connections: [],
        selectedElement: null,
        selectedConnection: null
      };

    case 'ADD_DIAGRAM':
      const newDiagram = action.payload?.diagram || action.payload;
      const currentDiagrams = Array.isArray(state.diagrams) ? state.diagrams : [];
      const exists = currentDiagrams.some(diagram => diagram._id === newDiagram._id);
      if (exists) {
        console.log('Diagrama ya existe, no se agrega:', newDiagram._id);
        return state;
      }
      return { ...state, diagrams: [...currentDiagrams, newDiagram] };

    case 'UPDATE_DIAGRAM':
      const updatedDiagram = action.payload?.diagram || action.payload;
      const diagramsToUpdate = Array.isArray(state.diagrams) ? state.diagrams : [];
      return {
        ...state,
        diagrams: diagramsToUpdate.map(diagram =>
          diagram._id === updatedDiagram._id ? updatedDiagram : diagram
        ),
        currentDiagram: state.currentDiagram?._id === updatedDiagram._id ? updatedDiagram : state.currentDiagram
      };

    case 'DELETE_DIAGRAM':
      const diagramsToDeleteFrom = Array.isArray(state.diagrams) ? state.diagrams : [];
      const filteredDiagrams = diagramsToDeleteFrom.filter(diagram => diagram._id !== action.payload);
      return {
        ...state,
        diagrams: filteredDiagrams,
        currentDiagram: state.currentDiagram?._id === action.payload
          ? (filteredDiagrams.length > 0 ? filteredDiagrams[0] : null)
          : state.currentDiagram,
        umlElements: state.currentDiagram?._id === action.payload ? [] : state.umlElements,
        connections: state.currentDiagram?._id === action.payload ? [] : state.connections
      };

    case 'SET_UML_ELEMENTS':
      const elementsArray = Array.isArray(action.payload) ? action.payload : [];
      return { ...state, umlElements: elementsArray };

    case 'ADD_UML_ELEMENT':
      const currentElements = Array.isArray(state.umlElements) ? state.umlElements : [];
      // Avoid duplicates by checking if element already exists
      const elementExists = currentElements.some(el => el._id === action.payload._id);
      if (elementExists) {
        console.log('Element already exists, skipping add:', action.payload._id);
        return state;
      }
      console.log('Adding new element to state:', action.payload._id);
      console.log('Element details:', { id: action.payload._id, name: action.payload.name, type: action.payload.type });
      return { ...state, umlElements: [...currentElements, action.payload] };

      case 'UPDATE_UML_ELEMENT':
        const elementsToUpdate = Array.isArray(state.umlElements) ? state.umlElements : [];
        const updatedElement = action.payload;
        
        const updatedState = {
          ...state,
          umlElements: elementsToUpdate.map(element =>
            element._id === updatedElement._id ? { ...element, ...updatedElement } : element
          ),
          // SIMPLIFICAR: Solo actualizar selectedElement si no está siendo arrastrado
          selectedElement: state.selectedElement?._id === updatedElement._id 
            ? { ...state.selectedElement, ...updatedElement }
            : state.selectedElement
        };
        
        return updatedState;

    case 'DELETE_UML_ELEMENT':
      const elementsToFilter = Array.isArray(state.umlElements) ? state.umlElements : [];
      const connectionsToFilter = Array.isArray(state.connections) ? state.connections : [];
      return {
        ...state,
        umlElements: elementsToFilter.filter(element => element._id !== action.payload),
        selectedElement: state.selectedElement?._id === action.payload ? null : state.selectedElement,
        // También eliminar conexiones relacionadas
        connections: connectionsToFilter.filter(conn =>
          conn.sourceId !== action.payload && conn.targetId !== action.payload
        )
      };

    case 'SET_CONNECTIONS':
      const connectionsArray = Array.isArray(action.payload) ? action.payload : [];
      return { ...state, connections: connectionsArray };

    case 'ADD_CONNECTION':
      const currentConnections = Array.isArray(state.connections) ? state.connections : [];
      console.log('Agregando conexión al estado:', { 
        id: action.payload?._id, 
        type: action.payload?.type,
        totalConnections: currentConnections.length + 1
      });
      return { ...state, connections: [...currentConnections, action.payload] };

    case 'UPDATE_CONNECTION':
      const connectionsToUpdate = Array.isArray(state.connections) ? state.connections : [];
      return {
        ...state,
        connections: connectionsToUpdate.map(connection =>
          connection._id === action.payload._id ? action.payload : connection
        ),
        selectedConnection: state.selectedConnection?._id === action.payload._id ? action.payload : state.selectedConnection
      };

    case 'DELETE_CONNECTION':
      const connectionsToDeleteFrom = Array.isArray(state.connections) ? state.connections : [];
      console.log('DELETE_CONNECTION reducer ejecutándose:', {
        connectionIdToDelete: action.payload,
        currentConnectionsCount: connectionsToDeleteFrom.length,
        connectionIds: connectionsToDeleteFrom.map(c => c._id)
      });
      const filteredConnections = connectionsToDeleteFrom.filter(connection => connection._id !== action.payload);
      console.log('Conexiones después del filtro:', filteredConnections.length);
      return {
        ...state,
        connections: filteredConnections,
        selectedConnection: state.selectedConnection?._id === action.payload ? null : state.selectedConnection
      };

    case 'SELECT_ELEMENT':
      console.log('UML Reducer SELECT_ELEMENT:', action.payload?.name || 'null');
      const selectState = {
        ...state,
        selectedElement: action.payload,
        selectedConnection: null
      };
      console.log('UML Reducer new state selectedElement:', selectState.selectedElement?.name || 'null');
      return selectState;

    case 'SELECT_CONNECTION':
      return {
        ...state,
        selectedConnection: action.payload,
        selectedElement: null
      };

    case 'SET_VIEWPORT':
      return { ...state, zoom: action.payload.zoom, position: action.payload.position };

    case 'SET_GRID_VISIBLE':
      return { ...state, gridVisible: action.payload };

    case 'SET_SNAP_TO_GRID':
      return { ...state, snapToGrid: action.payload };

    case 'SET_DIAGRAM_TYPE':
      return { ...state, diagramType: action.payload };

    case 'SET_UML_DISPLAY_OPTIONS':
      return {
        ...state,
        showStereotypes: action.payload.showStereotypes !== undefined ? action.payload.showStereotypes : state.showStereotypes,
        showVisibility: action.payload.showVisibility !== undefined ? action.payload.showVisibility : state.showVisibility,
        showOperations: action.payload.showOperations !== undefined ? action.payload.showOperations : state.showOperations,
        showAttributes: action.payload.showAttributes !== undefined ? action.payload.showAttributes : state.showAttributes
      };

    case 'SET_EXPORT_MODAL':
      return { ...state, exportModalOpen: action.payload.open, exportContent: action.payload.content };

    case 'SET_EXPORT_LOADING':
      return { ...state, exportLoading: action.payload };

    case 'SET_SHARE_SETTINGS':
      return { ...state, shareSettings: action.payload };

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

export function UMLProvider({ children, projectId }) {
  const [state, dispatch] = useReducer(umlReducer, initialState);
  const { currentUser } = useAuth();

  console.log('UML Provider iniciado con projectId:', projectId);
  console.log('- Tipo de projectId:', typeof projectId);
  console.log('- Es válido:', /^[a-f\d]{24}$/i.test(projectId));

  // Agregar este useEffect para debug del estado del contexto
  useEffect(() => {
    console.log('UML Context state.selectedElement changed:', state.selectedElement?.name || 'null');
  }, [state.selectedElement]);

  // Debug del estado completo
  useEffect(() => {
    console.log('UML Context FULL STATE:', {
      selectedElement: state.selectedElement?.name || 'null',
      umlElementsCount: state.umlElements?.length || 0,
      projectId,
      currentDiagramId: state.currentDiagram?._id || 'null'
    });
  }, [state.selectedElement, state.umlElements, state.currentDiagram]);

  // Inicializar Socket.IO
  useEffect(() => {
    if (!projectId || !currentUser) return;

    console.log('Inicializando Socket.IO para proyecto UML:', projectId);

    const newSocket = io('http://134.209.50.92:5002', {
      withCredentials: true,
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Conectado a Socket.IO UML');
      dispatch({ type: 'SET_CONNECTED', payload: true });

      newSocket.emit('authenticate', {
        userId: currentUser.id,
        username: currentUser.username,
        token: localStorage.getItem('token')
      });

      newSocket.emit('join-project', {
        projectId: projectId
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Desconectado de Socket.IO UML');
      dispatch({ type: 'SET_CONNECTED', payload: false });
    });

    newSocket.on('user-joined', (data) => {
      console.log('Usuario se unió al proyecto UML:', data.user);
      dispatch({ type: 'SET_USERS', payload: data.activeUsers });
    });

    newSocket.on('user-left', (data) => {
      console.log('Usuario abandonó el proyecto UML:', data.user);
      dispatch({ type: 'SET_USERS', payload: data.activeUsers });
    });

    // Manejar actualizaciones de diseño UML
    newSocket.on('uml-updated', (data) => {
      console.log('Actualización UML recibida via socket:', data);

      // Process all updates regardless of user (including our own for consistency)
      if (data.type === 'element-added') {
        console.log('Aplicando elemento añadido desde socket:', data.element);
        console.log('Tipo de elemento:', data.element?.type);
        console.log('Es tabla intermedia:', data.element?.type === 'intermediate_table');
        dispatch({ type: 'ADD_UML_ELEMENT', payload: data.element });
      } else if (data.type === 'element-updated') {
        console.log('Aplicando actualización de elemento desde socket:', data.element);
        dispatch({ type: 'UPDATE_UML_ELEMENT', payload: data.element });
      } else if (data.type === 'element-deleted') {
        console.log('Aplicando eliminación de elemento desde socket:', data.elementId);
        dispatch({ type: 'DELETE_UML_ELEMENT', payload: data.elementId });
      } else if (data.type === 'connection-added') {
        console.log('Aplicando conexión añadida desde socket:', data.connection);
        console.log('Conexión detalles:', { 
          id: data.connection?._id, 
          type: data.connection?.type, 
          source: data.connection?.sourceElementId, 
          target: data.connection?.targetElementId,
          sourceElement: data.connection?.sourceElement?.name,
          targetElement: data.connection?.targetElement?.name
        });
        dispatch({ type: 'ADD_CONNECTION', payload: data.connection });
      } else if (data.type === 'connection-updated') {
        console.log('Aplicando actualización de conexión desde socket:', data.connection);
        dispatch({ type: 'UPDATE_CONNECTION', payload: data.connection });
      } else if (data.type === 'connection-deleted') {
        console.log('Aplicando eliminación de conexión desde socket:', data.connectionId);
        console.log('Estado actual de conexiones antes de eliminar:', state.connections?.length || 0);
        dispatch({ type: 'DELETE_CONNECTION', payload: data.connectionId });
        console.log('Despachada acción DELETE_CONNECTION para ID:', data.connectionId);
      } else if (data.type === 'diagram-added') {
        const diagram = data.diagram?.diagram || data.diagram;
        dispatch({ type: 'ADD_DIAGRAM', payload: diagram });
      } else if (data.type === 'diagram-updated') {
        const diagram = data.diagram?.diagram || data.diagram;
        dispatch({ type: 'UPDATE_DIAGRAM', payload: diagram });
      } else if (data.type === 'diagram-deleted') {
        dispatch({ type: 'DELETE_DIAGRAM', payload: data.diagramId });
      }
    });

    // Manejar interacciones con elementos UML
    newSocket.on('element-interaction', (data) => {
      console.log('Interacción UML recibida:', data);
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
      console.log('Fin de interacción UML:', data);
      dispatch({ type: 'REMOVE_ELEMENT_INTERACTION', payload: data.elementId });
    });

    dispatch({ type: 'SET_SOCKET', payload: newSocket });

    return () => {
      console.log('Cerrando conexión Socket.IO UML');
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [projectId, currentUser]);

  // Cargar proyecto inicial
  useEffect(() => {
    if (projectId) {
      console.log('Iniciando carga del proyecto UML:', projectId);
      loadProject();
    } else {
      console.error('No se proporcionó projectId al UMLProvider');
      dispatch({ type: 'SET_ERROR', payload: 'ID de proyecto no válido' });
    }
  }, [projectId]);

  // Cargar elementos UML cuando cambia el diagrama actual
  useEffect(() => {
    if (state.currentDiagram?._id) {
      fetchUMLElements(state.currentDiagram._id);
    }
  }, [state.currentDiagram?._id, projectId]);

  const loadProject = async () => {
    try {
      console.log('Iniciando carga del proyecto UML:', projectId);
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      if (!projectId) {
        throw new Error('ID de proyecto no proporcionado');
      }

      console.log('Obteniendo datos del proyecto...');
      const project = await projectService.getProject(projectId);
      console.log('Proyecto UML obtenido:', project.name);
      dispatch({ type: 'SET_PROJECT', payload: project });

      console.log('Obteniendo diagramas del proyecto...');
      const diagramsResponse = await diagramService.getDiagrams(projectId);
      console.log('Respuesta del servicio de diagramas:', diagramsResponse);

      // Extraer los diagramas de la respuesta
      const diagrams = Array.isArray(diagramsResponse) ? diagramsResponse :
        Array.isArray(diagramsResponse?.diagrams) ? diagramsResponse.diagrams : [];

      console.log(`${diagrams.length} diagramas obtenidos`);

      // Si no hay diagramas, crear uno por defecto
      if (diagrams.length === 0) {
        console.log('Creando diagrama por defecto...');
        try {
          const defaultDiagram = await diagramService.createDiagram(projectId, {
            name: 'Diagrama Principal',
            type: 'class',
            canvas: {
              width: project.canvas?.width || 1200,
              height: project.canvas?.height || 800,
              background: '#FFFFFF'
            }
          });
          console.log('Diagrama por defecto creado:', defaultDiagram.name);

          const updatedDiagrams = [defaultDiagram.diagram || defaultDiagram];
          dispatch({ type: 'SET_DIAGRAMS', payload: updatedDiagrams });
          dispatch({ type: 'SET_CURRENT_DIAGRAM', payload: defaultDiagram.diagram || defaultDiagram });
        } catch (diagramError) {
          console.error('Error al crear diagrama por defecto:', diagramError);
          dispatch({ type: 'SET_DIAGRAMS', payload: [] });
          dispatch({ type: 'SET_ERROR', payload: 'No se pudo crear el diagrama inicial' });
        }
      } else {
        dispatch({ type: 'SET_DIAGRAMS', payload: diagrams });
        console.log('Seleccionando primer diagrama:', diagrams[0].name);
        dispatch({ type: 'SET_CURRENT_DIAGRAM', payload: diagrams[0] });
      }

      console.log('Proyecto UML cargado exitosamente');

    } catch (error) {
      console.error('Error al cargar proyecto UML:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Error al cargar el proyecto' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Función para cargar elementos UML de un diagrama específico
  const fetchUMLElements = async (diagramId) => {
    try {
      console.log('Cargando elementos UML para diagrama:', diagramId);

      if (!diagramId) {
        console.log('No hay diagramId, limpiando elementos');
        dispatch({ type: 'SET_UML_ELEMENTS', payload: [] });
        dispatch({ type: 'SET_CONNECTIONS', payload: [] });
        return;
      }

      const elementsData = await umlElementService.getUMLElements(diagramId);
      const elements = elementsData.elements || [];
      const connections = elementsData.connections || [];

      console.log(`${elements.length} elementos UML y ${connections.length} conexiones cargados`);
      dispatch({ type: 'SET_UML_ELEMENTS', payload: elements });
      dispatch({ type: 'SET_CONNECTIONS', payload: connections });
    } catch (error) {
      console.error('Error al cargar elementos UML:', error);
      if (error.response?.status === 404 || error.message.includes('404') || error.message.includes('Not Found')) {
        console.log('Diagrama sin elementos, estableciendo arrays vacíos');
        dispatch({ type: 'SET_UML_ELEMENTS', payload: [] });
        dispatch({ type: 'SET_CONNECTIONS', payload: [] });
      } else {
        console.error('Error real al cargar elementos UML:', error.message);
        dispatch({ type: 'SET_UML_ELEMENTS', payload: [] });
        dispatch({ type: 'SET_CONNECTIONS', payload: [] });
      }
    }
  };

  // Funciones de Diagrama con Socket.IO
  const createDiagram = async (name, type = 'class') => {
    try {
      const diagramData = {
        name,
        type,
        canvas: {
          width: state.project?.canvas?.width || 1200,
          height: state.project?.canvas?.height || 800,
          background: '#FFFFFF'
        }
      };

      const response = await diagramService.createDiagram(projectId, diagramData);
      console.log('Respuesta del servidor al crear diagrama:', response);

      const newDiagram = response?.diagram || response;

      dispatch({ type: 'ADD_DIAGRAM', payload: newDiagram });

      // Nota: El backend ya emite uml-updated directamente desde diagramController
      // No necesitamos emitir update-uml desde el frontend para evitar duplicados

      setCurrentDiagram(newDiagram);
      console.log('Diagrama creado y seleccionado:', newDiagram.name);

      return newDiagram;
    } catch (error) {
      console.error('Error al crear diagrama:', error);
      throw error;
    }
  };

  const updateDiagram = async (diagramId, diagramData) => {
    try {
      console.log('Actualizando diagrama:', diagramId, diagramData);
      const response = await diagramService.updateDiagram(diagramId, diagramData);

      const updatedDiagram = response?.diagram || response;

      dispatch({ type: 'UPDATE_DIAGRAM', payload: updatedDiagram });

      // Nota: El backend ya emite uml-updated directamente desde diagramController
      // No necesitamos emitir update-uml desde el frontend para evitar duplicados

      return updatedDiagram;
    } catch (error) {
      console.error('Error al actualizar diagrama:', error);
      throw error;
    }
  };

  const deleteDiagram = async (diagramId) => {
    try {
      await diagramService.deleteDiagram(projectId, diagramId);

      dispatch({ type: 'DELETE_DIAGRAM', payload: diagramId });

      // Nota: El backend ya emite uml-updated directamente desde diagramController
      // No necesitamos emitir update-uml desde el frontend para evitar duplicados
    } catch (error) {
      console.error('Error al eliminar diagrama:', error);
      throw error;
    }
  };

  const setCurrentDiagram = (diagram) => {
    console.log('Cambiando a diagrama:', diagram?.name, diagram?._id);
    const normalizedDiagram = diagram?.diagram || diagram;
    dispatch({ type: 'SET_CURRENT_DIAGRAM', payload: normalizedDiagram });
  };

  // Funciones de elementos UML
  const createUMLElement = async (elementData) => {
    try {
      if (!state.currentDiagram?._id) {
        throw new Error('No hay diagrama seleccionado');
      }

      console.log('Creating UML element with data:', elementData);
      const newElement = await umlElementService.createUMLElement(state.currentDiagram._id, elementData);
      console.log('Element created successfully:', newElement);

      // Validate element data before adding to state
      if (!newElement || !newElement._id) {
        throw new Error('Invalid element data received from server');
      }

      // Update local state immediately - ensure the element appears right away
      console.log('Dispatching ADD_UML_ELEMENT with:', newElement);
      dispatch({ type: 'ADD_UML_ELEMENT', payload: newElement });
      console.log('Element added to local state, current elements count should be updated');

      // Nota: El backend ya emite uml-updated directamente desde umlElementController
      // No necesitamos emitir update-uml desde el frontend para evitar duplicados

      return newElement;
    } catch (error) {
      console.error('Error al crear elemento UML:', error);
      throw error;
    }
  };

  const updateUMLElement = async (elementId, elementData) => {
    try {
      if (!state.currentDiagram?._id) {
        throw new Error('No hay diagrama seleccionado');
      }

      console.log('Updating UML element:', elementId, elementData);

      // Update on server first to get the authoritative version
      const updatedElement = await umlElementService.updateUMLElement(elementId, elementData);
      console.log('UML element updated on server:', updatedElement);

      if (!updatedElement || !updatedElement._id) {
        throw new Error('Invalid updated element received from server');
      }

      // Update local state with server response
      dispatch({ type: 'UPDATE_UML_ELEMENT', payload: updatedElement });

      // Si se actualizó la posición o tamaño, también actualizar las conexiones relacionadas
      if (elementData.position || elementData.size) {
        console.log('Elemento movido/redimensionado, actualizando conexiones relacionadas');

        // Encontrar conexiones que involucran este elemento
        const relatedConnections = state.connections.filter(conn =>
          conn.sourceElementId === elementId || conn.targetElementId === elementId
        );

        console.log(`Actualizando ${relatedConnections.length} conexiones relacionadas`);

        // Actualizar cada conexión relacionada
        for (const connection of relatedConnections) {
          try {
            const updatedConnection = await umlElementService.updateConnection(connection._id, {
              // Mantener las propiedades existentes pero forzar actualización
              ...connection,
              lastUpdated: new Date().toISOString()
            });

            if (updatedConnection) {
              dispatch({ type: 'UPDATE_CONNECTION', payload: updatedConnection });
            }
          } catch (connError) {
            console.warn('Error al actualizar conexión relacionada:', connError);
          }
        }
      }

      // Nota: El backend ya emite uml-updated directamente desde los controllers
      // No necesitamos emitir update-uml desde el frontend para evitar duplicados

      return updatedElement;
    } catch (error) {
      console.error('Error al actualizar elemento UML:', error);
      throw error;
    }
  };

  const deleteUMLElement = async (elementId) => {
    try {
      if (!state.currentDiagram?._id) {
        throw new Error('No hay diagrama seleccionado');
      }

      console.log('Deleting UML element:', elementId);
      await umlElementService.deleteUMLElement(elementId);

      // Update local state immediately
      dispatch({ type: 'DELETE_UML_ELEMENT', payload: elementId });
      console.log('Element deleted from local state');

      // Clear selection if the deleted element was selected
      if (state.selectedElement?._id === elementId) {
        dispatch({ type: 'SELECT_ELEMENT', payload: null });
      }

      // Nota: El backend ya emite uml-updated directamente desde umlElementController
      // No necesitamos emitir update-uml desde el frontend para evitar duplicados

      return elementId;
    } catch (error) {
      console.error('Error al eliminar elemento UML:', error);
      throw error;
    }
  };

  const duplicateUMLElement = async (elementId) => {
    try {
      if (!state.currentDiagram?._id) {
        throw new Error('No hay diagrama seleccionado');
      }

      console.log('Duplicando elemento UML:', {
        elementId,
        diagramId: state.currentDiagram._id,
        diagramName: state.currentDiagram.name
      });

      const duplicatedElement = await umlElementService.duplicateUMLElement(elementId);
      console.log('Element duplicated successfully:', duplicatedElement);

      // Update local state immediately
      dispatch({ type: 'ADD_UML_ELEMENT', payload: duplicatedElement });

      // Nota: El backend ya emite uml-updated directamente desde umlElementController
      // No necesitamos emitir update-uml desde el frontend para evitar duplicados

      console.log('Elemento UML duplicado exitosamente:', duplicatedElement);
      return duplicatedElement;
    } catch (error) {
      console.error('Error al duplicar elemento UML:', error);
      throw error;
    }
  };

  // Funciones de conexiones/relaciones UML
  const createConnection = async (connectionData) => {
    try {
      if (!state.currentDiagram?._id) {
        throw new Error('No hay diagrama seleccionado');
      }

      const newConnection = await umlElementService.createConnection(state.currentDiagram._id, connectionData);

      dispatch({ type: 'ADD_CONNECTION', payload: newConnection });

      // Nota: El backend ya emite uml-updated directamente desde umlConnectionController
      // No necesitamos emitir update-uml desde el frontend para evitar duplicados

      return newConnection;
    } catch (error) {
      console.error('Error al crear conexión UML:', error);
      throw error;
    }
  };

  const updateConnection = async (connectionId, connectionData) => {
    try {
      if (!state.currentDiagram?._id) {
        throw new Error('No hay diagrama seleccionado');
      }

      console.log('Updating UML connection:', connectionId, connectionData);

      const updatedConnection = await umlElementService.updateConnection(connectionId, connectionData);
      console.log('UML connection updated on server:', updatedConnection);

      if (!updatedConnection || !updatedConnection._id) {
        throw new Error('Invalid updated connection received from server');
      }

      dispatch({ type: 'UPDATE_CONNECTION', payload: updatedConnection });

      // Nota: El backend ya emite uml-updated directamente desde umlConnectionController
      // No necesitamos emitir update-uml desde el frontend para evitar duplicados

      return updatedConnection;
    } catch (error) {
      console.error('Error al actualizar conexión UML:', error);
      throw error;
    }
  };

  const deleteConnection = async (connectionId) => {
    try {
      if (!state.currentDiagram?._id) {
        throw new Error('No hay diagrama seleccionado');
      }

      console.log('Eliminando conexión UML:', connectionId);
      console.log('Estado actual de conexiones antes de eliminar:', state.connections?.length || 0);
      
      const response = await umlElementService.deleteConnection(connectionId);
      console.log('Respuesta del servicio deleteConnection:', response);

      // Actualizar estado local
      console.log('Despachando DELETE_CONNECTION para ID:', connectionId);
      dispatch({ type: 'DELETE_CONNECTION', payload: connectionId });

      // Deseleccionar la conexión si estaba seleccionada
      if (state.selectedConnection?._id === connectionId) {
        console.log('Deseleccionando conexión eliminada');
        dispatch({ type: 'SELECT_CONNECTION', payload: null });
      }

      // Nota: El backend ya emite uml-updated directamente desde umlConnectionController
      // No necesitamos emitir update-uml desde el frontend para evitar duplicados

      return connectionId;
    } catch (error) {
      console.error('Error al eliminar conexión UML:', error);
      throw error;
    }
  };

  const selectElement = (elementId, element = null) => {
    console.log('UML Context selectElement called:', { elementId, element: element?.name || 'null' });

    try {
      if (elementId && element) {
        console.log('UML Context dispatching SELECT_ELEMENT with element:', element.name);
        dispatch({ type: 'SELECT_ELEMENT', payload: element });
        console.log('UML Context dispatch completed');
      } else if (elementId) {
        const foundElement = state.umlElements.find(el => el._id === elementId);
        console.log('UML Context found element by ID:', foundElement?.name || 'not found');
        dispatch({ type: 'SELECT_ELEMENT', payload: foundElement || null });
      } else {
        console.log('UML Context deselecting element');
        dispatch({ type: 'SELECT_ELEMENT', payload: null });
      }
    } catch (error) {
      console.error('Error in selectElement:', error);
    }
  };

  const selectConnection = (connectionId, connection = null) => {
    if (connectionId && connection) {
      dispatch({ type: 'SELECT_CONNECTION', payload: connection });
    } else if (connectionId) {
      const foundConnection = state.connections.find(conn => conn._id === connectionId);
      dispatch({ type: 'SELECT_CONNECTION', payload: foundConnection || null });
    } else {
      dispatch({ type: 'SELECT_CONNECTION', payload: null });
    }
  };

  // Funciones de Compartir Proyecto
    const generateShareLink = async (settings) => {
      try {
        if (!state.project?._id) {
          throw new Error('No hay proyecto seleccionado');
        }

        console.log('Generando enlace de compartir:', settings);
        console.log('Project ID:', state.project._id);

        try {
          const data = await shareService.generateShareLink(state.project._id, settings);
          console.log('Enlace de compartir generado:', data.shareLink);
          
          // Actualizar configuración de compartir
          dispatch({ type: 'SET_SHARE_SETTINGS', payload: settings });
          
          return data.shareLink;
        } catch (error) {
          // Solo usar fallback si es un error de conexión, no un 404
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            console.warn('Backend no disponible, generando enlace de prueba:', error.message);
            
            // Generar enlace de prueba cuando el backend no esté disponible
            const testToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const testLink = `${window.location.origin}/join-project/${testToken}`;
            
            console.log('Enlace de prueba generado:', testLink);
            return testLink;
          } else {
            // Re-lanzar el error si no es un error de conexión
            throw error;
          }
        }
      } catch (error) {
        console.error('Error generando enlace de compartir:', error);
        throw error;
      }
    };

  const updateShareSettings = async (newSettings) => {
    try {
      if (!state.project?._id) {
        throw new Error('No hay proyecto seleccionado');
      }

      console.log('Actualizando configuración de compartir:', newSettings);

      const response = await fetch(`/api/projects/${state.project._id}/share/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newSettings)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar configuración de compartir');
      }

      dispatch({ type: 'SET_SHARE_SETTINGS', payload: newSettings });
    } catch (error) {
      console.error('Error actualizando configuración de compartir:', error);
      throw error;
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

  const setDiagramType = (type) => {
    dispatch({ type: 'SET_DIAGRAM_TYPE', payload: type });
  };

  const setUMLDisplayOptions = (options) => {
    dispatch({ type: 'SET_UML_DISPLAY_OPTIONS', payload: options });
  };

  // Función de exportación UML
  const exportToUML = async () => {
    try {
      if (!state.currentDiagram?._id) {
        throw new Error('No hay diagrama seleccionado para exportar');
      }

      console.log('Iniciando exportación UML:', {
        diagramId: state.currentDiagram._id,
        diagramName: state.currentDiagram.name,
        projectId: projectId,
        elementsCount: state.umlElements.length,
        connectionsCount: state.connections.length
      });

      dispatch({ type: 'SET_EXPORT_LOADING', payload: true });

      console.log('Llamando a umlElementService.exportToUML...');

      const exportData = await umlElementService.exportToUML(state.currentDiagram._id);

      console.log('Datos de exportación UML recibidos:', {
        diagramName: exportData.diagramName,
        elementsCount: exportData.elementsCount,
        connectionsCount: exportData.connectionsCount,
        hasPlantUML: !!exportData.plantUML,
        hasXMI: !!exportData.xmi,
        hasJSON: !!exportData.json
      });

      if (!exportData.plantUML && !exportData.xmi && !exportData.json) {
        throw new Error('No se recibió código UML válido del servidor');
      }

      dispatch({
        type: 'SET_EXPORT_MODAL',
        payload: {
          open: true,
          content: {
            plantUML: exportData.plantUML,
            xmi: exportData.xmi,
            json: exportData.json,
            image: exportData.image,
            diagramName: exportData.diagramName,
            projectName: exportData.projectName,
            elementsCount: exportData.elementsCount,
            connectionsCount: exportData.connectionsCount,
            timestamp: exportData.timestamp
          }
        }
      });

      console.log('Modal de exportación UML abierto exitosamente');

      return exportData;
    } catch (error) {
      console.error('Error al exportar UML:', error);

      let errorMessage = 'Error desconocido al exportar';

      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.message;

        switch (status) {
          case 404:
            errorMessage = `No se encontró el diagrama "${state.currentDiagram?.name || 'desconocido'}" para exportar`;
            break;
          case 403:
            errorMessage = 'No tienes permisos para exportar este diagrama';
            break;
          case 500:
            errorMessage = serverMessage || 'Error interno del servidor al generar el código UML';
            break;
          default:
            errorMessage = serverMessage || `Error del servidor (${status})`;
        }
      } else if (error.message) {
        if (error.message.includes('diagram')) {
          errorMessage = `Error con el diagrama: ${error.message}`;
        } else if (error.message.includes('Network')) {
          errorMessage = 'Error de conexión. Verifica tu internet y vuelve a intentar';
        } else {
          errorMessage = error.message;
        }
      }

      dispatch({ type: 'SET_ERROR', payload: errorMessage });
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

    console.log('Notificando interacción UML:', elementId, action);

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

    console.log('Finalizando interacción UML:', elementId);

    state.socket.emit('element-interaction-end', {
      projectId: projectId,
      elementId
    });
  };

  const value = {
    // Estado
    ...state,

    // Funciones de Diagrama
    createDiagram,
    updateDiagram,
    deleteDiagram,
    setCurrentDiagram,
    fetchUMLElements,

    // Funciones de Elementos UML
    createUMLElement,
    updateUMLElement,
    deleteUMLElement,
    duplicateUMLElement,
    selectElement,

    // Funciones de Conexiones UML
    createConnection,
    updateConnection,
    deleteConnection,
    selectConnection,

    // Funciones de Compartir Proyecto
    generateShareLink,
    updateShareSettings,
    shareSettings: state.shareSettings,

    // Funciones de viewport
    updateViewport,
    setGridVisible,
    setSnapToGrid,
    setDiagramType,
    setUMLDisplayOptions,

    // Funciones de exportación
    exportToUML,
    setExportModalOpen,

    // Funciones de interacción
    notifyElementInteraction,
    endElementInteraction
  };

  return (
    <UMLContext.Provider value={value}>
      {children}
    </UMLContext.Provider>
  );
}

export const useUML = () => {
  const context = useContext(UMLContext);
  if (!context) {
    throw new Error('useUML debe ser usado dentro de UMLProvider');
  }
  return context;
};

export { UMLContext };
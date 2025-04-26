// src/context/EditorContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import projectService from '../services/projectService';
import elementService from '../services/elementService';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const EditorContext = createContext();

export const useEditor = () => {
  return useContext(EditorContext);
};

export const EditorProvider = ({ children }) => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [gridVisible, setGridVisible] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportContent, setExportContent] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  // Añadir este estado para seguir qué usuario está manipulando qué elemento
const [elementInteractions, setElementInteractions] = useState({});
// console.log("USUARIO ACTUAL ",currentUser)
// Inicializar socket.io
useEffect(() => {
  if (!id || !currentUser) return;

  const newSocket = io('http://159.203.124.196:80', {
    withCredentials: true,
    transports: ['websocket'],
  });

  newSocket.on('connect', () => {
    console.log('Conectado a Socket.IO');
    setConnected(true);
    
    // Autenticar
    newSocket.emit('authenticate', {
      userId: currentUser.id,
      username: currentUser.username,
      token: localStorage.getItem('token')
    });
    
    // Unirse al proyecto
    newSocket.emit('join-project', {
      projectId: id
    });
  });

  newSocket.on('disconnect', () => {
    console.log('Desconectado de Socket.IO');
    setConnected(false);
  });

  newSocket.on('user-joined', (data) => {
    console.log('Usuario se unió al proyecto:', data.user);
    setUsers(data.activeUsers);
  });
  
  newSocket.on('user-left', (data) => {
    console.log('Usuario abandonó el proyecto:', data.user);
    setUsers(data.activeUsers);
  });

  newSocket.on('design-updated', (data) => {
    if (data.type === 'element-added') {
      setElements(prev => [...prev, data.element]);
    } else if (data.type === 'element-updated') {
      setElements(prev => prev.map(el => 
        el._id === data.element._id ? data.element : el
      ));
    } else if (data.type === 'element-deleted') {
      setElements(prev => prev.filter(el => el._id !== data.elementId));
    }
  });

   
    
    newSocket.on('element-interaction', (data) => {
      console.log('Interacción recibida:', data);
      setElementInteractions(prev => ({
        ...prev,
        [data.elementId]: {
          userId: data.userId,
          username: data.username,
          action: data.action
        }
      }));
    });

    newSocket.on('element-interaction-end', (data) => {
      console.log('Fin de interacción:', data);
      setElementInteractions(prev => {
        const newState = { ...prev };
        delete newState[data.elementId];
        return newState;
      });
    });

  setSocket(newSocket);

  return () => {
    if (newSocket) {
      newSocket.disconnect();
    }
  };
}, [id, currentUser]);

  // Cargar proyecto y elementos
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener datos del proyecto
        const projectData = await projectService.getProject(id);
        setProject(projectData);
        
        // Obtener elementos
        const elementsData = await elementService.getElements(id);
        setElements(elementsData);
      } catch (err) {
        setError(err.message || 'Error al cargar el proyecto');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProjectData();
    }
  }, [id]);

  // Función para actualizar posición y zoom
  const updateViewport = (newZoom, newPosition) => {
    setZoom(newZoom);
    setPosition(newPosition);
  };

  // Función para seleccionar un elemento
// En EditorContext.js

// Función para seleccionar un elemento
const selectElement = (elementId, updatedElement = null) => {
  if (!elementId) {
    setSelectedElement(null);
    return;
  }
  
  if (updatedElement) {
    // Si se proporciona un elemento actualizado, actualizarlo en el estado
    setElements(prev => prev.map(el => 
      el._id === elementId ? updatedElement : el
    ));
    setSelectedElement(updatedElement);
  } else {
    // Buscar el elemento en el estado
    const element = elements.find(el => el._id === elementId);
    setSelectedElement(element || null);
  }
};

  // Función para crear un nuevo elemento


const createElement = async (elementData) => {
  try {
    setError(null);
    
    // Asegurarse de que todos los campos necesarios estén presentes
    const defaultStyles = elementData.styles || {};
    
    // Asegurar que se tienen valores predeterminados para position y size
    const adjustedData = {
      ...elementData,
      position: elementData.position || { 
        x: (project?.canvas?.width / 2 - (elementData.size?.width || 100) / 2) || 100,
        y: (project?.canvas?.height / 2 - (elementData.size?.height || 100) / 2) || 100
      },
      size: elementData.size || { width: 100, height: 100 },
      styles: defaultStyles
    };
    
    // Añadir una impresión para depuración
    console.log('Creando elemento:', adjustedData);
    
    const data = await elementService.createElement({
      ...adjustedData,
      projectId: id
    });
    
    const newElement = data.element;
    
    // Actualizar estado local
    setElements(prev => [...prev, newElement]);
    
    // Notificar a otros usuarios
    if (socket && connected) {
      socket.emit('update-design', {
        projectId: id,
        type: 'element-added',
        element: newElement
      });
    }
    
    return newElement;
  } catch (err) {
    console.error('Error detallado al crear elemento:', err);
    setError(err.message || 'Error al crear el elemento');
    throw err;
  }
};
  // Función para actualizar un elemento
  const updateElement = async (elementId, elementData) => {
    try {
      setError(null);
      const data = await elementService.updateElement(elementId, elementData);
      
      const updatedElement = data.element;
      
      // Actualizar estado local
      setElements(prev => prev.map(el => 
        el._id === elementId ? updatedElement : el
      ));
      
      // Actualizar el elemento seleccionado si es el que se modificó
      if (selectedElement && selectedElement._id === elementId) {
        setSelectedElement(updatedElement);
      }
      
      // Notificar a otros usuarios
      if (socket && connected) {
        socket.emit('update-design', {
          projectId: id,
          type: 'element-updated',
          element: updatedElement
        });
      }
      
      return updatedElement;
    } catch (err) {
      setError(err.message || 'Error al actualizar el elemento');
      throw err;
    }
  };

  // Función para eliminar un elemento
  const deleteElement = async (elementId) => {
    try {
      setError(null);

       // Notificar que un elemento será eliminado
    if (socket && connected && currentUser) {
      socket.emit('element-deleted', {
        projectId: id,
        elementId,
        userId: currentUser.id,
        username: currentUser.username
      });
    }


      await elementService.deleteElement(elementId);
      
      // Actualizar estado local
      setElements(prev => prev.filter(el => el._id !== elementId));
      
      // Deseleccionar si era el elemento seleccionado
      if (selectedElement && selectedElement._id === elementId) {
        setSelectedElement(null);
      }
      
      // Notificar a otros usuarios
      if (socket && connected) {
        socket.emit('update-design', {
          projectId: id,
          type: 'element-deleted',
          elementId
        });
      }
    } catch (err) {
      setError(err.message || 'Error al eliminar el elemento');
      throw err;
    }
  };

  // Función para duplicar un elemento
  const duplicateElement = async (elementId) => {
    try {
      setError(null);
      
      // Log para depuración
      console.log("Iniciando duplicación de elemento:", elementId);
      
      const data = await elementService.duplicateElement(elementId);
      
      if (!data || !data.element) {
        throw new Error("La respuesta del servidor no contiene el elemento duplicado");
      }
      
      const newElement = data.element;
      console.log("Elemento duplicado recibido:", newElement);
      
      // Actualizar estado local
      setElements(prev => [...prev, newElement]);
      
      // Seleccionar el nuevo elemento
      setSelectedElement(newElement);
      
      // Notificar a otros usuarios
      if (socket && connected) {
        socket.emit('update-design', {
          projectId: id,
          type: 'element-added',
          element: newElement
        });
      }
      
      return newElement;
    } catch (err) {
      console.error("Error completo al duplicar elemento:", err);
      setError(err.message || 'Error al duplicar el elemento');
      throw err;
    }
  };

  // Función para exportar a Angular
  const exportToAngular = async () => {
    try {
      setExportLoading(true);
      setError(null);
      const data = await elementService.exportToAngular(id);
      setExportContent(data.component);
      setExportModalOpen(true);
    } catch (err) {
      setError(err.message || 'Error al exportar a Angular');
    } finally {
      setExportLoading(false);
    }
  };



const endElementInteraction = (elementId) => {
  if (!socket || !connected) return;
  
  console.log('Finalizando interacción:', elementId);
  
  socket.emit('element-interaction-end', {
    projectId: id,
    elementId
  });
};

const notifyElementInteraction = (elementId, action) => {
  if (!socket || !connected || !currentUser) return;
  
  console.log('Notificando interacción:', elementId, action);
  
  socket.emit('element-interaction', {
    projectId: id,
    elementId,
    userId: currentUser.id,
    username: currentUser.username,
    action
  });
};

  // Valores del contexto
  const value = {
    project,
    elements,
    selectedElement,
    loading,
    error,
    connected,
    users,
    zoom,
    position,
    gridVisible,
    snapToGrid,
    exportModalOpen,
    exportContent,
    exportLoading,
    selectElement,
    createElement,
    updateElement,
    deleteElement,
    duplicateElement,
    updateViewport,
    setGridVisible,
    setSnapToGrid,
    exportToAngular,
    setExportModalOpen,
    socket,
    elementInteractions,
  notifyElementInteraction,
  endElementInteraction
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

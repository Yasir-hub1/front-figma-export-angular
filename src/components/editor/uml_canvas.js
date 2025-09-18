import React, { useRef, useState, useEffect } from 'react';
import UMLElement from './uml_element';
import UMLConnection from './uml_connection';
import './UMLCanvas.css';
import { useUML } from '../../context/UMLcontext';

const UMLCanvas = ({ viewMode = 'design', connectionMode, setConnectionMode, diagramType, onSelectElement }) => {
  const { 
    project, 
    currentDiagram,
    umlElements, 
    connections,
    selectedElement,
    selectedConnection,
    selectElement,
    selectConnection,
    updateUMLElement,
    deleteUMLElement,
    createConnection,
    updateConnection,
    deleteConnection,
    zoom,
    position,
    gridVisible,
    snapToGrid,
    notifyElementInteraction,
    endElementInteraction,
    fetchUMLElements
  } = useUML();
  
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragElement, setDragElement] = useState(null);
  
  // Estados para crear conexiones
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  const [connectionEnd, setConnectionEnd] = useState(null);
  const [tempConnectionPath, setTempConnectionPath] = useState(null);

  const [pendingSave, setPendingSave] = useState(null);


  // Fetch elements when diagram changes
  useEffect(() => {
    setIsDragging(false);
    setIsResizing(false);
    setDragElement(null);
    if (currentDiagram?._id && (!umlElements || umlElements.length === 0)) {
      console.log('Canvas effect - fetching elements for diagram:', currentDiagram._id);
      fetchUMLElements(currentDiagram._id);
    }
  }, [currentDiagram?._id]);

  // Debug: Log when elements array changes
  useEffect(() => {
    console.log('Canvas: UML Elements array changed:', {
      count: umlElements?.length || 0,
      elements: umlElements?.map(el => ({ id: el._id, name: el.name, type: el.type })) || []
    });
  }, [umlElements]);

  // Log elements changes without causing re-fetches
  useEffect(() => {
    if (umlElements?.length > 0) {
      console.log('UML Elements updated in canvas:', umlElements.length, 'elements');
    }
  }, [umlElements?.length]);

  // Manejar eventos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      if (selectedElement && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        handleDeleteElement(selectedElement._id);
      }
      
      if (selectedConnection && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        handleDeleteConnection(selectedConnection._id);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElement, selectedConnection]);

  // Agregar este useEffect después del existente para eventos de teclado
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if ((isDragging || isResizing) && dragElement) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = (e) => {
      if (isDragging || isResizing) {
        handleMouseUp(e);
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, dragElement]);

  // Si no hay diagrama actual, mostrar mensaje
  if (!currentDiagram) {
    return (
      <div className="uml-canvas-container no-diagram">
        <div className="no-diagram-message">
          <div className="no-diagram-icon">📊</div>
          <h3>No hay diagrama seleccionado</h3>
          <p>Selecciona un diagrama del proyecto para comenzar a diseñar</p>
        </div>
      </div>
    );
  }

  // Filtrar elementos válidos antes de renderizar
  const validElements = Array.isArray(umlElements) 
    ? umlElements.filter(element => element && element._id && element.type) 
    : [];

  // Debug: Log elementos para verificar tablas intermedias
  console.log('Canvas - Elementos UML disponibles:', umlElements?.length || 0);
  console.log('Canvas - Elementos válidos:', validElements?.length || 0);
  const intermediateTables = validElements.filter(el => el.type === 'intermediate_table');
  console.log('Canvas - Tablas intermedias encontradas:', intermediateTables.length);
  if (intermediateTables.length > 0) {
    console.log('Canvas - Tablas intermedias:', intermediateTables.map(t => ({ id: t._id, name: t.name, type: t.type })));
  }

  const validConnections = Array.isArray(connections)
    ? connections.filter(connection => connection && connection._id && 
        (connection.sourceId || connection.sourceElementId) && 
        (connection.targetId || connection.targetElementId))
    : [];

  // Debug: Log conexiones para verificar tablas intermedias
  console.log('Canvas - Conexiones disponibles:', connections?.length || 0);
  console.log('Canvas - Conexiones válidas:', validConnections?.length || 0);
  const intermediateConnections = validConnections.filter(conn => 
    conn.type === 'association' && 
    (conn.sourceElementId || conn.targetElementId)
  );
  console.log('Canvas - Conexiones de asociación:', intermediateConnections.length);
  if (intermediateConnections.length > 0) {
    console.log('Canvas - Conexiones:', intermediateConnections.map(c => ({ 
      id: c._id, 
      type: c.type, 
      source: c.sourceElementId, 
      target: c.targetElementId 
    })));
  }

  // Manejar clic en el canvas
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);
      setDragElement(null);

      selectElement(null);
      selectConnection(null);

      
      // Si estamos en modo conexión y hay un punto de inicio, cancelar
      if (connectionMode && connectionStart) {
        console.log('Cancelando creación de conexión');
        setConnectionStart(null);
        setConnectionEnd(null);
        setTempConnectionPath(null);
        setIsCreatingConnection(false);

        // Desactivar el modo de conexión al cancelar
        if (setConnectionMode) {
          setConnectionMode(null);
        }
      }
    }
  };

  // Manejar selección de elemento UML
  const handleSelectElement = (elementId) => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);
      setDragElement(null);
    }
    if (!elementId) {
      selectElement(null);
      return;
    }

    
    const element = validElements.find(el => el._id === elementId);
    if (element) {
      console.log('Canvas: Element found and selecting:', {
        id: element._id,
        name: element.name,
        type: element.type
      });
      
      // Si estamos en modo conexión
      if (connectionMode) {
        console.log('En modo conexión:', connectionMode);

        if (!connectionStart) {
          // Establecer punto de inicio
          console.log('Estableciendo elemento de inicio para conexión:', element.name);
          setConnectionStart(element);
          setIsCreatingConnection(true);
          // No seleccionamos el elemento para mantener el modo de conexión activo
        } else if (connectionStart._id !== elementId) {
          // Establecer punto final y crear conexión
          console.log('Estableciendo elemento destino y creando conexión:', element.name);
          const targetElement = element;
          createConnectionBetweenElements(connectionStart, targetElement);
          
          // Resetear estado de conexión
          setConnectionStart(null);
          setConnectionEnd(null);
          setTempConnectionPath(null);
          setIsCreatingConnection(false);

          // Desactivar el modo de conexión después de crear una conexión
          if (setConnectionMode) {
          setConnectionMode(null);
          }
        }
      } else {
        // Modo normal - seleccionar elemento
        console.log('Canvas: About to call selectElement from context');
        selectElement(element._id, element);
        selectConnection(null); // Deseleccionar conexión si hay una seleccionada
      }
    }
  };

  // Crear conexión entre dos elementos
  const createConnectionBetweenElements = async (sourceElement, targetElement) => {
    try {
      console.log('Creando conexión entre:', sourceElement.name, 'y', targetElement.name);

      // Obtener propiedades por defecto según el tipo de conexión
      const defaultProperties = getDefaultConnectionProperties(connectionMode, sourceElement.type, targetElement.type);

      const connectionData = {
        sourceElementId: sourceElement._id,
        targetElementId: targetElement._id,
        type: connectionMode,
        properties: defaultProperties
      };

      console.log('Datos de conexión a crear:', connectionData);
      const newConnection = await createConnection(connectionData);
      console.log('Conexión creada exitosamente:', newConnection);

      // Las tablas intermedias y sus conexiones se crean automáticamente en el backend
      if (connectionMode === 'intermediate-table' && newConnection) {
        console.log('✅ Tabla intermedia creada - las conexiones se generan automáticamente en el backend');
        // No seleccionar conexión para tablas intermedias ya que no se crea conexión directa
        return;
      }

      // Seleccionar la conexión recién creada para editar sus propiedades
      if (newConnection) {
        selectConnection(newConnection._id, newConnection);
      }
    } catch (error) {
      console.error('Error al crear conexión:', error);
      alert('Error al crear conexión: ' + error.message);
    }
  };

  // Obtener propiedades por defecto según el tipo de conexión
  const getDefaultConnectionProperties = (connectionType, sourceType, targetType) => {
    const defaults = {
      association: {
        name: 'asociación',
        sourceMultiplicity: '1',
        targetMultiplicity: '*',
        sourceRole: '',
        targetRole: '',
        bidirectional: false
      },
      aggregation: {
        name: 'agregación',
        sourceMultiplicity: '1',
        targetMultiplicity: '*',
        sourceRole: 'todo',
        targetRole: 'parte',
        bidirectional: false
      },
      composition: {
        name: 'composición',
        sourceMultiplicity: '1',
        targetMultiplicity: '*',
        sourceRole: 'todo',
        targetRole: 'parte',
        bidirectional: false
      },
      inheritance: {
        name: 'herencia',
        sourceMultiplicity: '',
        targetMultiplicity: '',
        sourceRole: 'hijo',
        targetRole: 'padre',
        bidirectional: false
      },
      realization: {
        name: 'realización',
        sourceMultiplicity: '',
        targetMultiplicity: '',
        sourceRole: 'implementador',
        targetRole: 'interfaz',
        bidirectional: false
      },
      dependency: {
        name: 'dependencia',
        sourceMultiplicity: '',
        targetMultiplicity: '',
        sourceRole: 'cliente',
        targetRole: 'proveedor',
        bidirectional: false
      },
      use: {
        name: 'uso',
        sourceMultiplicity: '',
        targetMultiplicity: '',
        sourceRole: 'actor',
        targetRole: 'caso de uso',
        bidirectional: false
      },
      include: {
        name: 'include',
        sourceMultiplicity: '',
        targetMultiplicity: '',
        sourceRole: 'base',
        targetRole: 'inclusión',
        bidirectional: false
      },
      extend: {
        name: 'extend',
        sourceMultiplicity: '',
        targetMultiplicity: '',
        sourceRole: 'extensión',
        targetRole: 'base',
        bidirectional: false
      },
      // Relaciones de Cardinalidad/Multiplicidad
      'one-to-one': {
        name: 'uno a uno',
        sourceMultiplicity: '1',
        targetMultiplicity: '1',
        sourceRole: 'uno',
        targetRole: 'uno',
        bidirectional: true,
        cardinality: { source: '1', target: '1' }
      },
      'one-to-many': {
        name: 'uno a muchos',
        sourceMultiplicity: '1',
        targetMultiplicity: '*',
        sourceRole: 'uno',
        targetRole: 'muchos',
        bidirectional: false,
        cardinality: { source: '1', target: '*' }
      },
      'many-to-one': {
        name: 'muchos a uno',
        sourceMultiplicity: '*',
        targetMultiplicity: '1',
        sourceRole: 'muchos',
        targetRole: 'uno',
        bidirectional: false,
        cardinality: { source: '*', target: '1' }
      },
      'many-to-many': {
        name: 'muchos a muchos',
        sourceMultiplicity: '*',
        targetMultiplicity: '*',
        sourceRole: 'muchos',
        targetRole: 'muchos',
        bidirectional: true,
        cardinality: { source: '*', target: '*' }
      },
      'zero-to-one': {
        name: 'cero a uno',
        sourceMultiplicity: '0..1',
        targetMultiplicity: '1',
        sourceRole: 'opcional',
        targetRole: 'obligatorio',
        bidirectional: false,
        cardinality: { source: '0..1', target: '1' }
      },
      'zero-to-many': {
        name: 'cero a muchos',
        sourceMultiplicity: '0..1',
        targetMultiplicity: '*',
        sourceRole: 'opcional',
        targetRole: 'muchos',
        bidirectional: false,
        cardinality: { source: '0..1', target: '*' }
      },
      'one-or-many': {
        name: 'uno o muchos',
        sourceMultiplicity: '1..*',
        targetMultiplicity: '*',
        sourceRole: 'uno o más',
        targetRole: 'muchos',
        bidirectional: false,
        cardinality: { source: '1..*', target: '*' }
      },
      // Tabla Intermedia
      'intermediate-table': {
        name: 'tabla intermedia',
        sourceMultiplicity: '*',
        targetMultiplicity: '*',
        sourceRole: 'entidad',
        targetRole: 'entidad',
        bidirectional: true,
        isIntermediateTable: true,
        cardinality: { source: '*', target: '*' }
      }
    };
    
    return defaults[connectionType] || {};
  };

  // Obtener estilo de conexión según el tipo
  const getConnectionStyle = (type) => {
    switch (type) {
      case 'inheritance':
        return { strokeDasharray: 'none', markerEnd: 'triangle' };
      case 'realization':
        return { strokeDasharray: '5,5', markerEnd: 'triangle' };
      case 'association':
        return { strokeDasharray: 'none', markerEnd: 'arrow' };
      case 'aggregation':
        return { strokeDasharray: 'none', markerEnd: 'diamond' };
      case 'composition':
        return { strokeDasharray: 'none', markerEnd: 'filledDiamond' };
      case 'dependency':
        return { strokeDasharray: '5,5', markerEnd: 'arrow' };
      // Estilos para relaciones de cardinalidad
      case 'one-to-one':
      case 'one-to-many':
      case 'many-to-one':
      case 'many-to-many':
      case 'zero-to-one':
      case 'zero-to-many':
      case 'one-or-many':
        return { strokeDasharray: 'none', markerEnd: 'arrow' };
      case 'intermediate-table':
        return { strokeDasharray: '3,3', markerEnd: 'arrow' };
      default:
        return { strokeDasharray: 'none', markerEnd: 'arrow' };
    }
  };

  // Manejar selección de conexión
  const handleSelectConnection = (connectionId) => {
    if (!connectionId) return;
    
    const connection = validConnections.find(conn => conn._id === connectionId);
    if (connection) {
      selectConnection(connectionId, connection);
      selectElement(null); // Deseleccionar elemento si hay uno seleccionado
    }
  };

  // Comenzar a arrastrar un elemento
  const handleElementDragStart = (e, elementId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!elementId) return;
    
    const element = validElements.find(el => el._id === elementId);
    if (!element) return;
    
    // Seleccionar el elemento si no está seleccionado
    if (!selectedElement || selectedElement._id !== elementId) {
      handleSelectElement(elementId);
    }
    
    setIsDragging(true);
    setDragElement({ ...element });
    
    if (notifyElementInteraction) {
      notifyElementInteraction(elementId, "moviendo");
    }
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    setDragOffset({
      x: e.clientX - (canvasRect.left + (element.position.x * zoom)),
      y: e.clientY - (canvasRect.top + (element.position.y * zoom))
    });
    
    setStartPos({
      x: element.position.x,
      y: element.position.y
    });
  };

  // Iniciar redimensionamiento
  const handleResizeStart = (e, direction, elementId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!elementId) return;
    
    const element = validElements.find(el => el._id === elementId);
    if (!element) return;
    
    // Seleccionar el elemento si no está seleccionado
    if (!selectedElement || selectedElement._id !== elementId) {
      handleSelectElement(elementId);
    }
    
    setIsResizing(true);
    setResizeDirection(direction);
    setDragElement({ ...element });
    
    if (notifyElementInteraction) {
      notifyElementInteraction(elementId, "redimensionando");
    }

    setStartPos({
      x: element.position.x,
      y: element.position.y
    });
    
    setStartSize({
      width: element.size.width,
      height: element.size.height
    });
    
    setDragOffset({
      x: e.clientX,
      y: e.clientY
    });
  };

  // Manejar movimiento del mouse
  const handleMouseMove = (e) => {
    if (e.target.closest('.uml-properties-container')) return;

    // Manejar creación de conexión temporal
    if (isCreatingConnection && connectionStart) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - canvasRect.left) / zoom;
      const mouseY = (e.clientY - canvasRect.top) / zoom;
      
      setTempConnectionPath({
        startX: connectionStart.position.x + connectionStart.size.width / 2,
        startY: connectionStart.position.y + connectionStart.size.height / 2,
        endX: mouseX,
        endY: mouseY
      });
    }

    if (!isDragging && !isResizing) return;
    if (!dragElement || !currentDiagram) return;
  
    e.preventDefault();
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    if (isDragging) {
      let newX = (e.clientX - canvasRect.left - dragOffset.x) / zoom;
      let newY = (e.clientY - canvasRect.top - dragOffset.y) / zoom;
      
      if (snapToGrid) {
        const gridSize = 20; // Grid más grande para UML
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }
      
      // Limitar al canvas
      newX = Math.max(0, Math.min(currentDiagram.canvas?.width - dragElement.size.width, newX));
      newY = Math.max(0, Math.min(currentDiagram.canvas?.height - dragElement.size.height, newY));
      
      const updatedElement = {
        ...dragElement,
        position: { x: newX, y: newY }
      };
      
      setDragElement(updatedElement);
      // Only update local selection, don't call server during drag
    } 
    else if (isResizing) {
      const deltaX = (e.clientX - dragOffset.x) / zoom;
      const deltaY = (e.clientY - dragOffset.y) / zoom;
      
      let newWidth = startSize.width;
      let newHeight = startSize.height;
      let newX = startPos.x;
      let newY = startPos.y;
      
      // Tamaños mínimos para elementos UML
      const minWidth = dragElement.type === 'class' ? 150 : 100;
      const minHeight = dragElement.type === 'class' ? 100 : 50;
      
      switch (resizeDirection) {
        case 'top-left':
          newWidth = Math.max(minWidth, startSize.width - deltaX);
          newHeight = Math.max(minHeight, startSize.height - deltaY);
          newX = startPos.x + (startSize.width - newWidth);
          newY = startPos.y + (startSize.height - newHeight);
          break;
        case 'top-right':
          newWidth = Math.max(minWidth, startSize.width + deltaX);
          newHeight = Math.max(minHeight, startSize.height - deltaY);
          newY = startPos.y + (startSize.height - newHeight);
          break;
        case 'bottom-left':
          newWidth = Math.max(minWidth, startSize.width - deltaX);
          newHeight = Math.max(minHeight, startSize.height + deltaY);
          newX = startPos.x + (startSize.width - newWidth);
          break;
        case 'bottom-right':
          newWidth = Math.max(minWidth, startSize.width + deltaX);
          newHeight = Math.max(minHeight, startSize.height + deltaY);
          break;
        default:
          break;
      }
      
      if (snapToGrid) {
        const gridSize = 20;
        newWidth = Math.round(newWidth / gridSize) * gridSize;
        newHeight = Math.round(newHeight / gridSize) * gridSize;
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }
      
      const updatedElement = {
        ...dragElement,
        position: { x: newX, y: newY },
        size: { width: newWidth, height: newHeight }
      };
      
      setDragElement(updatedElement);
      // Only update local selection, don't call server during resize
    }
  };

  // Finalizar operación
  const handleMouseUp = async (e) => {
    if (e.target.closest('.uml-properties-container')) return;

    if (!isDragging && !isResizing) return;
    
    const elementId = dragElement?._id;
    if (!elementId || !dragElement) {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);
      setDragElement(null);
      return;
    }
    
    // Store the final position before any async operations
    const finalPosition = {
      x: Math.round(dragElement.position.x),
      y: Math.round(dragElement.position.y)
    };
    
    const finalSize = {
      width: Math.round(dragElement.size.width),
      height: Math.round(dragElement.size.height)
    };

    // NO ACTUALIZAR selectedElement AÚN - Esperar la respuesta del servidor
    
    try {
      if (isDragging || isResizing) {
        console.log('Finalizing element position:', {
          elementId,
          finalPosition,
          finalSize
        });
        
        // Update server with position/size only
        const updatedElement = await updateUMLElement(elementId, {
          position: finalPosition,
          size: finalSize
        });

        // AHORA SÍ actualizar selectedElement con la respuesta del servidor
        if (updatedElement) {
          selectElement(elementId, updatedElement);
        }
        
        console.log('Element position updated on server successfully');
      }
      
      if (endElementInteraction) {
        endElementInteraction(elementId);
      }
    } catch (error) {
      console.error('Error al actualizar el elemento UML:', error);
      // En caso de error, revertir a la posición original
      const originalElement = validElements.find(el => el._id === elementId);
      if (originalElement) {
        selectElement(elementId, originalElement);
      }
      alert('Error al guardar la posición del elemento');
    } finally {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);
      setDragElement(null);
    }
  };

  // Manejar eliminación de elemento
  const handleDeleteElement = async (elementId) => {
    if (!elementId) return;
    try {
      await deleteUMLElement(elementId);
    } catch (error) {
      console.error('Error al eliminar el elemento UML:', error);
    }
  };

  // Manejar eliminación de conexión
  const handleDeleteConnection = async (connectionId) => {
    if (!connectionId) return;
    try {
      await deleteConnection(connectionId);
    } catch (error) {
      console.error('Error al eliminar la conexión:', error);
    }
  };

  // Obtener posición de conexión en elemento
  const getConnectionPoint = (element, side = 'center') => {
    const { position, size } = element;
    switch (side) {
      case 'top':
        return { x: position.x + size.width / 2, y: position.y };
      case 'bottom':
        return { x: position.x + size.width / 2, y: position.y + size.height };
      case 'left':
        return { x: position.x, y: position.y + size.height / 2 };
      case 'right':
        return { x: position.x + size.width, y: position.y + size.height / 2 };
      default:
        return { x: position.x + size.width / 2, y: position.y + size.height / 2 };
    }
  };

  return (
    <div 
      className={`uml-canvas-container ${viewMode}-mode ${diagramType}-diagram`}
      onMouseLeave={handleMouseUp}  // Solo mantener este
    >
      <div className="uml-canvas-wrapper">
        <div 
          ref={canvasRef}
          className={`uml-canvas ${gridVisible ? 'grid-visible' : ''}`}
          style={{
            width: currentDiagram?.canvas?.width || 1200,
            height: currentDiagram?.canvas?.height || 800,
            backgroundColor: currentDiagram?.canvas?.background || '#FFFFFF',
            transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
          }}
          onClick={handleCanvasClick}
        >
          {/* Grid pattern para UML */}
          {gridVisible && (
            <defs>
              <pattern id="umlGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="1" />
              </pattern>
            </defs>
          )}
          
          {/* SVG para conexiones */}
          <svg 
            className="uml-connections-layer"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1
            }}
          >
            <defs>
              {/* Definir marcadores para diferentes tipos de conexiones */}
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="black" />
              </marker>
              <marker id="triangle" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="none" stroke="black" strokeWidth="1" />
              </marker>
              <marker id="diamond" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                <polygon points="0 5, 5 0, 10 5, 5 10" fill="none" stroke="black" strokeWidth="1" />
              </marker>
              <marker id="filledDiamond" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                <polygon points="0 5, 5 0, 10 5, 5 10" fill="black" />
              </marker>
            </defs>
            
            {/* Conexiones existentes */}
            {validConnections.map(connection => {
              // Handle both sourceId/targetId and sourceElementId/targetElementId
              const sourceId = connection.sourceId || connection.sourceElementId;
              const targetId = connection.targetId || connection.targetElementId;
              
              const sourceElement = validElements.find(el => el._id === sourceId);
              const targetElement = validElements.find(el => el._id === targetId);
              
              if (!sourceElement || !targetElement) return null;
              
              const startPoint = getConnectionPoint(sourceElement);
              const endPoint = getConnectionPoint(targetElement);
              
              return (
                <UMLConnection
                  key={connection._id}
                  connection={connection}
                  startPoint={startPoint}
                  endPoint={endPoint}
                  isSelected={selectedConnection && selectedConnection._id === connection._id}
                  onSelect={() => handleSelectConnection(connection._id)}
                />
              );
            })}
            
            {/* Conexión temporal mientras se crea */}
            {tempConnectionPath && (
              <line
                x1={tempConnectionPath.startX}
                y1={tempConnectionPath.startY}
                x2={tempConnectionPath.endX}
                y2={tempConnectionPath.endY}
                stroke="#007ACC"
                strokeWidth="2"
                strokeDasharray="5,5"
                markerEnd="url(#arrow)"
              />
            )}
          </svg>
          
          {validElements.map(element => {
            let displayElement = element;
            
            // Durante drag/resize, SIEMPRE usar dragElement
            if ((isDragging || isResizing) && dragElement && dragElement._id === element._id) {
              displayElement = dragElement;
            }
            // Solo si está seleccionado Y no está siendo arrastrado, merger con selectedElement
            else if (selectedElement && selectedElement._id === element._id && !isDragging && !isResizing) {
              displayElement = {
                ...element,
                ...selectedElement,
                properties: {
                  ...element.properties,
                  ...selectedElement.properties
                }
              };
            }
              
            return (
              <UMLElement
                key={element._id}
                element={displayElement}
                isSelected={selectedElement && selectedElement._id === element._id}
                onSelect={() => handleSelectElement(element._id)}
                onDragStart={(e) => handleElementDragStart(e, element._id)}
                onResizeStart={(e, direction) => handleResizeStart(e, direction, element._id)}
                diagramType={diagramType}
                connectionMode={connectionMode}
                isConnectionSource={connectionStart && connectionStart._id === element._id}
              />
            );
          })}
        </div>
      </div>
      
      {/* Información del diagrama */}
      <div className="uml-diagram-info">
        <div className="diagram-info-display">
          <span className="diagram-name">{currentDiagram?.name || 'Sin nombre'}</span>
          <span className="diagram-type-badge">{diagramType}</span>
          <span className="diagram-dimensions">
            ({currentDiagram?.canvas?.width || 1200} × {currentDiagram?.canvas?.height || 800})
          </span>
          <span className="elements-count">
            {validElements.length} elemento{validElements.length !== 1 ? 's' : ''}
          </span>
          <span className="connections-count">
            {validConnections.length} conexión{validConnections.length !== 1 ? 'es' : ''}
          </span>
        </div>
      </div>
      
      {/* Instrucciones para modo conexión */}
      {connectionMode && (
        <div className="connection-instructions">
          <div className="instructions-content">
            {!connectionStart ? (
              <div>
                <p><strong>Modo: {connectionMode}</strong></p>
              <p>Haz clic en el primer elemento para iniciar la conexión</p>
                <p><small>Haz clic en el canvas vacío para cancelar</small></p>
              </div>
            ) : (
              <div>
                <p><strong>Conectando: {connectionStart.name}</strong></p>
              <p>Haz clic en el segundo elemento para completar la conexión</p>
                <p><small>Haz clic en el canvas vacío para cancelar</small></p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UMLCanvas;
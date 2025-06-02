// src/components/editor/Canvas.js - CORREGIDO
import React, { useRef, useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import Element from './Element';
import './Canvas.css';

const Canvas = ({ viewMode = 'design' }) => {
  const { 
    project, 
    currentScreen,
    elements, 
    selectedElement,
    selectElement,
    updateElement,
    deleteElement,
    zoom,
    position,
    gridVisible,
    snapToGrid,
    notifyElementInteraction,
    endElementInteraction,
    fetchElements
  } = useEditor();
  
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragElement, setDragElement] = useState(null); // Elemento que se está arrastrando

  useEffect(() => {
    if (currentScreen?._id && (!elements || elements.length === 0)) {
      // Si no hay elementos locales, solicitar al servidor
      fetchElements(currentScreen._id);
    }
  }, [currentScreen?._id, fetchElements]);


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
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [selectedElement]);

  // Si no hay screen actual, mostrar mensaje
  if (!currentScreen) {
    return (
      <div className="canvas-container no-screen">
        <div className="no-screen-message">
          <div className="no-screen-icon">📱</div>
          <h3>No hay pantalla seleccionada</h3>
          <p>Selecciona una pantalla del proyecto para comenzar a diseñar</p>
        </div>
      </div>
    );
  }

  // Filtrar elementos válidos antes de renderizar
  const validElements = Array.isArray(elements) 
    ? elements.filter(element => element && element._id && element.type) 
    : [];

  
  // Obtener información del dispositivo
  const deviceType = project?.deviceType || 'custom';
  
  // Renderizar el marco del dispositivo móvil
  const renderDeviceFrame = () => {
    if (!currentScreen) return null;
    
    const deviceStyles = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none'
    };
    
    // Estilos específicos según el tipo de dispositivo
    let deviceFrameContent = null;
    
    switch(deviceType) {
      case 'iphone12':
        deviceFrameContent = (
          <div className="device-notch" style={{ 
            top: '0', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            width: '40%', 
            height: '25px', 
            backgroundColor: '#111', 
            borderBottomLeftRadius: '10px', 
            borderBottomRightRadius: '10px' 
          }}></div>
        );
        break;
      case 'iphone8':
        deviceFrameContent = (
          <div className="device-home-button" style={{ 
            bottom: '10px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            width: '40px', 
            height: '40px', 
            border: '1px solid #999', 
            borderRadius: '50%' 
          }}></div>
        );
        break;
      case 'pixel5':
        deviceFrameContent = (
          <div className="device-camera" style={{ 
            top: '10px', 
            right: '10px', 
            width: '10px', 
            height: '10px', 
            backgroundColor: '#333', 
            borderRadius: '50%' 
          }}></div>
        );
        break;
      case 'samsungs21':
        deviceFrameContent = (
          <div className="device-camera" style={{ 
            top: '10px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            width: '8px', 
            height: '8px', 
            backgroundColor: '#333', 
            borderRadius: '50%' 
          }}></div>
        );
        break;
      default:
        deviceFrameContent = null;
        break;
    }
    
    return (
      <div className={`device-frame device-${deviceType}`} style={deviceStyles}>
        {deviceFrameContent}
        <div className="device-status-bar" style={{ 
          height: '20px', 
          width: '100%', 
          top: 0, 
          backgroundColor: 'rgba(0,0,0,0.1)', 
          position: 'absolute', 
          zIndex: 10, 
          display: 'flex', 
          justifyContent: 'space-between', 
          padding: '0 10px', 
          alignItems: 'center', 
          fontSize: '10px' 
        }}>
          <span>9:41</span>
          <div style={{ display: 'flex', gap: '5px' }}>
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>
      </div>
    );
  };

  // Manejar clic en el canvas
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      selectElement(null);
    }
  };

  // Manejar selección de elemento - CORREGIDO: Solo selecciona, no toggle
  const handleSelectElement = (elementId) => {
    if (!elementId) return;
    
    const element = validElements.find(el => el._id === elementId);
    if (element) {
      selectElement(elementId, element);
    }
  };

  // Comenzar a arrastrar un elemento - CORREGIDO
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
    setDragElement({...element}); // Copia del elemento para drag
    
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

  // Iniciar redimensionamiento - CORREGIDO
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
    setDragElement({...element}); // Copia del elemento para resize
    
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

  // Manejar movimiento del mouse - CORREGIDO: Actualiza en tiempo real
  const handleMouseMove = (e) => {
    if (e.target.closest('.element-properties')) return;

    if (!isDragging && !isResizing) return;
    if (!dragElement || !currentScreen) return;
  
    e.preventDefault();
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    if (isDragging) {
      let newX = (e.clientX - canvasRect.left - dragOffset.x) / zoom;
      let newY = (e.clientY - canvasRect.top - dragOffset.y) / zoom;
      
      if (snapToGrid) {
        const gridSize = 10;
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }
      
      // Limitar al canvas
      newX = Math.max(0, Math.min(currentScreen.canvas?.width - dragElement.size.width, newX));
      newY = Math.max(0, Math.min(currentScreen.canvas?.height - dragElement.size.height, newY));
      
      // Actualizar elemento de drag local
      const updatedElement = {
        ...dragElement,
        position: { x: newX, y: newY }
      };
      
      setDragElement(updatedElement);
      selectElement(dragElement._id, updatedElement); // Actualizar en tiempo real
    } 
    else if (isResizing) {
      const deltaX = (e.clientX - dragOffset.x) / zoom;
      const deltaY = (e.clientY - dragOffset.y) / zoom;
      
      let newWidth = startSize.width;
      let newHeight = startSize.height;
      let newX = startPos.x;
      let newY = startPos.y;
      
      switch (resizeDirection) {
        case 'top-left':
          newWidth = Math.max(20, startSize.width - deltaX);
          newHeight = Math.max(20, startSize.height - deltaY);
          newX = startPos.x + (startSize.width - newWidth);
          newY = startPos.y + (startSize.height - newHeight);
          break;
        case 'top-right':
          newWidth = Math.max(20, startSize.width + deltaX);
          newHeight = Math.max(20, startSize.height - deltaY);
          newY = startPos.y + (startSize.height - newHeight);
          break;
        case 'bottom-left':
          newWidth = Math.max(20, startSize.width - deltaX);
          newHeight = Math.max(20, startSize.height + deltaY);
          newX = startPos.x + (startSize.width - newWidth);
          break;
        case 'bottom-right':
          newWidth = Math.max(20, startSize.width + deltaX);
          newHeight = Math.max(20, startSize.height + deltaY);
          break;
        default:
          break;
      }
      
      if (snapToGrid) {
        const gridSize = 10;
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
      selectElement(dragElement._id, updatedElement); // Actualizar en tiempo real
    }
  };

  // Finalizar operación - CORREGIDO: Solo guarda al final
  const handleMouseUp = async (e) => {
    if (e.target.closest('.element-properties')) return;

  if (!isDragging && !isResizing) return;
    
    const elementId = dragElement?._id;
    if (!elementId || !dragElement) {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);
      setDragElement(null);
      return;
    }
    
    try {
      if (isDragging || isResizing) {
        const updatedData = {
          position: { ...dragElement.position },
          size: { ...dragElement.size }
        };
        
        // Guardar en el servidor
        const updatedElement = await updateElement(elementId, updatedData);
        
        // Actualizar el estado local con la respuesta del servidor
        selectElement(elementId, updatedElement);
      }
      
      if (endElementInteraction) {
        endElementInteraction(elementId);
      }
    } catch (error) {
      console.error('Error al actualizar el elemento:', error);
      // Revertir cambios en caso de error
      const originalElement = validElements.find(el => el._id === elementId);
      if (originalElement) {
        selectElement(elementId, originalElement);
      }
    } finally {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);
      setDragElement(null);
    }
  };

  // Manejar la eliminación de un elemento
  const handleDeleteElement = async (elementId) => {
    if (!elementId) return;
    try {
      await deleteElement(elementId);
    } catch (error) {
      console.error('Error al eliminar el elemento:', error);
    }
  };



  return (
    <div 
      className={`canvas-container mobile-device-canvas ${viewMode}-mode`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="device-wrapper">
        <div 
          ref={canvasRef}
          className={`canvas ${gridVisible ? 'grid-visible' : ''} device-${deviceType}`}
          style={{
            width: currentScreen?.canvas?.width || 360,
            height: currentScreen?.canvas?.height || 640,
            backgroundColor: currentScreen?.canvas?.background || '#FFFFFF',
            transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
            borderRadius: deviceType === 'iphone12' ? '40px' : 
                           deviceType === 'iphone8' ? '20px' : 
                           deviceType === 'pixel5' ? '30px' : 
                           deviceType === 'samsungs21' ? '25px' : '0'
          }}
          onClick={handleCanvasClick}
        >
          {/* Marco del dispositivo */}
          {renderDeviceFrame()}
          
          {/* Elementos del diseño */}
          {validElements.map(element => {
            // Si está siendo arrastrado, usar dragElement, sino el elemento original
            const displayElement = (isDragging || isResizing) && dragElement && dragElement._id === element._id 
              ? dragElement 
              : element;
              
            return (
              <Element
                key={element._id}
                element={displayElement}
                isSelected={selectedElement && selectedElement._id === element._id}
                onSelect={() => handleSelectElement(element._id)}
                onDragStart={(e) => handleElementDragStart(e, element._id)}
                onResizeStart={(e, direction) => handleResizeStart(e, direction, element._id)}
              />
            );
          })}
        </div>
      </div>
      
      {/* Indicador de dispositivo móvil */}
      <div className="device-info">
        <div className="screen-info-display">
          <span className="screen-name">{currentScreen?.name || 'Sin nombre'}</span>
          <span className="screen-dimensions">
            {deviceType !== 'custom' ? deviceType : 'custom'} 
            ({currentScreen?.canvas?.width || 360} × {currentScreen?.canvas?.height || 640})
          </span>
          <span className="elements-count">
            {validElements.length} elemento{validElements.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Canvas;
// src/components/editor/Canvas.js
import React, { useRef, useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import Element from './Element';
import './Canvas.css';

const Canvas = ({ viewMode = 'design' }) => {
  const { 
    project, 
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
    endElementInteraction
  } = useEditor();
  
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeElementId, setActiveElementId] = useState(null); // Nuevo estado para rastrear elemento activo

  // Obtener información del dispositivo
  const deviceType = project?.deviceType || 'custom';
  
  // Renderizar el marco del dispositivo móvil
  const renderDeviceFrame = () => {
    // Tu implementación existente...
    if (!project) return null;
    
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
          <div className="device-notch" style={{ top: '0', left: '50%', transform: 'translateX(-50%)', width: '40%', height: '25px', backgroundColor: '#111', borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px' }}></div>
        );
        break;
      case 'iphone8':
        deviceFrameContent = (
          <div className="device-home-button" style={{ bottom: '10px', left: '50%', transform: 'translateX(-50%)', width: '40px', height: '40px', border: '1px solid #999', borderRadius: '50%' }}></div>
        );
        break;
      case 'pixel5':
        deviceFrameContent = (
          <div className="device-camera" style={{ top: '10px', right: '10px', width: '10px', height: '10px', backgroundColor: '#333', borderRadius: '50%' }}></div>
        );
        break;
      case 'samsungs21':
        deviceFrameContent = (
          <div className="device-camera" style={{ top: '10px', left: '50%', transform: 'translateX(-50%)', width: '8px', height: '8px', backgroundColor: '#333', borderRadius: '50%' }}></div>
        );
        break;
      default:
        deviceFrameContent = null;
    }
    
    return (
      <div className={`device-frame device-${deviceType}`} style={deviceStyles}>
        {deviceFrameContent}
        <div className="device-status-bar" style={{ height: '20px', width: '100%', top: 0, backgroundColor: 'rgba(0,0,0,0.1)', position: 'absolute', zIndex: 10, display: 'flex', justifyContent: 'space-between', padding: '0 10px', alignItems: 'center', fontSize: '10px' }}>
          <span>9:41</span>
          <div style={{ display: 'flex', gap: '5px' }}>
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>
      </div>
    );
  };

  // Manejar clic en el canvas - Modificado para limpiar el elemento activo
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      selectElement(null);
      setActiveElementId(null); // Limpiar el ID del elemento activo
    }
  };

  // Manejar selección de elemento - Nueva función
  const handleSelectElement = (elementId) => {
    if (!elementId) return;
    
    // Actualizar el elemento activo
    setActiveElementId(elementId);
    
    // Si el elemento no está seleccionado, seleccionarlo
    if (!selectedElement || selectedElement._id !== elementId) {
      const element = elements.find(el => el._id === elementId);
      if (element) {
        selectElement(elementId, element);
      }
    }
  };

  // Comenzar a arrastrar un elemento - Modificado para usar el elemento activo
  const handleElementDragStart = (e, elementId) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Si se proporciona un ID explícito, úsalo; de lo contrario, usa el elemento activo o seleccionado
    const targetId = elementId || activeElementId || (selectedElement ? selectedElement._id : null);
    if (!targetId) return;
    
    // Actualizar el estado de selección si es necesario
    handleSelectElement(targetId);
    
    setIsDragging(true);
    
    // Obtener el elemento con el que estamos trabajando
    const element = elements.find(el => el._id === targetId) || selectedElement;
    if (!element) return;
    
    // Emitir evento de inicio de interacción
    notifyElementInteraction(targetId, "moviendo");
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Calcular el offset desde donde se hizo clic
    setDragOffset({
      x: e.clientX - (canvasRect.left + (element.position.x * zoom)),
      y: e.clientY - (canvasRect.top + (element.position.y * zoom))
    });
    
    setStartPos({
      x: element.position.x,
      y: element.position.y
    });
  };

  // Iniciar redimensionamiento - Modificado para usar el elemento activo
  const handleResizeStart = (e, direction, elementId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const targetId = elementId || activeElementId || (selectedElement ? selectedElement._id : null);
    if (!targetId) return;
    
    // Actualizar el estado de selección si es necesario
    handleSelectElement(targetId);
    
    setIsResizing(true);
    setResizeDirection(direction);
    
    // Obtener el elemento con el que estamos trabajando
    const element = elements.find(el => el._id === targetId) || selectedElement;
    if (!element) return;
    
    notifyElementInteraction(targetId, "redimensionando");

    setStartPos({
      x: element.position.x,
      y: element.position.y
    });
    
    setStartSize({
      width: element.size.width,
      height: element.size.height
    });
    
    // Guardar posición del mouse
    setDragOffset({
      x: e.clientX,
      y: e.clientY
    });
  };

  // Manejar movimiento del mouse para arrastre/redimensionamiento
  const handleMouseMove = (e) => {
    if (!isDragging && !isResizing) return;
    if (!selectedElement) return;
    
    e.preventDefault();
    
    // Calcular movimiento para el elemento actualmente seleccionado
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    if (isDragging) {
      // Calcular nueva posición
      let newX = (e.clientX - canvasRect.left - dragOffset.x) / zoom;
      let newY = (e.clientY - canvasRect.top - dragOffset.y) / zoom;
      
      // Ajustar a la cuadrícula si está activado
      if (snapToGrid) {
        const gridSize = 10;
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }
      
      // Limitar al canvas
      newX = Math.max(0, Math.min(project.canvas.width - selectedElement.size.width, newX));
      newY = Math.max(0, Math.min(project.canvas.height - selectedElement.size.height, newY));
      
      // Actualizar la posición visual del elemento
      const updatedElement = {
        ...selectedElement,
        position: { x: newX, y: newY }
      };
      
      // Actualizar el estado en tiempo real
      selectElement(selectedElement._id, updatedElement);
    } 
    else if (isResizing) {
      // El código de redimensionamiento permanece igual
      // ...
      // Calcular cambio desde inicio
      const deltaX = (e.clientX - dragOffset.x) / zoom;
      const deltaY = (e.clientY - dragOffset.y) / zoom;
      
      let newWidth = startSize.width;
      let newHeight = startSize.height;
      let newX = startPos.x;
      let newY = startPos.y;
      
      // Ajustar según dirección
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
      
      // Ajustar a la cuadrícula
      if (snapToGrid) {
        const gridSize = 10;
        newWidth = Math.round(newWidth / gridSize) * gridSize;
        newHeight = Math.round(newHeight / gridSize) * gridSize;
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }
      
      // Actualizar el estado visual
      const updatedElement = {
        ...selectedElement,
        position: { x: newX, y: newY },
        size: { width: newWidth, height: newHeight }
      };
      
      selectElement(selectedElement._id, updatedElement);
    }
  };

  // Finalizar operación - Modificado para usar el elemento activo
  const handleMouseUp = async (e) => {
    if (!isDragging && !isResizing) return;
    
    // Usar el ID del elemento activo o el seleccionado
    const elementId = activeElementId || (selectedElement ? selectedElement._id : null);
    if (!elementId || !selectedElement) {
      // Limpiar estados de arrastre aún si no hay elemento
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);
      return;
    }
    
    try {
      if (isDragging) {
        // Guardar la nueva posición en la base de datos
        await updateElement(elementId, { 
          position: selectedElement.position 
        });
      } 
      else if (isResizing) {
        // Guardar nuevas dimensiones y posición
        await updateElement(elementId, {
          position: selectedElement.position,
          size: selectedElement.size
        });
      }
      endElementInteraction(elementId);
    } catch (error) {
      console.error('Error al actualizar el elemento:', error);
    } finally {
      // Limpiar los estados de arrastre pero mantener el elemento activo
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);
    }
  };

  // Manejar la eliminación de un elemento
  const handleDeleteElement = async (elementId) => {
    if (!elementId) return;
    try {
      await deleteElement(elementId);
      
      // Si el elemento eliminado era el activo, limpiarlo
      if (elementId === activeElementId) {
        setActiveElementId(null);
      }
    } catch (error) {
      console.error('Error al eliminar el elemento:', error);
    }
  };

  // Manejar eventos de teclado para eliminar elementos
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Usar el elemento activo o el seleccionado
      const elementId = activeElementId || (selectedElement ? selectedElement._id : null);
      if (elementId && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        handleDeleteElement(elementId);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElement, activeElementId]);

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
            width: project?.canvas?.width || 360,
            height: project?.canvas?.height || 640,
            backgroundColor: project?.canvas?.background || '#FFFFFF',
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
          {elements.map(element => (
            <Element
              key={element._id}
              element={element}
              isSelected={selectedElement && selectedElement._id === element._id}
              onSelect={() => handleSelectElement(element._id)}
              onDragStart={(e) => handleElementDragStart(e, element._id)}
              onResizeStart={(e, direction) => handleResizeStart(e, direction, element._id)}
            />
          ))}
        </div>
      </div>
      
      {/* Indicador de dispositivo móvil */}
      <div className="device-info">
        {deviceType !== 'custom' ? deviceType : 'custom'} ({project?.canvas?.width || 360} × {project?.canvas?.height || 640})
      </div>
    </div>
  );
};

export default Canvas;
// src/components/editor/Canvas.js
import React, { useRef, useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import Element from './Element';
import './Canvas.css';

const Canvas = () => {
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

  // Manejar clic en el canvas
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      selectElement(null);
    }
  };

  // Comenzar a arrastrar un elemento - CLAVE para el arrastre
  const handleElementDragStart = (e) => {
    if (!selectedElement) return;
  
    e.preventDefault();
    
    setIsDragging(true);
    
    // Emitir evento de inicio de interacción
    notifyElementInteraction(selectedElement._id, "moviendo");    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Calcular el offset desde donde se hizo clic
    setDragOffset({
      x: e.clientX - (canvasRect.left + (selectedElement.position.x * zoom)),
      y: e.clientY - (canvasRect.top + (selectedElement.position.y * zoom))
    });
    
    setStartPos({
      x: selectedElement.position.x,
      y: selectedElement.position.y
    });
  };

  // Iniciar redimensionamiento
  const handleResizeStart = (e, direction) => {
    if (!selectedElement) return;
    
    e.preventDefault();  // Importante!
    console.log("Iniciando redimensionamiento, dirección:", direction);
    
    setIsResizing(true);
    setResizeDirection(direction);
    notifyElementInteraction(selectedElement._id, "redimensionando");

    setStartPos({
      x: selectedElement.position.x,
      y: selectedElement.position.y
    });
    
    setStartSize({
      width: selectedElement.size.width,
      height: selectedElement.size.height
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
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    if (isDragging) {
      console.log("Arrastrando elemento");
      
      // Calcular nueva posición
      let newX = (e.clientX - canvasRect.left - dragOffset.x) / zoom;
      let newY = (e.clientY - canvasRect.top - dragOffset.y) / zoom;
      
      // Ajustar a la cuadrícula si está activado
      if (snapToGrid) {
        const gridSize = 10;
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }
      
      console.log("Nueva posición:", { x: newX, y: newY });
      
      // Actualizar la posición visual del elemento
      const updatedElement = {
        ...selectedElement,
        position: { x: newX, y: newY }
      };
      
      // Aquí está la clave: actualizar el estado en tiempo real
      selectElement(selectedElement._id, updatedElement);
    } 
    else if (isResizing) {
      console.log("Redimensionando elemento");
      
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
      
      console.log("Nuevas dimensiones:", { 
        position: { x: newX, y: newY },
        size: { width: newWidth, height: newHeight }
      });
      
      // Actualizar el estado visual
      const updatedElement = {
        ...selectedElement,
        position: { x: newX, y: newY },
        size: { width: newWidth, height: newHeight }
      };
      
      selectElement(selectedElement._id, updatedElement);
    }
  };

  // Finalizar operación
  const handleMouseUp = async () => {
    if (!isDragging && !isResizing) return;
    if (!selectedElement) return;
    
    console.log("Finalizando operación de arrastre/redimensionamiento");
    
    try {
      if (isDragging) {
        // Guardar la nueva posición en la base de datos
        await updateElement(selectedElement._id, { 
          position: selectedElement.position 
        });
        console.log("Posición guardada:", selectedElement.position);
      } 
      else if (isResizing) {
        // Guardar nuevas dimensiones y posición
        await updateElement(selectedElement._id, {
          position: selectedElement.position,
          size: selectedElement.size
        });
        console.log("Dimensiones guardadas:", selectedElement.size);
      }
      endElementInteraction(selectedElement._id);
    } catch (error) {
      console.error('Error al actualizar el elemento:', error);
    }
    
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
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

  // Manejar eventos de teclado para eliminar elementos
  useEffect(() => {
    const handleKeyDown = (e) => {
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

  return (
    <div 
      className="canvas-container"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        ref={canvasRef}
        className={`canvas ${gridVisible ? 'grid-visible' : ''}`}
        style={{
          width: project?.canvas?.width || 1440,
          height: project?.canvas?.height || 900,
          backgroundColor: project?.canvas?.background || '#FFFFFF',
          transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`
        }}
        onClick={handleCanvasClick}
      >
        {elements.map(element => (
          <Element
            key={element._id}
            element={element}
            isSelected={selectedElement && selectedElement._id === element._id}
            onDragStart={handleElementDragStart}
            onResizeStart={handleResizeStart}
          />
        ))}
      </div>
    </div>
  );
};

export default Canvas;
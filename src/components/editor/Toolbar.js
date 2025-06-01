// src/components/editor/Toolbar.js - CORREGIDO
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor } from '../../context/EditorContext';
import './Toolbar.css';
import ShareProjectModal from './ShareProjectModal';

const Toolbar = ({ viewMode, setViewMode, toggleSidebar, toggleProperties, toggleAiAssistant, aiAssistantOpen }) => {
  const { 
    project,
    zoom,
    position,
    gridVisible,
    snapToGrid,
    updateViewport,
    setGridVisible,
    setSnapToGrid,
    exportToFlutter,
    exportLoading
  } = useEditor();
  
  const navigate = useNavigate();
  const [currentZoom, setCurrentZoom] = useState(zoom * 100);
  const [showShareModal, setShowShareModal] = useState(false);

  // Opciones de zoom predefinidas
  const zoomOptions = [25, 50, 75, 100, 125, 150, 200];

  // Cambiar el zoom
  const handleZoomChange = (newZoomPercent) => {
    const newZoom = newZoomPercent / 100;
    setCurrentZoom(newZoomPercent);
    if (updateViewport) {
      updateViewport(newZoom, position);
    }
  };
  
  // Zoom con la rueda del mouse
  const handleZoomIn = () => {
    const newZoomPercent = Math.min(currentZoom + 25, 400);
    handleZoomChange(newZoomPercent);
  };

  const handleZoomOut = () => {
    const newZoomPercent = Math.max(currentZoom - 25, 25);
    handleZoomChange(newZoomPercent);
  };

  // Restablecer la vista
  const handleResetView = () => {
    setCurrentZoom(100);
    if (updateViewport) {
      updateViewport(1, { x: 0, y: 0 });
    }
  };

  // Volver al dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Exportar código - CORRECCIÓN: Manejo de errores
  const handleExport = async () => {
    try {
      if (exportToFlutter) {
        await exportToFlutter();
      } else {
        console.error('Función exportToFlutter no disponible');
        alert('Error: Función de exportación no disponible');
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar: ' + (error.message || 'Error desconocido'));
    }
  };

  return (
    <div className="toolbar flutter-toolbar">
      <div className="toolbar-section">
        <button 
          className="toolbar-button"
          onClick={handleBackToDashboard}
          title="Volver al Dashboard"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        
        <span className="project-name">
          {project?.name}
          <span className="device-badge">{project?.deviceType || 'custom'}</span>
        </span>
      </div>
      
      <div className="toolbar-section view-modes">
        <button 
          className={`mode-button ${viewMode === 'design' ? 'active' : ''}`}
          onClick={() => setViewMode('design')}
          title="Modo Diseño"
        >
          <i className="fas fa-paint-brush"></i> Diseño
        </button>

        {/* Botón para el Asistente IA */}
        <button 
          className={`toolbar-button ${aiAssistantOpen ? 'active' : ''}`}
          onClick={toggleAiAssistant}
          title="Asistente IA de Diseño"
        >
          <i className="fa fa-magic"></i>
        </button>
      </div>
      
      <div className="toolbar-section">
        <button 
          className="toolbar-button"
          onClick={toggleSidebar}
          title="Mostrar/Ocultar Componentes"
        >
          <i className="fas fa-th-large"></i>
        </button>

        <button 
          className={`toolbar-button ${gridVisible ? 'active' : ''}`}
          onClick={() => setGridVisible && setGridVisible(!gridVisible)}
          title="Mostrar/Ocultar Cuadrícula"
        >
          <i className="fas fa-th"></i>
        </button>
        
        <button 
          className={`toolbar-button ${snapToGrid ? 'active' : ''}`}
          onClick={() => setSnapToGrid && setSnapToGrid(!snapToGrid)}
          title="Ajustar a Cuadrícula"
        >
          <i className="fas fa-magnet"></i>
        </button>
      </div>
      
      <div className="toolbar-section">
        <button 
          className="toolbar-button"
          onClick={handleZoomOut}
          title="Alejar"
        >
          <i className="fas fa-search-minus"></i>
        </button>
        
        <div className="zoom-selector">
          <select 
            value={currentZoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
          >
            {zoomOptions.map(option => (
              <option key={option} value={option}>{option}%</option>
            ))}
          </select>
        </div>
        
        <button 
          className="toolbar-button"
          onClick={handleZoomIn}
          title="Acercar"
        >
          <i className="fas fa-search-plus"></i>
        </button>
        
        <button 
          className="toolbar-button"
          onClick={handleResetView}
          title="Restablecer Vista"
        >
          <i className="fas fa-home"></i>
        </button>
      </div>
      
      <div className="toolbar-section">
        <button 
          className="share-button"
          onClick={() => setShowShareModal(true)}
          title="Compartir proyecto"
        >
          <i className="fa fa-share-alt"></i> Compartir
        </button>
        
        <button 
          className="export-button flutter-export-button"
          onClick={handleExport}
          disabled={exportLoading}
          title="Exportar a Flutter/Dart"
        >
          {exportLoading ? 'Exportando...' : 'Exportar a Flutter'}
        </button>
      </div>

      {showShareModal && (
        <ShareProjectModal 
          project={project}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default Toolbar;
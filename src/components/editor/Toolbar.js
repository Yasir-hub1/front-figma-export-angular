// src/components/editor/Toolbar.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor } from '../../context/EditorContext';
import './Toolbar.css';
import ShareProjectModal from './ShareProjectModal';

const Toolbar = () => {
  const { 
    project,
    zoom,
    position,
    gridVisible,
    snapToGrid,
    updateViewport,
    setGridVisible,
    setSnapToGrid,
    exportToAngular,
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
    updateViewport(newZoom, position);
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
    updateViewport(1, { x: 0, y: 0 });
  };

  // Volver al dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Exportar a Angular
  const handleExport = async () => {
    await exportToAngular();
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <button 
          className="toolbar-button"
          onClick={handleBackToDashboard}
          title="Volver al Dashboard"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        
        <span className="project-name">{project?.name}</span>
      </div>
      
      <div className="toolbar-section">
        <button 
          className={`toolbar-button ${gridVisible ? 'active' : ''}`}
          onClick={() => setGridVisible(!gridVisible)}
          title="Mostrar/Ocultar Cuadrícula"
        >
          <i className="fas fa-th"></i>
        </button>
        
        <button 
          className={`toolbar-button ${snapToGrid ? 'active' : ''}`}
          onClick={() => setSnapToGrid(!snapToGrid)}
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
          className="export-button"
          onClick={handleExport}
          disabled={exportLoading}
          title="Exportar a Angular"
        >
          {exportLoading ? 'Exportando...' : 'Exportar a Angular'}
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
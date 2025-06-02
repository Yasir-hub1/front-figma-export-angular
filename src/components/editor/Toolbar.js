// src/components/editor/Toolbar.js - CORRECCIÓN PARA EXPORTAR

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor } from '../../context/EditorContext';
import './Toolbar.css';
import ShareProjectModal from './ShareProjectModal';

const Toolbar = ({ viewMode, setViewMode, toggleSidebar, toggleProperties, toggleAiAssistant, aiAssistantOpen }) => {
  const { 
    project,
    currentScreen, // AGREGAR currentScreen
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

  // FUNCIÓN EXPORTAR CORREGIDA
  const handleExport = async () => {
    // Verificar que hay una screen seleccionada
    if (!currentScreen || !currentScreen._id) {
      alert('Error: No hay una pantalla seleccionada para exportar');
      console.error('❌ No hay screen seleccionada para exportar');
      return;
    }

    // Verificar que la función existe
    if (!exportToFlutter) {
      alert('Error: Función de exportación no disponible');
      console.error('❌ Función exportToFlutter no disponible');
      return;
    }

    try {
      console.log('📤 Exportando screen:', {
        screenId: currentScreen._id,
        screenName: currentScreen.name,
        projectId: project?._id
      });

      await exportToFlutter();
      console.log('✅ Exportación completada exitosamente');
      
    } catch (error) {
      console.error('❌ Error al exportar:', error);
      
      // Mostrar mensaje de error más específico
      let errorMessage = 'Error desconocido';
      if (error.message) {
        if (error.message.includes('404') || error.message.includes('Not Found')) {
          errorMessage = 'No se encontró la pantalla para exportar';
        } else if (error.message.includes('screen')) {
          errorMessage = 'Error con la pantalla seleccionada';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`Error al exportar: ${errorMessage}`);
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
        
        {/* BOTÓN EXPORTAR MEJORADO CON VALIDACIONES */}
        <button 
          className="export-button flutter-export-button"
          onClick={handleExport}
          disabled={exportLoading || !currentScreen || !currentScreen._id}
          title={
            !currentScreen || !currentScreen._id 
              ? "Selecciona una pantalla para exportar" 
              : "Exportar a Flutter/Dart"
          }
        >
          {exportLoading ? (
            <>
              <i className="fa fa-spinner fa-spin"></i> Exportando...
            </>
          ) : (
            <>
              <i className="fab fa-flutter"></i> Exportar a Flutter
            </>
          )}
        </button>
      </div>

      {/* DEBUG INFO - Solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '10px',
          backgroundColor: '#f0f0f0',
          padding: '5px',
          fontSize: '10px',
          borderRadius: '3px',
          zIndex: 1000
        }}>
          Screen: {currentScreen?._id ? `${currentScreen.name} (${currentScreen._id.slice(-6)})` : 'No seleccionada'}
        </div>
      )}

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
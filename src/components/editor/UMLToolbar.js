// src/components/uml/UMLToolbar.js - UMLToolbar específica para UML
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUML } from '../../context/UMLcontext';
import ShareProjectModal from './ShareProjectModal';
import './UMLToolbar.css';

const UMLToolbar = ({ 
  viewMode, 
  setViewMode, 
  toggleSidebar, 
  toggleProperties, 
  toggleAiAssistant, 
  aiAssistantOpen,
  connectionMode,
  setConnectionMode,
  diagramType,
  showStereotypes,
  showVisibility,
  showOperations,
  showAttributes
}) => {
  const { 
    project,
    currentDiagram,
    zoom,
    position,
    gridVisible,
    snapToGrid,
    updateViewport,
    setGridVisible,
    setSnapToGrid,
    setDiagramType,
    setUMLDisplayOptions,
    exportToUML,
    exportLoading
  } = useUML();
  
  const navigate = useNavigate();
  const [currentZoom, setCurrentZoom] = useState(zoom * 100);
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const zoomOptions = [25, 50, 75, 100, 125, 150, 200];

  const handleZoomChange = (newZoomPercent) => {
    const newZoom = newZoomPercent / 100;
    setCurrentZoom(newZoomPercent);
    if (updateViewport) {
      updateViewport(newZoom, position);
    }
  };

  const handleZoomIn = () => {
    const newZoomPercent = Math.min(currentZoom + 25, 400);
    handleZoomChange(newZoomPercent);
  };

  const handleZoomOut = () => {
    const newZoomPercent = Math.max(currentZoom - 25, 25);
    handleZoomChange(newZoomPercent);
  };

  const handleResetView = () => {
    setCurrentZoom(100);
    if (updateViewport) {
      updateViewport(1, { x: 0, y: 0 });
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleExport = async () => {
    if (!currentDiagram || !currentDiagram._id) {
      alert('Error: No hay diagrama seleccionado para exportar');
      return;
    }

    if (!exportToUML) {
      alert('Error: Función de exportación no disponible');
      return;
    }

    try {
      console.log('Exportando diagrama UML:', {
        diagramId: currentDiagram._id,
        diagramName: currentDiagram.name,
        projectId: project?._id
      });

      await exportToUML();
      console.log('Exportación UML completada exitosamente');
      
    } catch (error) {
      console.error('Error al exportar UML:', error);
      
      let errorMessage = 'Error desconocido';
      if (error.message) {
        if (error.message.includes('404') || error.message.includes('Not Found')) {
          errorMessage = 'No se encontró el diagrama para exportar';
        } else if (error.message.includes('diagram')) {
          errorMessage = 'Error con el diagrama seleccionado';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`Error al exportar: ${errorMessage}`);
    }
  };

  const handleDisplayOptionChange = (option, value) => {
    setUMLDisplayOptions({ [option]: value });
  };

  return (
    <div className="uml-toolbar">
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
          <span className="uml-badge">UML</span>
        </span>
      </div>
      
      <div className="toolbar-section view-modes">
        <button 
          className={`mode-button ${viewMode === 'design' ? 'active' : ''}`}
          onClick={() => setViewMode('design')}
          title="Modo Diseño"
        >
          <i className="fas fa-pencil-ruler"></i> Diseño
        </button>

        <button 
          className={`toolbar-button ${aiAssistantOpen ? 'active' : ''}`}
          onClick={toggleAiAssistant}
          title="Asistente IA UML"
        >
          <i className="fa fa-magic"></i>
        </button>
      </div>

      {/* <div className="toolbar-section">
        <select 
          value={diagramType} 
          onChange={(e) => setDiagramType(e.target.value)}
          className="diagram-type-select"
          title="Tipo de diagrama UML"
        >
          <option value="class">Clases</option>
          <option value="sequence">Secuencia</option>
          <option value="usecase">Casos de Uso</option>
          <option value="activity">Actividades</option>
          <option value="state">Estados</option>
          <option value="component">Componentes</option>
          <option value="deployment">Despliegue</option>
        </select>
      </div> */}
      
      <div className="toolbar-section">
        <button 
          className="toolbar-button"
          onClick={toggleSidebar}
          title="Mostrar/Ocultar Componentes UML"
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

        <div className="dropdown">
          <button 
            className="toolbar-button"
            onClick={() => setShowDisplayOptions(!showDisplayOptions)}
            title="Opciones de visualización UML"
          >
            <i className="fas fa-eye"></i>
          </button>
          {showDisplayOptions && (
            <div className="dropdown-menu">
              <label className="dropdown-item">
                <input
                  type="checkbox"
                  checked={showStereotypes}
                  onChange={(e) => handleDisplayOptionChange('showStereotypes', e.target.checked)}
                />
                Mostrar estereotipos
              </label>
              <label className="dropdown-item">
                <input
                  type="checkbox"
                  checked={showVisibility}
                  onChange={(e) => handleDisplayOptionChange('showVisibility', e.target.checked)}
                />
                Mostrar visibilidad
              </label>
              <label className="dropdown-item">
                <input
                  type="checkbox"
                  checked={showAttributes}
                  onChange={(e) => handleDisplayOptionChange('showAttributes', e.target.checked)}
                />
                Mostrar atributos
              </label>
              <label className="dropdown-item">
                <input
                  type="checkbox"
                  checked={showOperations}
                  onChange={(e) => handleDisplayOptionChange('showOperations', e.target.checked)}
                />
                Mostrar operaciones
              </label>
            </div>
          )}
        </div>
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

      {connectionMode && (
        <div className="toolbar-section connection-mode-section">
          <span className="connection-mode-label">
            <i className="fa fa-link"></i>
            Modo: {connectionMode}
          </span>
          <button 
            className="toolbar-button cancel-connection"
            onClick={() => setConnectionMode(null)}
            title="Cancelar modo conexión"
          >
            <i className="fa fa-times"></i>
          </button>
        </div>
      )}
      
      <div className="toolbar-section">
        <button 
          className="toolbar-button share-button"
          onClick={() => setShowShareModal(true)}
          title="Compartir proyecto colaborativo"
        >
          <i className="fas fa-share-alt"></i>
          Compartir
        </button>

        {/* <button 
          className="export-button uml-export-button"
          onClick={handleExport}
          disabled={exportLoading || !currentDiagram || !currentDiagram._id}
          title={
            !currentDiagram || !currentDiagram._id 
              ? "Selecciona un diagrama para exportar" 
              : "Exportar a UML/PlantUML/XMI"
          }
        >
          {exportLoading ? (
            <>
              <i className="fa fa-spinner fa-spin"></i> Exportando...
            </>
          ) : (
            <>
              <i className="fas fa-download"></i> Exportar UML
            </>
          )}
        </button> */}
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          Diagrama: {currentDiagram?._id ? `${currentDiagram.name} (${currentDiagram._id.slice(-6)})` : 'No seleccionado'}
        </div>
      )}

      {/* Share Project Modal */}
      <ShareProjectModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
};

export default UMLToolbar;

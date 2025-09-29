import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUML } from '../../context/UMLcontext';
import Navbar from '../common/Navbar';
import UMLToolbar from './UMLToolbar';
import ScreenTabs from './ScreenTabs';
import Canvas from './uml_canvas';
import Sidebar from './UMLSidebar';
import UMLProperties from './uml_properties';
// import ExportModal from './ExportModal';
import AIAssistant from './AIAssistant';
import ActivityNotification from './ActivityNotification';
import './UMLEditor.css';

// Componente principal del editor UML
const UMLEditor = () => {
  const { 
    project, 
    loading, 
    error, 
    selectedElement,
    selectedConnection,
    exportModalOpen,
    exportContent,
    exportLoading,
    diagrams,
    currentDiagram,
    createDiagram,
    diagramType,
    showStereotypes,
    showVisibility,
    showOperations,
    showAttributes
  } = useUML();

  // Agregar INMEDIATAMENTE después:
  console.log('UMLEditor useUML hook result:', {
    selectedElement: selectedElement?.name || 'null',
    selectedElementId: selectedElement?._id || 'null'
  });

  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [propertiesOpen, setPropertiesOpen] = useState(true);
  const [viewMode, setViewMode] = useState('design');
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [connectionMode, setConnectionMode] = useState(null);

  console.log('UMLEditor state:', {
    selectedElement: selectedElement?.name || 'null',
    selectedConnection: selectedConnection?.type || 'null', 
    propertiesOpen
  });

  useEffect(() => {
    document.title = project ? `${project.name} - UML Designer` : 'Cargando...';
  }, [project]);

  // Auto-abrir panel de propiedades cuando se selecciona un elemento o conexión
  useEffect(() => {
    console.log('Properties useEffect triggered:', {
      selectedElement: selectedElement?.name || 'null',
      selectedConnection: selectedConnection?.type || 'null',
      currentPropertiesOpen: propertiesOpen
    });
    if (selectedElement || selectedConnection) {
      setPropertiesOpen(true);
    }
  }, [selectedElement, selectedConnection]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleProperties = () => {
    setPropertiesOpen(!propertiesOpen);
  };

  const toggleAiAssistant = () => {
    setAiAssistantOpen(!aiAssistantOpen);
  };

  const handleAISuggestion = (suggestionText) => {
    if (!aiAssistantOpen) {
      setAiAssistantOpen(true);
    }
    setAiInput(suggestionText);
  };

  const handleCreateInitialDiagram = async () => {
    try {
      if (createDiagram) {
        await createDiagram('Diagrama Principal', 'class');
      }
    } catch (error) {
      console.error('Error al crear diagrama inicial:', error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleAiAssistant();
      }
      
      if (e.key === 'Escape') {
        if (aiAssistantOpen) {
          setAiAssistantOpen(false);
        }
        if (connectionMode) {
          setConnectionMode(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [aiAssistantOpen, connectionMode]);

  if (loading) {
    return (
      <div className="uml-editor-loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando editor UML...</p>
          <div className="loading-features">
            <div className="feature">🎨 Diagramas de clases</div>
            <div className="feature">🔗 Relaciones UML</div>
            <div className="feature">📊 Múltiples diagramas</div>
            <div className="feature">🤖 Asistente IA</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="uml-editor-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error al cargar el editor UML</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button 
              className="primary-button"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </button>
            <button 
              className="secondary-button"
              onClick={() => navigate('/dashboard')}
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="uml-editor-error">
        <div className="error-container">
          <div className="error-icon">📋</div>
          <h2>Proyecto no encontrado</h2>
          <p>El proyecto que buscas no existe o no tienes permisos para acceder.</p>
          <button 
            className="primary-button"
            onClick={() => navigate('/dashboard')}
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="uml-editor-container">
      {/* Navbar superior */}
      {/* <Navbar project={project} /> */}
      
      {/* UMLToolbar y tabs */}
      <div className="uml-editor-header">
        <UMLToolbar 
          viewMode={viewMode} 
          setViewMode={setViewMode}
          toggleSidebar={toggleSidebar}
          toggleProperties={toggleProperties}
          toggleAiAssistant={toggleAiAssistant}
          aiAssistantOpen={aiAssistantOpen}
          connectionMode={connectionMode}
          setConnectionMode={setConnectionMode}
          diagramType={diagramType}
          showStereotypes={showStereotypes}
          showVisibility={showVisibility}
          showOperations={showOperations}
          showAttributes={showAttributes}
        />
        
        <ScreenTabs />
      </div>
      
      {/* Layout principal de 3 columnas */}
      <div className={`uml-editor-main ${(selectedElement || selectedConnection) && propertiesOpen ? 'properties-open' : ''}`}>
        
        {/* Columna izquierda - Panel de componentes UML */}
        {sidebarOpen && (
          <div className="uml-components-sidebar">
            <Sidebar 
              onClose={toggleSidebar}
              connectionMode={connectionMode}
              setConnectionMode={setConnectionMode}
              diagramType={diagramType}
            />
          </div>
        )}
        
        {/* Columna central - Canvas UML */}
        <div className="uml-canvas-main-area">
          {/* UMLToolbar del canvas */}
          <div className="uml-canvas-toolbar">
            <div className="canvas-controls">
              <button 
                className={`toolbar-button ${sidebarOpen ? 'active' : ''}`}
                onClick={toggleSidebar}
                title="Toggle UML Components Panel"
              >
                <i className="fa fa-th-large"></i>
                Componentes
              </button>
              
              <button 
                className={`toolbar-button ${propertiesOpen ? 'active' : ''}`}
                onClick={toggleProperties}
                title="Toggle Properties Panel"
              >
                <i className="fa fa-cog"></i>
                Propiedades
              </button>
              
              {/* <div className="toolbar-separator"></div> */}
              
              {/* <button 
                className={`toolbar-button ${viewMode === 'design' ? 'active' : ''}`}
                onClick={() => setViewMode('design')}
                title="Design Mode"
              >
                <i className="fa fa-pencil"></i>
                Diseño
              </button>
              
              <button 
                className={`toolbar-button ${viewMode === 'preview' ? 'active' : ''}`}
                onClick={() => setViewMode('preview')}
                title="Preview Mode"
              >
                <i className="fa fa-eye"></i>
                Vista Previa
              </button> */}
              
              <div className="toolbar-separator"></div>
              
              {/* Selector de tipo de diagrama */}
              {/* <div className="diagram-type-selector">
                <label>Tipo:</label>
                <select 
                  value={diagramType} 
                  onChange={(e) => {/* Implementar setDiagramType si es necesario 
                  className="diagram-type-select"
                >
                  <option value="class">Diagrama de Clases</option>
                  <option value="sequence">Diagrama de Secuencia</option>
                  <option value="usecase">Casos de Uso</option>
                  <option value="activity">Diagrama de Actividades</option>
                  <option value="state">Diagrama de Estados</option>
                  <option value="component">Diagrama de Componentes</option>
                  <option value="deployment">Diagrama de Despliegue</option>
                </select>
              </div> */}
            </div>
            
            {/* <div className="zoom-controls">
              <span className="zoom-level">100%</span>
              <button className="toolbar-button" title="Zoom In">
                <i className="fa fa-plus"></i>
              </button>
              <button className="toolbar-button" title="Zoom Out">
                <i className="fa fa-minus"></i>
              </button>
              <button className="toolbar-button" title="Fit to Screen">
                <i className="fa fa-expand"></i>
              </button>
            </div> */}
          </div>
          
          {/* Área del Canvas UML */}
          <div className="main-uml-canvas-container">
          {currentDiagram ? (
              <Canvas 
                viewMode={viewMode}
                connectionMode={connectionMode}
                setConnectionMode={setConnectionMode}
                diagramType={diagramType}
                onSelectElement={(element) => {
                  setPropertiesOpen(true);
                }}
              />
            ) : (
              <div className="no-diagram-selected">
                <div className="no-diagram-content">
                  <div className="no-diagram-icon">📊</div>
                  <h3>¡Comienza a diseñar diagramas UML!</h3>
                  <p>Tu proyecto está listo. Crea tu primer diagrama para empezar.</p>
                  
                  {Array.isArray(diagrams) && diagrams.length === 0 ? (
                    <div className="diagram-type-options">
                      <p>Selecciona el tipo de diagrama:</p>
                      <div className="diagram-type-buttons">
                        <button 
                          className="create-diagram-button class"
                          onClick={() => handleCreateInitialDiagram('class')}
                        >
                          <i className="fa fa-object-group"></i>
                          Diagrama de Clases
                        </button>
                        <button 
                          className="create-diagram-button sequence"
                          onClick={() => handleCreateInitialDiagram('sequence')}
                        >
                          <i className="fa fa-exchange-alt"></i>
                          Diagrama de Secuencia
                        </button>
                        <button 
                          className="create-diagram-button usecase"
                          onClick={() => handleCreateInitialDiagram('usecase')}
                        >
                          <i className="fa fa-user"></i>
                          Casos de Uso
                        </button>
                        <button 
                          className="create-diagram-button activity"
                          onClick={() => handleCreateInitialDiagram('activity')}
                        >
                          <i className="fa fa-sitemap"></i>
                          Diagrama de Actividades
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p>Selecciona un diagrama de las pestañas de arriba</p>
                  )}
                  
                  <div className="help-tips">
                    <h4>💡 Consejos UML:</h4>
                    <ul>
                      <li>Usa el <strong>Asistente IA</strong> (Ctrl+K) para generar diagramas completos</li>
                      <li>Arrastra <strong>clases e interfaces</strong> desde el panel lateral</li>
                      <li>Crea <strong>relaciones</strong> entre elementos UML</li>
                      <li>Configura <strong>atributos y métodos</strong> en el panel de propiedades</li>
                      <li>Exporta tu diagrama a <strong>PlantUML, XMI o imagen</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Columna derecha - Panel de propiedades */}
        {(selectedElement || selectedConnection) && propertiesOpen && (
          <UMLProperties 
            onClose={toggleProperties}
            selectedElement={selectedElement}
            selectedConnection={selectedConnection}
          />
        )}
        
      </div>
      
      {/* Componentes flotantes */}
      
      {/* Asistente IA para UML */}
      <AIAssistant 
        isOpen={aiAssistantOpen} 
        onClose={toggleAiAssistant}
        initialInput={aiInput}
        onInputChange={setAiInput}
        context={{
          diagramId: currentDiagram?._id,
          projectId: project?._id,
          diagramName: currentDiagram?.name,
          diagramType: diagramType
        }}
      />
      
      {/* Botón flotante del Asistente IA */}
      {!aiAssistantOpen && (
        <button 
          className="uml-ai-assistant-toggle"
          onClick={toggleAiAssistant}
          title="Asistente IA UML (Ctrl+K)"
        >
          <i className="fa fa-magic"></i>
          <span className="keyboard-hint">⌘K</span>
        </button>
      )}
      
      {/* Indicador de modo de conexión */}
      {connectionMode && (
        <div className="connection-mode-indicator">
          <div className="connection-mode-content">
            <i className="fa fa-link"></i>
            <span>Modo conexión: {connectionMode}</span>
            <button 
              className="cancel-connection"
              onClick={() => setConnectionMode(null)}
              title="Cancelar (Esc)"
            >
              <i className="fa fa-times"></i>
            </button>
          </div>
        </div>
      )}
      
      {/* Notificaciones de actividad */}
      <ActivityNotification />
      
      {/* Modal de exportación UML */}
      {/* {exportModalOpen && (
        <ExportModal 
          content={exportContent} 
          loading={exportLoading} 
        />
      )} */}
    </div>
  );
};

export default UMLEditor;
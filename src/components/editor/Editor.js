

// src/components/editor/Editor.js - CORREGIDO
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorProvider } from '../../context/EditorContext';
import Navbar from '../common/Navbar';
import Toolbar from './Toolbar';
import ScreenTabs from './ScreenTabs';
import Canvas from './Canvas';
import Sidebar from './Sidebar';
import ElementProperties from './ElementProperties';
import ExportModal from './ExportModal';
import AIAssistant from './AIAssistant';
import ActivityNotification from './ActivityNotification';
import './Editor.css';

// CORRECCIÓN: Componente wrapper que obtiene el projectId con múltiples métodos
const EditorWithContext = () => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // CORRECCIÓN: useParams devuelve {id: 'xxx'} en lugar de {projectId: 'xxx'}
  const projectIdFromParams = params.projectId || params.id; // ¡Esta es la corrección clave!
  
  // Método 2: Extraer manualmente de la URL
  const pathSegments = location.pathname.split('/');
  const projectIdFromPath = pathSegments[2]; // /editor/[projectId]
  
  // Método 3: Desde el hash si existe
  const projectIdFromHash = location.hash ? location.hash.replace('#', '') : null;
  
  // Método 4: Desde query params como fallback
  const urlParams = new URLSearchParams(location.search);
  const projectIdFromQuery = urlParams.get('projectId');
  
  // Usar el primer método que funcione
  const projectId = projectIdFromParams || projectIdFromPath || projectIdFromHash || projectIdFromQuery;
  
  console.log('🆔 DEBUG COMPLETO DE PROJECT ID:');
  console.log('- useParams():', params);
  console.log('- params.projectId:', params.projectId);
  console.log('- params.id:', params.id); // ¡Este es el que tiene valor!
  console.log('- projectIdFromParams:', projectIdFromParams);
  console.log('- location.pathname:', location.pathname);
  console.log('- pathSegments:', pathSegments);
  console.log('- projectIdFromPath:', projectIdFromPath);
  console.log('- FINAL projectId:', projectId);
  console.log('- window.location.href:', window.location.href);
  
  // Verificar que tenemos projectId antes de renderizar
  if (!projectId) {
    return (
      <div className="editor-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error de navegación</h2>
          <p>No se pudo obtener el ID del proyecto de la URL</p>
          
          {/* Debug information */}
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            backgroundColor: '#f8f9f8', 
            borderRadius: '4px',
            textAlign: 'left',
            fontSize: '0.85rem',
            maxWidth: '500px'
          }}>
            <strong>🔍 Información de debug:</strong><br/>
            <strong>URL actual:</strong> {window.location.href}<br/>
            <strong>Pathname:</strong> {location.pathname}<br/>
            <strong>useParams:</strong> {JSON.stringify(params)}<br/>
            <strong>params.id:</strong> {params.id}<br/>
            <strong>params.projectId:</strong> {params.projectId}<br/>
            <strong>Segmentos:</strong> {JSON.stringify(pathSegments)}<br/>
            <strong>Esperado:</strong> /editor/[projectId]<br/>
            
            {pathSegments.length >= 3 && (
              <>
                <strong>Posible ID:</strong> {pathSegments[2]}<br/>
              </>
            )}
          </div>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              className="primary-button"
              onClick={() => navigate('/dashboard')}
            >
              Ir al Dashboard
            </button>
            <button 
              className="secondary-button"
              onClick={() => window.location.reload()}
            >
              Recargar Página
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <EditorProvider projectId={projectId}>
      <EditorContent />
    </EditorProvider>
  );
};

// Componente principal del editor
const EditorContent = () => {
  const { 
    project, 
    loading, 
    error, 
    selectedElement,
    exportModalOpen,
    exportContent,
    exportLoading,
    screens,
    currentScreen,
    createScreen
  } = useEditor();
  
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [propertiesOpen, setPropertiesOpen] = useState(true);
  const [viewMode, setViewMode] = useState('design');
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');

  useEffect(() => {
    document.title = project ? `${project.name} - Flutter Designer` : 'Cargando...';
  }, [project]);

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

  // NUEVA FUNCIÓN: Crear screen inicial si no existe
  const handleCreateInitialScreen = async () => {
    try {
      if (createScreen) {
        await createScreen('Pantalla Principal');
      }
    } catch (error) {
      console.error('Error al crear screen inicial:', error);
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [aiAssistantOpen]);

  if (loading) {
    return (
      <div className="editor-loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando editor de Flutter...</p>
          <div className="loading-features">
            <div className="feature">✨ Asistente IA activado</div>
            <div className="feature">🎨 Múltiples pantallas</div>
            <div className="feature">📱 Vista previa en tiempo real</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="editor-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error al cargar el editor</h2>
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
      <div className="editor-error">
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
    <div className="editor-container flutter-editor">
    {/* Navbar superior */}
    <Navbar project={project} />
    
    {/* Toolbar y tabs */}
    <div className="editor-header">
      <Toolbar 
        viewMode={viewMode} 
        setViewMode={setViewMode}
        toggleSidebar={toggleSidebar}
        toggleProperties={toggleProperties}
        toggleAiAssistant={toggleAiAssistant}
        aiAssistantOpen={aiAssistantOpen}
      />
      
      <ScreenTabs />
    </div>
    
    {/* ===== LAYOUT PRINCIPAL DE 3 COLUMNAS ===== */}
    <div className={`editor-main ${selectedElement && propertiesOpen ? 'properties-open' : ''}`}>
      
      {/* COLUMNA IZQUIERDA - Panel de Componentes */}
      {sidebarOpen && (
        <div className="components-sidebar">
          <Sidebar onClose={toggleSidebar} />
        </div>
      )}
      
      {/* COLUMNA CENTRAL - Canvas */}
      <div className="canvas-main-area">
        {/* Toolbar del canvas (opcional) */}
        <div className="canvas-toolbar">
          <div className="canvas-controls">
            <button 
              className={`toolbar-button ${sidebarOpen ? 'active' : ''}`}
              onClick={toggleSidebar}
              title="Toggle Components Panel"
            >
              <i className="fa fa-th-large"></i>
            </button>
            
            <button 
              className={`toolbar-button ${propertiesOpen ? 'active' : ''}`}
              onClick={toggleProperties}
              title="Toggle Properties Panel"
            >
              <i className="fa fa-cog"></i>
            </button>
            
            <div className="toolbar-separator"></div>
            
            <button 
              className={`toolbar-button ${viewMode === 'design' ? 'active' : ''}`}
              onClick={() => setViewMode('design')}
              title="Design Mode"
            >
              <i className="fa fa-pencil"></i>
              Design
            </button>
            
            <button 
              className={`toolbar-button ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
              title="Preview Mode"
            >
              <i className="fa fa-eye"></i>
              Preview
            </button>
          </div>
          
          <div className="zoom-controls">
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
          </div>
        </div>
        
        {/* Área del Canvas */}
        <div className="main-canvas-container">
          {currentScreen ? (
            <Canvas viewMode={viewMode} />
          ) : (
            <div className="no-screen-selected">
              <div className="no-screen-content">
                <div className="no-screen-icon">📱</div>
                <h3>¡Comienza a diseñar!</h3>
                <p>Tu proyecto está listo. Crea tu primera pantalla para empezar.</p>
                
                {Array.isArray(screens) && screens.length === 0 ? (
                  <button 
                    className="create-screen-button"
                    onClick={handleCreateInitialScreen}
                  >
                    <i className="fa fa-plus"></i>
                    Crear Primera Pantalla
                  </button>
                ) : (
                  <p>Selecciona una pantalla de las pestañas de arriba</p>
                )}
                
                <div className="help-tips">
                  <h4>💡 Consejos:</h4>
                  <ul>
                    <li>Usa el <strong>Asistente IA</strong> (Ctrl+K) para crear interfaces completas</li>
                    <li>Arrastra componentes desde el <strong>panel lateral</strong></li>
                    <li>Modifica propiedades seleccionando elementos</li>
                    <li>Exporta tu diseño a <strong>código Flutter</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* COLUMNA DERECHA - Panel de Propiedades */}
      {selectedElement && propertiesOpen && (
        <ElementProperties onClose={toggleProperties} />
      )}
      
    </div>
    
    {/* ===== COMPONENTES FLOTANTES ===== */}
    
    {/* Asistente IA */}
    <AIAssistant 
      isOpen={aiAssistantOpen} 
      onClose={toggleAiAssistant}
      initialInput={aiInput}
      onInputChange={setAiInput}
      context={{
        screenId: currentScreen?._id,
        projectId: project?._id,
        screenName: currentScreen?.name
      }}
    />
    
    {/* Botón flotante del Asistente IA */}
    {!aiAssistantOpen && (
      <button 
        className="ai-assistant-toggle"
        onClick={toggleAiAssistant}
        title="Asistente IA de Diseño (Ctrl+K)"
      >
        <i className="fa fa-magic"></i>
        <span className="keyboard-hint">⌘K</span>
      </button>
    )}
    
    {/* Notificaciones de Actividad */}
    <ActivityNotification />
    
    {/* Modal de Exportación */}
    {exportModalOpen && (
      <ExportModal 
        content={exportContent} 
        loading={exportLoading} 
      />
    )}
  </div>
);
};

export default EditorWithContext;
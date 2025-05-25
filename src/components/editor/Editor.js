// src/components/editor/Editor.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorProvider } from '../../context/EditorContext';
import Navbar from '../common/Navbar';
import Toolbar from './Toolbar';
import Canvas from './Canvas';
import Sidebar from './Sidebar';
import ElementProperties from './ElementProperties';
import ExportModal from './ExportModal';
import './Editor.css';
import ActivityNotification from './ActivityNotification';
import AIAssistant from './AIAssistant';

// Componente wrapper que proporciona el contexto
const EditorWithContext = () => {
  return (
    <EditorProvider>
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
    exportLoading
  } = useEditor();
  
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [propertiesOpen, setPropertiesOpen] = useState(true);
  const [viewMode, setViewMode] = useState('design'); // design, preview, code
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false); // Estado para el Asistente IA

  useEffect(() => {
    document.title = project ? `${project.name} - Flutter Designer` : 'Cargando...';
  }, [project]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleProperties = () => {
    setPropertiesOpen(!propertiesOpen);
  };

    // Función para alternar el Asistente IA
    const toggleAiAssistant = () => {
      setAiAssistantOpen(!aiAssistantOpen);
    };

  if (loading) {
    return (
      <div className="editor-loading">
        <div className="spinner"></div>
        <p>Cargando editor de Flutter...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="editor-error">
        <h2>Error al cargar el editor</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')}>
          Volver al Dashboard
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="editor-error">
        <h2>Proyecto no encontrado</h2>
        <button onClick={() => navigate('/dashboard')}>
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="editor-container flutter-editor">
      <Navbar project={project} />
      
      <div className="editor-layout">
        <Toolbar 
          viewMode={viewMode} 
          setViewMode={setViewMode}
          toggleSidebar={toggleSidebar}
          toggleProperties={toggleProperties}
          toggleAiAssistant={toggleAiAssistant} // Pasar la función
          aiAssistantOpen={aiAssistantOpen} // Pasar el estado
        
        
        />
        
        <div className="editor-main">
          <div className={`editor-panels ${sidebarOpen ? 'sidebar-open' : ''} ${propertiesOpen && selectedElement ? 'properties-open' : ''}`}>
            {sidebarOpen && (
              <div className="editor-sidebar">
                <Sidebar onClose={toggleSidebar} />
              </div>
            )}
            
            <div className="editor-canvas-container">
              <Canvas viewMode={viewMode} />
            </div>
            
            {selectedElement && propertiesOpen && (
              <div className="editor-properties">
                <ElementProperties onClose={toggleProperties} />
              </div>
            )}
          </div>
        </div>
        
        <ActivityNotification />
        
        {exportModalOpen && (
          <ExportModal 
            content={exportContent} 
            loading={exportLoading} 
          />
        )}

            {/* Renderizar el Asistente IA */}
            <AIAssistant 
          isOpen={aiAssistantOpen} 
          onClose={toggleAiAssistant} 
        />
        
        {/* Botón flotante para abrir el Asistente IA cuando está cerrado */}
        {!aiAssistantOpen && (
          <button 
            className="ai-assistant-toggle"
            onClick={toggleAiAssistant}
            title="Asistente IA de Diseño"
          >
            <i className="fa fa-magic"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default EditorWithContext;
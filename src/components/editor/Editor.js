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

  useEffect(() => {
    document.title = project ? `${project.name} - Flutter Designer` : 'Cargando...';
  }, [project]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleProperties = () => {
    setPropertiesOpen(!propertiesOpen);
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
      </div>
    </div>
  );
};

export default EditorWithContext;
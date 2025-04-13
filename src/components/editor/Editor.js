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
import UserActivityNotification from './UserActivityNotification';
import ShareProjectModal from './ShareProjectModal';
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
    exportLoading ,
   
  } = useEditor();
  
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [propertiesOpen, setPropertiesOpen] = useState(true);

  useEffect(() => {
    document.title = project ? `${project.name} - Editor` : 'Cargando...';
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
        <p>Cargando editor...</p>
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
    <div className="editor-container">
    <Navbar project={project} />
    
    <div className="editor-layout">
      <Toolbar />
      
      <div className="editor-main">
        {sidebarOpen && <Sidebar onClose={toggleSidebar} />}
        
        <Canvas />
        
        {selectedElement && propertiesOpen && (
          <ElementProperties onClose={toggleProperties} />
        )}
      </div>
      
      {/* Añadir el componente de notificaciones */}
      <ActivityNotification  />
      
      {exportModalOpen && (
        <ExportModal 
          content={exportContent} 
          loading={exportLoading} 
        />
      )}
      
      {/* {showShareModal && (
        <ShareProjectModal 
          project={project}
          onClose={() => setShowShareModal(false)}
        />
      )} */}
    </div>
  </div>
  );
};

export default EditorWithContext;
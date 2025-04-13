// src/components/editor/Sidebar.js
import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import ComponentLibrary from './ComponentLibrary';
import './Sidebar.css';

const Sidebar = ({ onClose }) => {
  const { project } = useEditor();
  const [activeTab, setActiveTab] = useState('components');
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Editor de {project?.name}</h3>
        <button className="close-sidebar" onClick={onClose}>×</button>
      </div>
      
      <div className="sidebar-tabs">
        <button 
          className={`tab-button ${activeTab === 'components' ? 'active' : ''}`}
          onClick={() => setActiveTab('components')}
        >
          Componentes
        </button>
        {/* <button 
          className={`tab-button ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => setActiveTab('assets')}
        >
          Recursos
        </button>
        <button 
          className={`tab-button ${activeTab === 'layers' ? 'active' : ''}`}
          onClick={() => setActiveTab('layers')}
        >
          Capas
        </button> */}
      </div>
      
      <div className="sidebar-content">
        {activeTab === 'components' && <ComponentLibrary />}
        
        {activeTab === 'assets' && (
          <div className="tab-content">
            <p className="empty-state">
              Los recursos estarán disponibles en futuras actualizaciones.
            </p>
          </div>
        )}
        
        {activeTab === 'layers' && (
          <div className="tab-content">
            <p className="empty-state">
              El panel de capas estará disponible en futuras actualizaciones.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
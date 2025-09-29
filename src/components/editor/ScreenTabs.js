// src/components/editor/ScreenTabs.js - VERSIÓN ADAPTADA PARA UML DIAGRAMS

import React, { useEffect, useState } from 'react';
import { useUML } from '../../context/UMLcontext';
import './ScreenTabs.css';

const ScreenTabs = () => {
  const { 
    diagrams, 
    currentDiagram, 
    setCurrentDiagram, 
    createDiagram, 
    deleteDiagram, 
    updateDiagram,
    project,
    umlElements,
    fetchUMLElements
  } = useUML();

  const [isCreating, setIsCreating] = useState(false);
  const [newDiagramName, setNewDiagramName] = useState('');

  const handleCreateDiagram = async () => {
    console.log("Creando diagrama con nombre:", newDiagramName);
    if (!newDiagramName.trim()) return;
    
    try {
      await createDiagram(newDiagramName.trim(), 'class');
      setNewDiagramName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Error creando diagrama:', error);
      alert('Error al crear diagrama: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleDeleteDiagram = async (diagram, event) => {
    event.stopPropagation();
    console.log("Eliminando diagrama:", diagram);
    
    if (diagrams.length <= 1) {
      alert('No puedes eliminar el único diagrama del proyecto');
      return;
    }
    
    if (window.confirm('¿Estás seguro de que deseas eliminar este diagrama?')) {
      try {
        await deleteDiagram(diagram._id);
      } catch (error) {
        console.error('Error eliminando diagrama:', error);
        alert('Error al eliminar diagrama: ' + (error.message || 'Error desconocido'));
      }
    }
  };

  const handleRenameDiagram = async (diagram, newName) => {
    console.log("Renombrando diagrama:", diagram._id, "a:", newName);
    if (!newName.trim()) return;
    
    try {
      await updateDiagram(diagram._id, { name: newName.trim() });
    } catch (error) {
      console.error('Error renombrando diagrama:', error);
      alert('Error al renombrar diagrama: ' + (error.message || 'Error desconocido'));
    }
  };

  const startCreating = () => {
    setIsCreating(true);
    setNewDiagramName(`Diagrama ${diagrams.length + 1}`);
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewDiagramName('');
  };

  console.log("📱 ScreenTabs - diagrams:", diagrams);
  console.log("📱 ScreenTabs - currentDiagram:", currentDiagram);

  return (
    <div className="screen-tabs">
      <div className="tabs-header">
        {/* <div className="tabs-brand">
          <div className="brand-icon">
            <i className="fas fa-layer-group"></i>
          </div>
          <div className="brand-info">
            <h4 className="brand-title">Diagramas UML</h4>
            <span className="brand-count">
              {Array.isArray(diagrams) ? diagrams.length : 0} diagrama{(Array.isArray(diagrams) ? diagrams.length : 0) !== 1 ? 's' : ''}
            </span>
          </div>
        </div> */}
        
        <div className="tabs-actions">
          {isCreating ? (
            <div className="create-input-container">
              <input
                type="text"
                value={newDiagramName}
                onChange={(e) => setNewDiagramName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleCreateDiagram();
                  if (e.key === 'Escape') cancelCreating();
                }}
                onBlur={handleCreateDiagram}
                autoFocus
                className="create-input"
                placeholder="Nombre del diagrama"
              />
              <button className="create-confirm" onClick={handleCreateDiagram}>
                <i className="fas fa-check"></i>
              </button>
              <button className="create-cancel" onClick={cancelCreating}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          ) : (
            <button className="add-tab-button" onClick={startCreating}>
              <i className="fas fa-plus"></i>
              <span>Nuevo</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="tabs-container">
        {Array.isArray(diagrams) && diagrams.map((diagram) => (
          <DiagramTab
            key={diagram._id}
            diagram={diagram}
            isActive={currentDiagram?._id === diagram._id}
            onClick={() => setCurrentDiagram(diagram)}
            onDelete={(e) => handleDeleteDiagram(diagram, e)}
            onRename={(name) => handleRenameDiagram(diagram, name)}
            canDelete={diagrams.length > 1}
            elementsCount={currentDiagram?._id === diagram._id ? umlElements.length : 0}
          />
        ))}
      </div>
      
      {currentDiagram && (
        <div className="current-diagram-info">
          <div className="diagram-status">
            <div className="status-dot"></div>
            <span className="diagram-name">{currentDiagram.name}</span>
          </div>
          <div className="diagram-stats">
            <span className="elements-count">
              <i className="fas fa-cube"></i>
              {umlElements?.length || 0}
            </span>
            <span className="diagram-type">
              <i className="fas fa-diagram-project"></i>
              {currentDiagram.type || 'class'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// COMPONENTE INDIVIDUAL PARA DIAGRAMAS UML
const DiagramTab = ({ diagram, isActive, onClick, onDelete, onRename, canDelete, elementsCount }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(diagram.name);

  const handleStartEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(diagram.name);
  };

  const handleSaveEdit = () => {
    console.log("Guardando nuevo nombre:", editName);
    if (editName.trim() && editName !== diagram.name) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(diagram.name);
  };

  const handleTabClick = (e) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <div className={`diagram-tab ${isActive ? 'active' : ''}`} onClick={handleTabClick}>
      <div className="tab-content">
        {isEditing ? (
          <div className="edit-container">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyPress={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              onBlur={handleSaveEdit}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="tab-edit-input"
            />
            <div className="edit-actions">
              <button className="edit-save" onClick={handleSaveEdit}>
                <i className="fas fa-check"></i>
              </button>
              <button className="edit-cancel" onClick={handleCancelEdit}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="tab-header">
              <div className="tab-icon">
                <i className="fas fa-diagram-project"></i>
              </div>
              <div className="tab-info">
                <span className="tab-name" onDoubleClick={handleStartEdit}>
                  {diagram.name}
                </span>
                <span className="tab-type">{diagram.type || 'class'}</span>
              </div>
              <div className="tab-actions">
                <button
                  className="tab-edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(e);
                  }}
                  title="Renombrar"
                >
                  <i className="fas fa-edit"></i>
                </button>
                {canDelete && (
                  <button
                    className="tab-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(e);
                    }}
                    title="Eliminar"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="tab-footer">
              <span className="tab-elements">
                <i className="fas fa-cube"></i>
                {elementsCount || 0}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ScreenTabs;
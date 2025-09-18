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
        
        {isCreating ? (
          <div className="screen-tab creating">
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
              className="screen-name-input"
            />
          </div>
        ) : (
          <button className="add-screen-button" onClick={startCreating}>
            <i className="fa fa-plus"></i>
            <span>
              {Array.isArray(diagrams) && diagrams.length > 0 ? 'Nuevo Diagrama' : 'Crear Primer Diagrama'}
            </span>
          </button>
        )}
      </div>
      
      <div className="screen-info">
        <span className="screen-count">
          {Array.isArray(diagrams) ? diagrams.length : 0} diagrama{(Array.isArray(diagrams) ? diagrams.length : 0) !== 1 ? 's' : ''}
        </span>
        <span className="device-type">
          {project?.deviceType || 'UML'}
        </span>
        {currentDiagram && (
          <span className="current-screen-info">
            Actual: {currentDiagram.name} ({umlElements?.length || 0} elementos)
          </span>
        )}
      </div>
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
    <div className={`screen-tab ${isActive ? 'active' : ''}`} onClick={handleTabClick}>
      {isEditing ? (
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
          className="screen-name-input"
        />
      ) : (
        <>
          <span className="screen-name" onDoubleClick={handleStartEdit}>
            {diagram.name}
          </span>
          <div className="screen-actions">
            <button
              className="edit-button"
              onClick={handleStartEdit}
              title="Renombrar diagrama"
            >
              <i className="fa fa-edit"></i>
            </button>
            {canDelete && (
              <button
                className="delete-button"
                onClick={onDelete}
                title="Eliminar diagrama"
              >
                <i className="fa fa-times"></i>
              </button>
            )}
          </div>
        </>
      )}
      
      <div className="screen-preview">
        <div className="elements-count">
          {elementsCount || 0} elementos
        </div>
        <div className="diagram-type">
          {diagram.type || 'class'}
        </div>
      </div>
    </div>
  );
};

export default ScreenTabs;
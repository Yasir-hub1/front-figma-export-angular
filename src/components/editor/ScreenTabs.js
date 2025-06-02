// src/components/editor/ScreenTabs.js - VERSIÓN CORREGIDA COMPLETA

import React, { useEffect, useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import './ScreenTabs.css';

const ScreenTabs = () => {
  const { 
    screens, 
    currentScreen, 
    setCurrentScreen, 
    createScreen, 
    deleteScreen, 
    updateScreen,
    project,
    elements,
    fetchElements
  } = useEditor();

  const [isCreating, setIsCreating] = useState(false);
  const [newScreenName, setNewScreenName] = useState('');

  const handleCreateScreen = async () => {
    console.log("Creando screen con nombre:", newScreenName);
    if (!newScreenName.trim()) return;
    
    try {
      await createScreen(newScreenName.trim());
      setNewScreenName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Error creando screen:', error);
      alert('Error al crear pantalla: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleDeleteScreen = async (screen, event) => {
    event.stopPropagation();
    console.log("Eliminando screen:", screen);
    
    if (screens.length <= 1) {
      alert('No puedes eliminar la única pantalla del proyecto');
      return;
    }
    
    if (window.confirm('¿Estás seguro de que deseas eliminar esta pantalla?')) {
      try {
        // CORRECCIÓN: Usar directamente screen._id
        await deleteScreen(screen._id);
      } catch (error) {
        console.error('Error eliminando screen:', error);
        alert('Error al eliminar pantalla: ' + (error.message || 'Error desconocido'));
      }
    }
  };

  const handleRenameScreen = async (screen, newName) => {
    console.log("Renombrando screen:", screen._id, "a:", newName);
    if (!newName.trim()) return;
    
    try {
      // CORRECCIÓN: Usar directamente screen._id
      await updateScreen(screen._id, { name: newName.trim() });
    } catch (error) {
      console.error('Error renombrando screen:', error);
      alert('Error al renombrar pantalla: ' + (error.message || 'Error desconocido'));
    }
  };

  const startCreating = () => {
    setIsCreating(true);
    setNewScreenName(`Screen ${screens.length + 1}`);
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewScreenName('');
  };

  console.log("📱 ScreenTabs - screens:", screens);
  console.log("📱 ScreenTabs - currentScreen:", currentScreen);

  return (
    <div className="screen-tabs">
      <div className="tabs-container">
        {Array.isArray(screens) && screens.map((screen) => (
          <ScreenTab
            key={screen._id}
            screen={screen}
            isActive={currentScreen?._id === screen._id}
            onClick={() => setCurrentScreen(screen)}
            onDelete={(e) => handleDeleteScreen(screen, e)}
            onRename={(name) => handleRenameScreen(screen, name)}
            canDelete={screens.length > 1}
            elementsCount={currentScreen?._id === screen._id ? elements.length : 0}
          />
        ))}
        
        {isCreating ? (
          <div className="screen-tab creating">
            <input
              type="text"
              value={newScreenName}
              onChange={(e) => setNewScreenName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCreateScreen();
                if (e.key === 'Escape') cancelCreating();
              }}
              onBlur={handleCreateScreen}
              autoFocus
              className="screen-name-input"
            />
          </div>
        ) : (
          <button className="add-screen-button" onClick={startCreating}>
            <i className="fa fa-plus"></i>
            <span>
              {Array.isArray(screens) && screens.length > 0 ? 'Nueva Pantalla' : 'Crear Primera Pantalla'}
            </span>
          </button>
        )}
      </div>
      
      <div className="screen-info">
        <span className="screen-count">
          {Array.isArray(screens) ? screens.length : 0} pantalla{(Array.isArray(screens) ? screens.length : 0) !== 1 ? 's' : ''}
        </span>
        <span className="device-type">
          {project?.deviceType || 'custom'}
        </span>
        {currentScreen && (
          <span className="current-screen-info">
            Actual: {currentScreen.name} ({elements?.length || 0} elementos)
          </span>
        )}
      </div>
    </div>
  );
};

// COMPONENTE INDIVIDUAL CORREGIDO
const ScreenTab = ({ screen, isActive, onClick, onDelete, onRename, canDelete, elementsCount }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(screen.name);

  const handleStartEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(screen.name);
  };

  const handleSaveEdit = () => {
    console.log("Guardando nuevo nombre:", editName);
    if (editName.trim() && editName !== screen.name) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(screen.name);
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
            {screen.name}
          </span>
          <div className="screen-actions">
            <button
              className="edit-button"
              onClick={handleStartEdit}
              title="Renombrar pantalla"
            >
              <i className="fa fa-edit"></i>
            </button>
            {canDelete && (
              <button
                className="delete-button"
                onClick={onDelete}
                title="Eliminar pantalla"
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
      </div>
    </div>
  );
};

export default ScreenTabs;
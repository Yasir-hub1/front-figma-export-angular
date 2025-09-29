// src/components/projects/ProjectCard.js
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import './ProjectCard.css';

const ProjectCard = ({ project, onEdit, onDelete, isOwner }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = () => {
    console.log("handleEdit ", project);
    onEdit(project._id);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(project._id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getProjectTimeSince = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Mejorar los iconos de tipo de proyecto con mejor mapeo
  const getProjectTypeIcon = (deviceType) => {
    const icons = {
      custom: '🎨',
      class: '🏗️',
      sequence: '📊',
      usecase: '👥',
      activity: '⚡',
      state: '🔄',
      default: '📋'
    };
    return icons[deviceType] || icons.default;
  };

  return (
    <div className="project-card">
      <div className="project-card-header">
        <div 
          className="project-card-canvas" 
          style={{ 
            backgroundColor: project.canvas?.background || 'rgba(102, 126, 234, 0.1)' 
          }}
        >
          {/* Miniatura del proyecto mejorada */}
        </div>
      </div>
      
      <div className="project-card-body">
        <div className="project-title-section">
          <h3>{project.name}</h3>
          <div className="project-type-badge">
            {getProjectTypeIcon(project.deviceType)}
          </div>
        </div>
        
        <p className="project-description">
          {project.description || '📝 Sin descripción disponible'}
        </p>
        
        <div className="project-meta">
          <div className="project-updated">
            <span className="meta-icon">🕒</span>
            <span>Actualizado {getProjectTimeSince(project.updatedAt)}</span>
          </div>
          
          {project.owner && (
            <div className="project-owner">
              <div className="owner-avatar">
                {getInitials(project.owner.username || 'Usuario')}
              </div>
              <span>{project.owner.username}</span>
            </div>
          )}
        </div>
        
        <div className="project-dimensions">
          <span className="dimension-badge">
            📐 {project.canvas?.width || 1000} × {project.canvas?.height || 700}px
          </span>
        </div>
      </div>
      
      <div className="project-card-footer">
        <button
          className="edit-button"
          onClick={handleEdit}
        >
          <span className="button-icon">🎨</span>
          <span>Abrir Editor</span>
        </button>
        
        {isOwner && (
          <>
            {showDeleteConfirm ? (
              <div className="delete-confirm">
                <p>⚠️ ¿Eliminar este proyecto?</p>
                <div className="delete-actions">
                  <button 
                    className="confirm-delete"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <span className="button-icon">
                      {isDeleting ? '⏳' : '🗑️'}
                    </span>
                    <span>{isDeleting ? 'Eliminando...' : 'Sí, eliminar'}</span>
                  </button>
                  <button 
                    className="cancel-delete"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    <span className="button-icon">❌</span>
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            ) : (
              <button 
                className="delete-button"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <span className="button-icon">🗑️</span>
                <span>Eliminar</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
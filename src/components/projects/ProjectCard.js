// src/components/projects/ProjectCard.js
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import './ProjectCard.css';

const ProjectCard = ({ project, onEdit, onDelete, isOwner }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = () => {
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

  return (
    <div className="project-card">
      <div className="project-card-header">
        <div 
          className="project-card-canvas" 
          style={{ backgroundColor: project.canvas?.background || '#f0f0f0' }}
        >
          {/* Miniatura del proyecto */}
          <div className="project-actions">
            <button 
              className="btn-card-edit"
              onClick={handleEdit}
              aria-label="Editar proyecto"
            >
              <span className="icon-edit">✏️</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="project-card-body">
        <h3 title={project.name}>{project.name}</h3>
        <p className="project-description" title={project.description || 'Sin descripción'}>
          {project.description || 'Sin descripción'}
        </p>
        
        <div className="project-meta">
          <div className="meta-item project-updated">
            <span className="meta-icon">🕒</span>
            <span className="meta-text">{getProjectTimeSince(project.updatedAt)}</span>
          </div>
          
          {project.owner && (
            <div className="meta-item project-owner">
              <div className="owner-avatar">
                {getInitials(project.owner.username || 'Usuario')}
              </div>
              <span className="owner-name" title={project.owner.username}>
                {project.owner.username}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="project-card-footer">
        <button 
          className="btn-primary"
          onClick={handleEdit}
        >
          Abrir proyecto
        </button>
        
        {isOwner && (
          <>
            {showDeleteConfirm ? (
              <div className="delete-confirm">
                <p>¿Eliminar este proyecto?</p>
                <div className="delete-actions">
                  <button 
                    className="btn-delete"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                  </button>
                  <button 
                    className="btn-cancel"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button 
                className="btn-delete-icon"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Eliminar proyecto"
              >
                <span className="icon-trash">🗑️</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
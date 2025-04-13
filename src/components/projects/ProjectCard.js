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
        <div className="project-card-canvas" style={{ backgroundColor: project.canvas?.background || '#f0f0f0' }}>
          {/* Miniatura del proyecto */}
        </div>
      </div>
      
      <div className="project-card-body">
        <h3>{project.name}</h3>
        <p className="project-description">{project.description || 'Sin descripción'}</p>
        
        <div className="project-meta">
          <div className="project-updated">
            Actualizado {getProjectTimeSince(project.updatedAt)}
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
      </div>
      
      <div className="project-card-footer">
        <button 
          className="edit-button"
          onClick={handleEdit}
        >
          ACTUALIZAR
        </button>
        
        {isOwner && (
          <>
            {showDeleteConfirm ? (
              <div className="delete-confirm">
                <p>¿Eliminar este proyecto?</p>
                <div className="delete-actions">
                  <button 
                    className="confirm-delete"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                  </button>
                  <button 
                    className="cancel-delete"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button 
                className="delete-button"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Eliminar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
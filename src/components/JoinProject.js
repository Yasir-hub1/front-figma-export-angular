// src/components/JoinProject.js - Componente para unirse a proyecto mediante enlace
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './JoinProject.css';

const JoinProject = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [project, setProject] = useState(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (shareToken) {
      joinProject();
    } else {
      setError('Token de compartir inválido');
      setLoading(false);
    }
  }, [shareToken]);

  const joinProject = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/share/join/${shareToken}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al unirse al proyecto');
      }

      setProject(data.project);
      
      // Si el usuario ya tenía acceso, redirigir directamente
      if (data.message.includes('Ya tienes acceso')) {
        navigate(`/uml-editor/${data.project._id}`);
      }

    } catch (error) {
      console.error('Error uniéndose al proyecto:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinProject = async () => {
    try {
      setJoining(true);
      
      const response = await fetch(`/api/share/join/${shareToken}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al unirse al proyecto');
      }

      // Redirigir al editor UML
      navigate(`/uml-editor/${data.project._id}`);

    } catch (error) {
      console.error('Error uniéndose al proyecto:', error);
      setError(error.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="join-project-container">
        <div className="loading-spinner">
          <i className="fa fa-spinner fa-spin"></i>
          <p>Uniéndose al proyecto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="join-project-container">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Error al unirse al proyecto</h2>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            <i className="fas fa-refresh"></i>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="join-project-container">
        <div className="error-container">
          <i className="fas fa-question-circle"></i>
          <h2>Proyecto no encontrado</h2>
          <p>El enlace de compartir no es válido o ha expirado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="join-project-container">
      <div className="join-project-card">
        <div className="project-header">
          <div className="project-icon">
            <i className="fas fa-project-diagram"></i>
          </div>
          <h1>{project.name}</h1>
          <p className="project-description">{project.description || 'Proyecto UML colaborativo'}</p>
        </div>

        <div className="project-info">
          <div className="info-item">
            <i className="fas fa-user"></i>
            <span>Propietario: {project.owner?.name || 'Usuario'}</span>
          </div>
          
          {project.shareConfig && (
            <div className="info-item">
              <i className="fas fa-shield-alt"></i>
              <span>
                {project.shareConfig.isPublic ? 'Proyecto público' : 'Proyecto privado'}
              </span>
            </div>
          )}

          {project.shareConfig?.expirationDate && (
            <div className="info-item">
              <i className="fas fa-clock"></i>
              <span>
                Expira: {new Date(project.shareConfig.expirationDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="permissions-section">
          <h3>Permisos disponibles:</h3>
          <div className="permissions-grid">
            {project.shareConfig?.permissions?.canEdit && (
              <div className="permission-item">
                <i className="fas fa-edit"></i>
                <span>Editar elementos</span>
              </div>
            )}
            {project.shareConfig?.permissions?.canCreateDiagrams && (
              <div className="permission-item">
                <i className="fas fa-plus"></i>
                <span>Crear diagramas</span>
              </div>
            )}
            {project.shareConfig?.permissions?.canDeleteDiagrams && (
              <div className="permission-item">
                <i className="fas fa-trash"></i>
                <span>Eliminar diagramas</span>
              </div>
            )}
            {project.shareConfig?.permissions?.canExport && (
              <div className="permission-item">
                <i className="fas fa-download"></i>
                <span>Exportar</span>
              </div>
            )}
          </div>
        </div>

        <div className="join-actions">
          <button 
            className="join-button"
            onClick={handleJoinProject}
            disabled={joining}
          >
            {joining ? (
              <>
                <i className="fa fa-spinner fa-spin"></i>
                Uniéndose...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i>
                Unirse al Proyecto
              </>
            )}
          </button>

          <button 
            className="cancel-button"
            onClick={() => navigate('/dashboard')}
          >
            <i className="fas fa-times"></i>
            Cancelar
          </button>
        </div>

        <div className="join-info">
          <i className="fas fa-info-circle"></i>
          <p>
            Al unirte a este proyecto, podrás colaborar en tiempo real con otros usuarios.
            Los cambios se sincronizarán automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinProject;

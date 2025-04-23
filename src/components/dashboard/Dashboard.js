// src/components/dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import projectService from '../../services/projectService';
import Navbar from '../common/Navbar';
import ProjectCard from '../projects/ProjectCard';
import ProjectForm from '../projects/ProjectForm';
import './Dashboard.css';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // estados para unirse a una sala
  const [joinLink, setJoinLink] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joiningProject, setJoiningProject] = useState(false);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      const data = await projectService.createProject(projectData);
      setProjects([...projects, data.project]);
      setShowCreateForm(false);
    } catch (err) {
      setError(err.message || 'Error al crear el proyecto');
    }
  };

  const handleEditProject = (projectId) => {
    navigate(`/editor/${projectId}`);
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await projectService.deleteProject(projectId);
      setProjects(projects.filter(project => project._id !== projectId));
    } catch (err) {
      setError(err.message || 'Error al eliminar el proyecto');
    }
  };

  const handleJoinProject = () => {
    try {
      setJoinError('');
      setJoiningProject(true);
      
      // Validar el enlace
      if (!joinLink) {
        setJoinError('Por favor, ingresa un enlace válido');
        setJoiningProject(false);
        return;
      }
      
      // Extraer el ID del proyecto del enlace
      let projectId;
      try {
        // Asumiendo un formato como: http://localhost:3000/editor/64a1b2c3d4e5f6g7h8i9j0k
        const url = new URL(joinLink);
        const pathParts = url.pathname.split('/');
        projectId = pathParts[pathParts.length - 1];
      } catch (error) {
        // Si no es una URL válida, comprobamos si es solo el ID
        if (/^[a-f\d]{24}$/i.test(joinLink)) {
          projectId = joinLink;
        } else {
          setJoinError('El enlace proporcionado no es válido');
          setJoiningProject(false);
          return;
        }
      }
      
      // Navegar al editor con el ID del proyecto
      navigate(`/editor/${projectId}`);
    } catch (error) {
      console.error('Error al unirse al proyecto:', error);
      setJoinError('Error al unirse al proyecto: ' + (error.message || 'Error desconocido'));
      setJoiningProject(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      
      <div className="dashboard-container">
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2>Workspace</h2>
            <button 
              className="btn-create-project"
              onClick={() => setShowCreateForm(true)}
            >
              <span className="icon-plus">+</span>
              <span>Nuevo proyecto</span>
            </button>
          </div>
          
          <div className="sidebar-join-section">
            <h3>Unirse a un proyecto</h3>
            <div className="join-form-container">
              <input
                type="text"
                placeholder="Enlace o ID del proyecto"
                value={joinLink}
                onChange={(e) => setJoinLink(e.target.value)}
                className="join-input"
              />
              <button 
                className="btn-join-project"
                onClick={handleJoinProject}
                disabled={joiningProject}
              >
                {joiningProject ? 'Conectando...' : 'Unirse'}
              </button>
            </div>
            {joinError && <div className="join-error-message">{joinError}</div>}
          </div>
        </div>
        
        <div className="dashboard-main">
          <header className="main-header">
            <h1>Mis proyectos</h1>
            <div className="header-actions">
              <button className="btn-refresh" onClick={fetchProjects}>
                Actualizar
              </button>
            </div>
          </header>
          
          {error && (
            <div className="error-container">
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando tus proyectos...</p>
            </div>
          ) : (
            <div className="projects-container">
              {projects.length > 0 ? (
                <div className="projects-grid">
                  {projects.map(project => (
                    <ProjectCard
                      key={project._id}
                      project={project}
                      onEdit={() => handleEditProject(project._id)}
                      onDelete={() => handleDeleteProject(project._id)}
                      isOwner={currentUser?.id === project.owner?._id || currentUser?.id === project.owner}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-projects">
                  <div className="empty-icon">📁</div>
                  <h3>No hay proyectos disponibles</h3>
                  <p>Comienza creando un nuevo proyecto o únete a uno existente</p>
                  <button 
                    className="btn-create-first"
                    onClick={() => setShowCreateForm(true)}
                  >
                    Crear mi primer proyecto
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Crear nuevo proyecto</h2>
              <button 
                className="btn-close-modal"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            <ProjectForm 
              onSubmit={handleCreateProject}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
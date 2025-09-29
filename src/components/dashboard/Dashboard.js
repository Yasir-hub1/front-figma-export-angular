// src/components/dashboard/Dashboard.js - CORREGIDO
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import projectService from '../../services/projectService';
import shareService from '../../services/shareService';
import Navbar from '../common/Navbar';
import ProjectCard from '../projects/ProjectCard';
import ProjectForm from '../projects/ProjectForm';
import './Dashboard.css';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joinLink, setJoinLink] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joiningProject, setJoiningProject] = useState(false);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // DEBUG: Verificar estado inicial
  useEffect(() => {
    console.log('🏠 DASHBOARD: Iniciado');
    console.log('- URL actual:', window.location.href);
    console.log('- location.pathname:', location.pathname);
    console.log('- Usuario actual:', currentUser);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('📂 DASHBOARD: Obteniendo proyectos...');
      const data = await projectService.getProjects();
      console.log('✅ DASHBOARD: Proyectos obtenidos:', data.length);
      
      // DEBUG: Verificar estructura de proyectos
      if (data.length > 0) {
        console.log('🔍 DASHBOARD: Primer proyecto como muestra:', data[0]);
        console.log('- _id:', data[0]._id);
        console.log('- id:', data[0].id);
        console.log('- name:', data[0].name);
      }
      
      setProjects(data);
      setError(null);
    } catch (err) {
      console.error('❌ DASHBOARD: Error al obtener proyectos:', err);
      setError(err.message || 'Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      console.log('➕ DASHBOARD: Creando proyecto:', projectData);
      const data = await projectService.createProject(projectData);
      console.log('✅ DASHBOARD: Proyecto creado:', data.project);
      
      setProjects([...projects, data.project]);
      setShowCreateForm(false);
    } catch (err) {
      console.error('❌ DASHBOARD: Error al crear proyecto:', err);
      setError(err.message || 'Error al crear el proyecto');
    }
  };

  // CORRECCIÓN: Función mejorada para editar proyecto
  const handleEditProject = (projectId) => {
    console.log('🎯 DASHBOARD: Intentando abrir editor');
    console.log('- projectId recibido:', projectId);
    console.log('- Tipo de projectId:', typeof projectId);
    console.log('- Es válido (24 chars hex):', /^[a-f\d]{24}$/i.test(projectId));
    
    if (!projectId) {
      console.error('❌ DASHBOARD: projectId es undefined/null');
      alert('Error: ID de proyecto no válido');
      return;
    }
    
    // Verificar que el proyecto existe en la lista local
    const project = projects.find(p => p._id === projectId);
    if (!project) {
      console.error('❌ DASHBOARD: Proyecto no encontrado en lista local');
      console.error('- Buscando ID:', projectId);
      console.error('- IDs disponibles:', projects.map(p => p._id));
    } else {
      console.log('✅ DASHBOARD: Proyecto encontrado:', project.name);
    }
    
    const targetUrl = `/uml-editor/${projectId}`;
    console.log('🚀 DASHBOARD: Navegando a:', targetUrl);
    
    try {
      navigate(targetUrl);
      console.log('✅ DASHBOARD: navigate() ejecutado correctamente');
      
      // Verificar que la navegación fue exitosa después de un breve delay
      setTimeout(() => {
        console.log('🔍 DASHBOARD: Verificando navegación...');
        console.log('- URL después de navigate:', window.location.href);
        console.log('- Pathname:', window.location.pathname);
        
        if (window.location.pathname !== targetUrl) {
          console.warn('⚠️ DASHBOARD: La navegación no cambió la URL como esperado');
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ DASHBOARD: Error en navigate():', error);
      
      // Fallback con window.location
      console.log('🔄 DASHBOARD: Intentando con window.location');
      window.location.href = targetUrl;
    }
  };

  const handleDeleteProject = async (projectId) => {
    console.log('🗑️ DASHBOARD: Eliminando proyecto:', projectId);
    
    if (!window.confirm('¿Estás seguro que deseas eliminar este proyecto?')) {
      return;
    }
    
    try {
      await projectService.deleteProject(projectId);
      setProjects(projects.filter(project => project._id !== projectId));
      console.log('✅ DASHBOARD: Proyecto eliminado');
    } catch (err) {
      console.error('❌ DASHBOARD: Error al eliminar proyecto:', err);
      setError(err.message || 'Error al eliminar el proyecto');
    }
  };

  // CORRECCIÓN: Función mejorada para unirse a proyecto
  const handleJoinProject = async () => {
    try {
      console.log('🤝 DASHBOARD: Intentando unirse a proyecto:', joinLink);
      
      setJoinError('');
      setJoiningProject(true);
      
      if (!joinLink) {
        setJoinError('Por favor, ingresa un enlace válido');
        setJoiningProject(false);
        return;
      }
      
      let shareToken;
      try {
        const url = new URL(joinLink);
        const pathParts = url.pathname.split('/');
        shareToken = pathParts[pathParts.length - 1];
        console.log('🔗 DASHBOARD: Token extraído de URL:', shareToken);
      } catch (error) {
        // Si no es una URL válida, verificar si es solo el token
        if (/^[a-f\d]{64}$/i.test(joinLink)) {
          shareToken = joinLink;
          console.log('🔑 DASHBOARD: Usando como token directo:', shareToken);
        } else {
          setJoinError('El enlace proporcionado no es válido');
          setJoiningProject(false);
          return;
        }
      }
      
      if (!shareToken || !/^[a-f\d]{64}$/i.test(shareToken)) {
        setJoinError('El token del enlace no es válido');
        setJoiningProject(false);
        return;
      }
      
      console.log('🔍 DASHBOARD: Verificando enlace de compartir...');
      
      // Llamar al servicio de compartir para verificar el enlace
      const data = await shareService.joinProjectByLink(shareToken);
      console.log('✅ DASHBOARD: Respuesta del backend:', data);
      
      if (data.requiresAuth) {
        setJoinError('Debes iniciar sesión para unirte a este proyecto');
        setJoiningProject(false);
        return;
      }
      
      if (data.project && data.project._id) {
        console.log('✅ DASHBOARD: Navegando a proyecto compartido:', data.project._id);
        handleEditProject(data.project._id);
      } else {
        setJoinError('No se pudo obtener la información del proyecto');
        setJoiningProject(false);
      }
      
    } catch (error) {
      console.error('❌ DASHBOARD: Error al unirse al proyecto:', error);
      setJoinError('Error al unirse al proyecto: ' + (error.message || 'Error desconocido'));
    } finally {
      setJoiningProject(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Navbar />
      
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-title-section">
              <h1>🎨 Mis Proyectos UML</h1>
              <p className="header-subtitle">Gestiona y crea tus diagramas UML</p>
            </div>
            <button 
              className="create-button"
              onClick={() => setShowCreateForm(true)}
            >
              <span className="button-icon">➕</span>
              <span>Crear Proyecto</span>
            </button>
          </div>
        </header>

        {/* DEBUG INFO - TEMPORAL
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#e7f3ff', 
            marginBottom: '20px',
            borderRadius: '5px',
            fontSize: '0.9rem'
          }}>
            <strong>🔍 Dashboard Debug:</strong><br/>
            URL actual: {window.location.href}<br/>
            Pathname: {window.location.pathname}<br/>
            Proyectos cargados: {projects.length}<br/>
            Usuario: {currentUser?.email || 'No autenticado'}
            {projects.length > 0 && (
              <details style={{ marginTop: '5px' }}>
                <summary>Ver primer proyecto</summary>
                <pre style={{ fontSize: '0.8rem', margin: '5px 0' }}>
                  {JSON.stringify(projects[0], null, 2)}
                </pre>
              </details>
            )}
          </div>
        )} */}

        {/* Sección para unirse a un proyecto compartido */}
        <div className="join-project-section">
          <div className="join-header">
            <h2>🔗 Unirse a un Proyecto Compartido</h2>
            <p className="join-description">Ingresa el enlace o token para acceder a un proyecto compartido</p>
          </div>
          <div className="join-form">
            <div className="input-group">
              <label htmlFor="joinLink" className="input-label">
                Enlace o Token del Proyecto
              </label>
              <input
                type="text"
                id="joinLink"
                placeholder="Pega aquí el enlace compartido o ID del proyecto"
                value={joinLink}
                onChange={(e) => setJoinLink(e.target.value)}
                className="join-input"
              />
            </div>
            <button 
              className="join-button"
              onClick={handleJoinProject}
              disabled={joiningProject}
            >
              <span className="button-icon">{joiningProject ? '⏳' : '🚀'}</span>
              <span>{joiningProject ? 'Uniéndose...' : 'Unirse al Proyecto'}</span>
            </button>
          </div>
          {joinError && <div className="join-error">⚠️ {joinError}</div>}
        </div>
        
        {error && <div className="dashboard-error">{error}</div>}
        
        {showCreateForm && (
          <div className="create-form-container">
            <ProjectForm 
              onSubmit={handleCreateProject}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}
        
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner-icon">⏳</div>
            <p>Cargando tus proyectos...</p>
          </div>
        ) : (
          <div className="projects-section">
            {projects.length > 0 ? (
              <>
                <div className="projects-header">
                  <h3>📋 Tus Proyectos ({projects.length})</h3>
                  <p className="projects-subtitle">Haz clic en cualquier proyecto para editarlo</p>
                </div>
                <div className="projects-grid">
                  {projects.map(project => (
                    <ProjectCard
                      key={project._id}
                      project={project}
                      onEdit={() => {
                        console.log('📝 DASHBOARD: ProjectCard onEdit called for:', project._id);
                        handleEditProject(project._id);
                      }}
                      onDelete={() => handleDeleteProject(project._id)}
                      isOwner={currentUser?.id === project.owner?._id || currentUser?.id === project.owner}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="no-projects">
                <div className="no-projects-icon">🎨</div>
                <h3>¡Comienza tu primer proyecto UML!</h3>
                <p>No tienes proyectos todavía. Crea tu primer diagrama UML y comienza a diseñar.</p>
                <button onClick={() => setShowCreateForm(true)}>
                  <span className="button-icon">✨</span>
                  <span>Crear mi Primer Proyecto</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
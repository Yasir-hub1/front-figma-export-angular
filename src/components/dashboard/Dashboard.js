// src/components/dashboard/Dashboard.js - CORREGIDO
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    
    const targetUrl = `/editor/${projectId}`;
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
  const handleJoinProject = () => {
    try {
      console.log('🤝 DASHBOARD: Intentando unirse a proyecto:', joinLink);
      
      setJoinError('');
      setJoiningProject(true);
      
      if (!joinLink) {
        setJoinError('Por favor, ingresa un enlace válido');
        setJoiningProject(false);
        return;
      }
      
      let projectId;
      try {
        const url = new URL(joinLink);
        const pathParts = url.pathname.split('/');
        projectId = pathParts[pathParts.length - 1];
        console.log('🔗 DASHBOARD: ID extraído de URL:', projectId);
      } catch (error) {
        // Si no es una URL válida, verificar si es solo el ID
        if (/^[a-f\d]{24}$/i.test(joinLink)) {
          projectId = joinLink;
          console.log('🆔 DASHBOARD: Usando como ID directo:', projectId);
        } else {
          setJoinError('El enlace proporcionado no es válido');
          setJoiningProject(false);
          return;
        }
      }
      
      if (!projectId || !/^[a-f\d]{24}$/i.test(projectId)) {
        setJoinError('El ID del proyecto no es válido');
        setJoiningProject(false);
        return;
      }
      
      console.log('✅ DASHBOARD: Navegando a proyecto compartido:', projectId);
      handleEditProject(projectId);
      
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
          <h1>Mis Proyectos</h1>
          <button 
            className="create-button"
            onClick={() => setShowCreateForm(true)}
          >
            Crear Proyecto
          </button>
        </header>

        {/* DEBUG INFO - TEMPORAL */}
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
        )}

        {/* Sección para unirse a un proyecto compartido */}
        <div className="join-project-section">
          <h2>Unirse a un proyecto compartido</h2>
          <div className="join-form">
            <input
              type="text"
              placeholder="Pega aquí el enlace compartido o ID del proyecto"
              value={joinLink}
              onChange={(e) => setJoinLink(e.target.value)}
              className="join-input"
            />
            <button 
              className="join-button"
              onClick={handleJoinProject}
              disabled={joiningProject}
            >
              {joiningProject ? 'Uniéndose...' : 'Unirse'}
            </button>
          </div>
          {joinError && <div className="join-error">{joinError}</div>}
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
          <div className="loading-spinner">Cargando proyectos...</div>
        ) : (
          <div className="projects-grid">
            {projects.length > 0 ? (
              projects.map(project => (
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
              ))
            ) : (
              <div className="no-projects">
                <p>No tienes proyectos todavía.</p>
                <button onClick={() => setShowCreateForm(true)}>
                  Crear tu primer proyecto
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
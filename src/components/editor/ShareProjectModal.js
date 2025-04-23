// src/components/editor/ShareProjectModal.js
import React, { useState, useEffect } from 'react';
import projectService from '../../services/projectService';
import './ShareProjectModal.css';

const ShareProjectModal = ({ project, onClose }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('link');

  useEffect(() => {
    // Generar URL para compartir
    const baseUrl = window.location.origin;
    setShareUrl(`${baseUrl}/editor/${project._id}`);
    
    // Cargar colaboradores actuales
    fetchCollaborators();
    
    // Cargar usuarios activos
    fetchActiveUsers();
  }, [project]);
  
  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const data = await projectService.getCollaborators(project._id);
      setCollaborators(data);
    } catch (error) {
      console.error('Error al cargar colaboradores:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchActiveUsers = async () => {
    try {
      const data = await projectService.getActiveUsers(project._id);
      setActiveUsers(data);
    } catch (error) {
      console.error('Error al cargar usuarios activos:', error);
    }
  };
  
  const searchUsers = async (term) => {
    if (term.length < 1) {
      setUsers([]);
      return;
    }
    
    try {
      setLoading(true);
      const data = await projectService.searchUsers(term);
      // Filtrar usuarios que ya son colaboradores
      const filteredUsers = data.filter(user => 
        !collaborators.some(collab => collab._id === user._id)
      );
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error al buscar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    searchUsers(e.target.value);
  };
  
  const addCollaborator = async (userId) => {
    try {
      setLoading(true);
      
      // Llamar al servicio para añadir el colaborador
      await projectService.addCollaborator(project._id, userId);
      
      // Actualizar lista de colaboradores
      fetchCollaborators();
      
      // Limpiar búsqueda
      setSearchTerm('');
      setUsers([]);
    } catch (error) {
      console.error('Error al añadir colaborador:', error);
      alert('Error al añadir colaborador: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };
  
  const removeCollaborator = async (userId) => {
    try {
      setLoading(true);
      await projectService.removeCollaborator(project._id, userId);
      
      // Actualizar lista de colaboradores
      fetchCollaborators();
    } catch (error) {
      console.error('Error al eliminar colaborador:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Error al copiar el enlace:', err);
      });
  };
  
  return (
    <div className="share-modal-overlay">
      <div className="share-modal">
        <div className="share-modal-header">
          <h2>Compartir Proyecto</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>
        
        <div className="share-tabs">
          <button 
            className={`share-tab ${activeTab === 'link' ? 'active' : ''}`}
            onClick={() => setActiveTab('link')}
          >
            <i className="fa fa-link"></i> Enlace
          </button>
          <button 
            className={`share-tab ${activeTab === 'collaborators' ? 'active' : ''}`}
            onClick={() => setActiveTab('collaborators')}
          >
            <i className="fa fa-users"></i> Colaboradores
          </button>
          <button 
            className={`share-tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <i className="fa fa-circle"></i> Usuarios activos
          </button>
        </div>
        
        <div className="share-modal-content">
          {/* Sección de enlace para compartir */}
          {activeTab === 'link' && (
            <div className="share-link-section">
              <div className="section-info">
                <p className="share-instruction">
                  Comparte este enlace con cualquier persona para dar acceso al proyecto
                </p>
              </div>
              
              <div className="share-link-container">
                <input 
                  type="text" 
                  value={shareUrl} 
                  readOnly 
                  className="share-link-input"
                />
                <button 
                  className="copy-button"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <>
                      <i className="fa fa-check"></i> Copiado
                    </>
                  ) : (
                    <>
                      <i className="fa fa-copy"></i> Copiar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Sección de colaboradores */}
          {activeTab === 'collaborators' && (
            <div className="collaborators-section">
              <div className="section-header">
                <h3>Añadir nuevos colaboradores</h3>
              </div>
              
              <div className="search-container">
                <div className="search-input-wrapper">
                  <i className="fa fa-search search-icon"></i>
                  <input
                    type="text"
                    placeholder="Buscar usuarios por nombre o email"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-input"
                  />
                  {searchTerm && (
                    <button 
                      className="clear-search" 
                      onClick={() => {
                        setSearchTerm('');
                        setUsers([]);
                      }}
                    >
                      &times;
                    </button>
                  )}
                </div>
                
                <div className={`search-results ${users.length > 0 ? 'has-results' : ''}`}>
                  {loading ? (
                    <div className="loading-results">
                      <div className="loading-spinner"></div>
                      <span>Buscando usuarios...</span>
                    </div>
                  ) : users.length > 0 ? (
                    users.map(user => (
                      <div key={user._id} className="user-item">
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-details">
                            <div className="user-name">{user.username}</div>
                            <div className="user-email">{user.email}</div>
                          </div>
                        </div>
                        <button 
                          className="add-user-button"
                          onClick={() => addCollaborator(user._id)}
                          disabled={loading}
                        >
                          <i className="fa fa-plus"></i> Añadir
                        </button>
                      </div>
                    ))
                  ) : searchTerm.length >= 3 ? (
                    <div className="no-results">
                      <i className="fa fa-user-times"></i>
                      <span>No se encontraron usuarios</span>
                    </div>
                  ) : searchTerm.length > 0 ? (
                    <div className="search-hint">
                      Escribe al menos 3 caracteres para buscar
                    </div>
                  ) : null}
                </div>
              </div>
              
              <div className="section-header collaborators-header">
                <h3>Colaboradores actuales</h3>
                <span className="collaborator-count">
                  {collaborators.length} {collaborators.length === 1 ? 'usuario' : 'usuarios'}
                </span>
              </div>
              
              <div className="collaborators-list">
                {loading && collaborators.length === 0 ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <span>Cargando colaboradores...</span>
                  </div>
                ) : collaborators.length > 0 ? (
                  collaborators.map(user => (
                    <div key={user._id} className="collaborator-item">
                      <div className="user-info">
                        <div className={`user-avatar ${activeUsers.some(activeUser => activeUser.userId === user._id) ? 'online' : ''}`}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                          <div className="user-name">
                            {user.username}
                            {project.owner._id === user._id && (
                              <span className="owner-badge">Propietario</span>
                            )}
                          </div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      </div>
                      
                      {project.owner._id !== user._id && (
                        <button 
                          className="remove-user-button"
                          onClick={() => removeCollaborator(user._id)}
                          disabled={loading}
                          title="Eliminar colaborador"
                        >
                          <i className="fa fa-times"></i>
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <p>No hay colaboradores añadidos todavía</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Sección de usuarios activos */}
          {activeTab === 'active' && (
            <div className="active-users-section">
              <div className="section-info">
                <p className="active-users-info">
                  Usuarios que están trabajando en este proyecto ahora mismo
                </p>
              </div>
              
              <div className="active-users-list">
                {activeUsers.length > 0 ? (
                  activeUsers.map(user => (
                    <div key={user.socketId} className="active-user-item">
                      <div className="user-avatar online">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="active-user-info">
                        <span className="active-user-name">{user.username}</span>
                        <span className="active-status">
                          <span className="status-dot"></span> Conectado ahora
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">👤</div>
                    <p>No hay usuarios activos en este momento</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareProjectModal;
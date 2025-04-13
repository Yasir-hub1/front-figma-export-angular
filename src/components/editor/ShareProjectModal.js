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
    if (term.length < 3) {
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
      console.log('Intentando añadir colaborador con ID:', userId);
      setLoading(true);
      
      // Llamar al servicio para añadir el colaborador
      const response = await projectService.addCollaborator(project._id, userId);
      console.log('Respuesta del servidor:', response);
      
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
          >
            &times;
          </button>
        </div>
        
        <div className="share-modal-content">
          <div className="share-link-section">
            <h3>Enlace para compartir</h3>
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
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="share-info">
              Cualquier persona con este enlace podrá acceder al proyecto.
            </p>
          </div>
          
          <div className="collaborators-section">
            <h3>Colaboradores</h3>
            
            <div className="search-container">
              <input
                type="text"
                placeholder="Buscar usuarios por nombre o email"
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
              
              <div className="search-results">
              {loading ? (
                <div className="loading-results">Buscando...</div>
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
              ) : (
                <div className="no-results">No se encontraron usuarios</div>
              )}
            </div>
            </div>
            
            <div className="collaborators-list">
              <h4>Colaboradores actuales</h4>
              {loading ? (
                <div className="loading-collaborators">Cargando colaboradores...</div>
              ) : collaborators.length > 0 ? (
                collaborators.map(user => (
                  <div key={user._id} className="collaborator-item">
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <div className="user-name">
                          {user.username}
                          {project.owner === user._id && <span className="owner-badge">Propietario</span>}
                          {activeUsers.some(activeUser => activeUser.userId === user._id) && (
                            <span className="online-badge">En línea</span>
                          )}
                        </div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                    
                    {project.owner !== user._id && (
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
                <div className="no-collaborators">No hay colaboradores</div>
              )}
            </div>
          </div>
          
          <div className="active-users-section">
            <h3>Usuarios activos ahora</h3>
            <div className="active-users-list">
              {activeUsers.length > 0 ? (
                activeUsers.map(user => (
                  <div key={user.socketId} className="active-user">
                    <div className="user-avatar online">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="active-user-name">{user.username}</span>
                  </div>
                ))
              ) : (
                <div className="no-active-users">No hay usuarios activos actualmente</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareProjectModal;
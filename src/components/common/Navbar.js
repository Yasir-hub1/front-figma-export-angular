// src/components/common/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = ({ project }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };
  
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/dashboard" className="navbar-brand">
          Figma Angular Generator
        </Link>
        
        {project && (
          <span className="navbar-divider">/</span>
        )}
        
        {project && (
          <span className="navbar-project">{project.name}</span>
        )}
      </div>
      
      <div className="navbar-right">
        {currentUser && (
          <div className="user-dropdown">
            <button 
              className="user-button"
              onClick={toggleUserMenu}
            >
              <div className="user-avatar">
                {currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="user-name">{currentUser.username}</span>
              <i className="fa fa-caret-down"></i>
            </button>
            
            {showUserMenu && (
              <div className="user-menu">
                <div className="user-info">
                  <div className="menu-username">{currentUser.username}</div>
                  <div className="menu-email">{currentUser.email}</div>
                </div>
                
                <div className="menu-divider"></div>
                
                <Link to="/dashboard" className="menu-item">
                  <i className="fa fa-tachometer"></i>
                  Dashboard
                </Link>
                
                <Link to="/profile" className="menu-item">
                  <i className="fa fa-user"></i>
                  Mi Perfil
                </Link>
                
                <div className="menu-divider"></div>
                
                <button 
                  className="menu-item logout"
                  onClick={handleLogout}
                >
                  <i className="fa fa-sign-out"></i>
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
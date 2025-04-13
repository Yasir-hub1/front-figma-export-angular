// src/components/common/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Página no encontrada</h2>
        <p>Lo sentimos, la página que estás buscando no existe o ha sido movida.</p>
        <Link to="/dashboard" className="back-button">
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
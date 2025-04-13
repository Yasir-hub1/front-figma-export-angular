// src/components/projects/ProjectForm.js
import React, { useState } from 'react';
import './ProjectForm.css';

const ProjectForm = ({ project, onSubmit, onCancel }) => {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [canvasWidth, setCanvasWidth] = useState(project?.canvas?.width || 1440);
  const [canvasHeight, setCanvasHeight] = useState(project?.canvas?.height || 900);
  const [canvasBackground, setCanvasBackground] = useState(project?.canvas?.background || '#FFFFFF');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación
    if (!name.trim()) {
      setError('El nombre del proyecto es obligatorio');
      return;
    }
    
    if (canvasWidth < 320 || canvasHeight < 240) {
      setError('Las dimensiones del canvas son demasiado pequeñas');
      return;
    }
    
    const projectData = {
      name,
      description,
      canvas: {
        width: Number(canvasWidth),
        height: Number(canvasHeight),
        background: canvasBackground
      }
    };
    
    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit(projectData);
    } catch (err) {
      setError(err.message || 'Error al guardar el proyecto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="project-form">
      <h2>{project ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}</h2>
      
      {error && <div className="form-error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nombre del Proyecto</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Mi proyecto"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Descripción (opcional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe tu proyecto aquí"
            rows={3}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="canvasWidth">Ancho del Canvas (px)</label>
            <input
              type="number"
              id="canvasWidth"
              value={canvasWidth}
              onChange={(e) => setCanvasWidth(e.target.value)}
              min="320"
              max="3840"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="canvasHeight">Alto del Canvas (px)</label>
            <input
              type="number"
              id="canvasHeight"
              value={canvasHeight}
              onChange={(e) => setCanvasHeight(e.target.value)}
              min="240"
              max="2160"
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="canvasBackground">Color de Fondo</label>
          <div className="color-input-container">
            <input
              type="color"
              id="canvasBackground"
              value={canvasBackground}
              onChange={(e) => setCanvasBackground(e.target.value)}
              className="color-input"
            />
            <input
              type="text"
              value={canvasBackground}
              onChange={(e) => setCanvasBackground(e.target.value)}
              className="color-text"
              maxLength={7}
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : project ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
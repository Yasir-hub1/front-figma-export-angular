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
    <div className="project-form-container">
      <div className="project-form-header">
        <h2>{project ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}</h2>
      </div>
      
      {error && (
        <div className="form-error">
          <i className="fa fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="name">Nombre del Proyecto</label>
            <div className="input-wrapper">
              <i className="fa fa-pencil input-icon"></i>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Mi proyecto"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Descripción (opcional)</label>
            <div className="input-wrapper">
              <i className="fa fa-align-left input-icon textarea-icon"></i>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tu proyecto aquí"
                rows={3}
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3 className="section-title">Propiedades del Canvas</h3>
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="canvasWidth">Ancho del Canvas (px)</label>
              <div className="input-wrapper">
                <i className="fa fa-arrows-h input-icon"></i>
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
            </div>
            
            <div className="form-group half">
              <label htmlFor="canvasHeight">Alto del Canvas (px)</label>
              <div className="input-wrapper">
                <i className="fa fa-arrows-v input-icon"></i>
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
          </div>
          
          <div className="form-group">
            <label htmlFor="canvasBackground">Color de Fondo</label>
            <div className="color-input-container">
              <div className="color-preview-wrapper">
                <input
                  type="color"
                  id="canvasBackground"
                  value={canvasBackground}
                  onChange={(e) => setCanvasBackground(e.target.value)}
                  className="color-input"
                  aria-label="Seleccionar color"
                />
                <div 
                  className="color-preview" 
                  style={{ backgroundColor: canvasBackground }}
                ></div>
              </div>
              <div className="input-wrapper color-text-wrapper">
                <i className="fa fa-hashtag input-icon"></i>
                <input
                  type="text"
                  value={canvasBackground}
                  onChange={(e) => setCanvasBackground(e.target.value)}
                  className="color-text"
                  maxLength={7}
                  placeholder="FFFFFF"
                />
              </div>
            </div>
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
            {isSubmitting ? (
              <>
                <span className="button-spinner"></span>
                <span>Guardando...</span>
              </>
            ) : project ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
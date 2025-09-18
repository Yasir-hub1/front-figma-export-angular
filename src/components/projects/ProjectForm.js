// src/components/projects/ProjectForm.js
import React, { useState } from 'react';
import './ProjectForm.css';

const ProjectForm = ({ project, onSubmit, onCancel }) => {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [deviceType, setDeviceType] = useState(project?.deviceType || 'custom');
  const [canvasWidth, setCanvasWidth] = useState(project?.canvas?.width || 360);
  const [canvasHeight, setCanvasHeight] = useState(project?.canvas?.height || 640);
  const [canvasBackground, setCanvasBackground] = useState(project?.canvas?.background || '#FFFFFF');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tipos de diagramas UML predefinidos
  const diagramTypes = [
    { id: 'custom', name: 'Personalizado', width: 1000, height: 700 },
    { id: 'class', name: 'Diagrama de Clases', width: 1200, height: 800 },
    { id: 'sequence', name: 'Diagrama de Secuencia', width: 1000, height: 600 },
    { id: 'usecase', name: 'Casos de Uso', width: 800, height: 600 },
    { id: 'activity', name: 'Diagrama de Actividades', width: 900, height: 700 },
    { id: 'state', name: 'Diagrama de Estados', width: 800, height: 600 },
  ];

  // Manejar cambio de tipo de diagrama
  const handleDiagramTypeChange = (e) => {
    const selectedDiagram = diagramTypes.find(diagram => diagram.id === e.target.value);
    if (selectedDiagram) {
      setDeviceType(selectedDiagram.id);
      if (selectedDiagram.id !== 'custom') {
        setCanvasWidth(selectedDiagram.width);
        setCanvasHeight(selectedDiagram.height);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación
    if (!name.trim()) {
      setError('El nombre del proyecto es obligatorio');
      return;
    }
    
    if (canvasWidth < 600 || canvasHeight < 400) {
      setError('Las dimensiones del diagrama son demasiado pequeñas');
      return;
    }
    
    const projectData = {
      name,
      description,
      deviceType,
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
      <h2>{project ? 'Editar Proyecto UML' : 'Crear Nuevo Proyecto UML'}</h2>
      
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
            placeholder="Mi diagrama UML"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Descripción (opcional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe tu proyecto de diagramas UML aquí"
            rows={3}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="deviceType">Tipo de Diagrama</label>
          <select
            id="deviceType"
            value={deviceType}
            onChange={handleDiagramTypeChange}
          >
            {diagramTypes.map(diagram => (
              <option key={diagram.id} value={diagram.id}>{diagram.name}</option>
            ))}
          </select>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="canvasWidth">Ancho (px)</label>
            <input
              type="number"
              id="canvasWidth"
              value={canvasWidth}
              onChange={(e) => setCanvasWidth(e.target.value)}
              min="600"
              max="2000"
              disabled={deviceType !== 'custom'}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="canvasHeight">Alto (px)</label>
            <input
              type="number"
              id="canvasHeight"
              value={canvasHeight}
              onChange={(e) => setCanvasHeight(e.target.value)}
              min="400"
              max="1600"
              disabled={deviceType !== 'custom'}
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
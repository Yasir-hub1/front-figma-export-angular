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

  // Dispositivos móviles predefinidos
  const mobileDevices = [
    { id: 'custom', name: 'Personalizado', width: 360, height: 640 },
    { id: 'iphone12', name: 'iPhone 12/13', width: 390, height: 844 },
    { id: 'iphone8', name: 'iPhone 8', width: 375, height: 667 },
    { id: 'pixel5', name: 'Google Pixel 5', width: 393, height: 851 },
    { id: 'samsungs21', name: 'Samsung Galaxy S21', width: 360, height: 800 },
    { id: 'ipad', name: 'iPad', width: 768, height: 1024 },
  ];

  // Manejar cambio de dispositivo
  const handleDeviceChange = (e) => {
    const selectedDevice = mobileDevices.find(device => device.id === e.target.value);
    if (selectedDevice) {
      setDeviceType(selectedDevice.id);
      if (selectedDevice.id !== 'custom') {
        setCanvasWidth(selectedDevice.width);
        setCanvasHeight(selectedDevice.height);
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
    
    if (canvasWidth < 320 || canvasHeight < 240) {
      setError('Las dimensiones del canvas son demasiado pequeñas');
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
      <h2>{project ? 'Editar Proyecto' : 'Crear Nuevo Proyecto Flutter'}</h2>
      
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
            placeholder="Mi app Flutter"
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
        
        <div className="form-group">
          <label htmlFor="deviceType">Dispositivo</label>
          <select
            id="deviceType"
            value={deviceType}
            onChange={handleDeviceChange}
          >
            {mobileDevices.map(device => (
              <option key={device.id} value={device.id}>{device.name}</option>
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
              min="320"
              max="1200"
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
              min="240"
              max="2160"
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
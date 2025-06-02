// src/components/editor/ElementProperties.js - CORRECCIONES

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import './ElementProperties.css';

const ElementProperties = ({ onClose }) => {
  const { 
    selectedElement, 
    updateElement, 
    deleteElement, 
    duplicateElement, 
    selectElement, 
    notifyElementInteraction,
    endElementInteraction,
    currentScreen // AGREGAR currentScreen para verificación
  } = useEditor();
  
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [styles, setStyles] = useState({});
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (selectedElement) {
      setName(selectedElement.name || '');
      setContent(selectedElement.content || '');
      setPositionX(selectedElement.position?.x || 0);
      setPositionY(selectedElement.position?.y || 0);
      setWidth(selectedElement.size?.width || 100);
      setHeight(selectedElement.size?.height || 100);
      setStyles(selectedElement.styles || {});
    }
  }, [selectedElement]);
  
  const type = selectedElement?.type || '';

  if (!selectedElement) return null;

  const handleContentChange = (e) => {
    setContent(e.target.value);
    notifyElementInteraction(selectedElement._id, "editando");
  };

  const handleSave = async () => {
    if (!selectedElement || !currentScreen) {
      console.error('❌ No hay elemento seleccionado o screen actual');
      return;
    }
    
    setSaving(true);
    
    try {
      console.log("🔄 Guardando cambios del elemento:", {
        elementId: selectedElement._id,
        screenId: currentScreen._id,
        updates: {
          name,
          content,
          position: { x: Number(positionX), y: Number(positionY) },
          size: { width: Number(width), height: Number(height) },
          styles
        }
      });
      
      // Actualizar el elemento en el estado local primero
      selectElement(selectedElement._id, {
        ...selectedElement,
        name,
        content,
        position: { x: Number(positionX), y: Number(positionY) },
        size: { width: Number(width), height: Number(height) },
        styles
      });
      
      // Luego enviar la actualización al servidor
      await updateElement(selectedElement._id, {
        name,
        content,
        position: { x: Number(positionX), y: Number(positionY) },
        size: { width: Number(width), height: Number(height) },
        styles
      });
      
      console.log("✅ Elemento guardado exitosamente");
      
    } catch (error) {
      console.error('❌ Error al guardar el elemento:', error);
      alert('Error al guardar: ' + (error.message || 'Error desconocido'));
    } finally {
      setSaving(false);
      endElementInteraction(selectedElement._id);
    }
  };

  // FUNCIÓN ELIMINAR CORREGIDA
  const handleDelete = async () => {
    if (!selectedElement || !currentScreen) {
      console.error('❌ No hay elemento seleccionado o screen actual');
      alert('Error: No hay elemento seleccionado o pantalla activa');
      return;
    }
    
    if (window.confirm('¿Estás seguro de que deseas eliminar este elemento?')) {
      try {
        console.log("🗑️ Eliminando elemento:", {
          elementId: selectedElement._id,
          elementName: selectedElement.name,
          screenId: currentScreen._id,
          screenName: currentScreen.name
        });
        
        await deleteElement(selectedElement._id);
        console.log("✅ Elemento eliminado exitosamente");
        
        // Cerrar el panel de propiedades después de eliminar
        if (onClose) {
          onClose();
        }
        
      } catch (error) {
        console.error('❌ Error al eliminar el elemento:', error);
        alert('Error al eliminar elemento: ' + (error.message || 'Error desconocido'));
      }
    }
  };

  // FUNCIÓN DUPLICAR CORREGIDA
  const handleDuplicate = async () => {
    if (!selectedElement || !currentScreen) {
      console.error('❌ No hay elemento seleccionado o screen actual');
      alert('Error: No hay elemento seleccionado o pantalla activa');
      return;
    }
    
    try {
      setSaving(true);
      console.log("📋 Duplicando elemento:", {
        elementId: selectedElement._id,
        elementName: selectedElement.name,
        elementType: selectedElement.type,
        screenId: currentScreen._id,
        screenName: currentScreen.name
      });

      const duplicatedElement = await duplicateElement(selectedElement._id);
      console.log("✅ Elemento duplicado exitosamente:", duplicatedElement);
      
      // Seleccionar el elemento duplicado
      if (duplicatedElement) {
        selectElement(duplicatedElement._id, duplicatedElement);
      }

    } catch (error) {
      console.error('❌ Error al duplicar el elemento:', error);
      alert('Error al duplicar elemento: ' + (error.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  // Actualizar un estilo específico
  const updateStyle = (property, value) => {
    setStyles({
      ...styles,
      [property]: value
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSaving(true);
    
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (event) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_SIZE = 800;
        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedImageData = canvas.toDataURL('image/jpeg', 0.7);
        
        setContent(compressedImageData);
        updateElement(selectedElement._id, {
          ...selectedElement,
          content: compressedImageData
        }).finally(() => {
          setSaving(false);
        });
      };
      
      img.onerror = () => {
        alert('Error al cargar la imagen.');
        setSaving(false);
      };
      
      img.src = event.target.result;
    };
    
    reader.onerror = () => {
      alert('Error al leer el archivo.');
      setSaving(false);
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div className="element-properties">
      <div className="properties-header">
        <h3>Propiedades del Elemento</h3>
        <button className="close-properties" onClick={onClose}>×</button>
      </div>
      
      {/* DEBUG INFO - Quitar en producción */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          fontSize: '10px', 
          padding: '5px', 
          backgroundColor: '#f0f0f0', 
          marginBottom: '10px',
          borderRadius: '3px'
        }}>
          <strong>🐛 Debug:</strong><br/>
          Element ID: {selectedElement?._id}<br/>
          Screen ID: {currentScreen?._id}<br/>
          Screen Name: {currentScreen?.name}
        </div>
      )}
      
      <div className="properties-tabs">
        <button 
          className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button 
          className={`tab-button ${activeTab === 'style' ? 'active' : ''}`}
          onClick={() => setActiveTab('style')}
        >
          Estilos
        </button>
        <button 
          className={`tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          Avanzado
        </button>
      </div>
      
      <div className="properties-content">
        {activeTab === 'general' && (
          <div className="tab-content">
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSave}
              />
            </div>
            
            {/* Contenido según el tipo de elemento */}
            {type !== 'image' ? (
              <div className="form-group">
                <label>Contenido</label>
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onBlur={handleSave}
                />
              </div>
            ) : (
              <div className="form-group">
                <label>Imagen</label>
                <div className="image-upload-container">
                  {content ? (
                    <div className="image-preview">
                      <img 
                        src={content} 
                        alt="Vista previa" 
                        className="image-preview-thumbnail" 
                      />
                      <button 
                        className="remove-image-button"
                        onClick={() => {
                          setContent('');
                          handleSave();
                        }}
                        disabled={saving}
                      >
                        <i className="fa fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      Sin imagen
                    </div>
                  )}
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                    disabled={saving}
                  />
                  <label htmlFor="image-upload" className={`file-input-label ${saving ? 'disabled' : ''}`}>
                    {saving ? (
                      <>
                        <i className="fa fa-spinner fa-spin"></i> Procesando...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-upload"></i> Seleccionar imagen
                      </>
                    )}
                  </label>
                  <div className="upload-help-text">
                    Se recomienda imágenes de menos de 2MB. Las imágenes serán redimensionadas automáticamente.
                  </div>
                </div>
              </div>
            )}
            
            <div className="form-row">
              <div className="form-group">
                <label>Posición X</label>
                <input
                  type="number"
                  value={positionX}
                  onChange={(e) => setPositionX(e.target.value)}
                  onBlur={handleSave}
                />
              </div>
              
              <div className="form-group">
                <label>Posición Y</label>
                <input
                  type="number"
                  value={positionY}
                  onChange={(e) => setPositionY(e.target.value)}
                  onBlur={handleSave}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Ancho</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  onBlur={handleSave}
                />
              </div>
              
              <div className="form-group">
                <label>Alto</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  onBlur={handleSave}
                />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'style' && (
          <div className="tab-content">
            <div className="form-group">
              <label>Color de Fondo</label>
              <div className="color-input-container">
                <input
                  type="color"
                  value={styles.backgroundColor || '#ffffff'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  onBlur={handleSave}
                  className="color-input"
                />
                <input
                  type="text"
                  value={styles.backgroundColor || '#ffffff'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  onBlur={handleSave}
                  className="color-text"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Color de Texto</label>
              <div className="color-input-container">
                <input
                  type="color"
                  value={styles.color || '#000000'}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  onBlur={handleSave}
                  className="color-input"
                />
                <input
                  type="text"
                  value={styles.color || '#000000'}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  onBlur={handleSave}
                  className="color-text"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Ancho de Borde</label>
                <input
                  type="number"
                  value={styles.borderWidth || 0}
                  onChange={(e) => updateStyle('borderWidth', Number(e.target.value))}
                  onBlur={handleSave}
                />
              </div>
              
              <div className="form-group">
                <label>Radio de Borde</label>
                <input
                  type="number"
                  value={styles.borderRadius || 0}
                  onChange={(e) => updateStyle('borderRadius', Number(e.target.value))}
                  onBlur={handleSave}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Color de Borde</label>
              <div className="color-input-container">
                <input
                  type="color"
                  value={styles.borderColor || '#000000'}
                  onChange={(e) => updateStyle('borderColor', e.target.value)}
                  onBlur={handleSave}
                  className="color-input"
                />
                <input
                  type="text"
                  value={styles.borderColor || '#000000'}
                  onChange={(e) => updateStyle('borderColor', e.target.value)}
                  onBlur={handleSave}
                  className="color-text"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Fuente</label>
                <select
                  value={styles.fontFamily || 'Arial'}
                  onChange={(e) => updateStyle('fontFamily', e.target.value)}
                  onBlur={handleSave}
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Tamaño de Fuente</label>
                <input
                  type="number"
                  value={styles.fontSize || 14}
                  onChange={(e) => updateStyle('fontSize', Number(e.target.value))}
                  onBlur={handleSave}
                />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'advanced' && (
          <div className="tab-content">
            <div className="form-group">
              <label>Opacidad</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={styles.opacity || 1}
                onChange={(e) => updateStyle('opacity', Number(e.target.value))}
                onBlur={handleSave}
              />
              <span className="range-value">{(styles.opacity || 1) * 100}%</span>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Padding</label>
                <input
                  type="text"
                  value={styles.padding || '0px'}
                  onChange={(e) => updateStyle('padding', e.target.value)}
                  onBlur={handleSave}
                  placeholder="0px"
                />
              </div>
              
              <div className="form-group">
                <label>Margin</label>
                <input
                  type="text"
                  value={styles.margin || '0px'}
                  onChange={(e) => updateStyle('margin', e.target.value)}
                  onBlur={handleSave}
                  placeholder="0px"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>CSS Personalizado</label>
              <textarea
                value={styles.customCSS || ''}
                onChange={(e) => updateStyle('customCSS', e.target.value)}
                onBlur={handleSave}
                placeholder="Propiedades CSS adicionales"
                rows={5}
              ></textarea>
            </div>
          </div>
        )}
      </div>
      
      <div className="properties-actions">
        <button
          className="action-button duplicate"
          onClick={handleDuplicate}
          disabled={saving || !currentScreen || !selectedElement}
          title="Duplicar Elemento"
        >
          {saving ? (
            <>
              <i className="fa fa-spinner fa-spin"></i> Duplicando...
            </>
          ) : (
            <>
              <i className="fa fa-copy"></i> Duplicar
            </>
          )}
        </button>
        
        <button
          className="action-button delete"
          onClick={handleDelete}
          disabled={!currentScreen || !selectedElement}
          title="Eliminar Elemento"
        >
          <i className="fa fa-trash"></i> Eliminar
        </button>
      </div>
    </div>
  );
};

export default ElementProperties;
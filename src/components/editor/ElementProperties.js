// src/components/editor/ElementProperties.js
import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import './ElementProperties.css';

const ElementProperties = ({ onClose }) => {
  const { selectedElement, updateElement, deleteElement, duplicateElement, selectElement, notifyElementInteraction, endElementInteraction } = useEditor();
  
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [styles, setStyles] = useState({});
  const [flutterProps, setFlutterProps] = useState({});
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  
  // Determinar el tipo de widget Flutter
  const type = selectedElement?.type || '';
  const flutterWidget = selectedElement?.flutterWidget || type;
  
  useEffect(() => {
    if (selectedElement) {
      setName(selectedElement.name || '');
      setContent(selectedElement.content || '');
      setPositionX(selectedElement.position?.x || 0);
      setPositionY(selectedElement.position?.y || 0);
      setWidth(selectedElement.size?.width || 100);
      setHeight(selectedElement.size?.height || 100);
      setStyles(selectedElement.styles || {});
      setFlutterProps(selectedElement.flutterProps || {});
    }
  }, [selectedElement]);

  // Si no hay un elemento seleccionado, no mostrar el panel
  if (!selectedElement) return null;

  const handleContentChange = (e) => {
    e.stopPropagation(); // Prevenir la propagación del evento
    setContent(e.target.value);
    // Notificar que estamos editando
    notifyElementInteraction(selectedElement._id, "editando");
  };

  const handleSave = async () => {
    if (!selectedElement) return;
    
    setSaving(true);
    
    try {
      // Actualizar el elemento en el estado local primero, para una respuesta visual inmediata
      selectElement(selectedElement._id, {
        ...selectedElement,
        name,
        content,
        position: { x: Number(positionX), y: Number(positionY) },
        size: { width: Number(width), height: Number(height) },
        styles,
        flutterProps
      });
      
      // Luego enviar la actualización al servidor
      await updateElement(selectedElement._id, {
        name,
        content,
        position: { x: Number(positionX), y: Number(positionY) },
        size: { width: Number(width), height: Number(height) },
        styles,
        flutterProps
      });
      endElementInteraction(selectedElement._id);
    } catch (error) {
      console.error('Error al guardar el elemento:', error);
    } finally {
      setSaving(false);
      endElementInteraction(selectedElement._id);
    }
  };

  // Eliminar el elemento
  const handleDelete = async () => {
    if (!selectedElement) return;
    
    if (window.confirm('¿Estás seguro de que deseas eliminar este elemento?')) {
      try {
        await deleteElement(selectedElement._id);
      } catch (error) {
        console.error('Error al eliminar el elemento:', error);
      }
    }
  };

  // Duplicar el elemento
  const handleDuplicate = async () => {
    if (!selectedElement) return;
    
    try {
      setSaving(true);
      await duplicateElement(selectedElement._id);
    } catch (error) {
      console.error('Error al duplicar el elemento:', error);
      alert('Error al duplicar el elemento: ' + (error.message || 'Error desconocido'));
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

  // Actualizar una propiedad específica de Flutter
  const updateFlutterProp = (property, value) => {
    setFlutterProps({
      ...flutterProps,
      [property]: value
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Mostrar indicador de carga
    setSaving(true);
    
    // Crear una imagen para redimensionar
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (event) => {
      img.onload = () => {
        // Crear un canvas para redimensionar
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Mantener relación de aspecto y establecer un tamaño máximo
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
        
        // Dibujar imagen redimensionada
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Obtener como data URL con calidad reducida
        const compressedImageData = canvas.toDataURL('image/jpeg', 0.7);
        
        // Actualizar contenido y guardar
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

  // Ejemplo para el cambio de nombre
const handleNameChange = (e) => {
  e.stopPropagation();
  setName(e.target.value);
};

  // Renderizar las propiedades específicas de Flutter según el tipo de widget
  const renderFlutterSpecificProperties = () => {
    switch (flutterWidget) {
      case 'ElevatedButton':
      case 'elevatedButton':
        return (
          <>
            <div className="form-group">
              <label>Estilo de Botón</label>
              <select
                value={flutterProps.buttonStyle || 'filled'}
                onChange={(e) => updateFlutterProp('buttonStyle', e.target.value)}
                onBlur={handleSave}
              >
                <option value="filled">Filled</option>
                <option value="elevated">Elevated</option>
                <option value="tonal">Tonal</option>
              </select>
            </div>
            <div className="form-group">
              <label>Elevación</label>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={flutterProps.elevation || 2}
                onChange={(e) => updateFlutterProp('elevation', Number(e.target.value))}
                onBlur={handleSave}
              />
              <span className="range-value">{flutterProps.elevation || 2}</span>
            </div>
          </>
        );
      
      case 'OutlinedButton':
      case 'outlinedButton':
        return (
          <>
            <div className="form-group">
              <label>Grosor de Borde</label>
              <input
                type="number"
                min="1"
                max="5"
                value={flutterProps.borderWidth || 1}
                onChange={(e) => updateFlutterProp('borderWidth', Number(e.target.value))}
                onBlur={handleSave}
              />
            </div>
          </>
        );
      
      case 'TextField':
      case 'textField':
        return (
          <>
            <div className="form-group">
              <label>Texto de Ayuda</label>
              <input
                type="text"
                value={flutterProps.helperText || ''}
                onChange={(e) => updateFlutterProp('helperText', e.target.value)}
                onBlur={handleSave}
                placeholder="Texto de ayuda"
              />
            </div>
            <div className="form-group">
              <label>Estilo de Borde</label>
              <select
                value={flutterProps.borderStyle || 'outline'}
                onChange={(e) => updateFlutterProp('borderStyle', e.target.value)}
                onBlur={handleSave}
              >
                <option value="outline">Outline</option>
                <option value="underline">Underline</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                id="prefixIcon"
                checked={flutterProps.prefixIcon || false}
                onChange={(e) => updateFlutterProp('prefixIcon', e.target.checked)}
                onBlur={handleSave}
              />
              <label htmlFor="prefixIcon">Mostrar ícono al inicio</label>
            </div>
          </>
        );
      
      case 'AppBar':
      case 'appBar':
        return (
          <>
            <div className="form-check">
              <input
                type="checkbox"
                id="centerTitle"
                checked={flutterProps.centerTitle || false}
                onChange={(e) => updateFlutterProp('centerTitle', e.target.checked)}
                onBlur={handleSave}
              />
              <label htmlFor="centerTitle">Centrar título</label>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                id="showBackButton"
                checked={flutterProps.showBackButton || false}
                onChange={(e) => updateFlutterProp('showBackButton', e.target.checked)}
                onBlur={handleSave}
              />
              <label htmlFor="showBackButton">Mostrar botón de regreso</label>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                id="showActions"
                checked={flutterProps.showActions || false}
                onChange={(e) => updateFlutterProp('showActions', e.target.checked)}
                onBlur={handleSave}
              />
              <label htmlFor="showActions">Mostrar acciones</label>
            </div>
          </>
        );
      
      case 'FloatingActionButton':
      case 'floatingActionButton':
        return (
          <>
            <div className="form-group">
              <label>Tipo de FAB</label>
              <select
                value={flutterProps.fabType || 'regular'}
                onChange={(e) => updateFlutterProp('fabType', e.target.value)}
                onBlur={handleSave}
              >
                <option value="regular">Regular</option>
                <option value="extended">Extended</option>
                <option value="mini">Mini</option>
              </select>
            </div>
            <div className="form-group">
              <label>Ícono</label>
              <select
                value={flutterProps.icon || 'add'}
                onChange={(e) => updateFlutterProp('icon', e.target.value)}
                onBlur={handleSave}
              >
                <option value="add">Añadir (+)</option>
                <option value="edit">Editar (lápiz)</option>
                <option value="save">Guardar (disco)</option>
                <option value="search">Buscar (lupa)</option>
                <option value="favorite">Favorito (estrella)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Elevación</label>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={flutterProps.elevation || 6}
                onChange={(e) => updateFlutterProp('elevation', Number(e.target.value))}
                onBlur={handleSave}
              />
              <span className="range-value">{flutterProps.elevation || 6}</span>
            </div>
          </>
        );
      
      case 'Card':
      case 'card':
        return (
          <>
            <div className="form-group">
              <label>Elevación</label>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={flutterProps.elevation || 1}
                onChange={(e) => updateFlutterProp('elevation', Number(e.target.value))}
                onBlur={handleSave}
              />
              <span className="range-value">{flutterProps.elevation || 1}</span>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                id="showCardTitle"
                checked={flutterProps.showTitle || true}
                onChange={(e) => updateFlutterProp('showTitle', e.target.checked)}
                onBlur={handleSave}
              />
              <label htmlFor="showCardTitle">Mostrar título</label>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                id="showCardImage"
                checked={flutterProps.showImage || false}
                onChange={(e) => updateFlutterProp('showImage', e.target.checked)}
                onBlur={handleSave}
              />
              <label htmlFor="showCardImage">Mostrar imagen</label>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                id="showCardActions"
                checked={flutterProps.showActions || false}
                onChange={(e) => updateFlutterProp('showActions', e.target.checked)}
                onBlur={handleSave}
              />
              <label htmlFor="showCardActions">Mostrar acciones</label>
            </div>
          </>
        );
      
      case 'Switch':
      case 'switch':
        return (
          <>
            <div className="form-check">
              <input
                type="checkbox"
                id="switchValue"
                checked={flutterProps.value || false}
                onChange={(e) => updateFlutterProp('value', e.target.checked)}
                onBlur={handleSave}
              />
              <label htmlFor="switchValue">Valor (encendido/apagado)</label>
            </div>
            <div className="form-group">
              <label>Color Activo</label>
              <div className="color-input-container">
                <input
                  type="color"
                  value={flutterProps.activeColor || styles.color || '#2196F3'}
                  onChange={(e) => updateFlutterProp('activeColor', e.target.value)}
                  onBlur={handleSave}
                  className="color-input"
                />
                <input
                  type="text"
                  value={flutterProps.activeColor || styles.color || '#2196F3'}
                  onChange={(e) => updateFlutterProp('activeColor', e.target.value)}
                  onBlur={handleSave}
                  className="color-text"
                />
              </div>
            </div>
          </>
        );
      
      case 'BottomNavigationBar':
      case 'bottomNavigationBar':
        return (
          <>
            <div className="form-group">
              <label>Estilo de Navegación</label>
              <select
                value={flutterProps.type || 'fixed'}
                onChange={(e) => updateFlutterProp('type', e.target.value)}
                onBlur={handleSave}
              >
                <option value="fixed">Fixed</option>
                <option value="shifting">Shifting</option>
              </select>
            </div>
            <div className="form-group">
              <label>Ítem Seleccionado</label>
              <select
                value={flutterProps.currentIndex || 0}
                onChange={(e) => updateFlutterProp('currentIndex', Number(e.target.value))}
                onBlur={handleSave}
              >
                <option value="0">Home (0)</option>
                <option value="1">Search (1)</option>
                <option value="2">Profile (2)</option>
              </select>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                id="showLabels"
                checked={flutterProps.showLabels || true}
                onChange={(e) => updateFlutterProp('showLabels', e.target.checked)}
                onBlur={handleSave}
              />
              <label htmlFor="showLabels">Mostrar etiquetas</label>
            </div>
          </>
        );

      case 'Divider':
      case 'divider':
        return (
          <>
            <div className="form-group">
              <label>Grosor</label>
              <input
                type="number"
                min="1"
                max="10"
                value={flutterProps.thickness || 1}
                onChange={(e) => updateFlutterProp('thickness', Number(e.target.value))}
                onBlur={handleSave}
              />
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                id="isVertical"
                checked={flutterProps.isVertical || false}
                onChange={(e) => {
                  updateFlutterProp('isVertical', e.target.checked);
                  // Si cambia a vertical, intercambiar ancho y alto
                  if (e.target.checked && width < height) {
                    setWidth(height);
                    setHeight(width);
                  } else if (!e.target.checked && width > height) {
                    setWidth(height);
                    setHeight(width);
                  }
                }}
                onBlur={handleSave}
              />
              <label htmlFor="isVertical">Vertical</label>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                id="hasIndent"
                checked={flutterProps.hasIndent || false}
                onChange={(e) => updateFlutterProp('hasIndent', e.target.checked)}
                onBlur={handleSave}
              />
              <label htmlFor="hasIndent">Con sangría</label>
            </div>
          </>
        );
        
      // Añadir más casos para otros widgets de Flutter

      default:
        return null;
    }
  };

  return (
    <div className="element-properties flutter-element-properties">
      <div className="properties-header">
        <h3>{flutterWidget} <span className="element-type-badge">{type}</span></h3>
        <button className="close-properties" onClick={onClose}>×</button>
      </div>
      
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
          className={`tab-button ${activeTab === 'flutter' ? 'active' : ''}`}
          onClick={() => setActiveTab('flutter')}
        >
          Flutter
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
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Montserrat">Montserrat</option>
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
            
            <div className="form-group">
              <label>Peso de Fuente</label>
              <select
                value={styles.fontWeight || 'normal'}
                onChange={(e) => updateStyle('fontWeight', e.target.value)}
                onBlur={handleSave}
              >
                <option value="normal">Normal</option>
                <option value="bold">Negrita</option>
                <option value="100">Thin (100)</option>
                <option value="300">Light (300)</option>
                <option value="500">Medium (500)</option>
                <option value="700">Bold (700)</option>
                <option value="900">Black (900)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Alineación de Texto</label>
              <select
                value={styles.textAlign || 'left'}
                onChange={(e) => updateStyle('textAlign', e.target.value)}
                onBlur={handleSave}
              >
                <option value="left">Izquierda</option>
                <option value="center">Centro</option>
                <option value="right">Derecha</option>
                <option value="justify">Justificado</option>
              </select>
            </div>
          </div>
        )}
        
        {activeTab === 'flutter' && (
          <div className="tab-content">
            <div className="flutter-widget-info">
              <div className="flutter-widget-tag">
                {flutterWidget}
              </div>
              <p className="flutter-widget-description">
                Configura las propiedades específicas del widget {flutterWidget} de Flutter.
              </p>
            </div>
            
            {renderFlutterSpecificProperties()}
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
              <label>Índice Z</label>
              <input
                type="number"
                value={styles.zIndex || 1}
                onChange={(e) => updateStyle('zIndex', Number(e.target.value))}
                onBlur={handleSave}
              />
            </div>
            
            <div className="form-group">
              <label>Código Dart personalizado</label>
              <textarea
                value={flutterProps.customDart || ''}
                onChange={(e) => updateFlutterProp('customDart', e.target.value)}
                onBlur={handleSave}
                placeholder="Código Dart personalizado"
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
          disabled={saving}
          title="Duplicar Elemento"
        >
          {saving ? 'Duplicando...' : 'Duplicar'}
        </button>
        
        <button
          className="action-button delete"
          onClick={handleDelete}
          title="Eliminar Elemento"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default ElementProperties;
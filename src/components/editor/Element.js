// src/components/editor/Element.js
import React from 'react';
import { useEditor } from '../../context/EditorContext';
import './Element.css';

const Element = ({ element, isSelected, onDragStart, onResizeStart }) => {
  const { selectElement, elementInteractions } = useEditor();
  
  const { 
    _id, 
    type, 
    name, 
    content, 
    position, 
    size, 
    styles = {} 
  } = element;

  // Verificar si hay una interacción activa para este elemento
  const interaction = elementInteractions && elementInteractions[_id];
// Debug
if (interaction) {
  console.log('🟣 Elemento con interacción:', _id, interaction);
}
  // Convertir estilos a formato CSS
  const getStyles = () => {
    const elementStyles = {
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
      ...convertStylesToCSS(styles)
    };
    
    return elementStyles;
  };

  // Convertir el objeto de estilos a formato CSS
  const convertStylesToCSS = (stylesObj) => {
    const cssStyles = {};
    
    Object.entries(stylesObj).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        cssStyles[cssKey] = value;
      }
    });
    
    return cssStyles;
  };

  // Renderizar contenido según el tipo de elemento
  const renderElementContent = () => {
    switch (type) {
      case 'text':
        return <p className="element-content">{content || 'Texto'}</p>;
        
      case 'button':
        return <button className="element-button">{content || 'Botón'}</button>;
        
      case 'image':
        return (
          <div className="element-image-container">
            {content ? (
              <img src={content} alt={name} className="element-image" />
            ) : (
              <div className="element-image-placeholder">Imagen</div>
            )}
          </div>
        );
        
      case 'input':
        return <input type="text" className="element-input" placeholder={content || 'Input'} readOnly />;
        
      case 'textarea':
        return <textarea className="element-textarea" placeholder={content || 'Área de texto'} readOnly></textarea>;
        
      case 'checkbox':
        return (
          <label className="element-checkbox-label">
            <input type="checkbox" className="element-checkbox" readOnly />
            {content || 'Checkbox'}
          </label>
        );
        
      case 'radio':
        return (
          <label className="element-radio-label">
            <input type="radio" className="element-radio" readOnly />
            {content || 'Radio'}
          </label>
        );
        
      case 'select':
        return (
          <select className="element-select" disabled>
            <option>{content || 'Select'}</option>
          </select>
        );
        
      case 'icon':
        return <i className={`element-icon ${content || 'fa fa-star'}`}></i>;
        
      case 'link':
        return <a className="element-link" href="#">{content || 'Enlace'}</a>;
        
      case 'navbar':
        return <div className="element-navbar">{content || 'Barra de navegación'}</div>;
        
      case 'menu':
        return <div className="element-menu">{content || 'Menú'}</div>;
        
      case 'menuItem':
        return <div className="element-menu-item">{content || 'Elemento de menú'}</div>;
        
      case 'card':
        return <div className="element-card">{content || 'Tarjeta'}</div>;
        
      case 'hero':
        return <div className="element-hero">{content || 'Sección Hero'}</div>;
        
      case 'footer':
        return <div className="element-footer">{content || 'Pie de página'}</div>;
        
      case 'carousel':
        return <div className="element-carousel">{content || 'Carrusel'}</div>;
        
      case 'video':
        return (
          <div className="element-video-container">
            <div className="element-video-placeholder">
              <i className="fa fa-play-circle"></i>
              <span>{content || 'Video'}</span>
            </div>
          </div>
        );
        
      case 'avatar':
        return <div className="element-avatar">{content?.charAt(0) || 'U'}</div>;
        
      case 'alert':
        return (
          <div className="element-alert">
            <i className="fa fa-exclamation-circle"></i>
            <span>{content || 'Mensaje de alerta'}</span>
          </div>
        );
        
      case 'badge':
        return <div className="element-badge">{content || 'Nuevo'}</div>;
        
      case 'tooltip':
        return <div className="element-tooltip">{content || 'Información adicional'}</div>;
        
      case 'progress':
        return (
          <div className="element-progress">
            <div 
              className="element-progress-bar" 
              style={{ width: '50%', height: '100%', backgroundColor: '#4285f4' }}
            ></div>
          </div>
        );
        
      case 'container':
      default:
        return <div className="element-container-content">{content || ''}</div>;
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    selectElement(_id);
  };

  // Manejador para iniciar el arrastre
  const handleDragStart = (e) => {
    e.stopPropagation();
    e.preventDefault(); // Importante para evitar comportamientos predeterminados del navegador
    onDragStart(e);
  };

  return (
    <div
      className={`editor-element element-${type} ${isSelected ? 'selected' : ''}`}
      style={getStyles()}
      onClick={handleClick}
      onMouseDown={handleDragStart}
    >
      {renderElementContent()}

         {/* Indicador de interacción */}
      {interaction && (
        <div className="user-badge" style={{position: 'absolute', top: '-25px', left: '0', zIndex: 1000}}>
          <div style={{
            backgroundColor: '#FF5722',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap'
          }}>
            {interaction.username} {interaction.action}
          </div>
        </div>
      )}
      
      {isSelected && (
        <div className="element-controls">
          <div 
            className="element-resize-handle top-left"
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, 'top-left');
            }}
          ></div>
          <div 
            className="element-resize-handle top-right"
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, 'top-right');
            }}
          ></div>
          <div 
            className="element-resize-handle bottom-left"
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, 'bottom-left');
            }}
          ></div>
          <div 
            className="element-resize-handle bottom-right"
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, 'bottom-right');
            }}
          ></div>
        </div>
      )}
      
      {isSelected && <div className="element-name">{name}</div>}
    </div>
  );
};

export default Element;
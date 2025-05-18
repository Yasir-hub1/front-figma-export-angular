// src/components/editor/Element.js
import React from 'react';
import { useEditor } from '../../context/EditorContext';
import './Element.css';

const Element = ({ element, isSelected, onSelect, onDragStart, onResizeStart }) => {
  const { elementInteractions } = useEditor();
  
  const { 
    _id, 
    type, 
    name, 
    content, 
    position, 
    size, 
    styles = {},
    flutterWidget 
  } = element;

  // Verificar si hay una interacción activa para este elemento
  const interaction = elementInteractions && elementInteractions[_id];

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

  // Función renderElementContent (tu implementación existente)
  const renderElementContent = () => {
    // Tu código actual...
    switch (type) {
      case 'text':
        return <p className="element-content">{content || 'Text'}</p>;
        
      case 'elevatedButton':
      case 'outlinedButton':
      case 'textButton':
        return <button className={`element-button ${type}`}>{content || 'Button'}</button>;
        
      case 'image':
        return (
          <div className="element-image-container">
            {content ? (
              <img src={content} alt={name} className="element-image" />
            ) : (
              <div className="element-image-placeholder">
                <i className="fa fa-image"></i>
              </div>
            )}
          </div>
        );
      
      case 'textField':
        return <input type="text" className="element-input" placeholder={content || 'Hint text'} readOnly />;
        
      case 'appBar':
        return (
          <div className="element-app-bar">
            <div className="app-bar-title">{content || 'AppBar'}</div>
            <div className="app-bar-actions">
              <i className="fa fa-ellipsis-v"></i>
            </div>
          </div>
        );
        
      case 'floatingActionButton':
        return (
          <div className="element-fab">
            <i className="fa fa-plus"></i>
          </div>
        );
        
      case 'divider':
        return <div className="element-divider"></div>;
        
      case 'card':
        return (
          <div className="element-card">
            <div className="card-content">{content || 'Card Content'}</div>
          </div>
        );
        
      case 'switch':
        return (
          <div className="element-switch">
            <div className="switch-track">
              <div className="switch-thumb"></div>
            </div>
          </div>
        );
        
      case 'slider':
        return (
          <div className="element-slider">
            <div className="slider-track">
              <div className="slider-thumb"></div>
            </div>
          </div>
        );
        
      case 'bottomNavigationBar':
        return (
          <div className="element-bottom-nav">
            <div className="nav-item"><i className="fa fa-home"></i></div>
            <div className="nav-item"><i className="fa fa-search"></i></div>
            <div className="nav-item"><i className="fa fa-user"></i></div>
          </div>
        );
        
      case 'tabBar':
        return (
          <div className="element-tab-bar">
            <div className="tab-item active">Tab 1</div>
            <div className="tab-item">Tab 2</div>
            <div className="tab-item">Tab 3</div>
          </div>
        );

      case 'drawer':
        return (
          <div className="element-drawer">
            <div className="drawer-header"></div>
            <div className="drawer-items">
              <div className="drawer-item">Item 1</div>
              <div className="drawer-item">Item 2</div>
              <div className="drawer-item">Item 3</div>
            </div>
          </div>
        );
        
      case 'row':
        return <div className="element-row">{content || 'Row'}</div>;
        
      case 'column':
        return <div className="element-column">{content || 'Column'}</div>;
        
      case 'stack':
        return <div className="element-stack">{content || 'Stack'}</div>;
        
      case 'container':
      default:
        return <div className="element-container-content">{content || ''}</div>;
    }
  };

  // Manejar clic del elemento - Modificado para usar función de selección
  const handleClick = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect();
    }
  };

  // Manejador para iniciar el arrastre - Ahora usa el elemento explícitamente
  const handleDragStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDragStart) {
      onDragStart(e);
    }
  };

  return (
    <div
      className={`editor-element element-${type} flutter-widget-${flutterWidget || type} ${isSelected ? 'selected' : ''}`}
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
      
      {/* Widget de Flutter Tag */}
      <div className="flutter-widget-tag">
        {flutterWidget || type}
      </div>
      
      {isSelected && (
        <div className="element-controls">
          <div 
            className="element-resize-handle top-left"
            onMouseDown={(e) => {
              e.stopPropagation();
              if (onResizeStart) {
                onResizeStart(e, 'top-left');
              }
            }}
          ></div>
          <div 
            className="element-resize-handle top-right"
            onMouseDown={(e) => {
              e.stopPropagation();
              if (onResizeStart) {
                onResizeStart(e, 'top-right');
              }
            }}
          ></div>
          <div 
            className="element-resize-handle bottom-left"
            onMouseDown={(e) => {
              e.stopPropagation();
              if (onResizeStart) {
                onResizeStart(e, 'bottom-left');
              }
            }}
          ></div>
          <div 
            className="element-resize-handle bottom-right"
            onMouseDown={(e) => {
              e.stopPropagation();
              if (onResizeStart) {
                onResizeStart(e, 'bottom-right');
              }
            }}
          ></div>
        </div>
      )}
      
      {isSelected && <div className="element-name">{name}</div>}
    </div>
  );
};

export default Element;
import React from 'react';
import { useUML, UML_VISIBILITY } from '../../context/UMLcontext';
import './UMLElement.css';

const UMLElement = ({ 
  element, 
  isSelected, 
  onSelect, 
  onDragStart, 
  onResizeStart, 
  diagramType,
  connectionMode,
  isConnectionSource
}) => {
  const { 
    elementInteractions,
    showStereotypes,
    showVisibility,
    showOperations,
    showAttributes
  } = useUML();
  
  const { 
    _id, 
    type, 
    name, 
    position, 
    size, 
    styles = {},
    // Propiedades específicas UML
    stereotype,
    isAbstract,
    visibility = 'public',
    attributes = [],
    operations = [],
    // Para interfaces
    methods = [],
    // Para casos de uso
    description,
    // Para paquetes
    elements: packageElements = [],
    // Propiedades del elemento
    properties = {}
  } = element;
  
  // Debug: Log element data
  console.log('UMLElement rendering with data:', {
    name,
    type,
    attributes,
    operations,
    properties: properties,
    propertiesAttributes: properties?.attributes,
    propertiesOperations: properties?.operations
  });

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

  // Renderizar atributos de clase
  const renderAttributes = () => {
    // Get attributes from multiple possible sources - prioritize the most complete data
    const elementAttributes = element.properties?.attributes || 
                             properties?.attributes ||
                             element.attributes || 
                             attributes || 
                             [];
    
    console.log('Rendering attributes for element:', element.name, {
      attributes,
      elementAttributes,
      elementProperties: element.properties,
      properties,
      showAttributes,
      finalAttributes: elementAttributes
    });
    
    if (!showAttributes || !elementAttributes || elementAttributes.length === 0) {
      console.log('No attributes to render for element:', element.name);
      return null;
    }
    
    return (
      <div className="uml-attributes-section">
        {elementAttributes.map((attr, index) => (
          <div key={index} className="uml-attribute">
            {showVisibility && (
              <span className="visibility-indicator">
                {UML_VISIBILITY[attr.visibility?.toUpperCase()] || UML_VISIBILITY.PUBLIC}
              </span>
            )}
            <span className="attribute-name">{attr.name || 'unnamed'}</span>
            {attr.type && (
              <>
                <span className="type-separator">: </span>
                <span className="attribute-type">{attr.type}</span>
              </>
            )}
            {attr.defaultValue && (
              <>
                <span className="default-separator"> = </span>
                <span className="default-value">{attr.defaultValue}</span>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Renderizar operaciones/métodos de clase
  const renderOperations = () => {
    if (!showOperations) return null;
    
    // Get operations/methods from multiple possible sources - prioritize the most complete data
    const elementOperations = element.properties?.operations || 
                             properties?.operations ||
                             element.properties?.methods || 
                             properties?.methods ||
                             element.operations || 
                             element.methods || 
                             operations || 
                             [];
    
    console.log('Rendering operations for element:', element.name, {
      operations,
      elementOperations,
      elementProperties: element.properties,
      properties,
      showOperations,
      finalOperations: elementOperations
    });
    
    if (!elementOperations || elementOperations.length === 0) {
      console.log('No operations to render for element:', element.name);
      return null;
    }
    
    return (
      <div className="uml-operations-section">
        {elementOperations.map((op, index) => (
          <div key={index} className="uml-operation">
            {showVisibility && (
              <span className="visibility-indicator">
                {UML_VISIBILITY[op.visibility?.toUpperCase()] || UML_VISIBILITY.PUBLIC}
              </span>
            )}
            <span className={`operation-name ${op.isAbstract ? 'abstract' : ''}`}>
              {op.name || 'unnamed'}
            </span>
            <span className="parameters">(</span>
            {op.parameters && op.parameters.map((param, pIndex) => (
              <span key={pIndex} className="parameter">
                {pIndex > 0 && ', '}
                <span className="param-name">{param.name}</span>
                {param.type && (
                  <>
                    <span className="type-separator">: </span>
                    <span className="param-type">{param.type}</span>
                  </>
                )}
              </span>
            ))}
            <span className="parameters">)</span>
            {op.returnType && (
              <>
                <span className="type-separator">: </span>
                <span className="return-type">{op.returnType}</span>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Renderizar estereotipo
  const renderStereotype = () => {
    if (!showStereotypes || !stereotype) return null;
    
    return (
      <div className="uml-stereotype">
        «{stereotype}»
      </div>
    );
  };

  // Renderizar contenido según el tipo de elemento UML
  const renderElementContent = () => {
    switch (type) {
      case 'class':
        return (
          <div className="uml-class-content" onClick={handleClick}>
            {renderStereotype()}
            <div className={`uml-class-name ${isAbstract ? 'abstract' : ''}`}>
              {name || 'Class'}
            </div>
            <div className="uml-separator"></div>
            {renderAttributes()}
            {(showAttributes && attributes?.length > 0 && showOperations && (operations?.length > 0 || methods?.length > 0)) && (
              <div className="uml-separator"></div>
            )}
            {renderOperations()}
          </div>
        );

      case 'interface':
        return (
          <div className="uml-interface-content" onClick={handleClick}>
            {renderStereotype()}
            <div className="uml-interface-name">
              {name || 'Interface'}
            </div>
            <div className="uml-separator"></div>
            {renderOperations()}
          </div>
        );

      case 'abstract_class':
        return (
          <div className="uml-abstract-class-content" onClick={handleClick}>
            {renderStereotype()}
            <div className="uml-class-name abstract">
              {name || 'AbstractClass'}
            </div>
            <div className="uml-separator"></div>
            {renderAttributes()}
            {(showAttributes && attributes?.length > 0 && showOperations && (operations?.length > 0 || methods?.length > 0)) && (
              <div className="uml-separator"></div>
            )}
            {renderOperations()}
          </div>
        );

      case 'enum':
        return (
          <div className="uml-enum-content" onClick={handleClick}>
            {renderStereotype()}
            <div className="uml-enum-name">
              {name || 'Enum'}
            </div>
            <div className="uml-separator"></div>
            <div className="uml-enum-values">
              {attributes?.map((attr, index) => (
                <div key={index} className="enum-value">
                  {attr.name}
                </div>
              )) || <div className="enum-value">VALUE1</div>}
            </div>
          </div>
        );

      case 'package':
        return (
          <div className="uml-package-content" onClick={handleClick}>
            <div className="uml-package-tab">
              <div className="package-name">{name || 'Package'}</div>
            </div>
            <div className="uml-package-body">
              {packageElements?.length > 0 ? (
                <div className="package-elements-count">
                  {packageElements.length} elemento{packageElements.length !== 1 ? 's' : ''}
                </div>
              ) : (
                <div className="package-placeholder">
                  Paquete vacío
                </div>
              )}
            </div>
          </div>
        );

      case 'component':
        return (
          <div className="uml-component-content" onClick={handleClick}>
            <div className="component-icon">
              <div className="component-symbol">⬜</div>
            </div>
            <div className="component-name">{name || 'Component'}</div>
          </div>
        );

      case 'actor':
        return (
          <div className="uml-actor-content" onClick={handleClick}>
            <div className="actor-figure">
              <div className="actor-head"></div>
              <div className="actor-body"></div>
              <div className="actor-arms"></div>
              <div className="actor-legs"></div>
            </div>
            <div className="actor-name">{name || 'Actor'}</div>
          </div>
        );

      case 'use_case':
        return (
          <div className="uml-usecase-content" onClick={handleClick}>
            <div className="usecase-name">{name || 'Use Case'}</div>
            {description && (
              <div className="usecase-description">{description}</div>
            )}
          </div>
        );

      case 'note':
        return (
          <div className="uml-note-content" onClick={handleClick}>
            <div className="note-corner"></div>
            <div className="note-text">
              {description || name || 'Nota'}
            </div>
          </div>
        );

      case 'intermediate_table':
        return (
          <div className="uml-intermediate-table-content" onClick={handleClick}>
            {renderStereotype()}
            <div className="uml-intermediate-table-name">
              {name || 'TablaIntermedia'}
            </div>
            <div className="uml-separator"></div>
            {renderAttributes()}
            {(showAttributes && attributes?.length > 0 && showOperations && (operations?.length > 0 || methods?.length > 0)) && (
              <div className="uml-separator"></div>
            )}
            {renderOperations()}
          </div>
        );

      default:
        return (
          <div className="uml-default-content" onClick={handleClick}>
            <div className="default-name">{name || type}</div>
          </div>
        );
    }
  };

  // Manejar clic del elemento
  const handleClick = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect();
    }
  };

  // Manejador para iniciar el arrastre
  const handleMouseDown = (e) => {
    e.stopPropagation();
    
    // Si no está seleccionado, seleccionarlo primero
    if (!isSelected && onSelect) {
      onSelect();
    }
    
    // Solo iniciar drag si es el botón izquierdo del mouse y no estamos en modo conexión
    if (e.button === 0 && !connectionMode && onDragStart) {
      onDragStart(e);
    }
  };

  // Obtener clases CSS para el elemento
  const getElementClasses = () => {
    const classes = [
      'uml-element',
      `uml-${type}`,
      `diagram-${diagramType}`,
    ];
    
    if (isSelected) {
      classes.push('selected');
    }
    
    if (connectionMode) {
      classes.push('connection-mode');
    }
    
    if (isConnectionSource) {
      classes.push('connection-source');
    }
    
    if (isAbstract) {
      classes.push('abstract');
    }
    
    return classes.join(' ');
  };

  return (
    <div
      className={getElementClasses()}
      style={getStyles()}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
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
      
      {/* Etiqueta del tipo de elemento UML */}
      <div className="uml-type-tag">
        {type.replace('_', ' ')}
      </div>
      
      {/* Controles de redimensionamiento solo cuando está seleccionado */}
      {isSelected && !connectionMode && (
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
      
      {/* Puntos de conexión para diagramas UML */}
      {connectionMode && (
        <div className="connection-points">
          <div className="connection-point top"></div>
          <div className="connection-point right"></div>
          <div className="connection-point bottom"></div>
          <div className="connection-point left"></div>
        </div>
      )}
      
      {isSelected && <div className="element-name-label">{name}</div>}
    </div>
  );
};

export default UMLElement;
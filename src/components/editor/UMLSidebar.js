// src/components/uml/UMLSidebar.js - Panel de Componentes UML
import React, { useState } from 'react';
import { useUML, UML_ELEMENT_TYPES, UML_RELATIONSHIP_TYPES } from '../../context/UMLcontext';
import './UMLSidebar.css';

const UMLSidebar = ({ onClose, connectionMode, setConnectionMode, diagramType }) => {
  const { createUMLElement, currentDiagram } = useUML();
  const [activeTab, setActiveTab] = useState('elements');
  const [searchTerm, setSearchTerm] = useState('');

  // Elementos UML disponibles según el tipo de diagrama
  const getAvailableElements = () => {
    switch (diagramType) {
      case 'class':
        return [
          {
            type: UML_ELEMENT_TYPES.CLASS,
            name: 'Clase',
            icon: 'fa fa-object-group',
            description: 'Clase con atributos y métodos'
          },
          {
            type: UML_ELEMENT_TYPES.INTERFACE,
            name: 'Interfaz',
            icon: 'fa fa-circle-o',
            description: 'Interfaz con métodos abstractos'
          },
          {
            type: UML_ELEMENT_TYPES.ABSTRACT_CLASS,
            name: 'Clase Abstracta',
            icon: 'fa fa-object-group',
            description: 'Clase abstracta con métodos virtuales'
          },
          {
            type: UML_ELEMENT_TYPES.ENUM,
            name: 'Enumeración',
            icon: 'fa fa-list',
            description: 'Enumeración de valores'
          },
          {
            type: UML_ELEMENT_TYPES.PACKAGE,
            name: 'Paquete',
            icon: 'fa fa-folder',
            description: 'Contenedor de elementos'
          },
          {
            type: UML_ELEMENT_TYPES.NOTE,
            name: 'Nota',
            icon: 'fa fa-sticky-note',
            description: 'Nota explicativa'
          },
        ];
      
      case 'usecase':
        return [
          {
            type: UML_ELEMENT_TYPES.ACTOR,
            name: 'Actor',
            icon: 'fa fa-user',
            description: 'Actor del sistema'
          },
          {
            type: UML_ELEMENT_TYPES.USE_CASE,
            name: 'Caso de Uso',
            icon: 'fa fa-circle',
            description: 'Caso de uso del sistema'
          },
          {
            type: UML_ELEMENT_TYPES.NOTE,
            name: 'Nota',
            icon: 'fa fa-sticky-note',
            description: 'Nota explicativa'
          }
        ];
      
      case 'component':
        return [
          {
            type: UML_ELEMENT_TYPES.COMPONENT,
            name: 'Componente',
            icon: 'fa fa-cube',
            description: 'Componente del sistema'
          },
          {
            type: UML_ELEMENT_TYPES.INTERFACE,
            name: 'Interfaz',
            icon: 'fa fa-circle-o',
            description: 'Interfaz de componente'
          },
          {
            type: UML_ELEMENT_TYPES.PACKAGE,
            name: 'Paquete',
            icon: 'fa fa-folder',
            description: 'Paquete de componentes'
          },
          {
            type: UML_ELEMENT_TYPES.NOTE,
            name: 'Nota',
            icon: 'fa fa-sticky-note',
            description: 'Nota explicativa'
          }
        ];
      
      default:
        return [
          {
            type: UML_ELEMENT_TYPES.CLASS,
            name: 'Clase',
            icon: 'fa fa-object-group',
            description: 'Clase con atributos y métodos'
          },
          {
            type: UML_ELEMENT_TYPES.INTERFACE,
            name: 'Interfaz',
            icon: 'fa fa-circle-o',
            description: 'Interfaz con métodos abstractos'
          },
          {
            type: UML_ELEMENT_TYPES.NOTE,
            name: 'Nota',
            icon: 'fa fa-sticky-note',
            description: 'Nota explicativa'
          }
        ];
    }
  };

  // Relaciones UML disponibles según el tipo de diagrama
  const getAvailableRelationships = () => {
    switch (diagramType) {
      case 'class':
        return [
          {
            type: UML_RELATIONSHIP_TYPES.INHERITANCE,
            name: 'Herencia',
            icon: 'fa fa-long-arrow-up',
            description: 'Relación de herencia (is-a)',
            style: { strokeDasharray: 'none', markerEnd: 'triangle' }
          },
          // {
          //   type: UML_RELATIONSHIP_TYPES.REALIZATION,
          //   name: 'Realización',
          //   icon: 'fa fa-long-arrow-up',
          //   description: 'Implementación de interfaz',
          //   style: { strokeDasharray: '5,5', markerEnd: 'triangle' }
          // },
          {
            type: UML_RELATIONSHIP_TYPES.ASSOCIATION,
            name: 'Asociación',
            icon: 'fa fa-arrows-h',
            description: 'Relación de asociación',
            style: { strokeDasharray: 'none', markerEnd: 'arrow' }
          },
          {
            type: UML_RELATIONSHIP_TYPES.AGGREGATION,
            name: 'Agregación',
            icon: 'fa fa-diamond',
            description: 'Relación de agregación (has-a)',
            style: { strokeDasharray: 'none', markerEnd: 'diamond' }
          },
          {
            type: UML_RELATIONSHIP_TYPES.COMPOSITION,
            name: 'Composición',
            icon: 'fa fa-diamond',
            description: 'Relación de composición (owns-a)',
            style: { strokeDasharray: 'none', markerEnd: 'filledDiamond' }
          },
          {
            type: UML_RELATIONSHIP_TYPES.DEPENDENCY,
            name: 'Dependencia',
            icon: 'fa fa-long-arrow-right',
            description: 'Relación de dependencia (uses)',
            style: { strokeDasharray: '5,5', markerEnd: 'arrow' }
          },
          // Relaciones de Cardinalidad/Multiplicidad
          {
            type: 'one-to-one',
            name: 'Uno a Uno',
            icon: 'fa fa-arrows-h',
            description: 'Relación 1:1 (uno a uno)',
            style: { strokeDasharray: 'none', markerEnd: 'arrow' },
            cardinality: { source: '1', target: '1' }
          },
          {
            type: 'one-to-many',
            name: 'Uno a Muchos',
            icon: 'fa fa-arrows-h',
            description: 'Relación 1:* (uno a muchos)',
            style: { strokeDasharray: 'none', markerEnd: 'arrow' },
            cardinality: { source: '1', target: '*' }
          },
          {
            type: 'many-to-one',
            name: 'Muchos a Uno',
            icon: 'fa fa-arrows-h',
            description: 'Relación *:1 (muchos a uno)',
            style: { strokeDasharray: 'none', markerEnd: 'arrow' },
            cardinality: { source: '*', target: '1' }
          },
          {
            type: 'many-to-many',
            name: 'Muchos a Muchos',
            icon: 'fa fa-arrows-h',
            description: 'Relación *:* (muchos a muchos)',
            style: { strokeDasharray: 'none', markerEnd: 'arrow' },
            cardinality: { source: '*', target: '*' }
          },
          {
            type: 'zero-to-one',
            name: 'Cero a Uno',
            icon: 'fa fa-arrows-h',
            description: 'Relación 0..1:1 (cero a uno)',
            style: { strokeDasharray: 'none', markerEnd: 'arrow' },
            cardinality: { source: '0..1', target: '1' }
          },
          {
            type: 'zero-to-many',
            name: 'Cero a Muchos',
            icon: 'fa fa-arrows-h',
            description: 'Relación 0..1:* (cero a muchos)',
            style: { strokeDasharray: 'none', markerEnd: 'arrow' },
            cardinality: { source: '0..1', target: '*' }
          },
          {
            type: 'one-or-many',
            name: 'Uno o Muchos',
            icon: 'fa fa-arrows-h',
            description: 'Relación 1..*:* (uno o muchos)',
            style: { strokeDasharray: 'none', markerEnd: 'arrow' },
            cardinality: { source: '1..*', target: '*' }
          },
          // Tabla Intermedia
          {
            type: 'intermediate-table',
            name: 'Tabla Intermedia',
            icon: 'fa fa-table',
            description: 'Tabla intermedia para relaciones complejas',
            style: { strokeDasharray: 'none', markerEnd: 'arrow' },
            isIntermediateTable: true
          }
        ];
      
      case 'usecase':
        return [
          {
            type: UML_RELATIONSHIP_TYPES.ASSOCIATION,
            name: 'Asociación',
            icon: 'fa fa-arrows-h',
            description: 'Relación actor-caso de uso',
            style: { strokeDasharray: 'none', markerEnd: 'none' }
          },
          {
            type: UML_RELATIONSHIP_TYPES.INCLUDE,
            name: 'Include',
            icon: 'fa fa-long-arrow-right',
            description: 'Relación de inclusión',
            style: { strokeDasharray: '5,5', markerEnd: 'arrow' }
          },
          {
            type: UML_RELATIONSHIP_TYPES.EXTEND,
            name: 'Extend',
            icon: 'fa fa-long-arrow-right',
            description: 'Relación de extensión',
            style: { strokeDasharray: '5,5', markerEnd: 'arrow' }
          },
          {
            type: UML_RELATIONSHIP_TYPES.INHERITANCE,
            name: 'Herencia',
            icon: 'fa fa-long-arrow-up',
            description: 'Herencia entre actores o casos',
            style: { strokeDasharray: 'none', markerEnd: 'triangle' }
          },
          // Relaciones de Cardinalidad para Casos de Uso
          {
            type: 'one-to-one',
            name: 'Uno a Uno',
            icon: 'fa fa-arrows-h',
            description: 'Relación 1:1 (uno a uno)',
            style: { strokeDasharray: 'none', markerEnd: 'arrow' },
            cardinality: { source: '1', target: '1' }
          },
          {
            type: 'one-to-many',
            name: 'Uno a Muchos',
            icon: 'fa fa-arrows-h',
            description: 'Relación 1:* (uno a muchos)',
            style: { strokeDasharray: 'none', markerEnd: 'arrow' },
            cardinality: { source: '1', target: '*' }
          },
          {
            type: 'many-to-one',
            name: 'Muchos a Uno',
            icon: 'fa fa-arrows-h',
            description: 'Relación *:1 (muchos a uno)',
            style: { strokeDasharray: 'none', markerEnd: 'arrow' },
            cardinality: { source: '*', target: '1' }
          },
          {
            type: 'many-to-many',
            name: 'Muchos a Muchos',
            icon: 'fa fa-arrows-h',
            description: 'Relación *:* (muchos a muchos)',
            style: { strokeDasharray: 'none', markerEnd: 'arrow' },
            cardinality: { source: '*', target: '*' }
          }
        ];
      
      default:
        return [
          {
            type: UML_RELATIONSHIP_TYPES.ASSOCIATION,
            name: 'Asociación',
            icon: 'fa fa-arrows-h',
            description: 'Relación general',
            style: { strokeDasharray: 'none', markerEnd: 'arrow' }
          },
          {
            type: UML_RELATIONSHIP_TYPES.DEPENDENCY,
            name: 'Dependencia',
            icon: 'fa fa-long-arrow-right',
            description: 'Relación de dependencia',
            style: { strokeDasharray: '5,5', markerEnd: 'arrow' }
          }
        ];
    }
  };

  const availableElements = getAvailableElements();
  const availableRelationships = getAvailableRelationships();

  // Filtrar elementos por término de búsqueda
  const filteredElements = availableElements.filter(element =>
    element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRelationships = availableRelationships.filter(relationship =>
    relationship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relationship.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Crear elemento UML
  const handleCreateElement = async (elementType) => {
    if (!currentDiagram) {
      alert('No hay diagrama seleccionado');
      return;
    }

    try {
      console.log('Creating UML element from sidebar:', elementType);
      const defaultData = getDefaultElementData(elementType);
      console.log('Default element data:', defaultData);
      
      const newElement = await createUMLElement(defaultData);
      console.log('Element created successfully:', newElement);
      
      // Force a small delay to ensure the element is rendered
      setTimeout(() => {
        console.log('Element should now be visible in canvas');
      }, 100);
      
    } catch (error) {
      console.error('Error al crear elemento UML:', error);
      alert('Error al crear elemento: ' + error.message);
    }
  };

  // Obtener datos por defecto para diferentes tipos de elementos
  const getDefaultElementData = (elementType) => {
    const baseData = {
      type: elementType,
      position: { x: 100, y: 100 },
      size: { width: 150, height: 100 },
      styles: {
        backgroundColor: '#FFFFFF',
        borderColor: '#000000',
        borderWidth: 1,
        borderRadius: 0
      }
    };

    switch (elementType) {
      case UML_ELEMENT_TYPES.CLASS:
        return {
          ...baseData,
          name: 'NewClass',
          size: { width: 180, height: 120 },
          attributes: [
            { name: 'attribute1', type: 'String', visibility: 'private' }
          ],
          operations: [
            { name: 'operation1', returnType: 'void', visibility: 'public', parameters: [] }
          ]
        };

      case UML_ELEMENT_TYPES.INTERFACE:
        return {
          ...baseData,
          name: 'INewInterface',
          stereotype: 'interface',
          size: { width: 160, height: 100 },
          methods: [
            { name: 'method1', returnType: 'void', parameters: [] }
          ]
        };

      case UML_ELEMENT_TYPES.ABSTRACT_CLASS:
        return {
          ...baseData,
          name: 'AbstractClass',
          isAbstract: true,
          size: { width: 180, height: 120 },
          attributes: [
            { name: 'attribute1', type: 'String', visibility: 'protected' }
          ],
          operations: [
            { name: 'abstractMethod', returnType: 'void', visibility: 'public', isAbstract: true, parameters: [] }
          ]
        };

      case UML_ELEMENT_TYPES.ENUM:
        return {
          ...baseData,
          name: 'NewEnum',
          stereotype: 'enumeration',
          size: { width: 120, height: 100 },
          attributes: [
            { name: 'VALUE1' },
            { name: 'VALUE2' },
            { name: 'VALUE3' }
          ]
        };

      case UML_ELEMENT_TYPES.PACKAGE:
        return {
          ...baseData,
          name: 'NewPackage',
          size: { width: 200, height: 150 },
          elements: []
        };

      case UML_ELEMENT_TYPES.COMPONENT:
        return {
          ...baseData,
          name: 'NewComponent',
          stereotype: 'component',
          size: { width: 140, height: 80 }
        };

      case UML_ELEMENT_TYPES.ACTOR:
        return {
          ...baseData,
          name: 'NewActor',
          size: { width: 80, height: 120 }
        };

      case UML_ELEMENT_TYPES.USE_CASE:
        return {
          ...baseData,
          name: 'New Use Case',
          size: { width: 140, height: 80 },
          styles: {
            ...baseData.styles,
            borderRadius: 40
          },
          description: 'Descripción del caso de uso'
        };

      case UML_ELEMENT_TYPES.NOTE:
        return {
          ...baseData,
          name: 'Nueva Nota',
          size: { width: 120, height: 80 },
          styles: {
            ...baseData.styles,
            backgroundColor: '#FFFFCC'
          },
          description: 'Contenido de la nota'
        };


      default:
        return baseData;
    }
  };

  // Activar modo conexión
  const handleActivateConnectionMode = (relationshipType) => {
    setConnectionMode(relationshipType);
  };

  return (
    <div className="uml-sidebar-container">
      {/* <div className="uml-sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <i className="fas fa-magic"></i>
          </div>
          <div className="brand-content">
            <h3 className="brand-title">ELEMENTOS DE UML</h3>
            <p className="brand-subtitle">Elementos y Relaciones</p>
          </div>
        </div>
        <button className="sidebar-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div> */}

      {/* Search and Navigation */}
      <div className="sidebar-search-section">
        <div className="search-container">
          <div className="search-icon">
            <i className="fas fa-search"></i>
          </div>
          <input
            type="text"
            placeholder="Buscar elementos UML..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="search-clear"
              onClick={() => setSearchTerm('')}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div className="navigation-tabs">
          <button
            className={`nav-tab ${activeTab === 'elements' ? 'active' : ''}`}
            onClick={() => setActiveTab('elements')}
          >
          
            <div className="tab-content">
              <span className="tab-title">Elementos</span>
              <span className="tab-count">{filteredElements.length}</span>
            </div>
          </button>
          <button
            className={`nav-tab ${activeTab === 'relationships' ? 'active' : ''}`}
            onClick={() => setActiveTab('relationships')}
          >
          
            <div className="tab-content">
              <span className="tab-title">Relaciones</span>
              <span className="tab-count">{filteredRelationships.length}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Diagram Type Indicator */}
      {/* <div className="diagram-indicator">
        <div className="indicator-icon">
          <i className="fas fa-diagram-project"></i>
        </div>
        <div className="indicator-content">
          <span className="indicator-label">Tipo de Diagrama</span>
          <span className="indicator-value">{diagramType}</span>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="sidebar-content">
        {activeTab === 'elements' && (
          <div className="elements-section">
            {/* <div className="section-header">
              <div className="section-icon">
                <i className="fas fa-cube"></i>
              </div>
              <div className="section-info">
                <h4 className="section-title">Elementos UML</h4>
                <p className="section-description">Arrastra elementos al canvas para crear</p>
              </div>
            </div> */}

            {filteredElements.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="fas fa-search"></i>
                </div>
                <h5 className="empty-title">No se encontraron elementos</h5>
                <p className="empty-description">Intenta con otros términos de búsqueda</p>
              </div>
            ) : (
              <div className="elements-grid">
                {filteredElements.map((element, index) => (
                  <div
                    key={index}
                    className="element-card"
                    onClick={() => handleCreateElement(element.type)}
                    title={element.description}
                  >
                    <div className="card-header">
                      <div className={`element-icon ${element.type}`}>
                        <i className={element.icon}></i>
                      </div>
                      <div className="element-badge">
                        <i className="fas fa-plus"></i>
                      </div>
                    </div>
                    <div className="card-content">
                      <h5 className="element-name">{element.name}</h5>
                      <p className="element-description">{element.description}</p>
                    </div>
                    <div className="card-footer">
                      <span className="element-type">{element.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'relationships' && (
          <div className="relationships-section">
            <div className="section-header">
              <div className="section-icon">
                <i className="fas fa-project-diagram"></i>
              </div>
              <div className="section-info">
                <h4 className="section-title">Relaciones UML</h4>
                <p className="section-description">Haz clic para activar modo conexión</p>
              </div>
            </div>

            {connectionMode && (
              <div className="connection-mode-banner">
                <div className="banner-content">
                  <div className="banner-icon">
                    <i className="fas fa-link"></i>
                  </div>
                  <div className="banner-text">
                    <span className="banner-title">Modo Conexión Activo</span>
                    <span className="banner-subtitle">{connectionMode}</span>
                  </div>
                  <button
                    className="banner-close"
                    onClick={() => setConnectionMode(null)}
                    title="Cancelar modo conexión"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            )}

            {filteredRelationships.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="fas fa-link"></i>
                </div>
                <h5 className="empty-title">No se encontraron relaciones</h5>
                <p className="empty-description">Intenta con otros términos de búsqueda</p>
              </div>
            ) : (
              <div className="relationships-grid">
                {filteredRelationships.map((relationship, index) => (
                  <div
                    key={index}
                    className={`relationship-card ${connectionMode === relationship.type ? 'active' : ''}`}
                    onClick={() => handleActivateConnectionMode(relationship.type)}
                    title={relationship.description}
                  >
                    <div className="card-header">
                      <div className={`relationship-icon ${relationship.type}`}>
                        <i className={relationship.icon}></i>
                      </div>
                      <div className="relationship-badge">
                        <i className="fas fa-arrow-right"></i>
                      </div>
                    </div>
                    <div className="card-content">
                      <h5 className="relationship-name">{relationship.name}</h5>
                      <p className="relationship-description">{relationship.description}</p>
                    </div>
                    <div className="card-footer">
                      <span className="relationship-type">{relationship.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer con información adicional */}
      {/* <div className="sidebar-footer">
        <div className="tips">
          <h4>Consejos:</h4>
          <ul>
            <li>Usa Ctrl+Click para seleccionar múltiples elementos</li>
            <li>Arrastra elementos para moverlos</li>
            <li>Usa los controles de esquina para redimensionar</li>
            <li>Configura propiedades en el panel derecho</li>
          </ul>
        </div>
      </div> */}
    </div>
  );
};

export default UMLSidebar;
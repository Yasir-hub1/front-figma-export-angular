// src/components/editor/ComponentLibrary.js
import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import './ComponentLibrary.css';

const ComponentLibrary = () => {
  const { createElement, project } = useEditor();
  const [activeCategory, setActiveCategory] = useState('Básicos');

  // Definición de los componentes disponibles
  const componentCategories = [
    {
      name: 'Básicos',
      components: [
        {
          type: 'container',
          name: 'Contenedor',
          icon: 'fa fa-square-o',
          defaultSize: { width: 200, height: 200 },
          defaultStyles: { backgroundColor: '#f5f5f5', borderRadius: 4 }
        },
        {
          type: 'text',
          name: 'Texto',
          icon: 'fa fa-font',
          content: 'Texto de ejemplo',
          defaultSize: { width: 150, height: 40 },
          defaultStyles: { color: '#333333', fontSize: 16, textAlign: 'center' }
        },
        {
          type: 'button',
          name: 'Botón',
          icon: 'fa fa-square',
          content: 'Botón',
          defaultSize: { width: 120, height: 40 },
          defaultStyles: { 
            backgroundColor: '#4285f4', 
            color: '#ffffff', 
            borderRadius: 4,
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }
        }
      ]
    },
    {
      name: 'Formularios',
      components: [
        {
          type: 'input',
          name: 'Campo de texto',
          icon: 'fa fa-pencil-square-o',
          content: 'Placeholder',
          defaultSize: { width: 200, height: 40 },
          defaultStyles: { borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: '8px' }
        },
        {
          type: 'checkbox',
          name: 'Casilla',
          icon: 'fa fa-check-square-o',
          content: 'Opción',
          defaultSize: { width: 120, height: 24 },
          defaultStyles: {}
        },
        {
          type: 'radio',
          name: 'Radio',
          icon: 'fa fa-dot-circle-o',
          content: 'Opción',
          defaultSize: { width: 120, height: 24 },
          defaultStyles: {}
        },
        {
          type: 'select',
          name: 'Selector',
          icon: 'fa fa-caret-square-o-down',
          content: 'Seleccionar',
          defaultSize: { width: 200, height: 40 },
          defaultStyles: { borderWidth: 1, borderColor: '#ddd', borderRadius: 4 }
        },
        {
          type: 'textarea',
          name: 'Área de texto',
          icon: 'fa fa-paragraph',
          content: 'Texto multilínea',
          defaultSize: { width: 200, height: 100 },
          defaultStyles: { borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: '8px' }
        }
      ]
    },
    {
      name: 'Navegación',
      components: [
        {
          type: 'navbar',
          name: 'Barra de navegación',
          icon: 'fa fa-bars',
          defaultSize: { width: 600, height: 60 },
          defaultStyles: { 
            backgroundColor: '#333333', 
            color: '#ffffff', 
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px'
          }
        },
        {
          type: 'link',
          name: 'Enlace',
          icon: 'fa fa-link',
          content: 'Enlace',
          defaultSize: { width: 80, height: 30 },
          defaultStyles: { 
            color: '#4285f4', 
            textDecoration: 'underline',
            display: 'flex',
            alignItems: 'center'
          }
        },
        {
          type: 'menu',
          name: 'Menú',
          icon: 'fa fa-list-ul',
          defaultSize: { width: 150, height: 200 },
          defaultStyles: { 
            backgroundColor: '#ffffff', 
            borderWidth: 1, 
            borderColor: '#ddd',
            borderRadius: 4,
            padding: '8px 0'
          }
        },
        {
          type: 'menuItem',
          name: 'Elemento de menú',
          icon: 'fa fa-minus',
          content: 'Elemento de menú',
          defaultSize: { width: 150, height: 40 },
          defaultStyles: { 
            padding: '10px 16px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center'
          }
        }
      ]
    },
    {
      name: 'Layouts',
      components: [
        {
          type: 'card',
          name: 'Tarjeta',
          icon: 'fa fa-credit-card',
          defaultSize: { width: 250, height: 300 },
          defaultStyles: { 
            backgroundColor: '#ffffff', 
            borderRadius: 8, 
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column'
          }
        },
        {
          type: 'hero',
          name: 'Hero',
          icon: 'fa fa-picture-o',
          content: 'Título Principal',
          defaultSize: { width: 600, height: 400 },
          defaultStyles: { 
            backgroundColor: '#f8f9fa', 
            color: '#333333',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 32,
            fontWeight: 'bold'
          }
        },
        {
          type: 'footer',
          name: 'Pie de página',
          icon: 'fa fa-angle-double-down',
          defaultSize: { width: 600, height: 100 },
          defaultStyles: { 
            backgroundColor: '#333333', 
            color: '#ffffff',
            padding: '20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }
        },
        {
          type: 'carousel',
          name: 'Carrusel',
          icon: 'fa fa-exchange',
          defaultSize: { width: 600, height: 300 },
          defaultStyles: { 
            backgroundColor: '#eeeeee', 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden'
          }
        }
      ]
    },
    {
      name: 'Multimedia',
      components: [
        {
          type: 'image',
          name: 'Imagen',
          icon: 'fa fa-picture-o',
          defaultSize: { width: 200, height: 150 },
          defaultStyles: { backgroundColor: '#eeeeee', borderRadius: 4 }
        },
        {
          type: 'icon',
          name: 'Ícono',
          icon: 'fa fa-star',
          content: 'fa fa-star',
          defaultSize: { width: 40, height: 40 },
          defaultStyles: { color: '#4285f4', fontSize: 24, textAlign: 'center' }
        },
        {
          type: 'video',
          name: 'Video',
          icon: 'fa fa-film',
          defaultSize: { width: 320, height: 240 },
          defaultStyles: { 
            backgroundColor: '#000000', 
            borderRadius: 4,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }
        },
        {
          type: 'avatar',
          name: 'Avatar',
          icon: 'fa fa-user-circle',
          defaultSize: { width: 50, height: 50 },
          defaultStyles: { 
            backgroundColor: '#4285f4', 
            borderRadius: '50%',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 20
          }
        }
      ]
    },
    {
      name: 'Informativo',
      components: [
        {
          type: 'alert',
          name: 'Alerta',
          icon: 'fa fa-exclamation-triangle',
          content: 'Mensaje de alerta',
          defaultSize: { width: 300, height: 60 },
          defaultStyles: { 
            backgroundColor: '#f8d7da', 
            color: '#721c24',
            borderWidth: 1,
            borderColor: '#f5c6cb',
            borderRadius: 4,
            padding: '12px',
            display: 'flex',
            alignItems: 'center'
          }
        },
        {
          type: 'badge',
          name: 'Insignia',
          icon: 'fa fa-certificate',
          content: 'Nuevo',
          defaultSize: { width: 60, height: 24 },
          defaultStyles: { 
            backgroundColor: '#4285f4', 
            color: '#ffffff',
            borderRadius: 12,
            padding: '0 8px',
            fontSize: 12,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }
        },
        {
          type: 'tooltip',
          name: 'Tooltip',
          icon: 'fa fa-comment',
          content: 'Información adicional',
          defaultSize: { width: 150, height: 40 },
          defaultStyles: { 
            backgroundColor: '#333333', 
            color: '#ffffff',
            borderRadius: 4,
            padding: '8px',
            fontSize: 12,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }
        },
        {
          type: 'progress',
          name: 'Barra de progreso',
          icon: 'fa fa-tasks',
          defaultSize: { width: 300, height: 20 },
          defaultStyles: { 
            backgroundColor: '#e9ecef', 
            borderRadius: 10,
            overflow: 'hidden',
            position: 'relative'
          }
        }
      ]
    }
  ];


  // Manejar la creación de un nuevo componente
  const handleCreateComponent = async (component) => {
    try {
      if (!project) {
        console.error('No hay un proyecto activo');
        return;
      }
      // Calcular posición centrada en el canvas
      const position = {
        x: (project.canvas.width / 2) - ((component.defaultSize?.width || 100) / 2),
        y: (project.canvas.height / 2) - ((component.defaultSize?.height || 100) / 2)
      };
      
      console.log('Creando componente:', component.type, 'en posición:', position);
      
      // Crear el elemento con sus propiedades predeterminadas
      await createElement({
        type: component.type,
        name: component.name,
        content: component.content || '',
        position,
        size: component.defaultSize || { width: 100, height: 100 },
        styles: component.defaultStyles || {}
      });
    } catch (error) {
      console.error('Error al crear componente:', error);
      // Mostrar el error al usuario
      alert(`Error al crear componente: ${error.message || 'Error desconocido'}`);
    }
  };

  return (
    <div className="component-library">
      <div className="component-tabs">
        {componentCategories.map((category, index) => (
          <div 
            key={index} 
            className={`component-tab ${activeCategory === category.name ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.name)}
          >
            {category.name}
          </div>
        ))}
      </div>

      <div className="component-content">
        {componentCategories.map((category, index) => (
          <div 
            key={index} 
            className={`component-category ${activeCategory === category.name ? 'visible' : 'hidden'}`}
          >
            <h4 className="category-title">{category.name}</h4>
            
            <div className="component-grid">
              {category.components.map((component, compIndex) => (
                <div 
                  key={compIndex} 
                  className="component-item"
                  onClick={() => handleCreateComponent(component)}
                >
                  <div className="component-icon">
                    <i className={component.icon}></i>
                  </div>
                  <div className="component-name">{component.name}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComponentLibrary;
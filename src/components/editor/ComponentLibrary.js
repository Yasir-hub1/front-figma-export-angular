// src/components/editor/ComponentLibrary.js
import React from 'react';
import { useEditor } from '../../context/EditorContext';
import './ComponentLibrary.css';

const ComponentLibrary = () => {
  const { createElement, project } = useEditor();
  
  // Definición de componentes Flutter
  const componentCategories = [
    {
      name: 'Básicos Flutter',
      components: [
        {
          type: 'container',
          name: 'Container',
          icon: 'fa fa-square-o',
          defaultSize: { width: 150, height: 150 },
          defaultStyles: { backgroundColor: '#f5f5f5', borderRadius: 4 },
          flutterWidget: 'Container'
        },
        {
          type: 'text',
          name: 'Text',
          icon: 'fa fa-font',
          content: 'Text de ejemplo',
          defaultSize: { width: 150, height: 40 },
          defaultStyles: { color: '#333333', fontSize: 16, textAlign: 'center' },
          flutterWidget: 'Text'
        },
        {
          type: 'elevatedButton',
          name: 'ElevatedButton',
          icon: 'fa fa-square',
          content: 'Button',
          defaultSize: { width: 120, height: 40 },
          defaultStyles: { 
            backgroundColor: '#2196F3', 
            color: '#ffffff', 
            borderRadius: 4,
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          },
          flutterWidget: 'ElevatedButton'
        },
        {
          type: 'outlinedButton',
          name: 'OutlinedButton',
          icon: 'fa fa-square-o',
          content: 'Button',
          defaultSize: { width: 120, height: 40 },
          defaultStyles: { 
            backgroundColor: 'transparent', 
            borderColor: '#2196F3',
            color: '#2196F3', 
            borderWidth: 1,
            borderRadius: 4,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          },
          flutterWidget: 'OutlinedButton'
        },
        {
          type: 'textButton',
          name: 'TextButton',
          icon: 'fa fa-font',
          content: 'Button',
          defaultSize: { width: 100, height: 40 },
          defaultStyles: { 
            backgroundColor: 'transparent', 
            color: '#2196F3',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          },
          flutterWidget: 'TextButton'
        }
      ]
    },
    {
      name: 'Layout Flutter',
      components: [
        {
          type: 'row',
          name: 'Row',
          icon: 'fa fa-ellipsis-h',
          defaultSize: { width: 300, height: 60 },
          defaultStyles: { 
            display: 'flex', 
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(200, 200, 200, 0.2)'
          },
          flutterWidget: 'Row'
        },
        {
          type: 'column',
          name: 'Column',
          icon: 'fa fa-ellipsis-v',
          defaultSize: { width: 150, height: 200 },
          defaultStyles: { 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(200, 200, 200, 0.2)'
          },
          flutterWidget: 'Column'
        },
        {
          type: 'stack',
          name: 'Stack',
          icon: 'fa fa-clone',
          defaultSize: { width: 150, height: 150 },
          defaultStyles: { 
            position: 'relative',
            backgroundColor: 'rgba(200, 200, 200, 0.2)'
          },
          flutterWidget: 'Stack'
        },
        {
          type: 'expanded',
          name: 'Expanded',
          icon: 'fa fa-arrows-alt-h',
          defaultSize: { width: 200, height: 80 },
          defaultStyles: { 
            flex: 1,
            backgroundColor: 'rgba(33, 150, 243, 0.2)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          },
          flutterWidget: 'Expanded'
        }
      ]
    },
    {
      name: 'Material Components',
      components: [
        {
          type: 'appBar',
          name: 'AppBar',
          icon: 'fa fa-window-maximize',
          content: 'AppBar',
          defaultSize: { width: project?.canvas?.width || 360, height: 56 },
          defaultStyles: { 
            backgroundColor: '#2196F3', 
            color: '#ffffff',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            fontWeight: 'bold'
          },
          flutterWidget: 'AppBar'
        },
        {
          type: 'floatingActionButton',
          name: 'FloatingActionButton',
          icon: 'fa fa-plus-circle',
          defaultSize: { width: 56, height: 56 },
          defaultStyles: { 
            backgroundColor: '#2196F3', 
            color: '#ffffff',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 3px 5px rgba(0,0,0,0.3)'
          },
          flutterWidget: 'FloatingActionButton'
        },
        {
          type: 'card',
          name: 'Card',
          icon: 'fa fa-credit-card',
          defaultSize: { width: 200, height: 200 },
          defaultStyles: { 
            backgroundColor: '#ffffff', 
            borderRadius: 8, 
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            padding: '12px'
          },
          flutterWidget: 'Card'
        },
        {
          type: 'divider',
          name: 'Divider',
          icon: 'fa fa-minus',
          defaultSize: { width: 200, height: 2 }, // Asegurarse de que la altura sea pequeña pero visible
          defaultStyles: { 
            backgroundColor: '#E0E0E0',
            opacity: 0.7
          },
          flutterWidget: 'Divider'
        }
      ]
    },
    {
      name: 'Inputs & Forms',
      components: [
        {
          type: 'textField',
          name: 'TextField',
          icon: 'fa fa-pencil-square-o',
          content: 'Hint text',
          defaultSize: { width: 200, height: 56 },
          defaultStyles: { 
            borderWidth: 1, 
            borderColor: '#BDBDBD', 
            borderRadius: 4,
            padding: '8px 12px'
          },
          flutterWidget: 'TextField'
        },
        {
          type: 'checkbox',
          name: 'Checkbox',
          icon: 'fa fa-check-square-o',
          defaultSize: { width: 24, height: 24 },
          defaultStyles: {
            borderWidth: 1,
            borderColor: '#2196F3',
            borderRadius: 2
          },
          flutterWidget: 'Checkbox'
        },
        {
          type: 'switch',
          name: 'Switch',
          icon: 'fa fa-toggle-on',
          defaultSize: { width: 50, height: 30 },
          defaultStyles: {
            backgroundColor: '#BDBDBD',
            borderRadius: 15
          },
          flutterWidget: 'Switch'
        },
        {
          type: 'slider',
          name: 'Slider',
          icon: 'fa fa-sliders',
          defaultSize: { width: 200, height: 24 },
          defaultStyles: {},
          flutterWidget: 'Slider'
        }
      ]
    },
    {
      name: 'Navegación',
      components: [
        {
          type: 'bottomNavigationBar',
          name: 'BottomNavigationBar',
          icon: 'fa fa-ellipsis-h',
          defaultSize: { width: project?.canvas?.width || 360, height: 56 },
          defaultStyles: { 
            backgroundColor: '#FFFFFF', 
            borderTopWidth: 1,
            borderColor: '#E0E0E0',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center'
          },
          flutterWidget: 'BottomNavigationBar'
        },
        {
          type: 'tabBar',
          name: 'TabBar',
          icon: 'fa fa-folder',
          defaultSize: { width: project?.canvas?.width || 360, height: 48 },
          defaultStyles: { 
            backgroundColor: '#2196F3', 
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center'
          },
          flutterWidget: 'TabBar'
        },
        {
          type: 'drawer',
          name: 'Drawer',
          icon: 'fa fa-bars',
          defaultSize: { width: 250, height: project?.canvas?.height || 640 },
          defaultStyles: { 
            backgroundColor: '#FFFFFF', 
            padding: '16px',
            boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
          },
          flutterWidget: 'Drawer'
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
      
      // Crear el elemento con sus propiedades predeterminadas y el widget de Flutter
      await createElement({
        type: component.type,
        name: component.name,
        content: component.content || '',
        position,
        size: component.defaultSize || { width: 100, height: 100 },
        styles: component.defaultStyles || {},
        flutterWidget: component.flutterWidget || component.type
      });
    } catch (error) {
      console.error('Error al crear componente:', error);
      alert(`Error al crear componente: ${error.message || 'Error desconocido'}`);
    }
  };

  return (
    <div className="component-library">
      {componentCategories.map((category, index) => (
        <div key={index} className="component-category">
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
  );
};

export default ComponentLibrary;
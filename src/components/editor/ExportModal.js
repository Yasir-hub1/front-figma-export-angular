// src/components/editor/ExportModal.js - CORREGIDO
import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import './ExportModal.css';

const ExportModal = () => {
  const { exportModalOpen, exportContent, setExportModalOpen } = useEditor();
  const [activeTab, setActiveTab] = useState('screen');
  
  if (!exportModalOpen || !exportContent) return null;
  
  // CORRECCIÓN: Usar la nueva estructura de respuesta del backend
  const { 
    widget,        // Solo el widget (sin MaterialApp)
    screen,        // Pantalla completa con MaterialApp
    pubspec,       // pubspec.yaml
    readme,        // README.md
    fullCode,      // Código completo (main.dart)
    screenName,    // Nombre de la pantalla
    projectName,   // Nombre del proyecto
    elementsCount, // Número de elementos
    canvasSize     // Tamaño del canvas
  } = exportContent;

  // Función para copiar el código
  const copyToClipboard = (text) => {
    if (!text) {
      alert('No hay contenido para copiar');
      return;
    }
    
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Código copiado al portapapeles');
      })
      .catch(err => {
        console.error('Error al copiar: ', err);
        alert('Error al copiar el código');
      });
  };

  // Función para descargar el código como archivo
  const downloadFile = (content, filename) => {
    if (!content) {
      alert('No hay contenido para descargar');
      return;
    }
    
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Función para descargar todos los archivos
  const downloadAllFiles = () => {
    // Descargar main.dart (aplicación completa)
    if (screen || fullCode) {
      downloadFile(screen || fullCode, 'main.dart');
    }
    
    // Descargar widget por separado
    if (widget) {
      downloadFile(widget, `${screenName || 'screen'}_widget.dart`);
    }
    
    // Descargar pubspec.yaml
    if (pubspec) {
      downloadFile(pubspec, 'pubspec.yaml');
    }
    
    // Descargar README.md
    if (readme) {
      downloadFile(readme, 'README.md');
    }
  };

  // Función para obtener el contenido según la pestaña activa
  const getActiveTabContent = () => {
    switch (activeTab) {
      case 'screen':
        return screen || fullCode || 'No hay código de pantalla disponible';
      case 'widget':
        return widget || 'No hay código de widget disponible';
      case 'pubspec':
        return pubspec || 'No hay archivo pubspec disponible';
      case 'readme':
        return readme || 'No hay README disponible';
      default:
        return 'Contenido no disponible';
    }
  };

  // Función para obtener el nombre del archivo según la pestaña activa
  const getActiveTabFilename = () => {
    switch (activeTab) {
      case 'screen':
        return 'main.dart';
      case 'widget':
        return `${screenName || 'screen'}_widget.dart`;
      case 'pubspec':
        return 'pubspec.yaml';
      case 'readme':
        return 'README.md';
      default:
        return 'file.txt';
    }
  };

  return (
    <div className="export-modal-overlay">
      <div className="export-modal">
        <div className="export-modal-header">
          <div className="export-title">
            <h2>Exportar a Flutter/Dart</h2>
            <div className="export-info">
              <span className="screen-name">{screenName || 'Pantalla'}</span>
              {projectName && <span className="project-name">({projectName})</span>}
              {elementsCount !== undefined && (
                <span className="elements-count">{elementsCount} elementos</span>
              )}
              {canvasSize && (
                <span className="canvas-size">{canvasSize.width}×{canvasSize.height}</span>
              )}
            </div>
          </div>
          <button 
            className="close-button" 
            onClick={() => setExportModalOpen(false)}
          >
            &times;
          </button>
        </div>
        
        <div className="export-tabs">
          <button 
            className={`tab-button ${activeTab === 'screen' ? 'active' : ''}`}
            onClick={() => setActiveTab('screen')}
            title="Aplicación completa con MaterialApp y Scaffold"
          >
            <i className="fab fa-flutter"></i>
            Aplicación Completa
          </button>
          <button 
            className={`tab-button ${activeTab === 'widget' ? 'active' : ''}`}
            onClick={() => setActiveTab('widget')}
            title="Solo el widget para usar como componente"
          >
            <i className="fas fa-cube"></i>
            Widget Componente
          </button>
          <button 
            className={`tab-button ${activeTab === 'pubspec' ? 'active' : ''}`}
            onClick={() => setActiveTab('pubspec')}
            title="Archivo de configuración del proyecto"
          >
            <i className="fas fa-cog"></i>
            pubspec.yaml
          </button>
          <button 
            className={`tab-button ${activeTab === 'readme' ? 'active' : ''}`}
            onClick={() => setActiveTab('readme')}
            title="Documentación del proyecto"
          >
            <i className="fas fa-book"></i>
            README.md
          </button>
        </div>
        
        <div className="export-content">
          <div className="code-header">
            <div className="file-info">
              <i className="fas fa-file-code"></i>
              <span className="filename">{getActiveTabFilename()}</span>
              <span className="file-size">
                {getActiveTabContent().length} caracteres
              </span>
            </div>
            <div className="code-actions">
              <button 
                className="action-button-small"
                onClick={() => copyToClipboard(getActiveTabContent())}
                title="Copiar código"
              >
                <i className="fas fa-copy"></i>
              </button>
              <button 
                className="action-button-small"
                onClick={() => downloadFile(getActiveTabContent(), getActiveTabFilename())}
                title="Descargar archivo"
              >
                <i className="fas fa-download"></i>
              </button>
            </div>
          </div>
          
          <pre className="code-preview">
            <code className="dart-code">
              {getActiveTabContent()}
            </code>
          </pre>
        </div>
        
        <div className="export-actions">
          <button 
            className="action-button secondary"
            onClick={() => copyToClipboard(getActiveTabContent())}
          >
            <i className="fas fa-copy"></i>
            Copiar Código
          </button>
          
          <button 
            className="action-button secondary"
            onClick={() => downloadFile(getActiveTabContent(), getActiveTabFilename())}
          >
            <i className="fas fa-download"></i>
            Descargar Archivo
          </button>
          
          <button 
            className="action-button primary"
            onClick={downloadAllFiles}
          >
            <i className="fas fa-archive"></i>
            Descargar Todo
          </button>
        </div>
        

      </div>
    </div>
  );
};

export default ExportModal;
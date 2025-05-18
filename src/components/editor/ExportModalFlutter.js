// src/components/editor/ExportModalFlutter.js
import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import './ExportModal.css';

const ExportModalFlutter = () => {
  const { exportModalOpen, exportContent, setExportModalOpen } = useEditor();
  const [activeTab, setActiveTab] = useState('dart');
  
  if (!exportModalOpen || !exportContent) return null;
  
  const { dart, pubspec, readme } = exportContent;

  // Función para copiar el código
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Código copiado al portapapeles');
      })
      .catch(err => {
        console.error('Error al copiar: ', err);
      });
  };

  // Función para descargar el código como archivo
  const downloadFile = (content, filename) => {
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Función para descargar todos los archivos como ZIP
  const downloadAllFiles = () => {
    // Por simplicidad, descargamos cada archivo individualmente
    downloadFile(dart, 'main.dart');
    downloadFile(pubspec, 'pubspec.yaml');
    downloadFile(readme, 'README.md');
  };

  return (
    <div className="export-modal-overlay">
      <div className="export-modal">
        <div className="export-modal-header">
          <h2>Exportar a Flutter/Dart</h2>
          <button 
            className="close-button" 
            onClick={() => setExportModalOpen(false)}
          >
            &times;
          </button>
        </div>
        
        <div className="export-tabs">
          <button 
            className={`tab-button ${activeTab === 'dart' ? 'active' : ''}`}
            onClick={() => setActiveTab('dart')}
          >
            main.dart
          </button>
          <button 
            className={`tab-button ${activeTab === 'pubspec' ? 'active' : ''}`}
            onClick={() => setActiveTab('pubspec')}
          >
            pubspec.yaml
          </button>
          <button 
            className={`tab-button ${activeTab === 'readme' ? 'active' : ''}`}
            onClick={() => setActiveTab('readme')}
          >
            README.md
          </button>
        </div>
        
        <div className="export-content">
          <pre className="code-preview">
            {activeTab === 'dart' && dart}
            {activeTab === 'pubspec' && pubspec}
            {activeTab === 'readme' && readme}
          </pre>
        </div>
        
        <div className="export-actions">
          <button 
            className="action-button"
            onClick={() => copyToClipboard(
              activeTab === 'dart' ? dart : 
              activeTab === 'pubspec' ? pubspec : readme
            )}
          >
            Copiar Código
          </button>
          
          <button 
            className="action-button"
            onClick={() => downloadFile(
              activeTab === 'dart' ? dart : 
              activeTab === 'pubspec' ? pubspec : readme,
              activeTab === 'dart' ? 'main.dart' : 
              activeTab === 'pubspec' ? 'pubspec.yaml' : 'README.md'
            )}
          >
            Descargar Archivo
          </button>
          
          <button 
            className="action-button primary"
            onClick={downloadAllFiles}
          >
            Descargar Todo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModalFlutter;
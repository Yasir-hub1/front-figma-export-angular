// src/components/editor/ExportModal.js
import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import './ExportModal.css';

const ExportModal = () => {
  const { exportModalOpen, exportContent, setExportModalOpen } = useEditor();
  const [activeTab, setActiveTab] = useState('html');
  
  if (!exportModalOpen || !exportContent) return null;
  
  const { html, css, ts } = exportContent;

  // Función para copiar el código
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Muestra alguna notificación de éxito
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
    // Aquí se podría implementar la descarga como ZIP usando una librería como JSZip
    // Por simplicidad, descargamos cada archivo individualmente
    downloadFile(html, 'component.component.html');
    downloadFile(css, 'component.component.css');
    downloadFile(ts, 'component.component.ts');
  };

  return (
    <div className="export-modal-overlay">
      <div className="export-modal">
        <div className="export-modal-header">
          <h2>Exportar a Angular</h2>
          <button 
            className="close-button" 
            onClick={() => setExportModalOpen(false)}
          >
            &times;
          </button>
        </div>
        
        <div className="export-tabs">
          <button 
            className={`tab-button ${activeTab === 'html' ? 'active' : ''}`}
            onClick={() => setActiveTab('html')}
          >
            HTML
          </button>
          <button 
            className={`tab-button ${activeTab === 'css' ? 'active' : ''}`}
            onClick={() => setActiveTab('css')}
          >
            CSS
          </button>
          <button 
            className={`tab-button ${activeTab === 'ts' ? 'active' : ''}`}
            onClick={() => setActiveTab('ts')}
          >
            TypeScript
          </button>
        </div>
        
        <div className="export-content">
          <pre className="code-preview">
            {activeTab === 'html' && html}
            {activeTab === 'css' && css}
            {activeTab === 'ts' && ts}
          </pre>
        </div>
        
        <div className="export-actions">
          <button 
            className="action-button"
            onClick={() => copyToClipboard(
              activeTab === 'html' ? html : 
              activeTab === 'css' ? css : ts
            )}
          >
            Copiar Código
          </button>
          
          <button 
            className="action-button"
            onClick={() => downloadFile(
              activeTab === 'html' ? html : 
              activeTab === 'css' ? css : ts,
              activeTab === 'html' ? 'component.component.html' : 
              activeTab === 'css' ? 'component.component.css' : 'component.component.ts'
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

export default ExportModal;
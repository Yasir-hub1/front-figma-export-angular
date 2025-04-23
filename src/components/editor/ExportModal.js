// src/components/editor/ExportModal.js
import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import './ExportModal.css';

const ExportModal = () => {
  const { exportModalOpen, exportContent, setExportModalOpen } = useEditor();
  const [activeTab, setActiveTab] = useState('html');
  const [copyStatus, setCopyStatus] = useState(null);
  
  if (!exportModalOpen || !exportContent) return null;
  
  const { html, css, ts, module } = exportContent;

  // Función para copiar el código
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Mostrar notificación de éxito
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus(null), 2000);
      })
      .catch(err => {
        console.error('Error al copiar: ', err);
        setCopyStatus('error');
        setTimeout(() => setCopyStatus(null), 2000);
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

  // Obtener el contenido actual según la pestaña activa
  const getCurrentContent = () => {
    switch(activeTab) {
      case 'html': return html;
      case 'css': return css;
      case 'ts': return ts;
      case 'module': return module;
      default: return html;
    }
  };

  // Obtener el nombre de archivo actual según la pestaña activa
  const getCurrentFilename = () => {
    switch(activeTab) {
      case 'html': return 'component.component.html';
      case 'css': return 'component.component.css';
      case 'ts': return 'component.component.ts';
      case 'module': return 'component.module.ts';
      default: return 'component.component.html';
    }
  };

  return (
    <div className="export-modal-overlay">
      <div className="export-modal">
        <div className="export-modal-header">
          <h2>Exportar a Angular</h2>
          <button 
            className="close-button" 
            onClick={() => setExportModalOpen(false)}
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>
        
        <div className="export-tabs">
          <button 
            className={`tab-button ${activeTab === 'html' ? 'active' : ''}`}
            onClick={() => setActiveTab('html')}
          >
            <i className="fa fa-html5"></i> HTML
          </button>
          <button 
            className={`tab-button ${activeTab === 'css' ? 'active' : ''}`}
            onClick={() => setActiveTab('css')}
          >
            <i className="fa fa-css3"></i> CSS
          </button>
          <button 
            className={`tab-button ${activeTab === 'ts' ? 'active' : ''}`}
            onClick={() => setActiveTab('ts')}
          >
            <i className="fa fa-code"></i> TypeScript
          </button>
          <button 
            className={`tab-button ${activeTab === 'module' ? 'active' : ''}`}
            onClick={() => setActiveTab('module')}
          >
            <i className="fa fa-cubes"></i> Módulo
          </button>
        </div>
        
        <div className="export-content">
          <div className="code-header">
            <span className="code-filename">{getCurrentFilename()}</span>
            <div className="code-actions">
              <button 
                className="code-action-button"
                onClick={() => copyToClipboard(getCurrentContent())}
                title="Copiar código"
              >
                <i className="fa fa-copy"></i>
              </button>
              <button 
                className="code-action-button"
                onClick={() => downloadFile(getCurrentContent(), getCurrentFilename())}
                title="Descargar archivo"
              >
                <i className="fa fa-download"></i>
              </button>
            </div>
          </div>
          <pre className="code-preview">
            <code>{getCurrentContent()}</code>
          </pre>
        </div>
        
        {copyStatus === 'copied' && (
          <div className="copy-notification success">
            <i className="fa fa-check-circle"></i> Código copiado al portapapeles
          </div>
        )}
        
        {copyStatus === 'error' && (
          <div className="copy-notification error">
            <i className="fa fa-times-circle"></i> Error al copiar el código
          </div>
        )}
        
        <div className="export-actions">
          <div className="export-info">
            <p>Componente Angular listo para usar</p>
          </div>
          <button 
            className="download-all-button"
            onClick={downloadAllFiles}
          >
            <i className="fa fa-download"></i> Descargar todos los archivos
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
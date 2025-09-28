// src/components/editor/ShareProjectModal.js - Modal para compartir proyecto colaborativo
import React, { useState, useEffect } from 'react';
import { useUML } from '../../context/UMLcontext';
import './ShareProjectModal.css';

const ShareProjectModal = ({ isOpen, onClose }) => {
  const { project, currentDiagram, generateShareLink, shareSettings, updateShareSettings } = useUML();
  
  const [shareLink, setShareLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [permissions] = useState({
    canEdit: true,
    canCreateDiagrams: true,
    canDeleteDiagrams: true,
    canInviteOthers: true,
    canExport: true
  });
  const [expirationDays, setExpirationDays] = useState(30);
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      loadShareSettings();
    }
  }, [isOpen, project]);

  const loadShareSettings = async () => {
    try {
      if (shareSettings) {
        setExpirationDays(shareSettings.expirationDays || 30);
        setIsPublic(shareSettings.isPublic || false);
        if (shareSettings.shareLink) {
          setShareLink(shareSettings.shareLink);
        }
      }
    } catch (error) {
      console.error('Error cargando configuración de compartir:', error);
    }
  };

  const handleGenerateLink = async () => {
    if (!project) return;
    
    setIsGenerating(true);
    try {
      const settings = {
        permissions,
        expirationDays,
        isPublic,
        projectId: project._id,
        diagramId: currentDiagram?._id
      };
      
      const link = await generateShareLink(settings);
      setShareLink(link);
      setCopied(false);
    } catch (error) {
      console.error('Error generando enlace de compartir:', error);
      alert('Error al generar enlace de compartir: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Función mejorada para copiar enlace con fallbacks
  const handleCopyLink = async () => {
    try {
      // Método 1: Clipboard API (moderno pero requiere HTTPS)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      // Método 2: Fallback usando selección de texto (funciona en HTTP)
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Error copiando con execCommand:', err);
        // Método 3: Fallback final - mostrar el enlace seleccionado para copiado manual
        showManualCopyDialog();
      }
      
      document.body.removeChild(textArea);
      
    } catch (error) {
      console.error('Error copiando enlace:', error);
      showManualCopyDialog();
    }
  };

  // Mostrar dialog para copiado manual
  const showManualCopyDialog = () => {
    const message = `No se pudo copiar automáticamente. Por favor, copia este enlace manualmente:\n\n${shareLink}`;
    
    // Crear un modal simple para mostrar el enlace
    const modalDiv = document.createElement('div');
    modalDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 90%;
      max-height: 90%;
      overflow: auto;
    `;

    const textArea = document.createElement('textarea');
    textArea.value = shareLink;
    textArea.style.cssText = `
      width: 100%;
      height: 100px;
      margin: 10px 0;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: monospace;
    `;
    textArea.readOnly = true;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Cerrar';
    closeBtn.style.cssText = `
      margin-top: 10px;
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;

    closeBtn.onclick = () => document.body.removeChild(modalDiv);

    contentDiv.appendChild(document.createTextNode('Copia este enlace:'));
    contentDiv.appendChild(textArea);
    contentDiv.appendChild(closeBtn);
    modalDiv.appendChild(contentDiv);
    document.body.appendChild(modalDiv);

    // Seleccionar el texto automáticamente
    textArea.select();
  };

  const handleSaveSettings = async () => {
    try {
      await updateShareSettings({
        permissions,
        expirationDays,
        isPublic
      });
      alert('Configuración de compartir guardada');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar configuración');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="share-project-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className="fas fa-share-alt"></i>
            Compartir Proyecto
          </h2>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-content">
          <div className="project-info">
            <h3>{project?.name}</h3>
            <p>Diagrama actual: {currentDiagram?.name || 'Ninguno'}</p>
          </div>

          <div className="share-section">
            <h4>Configuración de Compartir</h4>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span>Hacer proyecto público (cualquiera con el enlace puede acceder)</span>
              </label>
            </div>

            <div className="form-group">
              <label>
                Días de expiración:
                <select 
                  value={expirationDays} 
                  onChange={(e) => setExpirationDays(Number(e.target.value))}
                >
                  <option value={1}>1 día</option>
                  <option value={7}>7 días</option>
                  <option value={30}>30 días</option>
                  <option value={90}>90 días</option>
                  <option value={0}>Nunca expira</option>
                </select>
              </label>
            </div>
          </div>

          <div className="link-section">
            <h4>Enlace de Compartir</h4>
            
            {!shareLink ? (
              <button 
                className="generate-button"
                onClick={handleGenerateLink}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <i className="fa fa-spinner fa-spin"></i>
                    Generando enlace...
                  </>
                ) : (
                  <>
                    <i className="fas fa-link"></i>
                    Generar Enlace de Compartir
                  </>
                )}
              </button>
            ) : (
              <div className="link-container">
                <div className="link-input-group">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="share-link-input"
                    placeholder="Enlace de compartir..."
                    onClick={(e) => e.target.select()} // Seleccionar todo al hacer clic
                  />
                  <button 
                    className="copy-button"
                    onClick={handleCopyLink}
                    title="Copiar enlace"
                  >
                    {copied ? (
                      <>
                        <i className="fas fa-check"></i>
                        ¡Copiado!
                      </>
                    ) : (
                      <>
                        <i className="fas fa-copy"></i>
                        Copiar
                      </>
                    )}
                  </button>
                </div>
                
                <div className="link-actions">
                  <button 
                    className="regenerate-button"
                    onClick={handleGenerateLink}
                    disabled={isGenerating}
                  >
                    <i className="fas fa-refresh"></i>
                    Regenerar
                  </button>
                  
                  <button 
                    className="save-settings-button"
                    onClick={handleSaveSettings}
                  >
                    <i className="fas fa-save"></i>
                    Guardar Configuración
                  </button>
                </div>

                {/* Información adicional sobre el enlace */}
                <div className="link-info">
                  <small>
                    <i className="fas fa-info-circle"></i>
                    {isPublic ? 'Enlace público' : 'Enlace privado'} • 
                    {expirationDays === 0 ? 'Sin expiración' : `Expira en ${expirationDays} días`}
                  </small>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareProjectModal;
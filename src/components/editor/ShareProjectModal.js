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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando enlace:', error);
      alert('Error al copiar enlace');
    }
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
          <button className="close-button" onClick={onClose} title="Cerrar modal">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-content">
          <div className="project-info">
            <h3>{project?.name}</h3>
            <p>Diagrama actual: {currentDiagram?.name || 'Ninguno'}</p>
          </div>

          {/* <div className="share-section">
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
              </label>
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
            </div>
          </div> */}


          <div className="link-section">
            <h4>Enlace de Compartir</h4>
            
            {!shareLink ? (
              <button 
                className="generate-button"
                onClick={handleGenerateLink}
                disabled={isGenerating}
                title="Generar enlace de compartir"
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
                    title="Enlace de compartir generado"
                  />
                  <button 
                    className="copy-button"
                    onClick={handleCopyLink}
                    title="Copiar enlace al portapapeles"
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
                    title="Generar nuevo enlace"
                  >
                    <i className="fas fa-refresh"></i>
                    Regenerar
                  </button>
                  
                  <button 
                    className="save-settings-button"
                    onClick={handleSaveSettings}
                    title="Guardar configuración actual"
                  >
                    <i className="fas fa-save"></i>
                    Guardar Configuración
                  </button>
                </div>
              </div>
            )}
          </div>

       
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose} title="Cerrar modal">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareProjectModal;
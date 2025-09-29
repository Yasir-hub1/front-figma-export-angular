import React, { useState, useEffect } from 'react';
import { useUML, UML_VISIBILITY } from '../../context/UMLcontext';
import './UMLProperties.css';	
const UMLProperties = ({ onClose, selectedElement, selectedConnection }) => {
  const { 
    updateUMLElement, 
    deleteUMLElement, 
    duplicateUMLElement, 
    updateConnection,
    deleteConnection,
    selectElement,
    selectConnection,
    notifyElementInteraction,
    endElementInteraction,
    currentDiagram,
    connections
  } = useUML();
  
  // Estados para elementos
  const [name, setName] = useState('');
  const [stereotype, setStereotype] = useState('');
  const [isAbstract, setIsAbstract] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [description, setDescription] = useState('');
  const [attributes, setAttributes] = useState([]);
  const [operations, setOperations] = useState([]);
  
  // Estados para conexiones
  const [connectionType, setConnectionType] = useState('');
  const [connectionLabel, setConnectionLabel] = useState('');
  const [sourceMultiplicity, setSourceMultiplicity] = useState('');
  const [targetMultiplicity, setTargetMultiplicity] = useState('');
  
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  
  // Obtener conexiones relacionadas con el elemento seleccionado
  const getElementConnections = () => {
    if (!selectedElement || !connections) return [];
    
    return connections.filter(conn => 
      conn.sourceElementId === selectedElement._id || 
      conn.targetElementId === selectedElement._id
    );
  };

  // Actualizar estados cuando cambia la selección
  useEffect(() => {
    if (selectedElement) {
      // Get data from multiple possible sources
      const elementName = selectedElement.name || '';
      const elementStereotype = selectedElement.stereotype || selectedElement.properties?.stereotype || '';
      const elementIsAbstract = selectedElement.isAbstract || selectedElement.properties?.isAbstract || false;
      const elementVisibility = selectedElement.visibility || selectedElement.properties?.visibility || 'public';
      const elementDescription = selectedElement.description || selectedElement.properties?.description || '';
      
      // Get attributes from multiple sources
      const elementAttributes = selectedElement.attributes || 
                              selectedElement.properties?.attributes || 
                              [];
      
      // Get operations/methods from multiple sources
      const elementOperations = selectedElement.operations || 
                               selectedElement.methods || 
                               selectedElement.properties?.operations || 
                               selectedElement.properties?.methods || 
                               [];

      setName(elementName);
      setStereotype(elementStereotype);
      setIsAbstract(elementIsAbstract);
      setVisibility(elementVisibility);
      setDescription(elementDescription);
      setAttributes(elementAttributes);
      setOperations(elementOperations);
      
      console.log('Properties panel loaded element data:', {
        name: elementName,
        stereotype: elementStereotype,
        isAbstract: elementIsAbstract,
        visibility: elementVisibility,
        attributesCount: elementAttributes.length,
        operationsCount: elementOperations.length
      });
    }
  }, [selectedElement]);

  useEffect(() => {
    if (selectedConnection) {
      setConnectionType(selectedConnection.type || '');
      setConnectionLabel(selectedConnection.label || '');
      setSourceMultiplicity(selectedConnection.sourceMultiplicity || '');
      setTargetMultiplicity(selectedConnection.targetMultiplicity || '');
    }
  }, [selectedConnection]);

  if (!selectedElement && !selectedConnection) {
    console.log('UMLProperties: No element or connection selected, not rendering');
    return null;
  }

  console.log('UMLProperties rendering with:', {
    selectedElement: selectedElement?.name || 'null',
    selectedConnection: selectedConnection?.type || 'null'
  });

  // Manejar guardado de elemento
  const handleSaveElement = async () => {
    if (!selectedElement || !currentDiagram) {
      console.error('No hay elemento seleccionado o diagrama actual');
      return;
    }
    
    setSaving(true);
    
    try {
      console.log("Guardando cambios del elemento UML:", {
        elementId: selectedElement._id,
        diagramId: currentDiagram._id,
        updates: { name, stereotype, isAbstract, visibility, description, attributes, operations }
      });
      
      // Prepare the update data with proper structure for backend
      const updateData = {
        name,
        properties: {
          ...selectedElement.properties,
          stereotype,
          isAbstract,
          visibility,
          description
        }
      };
      
      // Add type-specific properties
      if (selectedElement.type === 'class' || selectedElement.type === 'abstract_class' || selectedElement.type === 'intermediate_table') {
        updateData.properties.attributes = attributes;
        updateData.properties.operations = operations;
        console.log('Adding class/intermediate_table properties:', { attributes, operations });
      } else if (selectedElement.type === 'interface') {
        updateData.properties.operations = operations;
        updateData.properties.attributes = []; // Interfaces don't have attributes
        console.log('Adding interface properties:', { operations });
      } else if (selectedElement.type === 'enum') {
        updateData.properties.literals = attributes.map(attr => ({
          name: attr.name || attr,
          value: attr.value || attr.name || attr
        }));
        console.log('Adding enum properties:', { literals: updateData.properties.literals });
      } else if (selectedElement.type === 'use_case' || selectedElement.type === 'note') {
        updateData.properties.description = description;
        console.log('Adding use case/note properties:', { description });
      }
      
      // Also add attributes and operations at the root level for compatibility
      updateData.attributes = attributes;
      updateData.operations = operations;
      
      console.log('Sending update data:', updateData);
      
      // Update on server and get updated element
      const updatedElement = await updateUMLElement(selectedElement._id, updateData);
      console.log('Received updated element:', updatedElement);
      
      // Update local selection with the updated element
      if (updatedElement && updatedElement._id) {
        // Ensure the updated element has the correct structure
        const elementWithProperties = {
          ...updatedElement,
          properties: {
            ...updatedElement.properties,
            attributes: updatedElement.properties?.attributes || attributes,
            operations: updatedElement.properties?.operations || operations
          }
        };
        
        selectElement(updatedElement._id, elementWithProperties);
        console.log("Elemento UML guardado y actualizado en la selección");
        console.log("Elemento actualizado con atributos:", elementWithProperties.properties?.attributes);
        console.log("Elemento actualizado con operaciones:", elementWithProperties.properties?.operations);
      } else {
        console.warn("No se recibió elemento actualizado válido del servidor");
      }
      
    } catch (error) {
      console.error('Error al guardar el elemento UML:', error);
      const errorMessage = error.message || 'Error desconocido al guardar elemento';
      alert('Error al guardar: ' + errorMessage);
    } finally {
      setSaving(false);
      if (selectedElement?._id) {
        endElementInteraction(selectedElement._id);
      }
    }
  };

  // Manejar guardado de conexión
  const handleSaveConnection = async () => {
    if (!selectedConnection || !currentDiagram) {
      console.error('No hay conexión seleccionada o diagrama actual');
      return;
    }
    
    setSaving(true);
    
    try {
      console.log("Guardando cambios de la conexión UML:", {
        connectionId: selectedConnection._id,
        diagramId: currentDiagram._id,
        updates: { type: connectionType, label: connectionLabel, sourceMultiplicity, targetMultiplicity }
      });
      
      // Prepare connection update data
      const updateData = {
        type: connectionType,
        // Establecer directamente las propiedades principales para que sean accesibles
        label: connectionLabel,
        sourceMultiplicity,
        targetMultiplicity,
        // Mantener también en properties para compatibilidad
        properties: {
          ...selectedConnection.properties,
          name: connectionLabel,
          sourceMultiplicity,
          targetMultiplicity
        }
      };
      
      console.log('Enviando datos de actualización:', updateData);
      
      // Update on server and get updated connection
      const updatedConnection = await updateConnection(selectedConnection._id, updateData);
      console.log('Received updated connection:', updatedConnection);
      
      // Update local selection with the updated connection
      if (updatedConnection && updatedConnection._id) {
        selectConnection(updatedConnection._id, updatedConnection);
        console.log("Conexión UML guardada y actualizada en la selección");
      } else {
        console.warn("No se recibió conexión actualizada válida del servidor");
      }
      
    } catch (error) {
      console.error('Error al guardar la conexión UML:', error);
      const errorMessage = error.message || 'Error desconocido al guardar conexión';
      alert('Error al guardar: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar elemento
  const handleDeleteElement = async () => {
    if (!selectedElement || !currentDiagram) {
      console.error('No hay elemento seleccionado o diagrama actual');
      alert('Error: No hay elemento seleccionado o diagrama activo');
      return;
    }
    
    const elementName = selectedElement.name || selectedElement.type || 'elemento';
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${elementName}"?`)) {
      try {
        console.log("Eliminando elemento UML:", {
          elementId: selectedElement._id,
          elementName: selectedElement.name,
          diagramId: currentDiagram._id,
          diagramName: currentDiagram.name
        });
        
        await deleteUMLElement(selectedElement._id);
        console.log("Elemento UML eliminado exitosamente");
        
        // Clear selection after delete
        selectElement(null);
        
        if (onClose) {
          onClose();
        }
        
      } catch (error) {
        console.error('Error al eliminar el elemento UML:', error);
        alert('Error al eliminar elemento: ' + (error.message || 'Error desconocido'));
      }
    }
  };

  // Eliminar conexión
  const handleDeleteConnection = async () => {
    if (!selectedConnection || !currentDiagram) {
      console.error('No hay conexión seleccionada o diagrama actual');
      alert('Error: No hay conexión seleccionada o diagrama activo');
      return;
    }
    
    if (window.confirm('¿Estás seguro de que deseas eliminar esta conexión?')) {
      try {
        console.log("Eliminando conexión UML:", {
          connectionId: selectedConnection._id,
          diagramId: currentDiagram._id,
          diagramName: currentDiagram.name
        });
        
        await deleteConnection(selectedConnection._id);
        console.log("Conexión UML eliminada exitosamente");
        
        if (onClose) {
          onClose();
        }
        
      } catch (error) {
        console.error('Error al eliminar la conexión UML:', error);
        alert('Error al eliminar conexión: ' + (error.message || 'Error desconocido'));
      }
    }
  };

  // Duplicar elemento
  const handleDuplicateElement = async () => {
    if (!selectedElement || !currentDiagram) {
      console.error('No hay elemento seleccionado o diagrama actual');
      alert('Error: No hay elemento seleccionado o diagrama activo');
      return;
    }
    
    try {
      setSaving(true);
      console.log("Duplicando elemento UML:", {
        elementId: selectedElement._id,
        elementName: selectedElement.name,
        elementType: selectedElement.type,
        diagramId: currentDiagram._id,
        diagramName: currentDiagram.name
      });

      // Verificar que el elemento tenga un ID válido
      if (!selectedElement._id) {
        throw new Error('El elemento seleccionado no tiene un ID válido');
      }

      // Llamar al servicio de duplicación y esperar la respuesta
      const duplicatedElement = await duplicateUMLElement(selectedElement._id);
      console.log("Elemento UML duplicado exitosamente:", duplicatedElement);
      
      // Verificar que se recibió un elemento duplicado válido
      if (!duplicatedElement || !duplicatedElement._id) {
        throw new Error('No se recibió un elemento duplicado válido del servidor');
      }
      
      // Seleccionar el nuevo elemento duplicado
      selectElement(duplicatedElement._id, duplicatedElement);
      
      // Mostrar mensaje de éxito
      alert(`Elemento "${selectedElement.name}" duplicado exitosamente`);

    } catch (error) {
      console.error('Error al duplicar el elemento UML:', error);
      alert('Error al duplicar elemento: ' + (error.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  // Funciones para manejar atributos
  const addAttribute = () => {
    const newAttribute = {
      name: 'newAttribute',
      type: 'String',
      visibility: 'private',
      defaultValue: ''
    };
    const updatedAttributes = [...attributes, newAttribute];
    setAttributes(updatedAttributes);
    console.log('Added new attribute:', newAttribute);
    console.log('Updated attributes list:', updatedAttributes);
  };

  const updateAttribute = (index, field, value) => {
    console.log('Updating attribute:', { index, field, value, currentAttributes: attributes });
    const updatedAttributes = [...attributes];
    updatedAttributes[index] = { ...updatedAttributes[index], [field]: value };
    setAttributes(updatedAttributes);
    console.log('Updated attributes:', updatedAttributes);
    
    // Auto-save después de actualizar un atributo (con un pequeño retraso para evitar demasiadas actualizaciones)
    try {
      clearTimeout(window.attributeUpdateTimeout);
      window.attributeUpdateTimeout = setTimeout(async () => {
        await handleSaveElement();
      }, 1000);
    } catch (error) {
      console.error('Error al guardar después de actualizar atributo:', error);
    }
  };

  const removeAttribute = (index) => {
    const updatedAttributes = attributes.filter((_, i) => i !== index);
    setAttributes(updatedAttributes);
    console.log('Removed attribute at index:', index);
    console.log('Updated attributes list:', updatedAttributes);
  };

  // Funciones para manejar operaciones/métodos
  const addOperation = () => {
    const newOperation = {
      name: 'newOperation',
      returnType: 'void',
      visibility: 'public',
      isAbstract: false,
      parameters: []
    };
    const updatedOperations = [...operations, newOperation];
    setOperations(updatedOperations);
    console.log('Added new operation:', newOperation);
    console.log('Updated operations list:', updatedOperations);
  };

  const updateOperation = (index, field, value) => {
    console.log('Updating operation:', { index, field, value, currentOperations: operations });
    const updatedOperations = [...operations];
    updatedOperations[index] = { ...updatedOperations[index], [field]: value };
    setOperations(updatedOperations);
    console.log('Updated operations:', updatedOperations);
    
    // Auto-save después de actualizar una operación (con un pequeño retraso para evitar demasiadas actualizaciones)
    try {
      clearTimeout(window.operationUpdateTimeout);
      window.operationUpdateTimeout = setTimeout(async () => {
        await handleSaveElement();
      }, 1000);
    } catch (error) {
      console.error('Error al guardar después de actualizar operación:', error);
    }
  };

  const removeOperation = (index) => {
    const updatedOperations = operations.filter((_, i) => i !== index);
    setOperations(updatedOperations);
    console.log('Removed operation at index:', index);
    console.log('Updated operations list:', updatedOperations);
  };

  // Eliminar conexión específica
  const handleDeleteSpecificConnection = async (connectionId) => {
    if (!connectionId) {
      console.error('No hay ID de conexión para eliminar');
      return;
    }
    
    if (window.confirm('¿Estás seguro de que deseas eliminar esta conexión?')) {
      try {
        console.log("Eliminando conexión específica:", connectionId);
        await deleteConnection(connectionId);
        console.log("Conexión eliminada exitosamente");
      } catch (error) {
        console.error('Error al eliminar la conexión:', error);
        alert('Error al eliminar conexión: ' + (error.message || 'Error desconocido'));
      }
    }
  };

  return (
    <div className="uml-properties-container">
      <div className="uml-properties-header">
        <div className="uml-properties-title">
          <i className="icon fa fa-cog"></i>
          {selectedElement ? `Propiedades del ${selectedElement.type}` : 'Propiedades de la Conexión'}
        </div>
        <button className="uml-properties-toggle" onClick={onClose}>
          <i className="fa fa-times"></i>
        </button>
      </div>
      
      <div className="properties-tabs">
        <button 
          className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        {selectedElement && (selectedElement.type === 'class' || selectedElement.type === 'intermediate_table') && (
          <>
            <button 
              className={`tab-button ${activeTab === 'attributes' ? 'active' : ''}`}
              onClick={() => setActiveTab('attributes')}
            >
              Atributos
            </button>
            <button 
              className={`tab-button ${activeTab === 'operations' ? 'active' : ''}`}
              onClick={() => setActiveTab('operations')}
            >
              Métodos
            </button>
          </>
        )}
        {selectedElement && (selectedElement.type === 'interface' || selectedElement.type === 'abstract_class') && (
          <button 
            className={`tab-button ${activeTab === 'operations' ? 'active' : ''}`}
            onClick={() => setActiveTab('operations')}
          >
            Métodos
          </button>
        )}
        {selectedElement && (
          <button 
            className={`tab-button ${activeTab === 'connections' ? 'active' : ''}`}
            onClick={() => setActiveTab('connections')}
          >
            Conexiones
          </button>
        )}
      </div>
      
      <div className="properties-content">
        {selectedElement && activeTab === 'general' && (
          <div className="tab-content">
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSaveElement}
              />
            </div>
            
            {selectedElement.type !== 'note' && selectedElement.type !== 'actor' && (
              <div className="form-group">
                <label>Estereotipo</label>
                <input
                  type="text"
                  value={stereotype}
                  onChange={(e) => setStereotype(e.target.value)}
                  onBlur={handleSaveElement}
                  placeholder="interface, entity, controller..."
                />
              </div>
            )}
            
            {(selectedElement.type === 'class' || selectedElement.type === 'abstract_class') && (
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={isAbstract}
                    onChange={(e) => {
                      setIsAbstract(e.target.checked);
                      setTimeout(handleSaveElement, 100);
                    }}
                  />
                  Clase Abstracta
                </label>
              </div>
            )}
            
            {selectedElement.type !== 'note' && selectedElement.type !== 'package' && (
              <div className="form-group">
                <label>Visibilidad</label>
                <select
                  value={visibility}
                  onChange={(e) => {
                    setVisibility(e.target.value);
                    setTimeout(handleSaveElement, 100);
                  }}
                >
                  <option value="public">Public (+)</option>
                  <option value="private">Private (-)</option>
                  <option value="protected">Protected (#)</option>
                  <option value="package">Package (~)</option>
                </select>
              </div>
            )}
            
            {(selectedElement.type === 'note' || selectedElement.type === 'use_case') && (
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleSaveElement}
                  rows={4}
                  placeholder="Descripción del elemento..."
                />
              </div>
            )}
          </div>
        )}
        
        {selectedElement && activeTab === 'attributes' && (
          <div className="tab-content">
            <div className="form-group">
              <label>Atributos</label>
              <div className="attributes-list">
                {attributes.map((attr, index) => (
                  <div key={index} className="attribute-item">
                    <div className="input-group">
                      <label className="input-label">Visibilidad</label>
                      <select
                        value={attr.visibility || 'private'}
                        onChange={(e) => updateAttribute(index, 'visibility', e.target.value)}
                        onBlur={handleSaveElement}
                        title="Seleccionar visibilidad del atributo"
                      >
                        <option value="public">+ Public</option>
                        <option value="private">- Private</option>
                        <option value="protected"># Protected</option>
                        <option value="package">~ Package</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Nombre</label>
                      <input
                        type="text"
                        placeholder="Ingresa el nombre del atributo"
                        value={attr.name || ''}
                        onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                        onBlur={handleSaveElement}
                        title="Nombre del atributo"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Tipo</label>
                      <input
                        type="text"
                        placeholder="String, int, boolean..."
                        value={attr.type || ''}
                        onChange={(e) => updateAttribute(index, 'type', e.target.value)}
                        onBlur={handleSaveElement}
                        title="Tipo de dato del atributo"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Valor por defecto</label>
                      <input
                        type="text"
                        placeholder="Valor inicial (opcional)"
                        value={attr.defaultValue || ''}
                        onChange={(e) => updateAttribute(index, 'defaultValue', e.target.value)}
                        onBlur={handleSaveElement}
                        title="Valor por defecto del atributo"
                      />
                    </div>
                    <button 
                      className="remove-attribute"
                      onClick={() => removeAttribute(index)}
                      title="Eliminar atributo"
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                  </div>
                ))}
                <button className="add-attribute-button" onClick={addAttribute}>
                  <i className="fa fa-plus"></i>
                  Agregar Atributo
                </button>
              </div>
            </div>
          </div>
        )}
        
        {selectedElement && activeTab === 'operations' && (
          <div className="tab-content">
            <div className="form-group">
              <label>
                {selectedElement.type === 'interface' ? 'Métodos' : 'Operaciones'}
              </label>
              <div className="operations-list">
                {operations.map((op, index) => (
                  <div key={index} className="operation-item">
                    <div className="input-group">
                      <label className="input-label">Visibilidad</label>
                      <select
                        value={op.visibility || 'public'}
                        onChange={(e) => updateOperation(index, 'visibility', e.target.value)}
                        onBlur={handleSaveElement}
                        title="Seleccionar visibilidad del método"
                      >
                        <option value="public">+ Public</option>
                        <option value="private">- Private</option>
                        <option value="protected"># Protected</option>
                        <option value="package">~ Package</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Nombre</label>
                      <input
                        type="text"
                        placeholder="Ingresa el nombre del método"
                        value={op.name || ''}
                        onChange={(e) => updateOperation(index, 'name', e.target.value)}
                        onBlur={handleSaveElement}
                        title="Nombre del método"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Tipo de retorno</label>
                      <input
                        type="text"
                        placeholder="String, int, void..."
                        value={op.returnType || ''}
                        onChange={(e) => updateOperation(index, 'returnType', e.target.value)}
                        onBlur={handleSaveElement}
                        title="Tipo de dato que retorna el método"
                      />
                    </div>
                    {selectedElement.type !== 'interface' && (
                      <div className="input-group checkbox-group">
                        <label className="checkbox-label" title="Método abstracto">
                          <input
                            type="checkbox"
                            checked={op.isAbstract || false}
                            onChange={(e) => {
                              updateOperation(index, 'isAbstract', e.target.checked);
                              setTimeout(handleSaveElement, 100);
                            }}
                          />
                          <span>Abstracto</span>
                        </label>
                      </div>
                    )}
                    <button 
                      className="remove-operation"
                      onClick={() => removeOperation(index)}
                      title="Eliminar operación"
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                  </div>
                ))}
                <button className="add-operation-button" onClick={addOperation}>
                  <i className="fa fa-plus"></i>
                  Agregar {selectedElement.type === 'interface' ? 'Método' : 'Operación'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {selectedElement && activeTab === 'connections' && (
          <div className="tab-content">
            <div className="form-group">
              <label>Conexiones del Elemento</label>
              <div className="connections-list">
                {getElementConnections().length === 0 ? (
                  <p className="no-connections">No hay conexiones para este elemento</p>
                ) : (
                  getElementConnections().map((connection, index) => (
                    <div key={connection._id} className="connection-item">
                      <div className="connection-info">
                        <span className="connection-type">{connection.type}</span>
                        <span className="connection-label">
                          {connection.label || connection.properties?.name || 'Sin etiqueta'}
                        </span>
                        <span className="connection-target">
                          {connection.sourceElementId === selectedElement._id ? '→' : '←'} 
                          {connection.sourceElementId === selectedElement._id ? 'Destino' : 'Origen'}
                        </span>
                      </div>
                      <div className="connection-actions">
                        <button
                          className="edit-connection-btn"
                          onClick={() => selectConnection(connection._id, connection)}
                          title="Editar conexión"
                        >
                          <i className="fa fa-edit"></i>
                        </button>
                        <button
                          className="delete-connection-btn"
                          onClick={() => handleDeleteSpecificConnection(connection._id)}
                          title="Eliminar conexión"
                        >
                          <i className="fa fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        
        {selectedConnection && activeTab === 'general' && (
          <div className="tab-content">
            <div className="form-group">
              <label>Tipo de Relación</label>
              <select
                value={connectionType}
                onChange={(e) => {
                  setConnectionType(e.target.value);
                  setTimeout(handleSaveConnection, 100);
                }}
              >
                <option value="association">Asociación</option>
                <option value="inheritance">Herencia</option>
                <option value="realization">Realización</option>
                <option value="aggregation">Agregación</option>
                <option value="composition">Composición</option>
                <option value="dependency">Dependencia</option>
                <option value="use">Uso</option>
                <option value="include">Include</option>
                <option value="extend">Extend</option>
                <optgroup label="Relaciones de Cardinalidad">
                  <option value="one-to-one">Uno a Uno (1:1)</option>
                  <option value="one-to-many">Uno a Muchos (1:*)</option>
                  <option value="many-to-one">Muchos a Uno (*:1)</option>
                  <option value="many-to-many">Muchos a Muchos (*:*)</option>
                  <option value="zero-to-one">Cero a Uno (0..1:1)</option>
                  <option value="zero-to-many">Cero a Muchos (0..1:*)</option>
                  <option value="one-or-many">Uno o Muchos (1..*:*)</option>
                  <option value="intermediate-table">Tabla Intermedia</option>
                </optgroup>
              </select>
            </div>
            
            <div className="form-group">
              <label>Etiqueta</label>
              <input
                type="text"
                value={connectionLabel}
                onChange={(e) => setConnectionLabel(e.target.value)}
                onBlur={handleSaveConnection}
                placeholder="Nombre de la relación..."
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Multiplicidad Origen</label>
                <input
                  type="text"
                  value={sourceMultiplicity}
                  onChange={(e) => setSourceMultiplicity(e.target.value)}
                  onBlur={handleSaveConnection}
                  placeholder="1, *, 0..1, 1..*"
                />
              </div>
              
              <div className="form-group">
                <label>Multiplicidad Destino</label>
                <input
                  type="text"
                  value={targetMultiplicity}
                  onChange={(e) => setTargetMultiplicity(e.target.value)}
                  onBlur={handleSaveConnection}
                  placeholder="1, *, 0..1, 1..*"
                />
              </div>
            </div>
            
            
            {/* Sección especial para tablas intermedias */}
            {connectionType === 'intermediate-table' && selectedConnection?.properties?.intermediateTableInfo && (
              <div className="form-group">
                <label>Información de la Tabla Intermedia</label>
                <div className="intermediate-table-info">
                  <div className="form-group">
                    <label>Nombre de la Tabla</label>
                    <input
                      type="text"
                      value={selectedConnection.properties.intermediateTableInfo.name || ''}
                      onChange={(e) => {
                        const updatedConnection = {
                          ...selectedConnection,
                          properties: {
                            ...selectedConnection.properties,
                            intermediateTableInfo: {
                              ...selectedConnection.properties.intermediateTableInfo,
                              name: e.target.value
                            }
                          }
                        };
                        selectConnection(selectedConnection._id, updatedConnection);
                      }}
                      onBlur={handleSaveConnection}
                      placeholder="Nombre de la tabla intermedia..."
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Descripción</label>
                    <textarea
                      value={selectedConnection.properties.intermediateTableInfo.description || ''}
                      onChange={(e) => {
                        const updatedConnection = {
                          ...selectedConnection,
                          properties: {
                            ...selectedConnection.properties,
                            intermediateTableInfo: {
                              ...selectedConnection.properties.intermediateTableInfo,
                              description: e.target.value
                            }
                          }
                        };
                        selectConnection(selectedConnection._id, updatedConnection);
                      }}
                      onBlur={handleSaveConnection}
                      placeholder="Descripción de la tabla intermedia..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Atributos de la Tabla</label>
                    <div className="table-attributes-list">
                      {selectedConnection.properties.intermediateTableInfo.attributes?.map((attr, index) => (
                        <div key={index} className="table-attribute-item">
                          <input
                            type="text"
                            value={attr.name || ''}
                            onChange={(e) => {
                              const updatedAttributes = [...selectedConnection.properties.intermediateTableInfo.attributes];
                              updatedAttributes[index] = { ...attr, name: e.target.value };
                              const updatedConnection = {
                                ...selectedConnection,
                                properties: {
                                  ...selectedConnection.properties,
                                  intermediateTableInfo: {
                                    ...selectedConnection.properties.intermediateTableInfo,
                                    attributes: updatedAttributes
                                  }
                                }
                              };
                              selectConnection(selectedConnection._id, updatedConnection);
                            }}
                            onBlur={handleSaveConnection}
                            placeholder="Nombre del atributo..."
                          />
                          <select
                            value={attr.type || 'String'}
                            onChange={(e) => {
                              const updatedAttributes = [...selectedConnection.properties.intermediateTableInfo.attributes];
                              updatedAttributes[index] = { ...attr, type: e.target.value };
                              const updatedConnection = {
                                ...selectedConnection,
                                properties: {
                                  ...selectedConnection.properties,
                                  intermediateTableInfo: {
                                    ...selectedConnection.properties.intermediateTableInfo,
                                    attributes: updatedAttributes
                                  }
                                }
                              };
                              selectConnection(selectedConnection._id, updatedConnection);
                            }}
                            onBlur={handleSaveConnection}
                          >
                            <option value="String">String</option>
                            <option value="Number">Number</option>
                            <option value="Boolean">Boolean</option>
                            <option value="Date">Date</option>
                            <option value="ObjectId">ObjectId</option>
                          </select>
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={attr.required || false}
                              onChange={(e) => {
                                const updatedAttributes = [...selectedConnection.properties.intermediateTableInfo.attributes];
                                updatedAttributes[index] = { ...attr, required: e.target.checked };
                                const updatedConnection = {
                                  ...selectedConnection,
                                  properties: {
                                    ...selectedConnection.properties,
                                    intermediateTableInfo: {
                                      ...selectedConnection.properties.intermediateTableInfo,
                                      attributes: updatedAttributes
                                    }
                                  }
                                };
                                selectConnection(selectedConnection._id, updatedConnection);
                              }}
                              onBlur={handleSaveConnection}
                            />
                            Requerido
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="properties-actions">
        {selectedElement && (
          <>
            <button
              className="action-button save"
              onClick={handleSaveElement}
              disabled={saving || !currentDiagram || !selectedElement}
              title="Guardar Cambios"
            >
              {saving ? (
                <>
                  <i className="fa fa-spinner fa-spin"></i> Guardando...
                </>
              ) : (
                <>
                  <i className="fa fa-save"></i> Guardar
                </>
              )}
            </button>
            
            <button
              className="action-button duplicate"
              onClick={handleDuplicateElement}
              disabled={saving || !currentDiagram || !selectedElement}
              title="Duplicar Elemento"
            >
              {saving ? (
                <>
                  <i className="fa fa-spinner fa-spin"></i> Duplicando...
                </>
              ) : (
                <>
                  <i className="fa fa-copy"></i> Duplicar
                </>
              )}
            </button>
            
            <button
              className="action-button delete"
              onClick={handleDeleteElement}
              disabled={!currentDiagram || !selectedElement}
              title="Eliminar Elemento"
            >
              <i className="fa fa-trash"></i> Eliminar
            </button>
          </>
        )}
        
        {selectedConnection && (
          <button
            className="action-button delete"
            onClick={handleDeleteConnection}
            disabled={!currentDiagram || !selectedConnection}
            title="Eliminar Conexión"
          >
            <i className="fa fa-trash"></i> Eliminar
          </button>
        )}
      </div>
    </div>
  );
};

export default UMLProperties;
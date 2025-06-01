// src/components/editor/AIAssistant.js - VERSIÓN ADAPTATIVA COMPLETA
import React, { useState, useRef, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import './AIAssistant.css';
import axios from '../../utils/axiosConfig';

const AIAssistant = ({ isOpen, onClose, initialInput = '', onInputChange, context = {} }) => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: '¡Hola! Soy tu asistente de diseño Flutter especializado. Puedo ayudarte a crear interfaces completas, agregar componentes específicos, y optimizar tu diseño. \n\n¿Qué te gustaría diseñar hoy?',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const { 
    createElement, 
    elements, 
    project,
    currentScreen,
    updateElement,
    selectElement,
    deleteElement
  } = useEditor();
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialInput && initialInput !== input) {
      setInput(initialInput);
      if (onInputChange) {
        onInputChange('');
      }
    }
  }, [initialInput, input, onInputChange]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isTyping || isExecuting) return;
    
    const userMessage = { 
      role: 'user', 
      content: input.trim(),
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      const response = await sendMessageToAI([...messages, userMessage]);
      
      const assistantMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // SISTEMA ADAPTATIVO DE EXTRACCIÓN DE ACCIONES
      console.log('🔍 Analizando respuesta completa:', response);
      
      const extractedActions = extractActionsFromResponse(response);
      
      if (extractedActions.length > 0) {
        setIsExecuting(true);
        
        const executionMessage = {
          role: 'system',
          content: `🚀 Ejecutando ${extractedActions.length} acción(es)...`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, executionMessage]);
        
        try {
          const results = await executeAIActions(extractedActions);
          
          const successMessage = {
            role: 'system',
            content: `✅ Se ejecutaron exitosamente ${results.successful} de ${results.total} acciones.`,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, successMessage]);
          
          if (results.errors.length > 0) {
            const errorMessage = {
              role: 'system',
              content: `⚠️ Errores: ${results.errors.slice(0, 3).join(', ')}${results.errors.length > 3 ? '...' : ''}`,
              timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
          }
          
        } catch (executionError) {
          console.error('Error ejecutando acciones:', executionError);
          const errorMessage = {
            role: 'system',
            content: `❌ Error al ejecutar las acciones: ${executionError.message}`,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        console.log('💡 No se encontraron acciones para ejecutar');
        const infoMessage = {
          role: 'system',
          content: '💬 Respuesta procesada. No se encontraron elementos para crear.',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, infoMessage]);
      }
      
    } catch (error) {
      console.error('Error al comunicarse con la IA:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Lo siento, tuve un problema procesando tu solicitud. Error: ' + error.message,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsExecuting(false);
    }
  };

  // FUNCIÓN ADAPTATIVA PARA EXTRAER ACCIONES
  const extractActionsFromResponse = (response) => {
    console.log('🔍 Extrayendo acciones de respuesta...');
    let actions = [];

    // MÉTODO 1: Acciones directas en response.actions
    if (response.actions && Array.isArray(response.actions)) {
      actions = [...response.actions];
      console.log(`✅ Método 1: ${actions.length} acciones encontradas en response.actions`);
    }

    // MÉTODO 2: Acciones en response.data.actions
    if (actions.length === 0 && response.data && response.data.actions && Array.isArray(response.data.actions)) {
      actions = [...response.data.actions];
      console.log(`✅ Método 2: ${actions.length} acciones encontradas en response.data.actions`);
    }

    // MÉTODO 3: Extraer JSON del contenido de texto
    if (actions.length === 0 && response.message) {
      const jsonMatch = response.message.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const jsonPart = jsonMatch[1].trim();
          const parsedJson = JSON.parse(jsonPart);
          if (parsedJson.actions && Array.isArray(parsedJson.actions)) {
            actions = [...parsedJson.actions];
            console.log(`✅ Método 3: ${actions.length} acciones extraídas del JSON en mensaje`);
          }
        } catch (jsonError) {
          console.warn('⚠️ Error parseando JSON del mensaje:', jsonError);
        }
      }
    }

    // MÉTODO 4: Extraer acciones anidadas y aplanarlas
    if (actions.length > 0) {
      actions = flattenNestedActions(actions);
      console.log(`🔄 Acciones aplanadas: ${actions.length} acciones totales`);
    }

    console.log('📋 Acciones finales extraídas:', actions);
    return actions;
  };

  // FUNCIÓN PARA APLANAR ACCIONES ANIDADAS
  const flattenNestedActions = (actions) => {
    const flattened = [];
    
    for (const action of actions) {
      // Agregar la acción principal
      const mainAction = { ...action };
      
      // Si tiene contenido anidado, procesarlo
      if (action.content && Array.isArray(action.content)) {
        console.log(`🔄 Procesando ${action.content.length} elementos anidados en ${action.elementType}`);
        
        // Guardar el contenido anidado y limpiar la acción principal
        const nestedElements = [...action.content];
        delete mainAction.content;
        
        // Agregar la acción principal primero
        flattened.push(mainAction);
        
        // Procesar elementos anidados
        for (let i = 0; i < nestedElements.length; i++) {
          const nestedElement = nestedElements[i];
          
          if (nestedElement.type === 'create') {
            // Ajustar posiciones relativas al elemento padre
            const adjustedElement = {
              ...nestedElement,
              position: {
                x: (action.position?.x || 0) + (nestedElement.position?.x || 0),
                y: (action.position?.y || 0) + (nestedElement.position?.y || 0)
              },
              size: nestedElement.size || { width: 100, height: 50 },
              styles: nestedElement.styles || {},
              flutterProps: nestedElement.flutterProps || {},
              parentId: mainAction.elementType + '_' + Date.now() // Referencia al padre
            };
            
            flattened.push(adjustedElement);
          }
        }
      } else {
        // Acción simple sin anidamiento
        flattened.push(mainAction);
      }
    }
    
    return flattened;
  };
  
  const sendMessageToAI = async (messageHistory) => {
    try {
      console.log('🤖 AI: Enviando mensaje a la IA...');
      
      if (!currentScreen) {
        throw new Error('No hay pantalla seleccionada');
      }

      const validElements = Array.isArray(elements) 
        ? elements.filter(el => el && el._id && el.type) 
        : [];

      const canvasContext = {
        canvas: {
          width: currentScreen.canvas?.width || 360,
          height: currentScreen.canvas?.height || 640,
          deviceType: project?.deviceType || 'custom',
          backgroundColor: currentScreen.canvas?.background || '#FFFFFF'
        },
        elements: {
          count: validElements.length,
          types: [...new Set(validElements.map(el => el.type))],
          details: validElements.map(el => ({
            id: el._id,
            type: el.type,
            flutterWidget: el.flutterWidget,
            name: el.name,
            content: el.content?.substring(0, 50) + (el.content?.length > 50 ? '...' : ''),
            position: el.position,
            size: el.size,
            hasCustomStyles: Object.keys(el.styles || {}).length > 0
          }))
        },
        availableWidgets: [
          'container', 'text', 'elevatedButton', 'outlinedButton', 'textButton',
          'row', 'column', 'stack', 'expanded', 'appBar', 'floatingActionButton',
          'textField', 'card', 'divider', 'switch', 'checkbox', 'slider',
          'bottomNavigationBar', 'tabBar', 'drawer', 'image', 'icon',
          'listView', 'gridView', 'wrap', 'center', 'align', 'padding',
          'margin', 'decoratedBox', 'clipRRect', 'opacity'
        ],
        context: {
          screenId: context.screenId || currentScreen._id,
          projectId: context.projectId || project?._id,
          screenName: context.screenName || currentScreen.name
        }
      };
      
      const systemPrompt = `Eres un experto en diseño UI/UX y desarrollo Flutter especializado en crear interfaces móviles profesionales.

CONTEXTO DEL PROYECTO:
- Canvas: ${canvasContext.canvas.width}x${canvasContext.canvas.height} px (${canvasContext.canvas.deviceType})
- Elementos actuales: ${canvasContext.elements.count} (${canvasContext.elements.types.join(', ')})
- Fondo: ${canvasContext.canvas.backgroundColor}

WIDGETS DISPONIBLES: ${canvasContext.availableWidgets.join(', ')}

ELEMENTOS EXISTENTES:
${canvasContext.elements.details.map(el => 
  `- ${el.name} (${el.type}): ${el.position.x},${el.position.y} [${el.size.width}x${el.size.height}]`
).join('\n')}

INSTRUCCIONES CRÍTICAS PARA CREAR ELEMENTOS:

1. FORMATO BÁSICO - Para elementos simples:
\`\`\`json
{
  "actions": [
    {
      "type": "create",
      "elementType": "elevatedButton",
      "name": "Mi Botón",
      "content": "Texto del botón",
      "position": {"x": 130, "y": 295},
      "size": {"width": 100, "height": 50},
      "styles": {
        "backgroundColor": "#0000FF",
        "textColor": "#FFFFFF",
        "borderRadius": 8,
        "fontSize": 16
      },
      "flutterProps": {
        "onPressed": "onPressedFunction",
        "elevation": 4
      }
    }
  ]
}
\`\`\`

2. FORMATO COMPLEJO - Para elementos con hijos (cards, containers con contenido):
\`\`\`json
{
  "actions": [
    {
      "type": "create",
      "elementType": "card",
      "name": "Mi Tarjeta",
      "position": {"x": 30, "y": 30},
      "size": {"width": 300, "height": 200},
      "styles": {
        "backgroundColor": "#FFFFFF",
        "borderRadius": 12,
        "elevation": 4,
        "padding": 16
      },
      "content": [
        {
          "type": "create",
          "elementType": "container",
          "name": "Imagen Container",
          "position": {"x": 0, "y": 0},
          "size": {"width": 268, "height": 120},
          "styles": {
            "backgroundImage": "https://picsum.photos/300/150",
            "borderRadius": 8
          }
        },
        {
          "type": "create",
          "elementType": "text",
          "name": "Título de la Tarjeta",
          "content": "Mi Título",
          "position": {"x": 0, "y": 130},
          "size": {"width": 268, "height": 30},
          "styles": {
            "color": "#333333",
            "fontSize": 18,
            "fontWeight": "bold"
          }
        },
        {
          "type": "create",
          "elementType": "text",
          "name": "Descripción",
          "content": "Descripción del contenido",
          "position": {"x": 0, "y": 160},
          "size": {"width": 268, "height": 24},
          "styles": {
            "color": "#666666",
            "fontSize": 14
          }
        }
      ]
    }
  ]
}
\`\`\`

3. NAVEGACIÓN Y MENÚS:
- Para bottomNavigationBar: position {x: 0, y: canvas.height-56}, size {width: canvas.width, height: 56}
- Para appBar: position {x: 0, y: 0}, size {width: canvas.width, height: 56}
- Para drawer: position {x: 0, y: 0}, size {width: 280, height: canvas.height}

4. IMÁGENES Y COLORES:
- Para imágenes usa: backgroundImage: "https://picsum.photos/ancho/alto" o URLs válidas
- Colores en formato hexadecimal: "#FF0000", "#0000FF", etc.
- Degradados: "linear-gradient(45deg, #FF0000, #0000FF)"

5. RESPONSIVE:
- Usa porcentajes del canvas para posicionamiento
- Evita que elementos se salgan del canvas
- Para elementos centrados: x = (canvas.width - element.width) / 2

SIEMPRE incluye el bloque JSON cuando vayas a crear elementos. NUNCA omitas las propiedades obligatorias: type, elementType, name, position, size.`;

      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messageHistory.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];
      
      console.log('📤 Enviando request a /api/ai/chat');
      
      const response = await axios.post('/ai/chat', {
        messages: formattedMessages,
        context: canvasContext 
      });
      
      console.log('📥 Respuesta completa recibida:', response.data);
      
      return { 
        actions: response.data.actions || [],
        message: response.data.response || response.data.message || '',
        data: response.data
      };
      
    } catch (error) {
      console.error('❌ Error en sendMessageToAI:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw new Error(error.response?.data?.message || error.message || 'Error de comunicación con la IA');
    }
  };
  
  const executeAIActions = async (actions) => {
    console.log('⚡ Ejecutando acciones recibidas:', actions);
    
    if (!Array.isArray(actions)) {
      console.error('❌ Las acciones no son un array:', actions);
      throw new Error('Formato de acciones inválido');
    }
    
    let successful = 0;
    let total = actions.length;
    const errors = [];
    const createdElements = [];
    
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      console.log(`🔧 Ejecutando acción ${i + 1}/${total}:`, action);
      
      try {
        if (!action.type) {
          throw new Error(`Acción ${i + 1}: Tipo de acción requerido`);
        }
        
        switch (action.type) {
          case 'create':
            if (!action.elementType) {
              throw new Error('Tipo de elemento requerido para crear');
            }
            
            console.log('➕ Creando elemento:', action.elementType);
            
            // Validar y ajustar posición dentro del canvas
            const canvasWidth = currentScreen.canvas?.width || 360;
            const canvasHeight = currentScreen.canvas?.height || 640;
            const elementWidth = Math.max(20, action.size?.width || 100);
            const elementHeight = Math.max(20, action.size?.height || 50);
            
            const elementData = {
              type: action.elementType,
              name: action.name || `${action.elementType} IA`,
              content: action.content || '',
              position: {
                x: Math.max(0, Math.min(canvasWidth - elementWidth, action.position?.x || 100)),
                y: Math.max(0, Math.min(canvasHeight - elementHeight, action.position?.y || 100))
              },
              size: {
                width: elementWidth,
                height: elementHeight
              },
              styles: {
                // Estilos por defecto según tipo de elemento
                ...(action.elementType === 'text' && {
                  color: '#000000',
                  fontSize: 16,
                  fontWeight: 'normal'
                }),
                ...(action.elementType === 'elevatedButton' && {
                  backgroundColor: '#2196F3',
                  textColor: '#FFFFFF',
                  borderRadius: 8,
                  elevation: 4
                }),
                ...(action.elementType === 'card' && {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  elevation: 2,
                  padding: 16
                }),
                ...(action.elementType === 'container' && {
                  backgroundColor: '#F5F5F5',
                  borderRadius: 8
                }),
                // Sobrescribir con estilos personalizados
                ...(action.styles || {})
              },
              flutterWidget: action.elementType,
              flutterProps: {
                // Props por defecto según tipo
                ...(action.elementType === 'elevatedButton' && {
                  onPressed: 'onPressed'
                }),
                ...(action.elementType === 'text' && {
                  textAlign: 'left'
                }),
                ...(action.elementType === 'image' && {
                  fit: 'cover'
                }),
                // Sobrescribir con props personalizados
                ...(action.flutterProps || {})
              }
            };
            
            console.log('📋 Datos del elemento a crear:', elementData);
            
            const createdElement = await createElement(elementData);
            createdElements.push(createdElement);
            console.log('✅ Elemento creado exitosamente');
            break;
            
          case 'update':
            if (!action.elementId) {
              throw new Error('ID de elemento requerido para actualizar');
            }
            
            const updateData = {};
            if (action.name) updateData.name = action.name;
            if (action.content !== undefined) updateData.content = action.content;
            if (action.position) updateData.position = action.position;
            if (action.size) updateData.size = action.size;
            if (action.styles) updateData.styles = action.styles;
            if (action.flutterProps) updateData.flutterProps = action.flutterProps;
            
            await updateElement(action.elementId, updateData);
            console.log('✅ Elemento actualizado exitosamente');
            break;
            
          case 'select':
            if (action.elementId) {
              const validElements = Array.isArray(elements) 
                ? elements.filter(el => el && el._id && el.type) 
                : [];
              const element = validElements.find(el => el._id === action.elementId);
              if (element) {
                selectElement(action.elementId, element);
                console.log('✅ Elemento seleccionado exitosamente');
              }
            }
            break;
            
          case 'delete':
            if (action.elementId) {
              await deleteElement(action.elementId);
              console.log('✅ Elemento eliminado exitosamente');
            }
            break;
            
          default:
            throw new Error(`Tipo de acción desconocida: ${action.type}`);
        }
        
        successful++;
        
        // Pausa entre acciones para estabilidad
        if (i < actions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
        
      } catch (error) {
        console.error(`❌ Error en acción ${i + 1}:`, error);
        errors.push(`Acción ${i + 1}: ${error.message}`);
      }
    }
    
    if (errors.length > 0) {
      console.warn('⚠️ Errores en ejecución:', errors);
    }
    
    console.log(`📊 Resultado final: ${successful}/${total} acciones exitosas`);
    console.log(`🎨 Elementos creados: ${createdElements.length}`);
    
    return { successful, total, errors, createdElements };
  };
  
  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: '¡Chat limpio! ¿En qué puedo ayudarte ahora?',
      timestamp: Date.now()
    }]);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="ai-assistant">
      <div className="ai-assistant-header">
        <div className="header-content">
          <div className="assistant-info">
            <h3>🤖 Asistente Flutter IA</h3>
            <span className="status-indicator">
              {isTyping ? '✍️ Escribiendo...' : isExecuting ? '⚡ Ejecutando...' : '💡 Listo para ayudar'}
            </span>
          </div>
          <div className="header-actions">
            <button 
              className="clear-chat-button" 
              onClick={clearChat}
              title="Limpiar chat"
              disabled={isTyping || isExecuting}
            >
              🗑️
            </button>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        </div>
      </div>
      
      <div className="ai-assistant-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.content.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            {msg.timestamp && (
              <div className="message-timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="message assistant">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="ai-assistant-examples">
        <div className="examples-label">💡 Ejemplos rápidos:</div>
        <div className="example-buttons">
          {[
            "Crea un botón azul centrado",
            "Diseña una card con imagen y texto",
            "Agrega una barra de navegación inferior",
            "Agrega un campo de texto para búsqueda"
          ].map((example, i) => (
            <button
              key={i}
              className="example-button"
              onClick={() => setInput(example)}
              disabled={isTyping || isExecuting}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="ai-assistant-input">
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Describe lo que quieres diseñar... Puedo crear botones, cards, menús, imágenes, textos y mucho más. (Presiona Enter para enviar)"
          disabled={isTyping || isExecuting}
          rows="2"
        />
        <button 
          type="submit" 
          disabled={isTyping || isExecuting || !input.trim()}
          className="send-button"
        >
          {isTyping || isExecuting ? (
            <div className="sending-spinner"></div>
          ) : (
            <i className="fa fa-paper-plane"></i>
          )}
        </button>
      </form>
    </div>
  );
};

export default AIAssistant;
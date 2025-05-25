// src/components/editor/AIAssistant.js
import React, { useState, useRef, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import './AIAssistant.css';
import axios from '../../utils/axiosConfig';

const AIAssistant = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hola, soy tu asistente de diseño Flutter. ¿En qué puedo ayudarte hoy? Puedo crear diseños, agregar componentes y ayudarte con tu interfaz.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const { 
    createElement, 
    elements, 
    project, 
    updateElement,
    selectElement
  } = useEditor();
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Añadir mensaje del usuario
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      // Enviar mensaje a la API de OpenAI
      const response = await sendMessageToAI(
        [...messages, userMessage],
        elements,
        project
      );
      
      // Procesar la respuesta
      if (response.actions && response.actions.length > 0) {
        // Ejecutar acciones generadas por la IA
        await executeAIActions(response.actions);
      }
      
      // Añadir respuesta del asistente
      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
    } catch (error) {
      console.error('Error al comunicarse con la IA:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Lo siento, tuve un problema procesando tu solicitud. Por favor, intenta de nuevo.' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };
  
  const sendMessageToAI = async (messageHistory, currentElements, currentProject) => {
    try {
      // Preparar el contexto para la IA
      const canvasContext = {
        width: currentProject.canvas.width,
        height: currentProject.canvas.height,
        deviceType: currentProject.deviceType || 'custom',
        currentElements: currentElements.map(el => ({
          id: el._id,
          type: el.type,
          name: el.name,
          position: el.position,
          size: el.size
        }))
      };
      
      // Formatear mensajes para OpenAI
      const formattedMessages = [
        {
          role: 'system',
          content: `Eres un asistente especializado en diseño de interfaces para Flutter.
          
  Tu tarea principal es ayudar al usuario a diseñar interfaces visuales para aplicaciones móviles utilizando widgets de Flutter.
          
  El usuario está utilizando un editor visual con un canvas de dimensiones ${canvasContext.width}x${canvasContext.height} para dispositivo ${canvasContext.deviceType}.
  
  En el canvas hay actualmente ${canvasContext.currentElements.length} elementos.
  ${canvasContext.currentElements.length > 0 ? 
    `Elementos actuales: ${JSON.stringify(canvasContext.currentElements, null, 2)}` : 
    'No hay elementos en el canvas todavía.'}
  
  Tienes la capacidad de crear elementos directamente en el canvas respondiendo con acciones JSON junto con tu mensaje conversacional.
  
  IMPORTANTE: CADA VEZ QUE RESPONDAS, DEBES INCLUIR TANTO UN MENSAJE CONVERSACIONAL NORMAL EXPLICANDO LO QUE HICISTE, COMO UNA ESTRUCTURA JSON DE ACCIONES SI SE NECESITAN CREAR ELEMENTOS. No incluyas comillas en tu respuesta conversacional normal.
  
  Tipos de widgets disponibles:
  - container: Contenedor básico
  - text: Texto
  - elevatedButton: Botón elevado
  - outlinedButton: Botón con borde
  - textButton: Botón de texto
  - row: Fila
  - column: Columna
  - stack: Apilamiento
  - appBar: Barra superior
  - floatingActionButton: Botón flotante
  - textField: Campo de texto
  - card: Tarjeta
  - divider: Divisor
  - switch: Interruptor
  - bottomNavigationBar: Barra de navegación inferior
  - tabBar: Barra de pestañas
  - drawer: Panel lateral
  
  Para posicionar elementos, usa coordenadas x,y dentro del canvas. Por ejemplo: { "x": 100, "y": 200 }
  Para dimensionar elementos, especifica width y height. Por ejemplo: { "width": 200, "height": 50 }
  
  Estructura JSON para acciones de creación y manipulación:
  \`\`\`json
  {
    "actions": [
      {
        "type": "create",
        "elementType": "text",
        "name": "Título Principal",
        "content": "Bienvenido a mi App",
        "position": { "x": 20, "y": 50 },
        "size": { "width": 300, "height": 40 },
        "styles": {
          "color": "#000000",
          "fontSize": 24,
          "fontWeight": "bold",
          "textAlign": "center"
        }
      }
    ]
  }
  \`\`\`
  
  Cuando el usuario solicite crear una pantalla o diseño completo, construye múltiples elementos que trabajen juntos para formar una interfaz coherente.
  
  Si el usuario pide consejos sobre diseño de Flutter, proporciona recomendaciones basadas en las mejores prácticas de Material Design.`
        },
        ...messageHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];
      
      // Usar axios para llamar a tu API backend
      const response = await axios.post('/ai/chat', // Asegúrate que esta ruta coincida con tu backend
        { messages: formattedMessages },
        { 
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Procesar la respuesta de la IA
      const aiContent = response.data.choices[0].message.content;
      
      // Intentar extraer el JSON de acciones de la respuesta
      let jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/);
      let actions = [];
      let message = aiContent;
      
      if (jsonMatch && jsonMatch[1]) {
        try {
          const jsonPart = jsonMatch[1].trim();
          const parsedJson = JSON.parse(jsonPart);
          actions = parsedJson.actions || [];
          
          // Quitar la parte JSON del mensaje para mostrar solo el texto conversacional
          message = aiContent.replace(/```json\s*[\s\S]*?\s*```/, '').trim();
        } catch (jsonError) {
          console.error('Error al analizar JSON de la respuesta:', jsonError);
        }
      }
      
      return { actions, message };
      
    } catch (error) {
      console.error('Error al comunicarse con la API:', 
        error.response ? `${error.response.status}: ${error.response.data}` : error.message);
      throw error;
    }
  };
  // Función para ejecutar acciones generadas por la IA
  const executeAIActions = async (actions) => {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'create':
            await createElement({
              type: action.elementType,
              name: action.name || `Nuevo ${action.elementType}`,
              content: action.content || '',
              position: action.position || { x: 100, y: 100 },
              size: action.size || { width: 200, height: 50 },
              styles: action.styles || {},
              flutterWidget: action.elementType
            });
            break;
            
          case 'update':
            if (action.elementId) {
              await updateElement(action.elementId, {
                name: action.name,
                content: action.content,
                position: action.position,
                size: action.size,
                styles: action.styles
              });
            }
            break;
            
          case 'select':
            if (action.elementId) {
              const element = elements.find(el => el._id === action.elementId);
              if (element) {
                selectElement(action.elementId, element);
              }
            }
            break;
            
          default:
            console.warn('Acción desconocida:', action.type);
        }
      } catch (error) {
        console.error(`Error al ejecutar acción ${action.type}:`, error);
      }
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="ai-assistant">
      <div className="ai-assistant-header">
        <h3>Asistente de Diseño Flutter</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="ai-assistant-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
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
      
      <form onSubmit={handleSubmit} className="ai-assistant-input">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Escribe para diseñar con IA..."
          disabled={isTyping}
        />
        <button type="submit" disabled={isTyping}>
          {isTyping ? <div className="sending-spinner"></div> : <i className="fa fa-paper-plane"></i>}
        </button>
      </form>
    </div>
  );
};

export default AIAssistant;
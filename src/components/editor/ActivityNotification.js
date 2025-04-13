// src/components/editor/ActivityNotification.js
import React, { useState, useEffect } from 'react';
import './ActivityNotification.css';
import { useEditor } from '../../context/EditorContext';

const ActivityNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const { socket } = useEditor();
  
  useEffect(() => {
    if (!socket) return;
    
    console.log('🟡 Configurando escuchas en ActivityNotification');
    
    // Función para añadir notificaciones
    const addNotification = (msg) => {
      console.log('🟡 Añadiendo notificación:', msg);
      const newNotification = {
        id: Date.now(),
        type: msg.type || 'info',
        message: msg.message,
        timestamp: Date.now()
      };
      
      setNotifications(prev => [newNotification, ...prev].slice(0, 5));
      
      // Auto eliminar después de 5 segundos
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    };
    
    // Escuchar eventos de interacción para crear notificaciones
    const handleElementInteraction = (data) => {
      console.log('🟡 Evento element-interaction recibido:', data);
      addNotification({
        type: 'interaction',
        message: `${data.username} está ${data.action} un elemento`
      });
    };
    
    const handleElementDeleted = (data) => {
      console.log('🟡 Evento element-deleted recibido:', data);
      addNotification({
        type: 'delete',
        message: `${data.username} eliminó un elemento`
      });
    };
    
    // Para pruebas, crear una notificación inicial
    setTimeout(() => {
      addNotification({
        type: 'info',
        message: 'Sistema de notificaciones activado'
      });
    }, 1000);
    
    // Registrar los escuchas
    socket.on('element-interaction', handleElementInteraction);
    socket.on('element-deleted', handleElementDeleted);
    
    return () => {
      socket.off('element-interaction', handleElementInteraction);
      socket.off('element-deleted', handleElementDeleted);
    };
  }, [socket]);

    // Para verificar si hay notificaciones
    useEffect(() => {
        console.log('🟡 Notificaciones actuales:', notifications);
      }, [notifications]);
      
      if (notifications.length === 0) {
        return <div style={{display: 'none'}}>No hay notificaciones</div>;
      }
  
//   const addNotification = (notification) => {
//     const newNotification = {
//       id: Date.now(),
//       ...notification,
//       timestamp: Date.now()
//     };
    
//     setNotifications(prev => [newNotification, ...prev].slice(0, 5));
    
//     // Auto-eliminar después de 5 segundos
//     setTimeout(() => {
//       setNotifications(prev => 
//         prev.filter(n => n.id !== newNotification.id)
//       );
//     }, 5000);
//   };
//   console.log("OPEN NOTIFY",notifications,socket)

  if (notifications.length === 0) return null;
  
  return (
    <div className="activity-notifications" style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {notifications.map(notification => (
          <div 
            key={notification.id}
            style={{
              backgroundColor: notification.type === 'delete' ? '#F44336' : 
                              notification.type === 'interaction' ? '#2196F3' : '#333',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '4px',
              boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
              maxWidth: '300px'
            }}
          >
            {notification.message}
          </div>
        ))}
      </div>
    );
};

export default ActivityNotification;
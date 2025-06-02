// src/components/editor/UserActivityNotification.js
import React, { useState, useEffect } from 'react';
import './UserActivityNotification.css';
import io from 'socket.io-client'; // Añadir esta importación

const UserActivityNotification = () => {

  const [notifications, setNotifications] = useState([]);
  
  // Listener para elemento eliminado
  useEffect(() => {
    const socket = io('http://159.203.124.196:80');
    
    socket.on('element-deleted', (data) => {
      // Añadir notificación
      const newNotification = {
        id: Date.now(),
        type: 'delete',
        message: `${data.username} eliminó un elemento`,
        timestamp: Date.now()
      };
      
      setNotifications(prev => [newNotification, ...prev].slice(0, 5));
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);
  
  // Auto-eliminar notificaciones después de 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(prev => {
        if (prev.length === 0) return prev;
        return prev.slice(0, prev.length - 1);
      });
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [notifications]);
  
  if (notifications.length === 0) return null;
  
  return (
    <div className="user-activity-notifications">
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className={`notification notification-${notification.type}`}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
};

export default UserActivityNotification;
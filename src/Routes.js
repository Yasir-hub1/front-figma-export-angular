// src/Routes.js - CORREGIDO
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import Editor from './components/editor/Editor';
import NotFound from './components/common/NotFound';

// Componente de protección de rutas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  console.log('🔒 PrivateRoute: Verificando autenticación');
  console.log('- isAuthenticated():', isAuthenticated());
  console.log('- loading:', loading);
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Cargando...
      </div>
    );
  }
  
  const authenticated = isAuthenticated();
  console.log('✅ PrivateRoute: Usuario autenticado:', authenticated);
  
  return authenticated ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  console.log('🛣️ AppRoutes: Configurando rutas');
  
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Rutas protegidas */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />
      
      {/* CORRECCIÓN: Cambiar :id por :projectId */}
      <Route 
        path="/editor/:projectId" 
        element={
          <PrivateRoute>
            <Editor />
          </PrivateRoute>
        } 
      />
      
      {/* Rutas de redirección y 404 */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
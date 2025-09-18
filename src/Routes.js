// src/Routes.js - CORREGIDO
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { UMLProvider } from './context/UMLcontext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import UMLEditor from './components/editor/uml_editor';
import JoinProject from './components/JoinProject';
import NotFound from './components/common/NotFound';
import React, { useMemo } from 'react';
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

// Componente wrapper para UML Editor con Provider
// En Routes.js, cambia UMLEditorWithProvider por:
const UMLEditorWithProvider = React.memo(() => {
  const { projectId } = useParams();
  
  if (!projectId) {
    return (
      <div className="uml-editor-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error de navegación</h2>
          <p>No se pudo obtener el ID del proyecto de la URL</p>
          <button onClick={() => window.location.href = '/dashboard'}>
            Ir al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <UMLProvider projectId={projectId}>
      <UMLEditor />
    </UMLProvider>
  );
});

const AppRoutes = () => {
  console.log('🛣️ AppRoutes: Configurando rutas');
  
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/join-project/:shareToken" element={<JoinProject />} />
      
      {/* Rutas protegidas */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />
      
      {/* Ruta del Editor UML con Provider */}
      <Route
        path="/uml-editor/:projectId"
        element={
          <PrivateRoute>
            <UMLEditorWithProvider />
          </PrivateRoute>
        }
      />

      {/* Mantener compatibilidad con la ruta anterior si es necesaria */}
      <Route
        path="/editor/:projectId"
        element={
          <Navigate to={`/uml-editor/${window.location.pathname.split('/')[2]}`} replace />
        }
      />
      
      {/* Rutas de redirección y 404 */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar usuario del almacenamiento local al iniciar
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  // Función para registrar un nuevo usuario
  const register = async (username, email, password) => {
    setError(null);
    try {
      const data = await authService.register({ username, email, password });
      setCurrentUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Función para iniciar sesión
  const login = async (email, password) => {
    setError(null);
    try {
      const data = await authService.login({ email, password });
      setCurrentUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  // Función para actualizar el perfil de usuario
  const updateProfile = async (userData) => {
    setError(null);
    try {
      const data = await authService.updateUser(userData);
      setCurrentUser({ ...currentUser, ...data.user });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Función para cambiar la contraseña
  const changePassword = async (currentPassword, newPassword) => {
    setError(null);
    try {
      return await authService.changePassword({ currentPassword, newPassword });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: authService.isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
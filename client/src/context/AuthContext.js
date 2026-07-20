import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithPhone = useCallback(async (phone, password) => {
  setLoading(true);
  try {
    const { data } = await api.post('/auth/login-phone', { phone, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || 'Login failed' };
  } finally {
    setLoading(false);
  }
}, []);

const requestOTP = useCallback(async (phone) => {
  try {
    const { data } = await api.post('/auth/request-otp', { phone });
    return { success: true, message: data.message };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || 'Failed to send OTP' };
  }
}, []);

const verifyOTP = useCallback(async (phone, otp) => {
  setLoading(true);
  try {
    const { data } = await api.post('/auth/verify-otp', { phone, otp });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || 'Invalid OTP' };
  } finally {
    setLoading(false);
  }
}, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', payload);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
  <AuthContext.Provider value={{ user, login, register, logout, loading, loginWithPhone, requestOTP, verifyOTP }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

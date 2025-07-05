import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import './App.css';

const AppContent = () => {
  const { currentUser } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
  };

  if (currentUser) {
    return <Dashboard />;
  }

  return isLoginMode ? (
    <Login onToggleMode={toggleMode} />
  ) : (
    <Register onToggleMode={toggleMode} />
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;


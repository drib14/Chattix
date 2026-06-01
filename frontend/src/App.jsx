import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SplashScreen from './components/layout/SplashScreen';
import ConfirmModal from './components/layout/ConfirmModal';
import CreateGroupModal from './components/layout/CreateGroupModal';
import SettingsDrawer from './components/layout/SettingsDrawer';
import { Toaster } from 'react-hot-toast';

import { useEffect } from 'react';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (user && user.theme) {
      const themes = {
        'Classic Blue': { primary: '#0084FF', secondary: '#00c6ff', bg: '#0A0E17' },
        'Neon Purple': { primary: '#9d4edd', secondary: '#c77dff', bg: '#100c1a' },
        'Emerald Glass': { primary: '#10b981', secondary: '#34d399', bg: '#060f0e' },
        'Crimson Sunset': { primary: '#f43f5e', secondary: '#fda4af', bg: '#17070f' },
        'Cyberpunk Gold': { primary: '#f59e0b', secondary: '#fbbf24', bg: '#1c1917' },
      };
      const active = themes[user.theme];
      if (active) {
        document.documentElement.style.setProperty('--color-primary', active.primary);
        document.documentElement.style.setProperty('--color-primary-hover', `${active.primary}ee`);
        document.documentElement.style.setProperty('--color-secondary', active.secondary);
        document.documentElement.style.setProperty('--color-bg-dark', active.bg);
      }
    }
  }, [user]);

  return (
    <Router>
      <div className="App flex h-screen w-screen overflow-hidden relative">
        <SplashScreen />
        <Routes>
          <Route path="/" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
        </Routes>
        <ConfirmModal />
        <CreateGroupModal />
        <SettingsDrawer />
        <Toaster position="bottom-center" />
      </div>
    </Router>
  );
}

export default App;

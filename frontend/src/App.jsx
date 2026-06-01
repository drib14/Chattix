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

function App() {
  const { isAuthenticated } = useAuthStore();

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

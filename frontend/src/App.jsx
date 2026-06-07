import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ModernLoginPage from './pages/ModernLoginPage';
import ModernRegisterPage from './pages/ModernRegisterPage';
import ModernChatPage from './pages/ModernChatPage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import socketService from './services/socket';
import { setOnlineUsers } from './redux/slices/chatSlice';
import { setTheme } from './redux/slices/themeSlice';

function App() {
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setTheme());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);

      socketService.on('online_users', (users) => {
        dispatch(setOnlineUsers(Array.isArray(users) ? users : []));
      });

      return () => {
        socketService.off('online_users');
      };
    }

    socketService.disconnect();
  }, [isAuthenticated, token, dispatch]);

  return (
    <Routes>
      <Route
        path="/login"
        element={!isAuthenticated ? <ModernLoginPage /> : <Navigate to="/messages" />}
      />
      <Route
        path="/register"
        element={!isAuthenticated ? <ModernRegisterPage /> : <Navigate to="/messages" />}
      />
      <Route path="/verify-otp" element={<OTPVerificationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/messages"
        element={isAuthenticated ? <ModernChatPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/profile"
        element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />}
      />

      <Route path="/" element={<Navigate to={isAuthenticated ? '/messages' : '/login'} />} />
      <Route path="*" element={<Navigate to={isAuthenticated ? '/messages' : '/login'} />} />
    </Routes>
  );
}

export default App;

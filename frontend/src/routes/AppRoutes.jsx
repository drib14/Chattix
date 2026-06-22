import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Pages
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';

// Components
import SkeletalLoader from '../components/common/SkeletalLoader';
import SavedAccountsView from '../components/auth/SavedAccountsView';
import { useAppAuth } from '../contexts/AuthContext';

export default function AppRoutes() {
  const { dbUser, loading } = useAppAuth();

  if (loading) {
    return <SkeletalLoader />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={!dbUser ? <LoginPage /> : <Navigate to="/" />}
      />
      <Route
        path="/register"
        element={!dbUser ? <RegisterPage /> : <Navigate to="/" />}
      />
      <Route
        path="/saved"
        element={!dbUser ? <SavedAccountsView onContinueNew={() => window.location.assign('/login')} /> : <Navigate to="/" />}
      />
      <Route
        path="/c/:conversationId"
        element={dbUser ? <DashboardPage /> : <Navigate to="/saved" />}
      />
      <Route
        path="/"
        element={dbUser ? <DashboardPage /> : <Navigate to="/saved" />}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

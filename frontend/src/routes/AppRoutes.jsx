import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

// Pages
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';

// Components
import SkeletalLoader from '../components/common/SkeletalLoader';
import SavedAccountsView from '../components/auth/SavedAccountsView';

export default function AppRoutes() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <SkeletalLoader />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={!isSignedIn ? <LoginPage /> : <Navigate to="/" />}
      />
      <Route
        path="/register"
        element={!isSignedIn ? <RegisterPage /> : <Navigate to="/" />}
      />
      <Route
        path="/saved"
        element={!isSignedIn ? <SavedAccountsView onContinueNew={() => window.location.assign('/login')} /> : <Navigate to="/" />}
      />
      <Route
        path="/c/:conversationId"
        element={isSignedIn ? <DashboardPage /> : <Navigate to="/saved" />}
      />
      <Route
        path="/"
        element={isSignedIn ? <DashboardPage /> : <Navigate to="/saved" />}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

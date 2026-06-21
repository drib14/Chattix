import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useUser, useSession } from '@clerk/clerk-react';
import SplashPage from './pages/SplashPage';
import LoginRegister from './pages/LoginRegister';
import ModernChatPage from './pages/ModernChatPage';
import { setCredentials, logout } from './redux/slices/authSlice';

function App() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isSignedIn, isLoaded: clerkLoaded } = useUser();
  const { session } = useSession();
  
  const [splashFinished, setSplashFinished] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Sync Clerk Authentication with backend database user record
  useEffect(() => {
    const syncUser = async () => {
      if (isSignedIn && session) {
        setSyncing(true);
        try {
          const clerkToken = await session.getToken();
          localStorage.setItem('token', clerkToken);

          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${clerkToken}`
            }
          });
          const data = await res.json();
          if (data.success && data.user) {
            dispatch(setCredentials({ user: data.user, token: clerkToken }));
          }
        } catch (err) {
          console.error('Clerk session synchronization failed:', err);
        } finally {
          setSyncing(false);
        }
      } else if (clerkLoaded && !isSignedIn) {
        dispatch(logout());
      }
    };

    syncUser();
  }, [isSignedIn, session, clerkLoaded, dispatch]);

  // If splash loader is active, render it
  if (!splashFinished) {
    return <SplashPage onFinish={() => setSplashFinished(true)} />;
  }

  // Render main router once loading finishes
  return (
    <Routes>
      <Route
        path="/login"
        element={!isSignedIn ? <LoginRegister mode="login" /> : <Navigate to="/messages" />}
      />
      <Route
        path="/register"
        element={!isSignedIn ? <LoginRegister mode="register" /> : <Navigate to="/messages" />}
      />
      <Route
        path="/messages"
        element={isSignedIn ? <ModernChatPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/"
        element={<Navigate to={isSignedIn ? "/messages" : "/login"} />}
      />
      <Route
        path="*"
        element={<Navigate to={isSignedIn ? "/messages" : "/login"} />}
      />
    </Routes>
  );
}

export default App;

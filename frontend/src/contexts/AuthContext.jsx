import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [dbUser, setDbUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('chattix_token') || null);
  const [loading, setLoading] = useState(true);
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const fetchUser = useCallback(async (currentToken) => {
    if (!currentToken) {
      setDbUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data);
      } else {
        // Token invalid or expired
        setToken(null);
        setDbUser(null);
        localStorage.removeItem('chattix_token');
      }
    } catch (err) {
      console.error("Failed to fetch current user", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If we have a local token, use it
    if (token) {
      fetchUser(token);
    } else if (isSignedIn && user) {
      // If we don't have a local token but Clerk says we are signed in (Google OAuth),
      // we need to sync and get a local token.
      const syncWithGoogle = async () => {
        try {
          const clerkToken = await getToken();
          const res = await fetch(import.meta.env.VITE_API_URL + '/auth/google', {
            method: 'POST',
            headers: { Authorization: `Bearer ${clerkToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            login(data);
          } else {
            setLoading(false);
          }
        } catch (err) {
          console.error("Failed to sync Google auth", err);
          setLoading(false);
        }
      };
      syncWithGoogle();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser, isSignedIn, user, getToken]);

  const login = (userData) => {
    setToken(userData.token);
    setDbUser(userData);
    localStorage.setItem('chattix_token', userData.token);
  };

  const logout = () => {
    setToken(null);
    setDbUser(null);
    localStorage.removeItem('chattix_token');
  };

  return (
    <AuthContext.Provider value={{ dbUser, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAppAuth = () => useContext(AuthContext);

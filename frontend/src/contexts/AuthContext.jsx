import { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const syncUser = async () => {
      if (!user) return;

      try {
        setIsSyncing(true);
        const token = await getToken();

        await fetch(import.meta.env.VITE_API_URL + '/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.imageUrl,
            // Assuming username might be available from Clerk or defaults
            username: user.username || 'chattix_user'
          })
        });
      } catch (error) {
        console.error("Failed to sync user with backend:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    syncUser();
  }, [user, getToken]);

  return (
    <AuthContext.Provider value={{ isSyncing }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAppAuth = () => useContext(AuthContext);

import { create } from 'zustand';

interface AuthState {
  user: any;
  isAuthenticated: boolean;
  login: (userData: any) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => {
  const storedUser = localStorage.getItem('user');
  const initialUser = storedUser ? JSON.parse(storedUser) : null;

  return {
    user: initialUser,
    isAuthenticated: !!initialUser,
    login: (userData) => {
      localStorage.setItem('user', JSON.stringify(userData));
      set({ user: userData, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false });
    },
  };
});

export default useAuthStore;
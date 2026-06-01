import { create } from 'zustand';

const useAuthStore = create((set) => {
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

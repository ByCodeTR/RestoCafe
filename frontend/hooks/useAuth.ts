import { useRouter } from 'next/navigation';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';

interface AuthState {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
  hydrated: boolean;
  setHydrated: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      hydrated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

export const useAuth = () => {
  const router = useRouter();
  const { token, user, isAuthenticated, login, logout, hydrated, setHydrated } = useAuthStore();

  useEffect(() => {
    // Component mount edildiğinde localStorage'dan değerleri kontrol et
    if (typeof window !== 'undefined' && !hydrated) {
      const localToken = localStorage.getItem('token');
      const localUser = localStorage.getItem('user');
      
      if (localToken && localUser) {
        try {
          const userData = JSON.parse(localUser);
          login(localToken, userData);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setHydrated();
    }
  }, [hydrated, login, setHydrated]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    logout();
    router.push('/tablet/login');
  };

  return {
    token,
    user,
    isAuthenticated: isAuthenticated || (token && user),
    login,
    logout: handleLogout,
    hydrated,
  };
}; 
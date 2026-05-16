import { User } from '@/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  isRegistering: boolean;
  accessToken: string;
  user: User | null;
  isRefreshTokenExpired: boolean;
  refreshTokenErrorMessage: string;
  _hasHydrated: boolean;
}

interface AuthActions {
  setLoading: (value: boolean) => void;
  setIsLoggingIn: (value: boolean) => void;
  setIsRegistering: (value: boolean) => void;
  loginAction: (data: { accessToken: string; user: User }) => void;
  logoutAction: () => void;
  setUser: (user: User) => void;
  updateUser: (userData: Partial<User>) => void;
  setRefreshTokenExpired: (expired: boolean, message?: string) => void;
  resetAuthAction: () => void;
  fetchAccountAction: (user: User) => void;
  setHasHydrated: (state: boolean) => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  isLoggingIn: false,
  isRegistering: false,
  accessToken: '',
  user: null,
  isRefreshTokenExpired: false,
  refreshTokenErrorMessage: '',
  _hasHydrated: false,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setLoading: (value) => set({ isLoading: value }),

      setIsLoggingIn: (value) => set({ isLoggingIn: value }),

      setIsRegistering: (value) => set({ isRegistering: value }),

      loginAction: ({ accessToken, user }) => {
        // Mỗi lần đăng nhập mới phải xác minh PIN lại.
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pinUnlockedAt');
          sessionStorage.removeItem('journalPrivacyToken');
        }
        set({
          isAuthenticated: true,
          user,
          accessToken,
          isLoading: false,
          isLoggingIn: false,
          isRefreshTokenExpired: false,
          refreshTokenErrorMessage: '',
        });
      },

      logoutAction: () => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pinUnlockedAt');
          sessionStorage.removeItem('journalPrivacyToken');
        }
        set({
          ...initialState,
          isLoading: false,
          _hasHydrated: true,
        });
      },

      setUser: (user) => {
        set({ user });
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      setRefreshTokenExpired: (expired, message = '') => {
        set({
          isRefreshTokenExpired: expired,
          refreshTokenErrorMessage: message,
        });
        if (expired) {
          set({
            isAuthenticated: false,
            accessToken: '',
            user: null,
            isLoading: false,
          });
        }
      },

      resetAuthAction: () => {
        set({
          ...initialState,
          isLoading: false,
          _hasHydrated: true,
        });
      },

      fetchAccountAction: (user) => {
        const currentToken = get().accessToken;
        set({
          isAuthenticated: true,
          user,
          accessToken: currentToken,
          isLoading: false,
        });
      },

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);


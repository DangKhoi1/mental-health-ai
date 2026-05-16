'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { userService } from '@/services/user';
import { useAppRouter } from '@/hooks/useAppRouter';
import { toast } from 'sonner';
import { User } from '@/types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    setLoading,
    fetchAccountAction,
    resetAuthAction,
    isRefreshTokenExpired,
    refreshTokenErrorMessage,
    setRefreshTokenExpired,
    _hasHydrated,
    isAuthenticated,
  } = useAuthStore();

  const pathname = usePathname();
  const { goLogin, replace } = useAppRouter();

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      const isPublicRoute =
        pathname === '/' ||
        pathname === '/trangchu' ||
        pathname === '/auth/login' ||
        pathname === '/auth/register';

      if (isPublicRoute) {
        replace('/dashboard');
      }
    }
  }, [_hasHydrated, isAuthenticated, pathname, replace]);

  useEffect(() => {
    if (!_hasHydrated) return;

    const fetchAccount = async () => {
      const currentToken = useAuthStore.getState().accessToken;

      if (currentToken) {
        try {
          const user = await userService.getProfile();
          if (user) {
            fetchAccountAction(user);
          } else {
            resetAuthAction();
          }
        } catch (error) {
          console.error('Failed to fetch account:', error);
          resetAuthAction();
        }
      } else {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [_hasHydrated, fetchAccountAction, resetAuthAction, setLoading]);

  useEffect(() => {
    if (isRefreshTokenExpired) {
      toast.error(refreshTokenErrorMessage || 'Phiên đăng nhập đã hết hạn');

      setRefreshTokenExpired(false);

      goLogin();
    }
  }, [isRefreshTokenExpired, refreshTokenErrorMessage, setRefreshTokenExpired, goLogin]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncAuthAcrossTabs = (event: StorageEvent) => {
      if (event.key !== 'auth-storage') return;

      if (!event.newValue) {
        resetAuthAction();
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue) as {
          state?: {
            isAuthenticated?: boolean;
            accessToken?: string;
            user?: User | null;
          };
        };

        const persistedState = parsed.state;

        if (!persistedState?.isAuthenticated || !persistedState.accessToken) {
          resetAuthAction();
          return;
        }

        useAuthStore.setState((currentState) => ({
          ...currentState,
          isAuthenticated: true,
          accessToken: persistedState.accessToken,
          user: persistedState.user ?? null,
          isLoading: false,
          isRefreshTokenExpired: false,
          refreshTokenErrorMessage: '',
          _hasHydrated: true,
        }));
      } catch (error) {
        console.error('Failed to sync auth state across tabs:', error);
        resetAuthAction();
      }
    };

    window.addEventListener('storage', syncAuthAcrossTabs);

    return () => {
      window.removeEventListener('storage', syncAuthAcrossTabs);
    };
  }, [resetAuthAction]);

  return <>{children}</>;
}


import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  
  theme: 'light' | 'dark' | 'system';
  
  isGlobalLoading: boolean;
  loadingMessage: string;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      isSidebarCollapsed: false,
      theme: 'light',
      isGlobalLoading: false,
      loadingMessage: '',

      toggleSidebar: () => set((state) => ({ 
        isSidebarOpen: !state.isSidebarOpen 
      })),
      
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      
      toggleSidebarCollapse: () => set((state) => ({ 
        isSidebarCollapsed: !state.isSidebarCollapsed 
      })),
      
      setTheme: (theme) => set({ theme }),
      
      setGlobalLoading: (loading, message = '') => set({ 
        isGlobalLoading: loading, 
        loadingMessage: message 
      }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);

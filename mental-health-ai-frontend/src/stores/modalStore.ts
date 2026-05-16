import { create } from 'zustand';

interface ModalStore {
  isLoginModalOpen: boolean;
  isRegisterModalOpen: boolean;
  
  isConfirmModalOpen: boolean;
  confirmModalConfig: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null;

  openLoginModal: () => void;
  closeLoginModal: () => void;
  openRegisterModal: () => void;
  closeRegisterModal: () => void;
  switchToRegister: () => void;
  switchToLogin: () => void;
  
  openConfirmModal: (config: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
  closeConfirmModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  isLoginModalOpen: false,
  isRegisterModalOpen: false,
  isConfirmModalOpen: false,
  confirmModalConfig: null,

  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
  
  openRegisterModal: () => set({ isRegisterModalOpen: true }),
  closeRegisterModal: () => set({ isRegisterModalOpen: false }),
  
  switchToRegister: () => set({ 
    isLoginModalOpen: false, 
    isRegisterModalOpen: true 
  }),
  
  switchToLogin: () => set({ 
    isRegisterModalOpen: false, 
    isLoginModalOpen: true 
  }),

  openConfirmModal: (config) => set({ 
    isConfirmModalOpen: true, 
    confirmModalConfig: config 
  }),
  
  closeConfirmModal: () => set({ 
    isConfirmModalOpen: false, 
    confirmModalConfig: null 
  }),
}));

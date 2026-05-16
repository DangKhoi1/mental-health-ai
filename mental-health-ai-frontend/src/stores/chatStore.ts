import { create } from 'zustand';

interface ChatStore {
    isOpen: boolean;
    initialMessage: string | null;
    context: Record<string, unknown> | undefined;
    openChat: (message?: string, context?: Record<string, unknown>) => void;
    closeChat: () => void;
    setInitialMessage: (message: string | null) => void;
    setContext: (context: Record<string, unknown>) => void;
    toggleChat: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
    isOpen: false,
    initialMessage: null,
    context: undefined,
    openChat: (message, context) => set((state) => ({ 
        isOpen: true, 
        initialMessage: message || state.initialMessage,
        context: context || state.context
    })),
    closeChat: () => set({ isOpen: false }),
    setInitialMessage: (message) => set({ initialMessage: message }),
    setContext: (context) => set({ context }),
    toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
}));

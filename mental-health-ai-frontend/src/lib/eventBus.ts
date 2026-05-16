type Listener = () => void;
const listeners: Record<string, Set<Listener>> = {};

export const eventBus = {
  on(event: string, listener: Listener) {
    if (!listeners[event]) listeners[event] = new Set();
    listeners[event].add(listener);
    return () => listeners[event]?.delete(listener);
  },
  emit(event: string) {
    listeners[event]?.forEach((l) => l());
  },
};

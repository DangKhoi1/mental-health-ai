import { create } from 'zustand';

export interface Track {
    id: number;
    title: string;
    url: string;
}

interface MusicState {
    isOpen: boolean;
    isPlaying: boolean;
    volume: number;
    currentTrack: Track;
    setIsOpen: (isOpen: boolean) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setVolume: (volume: number) => void;
    setCurrentTrack: (track: Track) => void;
    toggleOpen: () => void;
    togglePlay: () => void;
}

export const useMusicStore = create<MusicState>((set) => ({
    isOpen: false,
    isPlaying: false,
    volume: 0.2,
    currentTrack: {
        id: 1,
        title: 'Tiếng Mưa Rơi (Rain)',
        url: '/tiengmuaroi.mp3',
    },
    setIsOpen: (isOpen) => set({ isOpen }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setVolume: (volume) => set({ volume }),
    setCurrentTrack: (track) => set({ currentTrack: track }),
    toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
}));

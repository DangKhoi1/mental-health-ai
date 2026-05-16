'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Music, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores';
import { useMusicStore } from '@/stores/musicStore';
import { usePathname } from 'next/navigation';
import { useDraggable } from '@/hooks/useDraggable';
import { MusicPlayer } from './MusicPlayer';

export function FloatingActionMenu() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { toggleChat } = useChatStore();
    const { toggleOpen: toggleMusic, setIsOpen: setMusicOpen, isOpen: isMusicOpen, isPlaying } = useMusicStore();
    const menuRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    
    const { style, onMouseDown, onClickCapture, elementRef } = useDraggable<HTMLDivElement>('floating_action_menu_pos');

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent | TouchEvent) {
            // Do not close if dragging just ended (handled by click capture)
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                // If the user clicked outside the menu, but maybe they clicked inside the popup?
                // The popup is inside the menuRef! So if it's outside popup too, it closes.
                setIsMenuOpen(false);
                setMusicOpen(false);
            }
        }
        if (isMenuOpen || isMusicOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        }
    }, [isMenuOpen, isMusicOpen, setMusicOpen]);

    // Close menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
        setMusicOpen(false);
    }, [pathname, setMusicOpen]);

    return (
        <div 
            ref={(el) => {
                if (el) {
                    // @ts-expect-error - assigning to ref
                    menuRef.current = el;
                    // Because elementRef from useDraggable expects an object or callback: 
                    // Actually useDraggable returns elementRef as a RefObject, we have to attach it properly
                    // Let's just assign current
                    elementRef.current = el;
                }
            }}
            style={style}
            onMouseDown={onMouseDown}
            onTouchStart={onMouseDown}
            onClickCapture={onClickCapture}
            className="fixed bottom-6 right-6 z-[95]"
        >
            <MusicPlayer />

            {/* Expanded items */}
            {isMenuOpen && (
                <div className="absolute bottom-[calc(100%+12px)] right-0 flex flex-col gap-3 animate-in slide-in-from-bottom-2 fade-in zoom-in-95 origin-bottom duration-200">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMusic();
                            setIsMenuOpen(false);
                        }}
                        className={cn(
                            "w-12 h-12 flex items-center justify-center rounded-full bg-card shadow-[0_8px_20px_rgba(0,0,0,0.15)] transition-colors border border-border relative",
                            isPlaying ? "text-primary bg-primary/10" : "text-primary hover:bg-primary/10"
                        )}
                        aria-label="Mở Nhạc"
                    >
                        <div className="relative">
                            <Music className="w-5 h-5" />
                            {isPlaying && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                            )}
                        </div>
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleChat();
                            setIsMenuOpen(false);
                        }}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-card shadow-[0_8px_20px_rgba(0,0,0,0.15)] text-primary hover:bg-primary/10 transition-colors border border-border"
                        aria-label="Mở Chatbot"
                    >
                        <Bot className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Main Toggle FAB */}
            <button
                data-drag-handle="true"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                    "w-12 h-12 touch-none cursor-grab active:cursor-grabbing flex items-center justify-center rounded-full text-primary-foreground shadow-[0_8px_20px_rgba(142,179,122,0.3)] hover:shadow-[0_12px_25px_rgba(142,179,122,0.4)] transition-all duration-300 active:scale-95 relative",
                    isPlaying
                        ? "bg-primary animate-pulse-subtle"
                        : "bg-primary hover:bg-primary/90"
                )}
                aria-label="Tiện Ích AI"
            >
                {isPlaying ? (
                    <div className="flex gap-0.5 items-end h-4">
                        <div className="w-1 bg-white/90 animate-[bounce_1s_infinite] h-full rounded-full" />
                        <div className="w-1 bg-white/70 animate-[bounce_1s_infinite_100ms] h-3/4 rounded-full" />
                        <div className="w-1 bg-white/80 animate-[bounce_1s_infinite_200ms] h-full rounded-full" />
                        <div className="w-1 bg-white/60 animate-[bounce_1s_infinite_300ms] h-1/2 rounded-full" />
                    </div>
                ) : (
                    <div className={cn("transition-transform duration-300", isMenuOpen ? "rotate-45" : "rotate-0")}>
                        <Sparkles className="w-6 h-6" />
                    </div>
                )}
                {isPlaying && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white animate-ping" />
                )}
            </button>
        </div>
    );
}

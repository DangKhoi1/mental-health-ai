'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Music, Volume2, VolumeX, ListMusic, X, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMusicStore } from '@/stores/musicStore';

const TRACKS = [
    {
        id: 1,
        title: 'Tiếng Mưa Rơi (Rain)',
        url: '/tiengmuaroi.mp3',
    },
    {
        id: 2,
        title: 'Nhạc Lofi Thư Giãn',
        url: '/lofi_hour-wish-you-were-here-118975.mp3',
    },
    {
        id: 3,
        title: 'Piano Nhẹ Nhàng',
        url: '/atlasaudio-soft-509813.mp3',
    },
    {
        id: 4,
        title: 'Âm Thanh Thiên Nhiên Tĩnh Lặng',
        url: '/38534292-river-with-faraway-bird-sounds-low-water-flowing-sounds-161873.mp3',
    },
];

export function MusicPlayer() {
    const { 
        isOpen, setIsOpen, 
        isPlaying, setIsPlaying, 
        volume, setVolume, 
        currentTrack, setCurrentTrack,
        togglePlay: storeTogglePlay
    } = useMusicStore();
    
    const [isMuted, setIsMuted] = useState(false);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const audioReadyRef = useRef(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize from local storage
    useEffect(() => {
        const savedTrackId = localStorage.getItem('relaxMusicIndex');
        if (savedTrackId) {
            const track = TRACKS.find(t => t.id === parseInt(savedTrackId, 10));
            if (track) setCurrentTrack(track);
        }

        const savedVol = localStorage.getItem('relaxMusicVol');
        if (savedVol) {
            setVolume(parseFloat(savedVol));
        }
    }, [setCurrentTrack, setVolume]);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el || !showPlaylist) return;
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            el.scrollBy({ top: e.deltaY > 0 ? 36 : -36, behavior: 'smooth' });
        };
        el.addEventListener('wheel', handleWheel, { passive: false });
        
        // Initial scroll sync when opening playlist
        const idx = TRACKS.findIndex(t => t.id === currentTrack.id);
        if (idx >= 0) {
            el.scrollTop = idx * 36;
        }
        
        return () => el.removeEventListener('wheel', handleWheel);
    }, [showPlaylist, currentTrack.id]);

    // Initialize audio element - always keep it alive
    useEffect(() => {
        const audio = new Audio(currentTrack.url);
        audio.loop = true;
        audio.volume = volume;
        audioRef.current = audio;
        audioReadyRef.current = true;

        return () => {
            audio.pause();
            audio.src = '';
            audioRef.current = null;
            audioReadyRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // Sync audio when track changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.src = currentTrack.url;
            audioRef.current.load();
            // If should be playing, start playing the new track
            if (isPlaying) {
                audioRef.current.play().catch(() => {});
            }
        }
        localStorage.setItem('relaxMusicIndex', currentTrack.id.toString());
    }, [currentTrack]);

    // Sync volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
        localStorage.setItem('relaxMusicVol', volume.toString());
    }, [volume]);

    // Handle play/pause - runs whenever isPlaying changes
    useEffect(() => {
        if (!audioRef.current || !audioReadyRef.current) return;

        let handleInteract: (() => void) | null = null;

        if (isPlaying) {
            const tryPlay = async () => {
                try {
                    await audioRef.current?.play();
                } catch (e) {
                    // If play blocked, listen for user interaction and try again
                    handleInteract = () => {
                        audioRef.current?.play().catch(() => {});
                        document.removeEventListener('click', handleInteract!);
                        document.removeEventListener('touchstart', handleInteract!);
                        handleInteract = null;
                    };
                    document.addEventListener('click', handleInteract);
                    document.addEventListener('touchstart', handleInteract, { passive: true });
                }
            };
            tryPlay();
        } else {
            audioRef.current.pause();
        }

        return () => {
            if (handleInteract) {
                document.removeEventListener('click', handleInteract);
                document.removeEventListener('touchstart', handleInteract);
            }
        };
    }, [isPlaying]);

    const handleTogglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.log('Play prevented', e));
        }
        storeTogglePlay();
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        if (isMuted) {
            audioRef.current.muted = false;
            setIsMuted(false);
            if (volume === 0) setVolume(0.5);
        } else {
            audioRef.current.muted = true;
            setIsMuted(true);
        }
    };

    const playNext = () => {
        const currentIndex = TRACKS.findIndex(t => t.id === currentTrack.id);
        const nextIndex = (currentIndex + 1) % TRACKS.length;
        setCurrentTrack(TRACKS[nextIndex]);
    };

    const playPrev = () => {
        const currentIndex = TRACKS.findIndex(t => t.id === currentTrack.id);
        const prevIndex = (currentIndex - 1 + TRACKS.length) % TRACKS.length;
        setCurrentTrack(TRACKS[prevIndex]);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        if (audioRef.current) {
            audioRef.current.muted = false;
        }
    };

    // Keep audio element alive (don't unmount) - only hide UI when !isOpen
    // This ensures music continues playing even when player is closed

    return (
        <div className={cn(
            "absolute bottom-[calc(100%+12px)] right-0 mb-3 w-72 h-auto bg-card/85 backdrop-blur-2xl border border-border/50 shadow-[0_12px_40px_rgba(142,179,122,0.15)] rounded-3xl animate-in fade-in zoom-in-95 origin-bottom-right duration-300",
            !isOpen && "hidden"
        )}>
            <div className="p-4 bg-primary/5 flex items-center justify-between border-b border-border/50">
                        <div className="flex items-center gap-2">
                            <Music className="size-4 text-primary" />
                            <h3 className="text-sm font-medium text-foreground">Góc Thư Giãn</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                            <X className="size-4" />
                        </button>
                    </div>

                    <div className="p-4 space-y-4">
                        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/40 text-center">
                            {isPlaying ? (
                                <div className="mt-1 flex gap-1 items-end h-4 mb-2">
                                    <div className="w-1 bg-primary/70 animate-[bounce_1s_infinite] h-full" />
                                    <div className="w-1 bg-primary animate-[bounce_1s_infinite_100ms] h-3/4" />
                                    <div className="w-1 bg-primary/50 animate-[bounce_1s_infinite_200ms] h-full" />
                                    <div className="w-1 bg-primary/80 animate-[bounce_1s_infinite_300ms] h-2/3" />
                                </div>
                            ) : (
                                <Music className="size-6 text-primary mb-2 opacity-50" />
                            )}
                            <p className="text-sm font-medium text-foreground truncate w-full">{currentTrack.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Nhạc nền thả lỏng tâm trí</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={playPrev}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
                                >
                                    <SkipBack className="size-5" fill="currentColor" />
                                </button>

                                <button
                                    onClick={handleTogglePlay}
                                    className="size-12 flex items-center justify-center shadow-md rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95"
                                >
                                    {isPlaying ? <Pause className="size-5" fill="currentColor" /> : <Play className="size-5 ml-1" fill="currentColor" />}
                                </button>

                                <button
                                    onClick={playNext}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
                                >
                                    <SkipForward className="size-5" fill="currentColor" />
                                </button>
                            </div>

                            {/* Volume Control */}
                            <div className="flex items-center gap-2 mt-1 px-1">
                                <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                                    {isMuted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-center pt-2 border-t border-border">

                            <div className="relative">
                                <button
                                    onClick={() => setShowPlaylist(!showPlaylist)}
                                    className={cn(
                                        "size-8 flex items-center justify-center rounded-full transition-colors",
                                        showPlaylist ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                    )}
                                >
                                    <ListMusic className="size-4" />
                                </button>
                            </div>
                        </div>

                        {/* Scroll-snap Drum Picker Playlist */}
                        {showPlaylist && (
                            <div className="border-t border-border/50 pt-2 mt-1 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between px-1 pb-1.5">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Chọn nhạc</p>
                                    <button onClick={() => setShowPlaylist(false)} className="text-muted-foreground hover:text-foreground p-0.5 rounded">
                                        <X className="size-3.5" />
                                    </button>
                                </div>

                                {/* Drum picker container */}
                                <div className="relative mx-1">
                                    {/* Active track highlight bar */}
                                    <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-9 bg-primary/10 rounded-xl border border-primary/20 z-10" />
                                    {/* Fade top */}
                                    <div className="pointer-events-none absolute top-0 inset-x-0 h-8 bg-linear-to-b from-card/85 to-transparent z-20" />
                                    {/* Fade bottom */}
                                    <div className="pointer-events-none absolute bottom-0 inset-x-0 h-8 bg-linear-to-t from-card/85 to-transparent z-20" />

                                    <div
                                        className="overflow-y-auto h-[108px] scroll-smooth"
                                        style={{ scrollSnapType: 'y mandatory', scrollbarWidth: 'none' }}
                                        ref={scrollContainerRef}
                                    >
                                        {/* Padding spacers so active item centers */}
                                        <div style={{ height: 36 }} />
                                        {TRACKS.map(track => (
                                            <div
                                                key={track.id}
                                                role="button"
                                                tabIndex={0}
                                                style={{ scrollSnapAlign: 'center', scrollSnapStop: 'always', height: 36 }}
                                                onClick={() => {
                                                    setCurrentTrack(track);
                                                    if (!isPlaying) setIsPlaying(true);
                                                    setShowPlaylist(false);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        setCurrentTrack(track);
                                                        if (!isPlaying) setIsPlaying(true);
                                                        setShowPlaylist(false);
                                                    }
                                                }}
                                                className={cn(
                                                    'flex items-center gap-2 px-3 cursor-pointer rounded-xl transition-all duration-200 select-none',
                                                    currentTrack.id === track.id
                                                        ? 'text-primary font-semibold scale-[1.03]'
                                                        : 'text-muted-foreground/70 font-medium text-sm scale-95'
                                                )}
                                            >
                                                <div className="w-4 flex justify-center shrink-0">
                                                    {currentTrack.id === track.id
                                                        ? <Music className="size-3.5 text-primary" />
                                                        : <span className="text-[10px] opacity-50">{track.id}</span>
                                                    }
                                                </div>
                                                <span className="truncate">{track.title}</span>
                                            </div>
                                        ))}
                                        <div style={{ height: 36 }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
    );
}

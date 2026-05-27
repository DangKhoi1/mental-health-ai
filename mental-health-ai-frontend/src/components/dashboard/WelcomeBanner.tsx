'use client';

import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import Image from 'next/image';

interface WelcomeBannerProps {
    userName?: string;
    streakDays?: number;
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'Chào buổi sáng', emoji: '🌅' };
    if (hour >= 12 && hour < 18) return { text: 'Chào buổi chiều', emoji: '☀️' };
    if (hour >= 18 && hour < 22) return { text: 'Chào buổi tối', emoji: '🌙' };
    return { text: 'Chào đêm khuya', emoji: '✨' };
}

export default function WelcomeBanner({ userName, streakDays = 0 }: WelcomeBannerProps) {
    const greeting = useMemo(() => getGreeting(), []);

    return (
        <div className="relative rounded-4xl p-6 lg:p-10 text-white shadow-xl shadow-sky-900/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 overflow-hidden bg-linear-to-br from-primary via-primary/80 to-sky-600/60 group border border-white/10">
            {/* Background Texture/Decorative elements */}
            <div className="absolute top-0 right-0 size-full opacity-20 pointer-events-none transition-transform duration-1000 group-hover:scale-110">
                <Image
                    src="/nature_bg.png"
                    alt="Nature scenery"
                    fill
                    className="size-full object-cover object-right mix-blend-overlay" />
            </div>
            
            <div className="absolute -left-10 -top-10 size-40 bg-white/20 blur-[60px] rounded-full pointer-events-none animate-pulse-soft" />
            <div className="absolute right-20 bottom-0 w-60 h-20 bg-sky-400/20 blur-[50px] -rotate-12 pointer-events-none animate-float" />

            <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 text-[10px] font-bold tracking-widest uppercase mb-1 shadow-sm animate-in slide-in-from-left duration-700">
                    <span className="animate-[pulse_2s_ease-in-out_infinite]-subtle">{greeting.emoji}</span> {greeting.text}
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white drop-shadow-lg">
                    Chào bạn, <span className="text-sky-100 italic relative inline-block">
                        {userName ? userName.trim().split(' ').pop() : 'Bạn'}
                        <span className="absolute -bottom-1 left-0 w-full h-1 bg-white/30 rounded-full blur-[1px]" />
                    </span> 
                </h1>
                <p className="text-white/90 text-base sm:text-lg font-medium max-w-lg leading-relaxed drop-shadow-sm opacity-90">
                    Khám phá sự bình yên trong tâm hồn và bắt đầu hành trình chăm sóc bản thân hôm nay.
                </p>
            </div>

            {streakDays > 0 && (
                <div className="relative z-10 shrink-0 flex items-center gap-3 bg-white/10 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/25 self-start sm:self-auto shadow-lg shadow-black/5 hover:bg-white/15 transition-all duration-300">
                    <div className="size-12 rounded-2xl bg-orange-400/20 flex items-center justify-center">
                        <Flame className="size-6 text-orange-300 fill-orange-300 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold leading-none text-white tracking-tight">{streakDays}</p>
                        <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest mt-1">Ngày liên tiếp</p>
                    </div>
                </div>
            )}
        </div>
    );
}

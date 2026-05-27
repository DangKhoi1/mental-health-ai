'use client';

import { DailyMood, WorkloadLevel } from '@/types';
import DailyMoodListSkeleton from './DailyMoodListSkeleton';
import { Trash2, Smile, Clock3, Briefcase, Pencil, Flame, HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';

type MoodTheme = {
    glow: string; gradient: string; shadow: string;
    card: string; badge: string; subBadge: string;
    button: string; icon: string;
};

type MoodConfig = { emoji: string; label: string; theme: MoodTheme };

const themes: Record<string, MoodTheme> = {
    rose: { glow: 'bg-rose-500/10', gradient: 'from-rose-500/10 via-transparent to-rose-500/5', shadow: 'hover:shadow-rose-500/10', card: 'border-rose-500/20 bg-rose-500/5', badge: 'border-rose-500/20 bg-rose-500/10 text-rose-500', subBadge: 'border-rose-500/20 bg-rose-500/5 text-muted-foreground', button: 'border-rose-500/20 bg-rose-500/5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500', icon: 'text-rose-500' },
    orange: { glow: 'bg-orange-500/10', gradient: 'from-orange-500/10 via-transparent to-orange-500/5', shadow: 'hover:shadow-orange-500/10', card: 'border-orange-500/20 bg-orange-500/5', badge: 'border-orange-500/20 bg-orange-500/10 text-orange-500', subBadge: 'border-orange-500/20 bg-orange-500/5 text-muted-foreground', button: 'border-orange-500/20 bg-orange-500/5 text-muted-foreground hover:bg-orange-500/10 hover:text-orange-500', icon: 'text-orange-500' },
    amber: { glow: 'bg-amber-500/10', gradient: 'from-amber-500/10 via-transparent to-amber-500/5', shadow: 'hover:shadow-amber-500/10', card: 'border-amber-500/20 bg-amber-500/5', badge: 'border-amber-500/20 bg-amber-500/10 text-amber-500', subBadge: 'border-amber-500/20 bg-amber-500/5 text-muted-foreground', button: 'border-amber-500/20 bg-amber-500/5 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500', icon: 'text-amber-500' },
    emerald: { glow: 'bg-emerald-500/10', gradient: 'from-emerald-500/10 via-transparent to-emerald-500/5', shadow: 'hover:shadow-emerald-500/10', card: 'border-emerald-500/20 bg-emerald-500/5', badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500', subBadge: 'border-emerald-500/20 bg-emerald-500/5 text-muted-foreground', button: 'border-emerald-500/20 bg-emerald-500/5 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500', icon: 'text-emerald-500' },
    teal: { glow: 'bg-teal-500/10', gradient: 'from-teal-500/10 via-transparent to-teal-500/5', shadow: 'hover:shadow-teal-500/10', card: 'border-teal-500/20 bg-teal-500/5', badge: 'border-teal-500/20 bg-teal-500/10 text-teal-500', subBadge: 'border-teal-500/20 bg-teal-500/5 text-muted-foreground', button: 'border-teal-500/20 bg-teal-500/5 text-muted-foreground hover:bg-teal-500/10 hover:text-teal-500', icon: 'text-teal-500' },
};

const moodConfig: Record<number, MoodConfig> = {
    1: { emoji: '😢', label: 'Rất tệ', theme: themes.rose },
    2: { emoji: '😢', label: 'Rất tệ', theme: themes.rose },
    3: { emoji: '😔', label: 'Tệ', theme: themes.orange },
    4: { emoji: '😔', label: 'Tệ', theme: themes.orange },
    5: { emoji: '😐', label: 'Bình thường', theme: themes.amber },
    6: { emoji: '😐', label: 'Bình thường', theme: themes.amber },
    7: { emoji: '😊', label: 'Tốt', theme: themes.emerald },
    8: { emoji: '😊', label: 'Tốt', theme: themes.emerald },
    9: { emoji: '😄', label: 'Rất tốt', theme: themes.teal },
    10: { emoji: '😄', label: 'Rất tốt', theme: themes.teal },
};

const workloadLabels: Record<WorkloadLevel, string> = {
    [WorkloadLevel.LOW]: 'Nhẹ nhàng',
    [WorkloadLevel.MEDIUM]: 'Vừa phải',
    [WorkloadLevel.HIGH]: 'Áp lực cao',
};

const getStressTone = (stress: number) => {
    if (stress <= 3) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (stress <= 6) return 'text-amber-500 bg-amber-500/15 border-amber-500/20';
    if (stress <= 8) return 'text-orange-500 bg-orange-500/15 border-orange-500/20';
    return 'text-rose-500 bg-rose-500/15 border-rose-500/20';
};

const getStressLabel = (stress: number) => {
    if (stress <= 3) return 'Thấp';
    if (stress <= 6) return 'Vừa';
    if (stress <= 8) return 'Cao';
    return 'Rất cao';
};

interface DailyMoodListProps {
    moods: DailyMood[];
    isLoading: boolean;
    onDelete: (id: string) => void;
    onSelect: (mood: DailyMood) => void;
    onEdit: (mood: DailyMood) => void;
}

export default function DailyMoodList({ moods, isLoading, onDelete, onSelect, onEdit }: DailyMoodListProps) {
    if (isLoading) {
        return <DailyMoodListSkeleton />;
    }

    if (moods.length === 0) {
        return (
            <div suppressHydrationWarning className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card rounded-3xl border border-border shadow-sm">
                <div className="size-20 mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center animate-pulse">
                    <Smile className="size-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                    Chưa có nhật ký tâm trạng
                </h3>
                <p className="text-muted-foreground max-w-xs mx-auto mb-6">
                    Hãy bắt đầu ghi lại cảm xúc của bạn mỗi ngày để theo dõi sức khỏe tinh thần nhé!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">

            {moods.map((mood) => {
                const config = moodConfig[mood.moodScore] || moodConfig[5];
                const date = new Date(mood.createdAt);

                const isToday = new Date().toDateString() === date.toDateString();

                return (
                    <div
                        key={mood.dailyMoodId}
                        className={cn("group relative overflow-hidden rounded-3xl border border-border bg-card text-foreground shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer", config.theme.shadow)}
                        onClick={() => onSelect(mood)}
                    >
                        <div className={cn('absolute inset-0 bg-linear-to-br pointer-events-none', config.theme.gradient)} />
                        <div className={cn("absolute -top-14 -right-14 size-48 rounded-full blur-3xl pointer-events-none", config.theme.glow)} />

                        <div className="relative p-5 md:p-6">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className={cn('size-14 rounded-2xl border flex items-center justify-center text-2xl shrink-0', config.theme.badge.split(' ').slice(0,2).join(' '))} style={{ border: 'none' }}>
                                        {config.emoji}
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{date.toLocaleDateString('vi-VN', { weekday: 'long' })}</p>
                                        <p suppressHydrationWarning className="text-base font-semibold">{date.toLocaleDateString('vi-VN')}</p>
                                        <div suppressHydrationWarning className="mt-1 flex items-center gap-2">
                                            <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold', config.theme.badge)}>
                                                {config.label} · {mood.moodScore}/10
                                            </span>
                                            {isToday && (
                                                <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold", config.theme.badge)}>Hôm nay</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold", config.theme.subBadge)}>
                                        <Clock3 className="size-3.5" />
                                        {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isToday ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(mood);
                                            }}
                                            className={cn("rounded-xl border p-2 transition", config.theme.button)}
                                            title="Sửa bản ghi (Chỉ trong ngày)"
                                        >
                                            <Pencil className="size-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(mood.dailyMoodId);
                                            }}
                                            className={cn("rounded-xl border p-2 transition", config.theme.button)}
                                            title="Xóa bản ghi"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <div className={cn("rounded-2xl border p-3", config.theme.card)}>
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Flame className={cn("size-3.5", config.theme.icon)} />Stress</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-bold', getStressTone(mood.stressLevel))}>
                                            {mood.stressLevel}/10 · {getStressLabel(mood.stressLevel)}
                                        </span>
                                    </div>
                                </div>

                                <div className={cn("rounded-2xl border p-3", config.theme.card)}>
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Briefcase className={cn("size-3.5", config.theme.icon)} />Khối lượng công việc</p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">{mood.workloadLevel ? workloadLabels[mood.workloadLevel] : 'Không có'}</p>
                                </div>

                                <div className={cn("rounded-2xl border p-3", config.theme.card)}>
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><HeartPulse className={cn("size-3.5", config.theme.icon)} />Tổng quan</p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">{config.label}</p>
                                </div>
                            </div>

                            <div className="mt-4 border-t border-border pt-4">
                                <p className="text-sm italic text-muted-foreground line-clamp-2">
                                    {mood.note || 'Không có ghi chú thêm'}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}


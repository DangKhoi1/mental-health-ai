'use client';

import { useState } from 'react';
import { ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCard {
    label: string;
    value: number;
    maxValue?: number;
    unit?: string;
    description?: string;
}

interface StatsGridProps {
    stats: StatCard[];
    isLoading?: boolean;
}

const statMeta: Record<string, { icon: string; color: string; gradient: string; tip: string }> = {
    'Tâm trạng trung bình': {
        icon: '😊',
        color: 'text-amber-500',
        gradient: 'from-amber-400/20 to-orange-400/20 border-amber-300/40',
        tip: 'Thang điểm 1-10',
    },
    'Bài nhật ký gần đây': {
        icon: '📝',
        color: 'text-orange-500',
        gradient: 'from-orange-400/20 to-amber-400/20 border-orange-300/40',
        tip: 'Số bài đã viết',
    },
    'Ngủ đêm trung bình': {
        icon: '🌙',
        color: 'text-indigo-500',
        gradient: 'from-indigo-400/20 to-purple-400/20 border-indigo-300/40',
        tip: 'Giờ/đêm',
    },
    'Chất lượng ngủ đêm trung bình': {
        icon: '✨',
        color: 'text-purple-500',
        gradient: 'from-purple-400/20 to-pink-400/20 border-purple-300/40',
        tip: 'Thang điểm 1-10',
    },
    'Số ngày có ngủ đêm': {
        icon: '📅',
        color: 'text-blue-500',
        gradient: 'from-blue-400/20 to-cyan-400/20 border-blue-300/40',
        tip: 'Trong 7 ngày',
    },
    'Số lần ngủ trưa': {
        icon: '😴',
        color: 'text-sky-500',
        gradient: 'from-sky-400/20 to-blue-400/20 border-sky-300/40',
        tip: 'Trong 7 ngày',
    },
    'Thời lượng ngủ trưa trung bình': {
        icon: '☀️',
        color: 'text-yellow-500',
        gradient: 'from-yellow-400/20 to-orange-400/20 border-yellow-300/40',
        tip: 'Giờ/lần',
    },
    'Chỉ số tổng hợp sức khỏe tinh thần': {
        icon: '💚',
        color: 'text-emerald-500',
        gradient: 'from-emerald-400/20 to-teal-400/20 border-emerald-300/40',
        tip: '0-100%',
    },
};

function getTrendIcon(value: number, maxValue: number = 10): 'up' | 'down' | 'neutral' {
    const normalized = (value / maxValue) * 10;
    if (normalized >= 7) return 'up';
    if (normalized <= 3) return 'down';
    return 'neutral';
}

function getHealthColor(value: number, maxValue: number = 100): string {
    const normalized = maxValue === 100 ? value : (value / maxValue) * 100;
    if (normalized >= 75) return 'emerald';
    if (normalized >= 50) return 'sky';
    if (normalized >= 25) return 'amber';
    return 'rose';
}

function getProgressColor(value: number, maxValue: number = 10): string {
    const normalized = maxValue === 100 ? value : (value / maxValue) * 100;
    if (normalized >= 75) return 'bg-emerald-500';
    if (normalized >= 50) return 'bg-sky-500';
    if (normalized >= 25) return 'bg-amber-500';
    return 'bg-rose-500';
}

function StatCardItem({ stat, isLoading }: { stat: StatCard; isLoading: boolean }) {
    const meta = statMeta[stat.label] ?? {
        icon: '📊',
        color: 'text-primary',
        gradient: 'from-primary/20 to-sky-400/20 border-primary/30',
        tip: '',
    };
    const trend = getTrendIcon(stat.value, stat.maxValue ?? 10);
    const isHealthIndex = stat.label.includes('Chỉ số tổng hợp');
    const progressPercent = Math.min((stat.value / (stat.maxValue ?? 10)) * 100, 100);
    const healthColor = isHealthIndex ? getHealthColor(stat.value) : null;

    if (isLoading) {
        return (
            <div className="group/stat-item bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 border border-white/40 dark:border-slate-700/30 animate-pulse">
                <div className="h-3 w-20 bg-muted rounded-full mb-3" />
                <div className="h-8 w-16 bg-muted rounded-lg mb-3" />
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-muted rounded-full" />
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'group/stat-item relative rounded-2xl p-5 border backdrop-blur-md',
                'bg-white/40 dark:bg-slate-800/40',
                'border-white/40 dark:border-slate-700/30',
                'shadow-sm hover:shadow-md',
                'transition-all duration-300 hover:-translate-y-1 hover:brightness-105',
                'overflow-hidden'
            )}
        >
            {/* Top accent line */}
            <div className={cn(
                'absolute top-0 left-4 right-4 h-px rounded-full',
                'bg-gradient-to-r from-transparent',
                meta.color.includes('amber') ? 'via-amber-400/40' :
                meta.color.includes('orange') ? 'via-orange-400/40' :
                meta.color.includes('indigo') ? 'via-indigo-400/40' :
                meta.color.includes('purple') ? 'via-purple-400/40' :
                meta.color.includes('blue') ? 'via-blue-400/40' :
                meta.color.includes('sky') ? 'via-sky-400/40' :
                meta.color.includes('yellow') ? 'via-yellow-400/40' :
                meta.color.includes('emerald') ? 'via-emerald-400/40' :
                'via-primary/40',
                'to-transparent',
                'transition-opacity duration-300 group-hover/stat-item:opacity-80'
            )} />

            {/* Glow orb on hover */}
            <div className="absolute -inset-4 rounded-2xl opacity-0 group-hover/stat-item:opacity-100 transition-opacity duration-700 pointer-events-none">
                <div className={cn(
                    'absolute inset-0 rounded-2xl blur-xl',
                    'bg-gradient-to-br from-primary/5 to-emerald-400/5'
                )} />
            </div>

            {/* Top row: icon + trend */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.icon}</span>
                    <span className={cn('text-xs font-medium', meta.color)}>
                        {meta.tip}
                    </span>
                </div>
                {trend !== 'neutral' && (
                    <div className={cn(
                        'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                        trend === 'up' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                    )}>
                        {trend === 'up' ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        {trend === 'up' ? 'Tốt' : 'Cần cải thiện'}
                    </div>
                )}
            </div>

            {/* Label */}
            <div className="text-xs text-muted-foreground/80 font-medium mb-2 group-hover/stat-item:text-muted-foreground transition-colors leading-tight">
                {stat.label}
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-1.5 mb-3">
                <span className={cn(
                    'text-3xl sm:text-4xl font-bold leading-none tracking-tight',
                    'text-foreground',
                    healthColor && healthColor === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                    healthColor && healthColor === 'sky' ? 'text-sky-600 dark:text-sky-400' :
                    healthColor && healthColor === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                    healthColor && healthColor === 'rose' ? 'text-rose-600 dark:text-rose-400' : ''
                )}>
                    {stat.value}
                </span>
                {stat.unit && (
                    <span className="text-xs text-muted-foreground font-medium">{stat.unit}</span>
                )}
                {stat.label.includes('Chỉ số') && <span className="text-[10px] font-bold text-primary/60 uppercase">%</span>}
            </div>

            {/* Progress bar */}
            <div className="relative h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                    className={cn(
                        'absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out',
                        healthColor ? (
                            healthColor === 'emerald' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                            healthColor === 'sky' ? 'bg-gradient-to-r from-sky-400 to-sky-500' :
                            healthColor === 'amber' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                            'bg-gradient-to-r from-rose-400 to-rose-500'
                        ) : (
                            'bg-gradient-to-r from-primary/70 to-emerald-400/70'
                        )
                    )}
                    style={{ width: `${progressPercent}%` }}
                />
                {/* Shimmer on the progress bar */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover/stat-item:opacity-100 transition-opacity duration-1000"
                    style={{
                        animation: 'shimmer-right 2s ease-in-out infinite',
                        animationDelay: '0.5s',
                    }}
                />
            </div>

            {/* Percentage label */}
            <div className="flex justify-end mt-1">
                <span className="text-[10px] text-muted-foreground/60 font-medium">
                    {Math.round(progressPercent)}%
                </span>
            </div>
        </div>
    );
}

export default function StatsGrid({ stats, isLoading = false }: StatsGridProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={cn(
            'bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-4xl',
            'border border-white/80 dark:border-slate-700/50',
            'shadow-sm transition-all duration-500 overflow-hidden group/stats'
        )}>
            {/* Header / Clickable Toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between rounded-3xl p-5 text-left transition-colors hover:bg-muted/20 sm:p-6"
                aria-expanded={isExpanded}
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md opacity-0 group-hover/stats:opacity-100 transition-opacity duration-500" />
                        <div className="relative inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-emerald-400/10 border border-primary/20">
                            <svg className="size-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            Tổng quan hoạt động
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Thống kê cá nhân 7 ngày gần nhất
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                            <div className="h-full w-2/3 bg-gradient-to-r from-primary/60 to-emerald-400/60 rounded-full animate-pulse" />
                        </div>
                        <span className="text-[10px] text-muted-foreground">7 ngày</span>
                    </div>
                    <ChevronDown className={cn(
                        "size-5 text-muted-foreground transition-transform duration-300",
                        isExpanded && "rotate-180"
                    )} />
                </div>
            </button>

            {/* Collapsible Content */}
            <div
                className={cn(
                    'grid transition-all duration-300 ease-in-out',
                    isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                )}
            >
                <div className="overflow-hidden">
                    <div className="border-t border-black/5 dark:border-white/5 p-4 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                style={{ animationDelay: `${index * 80}ms` }}
                                className="animate-in slide-in-from-bottom-2 fade-in duration-300 fill-mode-both"
                            >
                                <StatCardItem stat={stat} isLoading={isLoading} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface QuickAction {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    color?: 'emerald' | 'amber' | 'indigo' | 'teal' | 'rose' | 'blue' | 'lime';
}

interface QuickActionsGridProps {
    actions: QuickAction[];
}

const COLOR_MAP = {
    emerald: {
        bg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
        border: 'border-emerald-200/40 dark:border-emerald-800/40',
        shadow: 'hover:shadow-emerald-500/10',
        iconBg: 'bg-emerald-100/70 dark:bg-emerald-900/50',
        iconText: 'text-emerald-600 dark:text-emerald-400',
        glowBg: 'group-hover/item:bg-emerald-500/5',
        textHover: 'group-hover/item:text-emerald-600 dark:group-hover/item:text-emerald-300',
    },
    amber: {
        bg: 'bg-amber-50/40 dark:bg-amber-950/20',
        border: 'border-amber-200/40 dark:border-amber-800/40',
        shadow: 'hover:shadow-amber-500/10',
        iconBg: 'bg-amber-100/70 dark:bg-amber-900/50',
        iconText: 'text-amber-600 dark:text-amber-400',
        glowBg: 'group-hover/item:bg-amber-500/5',
        textHover: 'group-hover/item:text-amber-600 dark:group-hover/item:text-amber-300',
    },
    indigo: {
        bg: 'bg-indigo-50/40 dark:bg-indigo-950/20',
        border: 'border-indigo-200/40 dark:border-indigo-800/40',
        shadow: 'hover:shadow-indigo-500/10',
        iconBg: 'bg-indigo-100/70 dark:bg-indigo-900/50',
        iconText: 'text-indigo-600 dark:text-indigo-400',
        glowBg: 'group-hover/item:bg-indigo-500/5',
        textHover: 'group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-300',
    },
    teal: {
        bg: 'bg-teal-50/40 dark:bg-teal-950/20',
        border: 'border-teal-200/40 dark:border-teal-800/40',
        shadow: 'hover:shadow-teal-500/10',
        iconBg: 'bg-teal-100/70 dark:bg-teal-900/50',
        iconText: 'text-teal-600 dark:text-teal-400',
        glowBg: 'group-hover/item:bg-teal-500/5',
        textHover: 'group-hover/item:text-teal-600 dark:group-hover/item:text-teal-300',
    },
    rose: {
        bg: 'bg-rose-50/40 dark:bg-rose-950/20',
        border: 'border-rose-200/40 dark:border-rose-800/40',
        shadow: 'hover:shadow-rose-500/10',
        iconBg: 'bg-rose-100/70 dark:bg-rose-900/50',
        iconText: 'text-rose-600 dark:text-rose-400',
        glowBg: 'group-hover/item:bg-rose-500/5',
        textHover: 'group-hover/item:text-rose-600 dark:group-hover/item:text-rose-300',
    },
    blue: {
        bg: 'bg-blue-50/40 dark:bg-blue-950/20',
        border: 'border-blue-200/40 dark:border-blue-800/40',
        shadow: 'hover:shadow-blue-500/10',
        iconBg: 'bg-blue-100/70 dark:bg-blue-900/50',
        iconText: 'text-blue-600 dark:text-blue-400',
        glowBg: 'group-hover/item:bg-blue-500/5',
        textHover: 'group-hover/item:text-blue-600 dark:group-hover/item:text-blue-300',
    },
    lime: {
        bg: 'bg-lime-50/40 dark:bg-lime-950/20',
        border: 'border-lime-200/40 dark:border-lime-800/40',
        shadow: 'hover:shadow-lime-500/10',
        iconBg: 'bg-lime-100/70 dark:bg-lime-900/50',
        iconText: 'text-lime-600 dark:text-lime-400',
        glowBg: 'group-hover/item:bg-lime-500/5',
        textHover: 'group-hover/item:text-lime-600 dark:group-hover/item:text-lime-300',
    },
};

export default function QuickActionsGrid({ actions }: QuickActionsGridProps) {
    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {actions.map((action, index) => {
                const colors = COLOR_MAP[action.color || 'emerald'];

                return (
                    <Link
                        key={index}
                        href={action.href}
                        className={cn(
                            'group/item relative backdrop-blur-md rounded-3xl p-4 sm:p-5 border transition-all duration-500',
                            'hover:-translate-y-2 hover:shadow-xl block h-full',
                            colors.bg,
                            colors.border,
                            colors.shadow,
                            colors.glowBg,
                            'animate-in slide-in-from-bottom-4 fade-in duration-500',
                        )}
                        style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
                    >
                        <div className={cn(
                            'size-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-4',
                            'group-hover/item:scale-110 group-hover/item:-translate-y-0.5',
                            'transition-all duration-500 shadow-sm',
                            colors.iconBg
                        )}>
                            <span className={colors.iconText}>{action.icon}</span>
                        </div>
                        <h3 className={cn(
                            'text-sm sm:text-base font-bold text-foreground mb-1.5 transition-colors duration-300',
                            colors.textHover
                        )}>
                            {action.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
                            {action.description}
                        </p>
                    </Link>
                );
            })}
        </div>
    );
}

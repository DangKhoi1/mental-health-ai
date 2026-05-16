'use client';

import { useState, useEffect, useRef } from 'react';
import { aiAnalysisService } from '@/services/aiAnalysis';
import { Recommendation } from '@/types/recommendation.types';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Category configuration ────────────────────────────────────────────────────

type CategoryConfig = {
    emoji: string;
    name: string; // Tag text hiển thị
    gradient: {
        from: string;
        to: string;
    };
    iconBg: string;
    iconBorder: string;
    tagBg: string;
    tagText: string;
    border: string;
    hoverBorder: string;
    textPrimary: string;
    textSecondary: string;
    shimmer: string;
};

const CATEGORIES: Record<string, CategoryConfig> = {
    RELAXATION: {
        emoji: '🌿',
        name: 'Thư giãn',
        gradient: { from: 'from-emerald-50/90', to: 'to-teal-50/70' },
        iconBg: 'bg-white/90',
        iconBorder: 'border-emerald-200/60',
        tagBg: 'bg-emerald-500/15',
        tagText: 'text-emerald-700',
        border: 'border-emerald-200/50',
        hoverBorder: 'hover:border-emerald-300/70',
        textPrimary: 'text-emerald-900',
        textSecondary: 'text-emerald-700/80',
        shimmer: 'bg-gradient-to-r from-emerald-200/30 via-emerald-100/50 to-emerald-200/30',
    },
    SOCIAL: {
        emoji: '💬',
        name: 'Kết nối',
        gradient: { from: 'from-blue-50/90', to: 'to-sky-50/70' },
        iconBg: 'bg-white/90',
        iconBorder: 'border-blue-200/60',
        tagBg: 'bg-blue-500/15',
        tagText: 'text-blue-700',
        border: 'border-blue-200/50',
        hoverBorder: 'hover:border-blue-300/70',
        textPrimary: 'text-blue-900',
        textSecondary: 'text-blue-700/80',
        shimmer: 'bg-gradient-to-r from-blue-200/30 via-blue-100/50 to-blue-200/30',
    },
    CREATIVE: {
        emoji: '🎨',
        name: 'Sáng tạo',
        gradient: { from: 'from-violet-50/90', to: 'to-purple-50/70' },
        iconBg: 'bg-white/90',
        iconBorder: 'border-violet-200/60',
        tagBg: 'bg-violet-500/15',
        tagText: 'text-violet-700',
        border: 'border-violet-200/50',
        hoverBorder: 'hover:border-violet-300/70',
        textPrimary: 'text-violet-900',
        textSecondary: 'text-violet-700/80',
        shimmer: 'bg-gradient-to-r from-violet-200/30 via-violet-100/50 to-violet-200/30',
    },
    EXERCISE: {
        emoji: '🏃',
        name: 'Vận động',
        gradient: { from: 'from-orange-50/90', to: 'to-amber-50/70' },
        iconBg: 'bg-white/90',
        iconBorder: 'border-orange-200/60',
        tagBg: 'bg-orange-500/15',
        tagText: 'text-orange-700',
        border: 'border-orange-200/50',
        hoverBorder: 'hover:border-orange-300/70',
        textPrimary: 'text-orange-900',
        textSecondary: 'text-orange-700/80',
        shimmer: 'bg-gradient-to-r from-orange-200/30 via-orange-100/50 to-orange-200/30',
    },
    SLEEP: {
        emoji: '🌙',
        name: 'Giấc ngủ',
        gradient: { from: 'from-indigo-50/90', to: 'to-purple-50/70' },
        iconBg: 'bg-white/90',
        iconBorder: 'border-indigo-200/60',
        tagBg: 'bg-indigo-500/15',
        tagText: 'text-indigo-700',
        border: 'border-indigo-200/50',
        hoverBorder: 'hover:border-indigo-300/70',
        textPrimary: 'text-indigo-900',
        textSecondary: 'text-indigo-700/80',
        shimmer: 'bg-gradient-to-r from-indigo-200/30 via-indigo-100/50 to-indigo-200/30',
    },
    MEDITATION: {
        emoji: '🧘',
        name: 'Thiền định',
        gradient: { from: 'from-teal-50/90', to: 'to-cyan-50/70' },
        iconBg: 'bg-white/90',
        iconBorder: 'border-teal-200/60',
        tagBg: 'bg-teal-500/15',
        tagText: 'text-teal-700',
        border: 'border-teal-200/50',
        hoverBorder: 'hover:border-teal-300/70',
        textPrimary: 'text-teal-900',
        textSecondary: 'text-teal-700/80',
        shimmer: 'bg-gradient-to-r from-teal-200/30 via-teal-100/50 to-teal-200/30',
    },
    JOURNALING: {
        emoji: '📓',
        name: 'Nhật ký',
        gradient: { from: 'from-yellow-50/90', to: 'to-amber-50/70' },
        iconBg: 'bg-white/90',
        iconBorder: 'border-yellow-200/60',
        tagBg: 'bg-yellow-500/15',
        tagText: 'text-yellow-700',
        border: 'border-yellow-200/50',
        hoverBorder: 'hover:border-yellow-300/70',
        textPrimary: 'text-yellow-900',
        textSecondary: 'text-yellow-700/80',
        shimmer: 'bg-gradient-to-r from-yellow-200/30 via-yellow-100/50 to-yellow-200/30',
    },
    DAILY: {
        emoji: '✨',
        name: 'Hàng ngày',
        gradient: { from: 'from-primary/5', to: 'to-primary/10' },
        iconBg: 'bg-white/90',
        iconBorder: 'border-primary/30',
        tagBg: 'bg-primary/15',
        tagText: 'text-primary',
        border: 'border-primary/30',
        hoverBorder: 'hover:border-primary/50',
        textPrimary: 'text-foreground',
        textSecondary: 'text-muted-foreground',
        shimmer: 'bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20',
    },
    DEFAULT: {
        emoji: '💡',
        name: 'Gợi ý',
        gradient: { from: 'from-slate-50/90', to: 'to-slate-100/70' },
        iconBg: 'bg-white/90',
        iconBorder: 'border-slate-200/60',
        tagBg: 'bg-slate-500/15',
        tagText: 'text-slate-700',
        border: 'border-slate-200/50',
        hoverBorder: 'hover:border-slate-300/70',
        textPrimary: 'text-slate-900',
        textSecondary: 'text-slate-700/80',
        shimmer: 'bg-gradient-to-r from-slate-200/30 via-slate-100/50 to-slate-200/30',
    },
};

function resolveCategory(rec: Recommendation): string {
    const text = `${rec.title ?? ''} ${rec.content ?? ''}`.toLowerCase();

    // Phân loại theo từ khóa trong nội dung trước để đè lên 'DAILY' typeCode chung từ backend
    const keywordMap: [string[], string][] = [
        [['thư giãn', 'giam stress', 'giảm stress', 'giảm căng thẳng', 'căng thẳng', 'âm nhạc', 'am nhac', 'playlist', 'nghe nhạc', 'tắm', 'nghỉ ngơi', 'uống trà', 'thưởng trà'], 'RELAXATION'],
        [['giao tiếp', 'kết nối', 'ket noi', 'bạn bè', 'ban be', 'gia đình', 'gia dinh', 'trò chuyện', 'gọi điện', 'tin nhắn', 'mời', 'hẹn', 'bố', 'mẹ', 'người thân'], 'SOCIAL'],
        [['sáng tạo', 'sang tao', 'vẽ', 'viết', 'biểu cảm', 'chế tác', 'nấu ăn', 'khéo tay', 'nghệ thuật'], 'CREATIVE'],
        [['tập', 'vận động', 'van dong', 'thể dục', 'the duc', 'đi bộ', 'di bo', 'yoga', 'chạy', 'đạp xe', 'gym', 'bơi', 'thể thao', 'vươn vai'], 'EXERCISE'],
        [['ngủ', 'giấc ngủ', 'giac ngu', 'mất ngủ', 'mat ngu', 'ngủ ngon', 'ngủ sớm'], 'SLEEP'],
        [['thiền', 'thien', 'meditation', 'mindfulness', 'hít thở', 'hit tho', 'thở sâu'], 'MEDITATION'],
        [['nhật ký', 'nhat ky', 'journal', 'viết nhật ký', 'ghi chép', 'biết ơn'], 'JOURNALING'],
    ];

    for (const [keywords, category] of keywordMap) {
        if (keywords.some((k) => text.includes(k))) {
            return category;
        }
    }

    // Nếu không khớp từ khóa, xem xét typeCode mới
    const typeCode = (rec.typeCode ?? '').toUpperCase();
    if (typeCode && typeCode !== 'DAILY' && CATEGORIES[typeCode]) {
        return typeCode;
    }

    // Fallback sang type cũ
    const type = (rec.type ?? '').toUpperCase();
    const typeMap: Record<string, string> = {
        SLEEP: 'SLEEP',
        MEDITATION: 'MEDITATION',
        BREATHING: 'MEDITATION',
        EXERCISE: 'EXERCISE',
        SOCIAL: 'SOCIAL',
        JOURNALING: 'JOURNALING',
        RELAXATION: 'RELAXATION',
        CREATIVE: 'CREATIVE',
        NUTRITION: 'RELAXATION',
        PROFESSIONAL: 'SOCIAL',
        CHAT: 'SOCIAL',
        ASSESSMENT: 'CREATIVE',
        DAILY: 'DAILY',
    };
    if (typeMap[type]) {
        return typeMap[type];
    }
    
    // Fallback về DAILY nếu backend trả về là DAILY
    if (typeCode === 'DAILY') {
        return 'DAILY';
    }

    return 'DEFAULT';
}

function getCategoryConfig(rec: Recommendation): CategoryConfig {
    return CATEGORIES[resolveCategory(rec)] ?? CATEGORIES.DEFAULT;
}

// ── Text container for wrapping long content ──────────────────────────────────

function WrappedText({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'flex-1 min-w-0 break-words',
                className
            )}
        >
            {children}
        </div>
    );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingCard({ index }: { index: number }) {
    const colors = [
        'from-emerald-100/50 to-teal-100/50',
        'from-blue-100/50 to-sky-100/50',
        'from-violet-100/50 to-purple-100/50',
    ];
    const color = colors[index % colors.length];

    return (
        <div
            className={cn(
                'flex items-center gap-4 rounded-2xl px-5 py-4',
                'bg-gradient-to-br border animate-pulse',
                color,
                'border-slate-200/50'
            )}
        >
            {/* Icon skeleton */}
            <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/70 border border-slate-200/40" />

            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
                <div className="h-4 w-20 rounded-full bg-white/50" />
                <div className="h-5 w-3/4 rounded-lg bg-white/40" />
            </div>

            {/* Arrow skeleton */}
            <div className="shrink-0 w-5 h-5 rounded-full bg-white/40" />
        </div>
    );
}

function LoadingSkeletons() {
    return (
        <div className="flex flex-col gap-3">
            <LoadingCard index={0} />
            <LoadingCard index={1} />
            <LoadingCard index={2} />
        </div>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-8 rounded-3xl border-2 border-dashed border-border/40 dark:border-border/20 bg-gradient-to-br from-muted/20 to-muted/10">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-5 shadow-lg shadow-primary/10">
                <Sparkles className="w-9 h-9 text-primary/70" />
            </div>
            <h3 className="text-lg font-bold text-foreground/80 mb-2">
                Chưa có gợi ý nào
            </h3>
            <p className="text-sm text-muted-foreground/70 text-center max-w-sm leading-relaxed">
                Hãy ghi nhật ký và theo dõi tâm trạng hàng ngày để nhận những gợi ý phù hợp dành riêng cho bạn từ AI nhé.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground/50">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Đang chờ dữ liệu</span>
            </div>
        </div>
    );
}

// ── Recommendation card ────────────────────────────────────────────────────────

interface RecCardProps {
    rec: Recommendation;
    onClick: () => void;
    index: number;
}

function RecCard({ rec, onClick, index }: RecCardProps) {
    const config = getCategoryConfig(rec);
    const isEven = index % 2 === 0;

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'group relative w-full flex items-center gap-4 sm:gap-5',
                'rounded-2xl sm:rounded-3xl px-5 sm:px-6 py-4 sm:py-5',
                'text-left transition-all duration-300 cursor-pointer',
                'border backdrop-blur-sm',
                'bg-gradient-to-br shadow-sm',
                config.gradient.from,
                config.gradient.to,
                config.border,
                config.hoverBorder,
                'hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20',
                'hover:-translate-y-0.5 hover:scale-[1.01]',
                'active:scale-[0.99]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
            )}
        >
            {/* Shimmer effect on hover */}
            <div
                className={cn(
                    'absolute inset-0 rounded-2xl opacity-0',
                    'group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden'
                )}
            >
                <div
                    className={cn(
                        'absolute inset-0 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000',
                        config.shimmer
                    )}
                />
            </div>

            {/* Icon container */}
            <div
                className={cn(
                    'relative shrink-0 w-14 h-14 sm:w-16 sm:h-16',
                    'flex items-center justify-center',
                    'rounded-2xl sm:rounded-3xl',
                    'backdrop-blur-md shadow-lg',
                    config.iconBg,
                    'border-2',
                    config.iconBorder,
                    'group-hover:scale-110 group-hover:rotate-3 transition-all duration-300'
                )}
            >
                <span className="text-2xl sm:text-3xl select-none leading-none filter drop-shadow-sm">
                    {config.emoji}
                </span>

                {/* Glow effect */}
                <div
                    className={cn(
                        'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10',
                        config.gradient.from.replace('/90', '/30')
                    )}
                />
            </div>

            {/* Content area */}
            <div className="relative flex-1 min-w-0 flex flex-col gap-1.5 sm:gap-2">
                {/* Tag pill */}
                <div
                    className={cn(
                        'inline-flex items-center self-start rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1',
                        'text-[10px] sm:text-xs font-bold uppercase tracking-wider',
                        'border backdrop-blur-sm',
                        config.tagBg,
                        config.tagText,
                        config.border
                    )}
                >
                    {config.name}
                </div>

                {/* Content text - wraps naturally without truncation */}
                <WrappedText
                    className={cn(
                        'text-sm sm:text-base font-semibold leading-snug',
                        config.textPrimary,
                        'group-hover:',
                        config.textSecondary
                    )}
                >
                    {rec.content}
                </WrappedText>
            </div>

            {/* Arrow indicator */}
            <div
                className={cn(
                    'shrink-0 w-8 h-8 sm:w-10 sm:h-10',
                    'flex items-center justify-center rounded-full',
                    'bg-white/60 dark:bg-slate-800/60',
                    'border border-black/5 dark:border-white/10',
                    'shadow-sm',
                    'text-muted-foreground/40 group-hover:text-muted-foreground/70',
                    'group-hover:translate-x-0.5 transition-all duration-200'
                )}
            >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
        </button>
    );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function RecModal({ rec, onClose }: { rec: Recommendation; onClose: () => void }) {
    const config = getCategoryConfig(rec);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className={cn(
                    'relative w-full max-w-lg rounded-3xl overflow-hidden shadow-xl shadow-black/10 dark:shadow-black/50',
                    'bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800',
                    'animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-400 ease-out',
                    'max-h-[90vh] flex flex-col'
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Accent Bar */}
                <div className={cn('h-2 w-full bg-gradient-to-r', config.gradient.from.replace('/90', '').replace('50', '400'), config.gradient.to.replace('/70', '').replace('50', '400'))} />
                
                {/* Header */}
                <div className="relative px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-start gap-4 sm:gap-5">
                        <div
                            className={cn(
                                'shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl',
                                'bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50',
                                'transition-transform duration-300 hover:scale-105'
                            )}
                        >
                            <span>{config.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                            <div
                                className={cn(
                                    'inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider mb-2.5',
                                    config.tagBg,
                                    config.tagText
                                )}
                            >
                                {config.name}
                            </div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                {new Date(rec.createdAt).toLocaleString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className={cn(
                                'shrink-0 p-2.5 rounded-full',
                                'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                                'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700',
                                'transition-colors duration-200'
                            )}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto overflow-x-hidden max-h-[70vh] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    <div className="rounded-2xl p-6 sm:p-7 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        {rec.content
                            .split('\n')
                            .map((line) => line.trim())
                            .filter((l) => l.length > 0)
                            .map((line, idx) => (
                                <p
                                    key={idx}
                                    className={cn(
                                        'text-[15px] sm:text-[16px] leading-[1.7]',
                                        'text-slate-800 dark:text-slate-200',
                                        'font-normal',
                                        idx > 0 && 'mt-4'
                                    )}
                                >
                                    {line}
                                </p>
                            ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500/70" />
                        <p className="text-[13px] sm:text-sm font-medium text-slate-400 dark:text-slate-500">
                            Gợi ý hỗ trợ sức khỏe tinh thần từ AI
                        </p>
                        <Sparkles className="w-4 h-4 text-emerald-500/70" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface RecommendationsWidgetProps {
    className?: string;
}

export default function RecommendationsWidget({ className }: RecommendationsWidgetProps) {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Recommendation | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchRecommendations = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await aiAnalysisService.getDashboardRecommendations();
            setRecommendations(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load recommendations:', err);
            setError('Không thể tải gợi ý');
            setRecommendations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        const timeoutId = setTimeout(() => {
            if (!cancelled) {
                fetchRecommendations();
            }
        }, 100);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, []);

    return (
        <div className={cn('flex flex-col gap-4', className)}>
            {/* Content */}
            <div className="flex flex-col gap-3">
                {loading && <LoadingSkeletons />}

                {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-8 px-6 rounded-2xl border border-red-200/50 bg-red-50/50 dark:bg-red-950/20">
                        <p className="text-sm text-red-600/80 mb-3">{error}</p>
                        <button
                            type="button"
                            onClick={fetchRecommendations}
                            className="text-xs font-medium text-red-600 hover:text-red-700 underline"
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {!loading && !error && recommendations.length === 0 && <EmptyState />}

                {!loading && !error && recommendations.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {recommendations.map((rec, index) => (
                            <RecCard
                                key={rec.recommendationId}
                                rec={rec}
                                index={index}
                                onClick={() => setSelected(rec)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {selected && (
                <RecModal
                    rec={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { healthService } from '@/services/health';
import { HealthSummary } from '@/types/health.types';
import { aiAnalysisService } from '@/services/aiAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Sparkles, Lightbulb, Moon, Brain, Wind,
    Dumbbell, Users, BookOpen, Coffee, Apple, Stethoscope
} from 'lucide-react';
import { MENTAL_HEALTH_TIPS, TipCategory } from '@/constants/mental-health-tips';
import { cn } from '@/lib/utils';

interface DailyTipProps {
    summary?: HealthSummary | null;
    className?: string;
}

interface AiRec {
    recommendationId: string;
    title: string;
    content: string;
    typeCode?: string;
    type?: string;
    createdAt: string;
}

const CATEGORY_ICON: Record<string, React.ReactNode> = {
    SLEEP: <Moon className="w-4 h-4" />,
    MEDITATION: <Brain className="w-4 h-4" />,
    BREATHING: <Wind className="w-4 h-4" />,
    EXERCISE: <Dumbbell className="w-4 h-4" />,
    SOCIAL: <Users className="w-4 h-4" />,
    JOURNALING: <BookOpen className="w-4 h-4" />,
    RELAXATION: <Coffee className="w-4 h-4" />,
    NUTRITION: <Apple className="w-4 h-4" />,
    PROFESSIONAL: <Stethoscope className="w-4 h-4" />,
};

function isToday(dateStr: string): boolean {
    const d = new Date(dateStr);
    const now = new Date();
    return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
    );
}

export default function DailyTip({ summary: propSummary, className }: DailyTipProps) {
    const [fetchedSummary, setFetchedSummary] = useState<HealthSummary | null>(null);
    const [aiRecs, setAiRecs] = useState<AiRec[]>([]);
    const [loadingRecs, setLoadingRecs] = useState(true);

    const healthSummary = propSummary || fetchedSummary;

    // Load saved AI recommendations
    useEffect(() => {
        const loadRecs = async () => {
            try {
                const data = await aiAnalysisService.getSavedRecommendations();
                const daily = (data as AiRec[]).filter(
                    (r) => (r.typeCode === 'DAILY' || r.type === 'DAILY') && isToday(r.createdAt)
                );
                setAiRecs(daily.slice(0, 3));
            } catch {
                // silent — will fall back to static tip
            } finally {
                setLoadingRecs(false);
            }
        };
        loadRecs();
    }, []);

    // Fetch health summary for fallback static tip
    useEffect(() => {
        if (!propSummary) {
            const loadHealthSummary = async () => {
                try {
                    const data = await healthService.getHealthSummary();
                    setFetchedSummary(data);
                } catch {
                    // ignore
                }
            };
            loadHealthSummary();
        }
    }, [propSummary]);

    const staticTip = useMemo(() => {
        if (!healthSummary) {
            return MENTAL_HEALTH_TIPS.find((t) => t.category === 'NEUTRAL')?.text || 'Hãy chăm sóc bản thân mỗi ngày.';
        }
        let category: TipCategory = 'NEUTRAL';
        if (healthSummary.averageStressLevel > 3) category = 'HIGH_STRESS';
        else if (healthSummary.averageMoodScore < 5) category = 'LOW_MOOD';
        else if (healthSummary.averageMoodScore >= 8) category = 'POSITIVE';

        const filtered = MENTAL_HEALTH_TIPS.filter((t) => t.category === category || t.category === 'NEUTRAL');
        if (filtered.length === 0) return 'Hãy lắng nghe cơ thể và tâm trí của bạn.';

        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
        const seed = dayOfYear + Math.floor(healthSummary.averageMoodScore || 0);
        return filtered[seed % filtered.length].text;
    }, [healthSummary]);

    // Derive category key from title (AI saves category name as part of title)
    const getCategoryIcon = (title: string) => {
        const upper = title.toUpperCase();
        for (const key of Object.keys(CATEGORY_ICON)) {
            if (upper.includes(key)) return CATEGORY_ICON[key];
        }
        return <Sparkles className="w-4 h-4" />;
    };

    const hasAiRecs = aiRecs.length > 0;

    return (
        <Card className={cn('relative overflow-hidden border border-emerald-100/60 bg-emerald-50/50 backdrop-blur-3xl shadow-[0_8px_32px_rgba(142,179,122,0.1)] rounded-3xl transition-all duration-500', className)}>
            <div className="pointer-events-none absolute top-0 left-0 right-0 z-30 h-8 bg-gradient-to-b from-emerald-50/50 to-transparent block" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 h-8 bg-gradient-to-t from-emerald-50/50 to-transparent block" />
            
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                <Lightbulb className="w-32 h-32 text-primary" />
            </div>

            <CardHeader className="pb-4 pt-6 px-6 sm:px-8">
                <CardTitle className="flex items-center gap-2 text-foreground text-lg font-medium">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary animate-pulse-soft">
                        <Sparkles className="w-4 h-4" />
                    </span>
                    Lời khuyên hôm nay
                </CardTitle>
            </CardHeader>

            <CardContent className="relative z-10 px-6 pb-6 sm:px-8 sm:pb-8">
                {loadingRecs ? (
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-16 rounded-2xl bg-emerald-50/50 animate-pulse border border-emerald-100/50" />
                        ))}
                    </div>
                ) : hasAiRecs ? (
                    <ul className="space-y-4">
                        {aiRecs.map((rec) => (
                            <li
                                key={rec.recommendationId}
                                className={cn(
                                    'relative flex items-start gap-4 rounded-2xl border border-emerald-100/50 bg-emerald-50/50 p-4 transition-all duration-500 transform-gpu cursor-pointer group/item overflow-hidden',
                                    'hover:bg-emerald-50/80 hover:shadow-[0_12px_35px_rgba(142,179,122,0.15)] hover:border-primary/30 hover:-translate-y-1.5'
                                )}
                            >
                                <div className="absolute inset-0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-700 pointer-events-none">
                                    <div className="absolute inset-0 animate-shimmer" />
                                </div>
                                <span className="mt-0.5 shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary group-hover/item:scale-110 group-hover/item:animate-pulse-soft transition-all duration-500">
                                    {getCategoryIcon(rec.title)}
                                </span>
                                <div className="min-w-0 relative z-10">
                                    <p className="text-[15px] font-semibold text-foreground leading-tight group-hover/item:text-primary transition-colors">{rec.title}</p>
                                    <p className="text-[13px] text-muted-foreground leading-relaxed mt-1">{rec.content}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="bg-emerald-100/40 rounded-3xl p-6 sm:p-8 min-h-[5rem] flex flex-col justify-center border border-emerald-200/50 shadow-[0_4px_20px_rgba(142,179,122,0.05)] animate-in fade-in duration-700">
                        <p className="text-foreground text-lg sm:text-xl font-medium leading-relaxed italic mb-4">
                            &ldquo;{staticTip}&rdquo;
                        </p>
                        <p className="text-xs text-muted-foreground/80 mt-auto">Gợi ý này được chọn theo trạng thái gần đây của bạn.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

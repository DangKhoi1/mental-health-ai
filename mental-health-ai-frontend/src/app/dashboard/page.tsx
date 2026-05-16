'use client';

import { useEffect, useMemo, useState } from 'react';
import { aiAnalysisService } from '@/services/aiAnalysis';
import { useAuthStore, useDailyMoodStore, useJournalStore, useSleepLogStore } from '@/stores';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import StatsGrid from '@/components/dashboard/StatsGrid';
import QuickActionsGrid, { QuickAction } from '@/components/dashboard/QuickActionsGrid';
import RecommendationsWidget from '@/components/dashboard/RecommendationsWidget';
import MoodQuote from '@/components/dashboard/MoodQuote';
import QuickMoodWidget from '@/components/dashboard/QuickMoodWidget';
import { Sparkles, Heart } from 'lucide-react';
import { PinGuard } from '@/components/ui';

function toLocalDateKey(dateLike: string | Date): string {
    const d = new Date(dateLike);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function calcStreak(moods: { createdAt: string }[]): number {
    if (!moods.length) return 0;
    const days = Array.from(
        new Set(moods.map((m) => toLocalDateKey(m.createdAt)))
    ).sort((a, b) => (a > b ? -1 : 1));

    let streak = 0;
    const today = toLocalDateKey(new Date());
    let cursor = today;

    for (const day of days) {
        if (day === cursor) {
            streak++;
            const d = new Date(cursor);
            d.setDate(d.getDate() - 1);
            cursor = toLocalDateKey(d);
        } else {
            break;
        }
    }
    return streak;
}

function DashboardContent() {
    const round1 = (value: number) => Math.round(value * 10) / 10;

    const { user } = useAuthStore();
    const { moods, fetchMoods, isLoading: moodsLoading } = useDailyMoodStore();
    const { journals, fetchJournals, isLoading: journalsLoading } = useJournalStore();
    const { sleepLogs, fetchSleepLogs, isLoading: sleepLoading } = useSleepLogStore();
    const [snapshot, setSnapshot] = useState<import('@/services/aiAnalysis').DashboardSnapshot | null>(null);
    const [snapshotLoading, setSnapshotLoading] = useState(true);

    const isLoading = moodsLoading || journalsLoading || sleepLoading || snapshotLoading;
    const streak = useMemo(() => calcStreak(moods), [moods]);
    const nightSleepLogs = useMemo(() => sleepLogs.filter((log) => log.sleepType === 'night'), [sleepLogs]);
    const avgNightSleepDuration = useMemo(() => {
        if (nightSleepLogs.length === 0) return 0;
        return nightSleepLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / nightSleepLogs.length;
    }, [nightSleepLogs]);

    useEffect(() => {
        fetchMoods();
        fetchJournals();
        fetchSleepLogs();
    }, [fetchMoods, fetchJournals, fetchSleepLogs]);

    useEffect(() => {
        let isMounted = true;

        const loadSnapshot = async () => {
            setSnapshotLoading(true);
            try {
                const data = await aiAnalysisService.getDashboardSnapshot();
                if (isMounted) {
                    setSnapshot(data);
                }
            } catch {
                if (isMounted) {
                    setSnapshot(null);
                }
            } finally {
                if (isMounted) {
                    setSnapshotLoading(false);
                }
            }
        };

        loadSnapshot();

        return () => {
            isMounted = false;
        };
    }, []);

    const quickActions: QuickAction[] = [
        {
            title: 'Ghi nhận tâm trạng',
            description: 'Bạn cảm thấy thế nào hôm nay?',
            href: '/dashboard/daily-mood',
            color: 'emerald' as const,
            icon: (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            ),
        },
        {
            title: 'Viết nhật ký',
            description: 'Chia sẻ suy nghĩ của bạn',
            href: '/dashboard/journal',
            color: 'amber' as const,
            icon: (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
        },
        {
            title: 'Theo dõi giấc ngủ',
            description: 'Ngủ ngon là sức khỏe',
            href: '/dashboard/sleep-log',
            color: 'indigo' as const,
            icon: (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            ),
        },
        {
            title: 'Đánh giá sức khỏe',
            description: 'Hiểu bạn hơn mỗi ngày',
            href: '/dashboard/assessment',
            color: 'teal' as const,
            icon: (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
        },
    ];

    const avgMood = snapshot?.mood?.averageMood ?? 0;

    const subtitleByMood = useMemo(() => {
        if (avgMood === 0) return 'Bắt đầu ghi nhật ký để nhận gợi ý từ AI';
        if (avgMood <= 3) return 'Hãy dành thời gian cho bản thân, bạn xứng đáng được nghỉ ngơi';
        if (avgMood <= 5) return 'Mỗi ngày đều là cơ hội để cảm thấy tốt hơn';
        if (avgMood <= 7) return 'Bạn đang làm tốt, hãy tiếp tục duy trì nhé';
        return 'Tâm trạng tuyệt vời! Hãy chia sẻ năng lượng tích cực này';
    }, [avgMood]);

    return (
        <div className="space-y-6 mx-auto pb-8">
            {/* Welcome Section */}
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                <WelcomeBanner userName={user?.fullName} streakDays={streak} />
            </div>

            {/* Mood + Quote side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
                <QuickMoodWidget />
                <MoodQuote />
            </div>

            {/* Wellness Overview */}
            <StatsGrid
                isLoading={isLoading}
                stats={[
                    { label: 'Tâm trạng trung bình', value: snapshot?.mood?.averageMood ?? 0, maxValue: 10, unit: '/ 10', description: 'Thang điểm 1-10' },
                    { label: 'Bài nhật ký gần đây', value: journals.length, unit: 'bài', description: 'Tổng số bài đã viết' },
                    { label: 'Ngủ đêm trung bình', value: avgNightSleepDuration > 0 ? round1(avgNightSleepDuration) : 0, unit: 'giờ', description: 'Giờ/đêm' },
                    { label: 'Chất lượng ngủ đêm trung bình', value: snapshot?.sleep?.averageNightQuality ?? 0, maxValue: 10, unit: '/ 10', description: 'Thang điểm 1-10' },
                    { label: 'Số ngày có ngủ đêm', value: snapshot?.sleep?.nightCount ?? 0, unit: 'ngày', description: 'Trong 7 ngày' },
                    { label: 'Số lần ngủ trưa', value: snapshot?.sleep?.napCount ?? 0, unit: 'lần', description: 'Trong 7 ngày' },
                    { label: 'Thời lượng ngủ trưa trung bình', value: snapshot?.sleep?.averageNapDuration ?? 0, maxValue: 3, unit: 'giờ', description: 'Giờ/lần' },
                    { label: 'Chỉ số tổng hợp sức khỏe tinh thần', value: snapshot?.mentalHealthIndex ?? 0, maxValue: 10, unit: '/ 10', description: 'Thang điểm 1-10' },
                ]}
            />

            {/* AI Insights Section */}
            <section className="rounded-3xl bg-gradient-to-br from-primary/[0.03] via-background to-violet-50/15 dark:from-primary/[0.05] dark:via-background dark:to-violet-950/15 border border-primary/8 dark:border-primary/15 backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200" style={{ animationFillMode: 'both' }}>
                <div className="p-5 sm:p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center shadow-sm">
                            <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">
                                Gợi ý dành cho bạn
                            </h2>
                            <p className="text-xs text-muted-foreground/70">
                                {subtitleByMood}
                            </p>
                        </div>
                    </div>
                            <RecommendationsWidget />
                </div>
            </section>

            {/* Quick Actions */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300" style={{ animationFillMode: 'both' }}>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Heart className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">
                        Hành động nhanh
                    </h2>
                </div>
                <QuickActionsGrid actions={quickActions} />
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <PinGuard resourceName="dashboard cá nhân">
            <DashboardContent />
        </PinGuard>
    );
}

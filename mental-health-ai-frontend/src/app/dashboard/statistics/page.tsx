'use client';

import { useEffect, useMemo, useState } from 'react';
import { healthService } from '@/services/health';
import { HealthSummary } from '@/types/health.types';
import { useDailyMoodStore, useSleepLogStore, useJournalStore, useAssessmentStore } from '@/stores';
import MentalHealthCharts from '@/components/dashboard/MentalHealthCharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Brain, Moon, Activity, Smile, Frown, Meh, TrendingUp, TrendingDown,
    Minus, BookOpen, ClipboardCheck, Calendar, Clock
} from 'lucide-react';
import DailyTip from '@/components/dashboard/DailyTip';
import ExportReportButton from '@/components/dashboard/ExportReportButton';
import Link from 'next/link';
import { PinGuard } from '@/components/ui/pin-guard';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS = [
    { label: '7 ngày', days: 7 },
    { label: '30 ngày', days: 30 },
    { label: '90 ngày', days: 90 },
];

function StatisticsContent() {
    const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
    const [healthLoading, setHealthLoading] = useState(true);
    const [period, setPeriod] = useState(30);

    const { moods, fetchMoods } = useDailyMoodStore();
    const { sleepLogs, fetchSleepLogs } = useSleepLogStore();
    const { journals, fetchJournals } = useJournalStore();
    const { history, fetchHistory } = useAssessmentStore();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const loadHealthSummary = async () => {
            try {
                const summary = await healthService.getHealthSummary();
                setHealthSummary(summary);
            } catch (error) {
                console.error('Error loading health summary:', error);
            } finally {
                setHealthLoading(false);
            }
        };
        loadHealthSummary();
        fetchMoods();
        fetchSleepLogs();
        fetchJournals();
        fetchHistory();
    }, []);

    // Filter data theo period đã chọn
    const periodStart = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - period);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [period]);

    const filteredMoods = useMemo(() => moods.filter(m => new Date(m.createdAt) >= periodStart), [moods, periodStart]);
    const filteredSleep = useMemo(() => sleepLogs.filter(s => new Date(s.createdAt) >= periodStart), [sleepLogs, periodStart]);
    const filteredJournals = useMemo(() => journals.filter(j => new Date(j.createdAt) >= periodStart), [journals, periodStart]);

    const stats = useMemo(() => {
        const avgSleepQuality = filteredSleep.length > 0
            ? filteredSleep.reduce((sum, s) => sum + (s.sleepQualityScore || 0), 0) / filteredSleep.length
            : 0;
        const avgSleepDuration = filteredSleep.length > 0
            ? filteredSleep.reduce((sum, s) => sum + (s.duration || 0), 0) / filteredSleep.length
            : 0;

        // Mood trend: nửa đầu vs nửa sau trong period
        const sortedMoods = [...filteredMoods].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const half = Math.floor(sortedMoods.length / 2);
        const recent7 = sortedMoods.slice(0, half || 1);
        const prev7 = sortedMoods.slice(half);
        const recentAvg = recent7.length > 0 ? recent7.reduce((s, m) => s + m.moodScore, 0) / recent7.length : 0;
        const prevAvg = prev7.length > 0 ? prev7.reduce((s, m) => s + m.moodScore, 0) / prev7.length : 0;

        let moodTrend: 'up' | 'down' | 'stable' = 'stable';
        if (prev7.length > 0 && recent7.length > 0) {
            const diff = recentAvg - prevAvg;
            if (diff > 0.5) moodTrend = 'up';
            else if (diff < -0.5) moodTrend = 'down';
        }

        // Completed assessments
        const completedAssessments = history.filter(h => h.status === 'COMPLETED').length;

        // Latest assessment
        const latestCompleted = history
            .filter(h => h.status === 'COMPLETED' && h.result)
            .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())[0];

        const thisWeekMoods = filteredMoods.length;
        const thisWeekJournals = filteredJournals.length;
        const thisWeekSleepLogs = filteredSleep.length;

        return {
            avgSleepQuality,
            avgSleepDuration,
            moodTrend,
            recentAvg,
            completedAssessments,
            latestCompleted,
            thisWeekMoods,
            thisWeekJournals,
            thisWeekSleepLogs,
        };
    }, [filteredMoods, filteredSleep, filteredJournals, history]);

    const getMoodIcon = (score: number) => {
        if (score >= 7) return <Smile className="size-7 text-emerald-500" />;
        if (score >= 4) return <Meh className="size-7 text-amber-500" />;
        return <Frown className="size-7 text-rose-500" />;
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        if (trend === 'up') return <TrendingUp className="size-4 text-emerald-500" />;
        if (trend === 'down') return <TrendingDown className="size-4 text-rose-500" />;
        return <Minus className="size-4 text-muted-foreground" />;
    };

    const getTrendText = (trend: 'up' | 'down' | 'stable') => {
        if (trend === 'up') return 'Đang cải thiện';
        if (trend === 'down') return 'Cần chú ý';
        return 'Ổn định';
    };

    const getStressLabel = (level: number) => {
        if (level <= 3) return { text: 'Thấp', color: 'text-emerald-600 dark:text-emerald-400' };
        if (level <= 6) return { text: 'Trung bình', color: 'text-amber-600 dark:text-amber-400' };
        return { text: 'Cao', color: 'text-rose-600 dark:text-rose-400' };
    };

    const getRiskLabel = (level?: string) => {
        switch (level) {
            case 'LOW': return { text: 'Thấp', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' };
            case 'MODERATE': return { text: 'Trung bình', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' };
            case 'HIGH': return { text: 'Cao', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/30' };
            case 'SEVERE': return { text: 'Nghiêm trọng', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
            default: return { text: 'Chưa xác định', color: 'text-muted-foreground', bg: 'bg-muted' };
        }
    };

    const getSleepLabel = (score: number) => {
        if (score >= 8) return { text: 'Rất tốt', color: 'text-emerald-600 dark:text-emerald-400' };
        if (score >= 6) return { text: 'Tốt', color: 'text-sky-600 dark:text-sky-400' };
        if (score >= 4) return { text: 'Trung bình', color: 'text-amber-600 dark:text-amber-400' };
        return { text: 'Kém', color: 'text-rose-600 dark:text-rose-400' };
    };

    const formatDuration = (hours: number) => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return m > 0 ? `${h}h${m}p` : `${h}h`;
    };

    if (healthLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-16 bg-muted rounded-2xl w-full" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-muted rounded-2xl" />
                    ))}
                </div>
                <div className="h-96 bg-muted rounded-2xl" />
            </div>
        );
    }

    const stressInfo = getStressLabel(healthSummary?.averageStressLevel || 0);
    const riskInfo = getRiskLabel(healthSummary?.riskLevel);
    const sleepInfo = getSleepLabel(stats.avgSleepQuality);

    return (
        <div className="space-y-5 lg:space-y-6 max-w-7xl mx-auto pb-6">
            {/* Header */}
            <section className="rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5 lg:p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                            Thống kê sức khỏe tinh thần
                        </h1>
                        <p className="text-muted-foreground mt-0.5">
                            Tổng hợp dữ liệu và xu hướng sức khỏe của bạn
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
                        {/* Period tabs */}
                        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl w-full sm:w-auto overflow-x-auto">
                            {PERIOD_OPTIONS.map((opt) => (
                                <button
                                    key={opt.days}
                                    onClick={() => setPeriod(opt.days)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                        period === opt.days
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="sm:shrink-0">
                            <ExportReportButton />
                        </div>
                    </div>
                </div>
            </section>

            {/* Summary Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {/* Mood Card */}
                <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-5 pb-4 px-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tâm trạng TB</span>
                            <div className="size-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Smile className="size-4 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            {getMoodIcon(healthSummary?.averageMoodScore || stats.recentAvg)}
                            <div>
                                <p className="text-2xl font-bold text-foreground leading-none">
                                    {(healthSummary?.averageMoodScore || stats.recentAvg || 0).toFixed(1)}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">/10</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                            {getTrendIcon(stats.moodTrend)}
                            <span className="text-xs text-muted-foreground">{getTrendText(stats.moodTrend)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Stress Card */}
                <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-5 pb-4 px-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Căng thẳng</span>
                            <div className="size-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                                <Activity className="size-4 text-sky-600 dark:text-sky-400" />
                            </div>
                        </div>
                        <p className={`text-2xl font-bold ${stressInfo.color}`}>
                            {(healthSummary?.averageStressLevel || 0).toFixed(1)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">/10</p>
                        <p className={`text-xs font-medium mt-1 ${stressInfo.color}`}>
                            {stressInfo.text}
                        </p>
                    </CardContent>
                </Card>

                {/* Sleep Card */}
                <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-5 pb-4 px-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Giấc ngủ</span>
                            <div className="size-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <Moon className="size-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                        {sleepLogs.length > 0 ? (
                            <>
                                <p className="text-2xl font-bold text-foreground">
                                    {stats.avgSleepQuality.toFixed(1)}<span className="text-sm font-normal text-muted-foreground">/10</span>
                                </p>
                                <p className={`text-xs font-medium mt-1 ${sleepInfo.color}`}>
                                    {sleepInfo.text}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                    <Clock className="size-3 text-muted-foreground" />
                                    <span className="text-[11px] text-muted-foreground">TB {formatDuration(stats.avgSleepDuration)}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-2xl font-bold text-muted-foreground/50">--</p>
                                <p className="text-xs text-muted-foreground mt-1">Chưa có dữ liệu</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Risk Assessment Card */}
                <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-5 pb-4 px-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rủi ro</span>
                            <div className={`size-8 rounded-lg ${riskInfo.bg} flex items-center justify-center`}>
                                <Brain className={`size-4 ${riskInfo.color}`} />
                            </div>
                        </div>
                        <p className={`text-xl font-bold ${riskInfo.color}`}>
                            {riskInfo.text}
                        </p>
                        {stats.latestCompleted?.result && (
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Điểm: {stats.latestCompleted.result.totalScore}
                            </p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            {stats.completedAssessments} bài đánh giá
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Charts Section */}
            <section>
                <MentalHealthCharts data={healthSummary?.moodTrend || []} sleepLogs={filteredSleep} />
            </section>

            {/* Bottom Row: Activity This Week + Daily Tip */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-5">
                {/* Activity Summary in period */}
                <Card className="border-border/50 shadow-sm xl:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                            <Calendar className="size-4 text-primary" />
                            Hoạt động {PERIOD_OPTIONS.find(o => o.days === period)?.label || ''} qua
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/dashboard/daily-mood" className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Smile className="size-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Ghi nhận tâm trạng</p>
                                    <p className="text-xs text-muted-foreground">Tổng: {moods.length} lần</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold text-foreground">{stats.thisWeekMoods}</span>
                                <p className="text-[10px] text-muted-foreground">tuần này</p>
                            </div>
                        </Link>

                        <Link href="/dashboard/journal" className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <BookOpen className="size-4 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Nhật ký cảm xúc</p>
                                    <p className="text-xs text-muted-foreground">Tổng: {journals.length} bài</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold text-foreground">{stats.thisWeekJournals}</span>
                                <p className="text-[10px] text-muted-foreground">tuần này</p>
                            </div>
                        </Link>

                        <Link href="/dashboard/sleep-log" className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Moon className="size-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Ghi nhận giấc ngủ</p>
                                    <p className="text-xs text-muted-foreground">Tổng: {sleepLogs.length} lần</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold text-foreground">{stats.thisWeekSleepLogs}</span>
                                <p className="text-[10px] text-muted-foreground">tuần này</p>
                            </div>
                        </Link>

                        <Link href="/dashboard/assessment" className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <ClipboardCheck className="size-4 text-rose-600 dark:text-rose-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Bài đánh giá</p>
                                    <p className="text-xs text-muted-foreground">Hoàn thành: {stats.completedAssessments}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold text-foreground">{history.length}</span>
                                <p className="text-[10px] text-muted-foreground">tổng cộng</p>
                            </div>
                        </Link>
                    </CardContent>
                </Card>

                {/* Daily Tip */}
                <div className="xl:col-span-1">
                    <DailyTip summary={healthSummary} />
                </div>
            </section>
        </div>
    );
}

export default function StatisticsPage() {
    return (
        <PinGuard resourceName="thống kê sức khỏe">
            <StatisticsContent />
        </PinGuard>
    );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { MoodTrendData } from '@/types/health.types';
import { SleepLog } from '@/types';
import { assessmentService } from '@/services/assessment';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, ComposedChart } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { Sparkles } from 'lucide-react';

interface MentalHealthChartsProps {
    data: MoodTrendData[];
    sleepLogs?: SleepLog[];
}

type AnalysisCache = {
    moodAnalysis: string;
    moodAnalysisError: string;
    stressAnalysis: string;
    stressAnalysisError: string;
    sleepAnalysis: string;
    sleepAnalysisError: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
    if (value && typeof value === 'object') {
        return value as Record<string, unknown>;
    }
    return null;
}

const chartConfig = {
    moodScore: {
        label: 'Tâm trạng',
        color: 'var(--chart-1)',
    },
    stressLevel: {
        label: 'Căng thẳng',
        color: 'var(--chart-2)',
    },
    duration: {
        label: 'Thời lượng (giờ)',
        color: 'var(--chart-3, hsl(221 83% 53%))',
    },
    sleepQualityScore: {
        label: 'Chất lượng',
        color: 'var(--chart-4, hsl(160 60% 45%))',
    },
} satisfies ChartConfig;

export default function MentalHealthCharts({ data, sleepLogs = [] }: MentalHealthChartsProps) {
    const [isAnalyzingMood, setIsAnalyzingMood] = useState(false);
    const [moodAnalysis, setMoodAnalysis] = useState<string>('');
    const [moodAnalysisError, setMoodAnalysisError] = useState<string>('');
    const [isAnalyzingStress, setIsAnalyzingStress] = useState(false);
    const [stressAnalysis, setStressAnalysis] = useState<string>('');
    const [stressAnalysisError, setStressAnalysisError] = useState<string>('');
    const [isAnalyzingSleep, setIsAnalyzingSleep] = useState(false);
    const [sleepAnalysis, setSleepAnalysis] = useState<string>('');
    const [sleepAnalysisError, setSleepAnalysisError] = useState<string>('');
    const [hasHydratedCache, setHasHydratedCache] = useState(false);

    const extractRecommendationLines = (response: unknown): string[] => {
        const responseRecord = asRecord(response);
        const responseData = asRecord(responseRecord?.data);
        const raw = responseData?.recommendations ?? responseRecord?.recommendations;
        if (!Array.isArray(raw)) return [];

        return raw
            .map((item) => {
                if (typeof item === 'string') return item.trim();
                const itemRecord = asRecord(item);
                if (!itemRecord) return '';

                const content = typeof itemRecord.content === 'string' ? itemRecord.content.trim() : '';
                const title = typeof itemRecord.title === 'string' ? itemRecord.title.trim() : '';

                if (!content) return '';
                return title ? `${title}: ${content}` : content;
            })
            .filter((line: string) => line.length > 0);
    };

    const buildCompleteAnalysisText = (response: unknown): string => {
        const responseRecord = asRecord(response);
        const responseData = asRecord(responseRecord?.data);
        const reply = String(responseData?.bot_reply || '').trim();
        const recommendationLines = extractRecommendationLines(response);

        if (!reply) return '';
        if (recommendationLines.length > 0) {
            const hasBulletList = /\n\s*[-*]\s+/.test(reply);
            if (hasBulletList) return reply;

            const bulletBlock = recommendationLines.map((line) => `- ${line}`).join('\n');
            return `${reply}\n\n${bulletBlock}`;
        }

        const endsWithSuggestionLeadIn = /gợi\s*ý\s*sau\s*:?\s*$/i.test(reply);
        if (endsWithSuggestionLeadIn) {
            return `${reply}\n\n- Hít thở sâu 4-7-8 trong 2-3 phút để giảm kích hoạt căng thẳng.\n- Tạm nghỉ 10-15 phút, đi lại nhẹ và uống nước để hạ nhịp căng thẳng.\n- Chọn 1 việc quan trọng nhất cần làm trước, tránh ôm quá nhiều việc cùng lúc.`;
        }

        return reply;
    };

    const chartData = data.map((item) => ({
        ...item,
        dateFormatted: new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    }));

    const moodOverview = useMemo(() => {
        if (!data.length) {
            return {
                averageMood: 0,
                averageStress: 0,
                positiveDays: 0,
                lowMoodDays: 0,
            };
        }

        const averageMood = data.reduce((sum, item) => sum + item.moodScore, 0) / data.length;
        const averageStress = data.reduce((sum, item) => sum + item.stressLevel, 0) / data.length;
        const positiveDays = data.filter((item) => item.moodScore >= 7).length;
        const lowMoodDays = data.filter((item) => item.moodScore <= 4).length;

        return {
            averageMood: Math.round(averageMood * 10) / 10,
            averageStress: Math.round(averageStress * 10) / 10,
            positiveDays,
            lowMoodDays,
        };
    }, [data]);

    const stressOverview = useMemo(() => {
        if (!data.length) {
            return {
                averageStress: 0,
                highStressDays: 0,
                moderateStressDays: 0,
            };
        }

        const averageStress = data.reduce((sum, item) => sum + item.stressLevel, 0) / data.length;
        const highStressDays = data.filter((item) => item.stressLevel >= 7).length;
        const moderateStressDays = data.filter((item) => item.stressLevel >= 4 && item.stressLevel < 7).length;

        return {
            averageStress: Math.round(averageStress * 10) / 10,
            highStressDays,
            moderateStressDays,
        };
    }, [data]);

    const handleAnalyzeMood = async () => {
        if (!hasData) return;

        setIsAnalyzingMood(true);
        setMoodAnalysisError('');

        try {
            const response = await assessmentService.aiChat(
                'Hãy phân tích tổng quan tâm trạng của tôi dựa trên dữ liệu dưới đây và đưa ra nhận định ngắn gọn cùng 2-3 gợi ý thực tế.',
                {
                    action: 'mood_overview_analysis',
                    moodOverview: {
                        periodDays: data.length,
                        ...moodOverview,
                    },
                    moodTrendData: data,
                },
            );

            const reply = buildCompleteAnalysisText(response);

            if (!reply) {
                setMoodAnalysisError('AI chưa trả về nội dung phân tích. Vui lòng thử lại.');
                return;
            }

            setMoodAnalysis(reply);
        } catch {
            setMoodAnalysisError('Không thể phân tích AI lúc này. Vui lòng thử lại sau.');
        } finally {
            setIsAnalyzingMood(false);
        }
    };

    const handleAnalyzeStress = async () => {
        if (!hasData) return;

        setIsAnalyzingStress(true);
        setStressAnalysisError('');

        try {
            const response = await assessmentService.aiChat(
                'Hãy phân tích tổng quan mức độ căng thẳng của tôi dựa trên dữ liệu dưới đây và đưa ra nhận định ngắn gọn cùng 2-3 gợi ý giảm căng thẳng.',
                {
                    action: 'stress_overview_analysis',
                    stressOverview: {
                        periodDays: data.length,
                        ...stressOverview,
                    },
                    stressTrendData: data.map((item) => ({
                        date: item.date,
                        stressLevel: item.stressLevel,
                    })),
                },
            );

            const reply = buildCompleteAnalysisText(response);
            if (!reply) {
                setStressAnalysisError('AI chưa trả về nội dung phân tích. Vui lòng thử lại.');
                return;
            }

            setStressAnalysis(reply);
        } catch {
            setStressAnalysisError('Không thể phân tích AI lúc này. Vui lòng thử lại sau.');
        } finally {
            setIsAnalyzingStress(false);
        }
    };

    const handleAnalyzeSleep = async () => {
        if (!hasSleepData) return;

        setIsAnalyzingSleep(true);
        setSleepAnalysisError('');

        try {
            const response = await assessmentService.aiChat(
                'Hãy phân tích tổng quan giấc ngủ của tôi dựa trên dữ liệu dưới đây. Nhấn mạnh ngủ đêm là chính, ngủ trưa là phụ và đưa ra 2-3 gợi ý thực tế.',
                {
                    action: 'sleep_overview_analysis',
                    sleepOverview,
                    sleepTrendData: sleepChartData,
                },
            );

            const reply = buildCompleteAnalysisText(response);
            if (!reply) {
                setSleepAnalysisError('AI chưa trả về nội dung phân tích. Vui lòng thử lại.');
                return;
            }

            setSleepAnalysis(reply);
        } catch {
            setSleepAnalysisError('Không thể phân tích AI lúc này. Vui lòng thử lại sau.');
        } finally {
            setIsAnalyzingSleep(false);
        }
    };

    // Prepare sleep chart data — sorted by date
    const sleepChartData = [...sleepLogs]
        .sort((a, b) => new Date(a.sleepDate).getTime() - new Date(b.sleepDate).getTime())
        .slice(-7) // last 14 entries
        .map((log) => ({
            dateFormatted: new Date(log.sleepDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            duration: Math.round(log.duration * 10) / 10,
            sleepQualityScore: log.sleepQualityScore,
        }));

    const sleepOverview = useMemo(() => {
        const nightLogs = sleepLogs.filter((log) => log.sleepType === 'night');
        const napLogs = sleepLogs.filter((log) => log.sleepType === 'nap' || (log.napStartTime && log.napEndTime));

        const averageNightDuration = nightLogs.length > 0
            ? nightLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / nightLogs.length
            : 0;
        const averageNightQuality = nightLogs.length > 0
            ? nightLogs.reduce((sum, log) => sum + (log.sleepQualityScore || 0), 0) / nightLogs.length
            : 0;

        return {
            averageNightDuration: Math.round(averageNightDuration * 10) / 10,
            averageNightQuality: Math.round(averageNightQuality * 10) / 10,
            nightCount: nightLogs.length,
            napCount: napLogs.length,
        };
    }, [sleepLogs]);

    const hasData = data.length > 0;
    const hasSleepData = sleepChartData.length > 0;

    const analysisCacheKey = useMemo(() => {
        const moodDataSignature = hasData
            ? `${data.length}-${data[0]?.date || 'na'}-${data[data.length - 1]?.date || 'na'}`
            : 'no-mood-data';

        const sleepDataSignature = hasSleepData
            ? `${sleepChartData.length}-${sleepChartData[0]?.dateFormatted || 'na'}-${sleepChartData[sleepChartData.length - 1]?.dateFormatted || 'na'}`
            : 'no-sleep-data';

        return `mental-health-ai:statistics:ai-analysis:v1:${moodDataSignature}:${sleepDataSignature}`;
    }, [data, hasData, hasSleepData, sleepChartData]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        setHasHydratedCache(false);

        try {
            const raw = window.sessionStorage.getItem(analysisCacheKey);
            if (!raw) {
                setMoodAnalysis('');
                setMoodAnalysisError('');
                setStressAnalysis('');
                setStressAnalysisError('');
                setSleepAnalysis('');
                setSleepAnalysisError('');
                setHasHydratedCache(true);
                return;
            }

            const parsed = JSON.parse(raw) as Partial<AnalysisCache>;
            setMoodAnalysis(typeof parsed.moodAnalysis === 'string' ? parsed.moodAnalysis : '');
            setMoodAnalysisError(typeof parsed.moodAnalysisError === 'string' ? parsed.moodAnalysisError : '');
            setStressAnalysis(typeof parsed.stressAnalysis === 'string' ? parsed.stressAnalysis : '');
            setStressAnalysisError(typeof parsed.stressAnalysisError === 'string' ? parsed.stressAnalysisError : '');
            setSleepAnalysis(typeof parsed.sleepAnalysis === 'string' ? parsed.sleepAnalysis : '');
            setSleepAnalysisError(typeof parsed.sleepAnalysisError === 'string' ? parsed.sleepAnalysisError : '');
        } catch {
            setMoodAnalysis('');
            setMoodAnalysisError('');
            setStressAnalysis('');
            setStressAnalysisError('');
            setSleepAnalysis('');
            setSleepAnalysisError('');
        } finally {
            setHasHydratedCache(true);
        }
    }, [analysisCacheKey]);

    useEffect(() => {
        if (typeof window === 'undefined' || !hasHydratedCache) {
            return;
        }

        const cacheValue: AnalysisCache = {
            moodAnalysis,
            moodAnalysisError,
            stressAnalysis,
            stressAnalysisError,
            sleepAnalysis,
            sleepAnalysisError,
        };

        window.sessionStorage.setItem(analysisCacheKey, JSON.stringify(cacheValue));
    }, [
        analysisCacheKey,
        hasHydratedCache,
        moodAnalysis,
        moodAnalysisError,
        stressAnalysis,
        stressAnalysisError,
        sleepAnalysis,
        sleepAnalysisError,
    ]);

    const renderAiAnalysisPanel = ({
        title,
        isLoading,
        analysis,
        error,
        hasSourceData,
    }: {
        title: string;
        isLoading: boolean;
        analysis: string;
        error: string;
        hasSourceData: boolean;
    }) => {
        return (
            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 text-left [&_p]:max-w-none">
                <div className="w-full text-left">
                    <p className="mb-2 text-sm font-medium text-foreground text-left">{title}</p>

                    {isLoading && (
                        <div className="space-y-2" aria-live="polite" aria-busy="true">
                            <div className="h-3 w-full animate-pulse rounded bg-primary/15" />
                            <div className="h-3 w-[92%] animate-pulse rounded bg-primary/15" />
                            <div className="h-3 w-[76%] animate-pulse rounded bg-primary/15" />
                            <p className="pt-1 text-xs text-muted-foreground">AI đang phân tích dữ liệu...</p>
                        </div>
                    )}

                    {!isLoading && error && (
                        <p className="text-left text-sm leading-relaxed text-destructive">{error}</p>
                    )}

                    {!isLoading && !error && analysis && (
                        <div className="flex flex-col">
                            {analysis.split('\n')
                                .map(line => line.trim())
                                .filter(line => line.length > 0)
                                .map((line, idx) => {
                                    const isBullet = line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line);
                                    let marginClass = "mt-0";
                                    if (idx > 0) {
                                        marginClass = isBullet ? "mt-1 ml-3" : "mt-3";
                                    }
                                    return (
                                        <p
                                            key={idx}
                                            className={`text-left text-sm leading-relaxed text-muted-foreground ${marginClass}`}
                                        >
                                            {line}
                                        </p>
                                    );
                                })}
                        </div>
                    )}

                    {!isLoading && !error && !analysis && (
                        <p className="text-left text-sm leading-relaxed text-muted-foreground">
                            {hasSourceData
                                ? 'Nhấn "Phân tích AI" để nhận nhận định ngắn gọn và gợi ý thực tế từ dữ liệu hiện tại.'
                                : 'Cần có dữ liệu trước khi thực hiện phân tích AI.'}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    if (!hasData && !hasSleepData) {
        return (
            <Card className="h-100 flex items-center justify-center text-muted-foreground border border-border shadow-sm bg-card">
                Chưa có dữ liệu biểu đồ
            </Card>
        );
    }

    return (
        <Tabs defaultValue={hasData ? "mood" : "sleep"} className="w-full space-y-4">
            <div className="flex items-center justify-center sm:justify-start">
                <TabsList className="grid w-full sm:w-auto sm:min-w-125 grid-cols-3 bg-muted p-1 rounded-xl">
                    <TabsTrigger
                        value="mood"
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-xs sm:text-sm"
                    >
                        Tâm trạng
                    </TabsTrigger>
                    <TabsTrigger
                        value="stress"
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-destructive data-[state=active]:shadow-sm transition-all text-xs sm:text-sm"
                    >
                        Căng thẳng
                    </TabsTrigger>
                    <TabsTrigger
                        value="sleep"
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all text-xs sm:text-sm"
                    >
                        Giấc ngủ
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="mood" className="mt-0">
                <Card className="border border-border shadow-sm bg-card">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                            <CardTitle className="text-lg font-medium text-foreground">
                                Xu hướng Tâm trạng
                            </CardTitle>
                            <CardDescription>
                                Biến động cảm xúc trong 7 ngày qua
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAnalyzeMood}
                            disabled={!hasData}
                            isLoading={isAnalyzingMood}
                            className="w-full sm:w-auto sm:shrink-0 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary"
                        >
                            {!isAnalyzingMood && <Sparkles className="w-4 h-4 mr-1.5" />}
                            {moodAnalysis ? 'Phân tích lại AI' : 'Phân tích AI'}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {hasData ? (
                            <>
                                <ChartContainer config={chartConfig} className="h-75 w-full">
                                    <AreaChart
                                        accessibilityLayer
                                        data={chartData}
                                        margin={{ left: -20, right: 12, top: 12, bottom: 12 }}
                                    >
                                        <defs>
                                            <linearGradient id="fillMood" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-moodScore)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--color-moodScore)" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                                        <XAxis
                                            dataKey="dateFormatted"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            fontSize={12}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            domain={[0, 10]}
                                            ticks={[0, 2, 4, 6, 8, 10]}
                                            fontSize={12}
                                        />
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent indicator="dot" />}
                                        />
                                        <Area
                                            dataKey="moodScore"
                                            type="monotone"
                                            fill="url(#fillMood)"
                                            fillOpacity={0.2}
                                            stroke="var(--color-moodScore)"
                                            strokeWidth={4}
                                            activeDot={{ r: 8, strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ChartContainer>

                                {renderAiAnalysisPanel({
                                    title: 'Phân tích AI tổng quan tâm trạng',
                                    isLoading: isAnalyzingMood,
                                    analysis: moodAnalysis,
                                    error: moodAnalysisError,
                                    hasSourceData: hasData,
                                })}
                            </>
                        ) : (
                            <div className="h-75 flex items-center justify-center text-muted-foreground">
                                Chưa có dữ liệu tâm trạng
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="stress" className="mt-0">
                <Card className="border border-border shadow-sm bg-card">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                            <CardTitle className="text-lg font-medium text-foreground">
                                Mức độ Căng thẳng
                            </CardTitle>
                            <CardDescription>
                                Chỉ số căng thẳng (1-10) theo ngày
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAnalyzeStress}
                            disabled={!hasData}
                            isLoading={isAnalyzingStress}
                            className="w-full sm:w-auto sm:shrink-0 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary"
                        >
                            {!isAnalyzingStress && <Sparkles className="w-4 h-4 mr-1.5" />}
                            {stressAnalysis ? 'Phân tích lại AI' : 'Phân tích AI'}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {hasData ? (
                            <>
                                <ChartContainer config={chartConfig} className="h-75 w-full">
                                    <BarChart
                                        accessibilityLayer
                                        data={chartData}
                                        margin={{ left: -20, right: 12, top: 12, bottom: 12 }}
                                    >
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                                        <XAxis
                                            dataKey="dateFormatted"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            fontSize={12}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            domain={[0, 10]}
                                            ticks={[0, 2, 4, 6, 8, 10]}
                                            fontSize={12}
                                        />
                                        <ChartTooltip
                                            cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                                            content={<ChartTooltipContent indicator="dashed" />}
                                        />
                                        <Bar
                                            dataKey="stressLevel"
                                            fill="var(--color-stressLevel)"
                                            radius={[8, 8, 0, 0]}
                                            barSize={40}
                                        />
                                    </BarChart>
                                </ChartContainer>

                                {renderAiAnalysisPanel({
                                    title: 'Phân tích AI tổng quan căng thẳng',
                                    isLoading: isAnalyzingStress,
                                    analysis: stressAnalysis,
                                    error: stressAnalysisError,
                                    hasSourceData: hasData,
                                })}
                            </>
                        ) : (
                            <div className="h-75 flex items-center justify-center text-muted-foreground">
                                Chưa có dữ liệu căng thẳng
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Sleep Chart Tab */}
            <TabsContent value="sleep" className="mt-0">
                <Card className="border border-border shadow-sm bg-card">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                            <CardTitle className="text-lg font-medium text-foreground">
                                Giấc ngủ
                            </CardTitle>
                            <CardDescription>
                                Thời lượng (giờ) và chất lượng giấc ngủ gần đây
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAnalyzeSleep}
                            disabled={!hasSleepData}
                            isLoading={isAnalyzingSleep}
                            className="w-full sm:w-auto sm:shrink-0 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary"
                        >
                            {!isAnalyzingSleep && <Sparkles className="w-4 h-4 mr-1.5" />}
                            {sleepAnalysis ? 'Phân tích lại AI' : 'Phân tích AI'}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {hasSleepData ? (
                            <>
                                <ChartContainer config={chartConfig} className="h-75 w-full">
                                    <ComposedChart
                                        accessibilityLayer
                                        data={sleepChartData}
                                        margin={{ left: -20, right: 30, top: 12, bottom: 12 }}
                                    >
                                        <defs>
                                            <linearGradient id="fillSleep" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-duration)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--color-duration)" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                                        <XAxis
                                            dataKey="dateFormatted"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            fontSize={12}
                                        />
                                        <YAxis
                                            yAxisId="duration"
                                            orientation="right"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            domain={[0, 'auto']}
                                            fontSize={12}
                                        />

                                        <YAxis
                                            yAxisId="quality"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            domain={[0, 10]}
                                            ticks={[0, 5, 10]}
                                            fontSize={12}
                                        />

                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent indicator="dot" />}
                                        />
                                        <Bar
                                            yAxisId="duration"
                                            dataKey="duration"
                                            fill="var(--color-duration)"
                                            fillOpacity={0.3}
                                            stroke="var(--color-duration)"
                                            strokeWidth={1}
                                            radius={[6, 6, 0, 0]}
                                            barSize={28}
                                        />
                                        <Line
                                            yAxisId="quality"
                                            dataKey="sleepQualityScore"
                                            type="monotone"
                                            stroke="var(--color-sleepQualityScore)"
                                            strokeWidth={3}
                                            dot={{ r: 4, strokeWidth: 0, fill: 'var(--color-sleepQualityScore)' }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    </ComposedChart>
                                </ChartContainer>

                                {renderAiAnalysisPanel({
                                    title: 'Phân tích AI tổng quan giấc ngủ',
                                    isLoading: isAnalyzingSleep,
                                    analysis: sleepAnalysis,
                                    error: sleepAnalysisError,
                                    hasSourceData: hasSleepData,
                                })}
                            </>
                        ) : (
                            <div className="h-75 flex items-center justify-center text-muted-foreground">
                                Chưa có dữ liệu giấc ngủ
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

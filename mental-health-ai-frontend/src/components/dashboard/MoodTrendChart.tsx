'use client';

import { MoodTrendData } from '@/types/health.types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';

interface MoodTrendChartProps {
    moodData: MoodTrendData[];
    trendDirection: 'improving' | 'stable' | 'declining';
    averageMoodScore: number;
}

const chartConfig = {
    moodScore: {
        label: 'Tâm trạng',
        color: 'var(--primary)',
    },
    stressLevel: {
        label: 'Căng thẳng',
        color: 'var(--destructive)',
    },
} satisfies ChartConfig;

export default function MoodTrendChart({ moodData, trendDirection, averageMoodScore }: MoodTrendChartProps) {
    if (moodData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Xu hướng tâm trạng (7 ngày)</CardTitle>
                    <CardDescription>Ghi nhận tâm trạng hàng ngày để xem xu hướng</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                    <div className="text-center py-12 text-muted-foreground">
                        <p className="mb-2">Chưa có dữ liệu tâm trạng</p>
                        <p className="text-sm">
                            Hãy ghi nhận tâm trạng hàng ngày để xem xu hướng của bạn
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    const chartData = moodData.map((item) => ({
        date: formatDate(item.date),
        moodScore: item.moodScore,
        stressLevel: item.stressLevel,
    }));

    const getTrendIcon = () => {
        switch (trendDirection) {
            case 'improving':
                return <TrendingUp className="size-4" />;
            case 'declining':
                return <TrendingDown className="size-4" />;
            default:
                return <Minus className="size-4" />;
        }
    };

    const getTrendText = () => {
        switch (trendDirection) {
            case 'improving':
                return 'Đang cải thiện';
            case 'declining':
                return 'Đang giảm sút';
            default:
                return 'Ổn định';
        }
    };

    const maxMood = Math.max(...moodData.map((d) => d.moodScore));
    const minMood = Math.min(...moodData.map((d) => d.moodScore));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Xu hướng tâm trạng (7 ngày)</CardTitle>
                <CardDescription>
                    Điểm trung bình: <span className="font-bold text-primary">{averageMoodScore.toFixed(1)}</span>/10
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <LineChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            top: 20,
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            domain={[0, 10]}
                            ticks={[0, 2, 4, 6, 8, 10]}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Line
                            dataKey="moodScore"
                            type="natural"
                            stroke="var(--color-moodScore)"
                            strokeWidth={4}
                            dot={{
                                fill: 'var(--color-moodScore)',
                            }}
                            activeDot={{
                                r: 6,
                            }}
                        >
                            <LabelList
                                position="top"
                                offset={12}
                                className="fill-foreground"
                                fontSize={12}
                            />
                        </Line>
                    </LineChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    {getTrendText()} {getTrendIcon()}
                </div>
                <div className="flex gap-4 text-muted-foreground leading-none">
                    <span>Cao nhất: <span className="font-semibold text-foreground">{maxMood}</span></span>
                    <span>Thấp nhất: <span className="font-semibold text-foreground">{minMood}</span></span>
                </div>
            </CardFooter>
        </Card>
    );
}

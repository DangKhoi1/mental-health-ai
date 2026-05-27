'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { assessmentService } from '@/services/assessment';
import { AssessmentSession } from '@/types';
import { TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

interface RiskData {
    date: string;
    score: number;
    maxScore: number;
    percentage: number;
    level: string;
    title: string;
}

const getRiskLevel = (percentage: number): { level: string; color: string; bgColor: string; description: string } => {
    if (percentage <= 25) return { level: 'Tối thiểu', color: 'text-green-600', bgColor: 'bg-green-50', description: 'Sức khỏe tinh thần tốt' };
    if (percentage <= 50) return { level: 'Nhẹ', color: 'text-yellow-600', bgColor: 'bg-yellow-50', description: 'Có dấu hiệu căng thẳng nhẹ' };
    if (percentage <= 75) return { level: 'Trung bình', color: 'text-orange-600', bgColor: 'bg-orange-50', description: 'Mức độ căng thẳng trung bình' };
    return { level: 'Nghiêm trọng', color: 'text-red-600', bgColor: 'bg-red-50', description: 'Mức độ căng thẳng cao' };
};

export default function RiskLevelDashboard() {
    const [data, setData] = useState<RiskData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentRiskLevel, setCurrentRiskLevel] = useState<ReturnType<typeof getRiskLevel> | null>(null);
    const [trend, setTrend] = useState<'up' | 'down' | 'stable' | null>(null);

    useEffect(() => {
        loadRiskData();
    }, []);

    const loadRiskData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load assessment history
            const res = await assessmentService.getHistory(1, 100);
            const sessions = (res.data?.history || []) as AssessmentSession[];

            // Transform to chart data
            const chartData = sessions
                .filter((s) => s.status === 'COMPLETED' && typeof s.result?.totalScore === 'number')
                .sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime())
                .map((session) => {
                    const score = session.result?.totalScore ?? 0;
                    const totalQuestions =
                        session.template?.questions?.length ??
                        session.template?.totalQuestions ??
                        0;
                    const maxScorePerQuestion = session.template?.maxScorePerQuestion ?? 0;
                    const computedMaxScore = totalQuestions * maxScorePerQuestion;
                    const maxScore = computedMaxScore > 0 ? computedMaxScore : 100;
                    const percentage = (score / maxScore) * 100;

                    return {
                        date: new Date(session.createdAt || '').toLocaleDateString('vi-VN', {
                            month: '2-digit',
                            day: '2-digit',
                        }),
                        score,
                        maxScore,
                        percentage: Math.round(percentage),
                        level: getRiskLevel(percentage).level,
                        title: session.template?.title || 'Đánh giá',
                    };
                });

            setData(chartData);

            // Set current risk level (latest)
            if (chartData.length > 0) {
                const latest = chartData[chartData.length - 1];
                setCurrentRiskLevel(getRiskLevel(latest.percentage));

                // Calculate trend
                if (chartData.length >= 2) {
                    const prev = chartData[chartData.length - 2];
                    if (latest.percentage > prev.percentage + 5) {
                        setTrend('up');
                    } else if (latest.percentage < prev.percentage - 5) {
                        setTrend('down');
                    } else {
                        setTrend('stable');
                    }
                }
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
            setError(`Không thể tải dữ liệu rủi ro tinh thần: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const statistics = useMemo(() => {
        if (data.length === 0) return null;

        const scores = data.map((d) => d.percentage);
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);

        return { avgScore, maxScore, minScore };
    }, [data]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Theo dõi mức độ rủi ro tinh thần</h2>
                <p className="mt-1 text-sm text-muted-foreground">Xem xu hướng sức khỏe tinh thần của bạn theo thời gian</p>
            </div>

            {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Spinner />
                </div>
            ) : data.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertCircle className="mx-auto mb-4 size-12 text-slate-400" />
                        <p className="text-slate-600 mb-2">Chưa có dữ liệu đánh giá nào</p>
                        <p className="text-sm text-slate-500">
                            Hãy hoàn thành tối thiểu 1 bài đánh giá để xem xu hướng sức khỏe tinh thần của bạn.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Current Status */}
                    {currentRiskLevel && (
                        <Card className={`border-2 ${currentRiskLevel.bgColor}`}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 mb-1">Mức độ rủi ro hiện tại</p>
                                        <p className={`text-3xl font-bold ${currentRiskLevel.color}`}>
                                            {currentRiskLevel.level}
                                        </p>
                                        <p className="text-slate-600 mt-2">{currentRiskLevel.description}</p>
                                    </div>
                                    <div className="text-right">
                                        {trend && (
                                            <div className="flex items-center gap-2 justify-end mb-2">
                                                {trend === 'up' && <TrendingUp size={24} className="text-red-600" />}
                                                {trend === 'down' && <TrendingDown size={24} className="text-green-600" />}
                                                {trend === 'stable' && <span className="text-slate-400 text-2xl">, </span>}
                                                <span className="text-sm text-slate-600 font-medium">
                                                    {trend === 'up' && 'Tăng'}
                                                    {trend === 'down' && 'Giảm'}
                                                    {trend === 'stable' && 'Ổn định'}
                                                </span>
                                            </div>
                                        )}
                                        <Badge variant="outline" className="text-base py-1 px-3">
                                            {data[data.length - 1].percentage}%
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Statistics */}
                    {statistics && (
                        <div className="grid grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm text-slate-600 mb-2">Điểm trung bình</p>
                                    <p className="text-3xl font-bold text-slate-900">{statistics.avgScore}%</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm text-slate-600 mb-2">Điểm thấp nhất</p>
                                    <p className="text-3xl font-bold text-green-600">{statistics.minScore}%</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm text-slate-600 mb-2">Điểm cao nhất</p>
                                    <p className="text-3xl font-bold text-red-600">{statistics.maxScore}%</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Xu hướng rủi ro theo thời gian</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis domain={[0, 100]} label={{ value: 'Phần trăm rủi ro (%)', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip
                                        formatter={(value) => `${value}%`}
                                        labelFormatter={(label) => `Ngày: ${label}`}
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="percentage"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={{ fill: '#ef4444', r: 5 }}
                                        activeDot={{ r: 7 }}
                                        name="Mức độ rủi ro (%)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Assessment History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Lịch sử đánh giá</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {data.map((item, idx) => {
                                    const risk = getRiskLevel(item.percentage);
                                    return (
                                        <div key={idx} className="flex items-center justify-between p-3 border rounded hover:bg-slate-50">
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">{item.title}</p>
                                                <p className="text-sm text-slate-600">{item.date}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <Badge variant="outline">{risk.level}</Badge>
                                                    <p className={`text-lg font-bold mt-1 ${risk.color}`}>{item.percentage}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

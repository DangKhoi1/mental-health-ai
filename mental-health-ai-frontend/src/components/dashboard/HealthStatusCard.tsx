import { HealthSummary } from '@/types/health.types';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

interface HealthStatusCardProps {
    healthSummary: HealthSummary;
}

export default function HealthStatusCard({ healthSummary }: HealthStatusCardProps) {
    const { currentStatus, statusColor, latestAssessment, trendDirection, riskLevel, hasData } = healthSummary;

    if (!hasData) {
        return (
            <div suppressHydrationWarning className="rounded-2xl bg-card border border-border shadow-md p-6">
                <div className="text-center py-8">
                    <Activity className="size-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-foreground mb-2">Chưa có dữ liệu sức khỏe tinh thần</p>
                    <p className="text-sm text-muted-foreground">
                        Hãy hoàn thành bài đánh giá hoặc ghi nhận tâm trạng để xem tình trạng sức khỏe của bạn
                    </p>
                </div>
            </div>
        );
    }

    const getStatusColorClasses = (color: string) => {
        const colorMap: Record<string, string> = {
            green: 'from-green-500/20 to-emerald-500/10 border-green-500/30 text-green-700 dark:text-green-400',
            blue: 'from-blue-500/20 to-sky-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',
            yellow: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
            orange: 'from-orange-500/20 to-red-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400',
            red: 'from-red-500/20 to-rose-500/10 border-red-500/30 text-red-700 dark:text-red-400',
            gray: 'from-gray-500/20 to-slate-500/10 border-gray-500/30 text-gray-700 dark:text-gray-400',
        };
        return colorMap[color] || colorMap.gray;
    };

    const getTrendIcon = () => {
        switch (trendDirection) {
            case 'improving':
                return <TrendingUp className="size-5 text-green-600 dark:text-green-400" />;
            case 'declining':
                return <TrendingDown className="size-5 text-red-600 dark:text-red-400" />;
            default:
                return <Minus className="size-5 text-gray-600 dark:text-gray-400" />;
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

    return (
        <div className="rounded-2xl bg-card border border-border shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                    Tình trạng sức khỏe tinh thần
                </h3>
                <div className="flex items-center gap-2">
                    {getTrendIcon()}
                    <span className="text-sm font-medium text-muted-foreground">
                        {getTrendText()}
                    </span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                { }
                <div className={`rounded-xl bg-gradient-to-br ${getStatusColorClasses(statusColor)} border-2 p-6 transition-all duration-300 hover:scale-[1.02]`}>
                    <div className="text-sm font-medium opacity-80 mb-2">Trạng thái hiện tại</div>
                    <div className="text-2xl sm:text-3xl font-bold">{currentStatus}</div>
                    <div className="mt-2 text-xs opacity-70">
                        Mức độ rủi ro: {riskLevel}
                    </div>
                </div>

                { }
                {latestAssessment && (
                    <div className="rounded-xl bg-muted/50 border-2 border-primary/20 p-6 transition-all duration-300 hover:scale-[1.02]">
                        <div className="text-sm font-medium text-primary mb-2">
                            Đánh giá gần nhất
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                            {latestAssessment.title}
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-lg font-semibold text-primary">
                                {latestAssessment.score}/{latestAssessment.maxScore}
                            </span>
                            <span className="text-sm text-muted-foreground">điểm</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {new Date(latestAssessment.completedAt).toLocaleDateString('vi-VN')}
                        </div>
                    </div>
                )}

                {!latestAssessment && (
                    <div className="rounded-xl bg-muted/30 border-2 border-muted p-6 flex items-center justify-center">
                        <div className="text-center">
                            <Activity className="size-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Chưa có đánh giá gần đây
                            </p>
                            <p className="text-xs text-muted-foreground/80 mt-1">
                                Hãy làm bài đánh giá để biết thêm
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

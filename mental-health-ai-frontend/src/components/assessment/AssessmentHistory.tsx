import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AssessmentSession, SessionStatus } from '@/types';
import {
    TrendingUp,
    ArrowRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    Filter,
} from 'lucide-react';
import { ONBOARDING_ASSESSMENT_TYPE_CODE } from '@/constants/onboardingAssessment';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface AssessmentHistoryProps {
    history: AssessmentSession[];
}

const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

function isSessionExpired(session: AssessmentSession): boolean {
    if (session.status === SessionStatus.EXPIRED) return true;
    if (session.status !== SessionStatus.PENDING) return false;

    const createdAt = new Date(session.createdAt).getTime();
    const now = Date.now();
    return now - createdAt > SESSION_TIMEOUT_MS;
}

function getSessionSortTime(session: AssessmentSession): number {
    const referenceTime = session.completedAt || session.createdAt;
    const time = new Date(referenceTime).getTime();
    return Number.isFinite(time) ? time : 0;
}

export default function AssessmentHistory({ history }: AssessmentHistoryProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'EXPIRED'>('ALL');

    const filteredHistory = useMemo(() => {
        return history
            .filter((session) => {
                const matchesSearch =
                    session.template?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    session.assessmentSessionId.includes(searchTerm);

                const isExpired = isSessionExpired(session);
                let matchesStatus = true;

                if (statusFilter === 'PENDING') matchesStatus = session.status === SessionStatus.PENDING && !isExpired;
                if (statusFilter === 'COMPLETED') matchesStatus = session.status === SessionStatus.COMPLETED || !!session.result;
                if (statusFilter === 'EXPIRED') matchesStatus = isExpired;

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => getSessionSortTime(b) - getSessionSortTime(a));
    }, [history, searchTerm, statusFilter]);

    if (history.length === 0) {
        return (
            <div className="text-center py-16 bg-card rounded-2xl border-2 border-dashed border-border">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <TrendingUp className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                    Chưa có lịch sử
                </h3>
                <p className="text-muted-foreground">
                    Bạn chưa thực hiện bài đánh giá nào.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm bài đánh giá..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
                    />
                </div>
                <div className="relative min-w-37.5">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as 'ALL' | 'PENDING' | 'COMPLETED' | 'EXPIRED')}>
                        <SelectTrigger className="w-[#180px] pl-9 h-10 rounded-xl bg-background border-input focus:ring-ring focus:border-transparent">
                            <SelectValue placeholder="Lọc trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả</SelectItem>
                            <SelectItem value="PENDING">Đang làm</SelectItem>
                            <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                            <SelectItem value="EXPIRED">Quá hạn</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-4">
                {filteredHistory.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        Không tìm thấy bài đánh giá nào phù hợp.
                    </div>
                ) : (
                    filteredHistory.map((session) => {
                        const expired = isSessionExpired(session);
                        const isCompleted = session.status === SessionStatus.COMPLETED || !!session.result;

                        return (
                            <div
                                key={session.assessmentSessionId}
                                className="group bg-card rounded-2xl p-5 border border-border hover:shadow-lg transition-all duration-300"
                            >
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isCompleted
                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                : expired
                                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                                    : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                                }`}>
                                                {isCompleted ? (
                                                    <>
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Hoàn thành
                                                    </>
                                                ) : expired ? (
                                                    <>
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        Quá hạn
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="w-3.5 h-3.5" />
                                                        Đang làm
                                                    </>
                                                )}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-medium">
                                                {new Date(session.createdAt).toLocaleDateString('vi-VN', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-foreground text-lg mb-1">
                                            {session.template?.title || `Bài đánh giá #${session.assessmentSessionId.slice(-6)}`}
                                        </h3>

                                        {session.result?.totalScore !== undefined && (
                                            <p className="text-sm text-muted-foreground">
                                                Kết quả: <span className="font-semibold text-primary">{session.result.totalScore} điểm</span>
                                            </p>
                                        )}
                                    </div>

                                    <div className="w-full sm:w-auto">
                                        {!isCompleted ? (
                                            expired ? (
                                                <button
                                                    disabled
                                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-muted text-muted-foreground rounded-xl font-medium cursor-not-allowed"
                                                >
                                                    <AlertCircle className="w-4 h-4" />
                                                    Đã quá hạn
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => router.push(`/dashboard/assessment/do-assessment?sessionId=${session.assessmentSessionId}`)}
                                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium transition-colors shadow-md shadow-yellow-500/20"
                                                >
                                                    Tiếp tục
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            )
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    if (session.result) {
                                                        const resultData = encodeURIComponent(JSON.stringify({
                                                            totalScore: session.result.totalScore,
                                                            resultLevelCode: session.result.resultLevelCode,
                                                            typeCode: session.template?.typeCode,
                                                            templateTitle: session.template?.title,
                                                            maxScore: session.template?.typeCode === ONBOARDING_ASSESSMENT_TYPE_CODE ? 18 : undefined,
                                                            status: SessionStatus.COMPLETED,
                                                            completedAt: session.completedAt || new Date().toISOString(),
                                                        }));
                                                        router.push(`/dashboard/assessment/result-assessment?result=${resultData}`);
                                                    }
                                                }}
                                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground rounded-xl font-medium transition-all"
                                            >
                                                Xem lại kết quả
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
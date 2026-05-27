import { AssessmentQuestion, AssessmentSession } from '@/types';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    ClipboardList,
    Home,
    LayoutDashboard,
} from 'lucide-react';
import { isOnboardingAssessmentType } from '@/constants/onboardingAssessment';

interface AssessmentSessionProps {
    session: AssessmentSession;
    questions: AssessmentQuestion[];
    currentQuestionIndex: number;
    answers: Record<string, { questionId: string; score: number; optionId?: string }>;
    onAnswer: (questionId: string, score: number, optionId: string) => void;
    onNext: () => void;
    onPrev: () => void;
    onSubmit: () => void;
    onJumpToQuestion?: (index: number) => void;
}

type SeverityBand = {
    min: number;
    max: number;
    label: string;
    colorClass: string;
};

function getSeverityScale(typeCode?: string): { title: string; bands: SeverityBand[]; referenceUrl?: string } | null {
    const normalizedType = (typeCode || '').toUpperCase();

    if (normalizedType.includes('PHQ9') || normalizedType.includes('PHQ-9')) {
        return {
            title: 'Phân loại mức độ PHQ-9',
            bands: [
                { min: 0, max: 4, label: 'Không trầm cảm', colorClass: 'bg-emerald-100 text-emerald-900' },
                { min: 5, max: 9, label: 'Trầm cảm nhẹ', colorClass: 'bg-sky-100 text-sky-900' },
                { min: 10, max: 14, label: 'Trầm cảm trung bình', colorClass: 'bg-amber-100 text-amber-900' },
                { min: 15, max: 19, label: 'Trầm cảm nặng', colorClass: 'bg-orange-100 text-orange-900' },
                { min: 20, max: 27, label: 'Trầm cảm rất nặng', colorClass: 'bg-rose-100 text-rose-900' },
            ],
            referenceUrl: 'https://sns.org.vn/tram-cam-co-chua-duoc-khong',
        };
    }

    if (normalizedType.includes('GAD7') || normalizedType.includes('GAD-7')) {
        return {
            title: 'Phân loại mức độ GAD-7',
            bands: [
                { min: 0, max: 4, label: 'Lo âu tối thiểu', colorClass: 'bg-emerald-100 text-emerald-900' },
                { min: 5, max: 9, label: 'Lo âu nhẹ', colorClass: 'bg-sky-100 text-sky-900' },
                { min: 10, max: 14, label: 'Lo âu trung bình', colorClass: 'bg-amber-100 text-amber-900' },
                { min: 15, max: 21, label: 'Lo âu nặng', colorClass: 'bg-rose-100 text-rose-900' },
            ],
        };
    }

    return null;
}

export default function AssessmentSessionView({
    session,
    questions,
    currentQuestionIndex,
    answers,
    onAnswer,
    onNext,
    onPrev,
    onSubmit,
    onJumpToQuestion,
}: AssessmentSessionProps) {
    const { isAuthenticated } = useAuthStore();
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion?.assessmentQuestionId];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const isGuestSession = session.assessmentSessionId?.startsWith('guest');
    const isOnboardingSession = isOnboardingAssessmentType(session.template?.typeCode);
    const isStrictOnboarding = isOnboardingSession && !isGuestSession;
    const showDashboardNav = isAuthenticated && !isGuestSession;
    const assessmentListHref = showDashboardNav ? '/dashboard/assessment' : '/assessment';
    const homeOrDashboardHref = showDashboardNav ? '/dashboard' : '/trangchu';
    const answeredCount = questions.filter((q) => !!answers[q.assessmentQuestionId]).length;
    const progress = (answeredCount / questions.length) * 100;
    const allAnswered = answeredCount === questions.length;
    const unansweredCount = questions.length - answeredCount;
    const severityScale = getSeverityScale(session.template?.typeCode);

    if (!currentQuestion) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50/60">
                <div className="text-center text-muted-foreground animate-pulse flex flex-col items-center gap-3">
                    <Sparkles className="size-8 opacity-50" />
                    <p>Không tìm thấy câu hỏi</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex flex-col bg-linear-to-b from-slate-50 via-white to-slate-50 overflow-hidden">
            <div className="flex-none border-b border-slate-200/80 bg-white/85 backdrop-blur-md shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4">
                    <div className="flex flex-col gap-2 sm:gap-3">
                        <div className="flex items-center justify-between gap-2">
                            <h1 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-tight line-clamp-1">
                                {session.template?.title || 'Bài đánh giá Tâm lý'}
                            </h1>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                {!isStrictOnboarding && (
                                    <>
                                        <Link
                                            href={assessmentListHref}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary border border-slate-200 px-2 sm:px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors"
                                            title="Danh sách bài"
                                        >
                                            <ClipboardList className="size-3.5" />
                                            <span className="hidden sm:inline">Danh sách</span>
                                        </Link>
                                        <Link
                                            href={homeOrDashboardHref}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary border border-slate-200 px-2 sm:px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors"
                                            title={showDashboardNav ? 'Dashboard' : 'Trang chủ'}
                                        >
                                            {showDashboardNav ? <LayoutDashboard className="size-3.5" /> : <Home className="size-3.5" />}
                                            <span className="hidden sm:inline">{showDashboardNav ? 'Dashboard' : 'Trang chủ'}</span>
                                        </Link>
                                    </>
                                )}
                                <span className="text-[10px] sm:text-sm font-semibold text-primary/90 bg-primary/10 border border-primary/20 px-2 py-1 rounded-full whitespace-nowrap">
                                    {answeredCount}/{questions.length} - {Math.round(progress)}%
                                </span>
                            </div>
                        </div>

                        <div className="h-1.5 sm:h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                <div className="max-w-5xl w-full mx-auto grid grid-cols-1 xl:grid-cols-3 gap-4 pb-2">
                    <div className="xl:col-span-2 flex flex-col gap-4">
                        {severityScale && (
                            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                                <h3 className="text-lg font-semibold text-slate-800 text-center mb-4">{severityScale.title}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {severityScale.bands.map((band) => (
                                        <div
                                            key={`${band.min}-${band.max}`}
                                            className={`rounded-xl px-3 py-2.5 text-sm text-center font-medium ${band.colorClass} ${severityScale.bands.length % 2 === 1 && band.max === severityScale.bands[severityScale.bands.length - 1].max ? 'sm:col-span-2' : ''}`}
                                        >
                                            <span className="font-bold">{band.min}-{band.max}</span>: {band.label}
                                        </div>
                                    ))}
                                </div>
                                {/* {severityScale.referenceUrl && (
                                <p className="mt-4 text-center text-sm text-muted-foreground">
                                    Bạn có thể tìm hiểu thêm tại:{' '}
                                    <a
                                        href={severityScale.referenceUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary underline hover:no-underline"
                                    >
                                        {severityScale.referenceUrl}
                                    </a>
                                </p>
                            )} */}
                            </div>
                        )}

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <h3 className="text-xl font-semibold text-slate-800">Câu hỏi hiện tại</h3>
                                <span className="text-sm font-medium text-slate-500">Câu {currentQuestionIndex + 1}/{questions.length}</span>
                            </div>

                            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div className="shrink-0 size-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg sm:text-xl">
                                    {currentQuestionIndex + 1}
                                </div>
                                <h2 className="text-lg sm:text-xl font-semibold text-slate-800 leading-relaxed pt-1 sm:pt-2">
                                    {currentQuestion.content}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:gap-2.5">
                                {currentQuestion.options?.map((option) => {
                                    const isSelected = currentAnswer?.score === option.score;

                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => onAnswer(currentQuestion.assessmentQuestionId, option.score, option.id)}
                                            className={`w-full group cursor-pointer text-left p-3.5 sm:p-4 outline-none rounded-2xl border-2 transition-all duration-200 relative overflow-hidden ${isSelected
                                                ? 'border-primary bg-primary/5 shadow-sm'
                                                : 'border-slate-200 hover:border-primary/40 focus:border-primary/40 bg-white'
                                                }`}
                                            type="button"
                                        >
                                            <div className="flex items-center justify-between gap-3 relative z-10">
                                                <span className={`text-sm sm:text-[15px] font-medium transition-colors ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                                                    {option.optionText}
                                                </span>

                                                <div className="shrink-0">
                                                    <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                                        ? 'border-primary bg-primary text-white scale-110'
                                                        : 'border-slate-300 text-transparent group-hover:border-primary/40'
                                                        }`}>
                                                        <CheckCircle2 className={`size-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-1">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm xl:sticky xl:top-4">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <h3 className="text-base sm:text-lg font-semibold text-slate-800">Tổng quan câu hỏi</h3>
                                <span className="text-sm font-semibold text-orange-600">{answeredCount}/{questions.length}</span>
                            </div>

                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%` }} />
                            </div>

                            <div className="grid grid-cols-5 sm:grid-cols-6 xl:grid-cols-4 gap-2 mb-4">
                                {questions.map((q, index) => {
                                    const isCurrent = index === currentQuestionIndex;
                                    const isAnswered = !!answers[q.assessmentQuestionId];

                                    let buttonClass = 'bg-slate-100 text-slate-700';
                                    if (isAnswered) buttonClass = 'bg-emerald-500 text-white border-emerald-500 shadow-md';
                                    if (isCurrent) buttonClass = 'bg-primary text-white ring-2 ring-primary ring-offset-2';

                                    return (
                                        <button
                                            key={q.assessmentQuestionId}
                                            type="button"
                                            onClick={() => onJumpToQuestion?.(index)}
                                            disabled={!onJumpToQuestion}
                                            className={`h-10 rounded-xl text-sm font-semibold transition-colors ${buttonClass} ${onJumpToQuestion ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex flex-wrap items-center gap-5 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="inline-block size-5 rounded-md bg-primary ring-2 ring-primary ring-offset-2" />
                                    <span>Câu hiện tại</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block size-5 rounded-md bg-emerald-500" />
                                    <span>Đã trả lời</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block size-5 rounded-md bg-slate-100 border border-slate-200" />
                                    <span>Chưa trả lời</span>
                                </div>
                            </div>

                            {!allAnswered && (
                                <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
                                    <p className="text-xs sm:text-sm text-amber-700 font-medium">
                                        Còn {unansweredCount} câu chưa trả lời
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-none bg-white/85 backdrop-blur-md border-t border-slate-200/80 pb-20 sm:pb-0">
                <div className="max-w-5xl w-full mx-auto p-3 sm:p-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            onClick={onPrev}
                            disabled={currentQuestionIndex === 0}
                            type="button"
                            className="cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-white text-slate-700 rounded-2xl font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm border border-slate-200"
                        >
                            <ChevronLeft className="size-4 sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline">Quay lại</span>
                        </button>

                        {isLastQuestion ? (
                            <button
                                onClick={onSubmit}
                                disabled={!allAnswered}
                                type="button"
                                className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-primary text-white rounded-2xl font-bold text-sm sm:text-base hover:shadow-md disabled:opacity-50 disabled:hover:shadow-none disabled:cursor-not-allowed transition-all"
                            >
                                <span>Hoàn thành</span>
                                <CheckCircle2 className="size-4 sm:w-5 sm:h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={onNext}
                                disabled={!currentAnswer}
                                type="button"
                                className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-primary text-white rounded-2xl font-bold text-sm sm:text-base hover:shadow-md disabled:opacity-50 disabled:hover:shadow-none disabled:cursor-not-allowed transition-all"
                            >
                                <span>Tiếp theo</span>
                                <ChevronRight className="size-4 sm:w-5 sm:h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
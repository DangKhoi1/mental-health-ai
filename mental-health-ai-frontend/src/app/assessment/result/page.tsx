'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowRight, Bot, ClipboardList, Home, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getAssessmentResultInfo } from '@/components/assessment/assessmentResultConfig';
import { useChatStore, useAuthStore } from '@/stores';

function PublicResultContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [animatedScore, setAnimatedScore] = useState(0);
    const [showContent, setShowContent] = useState(false);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const resultParam = searchParams.get('result');

    useEffect(() => {
        if (!resultParam) {
            router.replace('/assessment');
        }
    }, [resultParam, router]);

    let resultData: {
        totalScore: number;
        resultLevelCode: string;
        completedAt: string;
        typeCode?: string;
        isGuest?: boolean;
    } | null = null;
    try {
        resultData = resultParam ? JSON.parse(decodeURIComponent(resultParam)) : null;
    } catch {
        resultData = null;
    }

    const {
        totalScore = 0,
        resultLevelCode = '',
        completedAt = new Date().toISOString(),
        typeCode,
        isGuest = false,
    } = resultData || {};

    useEffect(() => {
        if (!resultData) return;
        const scoreTimer = setTimeout(() => {
            setAnimatedScore(totalScore);
        }, 300);
        const contentTimer = setTimeout(() => {
            setShowContent(true);
        }, 600);
        return () => {
            clearTimeout(scoreTimer);
            clearTimeout(contentTimer);
        };
    }, [totalScore, resultData]);

    if (!resultData) return null;

    const resultInfo = getAssessmentResultInfo(resultLevelCode, typeCode);
    const Icon = resultInfo.icon;
    const percentage = Math.min(100, Math.max(0, (animatedScore / resultInfo.maxScore) * 100));
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-[#eaf2e8] via-[#f0f4ea] to-[#f5ece6] px-4 pb-24 pt-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-linear-to-b from-primary/8 via-transparent to-transparent" />
            <div className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 top-40 h-96 w-96 rounded-full bg-[#f5ece6]/60 blur-3xl" />

            <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
                <Link href="/trangchu" className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/85 px-3 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-card">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
                        <img src="/mental_health.png" alt="Logo" width={20} height={20} className="brightness-0 invert" />
                    </div>
                    Mental Health AI
                </Link>

                <div className="flex flex-wrap items-center gap-2">
                    <Link href="/trangchu" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground">
                        <Home className="h-4 w-4" />
                        Trang chủ
                    </Link>
                    <Link href="/assessment" className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground">
                        Danh sách bài đánh giá
                    </Link>
                </div>
            </div>

            <div className={cn(
                'relative mx-auto mt-8 grid w-full max-w-7xl gap-6 lg:grid-cols-[340px_minmax(0,1fr)] transition-all duration-700',
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            )}>
                <aside className="rounded-3xl border border-white/70 bg-white/55 backdrop-blur-2xl p-6 shadow-[0_8px_32px_rgba(142,179,122,0.1)] lg:sticky lg:top-8 lg:h-fit">
                    <div className={cn('inline-flex rounded-full px-4 py-1.5 text-xs font-semibold', resultInfo.badgeBg, resultInfo.color)}>
                        {resultInfo.level}
                    </div>

                    <div className="mt-6 flex justify-center">
                        <div className="relative h-52 w-52">
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" className="stroke-muted/20" />
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="54"
                                    fill="none"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    className={cn(resultInfo.ringColor, 'transition-all duration-1000 ease-out')}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className={cn('text-5xl font-bold tracking-tight', resultInfo.color)}>{Math.round(animatedScore)}</span>
                                <span className="mt-1 text-sm text-muted-foreground">/ {resultInfo.maxScore} điểm</span>
                                <span className="mt-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                                    Tổng điểm đánh giá
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
                            <p className="text-xs text-muted-foreground">Mức độ</p>
                            <p className={cn('mt-1 text-sm font-semibold', resultInfo.color)}>{resultInfo.level}</p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
                            <p className="text-xs text-muted-foreground">Điểm số</p>
                            <p className="mt-1 text-sm font-semibold text-foreground">{Math.round(totalScore)} / {resultInfo.maxScore}</p>
                        </div>
                    </div>

                    <div className="mt-3 rounded-2xl border border-border/70 bg-secondary/20 p-4 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">Thời điểm hoàn thành</p>
                        <p className="mt-1 leading-relaxed">{new Date(completedAt).toLocaleString('vi-VN')}</p>
                    </div>
                </aside>

                <section className="space-y-6">
                    <div className="rounded-3xl border border-white/70 bg-white/55 backdrop-blur-2xl px-6 py-7 shadow-[0_8px_32px_rgba(142,179,122,0.1)] sm:px-8">
                        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                            <div className="max-w-3xl space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-muted-foreground">Kết quả đánh giá của bạn</p>
                                    <span className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                                        Đã hoàn thành
                                    </span>
                                </div>
                                <h1 className={cn('text-3xl font-semibold tracking-tight sm:text-4xl', resultInfo.color)}>
                                    {resultInfo.title}
                                </h1>
                                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                                    {resultInfo.message}
                                </p>
                                <div className={cn('inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium', resultInfo.bgColor, resultInfo.borderColor, resultInfo.color)}>
                                    <Icon className="h-4 w-4" />
                                    {resultInfo.highlight}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 xl:min-w-65 xl:grid-cols-1">
                                <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
                                    <p className="text-xs text-muted-foreground">Tình trạng hiện tại</p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">{resultInfo.level}</p>
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
                                    <p className="text-xs text-muted-foreground">Khuyến nghị</p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">{resultInfo.recommendations.length} gợi ý</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                        <div className="rounded-3xl border border-white/70 bg-white/55 backdrop-blur-2xl p-6 shadow-[0_8px_32px_rgba(142,179,122,0.08)]">
                            <div className="mb-5 flex items-center gap-3">
                                <div className={cn('rounded-2xl p-2.5', resultInfo.bgColor)}>
                                    <ClipboardList className={cn('h-4 w-4', resultInfo.color)} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Gợi ý phù hợp lúc này</h2>
                                    <p className="text-sm text-muted-foreground">Chọn các việc nhỏ, dễ bắt đầu ngay hôm nay.</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {resultInfo.recommendations.map((item, index) => {
                                    const ItemIcon = item.icon;
                                    return (
                                        <div key={`${item.text}-${index}`} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-secondary/20 p-4">
                                            <div className={cn('mt-0.5 rounded-xl p-2', resultInfo.bgColor)}>
                                                <ItemIcon className={cn('h-3.5 w-3.5', resultInfo.color)} />
                                            </div>
                                            <p className="text-sm leading-relaxed text-foreground/85">{item.text}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-white/70 bg-white/55 backdrop-blur-2xl p-6 shadow-[0_8px_32px_rgba(142,179,122,0.08)]">
                            <div className="mb-5 flex items-center gap-3">
                                <div className={cn('rounded-2xl p-2.5', resultInfo.bgColor)}>
                                    <ArrowRight className={cn('h-4 w-4', resultInfo.color)} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Bạn có thể làm tiếp</h2>
                                    <p className="text-sm text-muted-foreground">Một chuỗi hành động ngắn, rõ ràng và dễ theo dõi.</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {resultInfo.nextSteps.map((step, index) => (
                                    <div key={`${step}-${index}`} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 p-4">
                                        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold', resultInfo.badgeBg, resultInfo.color)}>
                                            {index + 1}
                                        </span>
                                        <p className="text-sm leading-relaxed text-foreground/85">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {resultInfo.safetyNotice && (
                        <div className="rounded-[28px] border border-rose-200 bg-rose-50/80 p-6 shadow-sm dark:border-rose-800 dark:bg-rose-950/25 sm:p-7">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300">
                                    <AlertTriangle className="h-4 w-4" />
                                </div>
                                <div className="space-y-3">
                                    <p className="text-base font-semibold text-rose-700 dark:text-rose-300">
                                        {resultInfo.safetyNotice.title}
                                    </p>
                                    <p className="text-sm leading-relaxed text-rose-700/90 dark:text-rose-200/90">
                                        {resultInfo.safetyNotice.description}
                                    </p>
                                    <div className="space-y-2">
                                        {resultInfo.safetyNotice.actions.map((action, index) => (
                                            <div key={`${action}-${index}`} className="flex items-start gap-2 rounded-xl border border-rose-200/70 bg-background/70 p-3 dark:border-rose-800/70 dark:bg-background/30">
                                                <span className="mt-0.5 text-xs font-semibold text-rose-600 dark:text-rose-300">{index + 1}.</span>
                                                <p className="text-sm text-foreground/90">{action}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="rounded-[28px] border border-primary/15 bg-linear-to-r from-primary/6 via-background to-secondary/15 p-6 shadow-sm sm:p-7">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-sm font-semibold text-primary">Lưu kết quả để theo dõi tiếp</p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Tạo tài khoản để lưu lịch sử đánh giá</h2>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                    Kết quả hiện tại chỉ hiển thị trong phiên này. Khi tạo tài khoản, bạn có thể lưu lại kết quả, theo dõi thay đổi theo thời gian và nhận gợi ý phù hợp hơn.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
                                {isGuest && (
                                    <>
                                        <Link href="/auth/register?reason=save_result" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90">
                                            <UserPlus className="h-4 w-4" />
                                            Tạo tài khoản mới
                                        </Link>
                                    </>
                                )}

                                {isAuthenticated && (
                                    <button
                                        type="button"
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-background px-5 py-3 text-sm font-medium text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5"
                                        onClick={() => {
                                            const prompt = `Tôi vừa hoàn thành bài đánh giá sức khỏe tinh thần:\n- Tiêu đề: ${resultInfo.title}\n- Mức độ: ${resultInfo.level}\n- Điểm số: ${Math.round(totalScore)}/${resultInfo.maxScore}\n- Đánh giá: "${resultInfo.message}"\n\nDựa trên kết quả này, bạn có thể phân tích sâu hơn và đưa ra lộ trình cải thiện cụ thể trong 2 tuần tới không?`;

                                            const context = {
                                                title: resultInfo.title,
                                                level: resultInfo.level,
                                                totalScore: Math.round(totalScore),
                                                maxScore: resultInfo.maxScore,
                                                message: resultInfo.message,
                                                recommendations: resultInfo.recommendations.map((item) => item.text),
                                            };

                                            useChatStore.getState().openChat(prompt, context);
                                        }}
                                    >
                                        <Bot className="h-4 w-4 text-primary" />
                                        Phân tích AI
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default function PublicAssessmentResultPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <PublicResultContent />
        </Suspense>
    );
}

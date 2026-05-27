'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { assessmentService } from '@/services/assessment';
import { AssessmentTemplate } from '@/types';
import { ClipboardList, Clock, ArrowRight, Heart, ChevronRight, Home, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { isOnboardingAssessmentType } from '@/constants/onboardingAssessment';
import Image from 'next/image';

export default function PublicAssessmentPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const estimateDuration = (totalQuestions?: number) => {
        if (!totalQuestions || totalQuestions <= 0) return '~5 phút';
        if (totalQuestions <= 10) return '~3 phút';
        if (totalQuestions <= 20) return '~5 phút';
        return '~8 phút';
    };

    useEffect(() => {
        assessmentService.getPublicTemplates()
            .then(res => {
                const t = res?.data?.templates;
                if (Array.isArray(t)) {
                    // Sắp xếp bài MHB6 lên đầu nếu có
                    const sorted = [...t].sort((a, b) => {
                        if (isOnboardingAssessmentType(a.typeCode)) return -1;
                        if (isOnboardingAssessmentType(b.typeCode)) return 1;
                        return 0;
                    });
                    setTemplates(sorted);
                }
            })
            .catch((err) => {
                console.error("PublicAssessmentPage - Failed to load templates:", err);
            })
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-linear-to-br from-[#eaf2e8] via-[#f0f4ea] to-[#f5ece6]">
            <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-primary/8 blur-3xl" />

            {/* Header */}
            <header className="bg-white/60 backdrop-blur-2xl border-b border-white/60 shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-16 flex items-center justify-between">
                        <Link href="/trangchu" className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors">
                            <div className="size-9 rounded-xl bg-primary flex items-center justify-center">
                                <Image src="/mental_health.png" alt="Logo" width={28} height={28} className="brightness-0 invert" />
                            </div>
                            <span className="font-medium text-xl text-foreground">Mental Health AI</span>
                        </Link>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Link
                                href="/trangchu"
                                className="inline-flex items-center gap-1.5 text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors font-medium px-3 py-1.5 rounded-2xl hover:bg-slate-100"
                            >
                                <Home className="size-4" />
                                Trang chủ
                            </Link>
                            <Link
                                href="/auth/login"
                                className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors font-medium"
                            >
                                Đăng nhập
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 py-10 sm:py-12 gap-y-8">
                {/* Hero */}
                <div className="rounded-3xl border border-white/70 bg-white/55 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(142,179,122,0.1)] space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm text-primary font-semibold">
                        <Heart className="size-4" />
                        Miễn phí · Ẩn danh · Khoa học
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight leading-tight">
                            Chọn bài đánh giá phù hợp
                        </h1>
                        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                            Mỗi bài kiểm tra được thiết kế ngắn gọn, dễ trả lời và hiển thị kết quả ngay sau khi hoàn thành.
                            Bạn có thể bắt đầu mà không cần tài khoản.
                        </p>
                    </div>
                </div>

                {/* {_hasHydrated && isAuthenticated && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="text-base sm:text-lg font-semibold text-foreground">Gợi ý theo dõi nhanh</h2>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-muted-foreground">Dành cho bạn</span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {quickActions.map(({ title, description, href, icon: Icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50"
                                >
                                    <div className="mb-2.5 flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Icon className="size-4" />
                                    </div>
                                    <p className="font-medium text-foreground">{title}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )} */}

                {/* Template grid */}
                {isLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-10 sm:p-14 flex flex-col items-center gap-4">
                        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Đang tải danh sách bài đánh giá…</p>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 text-center py-16 px-6">
                        <p className="text-muted-foreground">Hiện chưa có bài kiểm tra nào. Vui lòng thử lại sau.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Danh sách bài đánh giá</h2>
                            <span className="text-xs sm:text-sm text-muted-foreground bg-white/80 border border-slate-200 px-3 py-1 rounded-full">
                                {templates.length} bài có sẵn
                            </span>
                        </div>

                        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
                            {templates.map((template) => {
                                const isOnboarding = isOnboardingAssessmentType(template.typeCode);
                                return (
                                    <button
                                        key={template.assessmentTemplateId}
                                        onClick={() => router.push(`/assessment/do?templateId=${template.assessmentTemplateId}`)}
                                        type="button"
                                        className={cn(
                                            "group cursor-pointer rounded-3xl p-5 border shadow-sm hover:shadow-[0_12px_35px_rgba(142,179,122,0.15)] hover:-translate-y-1.5 transition-all text-left relative",
                                            isOnboarding
                                                ? "bg-white/70 border-primary/30 ring-1 ring-primary/20"
                                                : "bg-white/60 border-white/60 hover:bg-white"
                                        )}
                                    >
                                        {isOnboarding && (
                                            <div className="absolute -top-3 right-4 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                                <Sparkles className="size-3" />
                                                KHUYÊN DÙNG
                                            </div>
                                        )}

                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 gap-y-2">
                                                <div className="flex items-center gap-2">
                                                    <ClipboardList className="size-5 text-primary shrink-0" />
                                                    <h2 className="font-semibold text-foreground text-lg leading-snug">{template.title}</h2>
                                                </div>
                                                {template.description && (
                                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                                        {template.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                                                    <Clock className="size-3.5" />
                                                    <span>{template.totalQuestions || '?'} câu hỏi · {estimateDuration(template.totalQuestions)}</span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                                <ChevronRight className="size-5" />
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-primary/70 bg-primary/5 px-3 py-1 rounded-full">
                                                {template.typeCode}
                                            </span>
                                            <span className="text-sm font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                                                Bắt đầu <ArrowRight className="size-4" />
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

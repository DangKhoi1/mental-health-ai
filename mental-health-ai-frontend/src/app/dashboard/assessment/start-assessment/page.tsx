'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAssessmentStore } from '@/stores';
import { assessmentService } from '@/services';
import AssessmentTemplates from '@/components/assessment/AssessmentTemplates';
import AssessmentHistory from '../../../../components/assessment/AssessmentHistory';
import { Moon, BookOpenText, Smile, Brain, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    isOnboardingAssessmentType,
} from '@/constants/onboardingAssessment';

function StartAssessmentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const {
        templates,
        history,
        fetchAll,
        isLoading,
        historyPage,
        historyTotalPages,
        historyTotal,
        historyLimit,
    } = useAssessmentStore();
    const [tab, setTab] = useState<'templates' | 'history'>('templates');
    const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
    const onboardingRequested = searchParams.get('onboarding') === '1';

    const visibleTemplates = useMemo(
        () => templates.filter((template) => !isOnboardingAssessmentType(template.typeCode)),
        [templates]
    );

    const onboardingTemplate = useMemo(
        () => templates.find((template) => isOnboardingAssessmentType(template.typeCode)),
        [templates]
    );

    const quickActions = [
        {
            title: 'Tâm trạng',
            description: 'Theo dõi cảm xúc hằng ngày',
            href: '/dashboard/daily-mood',
            icon: Smile,
        },
        {
            title: 'Giấc ngủ',
            description: 'Ghi nhận chất lượng ngủ',
            href: '/dashboard/sleep-log',
            icon: Moon,
        },
        {
            title: 'Nhật ký',
            description: 'Lưu suy nghĩ mỗi ngày',
            href: '/dashboard/journal',
            icon: BookOpenText,
        },
    ];

    useEffect(() => {
        fetchAll(currentHistoryPage, historyLimit);
    }, [fetchAll, currentHistoryPage, historyLimit]);

    useEffect(() => {
        if (!onboardingRequested || !onboardingTemplate) return;

        router.replace(
            `/dashboard/assessment/do-assessment?templateId=${onboardingTemplate.assessmentTemplateId}&new=true&onboarding=1`
        );
    }, [onboardingRequested, onboardingTemplate, router]);

    const handleStart = async (templateId: string) => {
        const selectedTemplate = templates.find(t => t.assessmentTemplateId === templateId);
        if (!selectedTemplate) return;

        try {
            const sessionRes = await assessmentService.startSession(selectedTemplate.typeCode, true);
            const sessionResMeta = sessionRes as { data?: { EM?: string; message?: string } };
            console.log('[startAssessment] sessionRes:', sessionRes);
            console.log('[startAssessment] EC:', sessionRes?.EC);
            console.log('[startAssessment] EM:', sessionRes?.EM);
            console.log('[startAssessment] data.EM:', sessionResMeta.data?.EM);

            const sessionId = sessionRes?.data?.session?.assessmentSessionId;
            const backendMessage =
                sessionRes?.EM ||
                sessionRes?.message ||
                sessionResMeta.data?.EM ||
                sessionResMeta.data?.message;

            console.log('[startAssessment] backendMessage:', backendMessage);
            console.log('[startAssessment] sessionId:', sessionId);

            if (sessionRes?.EC === 1 && sessionId) {
                router.push(`/dashboard/assessment/do-assessment?sessionId=${sessionId}`);
                return;
            }

            toast.info(backendMessage || 'Hiện chưa thể bắt đầu bài đánh giá này. Vui lòng thử lại sau.');
        } catch (error) {
            console.error('[startAssessment] Error:', error);
            toast.info('Hiện chưa thể bắt đầu bài đánh giá này. Vui lòng thử lại sau.');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">
                    Đánh giá sức khỏe tinh thần
                </h1>
                <p className="text-muted-foreground mt-1">
                    Chọn một bài đánh giá để bắt đầu hoặc xem lịch sử đánh giá của bạn
                </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base sm:text-lg font-bold text-foreground">Gợi ý theo dõi nhanh</h2>
                    <span className="text-xs sm:text-sm text-primary bg-primary/10 px-3 py-1 rounded-full">Dành cho bạn</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {quickActions.map(({ title, description, href, icon: Icon }) => (
                        <button
                            key={href}
                            type="button"
                            onClick={() => router.push(href)}
                            className="cursor-pointer text-left rounded-2xl border border-border bg-background p-4 hover:border-primary/40 hover:shadow-sm transition-all"
                        >
                            <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                                <Icon className="h-4 w-4" />
                            </div>
                            <p className="font-semibold text-foreground">{title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {onboardingRequested ? (
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="w-full max-w-2xl rounded-[28px] border border-border bg-card shadow-sm p-6 sm:p-8">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                            <Brain className="w-7 h-7" />
                        </div>
                        <div className="space-y-3">
                            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                                <Sparkles className="w-4 h-4" />
                                Bài sàng lọc bắt buộc cho tài khoản mới
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                                Đang chuẩn bị bài đánh giá sơ lược tổng hợp
                            </h1>
                            <p className="text-muted-foreground leading-relaxed">
                                Hệ thống đang tải bộ câu hỏi nền tảng để tạo hồ sơ sức khỏe tâm lý ban đầu cho bạn. Sau khi hoàn thành, dashboard sẽ dùng kết quả này làm mốc phân tích về sau.
                            </p>
                        </div>

                        {isLoading || onboardingTemplate ? (
                            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-4 text-sm text-foreground">
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                Đang mở bài sàng lọc bắt buộc...
                            </div>
                        ) : (
                            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                                Chưa tìm thấy bài sàng lọc ban đầu. Hãy seed lại assessment template ở backend để tiếp tục.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex gap-2 border-b border-border">
                        <button
                            onClick={() => setTab('templates')}
                            type="button"
                            className={`px-4 py-2 font-medium transition-colors ${tab === 'templates'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Bài đánh giá
                        </button>
                        <button
                            onClick={() => setTab('history')}
                            type="button"
                            className={`px-4 py-2 font-medium transition-colors ${tab === 'history'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Lịch sử
                        </button>
                    </div>
                    {tab === 'templates' ? (
                        <AssessmentTemplates templates={visibleTemplates} onStart={handleStart} />
                    ) : (
                        <div className="space-y-4">
                            <AssessmentHistory history={history} />
                            {historyTotalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                                    <p className="text-sm text-muted-foreground">
                                        Trang {historyPage}/{historyTotalPages} • Tổng {historyTotal} phiên đánh giá
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={historyPage <= 1}
                                            onClick={() => setCurrentHistoryPage((prev) => Math.max(1, prev - 1))}
                                        >
                                            Trước
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={historyPage >= historyTotalPages}
                                            onClick={() => setCurrentHistoryPage((prev) => Math.min(historyTotalPages, prev + 1))}
                                        >
                                            Sau
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function StartAssessmentPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <StartAssessmentContent />
        </Suspense>
    );
}

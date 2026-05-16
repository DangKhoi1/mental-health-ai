'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Sparkles, Brain, CheckCircle2, ClipboardList } from 'lucide-react';
import {
    ONBOARDING_ASSESSMENT_ROUTE,
    getOnboardingInProgressFlagKey,
    getOnboardingPendingFlagKey,
} from '@/constants/onboardingAssessment';

const BENEFITS = [
    '6 câu hỏi ngắn để tạo mốc sức khỏe ban đầu',
    'Kết quả được lưu để theo dõi sự thay đổi về sau',
    'Gợi ý cá nhân hóa sẽ được tạo ngay sau khi hoàn thành',
];

export default function OnboardingAssessmentModal() {
    const router = useRouter();
    const { isAuthenticated, _hasHydrated, user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isResuming, setIsResuming] = useState(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!_hasHydrated || !isAuthenticated || !user) return;
        const pendingKey = getOnboardingPendingFlagKey(user.userId);
        const inProgressKey = getOnboardingInProgressFlagKey(user.userId);
        const hasPending = Boolean(localStorage.getItem(pendingKey));
        const hasInProgress = Boolean(localStorage.getItem(inProgressKey));

        if (hasPending || hasInProgress) {
            setIsResuming(hasInProgress && !hasPending);
            setIsOpen(true);
        }
    }, [_hasHydrated, isAuthenticated, user]);

    const handleStart = () => {
        if (!user?.userId) return;
        localStorage.removeItem(getOnboardingPendingFlagKey(user.userId));
        localStorage.setItem(getOnboardingInProgressFlagKey(user.userId), '1');
        setIsOpen(false);
        router.push(ONBOARDING_ASSESSMENT_ROUTE);
    };

    if (!isOpen) return null;

    const firstName = user?.fullName?.split(' ').pop() || 'bạn';

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
            <div
                className="bg-background rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-border max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-linear-to-br from-sky-500 via-cyan-500 to-emerald-500 p-6 pb-5 text-white text-center relative shrink-0">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Brain className="w-6 h-6" />
                    </div>

                    <h2 className="text-xl font-bold mb-1">
                        Chào mừng, {firstName}!
                    </h2>
                    <p className="text-white/85 text-[13px] leading-relaxed">
                        {isResuming
                            ? 'Bạn đang tạm dừng bài sàng lọc ban đầu. Hãy tiếp tục để hoàn tất hồ sơ sức khỏe đầu tiên.'
                            : 'Trước khi sử dụng đầy đủ dashboard, bạn cần hoàn thành bài sàng lọc ban đầu.'}
                    </p>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <ClipboardList className="w-4 h-4 text-primary" />
                            <p className="text-foreground font-semibold text-sm">
                                {isResuming ? 'Tiếp tục bài sàng lọc sức khỏe tâm lý' : 'Bài sàng lọc sức khỏe tâm lý ban đầu'}
                            </p>
                        </div>
                        <p className="text-muted-foreground text-[13px] leading-relaxed">
                            {isResuming
                                ? 'Hệ thống đã lưu tiến trình của bạn. Hoàn thành nốt bài sàng lọc để dashboard bắt đầu phân tích trạng thái tinh thần và tạo gợi ý phù hợp.'
                                : 'Bài kiểm tra này tổng hợp các dấu hiệu nền tảng về khí sắc, lo âu, căng thẳng, giấc ngủ, năng lượng và khả năng thích nghi để hệ thống tạo hồ sơ phân tích ban đầu cho bạn.'}
                        </p>
                    </div>

                    <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3.5 space-y-2.5">
                        {BENEFITS.map((benefit, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-[13px] text-foreground">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{benefit}</span>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-xl bg-muted/40 px-3 py-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
                        Đây là bước bắt buộc một lần cho tài khoản mới. Kết quả không thay thế chẩn đoán chuyên môn, nhưng sẽ là mốc tham chiếu để theo dõi trạng thái của bạn theo thời gian.
                    </div>

                    <div className="flex flex-col gap-3 pt-1">
                        <button
                            type="button"
                            onClick={handleStart}
                            className="cursor-pointer w-full py-3 px-6 bg-primary hover:opacity-90 text-primary-foreground rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            <Sparkles className="w-4 h-4" />
                            {isResuming ? 'Tiếp tục bài sàng lọc' : 'Bắt đầu bài sàng lọc'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { assessmentService } from '@/services/assessment';
import { AssessmentTemplate } from '@/types';
import { ClipboardList, ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export default function QuickAssessmentSection() {
    const router = useRouter();
    const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
    const [sectionRef, sectionVisible] = useScrollAnimation();

    useEffect(() => {
        assessmentService.getPublicTemplates()
            .then(res => {
                const t = res?.data?.templates;
                if (Array.isArray(t)) setTemplates(t);
            })
            .catch((err) => {
                console.error("QuickAssessmentSection - Failed to load templates:", err);
            });
    }, []);

    const features = [
        { icon: Clock, label: 'Chỉ 5–10 phút' },
        { icon: ShieldCheck, label: 'Không cần tài khoản & Ẩn danh' },
        { icon: ClipboardList, label: 'Dựa trên tiêu chuẩn khoa học' },
    ];

    const handleStart = () => {
        router.push('/assessment');
    };

    return (
        <section id="assessment" className="relative overflow-hidden bg-linear-to-br from-sky-50/50 via-background to-blue-50/30 py-12 px-4 sm:px-6 lg:px-8 ">
            <div className="absolute -top-10 -right-10 size-64 rounded-full bg-primary/10 blur-3xl" aria-hidden />
            <div className="absolute -bottom-10 -left-10 size-64 rounded-full bg-sky-300/20 blur-3xl" aria-hidden />

            <div
                ref={sectionRef}
                className={`relative mx-auto max-w-7xl flex flex-col items-center text-center space-y-8 transition-all duration-700 ${sectionVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`}
            >
                <div className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-50 border border-sky-100 px-5 py-2 text-sm text-sky-700 font-medium">
                    <ClipboardList className="size-4" />
                    Đánh giá sức khỏe tinh thần
                </div>

                <div className="space-y-4 max-w-2xl">
                    <h2 className="text-3xl sm:text-4xl font-medium text-foreground tracking-tight leading-tight">
                        Bắt đầu từ bài đánh giá <span className="text-primary font-bold-500">phù hợp với bạn</span>
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Làm bài kiểm tra ngắn để xem trạng thái hiện tại. Kết quả hiển thị ngay sau khi hoàn thành.
                    </p>
                </div>

                <button
                    onClick={handleStart}
                    className="inline-flex items-center justify-center gap-2 rounded-full px-9 py-4 bg-primary text-primary-foreground font-semibold text-base shadow-lg hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200"
                >
                    Làm bài đánh giá
                    <ArrowRight className="size-4" />
                </button>

                <div className="flex flex-wrap items-center justify-center gap-6 pt-2 w-full">
                    {features.map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Icon className="size-4 text-primary/70" />
                            <span>{label}</span>
                        </div>
                    ))}
                </div>

                {templates.length > 1 && (
                    <p className="text-sm text-muted-foreground mt-2 w-full text-center">
                        Có {templates.length} bài kiểm tra dành cho bạn ,  bao gồm PHQ-9, GAD-7 và nhiều hơn nữa.
                    </p>
                )}
            </div>
        </section>
    );
}

'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AssessmentSession, AssessmentQuestion, SessionStatus } from '@/types';
import AssessmentSessionView from '@/components/assessment/AssessmentSession';
import { assessmentService } from '@/services/assessment';
import { guestStorage } from '@/services/guestStorage';
import { calculateGuestResultLevel } from '@/utils/assessment.util';

function DoPublicAssessmentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const templateId = searchParams.get('templateId') || '';

    const [activeSession, setActiveSession] = useState<AssessmentSession | null>(null);
    const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, { questionId: string; score: number; optionId?: string }>>({});
    const [isLoading, setIsLoading] = useState(true);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current || !templateId) return;
        initialized.current = true;

        const load = async () => {
            try {
                const templateRes = await assessmentService.getPublicTemplateWithQuestions(templateId);
                if (templateRes?.EC === 1 && templateRes?.data?.template) {
                    const templateData = templateRes.data.template;
                    const questionsData = templateData.questions || [];

                    // Guest pseudo-session
                    const session = {
                        assessmentSessionId: 'guest-' + Date.now(),
                        status: SessionStatus.PENDING,
                        createdAt: new Date().toISOString(),
                        template: templateData,
                        answers: [],
                    } as AssessmentSession;

                    setActiveSession(session);
                    setQuestions(questionsData);
                } else {
                    router.replace('/assessment');
                }
            } catch {
                router.replace('/assessment');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [templateId, router]);

    const handleAnswer = (questionId: string, score: number, optionId: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: { questionId, score, optionId } }));
    };

    const handleSubmit = () => {
        if (!activeSession) return;

        const answeredCount = Object.keys(answers).length;
        if (answeredCount < questions.length) {
            return;
        }

        const totalScore = Object.values(answers).reduce((sum, a) => sum + a.score, 0);
        const typeCode = activeSession.template?.typeCode || '';
        const resultLevelCode = calculateGuestResultLevel(typeCode, totalScore);
        const completedAt = new Date().toISOString();

        // Save to guestStorage for syncing after login
        const guestData = {
            ...activeSession,
            status: 'COMPLETED' as const,
            completedAt,
            answers: Object.values(answers).map(a => ({
                assessmentAnswerId: 'temp-' + Date.now() + Math.random(),
                question: a.questionId,
                selectedScore: a.score,
                optionId: a.optionId,
            })),
        } as unknown as AssessmentSession;
        guestStorage.saveSession(guestData);

        const resultData = encodeURIComponent(JSON.stringify({
            totalScore,
            resultLevelCode,
            status: 'COMPLETED',
            completedAt,
            isGuest: true,
        }));
        router.push(`/assessment/result?result=${resultData}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/85 p-8 sm:p-10 flex flex-col items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground">Đang chuẩn bị bài đánh giá...</p>
                </div>
            </div>
        );
    }

    if (!templateId) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/85 p-8 sm:p-10 text-center space-y-4 shadow-sm">
                    <p className="text-muted-foreground">Không tìm thấy bài kiểm tra.</p>
                    <button
                        onClick={() => router.push('/assessment')}
                        type="button"
                        className="cursor-pointer px-4 py-2 text-primary hover:underline text-sm"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    if (activeSession) {
        return (
            <AssessmentSessionView
                session={activeSession}
                questions={questions}
                currentQuestionIndex={currentQuestionIndex}
                answers={answers}
                onAnswer={handleAnswer}
                onJumpToQuestion={setCurrentQuestionIndex}
                onNext={() => setCurrentQuestionIndex(prev => prev + 1)}
                onPrev={() => setCurrentQuestionIndex(prev => prev - 1)}
                onSubmit={handleSubmit}
            />
        );
    }

    return null;
}

export default function DoPublicAssessmentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/85 p-8 sm:p-10 flex items-center justify-center shadow-sm">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        }>
            <DoPublicAssessmentContent />
        </Suspense>
    );
}

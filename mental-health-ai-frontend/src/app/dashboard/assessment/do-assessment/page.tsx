'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AssessmentQuestion, AssessmentSession, SessionStatus } from '@/types';
import AssessmentSessionView from '@/components/assessment/AssessmentSession';
import { assessmentService } from '@/services/assessment';
import { guestStorage } from '@/services/guestStorage';
import { useAuthStore } from '@/stores/authStore';
import { normalizeBackendMessage } from '@/utils/normalizeBackendMessage';
import { toast } from 'sonner';
import { ONBOARDING_ASSESSMENT_TYPE_CODE } from '@/constants/onboardingAssessment';

function DoAssessmentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const templateId = searchParams.get('templateId') || '';
    const { isAuthenticated } = useAuthStore();

    const [activeSession, setActiveSession] = useState<AssessmentSession | null>(null);
    const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, { questionId: string; score: number; optionId?: string }>>({});
    const [isLoading, setIsLoading] = useState(true);

    const initialized = useRef(false);

    useEffect(() => {
        const fetchQuestionsAndStartSession = async () => {
            try {
                const isNew = searchParams.get('new') === 'true';
                const sessionId = searchParams.get('sessionId');

                setIsLoading(true);

                let session: AssessmentSession | null = null;
                let questionsData: AssessmentQuestion[] = [];

                if (sessionId && isAuthenticated) {
                    const sessionRes = await assessmentService.getSessionDetails(sessionId);
                    if (sessionRes?.EC === 1 && sessionRes?.data?.session) {
                        session = sessionRes.data.session;
                        questionsData = session.template?.questions || [];
                    } else if (sessionRes?.EC === 0) {
                        toast.error(sessionRes.EM || 'Không thể tải phiên đánh giá.');
                        router.push('/dashboard/assessment');
                        return;
                    }
                } else if (templateId) {
                    const templateRes = await assessmentService.getTemplateWithQuestions(templateId);

                    if (templateRes?.EC === 1 && templateRes?.data?.template) {
                        const templateData = templateRes.data.template;
                        questionsData = templateData.questions || [];

                        if (isAuthenticated) {
                            const sessionRes = await assessmentService.startSession(templateData.typeCode, isNew);
                            console.log('[doAssessment] sessionRes:', sessionRes);
                            const sessionResMeta = sessionRes as { data?: { EM?: string; message?: string } };
                            const backendMessage =
                                sessionRes?.EM ||
                                sessionRes?.message ||
                                sessionResMeta.data?.EM ||
                                sessionResMeta.data?.message;
                            console.log('[doAssessment] backendMessage:', backendMessage);
                            if (sessionRes?.EC === 1 && sessionRes?.data?.session) {
                                session = sessionRes.data.session;
                            } else if (sessionRes?.EC === 0) {
                                toast.info(backendMessage || 'Không thể bắt đầu bài đánh giá.');
                                router.push('/dashboard/assessment');
                                return;
                            }
                        } else {
                            session = {
                                assessmentSessionId: `guest-session-${Date.now()}`,
                                status: SessionStatus.PENDING,
                                createdAt: new Date().toISOString(),
                                template: templateData,
                                answers: [],
                            } as AssessmentSession;
                        }
                    } else if (templateRes?.EC === 0) {
                        toast.error(templateRes.EM || 'Không thể tải bộ câu hỏi đánh giá.');
                        router.push('/dashboard/assessment');
                        return;
                    }
                }

                if (!session) {
                    return;
                }

                setActiveSession(session);
                setQuestions(questionsData);

                if (session.answers && session.answers.length > 0) {
                    const existingAnswers: Record<string, { questionId: string; score: number; optionId?: string }> = {};
                    session.answers.forEach((answer) => {
                        const questionId = typeof answer.question === 'object'
                            ? (answer.question as AssessmentQuestion).assessmentQuestionId
                            : answer.question;

                        if (questionId) {
                            existingAnswers[questionId] = {
                                questionId,
                                score: answer.selectedScore,
                                optionId: undefined,
                            };
                        }
                    });
                    setAnswers(existingAnswers);
                }
            } catch (error) {
                console.error('Error starting assessment:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (!initialized.current) {
            initialized.current = true;
            fetchQuestionsAndStartSession();
        }
    }, [templateId, searchParams, isAuthenticated, router]);

    const handleAnswer = (questionId: string, score: number, optionId: string) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: { questionId, score, optionId },
        }));
    };

    const submitAssessment = async () => {
        if (!activeSession) return;

        const answeredCount = Object.keys(answers).length;
        if (answeredCount < questions.length) {
            toast.warning(`Vui lòng trả lời tất cả câu hỏi trước khi nộp bài. Còn ${questions.length - answeredCount} câu chưa trả lời.`);
            return;
        }

        if (!isAuthenticated) {
            const totalScore = Object.values(answers).reduce((sum, answer) => sum + answer.score, 0);
            const typeCode = activeSession.template?.typeCode || '';
            const { calculateGuestResultLevel } = await import('@/utils/assessment.util');
            const resultLevelCode = calculateGuestResultLevel(typeCode, totalScore);
            const completedAt = new Date().toISOString();

            const guestData = {
                ...activeSession,
                status: 'COMPLETED' as const,
                completedAt,
                answers: Object.values(answers).map((answer) => ({
                    assessmentAnswerId: `temp-${Date.now()}${Math.random()}`,
                    question: answer.questionId,
                    selectedScore: answer.score,
                    optionId: answer.optionId,
                })),
            } as unknown as AssessmentSession;
            guestStorage.saveSession(guestData);

            const resultData = encodeURIComponent(JSON.stringify({
                totalScore,
                resultLevelCode,
                typeCode,
                templateTitle: activeSession.template?.title,
                maxScore: typeCode === ONBOARDING_ASSESSMENT_TYPE_CODE ? 18 : undefined,
                status: 'COMPLETED',
                completedAt,
                isGuest: true,
            }));
            router.push(`/dashboard/assessment/result-assessment?result=${resultData}&guest=true`);
            return;
        }

        try {
            const response = await assessmentService.submitAnswers(activeSession.assessmentSessionId, { answers });

            if (response?.EC === 1 && response?.data?.completeSession) {
                const result = response.data.completeSession.result;
                const resultData = encodeURIComponent(JSON.stringify({
                    totalScore: result?.totalScore,
                    resultLevelCode: result?.resultLevelCode,
                    typeCode: activeSession.template?.typeCode,
                    templateTitle: activeSession.template?.title,
                    maxScore: activeSession.template?.typeCode === ONBOARDING_ASSESSMENT_TYPE_CODE ? 18 : undefined,
                    status: SessionStatus.COMPLETED,
                    completedAt: response.data.completeSession.completedAt,
                }));
                router.push(`/dashboard/assessment/result-assessment?result=${resultData}`);
            } else if (response?.EC === 0) {
                toast.error(normalizeBackendMessage(response.EM, 'Có lỗi xảy ra khi nộp bài.'));
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground animate-pulse">Đang chuẩn bị bài đánh giá...</p>
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
                onNext={() => setCurrentQuestionIndex((prev) => prev + 1)}
                onPrev={() => setCurrentQuestionIndex((prev) => prev - 1)}
                onSubmit={submitAssessment}
            />
        );
    }

    return (
        <div className="text-center py-20 text-muted-foreground">
            Không tìm thấy dữ liệu phiên đánh giá.
            <br />
            <button
                onClick={() => router.push('/dashboard/assessment/start-assessment')}
                className="mt-4 px-4 py-2 text-primary hover:underline"
            >
                Quay lại
            </button>
        </div>
    );
}

export default function DoAssessmentPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <DoAssessmentContent />
        </Suspense>
    );
}
'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth';
import { assessmentService } from '@/services/assessment';
import { guestStorage } from '@/services/guestStorage';
import { useAuthStore } from '@/stores/authStore';
import { useAppRouter } from '@/hooks/useAppRouter';
import { AuthMessages } from '@/constants/messages';
import { clearLegacyOnboardingFlags, getOnboardingPendingFlagKey } from '@/constants/onboardingAssessment';
import { normalizeBackendMessage } from '@/utils/normalizeBackendMessage';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import { ArrowLeftIcon, Eye, EyeOff } from 'lucide-react';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { goDashboard } = useAppRouter();
    const { loginAction, setIsLoggingIn, isLoggingIn } = useAuthStore();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const googleError = searchParams.get('googleError');
        if (!googleError) return;

        toast.error(normalizeBackendMessage(googleError, 'Đăng nhập bằng Google thất bại.'));

        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.delete('googleError');
        const nextQuery = nextParams.toString();
        router.replace(nextQuery ? `/auth/login?${nextQuery}` : '/auth/login');
    }, [searchParams, router]);

    const validateForm = () => {
        const newErrors: { username?: string; password?: string } = {};

        if (!formData.username) {
            newErrors.username = AuthMessages.usernameRequired;
        } else if (formData.username.length < 3) {
            newErrors.username = AuthMessages.usernameMinLength;
        }

        if (!formData.password) {
            newErrors.password = AuthMessages.passwordRequired;
        } else if (formData.password.length < 6) {
            newErrors.password = AuthMessages.passwordMinLength;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoggingIn(true);

        try {
            const response = await authService.login(formData);

            if (response.EC === 1 && response.data) {
                clearLegacyOnboardingFlags();
                loginAction({
                    accessToken: response.data.accessToken,
                    user: response.data.user,
                });

                const saveResultFlow = searchParams.get('reason') === 'save_result';
                const onboarding = searchParams.get('onboarding') === 'true';
                const guestData = guestStorage.getData();
                let lastResultUrl = null;

                if (saveResultFlow && guestData.sessions.length > 0) {
                    toast.info('Đang đồng bộ dữ liệu đánh giá...');
                    try {
                        for (const session of guestData.sessions) {
                            if (!session.template) continue;

                            // Start new session on backend
                            const startRes = await assessmentService.startSession(session.template.typeCode, true);
                            if (startRes?.data?.session) {
                                const newSessionId = startRes.data.session.assessmentSessionId;

                                // Convert answers array back to record
                                const answerRecord: Record<string, { questionId: string; score: number }> = {};
                                session.answers?.forEach((a: { question: { assessmentQuestionId: string } | string; selectedScore: number }) => {
                                    const qId = typeof a.question === 'object' ? a.question.assessmentQuestionId : a.question;
                                    answerRecord[qId] = { questionId: qId, score: a.selectedScore };
                                });

                                // Submit answers
                                const submitRes = await assessmentService.submitAnswers(newSessionId, { answers: answerRecord });

                                if (submitRes?.data?.completeSession?.result) {
                                    const result = submitRes.data.completeSession.result;
                                    const resultData = encodeURIComponent(JSON.stringify({
                                        totalScore: result.totalScore,
                                        resultLevelCode: result.resultLevelCode,
                                        status: 'COMPLETED',
                                        completedAt: submitRes.data.completeSession.completedAt
                                    }));
                                    lastResultUrl = `/dashboard/assessment/result-assessment?result=${resultData}`;
                                }
                            }
                        }
                        guestStorage.clearData();
                        toast.success('Đồng bộ dữ liệu thành công!');
                    } catch (error) {
                        console.error('Error syncing guest data:', error);
                        toast.error('Có lỗi khi đồng bộ dữ liệu.');
                    }
                }

                toast.success(AuthMessages.loginSuccess);

                // Redirect logic
                if (!saveResultFlow && (searchParams.get('registered') === 'true' || onboarding) && response.data.user?.userId) {
                    localStorage.setItem(getOnboardingPendingFlagKey(response.data.user.userId), '1');
                }

                if (saveResultFlow && lastResultUrl) {
                    router.push(lastResultUrl);
                } else if (onboarding) {
                    router.push('/dashboard/assessment');
                } else {
                    goDashboard();
                }
            } else {
                toast.error(normalizeBackendMessage(response?.EM, AuthMessages.loginError));
            }
        } catch (err: unknown) {
            console.error('Login error:', err);
            const errorMessage =
                typeof err === 'object' && err !== null && 'EM' in err
                    ? normalizeBackendMessage((err as { EM?: string }).EM, AuthMessages.loginErrorGeneric)
                    : AuthMessages.loginErrorGeneric;
            toast.error(errorMessage);
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="h-screen bg-linear-to-br from-[#eaf2e8] via-[#f0f4ea] to-[#f5ece6] flex items-center justify-center px-4 sm:px-6 py-4 sm:py-8 relative overflow-hidden">
            {/* Blurred decorative orbs */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-96 h-96 bg-sky-100/60 rounded-full blur-3xl" />

            <Link href="/" className="absolute left-4 top-4 sm:left-6 sm:top-5 z-20 text-stone-500 hover:text-stone-700 transition-colors text-sm font-medium inline-flex items-center gap-1.5">
                <ArrowLeftIcon className="w-4 h-4" /> Trang chủ
            </Link>

            <div className="w-full max-w-sm sm:max-w-md relative z-10 mx-auto">
                <div className="text-center mb-4 sm:mb-5">
                    <Link href="/" className="inline-flex items-center gap-2 group">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-105 shadow-md">
                            <img src="/mental_health.png" alt="Logo" width={32} height={32} className="w-8 h-8 brightness-0 invert" />
                        </div>
                        <span className="text-xl sm:text-2xl font-bold text-foreground">
                            Mental Health AI
                        </span>
                    </Link>
                </div>

                <div className="bg-white/60 backdrop-blur-2xl rounded-4xl border border-white/70 shadow-[0_12px_40px_rgba(142,179,122,0.12)] p-8 sm:p-10">
                    <div className="text-center mb-6">
                        <h1 className="text-xl sm:text-2xl font-medium text-stone-800 mb-1.5">
                            Chào mừng trở lại
                        </h1>
                        <p className="text-sm sm:text-base text-stone-500 font-light">
                            Đăng nhập để tiếp tục hành trình của bạn
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label htmlFor="username" className="block text-sm font-medium text-stone-700 ml-1">
                                Tên đăng nhập
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={formData.username}
                                onChange={(e) => {
                                    setFormData({ ...formData, username: e.target.value });
                                    if (errors.username) setErrors({ ...errors, username: undefined });
                                }}
                                className={`w-full h-12 px-4 text-base bg-white/70 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-foreground placeholder-muted-foreground/60 ${errors.username ? 'border-destructive focus:ring-destructive/20' : 'border-white/60'
                                    }`}
                                placeholder="Nhập tên đăng nhập"
                            />
                            {errors.username && (
                                <p className="ml-1 text-sm text-red-500">{errors.username}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-sm font-medium text-stone-700 ml-1">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => {
                                        setFormData({ ...formData, password: e.target.value });
                                        if (errors.password) setErrors({ ...errors, password: undefined });
                                    }}
                                    className={`w-full h-12 pl-4 pr-12 text-base bg-white/70 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-foreground placeholder-muted-foreground/60 ${errors.password ? 'border-destructive focus:ring-destructive/20' : 'border-white/60'
                                        }`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1"
                                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="ml-1 text-sm text-red-500">{errors.password}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            isLoading={isLoggingIn}
                            className="w-full h-12 bg-primary text-primary-foreground hover:opacity-90 rounded-2xl font-semibold transition-all duration-300 text-base shadow-[0_4px_14px_rgba(142,179,122,0.3)] hover:-translate-y-0.5"
                        >
                            Đăng nhập
                        </Button>
                    </form>

                    <div className="relative mt-5 mb-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/60" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white/0 backdrop-blur-sm px-3 py-0.5 text-muted-foreground rounded-full">Hoặc tiếp tục với</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => window.location.href = 'http://localhost:8080/api/v1/auth/google'}
                        className="w-full h-12 flex items-center justify-center gap-2 bg-white/70 border border-white/70 text-foreground hover:bg-white rounded-2xl font-medium transition-all duration-300 shadow-sm hover:-translate-y-0.5"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Đăng nhập bằng Google
                    </button>

                    <div className="mt-5 text-center">
                        <p className="text-sm sm:text-base text-stone-500">
                            Chưa có tài khoản?{' '}
                            <Link href={searchParams.get('reason') === 'save_result' ? '/auth/register?reason=save_result' : '/auth/register'} className="text-sky-600 hover:text-stone-800 font-semibold transition-colors">
                                Đăng ký ngay
                            </Link>
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}


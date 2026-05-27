'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth';
import { clearLegacyOnboardingFlags, getOnboardingPendingFlagKey } from '@/constants/onboardingAssessment';
import { normalizeBackendMessage } from '@/utils/normalizeBackendMessage';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function LoginSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { loginAction, logoutAction } = useAuthStore();

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            router.replace('/auth/login?googleError=Missing%20google%20token');
            return;
        }

        const handleGoogleAuth = async () => {
            try {
                // Nạp tạm token vào Zustand để privateAxios có thể móc vào Header
                useAuthStore.setState({ accessToken: token });

                // Lấy thông tin user từ backend để đồng bộ Zustand store
                const res = await authService.fetchAccount();
                if (res.EC === 1 && res.data?.user) {
                    clearLegacyOnboardingFlags();
                    loginAction({ accessToken: token, user: res.data.user });
                    toast.success('Đăng nhập bằng Google thành công!');

                    const isNewUser = searchParams.get('isNewUser') === 'true';
                    if (isNewUser) {
                        localStorage.setItem(getOnboardingPendingFlagKey(res.data.user.userId), '1');
                        router.push('/dashboard/assessment');
                    } else {
                        router.push('/dashboard');
                    }
                } else {
                    const backendMessage = normalizeBackendMessage(
                        res?.EM,
                        'Không thể lấy thông tin tài khoản',
                    );
                    const encodedError = encodeURIComponent(backendMessage);
                    logoutAction();
                    router.replace(`/auth/login?googleError=${encodedError}`);
                }
            } catch (err) {
                console.error('Lỗi khi fetch account Google:', err);
                const fallbackMessage = normalizeBackendMessage(
                    typeof err === 'object' && err !== null && 'EM' in err
                        ? (err as { EM?: string }).EM
                        : undefined,
                    'Xác thực thất bại, vui lòng đăng nhập lại.',
                );
                const encodedError = encodeURIComponent(fallbackMessage);
                logoutAction();
                router.replace(`/auth/login?googleError=${encodedError}`);
            }
        };

        handleGoogleAuth();
    }, [searchParams, router, loginAction, logoutAction]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-4">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-stone-600 font-medium text-lg">Đang thiết lập phiên đăng nhập…</p>
        </div>
    );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/stores/authStore';
import { userService } from '@/services/user';
import { ShieldAlert, KeyRound, Loader2 } from 'lucide-react';
import {
    getOnboardingInProgressFlagKey,
    getOnboardingPendingFlagKey,
} from '@/constants/onboardingAssessment';

// Key includes userId so skipping is per-user, not global
const getPinSkippedKey = (userId: string) => `pin_setup_skipped_${userId}`;

export default function PinSetupModal() {
    const { isAuthenticated, _hasHydrated, user } = useAuthStore();
    const userId = user?.userId;

    const [isOpen, setIsOpen] = useState(false);
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Track whether we've already performed the check for this userId
    const checkedRef = useRef<string | null>(null);

    useEffect(() => {
        if (!_hasHydrated || !isAuthenticated || !userId) return;

        // Only run once per userId
        if (checkedRef.current === userId) return;
        checkedRef.current = userId;

        const checkPinStatus = async () => {
            try {
                // Do not show PIN modal while onboarding assessment is still pending / in-progress
                const hasPending = Boolean(localStorage.getItem(getOnboardingPendingFlagKey(userId)));
                const hasInProgress = Boolean(localStorage.getItem(getOnboardingInProgressFlagKey(userId)));
                if (hasPending || hasInProgress) return;

                // Do not show if user chose to skip this session for this account
                const skippedKey = getPinSkippedKey(userId);
                if (sessionStorage.getItem(skippedKey)) return;

                // Check API
                const res = await userService.getPrivacyPinStatus();
                // Backend returns: { EC: 1, EM: 'OK', hasPin: boolean }
                const hasPin =
                    (res as unknown as { hasPin?: boolean }).hasPin ??
                    (res as unknown as { data?: { hasPin?: boolean } }).data?.hasPin;

                if (!hasPin) {
                    setIsOpen(true);
                }
            } catch (err) {
                console.error('PinSetupModal: error checking PIN status', err);
            }
        };

        checkPinStatus();
    }, [_hasHydrated, isAuthenticated, userId]);

    const handleSkip = () => {
        if (userId) {
            sessionStorage.setItem(getPinSkippedKey(userId), 'true');
        }
        setIsOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (pin.length < 4 || pin.length > 6) {
            setError('Mã PIN phải từ 4 đến 6 số');
            return;
        }

        if (!/^\d+$/.test(pin)) {
            setError('Mã PIN chỉ được chứa số');
            return;
        }

        if (pin !== confirmPin) {
            setError('Mã PIN xác nhận không khớp');
            return;
        }

        setIsLoading(true);
        try {
            const res = await userService.setPrivacyPin(pin);
            if (res.EC === 1) {
                setIsOpen(false);
            } else {
                setError(res.EM || 'Có lỗi xảy ra khi cài đặt mã PIN');
            }
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : 'Có lỗi xảy ra khi cài đặt mã PIN',
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className="bg-background rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-border max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-linear-to-br from-sky-500 via-cyan-500 to-emerald-500 p-6 pb-5 text-white text-center relative shrink-0">
                    <div className="size-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ShieldAlert className="size-6" />
                    </div>

                    <h2 className="text-xl font-semibold mb-1">
                        Bảo mật thông tin của bạn
                    </h2>
                    <p className="text-white/85 text-[13px] leading-relaxed">
                        Thiết lập mã PIN (4-6 số) để bảo vệ các ghi chú nhật ký và dữ liệu cá nhân nhạy cảm của bạn.
                    </p>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Mã PIN mới
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    pattern="\d*"
                                    maxLength={6}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                                    placeholder="Nhập 4-6 chữ số"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Xác nhận mã PIN
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    pattern="\d*"
                                    maxLength={6}
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                                    placeholder="Nhập lại mã PIN"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-destructive text-center font-medium animate-in fade-in slide-in-from-top-1">
                                {error}
                            </p>
                        )}

                        <div className="rounded-xl bg-muted/40 px-3 py-2.5 text-[11.5px] leading-relaxed text-muted-foreground text-center">
                            Bạn có thể thay đổi thiết lập này sau trong phần <strong>Hồ sơ cá nhân</strong>.
                        </div>

                        <div className="flex flex-col gap-2 pt-1">
                            <button
                                type="submit"
                                disabled={isLoading || !pin || !confirmPin}
                                className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Cài đặt mã PIN'}
                            </button>
                            <button
                                type="button"
                                onClick={handleSkip}
                                disabled={isLoading}
                                className="w-full py-2.5 px-4 bg-transparent hover:bg-muted text-muted-foreground rounded-xl font-medium transition-all"
                            >
                                Để sau
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

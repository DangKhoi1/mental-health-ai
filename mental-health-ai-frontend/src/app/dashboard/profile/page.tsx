'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { userService } from '@/services';
import { User } from '@/types';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileDisplay from '@/components/profile/ProfileDisplay';
import ProfileEditForm from '@/components/profile/ProfileEditForm';
import { toast } from 'sonner';
import { normalizeBackendMessage } from '@/utils/normalizeBackendMessage';
import { LockKeyhole, ShieldCheck, ShieldOff, Eye, EyeOff, KeyRound, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const PIN_STATUS_CACHE_KEY = 'hasPrivacyPin';

interface ProfileFormData {
    fullName: string;
    dateOfBirth: string;
    phoneNumber: string;
    genderCode: string;
    avatarUrl?: string;
}

export default function ProfilePage() {
    const { user, setUser, _hasHydrated, isAuthenticated, logoutAction } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<ProfileFormData>({
        fullName: '',
        dateOfBirth: '',
        phoneNumber: '',
        genderCode: '',
        avatarUrl: undefined,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // ── Privacy PIN state ───────────────────────────────────────
    const [hasPin, setHasPin] = useState(false);
    const [pinMode, setPinMode] = useState<'idle' | 'set' | 'remove'>('idle');
    const [pinInput, setPinInput] = useState('');
    const [pinConfirm, setPinConfirm] = useState('');
    const [removePinInput, setRemovePinInput] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [pinLoading, setPinLoading] = useState(false);
    const [removePinLockedSeconds, setRemovePinLockedSeconds] = useState(0);
    const [removePinAttemptsLeft, setRemovePinAttemptsLeft] = useState<number | null>(null);

    // ── Account security state ─────────────────────────────────
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [isChangePasswordConfirmOpen, setIsChangePasswordConfirmOpen] = useState(false);

    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isLockConfirmOpen, setIsLockConfirmOpen] = useState(false);

    const isGoogleAccount = String(user?.provider || '').toUpperCase() === 'GOOGLE';

    useEffect(() => {
        if (user && !isEditing) {
            setFormData({
                fullName: user.fullName || '',
                dateOfBirth: user.dateOfBirth || '',
                phoneNumber: user.phoneNumber || '',
                genderCode: user.genderCode || user.gender?.keyMap || '',
                avatarUrl: user.avatarUrl || undefined,
            });
        }
    }, [user, isEditing]);

    // Kiểm tra trạng thái PIN sau khi auth đã hydrate
    useEffect(() => {
        if (!_hasHydrated) return;

        if (!isAuthenticated) {
            setHasPin(false);
            return;
        }

        userService.getPrivacyPinStatus()
            .then((res) => {
                const enabled = !!(
                    (res as unknown as { hasPin?: boolean })?.hasPin ??
                    (res as unknown as { data?: { hasPin?: boolean } })?.data?.hasPin
                );
                setHasPin(enabled);
                localStorage.setItem(PIN_STATUS_CACHE_KEY, enabled ? 'true' : 'false');
            })
            .catch(() => {
                // Fallback cache để không nhảy sai trạng thái sau reload
                setHasPin(localStorage.getItem(PIN_STATUS_CACHE_KEY) === 'true');
            });
    }, [_hasHydrated, isAuthenticated]);

    useEffect(() => {
        if (removePinLockedSeconds <= 0) return;

        const timer = window.setInterval(() => {
            setRemovePinLockedSeconds((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [removePinLockedSeconds]);

    const handleSetPin = useCallback(async () => {
        if (pinInput.length < 4) { toast.error('PIN phải có ít nhất 4 chữ số'); return; }
        if (pinInput !== pinConfirm) { toast.error('PIN xác nhận không khớp'); return; }
        setPinLoading(true);
        try {
            const res = await userService.setPrivacyPin(pinInput);
            if (res?.EC === 1) {
                toast.success('Đã bật bảo vệ PIN thành công!');
                setHasPin(true);
                localStorage.setItem(PIN_STATUS_CACHE_KEY, 'true');
                setPinMode('idle');
                setPinInput('');
                setPinConfirm('');
                // Xoá session cũ để yêu cầu xác minh lại
                sessionStorage.removeItem('pinUnlockedAt');
            } else {
                toast.error(normalizeBackendMessage(res?.EM, 'Có lỗi xảy ra'));
            }
        } finally {
            setPinLoading(false);
        }
    }, [pinInput, pinConfirm]);

    const handleRemovePin = useCallback(async () => {
        if (removePinLockedSeconds > 0) {
            toast.error(`Vui lòng chờ ${removePinLockedSeconds} giây trước khi thử lại`);
            return;
        }

        if (removePinInput.length < 4 || removePinInput.length > 6) {
            toast.error('Vui lòng nhập mã PIN hiện tại (4-6 chữ số)');
            return;
        }

        setPinLoading(true);
        try {
            const res = await userService.removePrivacyPin(removePinInput);
            if (res?.EC === 1) {
                toast.success('Đã tắt bảo vệ PIN');
                setHasPin(false);
                localStorage.setItem(PIN_STATUS_CACHE_KEY, 'false');
                setPinMode('idle');
                setRemovePinInput('');
                setRemovePinLockedSeconds(0);
                setRemovePinAttemptsLeft(null);
                sessionStorage.removeItem('pinUnlockedAt');
            } else {
                const response = res as unknown as {
                    lockedSeconds?: number;
                    attemptsLeft?: number;
                    data?: {
                        lockedSeconds?: number;
                        attemptsLeft?: number;
                    };
                };

                const lockedSeconds =
                    response.lockedSeconds ?? response.data?.lockedSeconds ?? 0;
                const attemptsLeft =
                    response.attemptsLeft ?? response.data?.attemptsLeft;

                if (lockedSeconds > 0) {
                    setRemovePinLockedSeconds(lockedSeconds);
                }

                if (typeof attemptsLeft === 'number') {
                    setRemovePinAttemptsLeft(attemptsLeft);
                }

                toast.error(normalizeBackendMessage(res?.EM, 'Có lỗi xảy ra'));
            }
        } finally {
            setPinLoading(false);
        }
    }, [removePinInput, removePinLockedSeconds]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await userService.updateProfile(user.userId, formData as Partial<User>);


            if (response.EC === 1) {
                const freshUser = await userService.getProfile();
                if (freshUser) {
                    setUser(freshUser);
                }

                setIsEditing(false);
                toast.success('Cập nhật thông tin thành công!');
            } else {
                console.log('Response EC is not 1, showing error');
                toast.error(normalizeBackendMessage(response.EM, 'Có lỗi xảy ra. Vui lòng thử lại.'));
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = useCallback(async () => {
        const { currentPassword, newPassword, confirmNewPassword } = passwordForm;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            toast.error('Vui lòng nhập đầy đủ thông tin mật khẩu');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            toast.error('Xác nhận mật khẩu mới không khớp');
            return;
        }

        setIsChangePasswordConfirmOpen(true);
    }, [passwordForm]);

    const handleConfirmChangePassword = useCallback(async () => {
        const { currentPassword, newPassword } = passwordForm;
        setIsChangePasswordConfirmOpen(false);

        setPasswordLoading(true);
        try {
            const res = await userService.changePassword({ currentPassword, newPassword });
            if (res?.EC === 1) {
                toast.success('Đổi mật khẩu thành công');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            } else {
                toast.error(normalizeBackendMessage(res?.EM, 'Đổi mật khẩu thất bại'));
            }
        } finally {
            setPasswordLoading(false);
        }
    }, [passwordForm]);

    const handleDeleteAccount = useCallback(async () => {
        if (deleteConfirmText.trim().toUpperCase() !== 'TÔI ĐỒNG Ý KHÓA TÀI KHOẢN') {
            toast.error('Vui lòng nhập đúng cụm từ xác nhận: TÔI ĐỒNG Ý KHÓA TÀI KHOẢN');
            return;
        }

        if (!isGoogleAccount && !deletePassword) {
            toast.error('Vui lòng nhập mật khẩu để xác nhận');
            return;
        }

        setIsLockConfirmOpen(true);
    }, [deleteConfirmText, deletePassword, isGoogleAccount]);

    const handleConfirmLockAccount = useCallback(async () => {
        setIsLockConfirmOpen(false);

        setDeleteLoading(true);
        try {
            const res = await userService.deleteOwnAccount(
                isGoogleAccount ? {} : { password: deletePassword }
            );
            if (res?.EC === 1) {
                toast.success('Tài khoản đã được khóa. Đang đăng xuất…');
                logoutAction();
                if (typeof window !== 'undefined') {
                    window.location.href = '/auth/login';
                }
            } else {
                toast.error(normalizeBackendMessage(res?.EM, 'Khóa tài khoản thất bại'));
            }
        } finally {
            setDeleteLoading(false);
        }
    }, [deletePassword, isGoogleAccount, logoutAction]);

    return (
        <div className="max-w-5xl mx-auto w-full space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                    Hồ sơ cá nhân
                </h1>
                <p className="text-muted-foreground mt-1">
                    Quản lý thông tin tài khoản của bạn
                </p>
            </div>


            <div className="bg-card rounded-2xl p-4 sm:p-6 border border-border">
                <ProfileHeader user={user} />

                {message.text && (
                    <div className={`mb-4 p-3 rounded-lg ${message.type === 'success'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-destructive/10 text-destructive'
                        }`}>
                        {message.text}
                    </div>
                )}

                {isEditing ? (
                    <ProfileEditForm
                        user={user}
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleSubmit}
                        onCancel={() => setIsEditing(false)}
                        isLoading={isLoading}
                    />
                ) : (
                    <ProfileDisplay
                        user={user}
                        onEdit={() => {
                            setIsEditing(true);
                            setMessage({ type: '', text: '' });
                        }}
                    />
                )}
            </div>

            {/* ── Bảo mật riêng tư (PIN Lock) ── */}
            <div className="bg-card rounded-2xl p-4 sm:p-6 border border-border">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                        <LockKeyhole className="size-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Bảo vệ dữ liệu cá nhân</h3>
                        <p className="text-sm text-muted-foreground">
                            Yêu cầu nhập mã PIN khi xem nhật ký, tâm trạng, giấc ngủ và thống kê
                        </p>
                    </div>
                    <div className="ml-auto">
                        {hasPin
                            ? <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900 px-2 py-1 rounded-full"><ShieldCheck className="size-3.5" />Đang bật</span>
                            : <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full"><ShieldOff className="size-3.5" />Chưa bật</span>
                        }
                    </div>
                </div>

                {pinMode === 'idle' && (
                    <div className="flex gap-3">
                        {!hasPin ? (
                            <Button size="sm" onClick={() => setPinMode('set')} variant="outline">
                                <LockKeyhole className="size-4 mr-1" /> Bật mã PIN
                            </Button>
                        ) : (
                            <>
                                <Button size="sm" onClick={() => setPinMode('set')} variant="outline">
                                    Đổi mã PIN
                                </Button>
                                <Button size="sm" onClick={() => setPinMode('remove')} variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10">
                                    <ShieldOff className="size-4 mr-1" /> Tắt mã PIN
                                </Button>
                            </>
                        )}
                    </div>
                )}

                {pinMode === 'set' && (
                    <div className="space-y-3 max-w-xs">
                        <p className="text-sm text-muted-foreground">Nhập mã PIN từ 4–6 chữ số:</p>
                        <div className="relative">
                            <input
                                type={showPin ? 'text' : 'password'}
                                inputMode="numeric"
                                maxLength={6}
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                                placeholder="Mã PIN mới"
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                            />
                            <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        <input
                            type={showPin ? 'text' : 'password'}
                            inputMode="numeric"
                            maxLength={6}
                            value={pinConfirm}
                            onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                            placeholder="Xác nhận mã PIN"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleSetPin} disabled={pinLoading}>
                                {pinLoading ? 'Đang lưu…' : 'Lưu PIN'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setPinMode('idle'); setPinInput(''); setPinConfirm(''); }}>
                                Huỷ
                            </Button>
                        </div>
                    </div>
                )}

                {pinMode === 'remove' && (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Để tắt bảo vệ PIN, vui lòng nhập lại mã PIN hiện tại của bạn.
                        </p>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            value={removePinInput}
                            onChange={(e) => setRemovePinInput(e.target.value.replace(/\D/g, ''))}
                            placeholder="Nhập mã PIN hiện tại"
                            className="w-full max-w-xs px-3 py-2 rounded-lg border border-border bg-background text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {removePinLockedSeconds > 0 && (
                            <p className="text-sm text-destructive">
                                Bạn đã nhập sai quá nhiều lần. Vui lòng chờ {removePinLockedSeconds} giây.
                            </p>
                        )}
                        {removePinLockedSeconds === 0 && removePinAttemptsLeft !== null && removePinAttemptsLeft <= 3 && (
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                Cảnh báo: còn {removePinAttemptsLeft} lần thử trước khi bị khoá tạm thời.
                            </p>
                        )}
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleRemovePin}
                                disabled={pinLoading || !removePinInput || removePinLockedSeconds > 0}
                            >
                                {pinLoading ? 'Đang xử lý…' : 'Xác nhận tắt'}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    setPinMode('idle');
                                    setRemovePinInput('');
                                    setRemovePinLockedSeconds(0);
                                    setRemovePinAttemptsLeft(null);
                                }}
                            >
                                Huỷ
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl p-4 sm:p-6 border border-border space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-violet-100 dark:bg-violet-900 p-2 rounded-lg">
                            <KeyRound className="size-5 text-violet-600 dark:text-violet-300" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Đổi mật khẩu</h3>
                            <p className="text-sm text-muted-foreground">Cập nhật mật khẩu để bảo vệ tài khoản tốt hơn</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder="Mật khẩu hiện tại"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="Mật khẩu mới (>= 6 ký tự)"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <input
                            type="password"
                            value={passwordForm.confirmNewPassword}
                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmNewPassword: e.target.value }))}
                            placeholder="Xác nhận mật khẩu mới"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <Button onClick={handleChangePassword} disabled={passwordLoading} className="w-full sm:w-auto">
                        {passwordLoading ? 'Đang cập nhật…' : 'Đổi mật khẩu'}
                    </Button>
                </div>

                <div className="bg-card rounded-2xl p-4 sm:p-6 border border-destructive/30 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-destructive/10 p-2 rounded-lg">
                            <AlertTriangle className="size-5 text-destructive" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-destructive">Khóa tài khoản</h3>
                            <p className="text-sm text-muted-foreground">Tài khoản sẽ bị vô hiệu hóa và bạn sẽ bị đăng xuất ngay.</p>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Để xác nhận, nhập cụm từ <span className="font-semibold">TÔI ĐỒNG Ý KHÓA TÀI KHOẢN</span>
                        {isGoogleAccount ? '.' : ' và mật khẩu hiện tại.'}
                    </p>

                    <div className="space-y-3">
                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Nhập: TÔI ĐỒNG Ý KHÓA TÀI KHOẢN"
                            className="w-full px-3 py-2 rounded-lg border border-destructive/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-destructive/30"
                        />
                        <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder={isGoogleAccount ? 'Tài khoản Google không cần nhập mật khẩu' : 'Mật khẩu hiện tại'}
                            disabled={isGoogleAccount}
                            className="w-full px-3 py-2 rounded-lg border border-destructive/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-destructive/30 disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                    </div>

                    <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading} className="w-full sm:w-auto">
                        {deleteLoading ? 'Đang xử lý…' : 'Khóa tài khoản'}
                    </Button>
                </div>
            </div>

            <ConfirmDialog
                open={isLockConfirmOpen}
                title="Xác nhận khóa tài khoản"
                description="Bạn có chắc chắn muốn khóa tài khoản? Bạn sẽ bị đăng xuất ngay sau khi xác nhận."
                confirmLabel="Xác nhận khóa"
                cancelLabel="Hủy"
                confirmVariant="destructive"
                onConfirm={handleConfirmLockAccount}
                onClose={() => setIsLockConfirmOpen(false)}
            />

            <ConfirmDialog
                open={isChangePasswordConfirmOpen}
                title="Xác nhận đổi mật khẩu"
                description="Bạn có chắc chắn muốn đổi mật khẩu cho tài khoản này?"
                confirmLabel="Xác nhận đổi"
                cancelLabel="Hủy"
                confirmVariant="default"
                onConfirm={handleConfirmChangePassword}
                onClose={() => setIsChangePasswordConfirmOpen(false)}
            />
        </div>
    );
}
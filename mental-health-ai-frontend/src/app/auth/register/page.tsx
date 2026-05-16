'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth';
import { clearLegacyOnboardingFlags, getOnboardingPendingFlagKey } from '@/constants/onboardingAssessment';
import { normalizeBackendMessage } from '@/utils/normalizeBackendMessage';
import { AuthMessages } from '@/constants/messages/auth.message';
import { toast } from 'sonner';
import { ArrowLeftIcon, Eye, EyeOff } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type RegisterFormData = {
    username: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    genderCode: string;
    dateOfBirth: string;
    password: string;
    confirmPassword: string;
};

type RegisterFormErrors = Partial<Record<keyof RegisterFormData, string>>;

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [logoError, setLogoError] = useState(false);
    const [formData, setFormData] = useState<RegisterFormData>({
        username: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        genderCode: 'MALE',
        dateOfBirth: '',
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState<RegisterFormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        document.documentElement.classList.add('register-lock-scroll');
        document.body.classList.add('register-lock-scroll');

        return () => {
            document.documentElement.classList.remove('register-lock-scroll');
            document.body.classList.remove('register-lock-scroll');
        };
    }, []);

    const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    const isValidVietnamesePhone = (value: string) => /^(?:\+84|84|0)(?:3|5|7|8|9)\d{8}$/.test(value);

    const normalizeDateForBackend = (value: string) => {
        if (!value) return undefined;

        const [year, month, day] = value.split('-');
        if (!year || !month || !day) return undefined;

        return `${day}/${month}/${year}`;
    };

    const getNormalizedPhone = (value: string) => value.replace(/[\s.-]/g, '');

    const updateField = <K extends keyof RegisterFormData>(key: K, value: RegisterFormData[K]) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors((prev) => ({ ...prev, [key]: undefined }));
        }
    };

    const validateForm = (data: RegisterFormData): RegisterFormErrors => {
        const nextErrors: RegisterFormErrors = {};
        const normalizedPhone = getNormalizedPhone(data.phoneNumber.trim());

        if (!data.username.trim()) {
            nextErrors.username = 'Vui lòng nhập tên đăng nhập';
        } else if (data.username.trim().length < 3) {
            nextErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
        }

        if (!data.fullName.trim()) {
            nextErrors.fullName = 'Vui lòng nhập họ và tên';
        }

        if (!data.email.trim()) {
            nextErrors.email = 'Vui lòng nhập email';
        } else if (!isValidEmail(data.email)) {
            nextErrors.email = 'Email chưa đúng định dạng';
        }

        if (!data.phoneNumber.trim()) {
            nextErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
        } else if (!isValidVietnamesePhone(normalizedPhone)) {
            nextErrors.phoneNumber = 'Số điện thoại Việt Nam không hợp lệ';
        }

        if (data.dateOfBirth) {
            const selectedDate = new Date(data.dateOfBirth);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (Number.isNaN(selectedDate.getTime()) || selectedDate > today) {
                nextErrors.dateOfBirth = 'Ngày sinh không hợp lệ';
            }
        }

        if (!data.password) {
            nextErrors.password = 'Vui lòng nhập mật khẩu';
        } else if (data.password.length < 6) {
            nextErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        if (!data.confirmPassword) {
            nextErrors.confirmPassword = 'Vui lòng nhập xác nhận mật khẩu';
        } else if (data.password !== data.confirmPassword) {
            nextErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        return nextErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formErrors = validateForm(formData);
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            toast.error('Vui lòng kiểm tra lại thông tin đã nhập');
            return;
        }

        setErrors({});
        setIsLoading(true);

        try {
            const formattedDob = normalizeDateForBackend(formData.dateOfBirth);
            const normalizedPhone = getNormalizedPhone(formData.phoneNumber.trim());

            const res = await authService.register({
                username: formData.username.trim(),
                fullName: formData.fullName.trim(),
                email: formData.email.trim(),
                password: formData.password,
                phoneNumber: normalizedPhone,
                genderCode: formData.genderCode,
                dateOfBirth: formattedDob,
            });

            // Backend returns EC: 0 for errors (as HTTP 200), EC: 1 for success
            if (res && res.EC === 1) {
                toast.success(AuthMessages.registerSuccess);
                clearLegacyOnboardingFlags();

                const saveResultFlow = searchParams.get('reason') === 'save_result';
                const registerData = res as {
                    data?: { user?: { userId?: string } };
                    user?: { userId?: string };
                };
                const registeredUserId = registerData.data?.user?.userId || registerData.user?.userId || '';

                if (saveResultFlow) {
                    router.push('/auth/login?registered=true&reason=save_result');
                    return;
                }

                if (registeredUserId) {
                    localStorage.setItem(getOnboardingPendingFlagKey(registeredUserId), '1');
                }
                router.push('/auth/login?registered=true&onboarding=true');
            } else {
                toast.error(normalizeBackendMessage(res?.EM, AuthMessages.registerErrorGeneric));
            }
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { EM?: string; message?: string } }; message?: string };
            toast.error(
                normalizeBackendMessage(
                    axiosError.response?.data?.EM || axiosError.response?.data?.message || axiosError.message,
                    AuthMessages.registerErrorGeneric,
                ),
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen bg-linear-to-br from-[#eaf2e8] via-[#f0f4ea] to-[#f5ece6] flex items-center justify-center px-4 sm:px-6 py-8 sm:py-10 relative overflow-y-auto overflow-x-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-96 h-96 bg-sky-100/60 rounded-full blur-3xl" />

            <Link href="/" className="absolute left-4 top-4 sm:left-6 sm:top-5 z-20 text-stone-500 hover:text-stone-700 transition-colors text-sm font-medium inline-flex items-center gap-1.5">
                <ArrowLeftIcon className="w-4 h-4" /> Trang chủ
            </Link>

            <div className="w-full max-w-5xl relative z-10 mx-auto">
                <div className="text-center mb-5 sm:mb-6">
                    <Link href="/" className="inline-flex items-center gap-2 group shrink-0">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
                            {logoError ? (
                                <span className="text-white text-xs font-bold">MH</span>
                            ) : (
                                <img
                                    src="/mental_health.png"
                                    alt="Logo"
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 object-contain brightness-0 invert"
                                    onError={() => setLogoError(true)}
                                />
                            )}
                        </div>
                        <span className="text-xl sm:text-2xl font-bold text-foreground">
                            Mental Health AI
                        </span>
                    </Link>
                </div>

                <div className="bg-white/60 backdrop-blur-2xl rounded-4xl border border-white/70 shadow-[0_12px_40px_rgba(142,179,122,0.12)] p-8 sm:p-10 lg:p-12 xl:p-14">
                    <div className="text-center mb-5">
                        <h1 className="text-xl sm:text-2xl font-medium text-stone-800 mb-1.5">
                            Tạo tài khoản mới
                        </h1>
                        <p className="text-sm sm:text-base text-stone-500 font-light text-center mx-auto max-w-md">
                            Bắt đầu hành trình chăm sóc sức khỏe tinh thần
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-5">
                            <div className="space-y-1.5">
                                <label htmlFor="username" className="block text-sm font-medium text-stone-700 ml-1">
                                    Tên đăng nhập <span className="text-red-400">*</span>
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => updateField('username', e.target.value)}
                                    aria-invalid={Boolean(errors.username)}
                                    className={`w-full h-12 px-4 text-base bg-stone-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-stone-800 placeholder-stone-400 ${errors.username
                                        ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                                        : 'border-stone-100 focus:ring-sky-200 focus:border-sky-400'
                                        }`}
                                    placeholder="Tên đăng nhập"
                                />
                                {errors.username && <p className="ml-1 text-xs text-red-500">{errors.username}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="fullName" className="block text-sm font-medium text-stone-700 ml-1">
                                    Họ và tên <span className="text-red-400">*</span>
                                </label>
                                <input
                                    id="fullName"
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => updateField('fullName', e.target.value)}
                                    aria-invalid={Boolean(errors.fullName)}
                                    className={`w-full h-12 px-4 text-base bg-stone-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-stone-800 placeholder-stone-400 ${errors.fullName
                                        ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                                        : 'border-stone-100 focus:ring-sky-200 focus:border-sky-400'
                                        }`}
                                    placeholder="Nguyễn Văn A"
                                />
                                {errors.fullName && <p className="ml-1 text-xs text-red-500">{errors.fullName}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-5">
                            <div className="space-y-1.5">
                                <label htmlFor="email" className="block text-sm font-medium text-stone-700 ml-1">
                                    Email <span className="text-red-400">*</span>
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    aria-invalid={Boolean(errors.email)}
                                    className={`w-full h-12 px-4 text-base bg-stone-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-stone-800 placeholder-stone-400 ${errors.email
                                        ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                                        : 'border-stone-100 focus:ring-sky-200 focus:border-sky-400'
                                        }`}
                                    placeholder="email@example.com"
                                />
                                {errors.email && <p className="ml-1 text-xs text-red-500">{errors.email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-stone-700 ml-1">
                                    Số điện thoại <span className="text-red-400">*</span>
                                </label>
                                <input
                                    id="phoneNumber"
                                    type="tel"
                                    required
                                    inputMode="numeric"
                                    value={formData.phoneNumber}
                                    onChange={(e) => updateField('phoneNumber', e.target.value)}
                                    aria-invalid={Boolean(errors.phoneNumber)}
                                    className={`w-full h-12 px-4 text-base bg-stone-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-stone-800 placeholder-stone-400 ${errors.phoneNumber
                                        ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                                        : 'border-stone-100 focus:ring-sky-200 focus:border-sky-400'
                                        }`}
                                    placeholder="0901234567"
                                />
                                {errors.phoneNumber && <p className="ml-1 text-xs text-red-500">{errors.phoneNumber}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-5">
                            <div className="space-y-1.5">
                                <label htmlFor="genderCode" className="block text-sm font-medium text-stone-700 ml-1">
                                    Giới tính <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <Select value={formData.genderCode} onValueChange={(val) => setFormData({ ...formData, genderCode: val })}>
                                        <SelectTrigger className="w-full px-4 h-12.5 text-base bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all text-stone-800 shadow-none">
                                            <SelectValue placeholder="Chọn giới tính" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MALE">Nam</SelectItem>
                                            <SelectItem value="FEMALE">Nữ</SelectItem>
                                            <SelectItem value="OTHER">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-stone-700 ml-1">
                                    Ngày sinh
                                </label>
                                <DatePicker
                                    value={formData.dateOfBirth}
                                    onChange={(value) => updateField('dateOfBirth', value)}
                                    placeholder="Chọn ngày sinh"
                                    disableFutureDates
                                    className={`h-12 rounded-xl bg-stone-50 text-base ${errors.dateOfBirth
                                        ? 'border-red-300 focus-visible:ring-red-200'
                                        : 'border-stone-100 focus-visible:ring-sky-200'
                                        }`}
                                />
                                {errors.dateOfBirth ? (
                                    <p className="ml-1 text-xs text-red-500">{errors.dateOfBirth}</p>
                                ) : null}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-5">
                            <div className="space-y-1.5">
                                <label htmlFor="password" className="block text-sm font-medium text-stone-700 ml-1">
                                    Mật khẩu <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={(e) => updateField('password', e.target.value)}
                                        aria-invalid={Boolean(errors.password)}
                                        className={`w-full h-12 pl-4 pr-12 text-base bg-stone-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-stone-800 placeholder-stone-400 ${errors.password
                                            ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                                            : 'border-stone-100 focus:ring-sky-200 focus:border-sky-400'
                                            }`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1"
                                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="ml-1 text-xs text-red-500">{errors.password}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700 ml-1">
                                    Xác nhận mật khẩu <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                                        aria-invalid={Boolean(errors.confirmPassword)}
                                        className={`w-full h-12 pl-4 pr-12 text-base bg-stone-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-stone-800 placeholder-stone-400 ${errors.confirmPassword
                                            ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                                            : 'border-stone-100 focus:ring-sky-200 focus:border-sky-400'
                                            }`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1"
                                        aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="ml-1 text-xs text-red-500">{errors.confirmPassword}</p>}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 mt-2 bg-primary text-primary-foreground hover:opacity-90 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center shadow-[0_4px_14px_rgba(142,179,122,0.3)] hover:-translate-y-0.5"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Đang tạo tài khoản...
                                </span>
                            ) : (
                                'Đăng ký'
                            )}
                        </button>
                    </form>

                    <div className="relative mt-6 mb-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-stone-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-stone-500">Hoặc tiếp tục với</span>
                        </div>
                    </div>

                    {/* <button
                        type="button"
                        onClick={() => window.location.href = 'http://localhost:8080/api/v1/auth/google'}
                        className="w-full h-12 flex items-center justify-center gap-2 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl font-medium transition-all duration-300 shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Đăng ký bằng Google
                    </button> */}

                    <div className="mt-6 text-center">
                        <p className="text-sm sm:text-base text-stone-500 mx-auto max-w-md">
                            Đã có tài khoản?{' '}
                            <Link href="/auth/login" className="text-sky-600 hover:text-stone-700 font-semibold transition-colors">
                                Đăng nhập
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}


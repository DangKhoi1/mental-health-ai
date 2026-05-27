'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { authService } from '@/services';
import { authStorage } from '@/lib/auth';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  useEffect(() => {
    if (authStorage.getToken() && authStorage.isAdmin()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const validate = () => {
    const e: { username?: string; password?: string } = {};
    if (!username) e.username = 'Vui lòng nhập tên đăng nhập.';
    else if (username.length < 3) e.username = 'Tên đăng nhập tối thiểu 3 ký tự.';
    if (!password) e.password = 'Vui lòng nhập mật khẩu.';
    else if (password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await authService.login(username, password);

      if (res?.EC !== 1 || !res?.data?.accessToken || !res?.data?.user) {
        setError(res?.EM || 'Đăng nhập thất bại.');
        return;
      }

      if (res.data.user?.role?.roleName !== 'Admin') {
        setError('Tài khoản không có quyền quản trị.');
        return;
      }

      authStorage.setToken(res.data.accessToken);
      authStorage.setUser(res.data.user);
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const errorResponse = (err as Record<string, unknown>).response as { data?: { message?: string, EM?: string } } | undefined;
        setError(
          errorResponse?.data?.message ||
          errorResponse?.data?.EM ||
          'Không thể đăng nhập. Vui lòng thử lại.'
        );
      } else {
        setError('Không thể đăng nhập. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-secondary/35 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 size-96 rounded-full bg-accent/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 size-96 rounded-full bg-primary/18 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5">
            <div className="size-11 rounded-xl bg-primary flex items-center justify-center">
              <Image src="/mental_health.png" alt="Logo" width={28} height={28} className="brightness-0 invert" />
            </div>
            <span className="text-xl font-semibold text-foreground">Mental Health AI</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card rounded-[28px] border border-border shadow-[0_24px_60px_rgba(63,58,51,0.10)] p-8">
          <div className="text-center mb-7">
            <h1 className="text-2xl font-semibold text-foreground">Đăng nhập</h1>
            <p className="text-sm text-muted-foreground mt-1.5">Dành cho quản trị viên hệ thống</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground ml-1">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrors((prev) => ({ ...prev, username: undefined }));
                }}
                placeholder="Nhập tên đăng nhập"
                className={`w-full px-4 py-3 text-sm bg-muted border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground ${errors.username ? 'border-red-400' : 'border-border'}`}
              />
              {errors.username && <p className="text-red-500 text-xs ml-1">{errors.username}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground ml-1">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pr-11 text-sm bg-muted border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground ${errors.password ? 'border-red-400' : 'border-border'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs ml-1">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full h-11 rounded-xl font-medium text-sm mt-1"
            >
              Đăng nhập
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

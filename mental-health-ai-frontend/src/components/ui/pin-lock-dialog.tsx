'use client';

import React, { useRef, useState, useEffect, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { LockKeyhole, Delete } from 'lucide-react';

interface PinLockDialogProps {
  /** Tên tài nguyên cần bảo vệ, hiển thị trong dialog */
  resourceName?: string;
  onSuccess: () => void;
  onCancel?: () => void;
  /** Callback gọi backend verify, trả về true nếu đúng PIN */
  onVerify: (pin: string) => Promise<boolean>;
  /** Số giây còn lại bị khoá (0 = không bị khoá) */
  lockedSeconds?: number;
  /** Số lần thử còn lại trước khi bị khoá (null = chưa sai lần nào) */
  attemptsLeft?: number | null;
}

const PIN_MIN_LENGTH = 4;
const PIN_MAX_LENGTH = 6;

export function PinLockDialog({
  resourceName = 'dữ liệu',
  onSuccess,
  onCancel,
  onVerify,
  lockedSeconds = 0,
  attemptsLeft = null,
}: PinLockDialogProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isLocked = lockedSeconds > 0;

  // Auto-focus ô đầu tiên
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (value: string) => {
    if (isLocked || loading) return;
    const normalized = value.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH);
    setPin(normalized);
    setError('');
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  // Bàn phím số trên màn hình
  const handleNumpad = (num: string) => {
    if (pin.length >= PIN_MAX_LENGTH) return;
    handleChange(pin + num);
  };

  const handleNumpadDelete = () => {
    if (!pin.length) return;
    setPin((prev) => prev.slice(0, -1));
    setError('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const submit = async (providedPin?: string) => {
    const pinToCheck = providedPin ?? pin;
    if (pinToCheck.length < PIN_MIN_LENGTH || pinToCheck.length > PIN_MAX_LENGTH) return;
    setLoading(true);
    setError('');
    try {
      const ok = await onVerify(pinToCheck);
      if (ok) {
        onSuccess();
      } else {
        if (!isLocked) {
          setError('Mã PIN không đúng. Vui lòng thử lại.');
        }
        setPin('');
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } finally {
      setLoading(false);
    }
  };

  // Tự động xác minh: đủ 6 số thì kiểm tra ngay, 4-5 số thì chờ người dùng ngừng nhập.
  useEffect(() => {
    if (isLocked || loading) return;
    if (pin.length < PIN_MIN_LENGTH || pin.length > PIN_MAX_LENGTH) return;

    if (pin.length === PIN_MAX_LENGTH) {
      void submit(pin);
      return;
    }

    const timer = window.setTimeout(() => {
      void submit(pin);
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pin, isLocked, loading]);

  const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0'];

  const dialogContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-85 flex flex-col items-center gap-5">
        {/* Icon + tiêu đề */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full">
            <LockKeyhole className="w-8 h-8 text-blue-600 dark:text-blue-300" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">
            Xác minh bảo mật
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Nhập mã PIN (4-6 số) để truy cập {resourceName}
          </p>
        </div>

        {/* Một khung nhập PIN duy nhất */}
        <div
          className={cn(
            'w-full rounded-xl border bg-gray-50 dark:bg-gray-800 transition-colors',
            'border-gray-300 dark:border-gray-600',
            'focus-within:ring-2 focus-within:ring-blue-500/40',
            error && 'border-red-400 focus-within:ring-red-500/30',
            isLocked && 'opacity-50',
            shake && 'animate-[shake_0.4s_ease]',
          )}
        >
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            value={pin}
            disabled={isLocked || loading}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleInputKeyDown}
            maxLength={PIN_MAX_LENGTH}
            placeholder="Nhập mã PIN (4-6 số)"
            aria-label="Nhập mã PIN"
            className="w-full h-12 bg-transparent px-4 text-center text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none disabled:cursor-not-allowed"
          />
        </div>

        {/* Banner bị khoá */}
        {isLocked && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 px-4 py-2 text-sm text-red-600 dark:text-red-400">
            <LockKeyhole className="w-4 h-4 shrink-0" />
            <span>Nhập sai PIN. Thử lại sau <strong>{lockedSeconds}</strong> giây.</span>
          </div>
        )}

        {/* Thông báo lỗi bình thường */}
        {!isLocked && error && (
          <p className="text-sm text-red-500 text-center -mt-2">{error}</p>
        )}

        {/* Cảnh báo còn X lần thử */}
        {!isLocked && attemptsLeft !== null && attemptsLeft <= 3 && (
          <p className="text-sm text-amber-500 dark:text-amber-400 text-center -mt-2">
            Cảnh báo: còn <strong>{attemptsLeft}</strong> lần thử trước khi bị khoá tạm thời.
          </p>
        )}

        {/* Bàn phím số */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {numpadKeys.map((k, i) =>
            k === '' ? (
              <div key={i} />
            ) : (
              <button
                key={i}
                onClick={() => handleNumpad(k)}
                disabled={loading || isLocked}
                className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-lg font-semibold text-gray-800 dark:text-white transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {k}
              </button>
            ),
          )}
          <button
            onClick={handleNumpadDelete}
            disabled={loading || isLocked}
            className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Delete className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Nút Huỷ */}
        <div className="flex flex-col w-full gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            PIN sẽ được xác minh tự động khi bạn ngừng nhập (hoặc ngay khi đủ 6 số).
          </p>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} disabled={loading} className="w-full">
              Huỷ
            </Button>
          )}
        </div>
      </div>

      {/* CSS animation shake */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(dialogContent, document.body);
}

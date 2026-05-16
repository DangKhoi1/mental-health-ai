'use client';

import React from 'react';
import { usePinLock } from '@/hooks/usePinLock';
import { PinLockDialog } from '@/components/ui/pin-lock-dialog';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from 'next/navigation';

interface PinGuardProps {
  children: React.ReactNode;
  /** Tên tài nguyên tuỳ chỉnh hiển thị trong dialog */
  resourceName?: string;
}

/**
 * Bọc quanh nội dung trang nhạy cảm.
 * - Nếu user KHÔNG bật PIN → hiển thị nội dung bình thường.
 * - Nếu user có PIN và chưa xác minh → hiển thị dialog nhập PIN.
 * - Sau khi xác minh đúng → hiển thị nội dung, nhớ 5 phút trong session.
 */
export function PinGuard({ children, resourceName = 'dữ liệu cá nhân' }: PinGuardProps) {
  const { isUnlocked, isChecking, hasPin, verifyPin, lockedSeconds, attemptsLeft } = usePinLock();
  const router = useRouter();

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      {(!hasPin || isUnlocked) && children}

      {hasPin && !isUnlocked && (
        <PinLockDialog
          resourceName={resourceName}
          onVerify={verifyPin}
          lockedSeconds={lockedSeconds}
          attemptsLeft={attemptsLeft}
          onSuccess={() => { /* hook tự cập nhật isUnlocked */ }}
          onCancel={() => router.back()}
        />
      )}
    </>
  );
}

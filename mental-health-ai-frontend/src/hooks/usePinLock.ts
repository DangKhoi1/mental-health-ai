import { useState, useCallback, useEffect, useRef } from 'react';
import { userService } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

const PIN_TTL_MS = 5 * 60 * 1000; // 5 minutes
// const PIN_TTL_MS = 5 * 1000; 


const STORAGE_KEY = 'pinUnlockedAt';
const PIN_STATUS_CACHE_KEY = 'hasPrivacyPin';
const PRIVACY_REQUIRED_EVENT = 'privacy:required';

function getCachedPinStatus(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PIN_STATUS_CACHE_KEY) === 'true';
}

function setCachedPinStatus(value: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PIN_STATUS_CACHE_KEY, value ? 'true' : 'false');
  }
}

function isPinStillValid(): boolean {
  if (typeof window === 'undefined') return false;
  const ts = sessionStorage.getItem(STORAGE_KEY);
  if (!ts) return false;
  return Date.now() - Number(ts) < PIN_TTL_MS;
}

function hasPrivacyToken(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(sessionStorage.getItem('journalPrivacyToken'));
}

function markPinVerified() {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
  }
}

function refreshPinActivity() {
  if (typeof window === 'undefined') return;
  if (!isPinStillValid()) return;
  sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
}

function clearPinSession() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('journalPrivacyToken');
  }
}

interface UsePinLockReturn {
  /** true nếu PIN đã được xác minh và còn hiệu lực */
  isUnlocked: boolean;
  /** true khi đang kiểm tra backend xem user có PIN không */
  isChecking: boolean;
  /** true nếu user đã bật tính năng PIN */
  hasPin: boolean;
  /** Gọi khi user nhập PIN trên dialog, trả về true nếu đúng */
  verifyPin: (pin: string) => Promise<boolean>;
  /** Khoá lại thủ công (ví dụ khi logout hoặc rời trang) */
  lock: () => void;
  /** Số giây còn lại trong thời gian bị khoá (0 = không bị khoá) */
  lockedSeconds: number;
  /** Số lần thử còn lại trước khi bị khoá (null = chưa sai lần nào) */
  attemptsLeft: number | null;
}

/**
 * Hook quản lý PIN Lock cho trang hiển thị dữ liệu nhạy cảm.
 * - Kiểm tra user có bật PIN không (gọi 1 lần khi mount).
 * - Dùng sessionStorage để giữ trạng thái trong cửa sổ trình duyệt.
 * - Hết hạn sau PIN_TTL_MS (5 phút mặc định).
 */
export function usePinLock(): UsePinLockReturn {
  const [hasPin, setHasPin] = useState(() => getCachedPinStatus());
  const [isChecking, setIsChecking] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(() => isPinStillValid() && hasPrivacyToken());
  const [lockedUntilMs, setLockedUntilMs] = useState(0);
  const [lockedSeconds, setLockedSeconds] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const lastPrivacyToastAtRef = useRef(0);

  // Countdown khi bị khoá
  useEffect(() => {
    if (lockedUntilMs <= Date.now()) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntilMs - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedSeconds(0);
        clearInterval(interval);
      } else {
        setLockedSeconds(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntilMs]);

  // Lấy trạng thái PIN từ backend sau khi auth đã hydrate
  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      setIsChecking(false);
      setHasPin(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await userService.getPrivacyPinStatus() as unknown as Record<string, unknown>;
        if (!cancelled) {
          // Backend dùng response wrapper, hasPin thường nằm trong data.hasPin
          const pinEnabled = !!(
            (res?.data as Record<string, unknown>)?.hasPin ??
            res?.hasPin
          );
          setHasPin(pinEnabled);
          setCachedPinStatus(pinEnabled);
          // Nếu user đã xác minh trước đó và còn trong TTL thì vẫn mở
          if (isPinStillValid() && hasPrivacyToken()) setIsUnlocked(true);
        }
      } catch {
        // Lỗi tạm thời: fallback trạng thái cache để tránh "mất PIN" sau reload
        if (!cancelled) {
          setHasPin(getCachedPinStatus());
        }
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [_hasHydrated, isAuthenticated]);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const res = await userService.verifyPrivacyPin(pin) as unknown as Record<string, unknown>;

      const resData = (res?.data as Record<string, unknown>) ?? {};

      // Kiểm tra bị khoá (sài sai đủ 5 lần)
      const lockedSecs = (resData?.lockedSeconds as number) ?? (res?.lockedSeconds as number) ?? 0;
      if (lockedSecs > 0) {
        setLockedUntilMs(Date.now() + lockedSecs * 1000);
        setLockedSeconds(lockedSecs);
        setAttemptsLeft(null);
        return false;
      }

      // Nhập sai nhưng chưa đủ 5 lần
      const attLeft = (resData?.attemptsLeft as number) ?? (res?.attemptsLeft as number) ?? null;
      if (res?.EC === 0 && attLeft !== null) {
        setAttemptsLeft(attLeft);
        return false;
      }

      if (res?.EC === 1) {
        const privacyToken =
          typeof resData?.privacyToken === 'string'
            ? resData.privacyToken
            : typeof res?.privacyToken === 'string'
              ? (res.privacyToken as string)
              : null;

        if (privacyToken && typeof window !== 'undefined') {
          sessionStorage.setItem('journalPrivacyToken', privacyToken);
        }

        markPinVerified();
        setIsUnlocked(true);
        setHasPin(true);
        setCachedPinStatus(true);
        // Xoá lockout khi nhập đúng
        setLockedUntilMs(0);
        setLockedSeconds(0);
        setAttemptsLeft(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const lock = useCallback(() => {
    clearPinSession();
    setIsUnlocked(false);
  }, []);

  // Tự khoá khi quá TTL (kể cả user đang đứng yên trên cùng trang).
  useEffect(() => {
    if (!isUnlocked) return;

    const interval = window.setInterval(() => {
      if (!isPinStillValid()) {
        lock();
        toast.info('Phiên bảo mật đã hết hạn. Vui lòng nhập lại mã PIN.');
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isUnlocked, lock]);

  // Khi backend báo 403 privacy token hết hạn/thiếu: khoá ngay để PinGuard bật dialog lại.
  useEffect(() => {
    const handlePrivacyRequired = () => {
      lock();
      const now = Date.now();
      // Tránh spam toast khi nhiều request cùng trả về 403 privacy.
      if (now - lastPrivacyToastAtRef.current > 2500) {
        lastPrivacyToastAtRef.current = now;
        toast.info('Phiên bảo mật đã hết hạn. Vui lòng nhập lại mã PIN.');
      }
    };

    window.addEventListener(PRIVACY_REQUIRED_EVENT, handlePrivacyRequired);
    return () => {
      window.removeEventListener(PRIVACY_REQUIRED_EVENT, handlePrivacyRequired);
    };
  }, [lock]);

  // Gia hạn phiên PIN khi user đang thao tác (idle timeout 5 phút).
  // sessionStorage vốn theo từng tab, nên mở tab mới vẫn sẽ phải nhập lại PIN.
  useEffect(() => {
    const handleActivity = () => {
      refreshPinActivity();
    };

    const events: Array<keyof WindowEventMap> = [
      'click',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
    };
  }, []);

  return { isUnlocked, isChecking, hasPin, verifyPin, lock, lockedSeconds, attemptsLeft };
}

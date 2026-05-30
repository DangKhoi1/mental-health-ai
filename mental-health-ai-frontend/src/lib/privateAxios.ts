import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import { Mutex } from 'async-mutex';

const mutex = new Mutex();
const NO_RETRY_HEADER = 'x-no-retry';
const PRIVACY_REQUIRED_EVENT = 'privacy:required';
let lastPrivacyEventAt = 0;

function isSensitivePrivacyUrl(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/journals/') ||
    url.includes('/daily-moods/') ||
    url.includes('/sleep-logs/') ||
    url.includes('/users/me/health-summary')
  );
}

const getApiUrl = (envVal: string | undefined): string => {
  let url = (envVal || 'http://localhost:8080/api/v1').trim();
  if (url && !/^https?:\/\//i.test(url) && !/^\//.test(url)) {
    const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(url.split('/')[0]);
    url = (isLocal ? 'http://' : 'https://') + url;
  }
  if (!/\/api(\/v\d+)?\/?$/.test(url)) {
    return url.replace(/\/$/, '') + '/api/v1';
  }
  return url;
};

const privateAxios = axios.create({
  baseURL: getApiUrl(process.env.NEXT_PUBLIC_API_URL),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const handleRefreshToken = async (): Promise<string | null> => {
  return await mutex.runExclusive(async () => {
    try {
      const res = await privateAxios.get('/auth/refresh-token', {
        headers: { [NO_RETRY_HEADER]: 'true' },
      });

      if (res && res.data?.EC === 1 && res.data?.accessToken) {
        return res.data.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  });
};

privateAxios.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Sensitive endpoints require a short-lived privacy token after PIN verification.
    const requiresPrivacyToken =
      config.url?.includes('/journals/') ||
      config.url?.includes('/daily-moods/') ||
      config.url?.includes('/sleep-logs/') ||
      config.url?.includes('/users/me/health-summary');
    if (requiresPrivacyToken) {
      const privacyToken =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('journalPrivacyToken')
          : null;

      if (privacyToken) {
        config.headers['x-privacy-token'] = privacyToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

privateAxios.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const responseData = error?.response?.data;
    const responseMessage =
      typeof responseData?.EM === 'string'
        ? responseData.EM
        : typeof responseData?.message === 'string'
          ? responseData.message
          : '';

    if (
      error.response?.status === 401 &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.headers[NO_RETRY_HEADER]
    ) {
      originalRequest.headers[NO_RETRY_HEADER] = 'true';
      
      const newAccessToken = await handleRefreshToken();
      
      if (newAccessToken) {
        useAuthStore.setState({ accessToken: newAccessToken });
        
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return privateAxios.request(originalRequest);
      } else {
        const { setRefreshTokenExpired } = useAuthStore.getState();
        setRefreshTokenExpired(true, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return Promise.reject(error);
      }
    }

    if (
      error.response?.status === 400 &&
      originalRequest.url?.includes('/auth/refresh-token')
    ) {
      const { setRefreshTokenExpired } = useAuthStore.getState();
      setRefreshTokenExpired(true, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const isPrivacyMessageMatch =
      responseMessage.includes('Privacy verification required') ||
      responseMessage.includes('Privacy token is invalid or expired') ||
      responseMessage.includes('Invalid privacy token purpose') ||
      responseMessage.includes('Privacy token does not match current user');

    // Ưu tiên nhận diện theo status + endpoint nhạy cảm để không phụ thuộc EM/message backend.
    const isPrivacyError =
      error.response?.status === 403 &&
      (isSensitivePrivacyUrl(originalRequest?.url) || isPrivacyMessageMatch);

    if (isPrivacyError && typeof window !== 'undefined') {
      sessionStorage.removeItem('pinUnlockedAt');
      sessionStorage.removeItem('journalPrivacyToken');
      const now = Date.now();
      // Nhiều API có thể fail cùng lúc -> chỉ cần bắn một event để mở PIN dialog lại.
      if (now - lastPrivacyEventAt > 1000) {
        lastPrivacyEventAt = now;
        window.dispatchEvent(new Event(PRIVACY_REQUIRED_EVENT));
      }
    }

    return error?.response?.data ?? Promise.reject(error);
  }
);

export default privateAxios;

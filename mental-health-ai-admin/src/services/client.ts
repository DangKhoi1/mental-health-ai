import axios, { AxiosError, AxiosInstance } from 'axios';
import { authStorage } from '@/lib/auth';

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

const API_BASE_URL = getApiUrl(process.env.NEXT_PUBLIC_API_URL);

interface BackendEnvelope {
  EC?: number;
  EM?: string;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
}

function normalizeEnvelope(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const envelope = payload as BackendEnvelope;

  // Kiểm tra nếu payload có cấu trúc envelope chuẩn (EC + data)
  if (!('EC' in envelope) || !('data' in envelope)) {
    return payload;
  }

  const nestedData = envelope.data;

  // Chỉ flatten nếu data là object đơn (không phải array)
  // và không có trường data trùng với template/question/templates
  if (nestedData && typeof nestedData === 'object' && !Array.isArray(nestedData)) {
    // Kiểm tra xem data có phải là response wrapper không
    const dataObj = nestedData as Record<string, unknown>;
    if ('template' in dataObj || 'question' in dataObj || 'templates' in dataObj) {
      // Giữ nguyên cấu trúc gốc, chỉ bổ sung data
      return {
        ...envelope,
        ...nestedData,
        _originalData: nestedData,
      };
    }
    return {
      ...nestedData,
      ...envelope,
      data: nestedData,
    };
  }

  return envelope;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    response.data = normalizeEnvelope(response.data);
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      authStorage.clearAll();
    }
    return Promise.reject(error);
  },
);

export { apiClient };
import { create } from 'zustand';
import { sleepLogService } from '@/services';
import { SleepLogMessages } from '@/constants/messages';
import { normalizeBackendMessage } from '@/utils/normalizeBackendMessage';
import { SleepLog, CreateSleepLogDto } from '@/types';

interface SleepLogState {
  sleepLogs: SleepLog[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  startDate?: string;
  endDate?: string;
}

interface SleepLogActions {
  fetchSleepLogs: (startDate?: string, endDate?: string, page?: number, limit?: number) => Promise<void>;
  createSleepLog: (data: CreateSleepLogDto) => Promise<boolean>;
  updateSleepLog: (id: string, data: Partial<CreateSleepLogDto>) => Promise<boolean>;
  deleteSleepLog: (id: string) => Promise<boolean>;
  restoreSleepLog: (id: string) => Promise<boolean>;
  reset: () => void;
}

const initialState: SleepLogState = {
  sleepLogs: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  startDate: undefined,
  endDate: undefined,
};

export const useSleepLogStore = create<SleepLogState & SleepLogActions>((set, get) => ({
  ...initialState,

  fetchSleepLogs: async (startDate?: string, endDate?: string, page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sleepLogService.getAll(startDate, endDate, page, limit);
      const sleepLogs = response?.data?.sleepLogs;
      set({
        sleepLogs: Array.isArray(sleepLogs) ? sleepLogs : [],
        page: response?.data?.page || page,
        limit: response?.data?.limit || limit,
        total: response?.data?.total || 0,
        totalPages: response?.data?.totalPages || 1,
        startDate,
        endDate,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch sleep logs:', error);
      set({ sleepLogs: [], isLoading: false, error: SleepLogMessages.fetchError });
    }
  },

  createSleepLog: async (data: CreateSleepLogDto) => {
    set({ isSubmitting: true, error: null });
    try {
      const res = await sleepLogService.create(data);
      if (res && res.EC === 1) {
        const state = get();
        await state.fetchSleepLogs(state.startDate, state.endDate, state.page, state.limit);
        set({ isSubmitting: false });
        return true;
      } else {
        set({
          isSubmitting: false,
          error: normalizeBackendMessage(res?.EM, SleepLogMessages.createError),
        });
        return false;
      }
    } catch (error) {
      console.error('Failed to create sleep log:', error);
      set({ isSubmitting: false, error: SleepLogMessages.createError });
      return false;
    }
  },

  updateSleepLog: async (id: string, data: Partial<CreateSleepLogDto>) => {
    set({ isSubmitting: true, error: null });
    try {
      const res = await sleepLogService.update(id, data);
      if (res && res.EC === 1) {
        const state = get();
        await state.fetchSleepLogs(state.startDate, state.endDate, state.page, state.limit);
        set({ isSubmitting: false });
        return true;
      } else {
        set({
          isSubmitting: false,
          error: normalizeBackendMessage(res?.EM, SleepLogMessages.updateError),
        });
        return false;
      }
    } catch (error) {
      console.error('Failed to update sleep log:', error);
      set({ isSubmitting: false, error: SleepLogMessages.updateError });
      return false;
    }
  },

  deleteSleepLog: async (id: string) => {
    try {
      const res = await sleepLogService.delete(id);

      if (!res || res.EC !== 1) {
        set({
          error: normalizeBackendMessage(res?.EM, SleepLogMessages.deleteError),
        });
        return false;
      }

      const state = get();
      await state.fetchSleepLogs(state.startDate, state.endDate, state.page, state.limit);
      set({ error: null });
      return true;
    } catch (error) {
      console.error('Failed to delete sleep log:', error);
      set({ error: SleepLogMessages.deleteError });
      return false;
    }
  },

  restoreSleepLog: async (id: string) => {
    try {
      const res = await sleepLogService.restore(id);
      if (!res || res.EC !== 1) {
        set({ error: normalizeBackendMessage(res?.EM, 'Khôi phục thất bại.') });
        return false;
      }
      const state = get();
      await state.fetchSleepLogs(state.startDate, state.endDate, state.page, state.limit);
      return true;
    } catch (error) {
      console.error('Failed to restore sleep log:', error);
      set({ error: 'Khôi phục thất bại.' });
      return false;
    }
  },

  reset: () => set(initialState),
}));

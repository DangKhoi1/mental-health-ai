import { create } from 'zustand';
import { dailyMoodService } from '@/services';
import { DailyMoodMessages } from '@/constants/messages';
import { normalizeBackendMessage } from '@/utils/normalizeBackendMessage';
import { DailyMood, CreateDailyMoodDto } from '@/types';
import { eventBus } from '@/lib/eventBus';

interface DailyMoodState {
  moods: DailyMood[];
  isLoading: boolean;
  isSubmitting: boolean;
  isSubmittingRef: { current: boolean };
  error: string | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  startDate?: string;
  endDate?: string;
}

interface DailyMoodActions {
  fetchMoods: (startDate?: string, endDate?: string, page?: number, limit?: number) => Promise<void>;
  createMood: (data: CreateDailyMoodDto) => Promise<boolean>;
  updateMood: (id: string, data: Partial<CreateDailyMoodDto>) => Promise<boolean>;
  deleteMood: (id: string) => Promise<boolean>;
  restoreMood: (id: string) => Promise<boolean>;
  reset: () => void;
}

const initialState: DailyMoodState = {
  moods: [],
  isLoading: false,
  isSubmitting: false,
  isSubmittingRef: { current: false },
  error: null,
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  startDate: undefined,
  endDate: undefined,
};

export const useDailyMoodStore = create<DailyMoodState & DailyMoodActions>((set, get) => ({
  ...initialState,

  fetchMoods: async (startDate?: string, endDate?: string, page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await dailyMoodService.getAll(startDate, endDate, page, limit);
      const moods = response?.data?.moods;
      set({
        moods: Array.isArray(moods) ? moods : [],
        page: response?.data?.page || page,
        limit: response?.data?.limit || limit,
        total: response?.data?.total || 0,
        totalPages: response?.data?.totalPages || 1,
        startDate,
        endDate,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch moods:', error);
      set({ moods: [], isLoading: false, error: DailyMoodMessages.fetchError });
    }
  },

  createMood: async (data: CreateDailyMoodDto) => {
    if (get().isSubmittingRef.current) return false;
    get().isSubmittingRef.current = true;
    set({ isSubmitting: true, error: null });
    try {
      const res = await dailyMoodService.create(data);
      if (res && res.EC === 1) {
        const state = get();
        await state.fetchMoods(state.startDate, state.endDate, state.page, state.limit);
        set({ isSubmitting: false });
        get().isSubmittingRef.current = false;
        eventBus.emit('mood:logged');
        return true;
      } else {
        set({
          isSubmitting: false,
          error: normalizeBackendMessage(res?.EM, DailyMoodMessages.createError),
        });
        get().isSubmittingRef.current = false;
        return false;
      }
    } catch (error) {
      console.error('Failed to create mood:', error);
      set({ isSubmitting: false, error: DailyMoodMessages.createError });
      get().isSubmittingRef.current = false;
      return false;
    }
  },

  deleteMood: async (id: string) => {
    try {
      const res = await dailyMoodService.delete(id);

      if (!res || res.EC !== 1) {
        set({
          error: normalizeBackendMessage(res?.EM, DailyMoodMessages.deleteError),
        });
        return false;
      }

      const state = get();
      await state.fetchMoods(state.startDate, state.endDate, state.page, state.limit);
      set({ error: null });
      return true;
    } catch (error) {
      console.error('Failed to delete mood:', error);
      set({ error: DailyMoodMessages.deleteError });
      return false;
    }
  },

  updateMood: async (id: string, data: Partial<CreateDailyMoodDto>) => {
    if (get().isSubmittingRef.current) return false;
    get().isSubmittingRef.current = true;
    set({ isSubmitting: true, error: null });
    try {
      const res = await dailyMoodService.update(id, data);
      if (res && res.EC === 1) {
        const state = get();
        await state.fetchMoods(state.startDate, state.endDate, state.page, state.limit);
        set({ isSubmitting: false });
        get().isSubmittingRef.current = false;
        return true;
      } else {
        set({
          isSubmitting: false,
          error: normalizeBackendMessage(res?.EM, 'Gặp lỗi khi cập nhật.'),
        });
        get().isSubmittingRef.current = false;
        return false;
      }
    } catch (error) {
      console.error('Failed to update mood:', error);
      set({ isSubmitting: false, error: 'Gặp lỗi khi cập nhật.' });
      get().isSubmittingRef.current = false;
      return false;
    }
  },

  restoreMood: async (id: string) => {
    try {
      const res = await dailyMoodService.restore(id);
      if (!res || res.EC !== 1) {
        set({ error: normalizeBackendMessage(res?.EM, 'Khôi phục thất bại.') });
        return false;
      }
      const state = get();
      await state.fetchMoods(state.startDate, state.endDate, state.page, state.limit);
      return true;
    } catch (error) {
      console.error('Failed to restore mood:', error);
      set({ error: 'Khôi phục thất bại.' });
      return false;
    }
  },

  reset: () => {
    get().isSubmittingRef.current = false;
    set({ ...initialState, isSubmittingRef: { current: false } });
  },
}));

import { create } from 'zustand';
import { journalService } from '@/services';
import { JournalMessages } from '@/constants/messages';
import { normalizeBackendMessage } from '@/utils/normalizeBackendMessage';
import { Journal, CreateJournalDto } from '@/types';
import { eventBus } from '@/lib/eventBus';

interface JournalState {
  journals: Journal[];
  isLoading: boolean;
  isSubmitting: boolean;
  isSubmittingRef: { current: boolean };
  error: string | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  search: string;
}

interface JournalActions {
  fetchJournals: (page?: number, limit?: number, search?: string) => Promise<void>;
  createJournal: (data: CreateJournalDto) => Promise<{ success: boolean; journalId: string | null; reason?: string }>;
  updateJournal: (id: string, data: Partial<CreateJournalDto>) => Promise<boolean>;
  deleteJournal: (id: string) => Promise<boolean>;
  restoreJournal: (id: string) => Promise<boolean>;
  reset: () => void;
}

const initialState: JournalState = {
  journals: [],
  isLoading: false,
  isSubmitting: false,
  isSubmittingRef: { current: false },
  error: null,
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  search: '',
};

export const useJournalStore = create<JournalState & JournalActions>((set, get) => ({
  ...initialState,

  fetchJournals: async (page = 1, limit = 10, search = '') => {
    set({ isLoading: true, error: null });
    try {
      const response = await journalService.getAll(page, limit, search);
      const journals = response?.data?.journals;
      set({
        journals: Array.isArray(journals) ? journals : [],
        page: response?.data?.page || page,
        limit: response?.data?.limit || limit,
        total: response?.data?.total || 0,
        totalPages: response?.data?.totalPages || 1,
        search,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch journals:', error);
      set({ journals: [], isLoading: false, error: JournalMessages.fetchError });
    }
  },

  createJournal: async (data: CreateJournalDto) => {
    // Guard: prevent double submission via ref (works across re-renders)
    if (get().isSubmittingRef.current) {
      return { success: false, journalId: null, reason: 'duplicate' };
    }
    get().isSubmittingRef.current = true;
    set({ isSubmitting: true, error: null });
    try {
      const res = await journalService.create(data);
      if (res && res.EC === 1) {
        const createRes = res as {
          data?: { journalId?: string };
          journalId?: string;
        };
        const createdJournalId = createRes.data?.journalId || createRes.journalId || null;
        const state = get();
        await state.fetchJournals(state.page, state.limit, state.search);
        eventBus.emit('journal:created');
        set({ isSubmitting: false });
        get().isSubmittingRef.current = false;
        return { success: true, journalId: createdJournalId };
      } else {
        set({
          isSubmitting: false,
          error: normalizeBackendMessage(res?.EM, JournalMessages.createError),
        });
        get().isSubmittingRef.current = false;
        return { success: false, journalId: null };
      }
    } catch (error) {
      console.error('Failed to create journal:', error);
      set({ isSubmitting: false, error: JournalMessages.createError });
      get().isSubmittingRef.current = false;
      return { success: false, journalId: null };
    }
  },

  updateJournal: async (id: string, data: Partial<CreateJournalDto>) => {
    if (get().isSubmittingRef.current) return false;
    get().isSubmittingRef.current = true;
    set({ isSubmitting: true, error: null });
    try {
      await journalService.update(id, data);
      const state = get();
      await state.fetchJournals(state.page, state.limit, state.search);
      eventBus.emit('journal:updated');
      set({ isSubmitting: false });
      get().isSubmittingRef.current = false;
      return true;
    } catch (error) {
      console.error('Failed to update journal:', error);
      set({ isSubmitting: false, error: JournalMessages.updateError });
      get().isSubmittingRef.current = false;
      return false;
    }
  },

  deleteJournal: async (journalId: string) => {
    try {
      const res = await journalService.delete(journalId);

      if (!res || res.EC !== 1) {
        set({
          error: normalizeBackendMessage(res?.EM, JournalMessages.deleteError),
        });
        return false;
      }

      const state = get();
      await state.fetchJournals(state.page, state.limit, state.search);
      set({ error: null });
      return true;
    } catch (error) {
      console.error('Failed to delete journal:', error);
      set({ error: JournalMessages.deleteError });
      return false;
    }
  },

  restoreJournal: async (id: string) => {
    try {
      const res = await journalService.restore(id);
      if (!res || res.EC !== 1) {
        set({ error: normalizeBackendMessage(res?.EM, 'Khôi phục thất bại.') });
        return false;
      }
      const state = get();
      await state.fetchJournals(state.page, state.limit, state.search);
      return true;
    } catch (error) {
      console.error('Failed to restore journal:', error);
      set({ error: 'Khôi phục thất bại.' });
      return false;
    }
  },

  reset: () => {
    get().isSubmittingRef.current = false;
    set({ ...initialState, isSubmittingRef: { current: false } });
  },
}));

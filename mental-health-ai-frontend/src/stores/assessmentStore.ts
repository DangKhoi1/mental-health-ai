import { create } from 'zustand';
import { AssessmentMessages } from '@/constants/messages';
import { assessmentService } from '@/services';
import { AssessmentTemplate, AssessmentSession, AssessmentQuestion } from '@/types';

interface AssessmentState {
  templates: AssessmentTemplate[];
  history: AssessmentSession[];
  session: AssessmentSession | null;
  questions: AssessmentQuestion[];
  isLoading: boolean;
  error: string | null;
  historyPage: number;
  historyLimit: number;
  historyTotal: number;
  historyTotalPages: number;
}

interface AssessmentActions {
  fetchTemplates: () => Promise<void>;
  startSession: (typeCode: string) => Promise<void>;
  fetchQuestions: (sessionId: string) => Promise<void>;
  fetchHistory: (page?: number, limit?: number) => Promise<void>;
  fetchAll: (historyPage?: number, historyLimit?: number) => Promise<void>;
  reset: () => void;
}

const initialState: AssessmentState = {
  templates: [],
  history: [],
  session: null,
  questions: [],
  isLoading: false,
  error: null,
  historyPage: 1,
  historyLimit: 10,
  historyTotal: 0,
  historyTotalPages: 1,
};

export const useAssessmentStore = create<AssessmentState & AssessmentActions>((set) => ({
  ...initialState,

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await assessmentService.getTemplates();
      const templates = response?.data?.templates;
      set({ templates: Array.isArray(templates) ? templates : [], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      set({ templates: [], isLoading: false, error: AssessmentMessages.fetchError });
    }
  },


  startSession: async (typeCode: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await assessmentService.startSession(typeCode);
      const session = response?.data?.session;
      set({ session: session, isLoading: false });
    } catch (error) {
      console.error('Failed to start session:', error);
      set({ session: null, isLoading: false, error: AssessmentMessages.startError });
    }
  },

  fetchQuestions: async (templateId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await assessmentService.getTemplateWithQuestions(templateId);
      const questions = response?.data?.template?.questions;
      set({ questions: Array.isArray(questions) ? questions : [], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      set({ questions: [], isLoading: false, error: AssessmentMessages.fetchError });
    }
  },

  fetchHistory: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await assessmentService.getHistory(page, limit);
      const history = response?.data?.history;
      set({
        history: Array.isArray(history) ? history : [],
        historyPage: response?.data?.page || page,
        historyLimit: response?.data?.limit || limit,
        historyTotal: response?.data?.total || 0,
        historyTotalPages: response?.data?.totalPages || 1,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch history:', error);
      set({ history: [], isLoading: false, error: AssessmentMessages.fetchError });
    }
  },

  fetchAll: async (historyPage = 1, historyLimit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const [templatesRes, historyRes] = await Promise.all([
        assessmentService.getTemplates().catch(() => ({ data: { templates: [] } })),
        assessmentService
          .getHistory(historyPage, historyLimit)
          .catch(() => ({ data: { history: [], page: historyPage, limit: historyLimit, total: 0, totalPages: 1 } })),
      ]);
      const templates = templatesRes?.data?.templates;
      const history = historyRes?.data?.history;
      set({
        templates: Array.isArray(templates) ? templates : [],
        history: Array.isArray(history) ? history : [],
        historyPage: historyRes?.data?.page || historyPage,
        historyLimit: historyRes?.data?.limit || historyLimit,
        historyTotal: historyRes?.data?.total || 0,
        historyTotalPages: historyRes?.data?.totalPages || 1,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
      set({ templates: [], history: [], isLoading: false, error: AssessmentMessages.fetchError });
    }
  },

  reset: () => set(initialState),
}));

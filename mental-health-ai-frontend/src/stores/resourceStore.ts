import { create } from 'zustand';
import { resourceService } from '@/services/resource.service';
import { ResourceItem, CreateResourcePayload } from '@/types/resource.types';

interface ResourceState {
  resources: ResourceItem[];
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  search: string;
  category: string;
  activeResourceId: string | null;
}

interface ResourceActions {
  fetchResources: (page?: number, limit?: number, search?: string, category?: string) => Promise<void>;
  fetchAllAdmin: (page?: number, limit?: number, search?: string, category?: string) => Promise<void>;
  createResource: (data: CreateResourcePayload) => Promise<boolean>;
  updateResource: (id: string, data: Partial<CreateResourcePayload>) => Promise<boolean>;
  removeResource: (id: string) => Promise<boolean>;
  setActiveResource: (id: string | null) => void;
  reset: () => void;
}

const initialState: ResourceState = {
  resources: [],
  isLoading: false,
  error: null,
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 1,
  search: '',
  category: 'all',
  activeResourceId: null,
};

export const useResourceStore = create<ResourceState & ResourceActions>()((set) => ({
  ...initialState,

  fetchResources: async (page = 1, limit = 12, search = '', category = 'all') => {
    set({ isLoading: true, error: null });
    try {
      const result = await resourceService.getAll(page, limit, search, category);
      set({
        resources: result.resources,
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        search,
        category,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch resources:', error);
      set({ isLoading: false, error: 'Không thể tải tài nguyên' });
    }
  },

  fetchAllAdmin: async (page = 1, limit = 12, search = '', category = 'all') => {
    set({ isLoading: true, error: null });
    try {
      const result = await resourceService.getAllAdmin(page, limit, search, category);
      set({
        resources: result.resources,
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        search,
        category,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch admin resources:', error);
      set({ isLoading: false, error: 'Không thể tải tài nguyên' });
    }
  },

  createResource: async (data) => {
    try {
      const newResource = await resourceService.create(data);
      if (newResource) {
        set((state) => ({ resources: [newResource, ...state.resources] }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create resource:', error);
      return false;
    }
  },

  updateResource: async (id, data) => {
    try {
      const updated = await resourceService.update(id, data);
      if (updated) {
        set((state) => ({
          resources: state.resources.map((r) =>
            r.resourceId === id ? { ...r, ...updated } : r
          ),
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update resource:', error);
      return false;
    }
  },

  removeResource: async (id) => {
    try {
      await resourceService.remove(id);
      set((state) => ({
        resources: state.resources.filter((r) => r.resourceId !== id),
      }));
      return true;
    } catch (error) {
      console.error('Failed to remove resource:', error);
      return false;
    }
  },

  setActiveResource: (id) => set({ activeResourceId: id }),

  reset: () => set(initialState),
}));

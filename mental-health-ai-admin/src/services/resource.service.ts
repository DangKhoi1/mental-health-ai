import { apiClient } from './client';

interface ResourcePayload {
  title: string;
  description: string;
  categoryCode: string;
  typeCode: string;
  contentUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
  isActive?: boolean;
}

export const resourceService = {
  async getResources(
    includeInactive = true,
    page = 1,
    limit = 12,
    search = '',
    category = '',
  ) {
    const res = await apiClient.get('/resources', {
      params: {
        all: includeInactive ? 'true' : 'false',
        page,
        limit,
        search: search || undefined,
        category: category || undefined,
      },
    });
    return res.data;
  },

  async createResource(data: ResourcePayload) {
    const res = await apiClient.post('/resources', data);
    return res.data;
  },

  async updateResource(id: string, data: Record<string, unknown>) {
    const res = await apiClient.patch(`/resources/${id}`, data);
    return res.data;
  },

  async deleteResource(id: string) {
    const res = await apiClient.delete(`/resources/${id}`);
    return res.data;
  },

  async uploadThumbnail(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('thumbnail', file);
    const res = await apiClient.post('/upload/resource-thumbnail', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.thumbnailUrl ?? '';
  },
};
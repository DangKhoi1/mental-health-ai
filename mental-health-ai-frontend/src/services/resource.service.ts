import privateAxios from '@/lib/privateAxios';
import { IBackendRes } from '@/types/backend.type';
import { ResourceItem, CreateResourcePayload, PaginatedResourcesResponse } from '@/types/resource.types';

export const resourceService = {
  // Authenticated user endpoints
  async getAll(
    page: number = 1,
    limit: number = 12,
    search?: string,
    category?: string,
  ): Promise<PaginatedResourcesResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search?.trim()) params.append('search', search.trim());
    if (category?.trim() && category !== 'all') params.append('category', category);

    const response = await privateAxios.get(`/resources?${params.toString()}`) as IBackendRes<PaginatedResourcesResponse>;
    return {
      resources: response.data?.resources || [],
      page: response.data?.page || page,
      limit: response.data?.limit || limit,
      total: response.data?.total || 0,
      totalPages: response.data?.totalPages || 1,
    };
  },

  async getById(id: string): Promise<ResourceItem> {
    const response = await privateAxios.get(`/resources/${id}`) as IBackendRes<{ resource: ResourceItem }>;
    return response.data?.resource as ResourceItem;
  },

  // Admin only
  async getAllAdmin(
    page: number = 1,
    limit: number = 12,
    search?: string,
    category?: string,
  ): Promise<PaginatedResourcesResponse> {
    const params = new URLSearchParams({
      all: 'true',
      page: String(page),
      limit: String(limit),
    });
    if (search?.trim()) params.append('search', search.trim());
    if (category?.trim() && category !== 'all') params.append('category', category);

    const response = await privateAxios.get(`/resources?${params.toString()}`) as IBackendRes<PaginatedResourcesResponse>;
    return {
      resources: response.data?.resources || [],
      page: response.data?.page || page,
      limit: response.data?.limit || limit,
      total: response.data?.total || 0,
      totalPages: response.data?.totalPages || 1,
    };
  },

  async create(data: CreateResourcePayload): Promise<ResourceItem> {
    const response = await privateAxios.post('/resources', data) as IBackendRes<{ resource: ResourceItem }>;
    return response.data?.resource as ResourceItem;
  },

  async update(id: string, data: Partial<CreateResourcePayload>): Promise<ResourceItem> {
    const response = await privateAxios.patch(`/resources/${id}`, data) as IBackendRes<{ resource: ResourceItem }>;
    return response.data?.resource as ResourceItem;
  },

  async remove(id: string): Promise<void> {
    await privateAxios.delete(`/resources/${id}`);
  },
};

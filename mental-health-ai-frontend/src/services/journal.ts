import privateAxios from '@/lib/privateAxios';
import { Journal, CreateJournalDto } from '@/types';
import { IBackendRes, IPaginatedRes } from '@/types/backend.type';

interface JournalImage {
  imageId: string;
  fileName: string;
  cloudinaryUrl: string;
  mimeType: string;
  fileSize: number;
  displayOrder: number;
  createdAt: string;
}

export const journalService = {
  async create(data: CreateJournalDto): Promise<IBackendRes<Journal>> {
    return privateAxios.post('/journals/create-journal', data);
  },

  async getAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<IBackendRes<{ journals: Journal[]; page: number; limit: number; total: number; totalPages: number }>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search?.trim()) {
      params.append('search', search.trim());
    }

    return privateAxios.get(`/journals/get-all-journals?${params.toString()}`);
  },

  async getById(journalId: string): Promise<IBackendRes<Journal>> {
    return privateAxios.get(`/journals/get-journal-by-id/${journalId}`);
  },

  async update(journalId: string, data: Partial<CreateJournalDto>): Promise<IBackendRes<Journal>> {
    return privateAxios.put(`/journals/update-journal/${journalId}`, data);
  },

  async restore(journalId: string): Promise<IBackendRes<void>> {
    return privateAxios.put(`/journals/restore-journal/${journalId}`);
  },

  async getTrashed(page: number = 1, limit: number = 10): Promise<IBackendRes<{ journals: Journal[]; page: number; total: number; totalPages: number }>> {
    return privateAxios.get('/journals/trashed', { params: { page, limit } });
  },

  async delete(journalId: string): Promise<IBackendRes<Journal>> {
    return privateAxios.delete(`/journals/delete-journal/${journalId}`);
  },

  async search(query: string): Promise<IBackendRes<Journal[]>> {
    return privateAxios.get(`/journals/search-journal?query=${encodeURIComponent(query)}`);
  },

  async uploadImage(journalId: string, file: File): Promise<IBackendRes<{ imageId: string; cloudinaryUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    return privateAxios.post(`/journals/${journalId}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async getImages(journalId: string): Promise<IBackendRes<{ images: JournalImage[] }>> {
    return privateAxios.get(`/journals/${journalId}/images`);
  },

  async deleteImage(imageId: string): Promise<IBackendRes<void>> {
    return privateAxios.delete(`/journals/delete-image/${imageId}`);
  },
};

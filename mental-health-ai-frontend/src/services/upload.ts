import privateAxios from '@/lib/privateAxios';

export const uploadService = {
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await privateAxios.post<{ avatarUrl: string }>(
      '/upload/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const data = (response as { data?: { avatarUrl?: string } })?.data;
    
    if (data && typeof data === 'object' && 'avatarUrl' in data && typeof data.avatarUrl === 'string') {
      return { avatarUrl: data.avatarUrl };
    }

    throw new Error('Không thể tải ảnh đại diện lên: dữ liệu trả về không hợp lệ');
  },
};

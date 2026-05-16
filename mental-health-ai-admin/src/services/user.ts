import { apiClient } from './client';

interface AdminCreateUserPayload {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  genderCode: string;
  roleId: number;
  dateOfBirth?: string;
  avatarUrl?: string;
}

interface AdminUserUpdatePayload {
  email?: string;
  isActive?: boolean;
  fullName?: string;
  dateOfBirth?: string;
  genderCode?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  roleId?: number;
}

export const userService = {
  async getUsers(page = 1, limit = 8, search = '') {
    const res = await apiClient.get('/users', {
      params: { page, limit, search: search || undefined },
    });
    return res.data;
  },

  async getUserById(id: string) {
    const res = await apiClient.get(`/users/${id}`);
    return res.data;
  },

  async createUser(data: AdminCreateUserPayload) {
    const registerPayload = {
      username: data.username,
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      genderCode: data.genderCode,
      avatarUrl: data.avatarUrl,
      dateOfBirth: data.dateOfBirth,
    };

    const registerRes: any = await apiClient.post('/auth/register', registerPayload);
    
    if (registerRes?.data?.EC === 0) {
      throw new Error(registerRes.data.EM || 'Lỗi khi tạo người dùng');
    }

    const createdUser = registerRes?.data?.user || registerRes?.data || registerRes?.user;

    const createdUserId = createdUser?.userId || createdUser?.id;
    if (createdUserId && data.roleId) {
      await userService.updateUser(String(createdUserId), { roleId: data.roleId });
    }

    return registerRes.data;
  },

  async deactivateUser(id: string) {
    const res = await apiClient.delete(`/users/${id}`);
    return res.data;
  },

  async updateUser(id: string, data: AdminUserUpdatePayload) {
    const res = await apiClient.patch(`/users/profile/${id}`, data);
    return res.data;
  },
};
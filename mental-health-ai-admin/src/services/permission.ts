import { apiClient } from './client';

interface PermissionPayload {
  permissionName: string;
  apiPath: string;
  method: string;
  module: string;
}

export const permissionService = {
  async getPermissions() {
    const res = await apiClient.get('/permissions/all-permissions');
    return res.data;
  },

  async createPermission(data: PermissionPayload) {
    const res = await apiClient.post('/permissions/create-permission', data);
    return res.data;
  },

  async updatePermission(id: number, data: Partial<PermissionPayload>) {
    const res = await apiClient.patch(`/permissions/update-permission/${id}`, data);
    return res.data;
  },

  async deletePermission(id: number) {
    const res = await apiClient.delete(`/permissions/delete-permission/${id}`);
    return res.data;
  },
};
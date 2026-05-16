import { apiClient } from './client';

interface RolePermissionPayload {
  roleId: number;
  permissionId: number;
}

export const rolePermissionService = {
  async getRolePermissions() {
    const res = await apiClient.get('/role-permissions/all-role-permissions');
    return res.data;
  },

  async getPermissionsByRole(roleId: number) {
    const res = await apiClient.get(`/role-permissions/by-role/${roleId}`);
    return res.data;
  },

  async createRolePermission(data: RolePermissionPayload) {
    const res = await apiClient.post('/role-permissions/create-role-permission', data);
    return res.data;
  },

  async deleteRolePermission(data: RolePermissionPayload) {
    const res = await apiClient.delete('/role-permissions/delete-role-permission', { data });
    return res.data;
  },
};
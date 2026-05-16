import { apiClient } from './client';

interface RolePayload {
  roleName: string;
  description?: string;
  isActive?: boolean;
}

export const roleService = {
  async getRoles() {
    const res = await apiClient.get('/roles/all-roles');
    return res.data;
  },

  async getRoleById(id: number) {
    const res = await apiClient.get(`/roles/role-by-id/${id}`);
    return res.data;
  },

  async createRole(data: RolePayload) {
    const res = await apiClient.post('/roles/create-role', data);
    return res.data;
  },

  async updateRole(id: number, data: Partial<RolePayload>) {
    const res = await apiClient.patch(`/roles/update-role/${id}`, data);
    return res.data;
  },

  async deleteRole(id: number) {
    const res = await apiClient.delete(`/roles/delete-role/${id}`);
    return res.data;
  },
};
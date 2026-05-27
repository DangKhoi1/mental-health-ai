'use client';

import React, { useEffect, useState } from 'react';
import { Edit2, Plus, Settings, Trash2 } from 'lucide-react';
import { Badge, Button, EllipsisText, ListEmptyState, ListSkeleton, ListToolbar, PaginationControls } from '@/components/ui';
import { roleService } from '@/services';
import { CreateRoleModal } from './modals/CreateRoleModal';
import { DeleteRoleModal } from './modals/DeleteRoleModal';
import { EditRoleModal } from './modals/EditRoleModal';
import { ManagePermissionsModal } from './modals/ManagePermissionsModal';

interface IRole {
  roleId: number;
  roleName: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

const PAGE_SIZE = 10;

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function RolesTable() {
  const [roles, setRoles] = useState<IRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteRole, setDeleteRole] = useState<IRole | null>(null);
  const [editRole, setEditRole] = useState<IRole | null>(null);
  const [manageRole, setManageRole] = useState<IRole | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await roleService.getRoles();
      if (res?.EC === 1) setRoles(res.roles || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const filtered = roles.filter((r) =>
    r.roleName.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActiveFilters = search.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <ListToolbar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchLabel="Tìm kiếm vai trò"
        searchPlaceholder="Tìm theo tên vai trò hoặc mô tả..."
        filterSlot={null}
        actionSlot={(
          <Button variant="primary" onClick={() => setCreateOpen(true)} className="w-full sm:w-auto whitespace-nowrap">
            <Plus className="size-4 mr-1.5" />
            Thêm vai trò
          </Button>
        )}
        resultsLabel={`${filtered.length} vai trò`}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() => {
          setSearch('');
          setPage(1);
        }}
      />

      {/* Table */}
      <div className="border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="sticky top-0 z-10 bg-muted/90 px-4 py-3 text-left font-medium text-muted-foreground w-12">ID</th>
                <th className="sticky top-0 z-10 bg-muted/90 px-4 py-3 text-left font-medium text-muted-foreground">Tên vai trò</th>
                <th className="sticky top-0 z-10 bg-muted/90 px-4 py-3 text-left font-medium text-muted-foreground">Mô tả</th>
                <th className="sticky top-0 z-10 bg-muted/90 px-4 py-3 text-center font-medium text-muted-foreground w-36">Trạng thái</th>
                <th className="sticky top-0 z-10 bg-muted/90 px-4 py-3 text-left font-medium text-muted-foreground w-32">Ngày tạo</th>
                <th className="sticky top-0 z-10 bg-muted/90 px-4 py-3 text-center font-medium text-muted-foreground w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8">
                    <ListSkeleton rows={6} cols={6} />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <ListEmptyState
                      title="Không tìm thấy vai trò phù hợp"
                      description="Thử tìm với từ khóa khác hoặc xóa bộ lọc hiện tại."
                      actionLabel={hasActiveFilters ? 'Đặt lại bộ lọc' : undefined}
                      onAction={hasActiveFilters ? () => {
                        setSearch('');
                        setPage(1);
                      } : undefined}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((role) => (
                  <tr key={role.roleId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{role.roleId}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{role.roleName}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-60">
                      <EllipsisText text={role.description || '—'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <Badge variant={role.isActive ? 'success' : 'danger'}>
                          {role.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(role.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setEditRole(role)}
                          title="Chỉnh sửa vai trò"
                          className="size-10 flex items-center justify-center rounded-lg text-sky-600 hover:bg-sky-50 transition-colors"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          onClick={() => setManageRole(role)}
                          title="Quản lý quyền"
                          className="size-10 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Settings className="size-4" />
                        </button>
                        <button
                          onClick={() => setDeleteRole(role)}
                          title="Xóa"
                          className="size-10 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && (
          <div className="border-t border-border px-4 py-3">
            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              summary={`${filtered.length} vai trò • Trang ${page}/${totalPages}`}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateRoleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchRoles}
      />
      <DeleteRoleModal
        open={!!deleteRole}
        role={deleteRole}
        onClose={() => setDeleteRole(null)}
        onSuccess={fetchRoles}
      />
      <EditRoleModal
        open={!!editRole}
        role={editRole}
        onClose={() => setEditRole(null)}
        onSuccess={fetchRoles}
      />
      <ManagePermissionsModal
        open={!!manageRole}
        role={manageRole}
        onClose={() => setManageRole(null)}
        onSuccess={fetchRoles}
      />
    </div>
  );
}

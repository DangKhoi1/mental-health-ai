'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Edit2, MoreVertical, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import {
  Button,
  EllipsisText,
  ListEmptyState,
  ListSkeleton,
  ListToolbar,
  PaginationControls,
  Select,
} from '@/components/ui';
import { permissionService } from '@/services';
import { CreatePermissionModal } from './modals/CreatePermissionModal';
import { DeletePermissionModal } from './modals/DeletePermissionModal';
import { EditPermissionModal } from './modals/EditPermissionModal';

interface IPermission {
  permissionId: number;
  permissionName: string;
  apiPath: string;
  method: string;
  module: string;
  createdAt: string;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-sky-100 text-sky-700 border-sky-200',
  POST: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PATCH: 'bg-amber-100 text-amber-700 border-amber-200',
  PUT: 'bg-violet-100 text-violet-700 border-violet-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
};

const PAGE_SIZE = 10;

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function PermissionsTable() {
  const [permissions, setPermissions] = useState<IPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const actionMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const [createOpen, setCreateOpen] = useState(false);
  const [deletePermission, setDeletePermission] = useState<IPermission | null>(null);
  const [editPermission, setEditPermission] = useState<IPermission | null>(null);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await permissionService.getPermissions();
      if (res?.EC === 1) setPermissions(res.permissions || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPermissions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!openActionMenuId) return;
      const menuEl = actionMenuRefs.current[openActionMenuId];
      if (menuEl && !menuEl.contains(event.target as Node)) {
        setOpenActionMenuId(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenActionMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openActionMenuId]);

  const uniqueModules = Array.from(new Set(permissions.map((p) => p.module))).sort();

  const filtered = permissions.filter((p) => {
    const matchSearch =
      p.permissionName.toLowerCase().includes(search.toLowerCase()) ||
      p.apiPath.toLowerCase().includes(search.toLowerCase());
    const matchModule = !moduleFilter || p.module === moduleFilter;
    return matchSearch && matchModule;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActiveFilters = search.trim().length > 0 || moduleFilter !== '';

  const resetFilters = () => {
    setSearch('');
    setModuleFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <ListToolbar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchLabel="Tìm kiếm quyền hạn"
        searchPlaceholder="Tìm theo tên quyền, API path..."
        filterSlot={(
          <Select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(1);
            }}
            className="h-10.5 pr-10"
            options={[
              { value: '', label: 'Tất cả module' },
              ...uniqueModules.map((m) => ({ value: m, label: m })),
            ]}
          />
        )}
        actionSlot={(
          <Button variant="primary" onClick={() => setCreateOpen(true)} className="w-full whitespace-nowrap sm:w-auto">
            <Plus className="mr-1.5 size-4" />
            Thêm quyền hạn
          </Button>
        )}
        resultsLabel={`${filtered.length} quyền hạn`}
        activeTags={moduleFilter ? [`Module: ${moduleFilter}`] : []}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={resetFilters}
      />

      <div className="relative z-0 overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="sticky top-0 z-10 w-12 bg-muted/90 px-4 py-3 text-left font-medium text-muted-foreground backdrop-blur-sm">
                  ID
                </th>
                <th className="sticky top-0 z-10 bg-muted/90 px-4 py-3 text-left font-medium text-muted-foreground backdrop-blur-sm">
                  Tên quyền hạn
                </th>
                <th className="sticky top-0 z-10 bg-muted/90 px-4 py-3 text-left font-medium text-muted-foreground backdrop-blur-sm">
                  API Path
                </th>
                <th className="sticky top-0 z-10 w-20 bg-muted/90 px-4 py-3 text-center font-medium text-muted-foreground backdrop-blur-sm">
                  Method
                </th>
                <th className="sticky top-0 z-10 w-28 bg-muted/90 px-4 py-3 text-left font-medium text-muted-foreground backdrop-blur-sm">
                  Module
                </th>
                <th className="sticky top-0 z-10 w-32 bg-muted/90 px-4 py-3 text-left font-medium text-muted-foreground backdrop-blur-sm">
                  Ngày tạo
                </th>
                <th className="sticky top-0 z-10 w-24 bg-muted/90 px-4 py-3 text-center font-medium text-muted-foreground backdrop-blur-sm">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <ListSkeleton rows={6} cols={7} />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <ListEmptyState
                      title="Không tìm thấy quyền hạn phù hợp"
                      description="Thử đổi từ khóa tìm kiếm hoặc bộ lọc module để hiển thị kết quả."
                      actionLabel={hasActiveFilters ? 'Đặt lại bộ lọc' : undefined}
                      onAction={hasActiveFilters ? resetFilters : undefined}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((perm, index) => {
                  const openUpward = index >= paginated.length - 2;

                  return (
                    <tr key={perm.permissionId} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{perm.permissionId}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{perm.permissionName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-55">
                        <EllipsisText text={perm.apiPath} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={clsx(
                            'inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-semibold',
                            METHOD_COLORS[perm.method] || 'border-border bg-muted text-muted-foreground',
                          )}
                        >
                          {perm.method}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                          {perm.module}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(perm.createdAt)}</td>
                      <td className="px-4 py-3 text-center">
                        <div
                          className="relative inline-flex"
                          ref={(el) => {
                            actionMenuRefs.current[perm.permissionId] = el;
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId((current) =>
                                current === perm.permissionId ? null : perm.permissionId,
                              );
                            }}
                            title="Thao tác"
                            className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <MoreVertical className="size-4" />
                          </button>

                          {openActionMenuId === perm.permissionId && (
                            <div className={`absolute right-0 z-20 min-w-40 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg ${openUpward ? 'bottom-12' : 'top-12'}`}>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditPermission(perm);
                                  setOpenActionMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm text-sky-600 transition-colors hover:bg-sky-50"
                              >
                                <Edit2 className="size-4" />
                                Chỉnh sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeletePermission(perm);
                                  setOpenActionMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                              >
                                <Trash2 className="size-4" />
                                Xóa
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="border-t border-border px-4 py-3">
            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              summary={`${filtered.length} quyền hạn • Trang ${page}/${totalPages}`}
            />
          </div>
        )}
      </div>

      <CreatePermissionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchPermissions}
        existingModules={uniqueModules}
      />
      <DeletePermissionModal
        open={!!deletePermission}
        permission={deletePermission}
        onClose={() => setDeletePermission(null)}
        onSuccess={fetchPermissions}
      />
      <EditPermissionModal
        open={!!editPermission}
        permission={editPermission}
        onClose={() => setEditPermission(null)}
        onSuccess={fetchPermissions}
        existingModules={uniqueModules}
      />
    </div>
  );
}

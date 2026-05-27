'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui';
import { PermissionSelector, PermissionModule } from '@/components/roles/PermissionSelector';
import { permissionService, rolePermissionService, roleService } from '@/services';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateRoleModal({ open, onClose, onSuccess }: Props) {
  const [state, setState] = React.useReducer(
    (prev: any, next: any) => ({ ...prev, ...next }),
    {
      roleName: '',
      description: '',
      isActive: true,
      selectedPermissions: [] as number[],
      listPermissions: [] as PermissionModule[],
      loading: false,
    }
  );

  const { roleName, description, isActive, selectedPermissions, listPermissions, loading } = state;

  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      const res = await permissionService.getPermissions();
      if (res?.EC === 1 && res.permissions) {
        const grouped = res.permissions.reduce((acc: Record<string, import('@/components/roles/PermissionSelector').IPermission[]>, curr: import('@/components/roles/PermissionSelector').IPermission) => {
          if (!acc[curr.module]) acc[curr.module] = [];
          acc[curr.module].push(curr);
          return acc;
        }, {});
        
        setState({
          listPermissions: Object.entries(grouped).map(([module, permissions]) => ({ module, permissions: permissions as import('@/components/roles/PermissionSelector').IPermission[] }))
        });
      }
    };
    fetch();
  }, [open]);

  const handleClose = () => {
    setState({ roleName: '', description: '', isActive: true, selectedPermissions: [] });
    onClose();
  };

  const handleSubmit = async () => {
    if (!roleName.trim()) { toast.warning('Vui lòng nhập tên vai trò.'); return; }
    if (!description.trim()) { toast.warning('Vui lòng nhập mô tả.'); return; }
    setState({ loading: true });
    try {
      const res = await roleService.createRole({ roleName: roleName.trim(), description: description.trim(), isActive });
      if (res?.EC === 1) {
        const roleId = res.role?.roleId;
        if (roleId && selectedPermissions.length > 0) {
          await Promise.all(
            selectedPermissions.map((permissionId) =>
              rolePermissionService.createRolePermission({ roleId, permissionId })
            )
          );
        }
        toast.success('Tạo vai trò thành công!');
        onSuccess();
        handleClose();
      } else {
        toast.error(res?.EM || 'Không thể tạo vai trò.');
      }
    } catch {
      toast.error('Đã có lỗi xảy ra.');
    } finally {
      setState({ loading: false });
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Thêm vai trò mới" maxWidth="max-w-4xl">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label htmlFor="create-roleName" className="text-sm font-medium text-foreground">
              Tên vai trò <span className="text-red-500">*</span>
            </label>
            <input
              id="create-roleName"
              type="text"
              value={roleName}
              onChange={(e) => setState({ roleName: e.target.value })}
              placeholder="Ví dụ: Moderator, Editor..."
              className="w-full px-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="create-isActive" className="text-sm font-medium text-foreground">Trạng thái</label>
            <div className="flex items-center gap-3 h-10.5">
              <button
                id="create-isActive"
                type="button"
                onClick={() => setState({ isActive: !isActive })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isActive ? 'bg-primary' : 'bg-border'}`}
              >
                <span className={`inline-block size-3.5 transform rounded-full bg-white shadow transition-transform ${isActive ?'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-foreground">{isActive ? 'Hoạt động' : 'Không hoạt động'}</span>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="create-description" className="text-sm font-medium text-foreground">
            Mô tả <span className="text-red-500">*</span>
          </label>
          <textarea
            id="create-description"
            value={description}
            onChange={(e) => setState({ description: e.target.value })}
            placeholder="Mô tả chi tiết về vai trò này..."
            rows={3}
            className="w-full px-4 py-3 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground resize-none"
          />
        </div>
        {listPermissions.length > 0 && (
          <PermissionSelector
            listPermissions={listPermissions}
            value={selectedPermissions}
            onChange={(val) => setState({ selectedPermissions: val })}
          />
        )}
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>Hủy</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Lưu vai trò
          </Button>
        </div>
      </div>
    </Modal>
  );
}

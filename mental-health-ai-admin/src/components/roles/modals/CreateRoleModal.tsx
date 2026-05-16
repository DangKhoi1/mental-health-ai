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
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [listPermissions, setListPermissions] = useState<PermissionModule[]>([]);
  const [loading, setLoading] = useState(false);

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
        
        setListPermissions(
          Object.entries(grouped).map(([module, permissions]) => ({ module, permissions: permissions as import('@/components/roles/PermissionSelector').IPermission[] }))
        );
      }
    };
    fetch();
  }, [open]);

  const handleClose = () => {
    setRoleName(''); setDescription(''); setIsActive(true); setSelectedPermissions([]);
    onClose();
  };

  const handleSubmit = async () => {
    if (!roleName.trim()) { toast.warning('Vui lòng nhập tên vai trò.'); return; }
    if (!description.trim()) { toast.warning('Vui lòng nhập mô tả.'); return; }
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Thêm vai trò mới" maxWidth="max-w-4xl">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Tên vai trò <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Ví dụ: Moderator, Editor..."
              className="w-full px-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Trạng thái</label>
            <div className="flex items-center gap-3 h-10.5">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isActive ? 'bg-primary' : 'bg-border'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-foreground">{isActive ? 'Hoạt động' : 'Không hoạt động'}</span>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Mô tả <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả chi tiết về vai trò này..."
            rows={3}
            className="w-full px-4 py-3 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground resize-none"
          />
        </div>
        {listPermissions.length > 0 && (
          <PermissionSelector
            listPermissions={listPermissions}
            value={selectedPermissions}
            onChange={setSelectedPermissions}
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

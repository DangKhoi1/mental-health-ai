'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui';
import { PermissionSelector, PermissionModule } from '@/components/roles/PermissionSelector';
import { permissionService, rolePermissionService } from '@/services';

interface IRole {
  roleId: number;
  roleName: string;
  description?: string;
}

interface Props {
  open: boolean;
  role: IRole | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManagePermissionsModal({ open, role, onClose, onSuccess }: Props) {
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<number[]>([]);
  const [listPermissions, setListPermissions] = useState<PermissionModule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !role) return;
    const fetch = async () => {
      try {
        const [permRes, rpRes] = await Promise.all([
          permissionService.getPermissions(),
          rolePermissionService.getPermissionsByRole(role.roleId),
        ]);

        if (permRes?.EC === 1 && permRes.permissions) {
          const grouped = permRes.permissions.reduce((acc: Record<string, import('@/components/roles/PermissionSelector').IPermission[]>, curr: import('@/components/roles/PermissionSelector').IPermission) => {
            if (!acc[curr.module]) acc[curr.module] = [];
            acc[curr.module].push(curr);
            return acc;
          }, {});

          setListPermissions(
            Object.entries(grouped).map(([module, permissions]) => ({ module, permissions: permissions as import('@/components/roles/PermissionSelector').IPermission[] }))
          );
        }

        if (rpRes?.EC === 1 && rpRes.rolePermissions) {
          const ids = rpRes.rolePermissions.map((rp: { permissionId: number }) => rp.permissionId);
          setSelectedPermissions(ids);
          setOriginalPermissions(ids);
        }
      } catch {
        toast.error('Không thể tải dữ liệu quyền hạn.');
      }
    };
    fetch();
  }, [open, role]);

  const handleClose = () => {
    setSelectedPermissions([]);
    setOriginalPermissions([]);
    onClose();
  };

  const handleSave = async () => {
    if (!role) return;
    setLoading(true);
    try {
      const toAdd = selectedPermissions.filter((id) => !originalPermissions.includes(id));
      const toRemove = originalPermissions.filter((id) => !selectedPermissions.includes(id));

      if (toAdd.length === 0 && toRemove.length === 0) {
        toast.info('Không có thay đổi để cập nhật.');
        handleClose();
        return;
      }

      const operations = [
        ...toAdd.map((permissionId) => ({
          permissionId,
          request: () => rolePermissionService.createRolePermission({ roleId: role.roleId, permissionId }),
        })),
        ...toRemove.map((permissionId) => ({
          permissionId,
          request: () => rolePermissionService.deleteRolePermission({ roleId: role.roleId, permissionId }),
        })),
      ];

      const results = await Promise.allSettled(operations.map((operation) => operation.request()));
      const failedMessages: string[] = [];

      results.forEach((result, index) => {
        const operation = operations[index];

        if (result.status === 'rejected') {
          failedMessages.push(`Quyền #${operation.permissionId} cập nhật thất bại.`);
          return;
        }

        if (result.value?.EC !== 1) {
          failedMessages.push(result.value?.EM || `Quyền #${operation.permissionId} cập nhật thất bại.`);
        }
      });

      if (failedMessages.length > 0) {
        const firstError = failedMessages[0];
        toast.error(`Cập nhật quyền thất bại (${failedMessages.length}/${operations.length}). ${firstError}`);
        return;
      }

      toast.success('Cập nhật quyền hạn thành công!');
      onSuccess();
      handleClose();
    } catch {
      toast.error('Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Quản lý quyền: ${role?.roleName || ''}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {listPermissions.length > 0 ? (
          <PermissionSelector
            listPermissions={listPermissions}
            value={selectedPermissions}
            onChange={setSelectedPermissions}
          />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Không có quyền hạn nào.</p>
        )}
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>Hủy</Button>
          <Button variant="primary" onClick={handleSave} loading={loading}>
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </Modal>
  );
}

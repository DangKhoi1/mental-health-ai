'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui';
import { roleService } from '@/services';

interface IRole {
  roleId: number;
  roleName: string;
}

interface Props {
  open: boolean;
  role: IRole | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteRoleModal({ open, role, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!role) return;
    setLoading(true);
    try {
      const res = await roleService.deleteRole(role.roleId);
      if (res?.EC === 1) {
        toast.success(`Đã xóa vai trò "${role.roleName}".`);
        onSuccess();
        onClose();
      } else {
        toast.error(res?.EM || 'Không thể xóa vai trò.');
      }
    } catch {
      toast.error('Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Xác nhận xóa vai trò" maxWidth="max-w-md">
      <div className="space-y-5">
        <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="size-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Bạn có chắc muốn xóa vai trò <strong>&quot;{role?.roleName}&quot;</strong>?
            </p>
            <p className="text-xs text-red-600 mt-1">
              Hành động này không thể hoàn tác. Tất cả quyền hạn được gán cho vai trò này cũng sẽ bị xóa.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Hủy</Button>
          <Button
            onClick={handleDelete}
            loading={loading}
            className="bg-red-600 hover:bg-red-700 text-white h-10 px-5 rounded-xl text-sm font-medium"
          >
            Xóa vai trò
          </Button>
        </div>
      </div>
    </Modal>
  );
}

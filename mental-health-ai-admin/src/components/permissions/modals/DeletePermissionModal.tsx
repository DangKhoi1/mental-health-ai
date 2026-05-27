'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui';
import { permissionService } from '@/services';

interface IPermission {
  permissionId: number;
  permissionName: string;
}

interface Props {
  open: boolean;
  permission: IPermission | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeletePermissionModal({ open, permission, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!permission) return;
    setLoading(true);
    try {
      const res = await permissionService.deletePermission(permission.permissionId);
      if (res?.EC === 1) {
        toast.success(`Đã xóa quyền hạn "${permission.permissionName}".`);
        onSuccess();
        onClose();
      } else {
        toast.error(res?.EM || 'Không thể xóa quyền hạn.');
      }
    } catch {
      toast.error('Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Xác nhận xóa quyền hạn" maxWidth="max-w-md">
      <div className="space-y-5">
        <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="size-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Bạn có chắc muốn xóa quyền hạn <strong>&quot;{permission?.permissionName}&quot;</strong>?
            </p>
            <p className="text-xs text-red-600 mt-1">
              Hành động này không thể hoàn tác. Tất cả vai trò được gán quyền này cũng sẽ bị ảnh hưởng.
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
            Xóa quyền hạn
          </Button>
        </div>
      </div>
    </Modal>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { roleService } from '@/services';

interface IRole {
  roleId: number;
  roleName: string;
  description?: string;
  isActive: boolean;
}

interface Props {
  open: boolean;
  role: IRole | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditRoleModal({ open, role, onClose, onSuccess }: Props) {
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!role || !open) return;
    setRoleName(role.roleName);
    setDescription(role.description || '');
    setIsActive(role.isActive);
  }, [open, role]);

  const handleSubmit = async () => {
    if (!role) return;
    if (!roleName.trim()) {
      toast.warning('Vui lòng nhập tên vai trò.');
      return;
    }

    setLoading(true);
    try {
      const res = await roleService.updateRole(role.roleId, {
        roleName: roleName.trim(),
        description: description.trim(),
        isActive,
      });
      if (res?.EC === 1) {
        toast.success('Cập nhật vai trò thành công!');
        onSuccess();
        onClose();
      } else {
        toast.error(res?.EM || 'Không thể cập nhật vai trò.');
      }
    } catch {
      toast.error('Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa vai trò" maxWidth="max-w-lg">
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="edit-roleName" className="text-sm font-medium text-foreground">Tên vai trò</label>
          <input
            id="edit-roleName"
            type="text"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="edit-description" className="text-sm font-medium text-foreground">Mô tả</label>
          <textarea
            id="edit-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Trạng thái vai trò</p>
            <p className="text-xs text-muted-foreground">Bật để vai trò tiếp tục được sử dụng trong hệ thống.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-border'}`}
          >
            <span className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${isActive ?'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <div className="flex justify-end gap-3 border-t border-border pt-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Hủy</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>Lưu thay đổi</Button>
        </div>
      </div>
    </Modal>
  );
}
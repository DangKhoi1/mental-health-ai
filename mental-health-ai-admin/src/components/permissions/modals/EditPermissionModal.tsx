'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { permissionService } from '@/services';

const HTTP_METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-sky-100 text-sky-700',
  POST: 'bg-emerald-100 text-emerald-700',
  PATCH: 'bg-amber-100 text-amber-700',
  PUT: 'bg-violet-100 text-violet-700',
  DELETE: 'bg-red-100 text-red-700',
};

interface IPermission {
  permissionId: number;
  permissionName: string;
  apiPath: string;
  method: string;
  module: string;
}

interface Props {
  open: boolean;
  permission: IPermission | null;
  onClose: () => void;
  onSuccess: () => void;
  existingModules?: string[];
}

export function EditPermissionModal({
  open,
  permission,
  onClose,
  onSuccess,
  existingModules = [],
}: Props) {
  const [permissionName, setPermissionName] = useState('');
  const [apiPath, setApiPath] = useState('');
  const [method, setMethod] = useState('GET');
  const [module, setModule] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission || !open) return;
    setPermissionName(permission.permissionName);
    setApiPath(permission.apiPath);
    setMethod(permission.method);
    setModule(permission.module);
  }, [open, permission]);

  const handleSubmit = async () => {
    if (!permission) return;
    if (!permissionName.trim() || !apiPath.trim() || !module.trim()) {
      toast.warning('Vui lòng nhập đầy đủ thông tin quyền hạn.');
      return;
    }

    setLoading(true);
    try {
      const res = await permissionService.updatePermission(permission.permissionId, {
        permissionName: permissionName.trim(),
        apiPath: apiPath.trim(),
        method,
        module: module.trim().toUpperCase(),
      });

      if (res?.EC === 1) {
        toast.success('Cập nhật quyền hạn thành công!');
        onSuccess();
        onClose();
      } else {
        toast.error(res?.EM || 'Không thể cập nhật quyền hạn.');
      }
    } catch {
      toast.error('Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa quyền hạn" maxWidth="max-w-lg">
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Tên quyền hạn</label>
          <input
            type="text"
            value={permissionName}
            onChange={(e) => setPermissionName(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">API Path</label>
          <input
            type="text"
            value={apiPath}
            onChange={(e) => setApiPath(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Module</label>
            <input
              type="text"
              value={module}
              list="edit-modules-list"
              onChange={(e) => setModule(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm uppercase text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            {existingModules.length > 0 && (
              <datalist id="edit-modules-list">
                {existingModules.map((item) => <option key={item} value={item} />)}
              </datalist>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">HTTP Method</label>
            <div className="flex flex-wrap gap-1.5">
              {HTTP_METHODS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMethod(item)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                    method === item
                      ? `${METHOD_COLORS[item]} border-current`
                      : 'border-border bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-border pt-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Hủy</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>Lưu thay đổi</Button>
        </div>
      </div>
    </Modal>
  );
}
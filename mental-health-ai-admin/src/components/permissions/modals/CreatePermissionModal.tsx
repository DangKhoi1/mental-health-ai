'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui';
import { permissionService } from '@/services';

const HTTP_METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-sky-100 text-sky-700',
  POST: 'bg-emerald-100 text-emerald-700',
  PATCH: 'bg-amber-100 text-amber-700',
  PUT: 'bg-violet-100 text-violet-700',
  DELETE: 'bg-red-100 text-red-700',
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingModules?: string[];
}

export function CreatePermissionModal({ open, onClose, onSuccess, existingModules = [] }: Props) {
  const [permissionName, setPermissionName] = useState('');
  const [apiPath, setApiPath] = useState('');
  const [method, setMethod] = useState('GET');
  const [module, setModule] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setPermissionName(''); setApiPath(''); setMethod('GET'); setModule('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!permissionName.trim()) { toast.warning('Vui lòng nhập tên quyền hạn.'); return; }
    if (!apiPath.trim()) { toast.warning('Vui lòng nhập API Path.'); return; }
    if (!module.trim()) { toast.warning('Vui lòng nhập Module.'); return; }

    setLoading(true);
    try {
      const res = await permissionService.createPermission({
        permissionName: permissionName.trim(),
        apiPath: apiPath.trim(),
        method,
        module: module.trim().toUpperCase(),
      });
      if (res?.EC === 1) {
        toast.success('Tạo quyền hạn thành công!');
        onSuccess();
        handleClose();
      } else {
        toast.error(res?.EM || 'Không thể tạo quyền hạn.');
      }
    } catch {
      toast.error('Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Thêm quyền hạn mới" maxWidth="max-w-lg">
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Tên quyền hạn <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={permissionName}
            onChange={(e) => setPermissionName(e.target.value)}
            placeholder="Ví dụ: Lấy danh sách người dùng..."
            className="w-full px-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            API Path <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={apiPath}
            onChange={(e) => setApiPath(e.target.value)}
            placeholder="Ví dụ: /api/users, /api/roles/:id..."
            className="w-full px-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Module <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={module}
              onChange={(e) => setModule(e.target.value)}
              placeholder="Ví dụ: USER, ROLE..."
              list="modules-list"
              className="w-full px-4 py-2.5 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground uppercase"
            />
            {existingModules.length > 0 && (
              <datalist id="modules-list">
                {existingModules.map((m) => <option key={m} value={m} />)}
              </datalist>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">HTTP Method</label>
            <div className="flex flex-wrap gap-1.5">
              {HTTP_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                    method === m
                      ? `${METHOD_COLORS[m]} border-current`
                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>Hủy</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Lưu quyền hạn
          </Button>
        </div>
      </div>
    </Modal>
  );
}

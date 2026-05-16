'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export interface IPermission {
  permissionId: number;
  permissionName: string;
  apiPath: string;
  method: string;
  module: string;
}

export interface PermissionModule {
  module: string;
  permissions: IPermission[];
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-sky-500',
  POST: 'bg-emerald-500',
  PATCH: 'bg-amber-500',
  PUT: 'bg-violet-500',
  DELETE: 'bg-red-500',
};

interface Props {
  listPermissions: PermissionModule[];
  value: number[];
  onChange: (selected: number[]) => void;
}

export function PermissionSelector({ listPermissions, value, onChange }: Props) {
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const selected = value || [];

  const toggleModule = (module: string) => {
    setOpenModules((prev) => ({ ...prev, [module]: !prev[module] }));
  };

  const togglePermission = (id: number) => {
    const updated = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    onChange(updated);
  };

  const toggleAllInModule = (permissions: IPermission[], enable: boolean) => {
    const ids = permissions.map((p) => p.permissionId);
    const updated = enable
      ? Array.from(new Set([...selected, ...ids]))
      : selected.filter((x) => !ids.includes(x));
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">Quyền hạn</p>
      <div className="space-y-2 max-h-105 overflow-y-auto pr-1">
        {listPermissions.map((mod) => {
          const allIds = mod.permissions.map((p) => p.permissionId);
          const isAllChecked = allIds.length > 0 && allIds.every((id) => selected.includes(id));
          const isSomeChecked = allIds.some((id) => selected.includes(id));
          const isOpen = openModules[mod.module] ?? false;

          return (
            <div key={mod.module} className="border border-border rounded-xl overflow-hidden">
              {/* Module header */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
                <button
                  type="button"
                  className="flex items-center gap-2 flex-1 text-left"
                  onClick={() => toggleModule(mod.module)}
                >
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="font-medium text-sm text-foreground">{mod.module}</span>
                  <span className="text-xs text-muted-foreground">({mod.permissions.length})</span>
                </button>

                {/* Toggle all in module */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs text-muted-foreground">Tất cả</span>
                  <button
                    type="button"
                    onClick={() => toggleAllInModule(mod.permissions, !isAllChecked)}
                    className={clsx(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                      isAllChecked
                        ? 'bg-primary'
                        : isSomeChecked
                        ? 'bg-primary/50'
                        : 'bg-border'
                    )}
                  >
                    <span
                      className={clsx(
                        'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                        isAllChecked ? 'translate-x-4' : 'translate-x-0.5'
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Permissions grid */}
              {isOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-background">
                  {mod.permissions.map((item) => {
                    const isActive = selected.includes(item.permissionId);
                    return (
                      <div
                        key={item.permissionId}
                        className="border border-border rounded-xl p-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{item.permissionName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 flex-wrap">
                            <span
                              className={clsx(
                                'px-1.5 py-0.5 rounded text-white text-[10px] font-semibold',
                                METHOD_COLORS[item.method] || 'bg-muted-foreground'
                              )}
                            >
                              {item.method}
                            </span>
                            <span className="truncate">{item.apiPath}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => togglePermission(item.permissionId)}
                          className={clsx(
                            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none',
                            isActive ? 'bg-primary' : 'bg-border'
                          )}
                        >
                          <span
                            className={clsx(
                              'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                              isActive ? 'translate-x-4' : 'translate-x-0.5'
                            )}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

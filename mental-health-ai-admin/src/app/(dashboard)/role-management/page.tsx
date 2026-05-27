'use client';

import React, { useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import { RolesTable } from '@/components/roles/RolesTable';
import { PermissionsTable } from '@/components/permissions/PermissionsTable';
import { PageHeader } from '@/components/layout/PageHeader';

type Tab = 'roles' | 'permissions';

export default function RoleManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('roles');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quyền & vai trò"
        description="Quản lý vai trò và phân quyền cho hệ thống."
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/60 rounded-2xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'roles'
            ? 'bg-card text-foreground shadow-sm border border-border'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Shield className="size-4" />
          Vai trò
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'permissions'
            ? 'bg-card text-foreground shadow-sm border border-border'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Lock className="size-4" />
          Quyền hạn
        </button>
      </div>

      {/* Content */}
      <div className="bg-card rounded-2xl border border-border p-6">
        {activeTab === 'roles' ? (
          <RolesTable />
        ) : (
          <PermissionsTable />
        )}
      </div>
    </div>
  );
}

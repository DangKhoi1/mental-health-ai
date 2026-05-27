import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode; // slot for action buttons
}

/**
 * Tiêu đề trang chuẩn dùng chung cho tất cả các trang Admin.
 * - title: Tiêu đề lớn
 * - description: Mô tả phụ
 * - children: Slot cho các nút hành động (vd: "Thêm mới", "Xuất báo cáo")
 */
export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl leading-none">{title}</h1>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {children}
        </div>
      )}
    </div>
  );
}

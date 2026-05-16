'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: number;
  color?: 'green' | 'blue' | 'purple' | 'amber' | 'red';
}

const colorMap = {
  green: { icon: 'bg-emerald-100 text-emerald-600', trend: 'text-emerald-600' },
  blue: { icon: 'bg-sky-100 text-sky-600', trend: 'text-sky-600' },
  purple: { icon: 'bg-violet-100 text-violet-600', trend: 'text-violet-600' },
  amber: { icon: 'bg-amber-100 text-amber-600', trend: 'text-amber-600' },
  red: { icon: 'bg-red-100 text-red-600', trend: 'text-red-600' },
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color = 'green' }) => {
  const c = colorMap[color];
  return (
    <Card className="h-full border-border/70 bg-white transition-shadow hover:shadow-lg !p-5">
      <div className="flex h-full items-center justify-between gap-3">
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <p className="text-[13px] font-bold text-[#6f665b] whitespace-nowrap overflow-hidden text-ellipsis break-keep" title={title}>{title}</p>
          <p className="mt-1 text-[32px] leading-none font-bold text-foreground tabular-nums">
            {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
          </p>
          {typeof trend === 'number' && (
            <div className={`mt-2 flex items-center gap-1 text-[11px] font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{trend >= 0 ? '+' : ''}{trend}% so với tháng trước</span>
            </div>
          )}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.icon}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

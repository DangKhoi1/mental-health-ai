'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  BookOpen,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import { authStorage } from '@/lib/auth';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

type HeaderProps = {
  onMenuClick: () => void;
};

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Tổng quan',
    items: [
      { label: 'Tổng quan', href: '/dashboard', icon: <LayoutDashboard className="size-4" /> },
    ],
  },
  {
    label: 'Quản lý nội dung',
    items: [
      { label: 'Người dùng', href: '/users', icon: <Users className="size-4" /> },
      { label: 'Bài đánh giá', href: '/assessment-templates', icon: <ClipboardList className="size-4" /> },
      { label: 'Câu hỏi đánh giá', href: '/assessment-questions', icon: <CircleHelp className="size-4" /> },
      { label: 'Quản lý thư viện', href: '/resources', icon: <BookOpen className="size-4" /> },
      { label: 'Quyền và vai trò', href: '/role-management', icon: <ShieldAlert className="size-4" /> },
    ],
  },
];

const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const user = authStorage.getUser();
  const displayName = user?.fullName || user?.username || 'Admin';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    authStorage.clearAll();
    router.push('/login');
  };

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={clsx(
          'fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-border/80 bg-background/95 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-20 shrink-0 items-center gap-3 border-b border-border/70 bg-linear-to-r from-primary/10 via-transparent to-accent/40 px-5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25 ring-4 ring-primary/10">
            <Image
              src="/mental_health.png"
              alt="Logo"
              width={24}
              height={24}
              className="brightness-0 invert"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-snug text-foreground">Mental Health AI</p>
            <p className="mt-1 text-xs leading-snug text-muted-foreground">Bảng điều khiển quản trị</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="hide-scrollbar flex-1 overflow-y-auto px-3 py-5">
          {NAV_SECTIONS.map((section, sIdx) => (
            <div key={section.label} className={sIdx > 0 ? 'mt-5' : ''}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={clsx(
                        'group flex h-12 items-center gap-3 rounded-2xl px-3 text-[14px] font-medium leading-snug transition-all',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/15 ring-1 ring-primary/15'
                          : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                      )}
                    >
                      <span
                        className={clsx(
                          'shrink-0 transition-colors',
                          isActive
                            ? 'text-primary-foreground'
                            : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate leading-snug">{item.label}</span>
                      {isActive ? (
                        <ChevronRight className="ml-auto size-3.5 shrink-0 text-primary" />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-border/70 p-3">
          <div className="rounded-2xl bg-linear-to-br from-primary/12 via-white to-accent/45 p-3 ring-1 ring-border/60">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-snug text-foreground">{displayName}</p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">Quản trị viên hệ thống</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-background/70 px-3 py-2 text-xs text-muted-foreground">
              <span>Trạng thái</span>
              <span className="font-semibold text-emerald-600">Đang hoạt động</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
          >
            <LogOut className="size-4 shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export const Header = ({ onMenuClick }: HeaderProps) => {
  const pathname = usePathname();
  const currentPage = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/70 bg-background/80 px-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex size-10 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu className="size-5" />
        </button>

        <h1 className="text-base font-semibold leading-none text-foreground">
          {currentPage?.label || 'Quản trị'}
        </h1>
      </div>
    </header>
  );
};

'use client';

import { useTransition, startTransition, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
    MenuIcon, XIcon, Loader2,
    LayoutDashboard, Smile, BookOpen, Moon,
    ClipboardList, BarChart3, Bell, Library, UserRound,
    LogOut, Bot, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from './NotificationBell';
import { useState } from 'react';
import { useChatStore } from '@/stores';
import { useUIStore } from '@/stores/uiStore';

const navGroups = [
    {
        label: 'Hàng ngày',
        items: [
            { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard, exact: true, color: 'primary' },
            { name: 'Tâm trạng', href: '/dashboard/daily-mood', icon: Smile, color: 'emerald' },
            { name: 'Nhật ký', href: '/dashboard/journal', icon: BookOpen, color: 'amber' },
            { name: 'Giấc ngủ', href: '/dashboard/sleep-log', icon: Moon, color: 'indigo' },
        ],
    },
    {
        label: 'Phân tích',
        items: [
            { name: 'Đánh giá', href: '/dashboard/assessment', icon: ClipboardList, color: 'teal' },
            { name: 'Thống kê', href: '/dashboard/statistics', icon: BarChart3, color: 'blue' },
        ],
    },
    {
        label: 'Tiện ích',
        items: [
            { name: 'Nhắc nhở', href: '/dashboard/reminders', icon: Bell, color: 'rose' },
            { name: 'Thư viện', href: '/dashboard/resources', icon: Library, color: 'lime' },
            { name: 'Hồ sơ', href: '/dashboard/profile', icon: UserRound, color: 'slate' },
        ],
    },
];

const colorVariants: Record<string, { active: string; hover: string; icon: string }> = {
    primary: {
        active: 'bg-primary/15 text-primary border-primary/10 shadow-primary/5',
        hover: 'hover:bg-primary/5 hover:text-primary',
        icon: 'text-primary'
    },
    emerald: {
        active: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/10 shadow-emerald-500/5',
        hover: 'hover:bg-emerald-50 hover:text-emerald-600',
        icon: 'text-emerald-500'
    },
    amber: {
        active: 'bg-amber-500/15 text-amber-600 border-amber-500/10 shadow-amber-500/5',
        hover: 'hover:bg-amber-50 hover:text-amber-600',
        icon: 'text-amber-500'
    },
    indigo: {
        active: 'bg-indigo-500/15 text-indigo-600 border-indigo-500/10 shadow-indigo-500/5',
        hover: 'hover:bg-indigo-50 hover:text-indigo-600',
        icon: 'text-indigo-500'
    },
    teal: {
        active: 'bg-teal-500/15 text-teal-600 border-teal-500/10 shadow-teal-500/5',
        hover: 'hover:bg-teal-50 hover:text-teal-600',
        icon: 'text-teal-500'
    },
    blue: {
        active: 'bg-blue-500/15 text-blue-600 border-blue-500/10 shadow-blue-500/5',
        hover: 'hover:bg-blue-50 hover:text-blue-600',
        icon: 'text-blue-500'
    },
    rose: {
        active: 'bg-rose-500/15 text-rose-600 border-rose-500/10 shadow-rose-500/5',
        hover: 'hover:bg-rose-50 hover:text-rose-600',
        icon: 'text-rose-500'
    },
    lime: {
        active: 'bg-lime-500/15 text-lime-600 border-lime-500/10 shadow-lime-500/5',
        hover: 'hover:bg-lime-50 hover:text-lime-600',
        icon: 'text-lime-500'
    },
    slate: {
        active: 'bg-slate-500/15 text-slate-600 border-slate-500/10 shadow-slate-500/5',
        hover: 'hover:bg-slate-50 hover:text-slate-600',
        icon: 'text-slate-500'
    },
};

const COLLAPSED_KEY = 'sidebar_collapsed';

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logoutAction } = useAuthStore();
    const { isOpen: isChatOpen, openChat, closeChat } = useChatStore();
    const { push } = useRouter();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { isSidebarCollapsed: isCollapsed, toggleSidebarCollapse: toggleCollapsed } = useUIStore();
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

    const handleLogout = () => {
        logoutAction();
        push('/');
    };

    const closeMobile = () => setIsMobileOpen(false);

    const handleNavClick = (href: string) => {
        if (href !== pathname) {
            setNavigatingTo(href);
            startTransition(() => {
                push(href);
                closeMobile();
                setTimeout(() => setNavigatingTo(null), 500);
            });
        } else {
            closeMobile();
        }
    };

    const isActive = (href: string, exact?: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    const sidebarWidth = isCollapsed ? 'lg:w-20' : 'lg:w-64';
    const mainOffset = isCollapsed ? 'lg:ml-20' : 'lg:ml-64';

    return (
        <>
            {/* Mobile top bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#eaf2e8]/85 dark:bg-[#1f2620]/85 backdrop-blur-xl border-b border-[#d2ded1]/60 dark:border-[#44403c]/60 shadow-[0_2px_16px_rgba(142,179,122,0.08)] px-4 py-3 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2 group">
                    <div className="size-8 rounded-lg bg-[#8eb37a] dark:bg-[#9ca986] flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
                        <Image src="/mental_health.png" alt="Logo" width={24} height={24} className="brightness-0 invert" />
                    </div>
                    <span className="text-base font-semibold text-foreground">
                        Mental Health AI
                    </span>
                </Link>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => { isChatOpen ? closeChat() : openChat(); }}
                        title="Chatbot"
                        className={cn(
                            'p-2 rounded-xl transition-colors',
                            isChatOpen
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                        )}
                        aria-label={isChatOpen ? 'Đóng chatbot' : 'Mở chatbot'}
                    >
                        <Bot className="size-5" />
                    </button>
                    <NotificationBell />
                    <button
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        className="p-2 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        aria-label={isMobileOpen ? 'Đóng menu' : 'Mở menu'}
                    >
                        {isMobileOpen ? <XIcon className="size-6" /> : <MenuIcon className="size-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    role="button"
                    tabIndex={0}
                    className="lg:hidden fixed inset-0 z-40 bg-[#2d372e]/20 backdrop-blur-sm"
                    onClick={closeMobile}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') closeMobile(); }}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                'fixed left-0 top-0 z-40 h-screen bg-[#eaf2e8]/75 dark:bg-[#1f2620]/75 backdrop-blur-3xl border-r border-[#d2ded1]/50 dark:border-[#44403c]/50 shadow-[4px_0_24px_rgba(142,179,122,0.08)]',
                'transition-all duration-500 ease-in-out',
                'w-64', sidebarWidth,
                isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo ,  desktop */}
                    <div className={cn('hidden lg:flex items-center p-5 border-b border-[#d2ded1]/40 dark:border-[#44403c]/40 min-h-[72px]', isCollapsed ? 'justify-center' : 'justify-between')}>
                        {!isCollapsed && (
                            <Link href="/dashboard" className="flex items-center gap-3 group min-w-0">
                                <div className="size-9 rounded-xl bg-linear-to-br from-[#8eb37a] to-[#8eb37a]/80 dark:from-[#9ca986] dark:to-[#9ca986]/80 flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm shadow-[#8eb37a]/20 text-primary-foreground shrink-0">
                                    <Image src="/mental_health.png" alt="Logo" width={28} height={28} className="brightness-0 invert" />
                                </div>
                                <span className="text-base font-semibold text-foreground truncate">
                                    Mental Health AI
                                </span>
                            </Link>
                        )}
                        {isCollapsed && (
                            <Link href="/dashboard" className="group">
                                <div className="size-9 rounded-xl bg-linear-to-br from-[#8eb37a] to-[#8eb37a]/80 dark:from-[#9ca986] dark:to-[#9ca986]/80 flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm shadow-[#8eb37a]/20 text-primary-foreground">
                                    <Image src="/mental_health.png" alt="Logo" width={28} height={28} className="brightness-0 invert" />
                                </div>
                            </Link>
                        )}
                    </div>

                    {/* Spacer for mobile top bar */}
                    <div className="lg:hidden h-14" />

                    {/* Nav groups */}
                    <nav className="flex-1 px-3 py-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {navGroups.map((group, gi) => (
                            <div key={group.label} className={cn('mb-4', gi > 0 && 'pt-2 border-t border-[#d2ded1]/60 dark:border-[#44403c]/60')}>
                                {!isCollapsed && (
                                    <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
                                        {group.label}
                                    </p>
                                )}
                                <div className="space-y-0.5">
                                    {group.items.map((item) => {
                                        const active = isActive(item.href, item.exact);
                                        const loading = navigatingTo === item.href;
                                        const Icon = item.icon;
                                        const variant = colorVariants[item.color] || colorVariants.primary;

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleNavClick(item.href);
                                                }}
                                                aria-current={active ? 'page' : undefined}
                                                title={isCollapsed ? item.name : undefined}
                                                className={cn(
                                                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 font-medium text-sm border border-transparent',
                                                    isCollapsed && 'justify-center px-2',
                                                    active
                                                        ? cn(variant.active, 'shadow-[0_4px_20px_rgba(0,0,0,0.03)]')
                                                        : cn('text-muted-foreground/80', variant.hover),
                                                    loading && 'opacity-70 cursor-wait'
                                                )}
                                            >
                                                {loading
                                                    ? <Loader2 className="size-4 animate-spin shrink-0" />
                                                    : <Icon className={cn("size-4 shrink-0 transition-colors", active ? variant.icon : "text-muted-foreground/60 group-hover:text-inherit")} />
                                                }
                                                {!isCollapsed && <span className="truncate">{item.name}</span>}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Footer: user + logout */}
                    <div className={cn('p-3 border-t border-[#d2ded1]/60 dark:border-[#44403c]/60', isCollapsed && 'flex flex-col items-center gap-2')}>
                        {!isCollapsed && (
                            <div className="flex items-center gap-3 mb-3 p-3 rounded-2xl bg-[#f6f8f5]/60 dark:bg-[#2a322b]/60 border border-[#d2ded1]/60 dark:border-[#44403c]/60 shadow-sm">
                                <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold border-2 border-white shrink-0 overflow-hidden">
                                    {user?.avatarUrl ? (
                                        <Image src={user.avatarUrl} alt="Avatar" width={36} height={36} className="size-full object-cover" />
                                    ) : (
                                        <span>{user?.fullName?.charAt(0) || 'U'}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {user?.fullName || 'Người dùng'}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        @{user?.username || 'user'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {isCollapsed && (
                            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold border-2 border-white overflow-hidden mb-1">
                                {user?.avatarUrl ? (
                                    <Image src={user.avatarUrl} alt="Avatar" width={36} height={36} className="size-full object-cover" />
                                ) : (
                                    <span>{user?.fullName?.charAt(0) || 'U'}</span>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleLogout}
                            title="Đăng xuất"
                            className={cn(
                                'flex items-center gap-2 px-3 py-2.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all duration-200 font-medium text-sm group',
                                isCollapsed ? 'justify-center size-10 px-0' : 'w-full justify-center'
                            )}
                            aria-label="Đăng xuất"
                        >
                            <LogOut className="size-4 transition-transform group-hover:-translate-x-0.5 shrink-0" />
                            {!isCollapsed && <span>Đăng xuất</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Desktop collapse toggle button ,  mounted outside aside so it floats on the edge */}
            <button
                onClick={toggleCollapsed}
                className={cn(
                    'hidden lg:flex fixed top-1/2 -translate-y-1/2 z-50',
                    'w-6 h-12 items-center justify-center',
                    'bg-[#eaf2e8]/70 dark:bg-[#1f2620]/70 backdrop-blur-md border border-[#d2ded1]/60 dark:border-[#44403c]/60 rounded-r-xl',
                    'text-muted-foreground hover:text-primary hover:bg-sky-50',
                    'shadow-[2px_0_12px_rgba(142,179,122,0.06)] transition-all duration-500',
                    isCollapsed ? 'left-20' : 'left-64'
                )}
                aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
                {isCollapsed
                    ? <ChevronRight className="size-3.5" />
                    : <ChevronLeft className="size-3.5" />
                }
            </button>

            {/* Spacer div to push main content */}
            <style>{`
                .dashboard-main {
                    transition: margin-left 300ms ease-in-out;
                }
            `}</style>
        </>
    );
}

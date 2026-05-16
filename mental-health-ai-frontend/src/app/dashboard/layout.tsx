'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Sidebar from '@/components/dashboard/Sidebar';
import FloatingWorldClock from '@/components/dashboard/FloatingWorldClock';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import OnboardingAssessmentModal from '@/components/dashboard/OnboardingAssessmentModal';
import PinSetupModal from '@/components/dashboard/PinSetupModal';
import { useNotificationStore } from '@/stores/notificationStore';
import { useChatStore } from '@/stores';
import { Bot } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, _hasHydrated } = useAuthStore();
    const { initRealtime, disconnectRealtime } = useNotificationStore();
    const { isOpen: isChatOpen, openChat, closeChat } = useChatStore();
    const { isSidebarCollapsed } = useUIStore();
    const router = useRouter();
    const pathname = usePathname();

    const isDoAssessmentPage = pathname?.includes('/do-assessment');
    const isResultAssessmentPage = pathname?.includes('/result-assessment');
    const isFullscreenAssessmentPage = isDoAssessmentPage || isResultAssessmentPage;

    useEffect(() => {
        if (_hasHydrated && !isAuthenticated && !isFullscreenAssessmentPage) {
            console.log('Dashboard - Redirecting to login');
            router.replace('/auth/login');
        }
    }, [isAuthenticated, _hasHydrated, isFullscreenAssessmentPage, router]);

    useEffect(() => {
        if (_hasHydrated && isAuthenticated && !isFullscreenAssessmentPage) {
            initRealtime();
            return () => {
                disconnectRealtime();
            };
        }
    }, [
        _hasHydrated,
        isAuthenticated,
        isFullscreenAssessmentPage,
        initRealtime,
        disconnectRealtime,
    ]);

    const currentTheme = (() => {
        if (pathname?.includes('/daily-mood')) return {
            bg: "from-emerald-50/80 via-white to-sky-100/50",
            blobs: ["bg-emerald-200/30", "bg-sky-200/30", "bg-emerald-500/20"],
            header: "bg-emerald-50/50 border-emerald-100/60 shadow-emerald-900/5",
            primary: "#10b981", // emerald-500
        };
        if (pathname?.includes('/journal')) return {
            bg: "from-amber-50/80 via-white to-orange-100/50",
            blobs: ["bg-amber-200/30", "bg-orange-200/30", "bg-amber-500/20"],
            header: "bg-amber-50/50 border-amber-100/60 shadow-amber-900/5",
            primary: "#f59e0b", // amber-500
        };
        if (pathname?.includes('/sleep-log')) return {
            bg: "from-indigo-50/80 via-white to-blue-100/50",
            blobs: ["bg-indigo-200/30", "bg-blue-200/30", "bg-indigo-500/20"],
            header: "bg-indigo-50/50 border-indigo-100/60 shadow-indigo-900/5",
            primary: "#6366f1", // indigo-500
        };
        return {
            bg: "from-emerald-50/80 via-white to-sky-100/50",
            blobs: ["bg-emerald-200/30", "bg-sky-200/30", "bg-primary/20"], // default primary is sage
            header: "bg-emerald-50/50 border-emerald-100/60 shadow-emerald-900/5",
            primary: null,
        };
    })();

    if (!_hasHydrated) {
        return (
            <div className="min-h-screen bg-linear-to-br from-[#eaf2e8] via-[#f0f4ea] to-[#f5ece6] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 font-medium">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated && !isFullscreenAssessmentPage) {
        return null;
    }

    if (isFullscreenAssessmentPage) {
        return (
            <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-sky-50">
                <main className="min-h-screen">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div 
            className={cn("min-h-screen bg-linear-to-br text-foreground relative overflow-hidden transition-colors duration-700", currentTheme.bg)}
            style={currentTheme.primary ? {
                '--primary': currentTheme.primary,
                '--primary-foreground': '#ffffff',
                '--ring': currentTheme.primary,
            } as React.CSSProperties : {}}
        >
            {/* Ambient Background Blurs */}
            <div className={cn("absolute top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full pointer-events-none animate-pulse transition-colors duration-1000", currentTheme.blobs[0])} style={{ animationDuration: '8s' }} />
            <div className={cn("absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] blur-[100px] rounded-full pointer-events-none animate-pulse transition-colors duration-1000", currentTheme.blobs[1])} style={{ animationDuration: '10s' }} />
            <div className={cn("absolute top-[30%] right-[10%] w-[25%] h-[25%] blur-[90px] rounded-full pointer-events-none transition-colors duration-1000", currentTheme.blobs[2])} />

            <Sidebar />

            <main 
                id="dashboard-main" 
                className={cn(
                    "relative pt-16 lg:pt-0 min-h-screen transition-[margin] duration-500 ease-in-out",
                    isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
                )}
            >
                {/* Desktop top header with clock + chatbot + notification bell */}
                <div className={cn("hidden lg:flex items-center justify-end gap-3 sticky top-0 z-30 backdrop-blur-md border-b px-8 py-2 shadow-sm transition-all duration-700", currentTheme.header)}>
                    <FloatingWorldClock />
                    <button
                        onClick={() => {
                            if (isChatOpen) {
                                closeChat();
                            } else {
                                openChat();
                            }
                        }}
                        title="Chatbot"
                        className={`cursor-pointer flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                            isChatOpen
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                    >
                        <Bot className="w-5 h-5" />
                    </button>
                    <NotificationBell />
                </div>

                <div className="px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 pt-4 lg:pt-6">
                    {children}
                </div>
            </main>

            {/* Mobile only: FloatingWorldClock — ẩn trên mobile nhỏ, hiện từ md trở lên */}
            <div className="hidden md:block lg:hidden">
                <FloatingWorldClock />
            </div>

            {/* First-time user onboarding popup */}
            <OnboardingAssessmentModal />

            {/* Privacy PIN setup popup for users without a PIN */}
            <PinSetupModal />
        </div>
    );
}

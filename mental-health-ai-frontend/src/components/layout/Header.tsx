"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Sparkles, ArrowRight, UserCircle } from "lucide-react";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    const closeMenu = () => setIsMenuOpen(false);

    const navItems = [
        { href: "/trangchu", label: "Trang chủ" },
        { href: "#features", label: "Tính năng" },
        { href: "#about", label: "Về chúng tôi" },
        { href: "#faq", label: "Câu hỏi thường gặp" },
    ];

    const isActive = (href: string) => href === "/trangchu" && pathname === "/trangchu";

    return (
        <header className="fixed inset-x-0 top-0 z-50">
            <div className="relative w-full overflow-hidden border-b border-white/55 bg-white/50 shadow-[0_10px_30px_rgba(90,120,130,0.08)] backdrop-blur-2xl">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_34%),radial-gradient(circle_at_top_right,rgba(186,215,233,0.3),transparent_30%)]" />

                <div className="relative mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-3 px-3 sm:px-6">
                    <Link href="/trangchu" className="group flex min-w-0 items-center gap-3" onClick={closeMenu}>
                        <div className="size-10 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm text-primary-foreground">
                            <Image
                                src="/mental_health.png"
                                alt="Logo"
                                width={32}
                                height={32}
                                className="brightness-0 invert" />
                        </div>
                        <div className="min-w-0 leading-tight">
                            <span className="block truncate text-base font-semibold text-foreground sm:text-lg">
                                Mental Health AI
                            </span>
                            <span className="hidden text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
                                Theo dõi sức khỏe tinh thần
                            </span>
                        </div>
                    </Link>

                    <nav className="hidden items-center gap-1 rounded-full border border-white/55 bg-white/45 p-1 backdrop-blur-xl lg:flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${isActive(item.href)
                                    ? "bg-white/80 text-foreground shadow-sm shadow-sky-900/10"
                                    : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="hidden items-center gap-3 lg:flex">
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/55 px-5 py-2.5 text-sm font-medium text-foreground shadow-[0_8px_22px_rgba(120,150,120,0.14)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/70"
                        >
                            <UserCircle className="size-4 text-primary" />
                            Đăng nhập
                        </Link>
                        <Link
                            href="/auth/register"
                            className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-primary to-primary/85 px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_24px_rgba(142,179,122,0.28)] transition-all hover:-translate-y-0.5 hover:opacity-95"
                        >
                            Đăng ký
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/55 bg-white/55 text-muted-foreground backdrop-blur-xl transition-colors hover:bg-white/70 lg:hidden"
                        aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
                        aria-expanded={isMenuOpen}
                    >
                        {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="relative border-t border-sky-100/50 bg-sky-50/80 backdrop-blur-2xl lg:hidden">
                        <div className="mx-auto w-full max-w-7xl px-4 pb-4 pt-3">
                            <nav className="flex flex-col gap-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={closeMenu}
                                        className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive(item.href)
                                            ? "bg-white/70 text-foreground"
                                            : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>

                            <div className="mt-4 grid grid-cols-2 gap-2.5">
                                <Link
                                    href="/auth/login"
                                    onClick={closeMenu}
                                    className="inline-flex items-center justify-center rounded-2xl border border-white/55 bg-white/60 px-4 py-2.5 text-sm font-medium text-foreground"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    href="/auth/register"
                                    onClick={closeMenu}
                                    className="inline-flex items-center justify-center rounded-2xl bg-linear-to-r from-primary to-primary/85 px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                                >
                                    Đăng ký
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";

export default function HeroSection() {
    return (
        <section className="relative isolate overflow-hidden bg-white pb-8 lg:pb-12">
            {/* Decorative elements */}
            <div className="absolute top-0 inset-x-0 h-64 bg-linear-to-b from-sky-100/40 via-primary/5 to-transparent" aria-hidden />
            <div className="absolute -left-20 top-20 size-72 rounded-full bg-sky-300/20 blur-3xl animate-pulse-soft" aria-hidden />
            <div className="absolute -right-20 bottom-20 size-80 rounded-full bg-primary/15 blur-3xl animate-float" aria-hidden />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-24 grid gap-16 lg:grid-cols-2 items-center relative z-10">
                <div className="gap-y-8 animate-in fade-in slide-in-from-left duration-1000 text-center lg:text-left flex flex-col items-center lg:items-start">
                    <div className="inline-flex items-center gap-2 rounded-full bg-sky-50/80 px-4 py-2 shadow-sm border border-sky-100 backdrop-blur-md">
                        <span className="flex size-6 items-center justify-center rounded-full bg-sky-100 text-sky-600 animate-pulse-soft">
                            <Sparkles className="size-3" />
                        </span>
                        <p className="text-sm text-foreground/80 font-semibold tracking-tight">Không gian riêng tư để theo dõi cảm xúc mỗi ngày</p>
                    </div>

                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold leading-[1.1] text-foreground tracking-tight">
                        Thấu hiểu thế giới <span className="text-primary italic animate-pulse-soft decoration-primary/30 underline decoration-4 underline-offset-8">nội tâm</span> của bạn.
                    </h1>

                    <p className="text-xl text-muted-foreground leading-relaxed max-w-xl font-medium">
                        Ghi lại cảm xúc, thực hiện các bài đánh giá tâm lý và nhận lời khuyên từ AI để hướng tới một cuộc sống cân bằng hơn.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-5">
                        <Link href="/auth/register">
                            <Button size="lg" className="relative group overflow-hidden rounded-full px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground border-none transition-all duration-300 hover:scale-105">
                                <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                Bắt đầu ngay
                                <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="#about">
                            <Button variant="outline" size="lg" className="rounded-full px-10 h-14 text-lg font-bold border-border bg-white/40 backdrop-blur-md hover:bg-white/80 text-foreground transition-all duration-300">
                                Tìm hiểu thêm
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="relative lg:h-150 flex items-center justify-center animate-in fade-in zoom-in duration-1000 delay-300">
                    <div className="relative w-full max-w-md aspect-4/5 rounded-[3rem] shadow-2xl shadow-sky-900/20 overflow-hidden ring-1 ring-white/50 animate-float bg-white">
                        <Image
                            src="/9727d161c21af340fc05032f7a51f969.jpg"
                            alt="AI đồng hành sức khỏe tinh thần"
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 480px"
                            priority
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-sky-900/10 via-transparent to-white/5" />

                    </div>
                </div>
            </div>
        </section>
    );
}

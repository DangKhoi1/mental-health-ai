'use client';

import Image from "next/image";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export default function InspirationSection() {
    const [quoteRef, quoteVisible] = useScrollAnimation();

    return (
        <section className="relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 bg-background">
            {/* Background image */}
            <div className="absolute inset-0">
                <Image
                    src="/inspiration_nature.png"
                    alt="Phong cảnh thiên nhiên"
                    fill
                    className="object-cover opacity-20"
                    sizes="100vw"
                />
            </div>
            <div className="absolute inset-0 bg-linear-to-r from-sky-100/20 via-transparent to-blue-100/20" aria-hidden />
            <div className="absolute left-10 top-16 size-48 rounded-full bg-sky-300/25 blur-3xl" aria-hidden />
            <div className="absolute right-6 bottom-6 size-56 rounded-full bg-primary/10 blur-3xl" aria-hidden />

            <div
                ref={quoteRef}
                className={`relative mx-auto max-w-7xl text-center space-y-8 transition-all duration-1000 ${quoteVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
                <p className="text-3xl sm:text-4xl lg:text-5xl font-light leading-snug text-foreground/90 tracking-tight">
                    “Không cần làm mọi thứ hoàn hảo ngay.
                    <span className="block mt-2 font-normal text-primary italic">Chỉ cần bắt đầu từ những bước nhỏ mỗi ngày.”</span>
                </p>
                <div className="h-px w-24 bg-border mx-auto" />
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                    Mental Health AI giúp bạn theo dõi cảm xúc và thói quen hằng ngày để hiểu rõ bản thân hơn theo thời gian.
                </p>
            </div>
        </section>
    );
}

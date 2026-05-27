'use client';

import { Heart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export default function WelcomeSection() {
    const [ref, isVisible] = useScrollAnimation();

    return (
        <section className="pt-24 pb-10 px-4 bg-sky-50/40 relative">
            <div
                ref={ref}
                className={`mx-auto max-w-4xl text-center space-y-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
                <div className="mx-auto inline-flex items-center justify-center p-4 bg-white rounded-full shadow-sm border border-border/50">
                    <Heart className="size-8 text-primary" strokeWidth={1.5} />
                </div>
                <div className="space-y-4">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium text-foreground tracking-tight leading-tight">
                        Chào mừng bạn đến với <br className="hidden sm:block" />
                        không gian theo dõi sức khỏe tinh thần
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                        Một nơi để bạn ghi nhận cảm xúc, xem lại thay đổi theo thời gian và chủ động chăm sóc bản thân theo cách phù hợp.
                    </p>
                </div>
            </div>
        </section>
    );
}

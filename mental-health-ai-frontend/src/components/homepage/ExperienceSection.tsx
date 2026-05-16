'use client';

import { BookHeart, MoonStar, Sparkles } from 'lucide-react';
import { Card } from "@/components/ui";
import Image from "next/image";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const EXPERIENCES = [
    {
        title: "Nhật ký cảm xúc mỗi ngày",
        description: "Viết vài dòng ngắn, dán nhãn cảm xúc và nhìn lại hành trình của mình với những biểu đồ nhẹ nhàng, dễ hiểu.",
        note: "Mỗi bước nhỏ đều được ghi nhận, không áp lực hoàn hảo.",
        icon: BookHeart,
        imageGradient: "from-secondary/30 via-white to-background",
        imageSrc: "/journal.jpg",
    },
    {
        title: "Hiểu nhịp điệu riêng",
        description: "AI gợi ý thời điểm bạn nên nghỉ ngơi, thở sâu hoặc đi dạo dựa trên nhịp sinh hoạt và cảm xúc của bạn.",
        note: "Bạn làm chủ lựa chọn, gợi ý chỉ là lời thì thầm êm ái.",
        icon: Sparkles,
        imageGradient: "from-secondary/50 via-white to-background",
        imageSrc: "/slider_meditation.png",
    },
    {
        title: "Nuôi dưỡng giấc ngủ và sự cân bằng",
        description: "Theo dõi giấc ngủ, năng lượng, và những hoạt động giúp bạn thấy dễ chịu hơn. Nhận nhắc nhở dịu dàng để duy trì thói quen tốt.",
        note: "Nhẹ nhàng quay lại ngay cả khi bạn bỏ lỡ vài ngày.",
        icon: MoonStar,
        imageGradient: "from-accent/30 via-white to-background",
        imageSrc: "/sleepwell.jpg",
    },
];

export default function ExperienceSection() {
    const [headerRef, headerVisible] = useScrollAnimation();

    return (
        <section id="features" className="relative overflow-hidden bg-background py-16 px-4 sm:px-6 lg:px-8">
            <div className="absolute left-10 top-10 h-48 w-48 rounded-full bg-sky-300/20 blur-3xl animate-pulse-soft" aria-hidden />
            <div className="absolute right-8 bottom-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-float" aria-hidden />

            <div className="mx-auto max-w-7xl space-y-12">
                <div
                    ref={headerRef}
                    className={`text-center space-y-5 transition-all duration-700 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                >
                    <h2 className="text-3xl sm:text-4xl font-medium text-foreground tracking-tight">Trải nghiệm được dệt nên cho sự an yên</h2>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        Mỗi tính năng đều được thiết kế để bạn cảm thấy được nâng đỡ, không bị thúc ép, và có đủ không gian để hít thở.
                    </p>
                </div>

                <div className="space-y-8">
                    {EXPERIENCES.map((item, index) => {
                        const Icon = item.icon;
                        const isEven = index % 2 === 0;

                        return (
                            <div
                                key={item.title}
                                className={`grid items-center gap-8 lg:grid-cols-2 ${isEven ? '' : 'lg:[&>*:first-child]:order-last'}`}
                            >
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 shadow-sm border border-sky-100 animate-pulse-soft">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <p className="text-sm font-bold text-sky-700 uppercase tracking-widest">Nhẹ nhàng từng bước</p>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight">{item.title}</h3>
                                        <p className="text-lg text-muted-foreground leading-relaxed font-medium">{item.description}</p>
                                    </div>
                                    <div className="inline-block rounded-3xl border border-sky-100/50 bg-sky-50/40 p-5 shadow-sm backdrop-blur-md">
                                        <p className="text-[15px] text-foreground/80 font-semibold italic leading-relaxed">&quot;{item.note}&quot;</p>
                                    </div>
                                </div>

                                <Card className="relative overflow-hidden rounded-[40px] border border-white/40 bg-white/60 shadow-2xl shadow-sky-900/5 p-5 backdrop-blur-xl group/card transition-all duration-700 hover:shadow-sky-900/10 hover:border-sky-200">
                                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-muted/50 border border-white/20 shadow-inner">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${item.imageGradient} opacity-40`} aria-hidden />
                                        <Image
                                            src={item.imageSrc}
                                            alt={item.title}
                                            fill
                                            className="object-cover opacity-95 transition-transform duration-1000 group-hover/card:scale-110"
                                            sizes="(max-width: 1024px) 100vw, 480px"
                                        />
                                    </div>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

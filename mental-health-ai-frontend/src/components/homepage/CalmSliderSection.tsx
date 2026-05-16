'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Wind, Sun, Coffee, BookOpen } from 'lucide-react';
import { Card } from "@/components/ui";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const SLIDES = [
    {
        icon: Wind,
        header: "Hít thở",
        title: "Bài tập thở 4-7-8",
        content: "Kỹ thuật thở đơn giản giúp giảm căng thẳng và lo âu nhanh chóng. Hít vào 4s, giữ 7s, thở ra 8s.",
        color: "bg-sky-50 text-sky-700",
        activeColor: "border-primary/50 bg-primary/5",
    },
    {
        icon: Sun,
        header: "Buổi sáng",
        title: "Khởi động ngày mới",
        content: "Dành 5 phút ghi lại 3 việc bạn muốn ưu tiên. Cách đơn giản để bắt đầu ngày mới rõ ràng hơn.",
        color: "bg-primary/10 text-primary",
        activeColor: "border-primary/50 bg-primary/5",
    },
    {
        icon: Coffee,
        header: "Thư giãn",
        title: "Nghỉ ngơi ngắn",
        content: "Tạm rời màn hình 10 phút, hít thở sâu và thả lỏng cơ thể để lấy lại tập trung.",
        color: "bg-blue-50 text-blue-700",
        activeColor: "border-primary/50 bg-primary/5",
    },
    {
        icon: BookOpen,
        header: "Đọc sách",
        title: "Thời gian cho bản thân",
        content: "Đọc vài trang sách hoặc ghi chú ngắn để đầu óc thư giãn trước khi quay lại công việc.",
        color: "bg-indigo-50 text-indigo-700",
        activeColor: "border-primary/50 bg-primary/5",
    }
];

export default function CalmSliderSection() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [sectionRef, sectionVisible] = useScrollAnimation();

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, []);

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(interval);
    }, [nextSlide]);

    return (
        <section className="py-10 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden border-y border-border/40">
            <div
                ref={sectionRef}
                className={`mx-auto max-w-6xl space-y-6 transition-all duration-700 ${sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <h2 className="text-3xl sm:text-4xl font-medium text-foreground leading-tight tracking-tight">
                            Gợi ý nhanh <span className="text-primary italic">để cân bằng hơn</span>
                        </h2>
                        <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                            Một vài hoạt động ngắn giúp bạn giảm căng thẳng trong ngày.
                        </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={prevSlide}
                            aria-label="Gợi ý trước"
                            className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={nextSlide}
                            aria-label="Gợi ý tiếp theo"
                            className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:bg-foreground/90 transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Cards Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {SLIDES.map((slide, index) => {
                        const isActive = index === currentSlide;
                        return (
                            <Card
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`relative cursor-pointer rounded-2xl p-5 border overflow-hidden transition-all duration-500 ease-out ${
                                    isActive
                                        ? 'border-primary/50 bg-primary/5 shadow-xl shadow-primary/10 scale-105 z-10'
                                        : 'border-border/40 bg-card/60 opacity-50 scale-95 hover:opacity-70'
                                }`}
                            >
                                {/* Decorative circle */}
                                <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full transition-all duration-500 ${isActive ? 'bg-primary/15 scale-110' : 'bg-sky-100/50 scale-75'}`} />

                                <div className="relative z-10 space-y-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-500 ${slide.color} ${isActive ? 'scale-110' : ''}`}>
                                        <slide.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">{slide.header}</span>
                                        <h3 className={`text-lg font-medium mt-0.5 transition-colors duration-500 ${isActive ? 'text-foreground' : 'text-foreground/70'}`}>{slide.title}</h3>
                                    </div>
                                    <p className={`text-sm leading-relaxed transition-colors duration-500 ${isActive ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                                        {slide.content}
                                    </p>
                                </div>

                                {/* Progress bar */}
                                <div className="relative z-10 mt-4">
                                    <div className={`h-1 w-full rounded-full overflow-hidden transition-colors duration-500 ${isActive ? 'bg-primary/20' : 'bg-secondary/20'}`}>
                                        <div className={`h-full rounded-full ${isActive ? 'w-full transition-all duration-5000 ease-linear bg-primary' : 'w-0'}`} />
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}


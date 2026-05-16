'use client';

import Link from "next/link";
import { Button } from "@/components/ui";
import { Sunrise, Moon, Book, Leaf, Wind } from "lucide-react";
import { gentleTiles } from "@/constants";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export default function GentleCTASection() {

    const moodTile = gentleTiles[0];
    const [sectionRef, sectionVisible] = useScrollAnimation();

    return (
        <section className="relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 bg-sky-50/20">
            <div className="absolute inset-0 bg-background" aria-hidden />

            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-sky-300/20 rounded-full blur-3xl mix-blend-multiply" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl mix-blend-multiply" />

            <div
                ref={sectionRef}
                className={`relative mx-auto max-w-7xl space-y-12 text-center transition-all duration-700 ${sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
                <div className="space-y-6">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 text-sky-700 text-sm font-medium tracking-wide">
                        <Leaf className="w-4 h-4 text-sky-600" />
                        Gợi ý mỗi ngày
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium text-foreground tracking-tight leading-tight">
                        Chăm sóc sức khỏe tinh thần<br /> theo cách đơn giản và đều đặn.
                    </h2>
                    <p className="text-lg sm:text-xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
                        Theo dõi cảm xúc, nghỉ ngơi hợp lý và ghi lại điều quan trọng với bạn.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Today Tile */}
                    <div className="group bg-white/60 backdrop-blur-3xl rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:shadow-sky-900/10 transition-all duration-500 border border-white/40 hover:-translate-y-2 animate-in slide-in-from-bottom-4 fade-in"
                         style={{ animationDelay: sectionVisible ? '100ms' : '0ms', animationFillMode: 'both' }}>
                        <div className="flex flex-col items-center text-center space-y-6 h-full justify-between">
                            <div className="w-[72px] h-[72px] rounded-3xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-500 shadow-sm animate-float">
                                <Sunrise className="w-9 h-9" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-bold text-foreground tracking-tight">Hôm nay</h3>
                                <p className="text-muted-foreground leading-relaxed font-medium italic text-[15px]">
                                    &quot;{moodTile.note.quote}&quot;
                                </p>
                            </div>
                            <div className="pt-6 border-t border-sky-100/50 w-full">
                                <p className="text-xs font-bold uppercase tracking-widest text-indigo-500/70">Theo dõi trạng thái</p>
                            </div>
                        </div>
                    </div>

                    {/* Sleep Tile */}
                    <div className="group bg-white/60 backdrop-blur-3xl rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-500 border border-white/40 hover:-translate-y-2 animate-in slide-in-from-bottom-4 fade-in"
                         style={{ animationDelay: sectionVisible ? '200ms' : '0ms', animationFillMode: 'both' }}>
                        <div className="flex flex-col items-center text-center space-y-6 h-full justify-between">
                            <div className="w-[72px] h-[72px] rounded-3xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-500 shadow-sm animate-float" style={{ animationDelay: '0.5s' }}>
                                <Moon className="w-9 h-9" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-bold text-foreground tracking-tight">Giấc ngủ</h3>
                                <p className="text-muted-foreground leading-relaxed font-medium text-[15px]">
                                    Ghi nhận giờ ngủ để thấu hiểu năng lượng và nhịp sinh học của bạn.
                                </p>
                            </div>
                            <div className="pt-6 border-t border-emerald-100/50 w-full">
                                <p className="text-xs font-bold uppercase tracking-widest text-emerald-500/70">Cân bằng nghỉ ngơi</p>
                            </div>
                        </div>
                    </div>

                    {/* Journal Tile */}
                    <div className="group bg-white/60 backdrop-blur-3xl rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:shadow-amber-900/10 transition-all duration-500 border border-white/40 hover:-translate-y-2 animate-in slide-in-from-bottom-4 fade-in"
                         style={{ animationDelay: sectionVisible ? '300ms' : '0ms', animationFillMode: 'both' }}>
                        <div className="flex flex-col items-center text-center space-y-6 h-full justify-between">
                            <div className="w-[72px] h-[72px] rounded-3xl bg-amber-50 border border-amber-100/50 flex items-center justify-center text-amber-500 shadow-sm animate-float" style={{ animationDelay: '1s' }}>
                                <Book className="w-9 h-9" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-bold text-foreground tracking-tight">Nhật ký</h3>
                                <p className="text-muted-foreground leading-relaxed font-medium text-[15px]">
                                    Lưu giữ những khoảnh khắc quý giá và giải phóng những suy nghĩ mệt mỏi.
                                </p>
                            </div>
                            <div className="pt-6 border-t border-amber-100/50 w-full">
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-500/70">Riêng tư tuyệt đối</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Button Wrapper */}
                <div className="pt-12">
                    <Link href="/auth/register">
                        <Button
                            size="lg"
                            className="group relative overflow-hidden bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-16 px-12 text-xl font-bold transition-all duration-300 shadow-xl shadow-primary/20 hover:scale-105"
                        >
                            <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <Wind className="mr-3 w-6 h-6 animate-pulse-soft" />
                            Tham gia ngay
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}

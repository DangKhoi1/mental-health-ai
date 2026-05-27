'use client';

import { Leaf, NotebookText, Sparkles } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCreative } from "swiper/modules";
import Image from "next/image";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import 'swiper/css';
import 'swiper/css/effect-creative';

const INTRO_POINTS = [
    {
        title: "Đồng hành dịu dàng",
        description: "Một không gian tĩnh để bạn viết, suy ngẫm và lắng nghe cảm xúc mà không bị gián đoạn.",
        icon: Leaf,
    },
    {
        title: "Theo dõi và thấu hiểu",
        description: "Quan sát những thay đổi nhỏ mỗi ngày, nhận diện nhịp cảm xúc và chăm sóc bản thân phù hợp.",
        icon: NotebookText,
    },
    {
        title: "Gợi ý giàu sự thấu cảm",
        description: "AI nhẹ nhàng gợi ý các hoạt động nghỉ ngơi, thở sâu hay viết nhật ký ngắn <span className=\"text-primary font-bold-500\">để bạn cân bằng hơn</span>.",
        icon: Sparkles,
    },
];

const SLIDE_IMAGES = [
    {
        src: "/morning.jpg",
        alt: "Buổi sáng yên tĩnh",
        label: "Sáng sớm dịu nhẹ",
    },
    {
        src: "/person-practicing-yoga-meditation-outdoors-nature.jpg",
        alt: "Thiền bên thiên nhiên",
        label: "Giữ nhịp thở chậm rãi",
    },
    {
        src: "/peacecorner.jpeg",
        alt: "Góc nhỏ an yên",
        label: "Một góc nhỏ an yên",
    },
    {
        src: "/yogainmorning.jpg",
        alt: "Yoga trong vườn",
        label: "Khởi đầu ngày mới nhẹ nhàng",
    },
    {
        src: "/hot-drink-arrangement-winter.jpg",
        alt: "Tách trà nóng",
        label: "Khoảnh khắc thư thái",
    },
];

export default function IntroSection() {
    const [headerRef, headerVisible] = useScrollAnimation();
    const [sliderRef, sliderVisible] = useScrollAnimation();
    const [cardsRef, cardsVisible] = useScrollAnimation();

    return (
        <section id="about" className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
            <div className="mx-auto max-w-7xl space-y-12">
                <div
                    ref={headerRef}
                    className={`mx-auto max-w-3xl space-y-4 text-center transition-all duration-700 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                >
                    <p className="inline-flex items-center rounded-full bg-sky-50 px-4 py-2 text-sm text-sky-700/80 font-medium">Bạn xứng đáng có một nơi an toàn</p>
                    <h2 className="text-3xl sm:text-4xl font-medium text-foreground leading-tight tracking-tight">
                        Chúng tôi tạo nên một góc nhỏ yên bình để bạn ghi lại cảm xúc, theo dõi hành trình và tìm lại sự cân bằng.
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Không chẩn đoán, không phán xét. Chỉ là sự lắng nghe, những lời nhắc nhẹ và một nhịp điệu chậm rãi để bạn trở về với chính mình.
                    </p>
                </div>

                <div
                    ref={sliderRef}
                    className={`relative overflow-hidden rounded-4xl border border-border/50 bg-card shadow-sm transition-all duration-700 delay-200 ${sliderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                >
                    <div className="absolute inset-0 bg-secondary/10" aria-hidden />

                    <Swiper
                        modules={[Autoplay, EffectCreative]}
                        autoplay={{ delay: 5000, disableOnInteraction: false }}
                        loop
                        effect="creative"
                        creativeEffect={{
                            prev: { shadow: false, translate: ['-5%', 0, -100], opacity: 0 },
                            next: { translate: ['5%', 0, -100], opacity: 0 },
                            limitProgress: 2,
                            shadowPerProgress: false,
                        }}
                        speed={1000}
                        className="relative h-80 sm:h-112.5 lg:h-125"
                    >
                        {SLIDE_IMAGES.map((slide) => (
                            <SwiperSlide key={slide.src}>
                                <div className="relative size-full overflow-hidden">
                                    <Image
                                        src={slide.src}
                                        alt={slide.alt}
                                        fill
                                        className="object-cover object-center"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1152px"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" aria-hidden />
                                    <div className="absolute left-6 bottom-6 rounded-full bg-white/90 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-foreground shadow-sm">
                                        {slide.label}
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                <div
                    ref={cardsRef}
                    className={`grid gap-5 md:grid-cols-3 transition-all duration-700 delay-300 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                >
                    {INTRO_POINTS.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <Card
                                key={item.title}
                                className={cn(
                                    'h-full rounded-2xl border-border bg-card p-8 text-center',
                                    'hover:shadow-xl hover:shadow-sky-900/5 hover:-translate-y-1',
                                    'transition-all duration-300',
                                    'animate-in slide-in-from-bottom-4 fade-in',
                                )}
                                style={{ animationDelay: `${cardsVisible ? i * 100 : 0}ms`, animationFillMode: 'both' }}
                            >
                                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-sky-50/80 text-sky-600">
                                    <Icon className="size-5" />
                                </div>
                                <h3 className="mt-5 text-xl font-medium text-foreground">{item.title}</h3>
                                <p className="mt-3 text-base text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: item.description }} />
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

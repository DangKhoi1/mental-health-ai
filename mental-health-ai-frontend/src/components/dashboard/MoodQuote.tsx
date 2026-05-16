'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useDailyMoodStore } from '@/stores';
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoodQuoteEntry {
    id: string;
    text: string;
    author: string;
}

type MoodCategory = 'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy';

const QUOTES_BY_MOOD: Record<MoodCategory, MoodQuoteEntry[]> = {
    very_sad: [
        { id: 'very_sad_1', text: 'Sau mỗi cơn bão, luôn có ánh nắng đang chờ phía sau.', author: 'Khuyết danh' },
        { id: 'very_sad_2', text: 'Ngay cả bóng tối nhất cũng sẽ kết thúc, và mặt trời sẽ mọc lên.', author: 'Victor Hugo' },
        { id: 'very_sad_3', text: 'Khó khăn chỉ là cơ hội để bạn khám phá sức mạnh tiềm ẩn trong chính mình.', author: 'Khuyết danh' },
        { id: 'very_sad_4', text: 'Bạn không thể kiểm soát mọi thứ xảy ra, nhưng bạn có thể kiểm soát cách bạn phản ứng với chúng.', author: 'Khuyết danh' },
    ],
    sad: [
        { id: 'sad_1', text: 'Hôm nay có thể khó khăn, nhưng bạn đã vượt qua những ngày khó khăn trước đây rồi.', author: 'Khuyết danh' },
        { id: 'sad_2', text: 'Hãy tử tế với bản thân — bạn đang cố gắng hết sức, và điều đó đã là đủ.', author: 'Khuyết danh' },
        { id: 'sad_3', text: 'Mỗi bước nhỏ về phía trước đều là một chiến thắng đáng trân trọng.', author: 'Khuyết danh' },
        { id: 'sad_4', text: 'Không sao cả khi bạn cần nghỉ ngơi. Nạp lại năng lượng cũng là một hành động dũng cảm.', author: 'Khuyết danh' },
    ],
    neutral: [
        { id: 'neutral_1', text: 'Ngày bình thường cũng là một ngày tuyệt vời để trân trọng những điều nhỏ bé.', author: 'Khuyết danh' },
        { id: 'neutral_2', text: 'Sự bình yên trong tâm trí là nền tảng của một cuộc sống hạnh phúc.', author: 'Khuyết danh' },
        { id: 'neutral_3', text: 'Hãy sống trọn vẹn từng khoảnh khắc — đó là bí quyết của niềm vui.', author: 'Thích Nhất Hạnh' },
        { id: 'neutral_4', text: 'Bạn không cần phải cảm thấy xuất sắc mỗi lúc. Bình thường cũng rất ổn.', author: 'Khuyết danh' },
    ],
    happy: [
        { id: 'happy_1', text: 'Hạnh phúc không phải điểm đến — đó là cách bạn đi trên hành trình.', author: 'Margaret Lee Runbeck' },
        { id: 'happy_2', text: 'Năng lượng tích cực của bạn là món quà bạn trao cho thế giới xung quanh.', author: 'Khuyết danh' },
        { id: 'happy_3', text: 'Một nụ cười bạn chia sẻ hôm nay có thể thắp sáng cả ngày của người khác.', author: 'Khuyết danh' },
        { id: 'happy_4', text: 'Tiếp tục tỏa sáng! Thế giới cần nhiều hơn ánh sáng như bạn.', author: 'Khuyết danh' },
    ],
    very_happy: [
        { id: 'very_happy_1', text: 'Khi bạn tràn đầy niềm vui, hãy chia sẻ nó — niềm vui nhân lên khi được trao đi.', author: 'Khuyết danh' },
        { id: 'very_happy_2', text: 'Đây là khoảnh khắc tuyệt vời — hãy lưu giữ cảm giác này trong tim bạn.', author: 'Khuyết danh' },
        { id: 'very_happy_3', text: 'Năng lượng bạn mang lại hôm nay có thể truyền cảm hứng cho cả những người xung quanh.', author: 'Khuyết danh' },
        { id: 'very_happy_4', text: 'Sống hết mình hôm nay — bạn xứng đáng với tất cả niềm vui này!', author: 'Khuyết danh' },
    ],
};

const MOOD_META: Record<MoodCategory, { label: string; emoji: string }> = {
    very_sad:  { label: 'Tâm trạng rất thấp',    emoji: '😢' },
    sad:       { label: 'Tâm trạng hơi buồn',     emoji: '😕' },
    neutral:   { label: 'Tâm trạng bình thường',  emoji: '😐' },
    happy:     { label: 'Tâm trạng vui vẻ',        emoji: '😊' },
    very_happy:{ label: 'Tâm trạng rất tốt',       emoji: '😄' },
};

function getMoodCategory(score: number): MoodCategory {
    if (score <= 2) return 'very_sad';
    if (score <= 4) return 'sad';
    if (score <= 6) return 'neutral';
    if (score <= 8) return 'happy';
    return 'very_happy';
}

function getDailySeed(): number {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

// Shuffle array based on daily seed so it changes each day but stays consistent
function shuffleForDay<T>(arr: T[], seed: number): T[] {
    const result = [...arr];
    let s = seed;
    for (let i = result.length - 1; i > 0; i--) {
        s = (s * 16807) % 2147483647;
        const j = s % (i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// Typing effect component for smooth text reveal
function TypingEffect({ text, onComplete }: { text: string; onComplete?: () => void }) {
    const [displayed, setDisplayed] = useState('');

    useEffect(() => {
        setDisplayed('');
        let i = 0;
        const timer = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) {
                clearInterval(timer);
                onComplete?.();
            }
        }, 40);
        return () => clearInterval(timer);
    }, [text, onComplete]);

    return (
        <span>
            {displayed}
            <span className="animate-pulse opacity-50 ml-0.5">|</span>
        </span>
    );
}

export default function MoodQuote() {
    const { moods } = useDailyMoodStore();
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const { quotes, meta } = useMemo(() => {
        const today = new Date();
        const todayMood = moods.find((m) => {
            const d = new Date(m.createdAt);
            return (
                d.getFullYear() === today.getFullYear() &&
                d.getMonth() === today.getMonth() &&
                d.getDate() === today.getDate()
            );
        });

        const latestMood = moods.length > 0
            ? moods.reduce((latest, m) =>
                new Date(m.createdAt) > new Date(latest.createdAt) ? m : latest
            )
            : null;

        const activeMood = todayMood ?? latestMood;
        const category = activeMood ? getMoodCategory(activeMood.moodScore) : 'neutral';
        const pool = QUOTES_BY_MOOD[category];
        const seed = getDailySeed();
        // Pick 3 unique quotes shuffled by day seed
        const shuffled = shuffleForDay(pool, seed);
        const selected = shuffled.slice(0, 3);

        return { quotes: selected, meta: MOOD_META[category] };
    }, [moods]);

    const goToNext = useCallback(() => {
        setIsTyping(true);
        setCurrentIdx((prev) => (prev + 1) % quotes.length);
    }, [quotes.length]);

    // Handle typing complete then auto-rotate
    const handleTypingComplete = useCallback(() => {
        setIsTyping(false);
        // Wait 4 seconds after typing finishes, then go to next
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(goToNext, 4000);
    }, [goToNext]);

    // Initial timer + rotation
    useEffect(() => {
        if (quotes.length <= 1) return;
        // Initial delay before first rotation
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(goToNext, 8000);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [quotes.length, goToNext]);

    // Reset index when quotes change
    useEffect(() => {
        setCurrentIdx(0);
        setIsTyping(true);
    }, [quotes]);

    const current = quotes[currentIdx] ?? quotes[0];
    const showAuthor = current.author.trim().toLowerCase() !== 'khuyết danh';

    return (
        <Card className="relative overflow-hidden rounded-3xl backdrop-blur-xl border border-primary/10 bg-gradient-to-br from-primary/[0.04] via-background to-violet-50/20 dark:from-primary/[0.06] dark:via-background dark:to-violet-950/20 shadow-md shadow-primary/5 transition-all duration-700 group/quote animate-in fade-in duration-700">
            {/* Glow */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none transition-all duration-1000 group-hover/quote:bg-primary/10" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-violet-400/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

            {/* Large faded quote icon */}
            <div className="absolute -top-8 -right-8 opacity-[0.04] group-hover/quote:opacity-[0.07] transition-opacity duration-1000 pointer-events-none">
                <Quote className="w-64 h-64 text-primary" />
            </div>

            <Quote className="absolute top-5 left-5 w-8 h-8 text-primary/10 rotate-180 pointer-events-none" />
            <Quote className="absolute bottom-5 right-5 w-8 h-8 text-primary/10 pointer-events-none" />

            <CardContent className="relative z-10 px-6 sm:px-10 py-8 sm:py-10 flex flex-col items-center justify-center">
                {/* Quote indicators */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                    {quotes.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => {
                                if (timerRef.current) clearTimeout(timerRef.current);
                                setCurrentIdx(i);
                                setIsTyping(true);
                            }}
                            className={cn(
                                'h-1.5 rounded-full transition-all duration-500 cursor-pointer',
                                i === currentIdx
                                    ? 'w-6 bg-primary/60'
                                    : 'w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40'
                            )}
                            aria-label={`Câu nói thứ ${i + 1}`}
                        />
                    ))}
                </div>

                {/* Quote text with typing effect */}
                <div className="w-full text-center">
                    <p className="text-foreground text-base sm:text-lg md:text-xl font-medium leading-relaxed italic drop-shadow-sm">
                        &ldquo;<TypingEffect text={current.text} onComplete={handleTypingComplete} />&rdquo;
                    </p>
                    {showAuthor && (
                        <p className="text-xs sm:text-sm font-semibold text-primary/70 mt-4 uppercase tracking-[0.2em]">
                            — {current.author} —
                        </p>
                    )}
                </div>

                {/* Mood badge */}
                <div className="mt-5 flex items-center justify-center gap-2 relative z-10">
                    <span className="inline-flex px-3.5 py-1.5 rounded-full bg-white/50 border border-white/60 text-[10px] font-bold text-primary/80 backdrop-blur-md uppercase tracking-widest items-center gap-1.5 shadow-sm transition-colors duration-300">
                        <span className="text-sm">{meta.emoji}</span> {meta.label}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

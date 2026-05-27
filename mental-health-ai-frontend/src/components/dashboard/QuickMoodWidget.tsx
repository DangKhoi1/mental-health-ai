'use client';

import { useMemo, useState } from 'react';
import { useDailyMoodStore } from '@/stores';
import { WorkloadLevel } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CheckCircle2, MessageSquarePlus, Activity, Briefcase, Sparkles, Leaf } from 'lucide-react';

const MOOD_OPTIONS = [
    { score: 2, emoji: '😢', label: 'Rất tệ',    bg: 'bg-red-50',    border: 'hover:border-red-300',    active: 'bg-red-100 border-red-300' },
    { score: 4, emoji: '😔', label: 'Không tốt',  bg: 'bg-orange-50', border: 'hover:border-orange-300', active: 'bg-orange-100 border-orange-300' },
    { score: 6, emoji: '😐', label: 'Bình thường', bg: 'bg-amber-50',  border: 'hover:border-amber-300',  active: 'bg-amber-100 border-amber-300' },
    { score: 8, emoji: '😊', label: 'Tốt',         bg: 'bg-emerald-50/60', border: 'hover:border-emerald-300', active: 'bg-emerald-100 border-emerald-300' },
    { score: 10, emoji: '😄', label: 'Rất tốt',    bg: 'bg-teal-50/60',   border: 'hover:border-teal-300',   active: 'bg-teal-100 border-teal-300' },
];

const WORKLOAD_OPTIONS = [
    { value: WorkloadLevel.LOW,    label: 'Nhẹ' },
    { value: WorkloadLevel.MEDIUM, label: 'Vừa' },
    { value: WorkloadLevel.HIGH,   label: 'Nặng' },
];

function snapToOption(score: number): number {
    const normalized = Math.round(score / 2) * 2;
    return Math.min(10, Math.max(2, normalized));
}

function toLocalDateKey(dateLike: string | Date): string {
    const d = new Date(dateLike);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getMoodColor(score: number | null) {
    if (!score) return 'text-muted-foreground';
    if (score <= 2) return 'text-red-500';
    if (score <= 4) return 'text-orange-500';
    if (score <= 6) return 'text-amber-500';
    if (score <= 8) return 'text-emerald-500';
    return 'text-teal-500';
}

function getMoodGradient(score: number | null) {
    if (!score) return 'from-slate-50 to-slate-100';
    if (score <= 2) return 'from-red-50 to-rose-50';
    if (score <= 4) return 'from-orange-50 to-amber-50';
    if (score <= 6) return 'from-amber-50 to-yellow-50';
    if (score <= 8) return 'from-emerald-50 to-teal-50';
    return 'from-teal-50 to-cyan-50';
}

export default function QuickMoodWidget() {
    const { moods, createMood, isSubmitting } = useDailyMoodStore();

    const todayMood = useMemo(() => {
        const today = toLocalDateKey(new Date());
        return moods.find((m) => toLocalDateKey(m.createdAt) === today) ?? null;
    }, [moods]);

    const [localSelected, setLocalSelected] = useState<number | null>(null);
    const [stressLevel, setStressLevel] = useState(5);
    const [workloadLevel, setWorkloadLevel] = useState<WorkloadLevel>(WorkloadLevel.MEDIUM);
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [note, setNote] = useState('');
    const [localSubmitted, setLocalSubmitted] = useState(false);
    const [showOptionalSections, setShowOptionalSections] = useState(false);

    const submitted = localSubmitted || todayMood !== null;
    const displayScore = localSelected ?? (todayMood ? snapToOption(todayMood.moodScore) : null);
    const selectedOption = MOOD_OPTIONS.find((o) => o.score === displayScore);
    const optionalVisible = showOptionalSections && !submitted && localSelected !== null;

    const handleSave = async () => {
        if (isSubmitting || submitted || localSelected === null) return;

        const success = await createMood({
            moodScore: localSelected,
            stressLevel,
            workloadLevel,
            note: note.trim(),
        });

        if (success) {
            setLocalSubmitted(true);
            setNote('');
            setStressLevel(5);
            setWorkloadLevel(WorkloadLevel.MEDIUM);
            setShowNoteInput(false);
            setShowOptionalSections(false);
            toast.success('Đã ghi nhận tâm trạng của bạn!');
        } else {
            toast.error('Không thể lưu tâm trạng. Vui lòng thử lại.');
        }
    };

    const gradient = getMoodGradient(displayScore);

    return (
        <div className={cn(
            'relative overflow-hidden rounded-3xl p-6 border border-border/40 backdrop-blur-xl transition-all duration-700',
            `bg-gradient-to-br ${gradient}`,
            'dark:from-slate-800/60 dark:to-slate-900/40',
            submitted ? 'shadow-sm' : 'shadow-sm hover:shadow-md',
            'animate-in fade-in slide-in-from-bottom-2 duration-500'
        )}>
            {/* Subtle background glow */}
            <div className={cn('absolute -top-8 -right-8 size-32 rounded-full blur-2xl opacity-30 pointer-events-none', gradient.split(' ')[1])} />
            <div className={cn('absolute -bottom-6 -left-6 size-24 rounded-full blur-2xl opacity-20 pointer-events-none', gradient.split(' ')[3])} />
            {/* Header */}
            <div className="flex items-center gap-3 mb-5 relative z-10">
                <div className="size-10 rounded-xl bg-white/80 dark:bg-slate-800 flex items-center justify-center shadow-sm border border-black/5 dark:border-white/10">
                    <Leaf className="size-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-foreground leading-tight">
                        {submitted ? 'Tâm trạng hôm nay' : 'Hôm nay bạn thế nào?'}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        {submitted ? 'Cảm ơn bạn đã ghi nhận cảm xúc' : 'Chọn một biểu tượng phản ánh cảm xúc của bạn'}
                    </p>
                </div>
            </div>

            {submitted ? (
                /* Submitted State */
                <div className="flex flex-col items-center gap-3 py-2">
                    <span className="text-5xl leading-none select-none">{selectedOption?.emoji}</span>
                    <div className={cn('flex items-center gap-1.5 font-semibold', getMoodColor(displayScore))}>
                        <CheckCircle2 className="size-4 shrink-0" />
                        <span className="text-sm">{selectedOption?.label}</span>
                    </div>
                    {(todayMood?.note || '').trim() && (
                        <div className="w-full rounded-xl bg-white/60 dark:bg-slate-800/60 px-4 py-3 text-center text-sm text-foreground/80 border border-black/5 dark:border-white/10">
                            &ldquo;{todayMood?.note}&rdquo;
                        </div>
                    )}
                </div>
            ) : (
                /* Mood Selection State */
                <div className="space-y-4">
                    {/* Mood Emoji Grid */}
                    <div className="grid grid-cols-5 gap-2">
                        {MOOD_OPTIONS.map((opt) => (
                            <button
                                key={opt.score}
                                type="button"
                                data-active={localSelected === opt.score}
                                onClick={() => {
                                    setLocalSelected(opt.score);
                                    setShowOptionalSections(true);
                                }}
                                disabled={isSubmitting}
                                className={cn(
                                    'flex flex-col items-center gap-1.5 rounded-2xl border-2 px-1 py-3 transition-all duration-200 disabled:cursor-wait disabled:opacity-60',
                                    localSelected === opt.score
                                        ? opt.active
                                        : cn('border-transparent', opt.bg, opt.border),
                                    localSelected === opt.score && 'scale-105 shadow-sm'
                                )}
                            >
                                <span className="text-2xl leading-none select-none">{opt.emoji}</span>
                                <span className="text-[10px] font-medium leading-none text-muted-foreground whitespace-nowrap">{opt.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Optional Sections */}
                    {optionalVisible && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            {/* Note + Stress row */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Note */}
                                <button
                                    type="button"
                                    onClick={() => setShowNoteInput((prev) => !prev)}
                                    className={cn(
                                        'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors',
                                        showNoteInput
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-white/60 dark:bg-slate-800/60 border-border/80 text-foreground hover:bg-white/80 dark:hover:bg-slate-800/80'
                                    )}
                                >
                                    <MessageSquarePlus className="size-3.5 shrink-0" />
                                    Ghi chú
                                </button>

                                {/* Stress Badge */}
                                <div className="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-white/60 dark:bg-slate-800/60 px-3 py-2">
                                    <div className="flex items-center gap-1.5">
                                        <Activity className="size-3.5 text-orange-500 shrink-0" />
                                        <span className="text-xs font-medium text-foreground">Stress</span>
                                    </div>
                                    <span className="rounded-full bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-300">
                                        {stressLevel}
                                    </span>
                                </div>
                            </div>

                            {/* Note Input */}
                            {showNoteInput && (
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value.slice(0, 120))}
                                    rows={1}
                                    maxLength={120}
                                    className="w-full resize-none rounded-xl border border-border/80 bg-white/80 dark:bg-slate-800/80 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/30 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/50"
                                    placeholder="Ghi chú ngắn về cảm xúc của bạn…"
                                />
                            )}

                            {/* Stress Slider */}
                            <div className="space-y-2">
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    step="1"
                                    value={stressLevel}
                                    onChange={(e) => setStressLevel(parseInt(e.target.value, 10))}
                                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-orange-100 to-red-100 accent-orange-500"
                                />
                                <div className="flex justify-between px-0.5">
                                    <span className="text-[10px] text-emerald-500">Thư giãn</span>
                                    <span className="text-[10px] text-red-500">Căng thẳng</span>
                                </div>
                            </div>

                            {/* Workload */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Briefcase className="size-3.5 text-blue-500 shrink-0" />
                                    <span className="text-xs font-medium text-foreground">Công việc</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {WORKLOAD_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setWorkloadLevel(opt.value)}
                                            className={cn(
                                                'rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200',
                                                workloadLevel === opt.value
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                                                    : 'border-border/80 bg-white/60 dark:bg-slate-800/60 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Check-in Button */}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSubmitting || localSelected === null}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
                    >
                        <Sparkles className="size-4" />
                        {isSubmitting ? 'Đang lưu…' : 'Check-in tâm trạng'}
                    </button>
                </div>
            )}

            {/* Footer hint */}
            <div className="mt-4 flex justify-center w-full">
                <p className="text-[11px] text-muted-foreground/70 leading-relaxed text-center w-full max-w-[260px] break-words">
                    {submitted
                        ? 'Có thể xem lại đánh giá chi tiết tại mục Tâm Trạng hằng ngày'
                        : 'Check-in nhanh mỗi ngày giúp bạn hiểu rõ hơn về cảm xúc của bản thân'}
                </p>
            </div>
        </div>
    );
}

'use client';

import { CreateDailyMoodDto, WorkloadLevel } from '@/types';
import { cn } from '@/lib/utils';
import { Smile, Activity, Briefcase, FileText, Send } from 'lucide-react';

const getMoodConfig = (score: number) => {
    if (score <= 2) return { emoji: '😢', label: 'Rất tệ', color: 'text-rose-500', bgFrom: 'from-rose-500/10', bgTo: 'to-rose-500/5', accent: 'bg-rose-500/20' };
    if (score <= 4) return { emoji: '😔', label: 'Không tốt', color: 'text-orange-500', bgFrom: 'from-orange-500/10', bgTo: 'to-orange-500/5', accent: 'bg-orange-500/20' };
    if (score <= 6) return { emoji: '😐', label: 'Bình thường', color: 'text-amber-500', bgFrom: 'from-amber-500/15', bgTo: 'to-amber-500/5', accent: 'bg-amber-500/25' };
    if (score <= 8) return { emoji: '😊', label: 'Tốt', color: 'text-emerald-500', bgFrom: 'from-emerald-500/20', bgTo: 'to-emerald-500/5', accent: 'bg-emerald-500/30' };
    return { emoji: '😄', label: 'Rất tốt', color: 'text-teal-500', bgFrom: 'from-teal-500/25', bgTo: 'to-teal-500/5', accent: 'bg-teal-500/40' };
};

const workloadOptions = [
    { value: WorkloadLevel.LOW, label: 'Nhẹ nhàng', emoji: '🌿', description: 'Ít áp lực' },
    { value: WorkloadLevel.MEDIUM, label: 'Vừa phải', emoji: '⚖️', description: 'Cân bằng' },
    { value: WorkloadLevel.HIGH, label: 'Nặng nề', emoji: '🔥', description: 'Áp lực cao' },
];

interface DailyMoodFormProps {
    formData: CreateDailyMoodDto;
    setFormData: (data: CreateDailyMoodDto) => void;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}

export default function DailyMoodForm({ formData, setFormData, onSubmit, isSubmitting }: DailyMoodFormProps) {
    const moodConfig = getMoodConfig(formData.moodScore);
    return (
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            {/* Header with gradient */}
            <div className={cn("px-6 md:px-8 pt-8 pb-6 bg-linear-to-br", moodConfig.bgFrom, moodConfig.bgTo, "transition-colors duration-500")}>
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
                        <Smile className="size-5 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Nhật ký cảm xúc</h2>
                        <p className="text-sm text-muted-foreground">Hãy lắng nghe bản thân hôm nay</p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit} className="p-6 md:p-8 space-y-8">
                {/* Mood Score ,  Large emoji + slider */}
                <div className="text-center space-y-5">
                    <div className="inline-flex flex-col items-center gap-2">
                        <span className="text-6xl transition-all duration-300 drop-shadow-sm">{moodConfig.emoji}</span>
                        <span className={cn("text-lg font-bold transition-colors duration-300", moodConfig.color)}>
                            {moodConfig.label}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                            {formData.moodScore}/10
                        </span>
                    </div>

                    <div className="relative max-w-md mx-auto">
                        <input
                            type="range" min="1" max="10" step="1"
                            value={formData.moodScore}
                            onChange={(e) => setFormData({ ...formData, moodScore: parseInt(e.target.value) })}
                            className="w-full h-2.5 rounded-full appearance-none cursor-pointer accent-emerald-500 bg-secondary"
                        />
                        <div className="flex justify-between mt-2 text-[11px] font-medium text-muted-foreground/60">
                            <span>Rất tệ</span>
                            <span>Rất tốt</span>
                        </div>
                    </div>
                </div>

                {/* Stress + Workload ,  Side by side cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Stress */}
                    <div className="bg-emerald-500/5 rounded-2xl p-5 space-y-4 border border-emerald-500/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="size-4 text-emerald-500" />
                                <span className="text-sm font-semibold text-foreground">Căng thẳng</span>
                            </div>
                            <span className="text-xs font-bold bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                {formData.stressLevel}/10
                            </span>
                        </div>
                        <input
                            type="range" min="1" max="10"
                            value={formData.stressLevel}
                            onChange={(e) => setFormData({ ...formData, stressLevel: parseInt(e.target.value) })}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-emerald-500 bg-emerald-500/10"
                        />
                    </div>

                    {/* Workload ,  Pill buttons */}
                    <div className="bg-emerald-500/5 rounded-2xl p-5 space-y-4 border border-emerald-500/10">
                        <div className="flex items-center gap-2">
                            <Briefcase className="size-4 text-emerald-500" />
                            <span className="text-sm font-semibold text-foreground">Công việc</span>
                        </div>
                        <div className="flex gap-2">
                            {workloadOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, workloadLevel: opt.value })}
                                    className={cn(
                                        "flex-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border",
                                        formData.workloadLevel === opt.value
                                            ? "bg-emerald-500 text-primary-foreground border-emerald-500 shadow-md shadow-emerald-500/20 scale-[1.02]"
                                            : "bg-background text-muted-foreground border-border hover:border-emerald-500/30"
                                    )}
                                >
                                    <span className="block text-base mb-0.5">{opt.emoji}</span>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Note */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <FileText className="size-4 text-emerald-500" />
                        <label htmlFor="mood-note" className="text-sm font-semibold text-foreground">Ghi chú thêm</label>
                    </div>
                    <textarea
                        id="mood-note"
                        value={formData.note || ''}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        rows={3}
                        maxLength={500}
                        className="w-full px-4 py-3.5 bg-secondary/20 border border-transparent rounded-2xl focus:bg-background focus:border-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 text-foreground placeholder:text-muted-foreground/50 resize-none transition-all duration-200"
                        placeholder="Hôm nay có điều gì đặc biệt xảy ra không?"
                    />
                    <div className="text-right text-xs text-muted-foreground/60 px-1">
                        <span>{(formData.note || '').length}/500</span>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-emerald-500 text-primary-foreground rounded-2xl font-semibold text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                >
                    {isSubmitting ? (
                        <>
                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Đang lưu…
                        </>
                    ) : (
                        <>
                            <Send className="size-4" />
                            Lưu tâm trạng
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

'use client';

import { useMemo } from 'react';
import { CreateSleepLogDto } from '@/types';
import { Moon, Sun, Star, AlignLeft, Calendar, Send, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

const TimeSelect = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
    const [hr, min] = value ? value.split(':') : ['22', '00'];

    return (
        <div className="flex items-center w-full">
            <Select value={hr} onValueChange={(h) => onChange(`${h}:${min}`)}>
                <SelectTrigger className="flex-1 border-none shadow-none focus:ring-0 bg-transparent font-semibold text-lg px-2 h-12 justify-center text-center [&>svg]:hidden">
                    <SelectValue placeholder="Giờ" />
                </SelectTrigger>
                <SelectContent className="min-w-16">
                    {Array.from({ length: 24 }).map((_, i) => {
                        const v = i.toString().padStart(2, '0');
                        return <SelectItem key={v} value={v}>{v}</SelectItem>;
                    })}
                </SelectContent>
            </Select>
            <span className="text-lg font-bold opacity-40 -mx-1">:</span>
            <Select value={min} onValueChange={(m) => onChange(`${hr}:${m}`)}>
                <SelectTrigger className="flex-1 border-none shadow-none focus:ring-0 bg-transparent font-semibold text-lg px-2 h-12 justify-center text-center [&>svg]:hidden">
                    <SelectValue placeholder="Phút" />
                </SelectTrigger>
                <SelectContent className="min-w-16">
                    {Array.from({ length: 60 }).map((_, i) => {
                        const v = i.toString().padStart(2, '0');
                        return <SelectItem key={v} value={v}>{v}</SelectItem>;
                    })}
                </SelectContent>
            </Select>
        </div>
    );
};

const getQualityConfig = (score: number) => {
    if (score >= 8) return { label: 'Tuyệt vời', emoji: '🌟', color: 'text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    if (score >= 6) return { label: 'Khá tốt', emoji: '😊', color: 'text-sky-500', badge: 'bg-sky-500/15 text-sky-500 border-sky-500/20' };
    if (score >= 4) return { label: 'Tạm được', emoji: '😐', color: 'text-amber-500', badge: 'bg-amber-500/20 text-amber-500 border-amber-500/20' };
    return { label: 'Không tốt', emoji: '😴', color: 'text-rose-500', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
};

interface SleepLogFormProps {
    formData: CreateSleepLogDto;
    setFormData: (data: CreateSleepLogDto) => void;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}

function removeNapFields(data: CreateSleepLogDto): CreateSleepLogDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { napStartTime, napEndTime, ...rest } = data;
    return rest;
}

export default function SleepLogForm({ formData, setFormData, onSubmit, isSubmitting }: SleepLogFormProps) {
    const noteValue = formData.sleepNote || '';
    const hasNap = useMemo(() => !!formData.napStartTime && !!formData.napEndTime, [formData.napStartTime, formData.napEndTime]);
    const qualityConfig = getQualityConfig(formData.sleepQualityScore);

    const toggleNap = () => {
        if (hasNap) {
            // Turn off nap - remove time fields
            setFormData(removeNapFields(formData));
        } else {
            // Turn on nap - set default times (12:00 to 13:00 for nap slot)
            setFormData({
                ...formData,
                napStartTime: '12:00',
                napEndTime: '13:00',
            });
        }
    };

    return (
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 md:px-8 pt-8 pb-6 bg-linear-to-br from-indigo-500/10 to-indigo-500/5">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
                        <Moon className="size-5 text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Ghi nhận giấc ngủ</h2>
                        <p className="text-sm text-muted-foreground">Chúc bạn có một ngày mới năng lượng!</p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit} className="p-6 md:p-8 space-y-7">
                {/* Nap is optional tracking within the same day */}
                <div className="rounded-2xl border border-dashed border-indigo-500/20 bg-indigo-500/5 p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Sun className="size-4 text-indigo-500" />
                                Ngủ trưa (giấc ngủ phụ)
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Theo dõi thêm giấc ngủ trưa nếu có.</p>
                        </div>
                        <button
                            type="button"
                            onClick={toggleNap}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-background px-3 py-1.5 text-sm font-medium text-indigo-500 hover:bg-indigo-500/5 transition-colors"
                        >
                            <Plus className="size-4" />
                            {hasNap ? 'Bỏ ghi chú ngủ trưa' : 'Thêm giấc ngủ trưa'}
                        </button>
                    </div>

                    {/* Nap time inputs */}
                    {hasNap && (
                        <div className="mt-4 pt-4 border-t border-indigo-500/20 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-background rounded-xl p-4 space-y-2 border border-indigo-500/10">
                                    <label className="text-xs font-semibold text-foreground">Giờ vào ngủ trưa</label>
                                    <div className="w-full bg-background border border-indigo-500/10 rounded-xl focus-within:border-indigo-500/30 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all overflow-hidden">
                                        <TimeSelect
                                            value={formData.napStartTime || '12:00'}
                                            onChange={(val) => setFormData({ ...formData, napStartTime: val })}
                                        />
                                    </div>
                                </div>

                                <div className="bg-background rounded-xl p-4 space-y-2 border border-indigo-500/10">
                                    <label className="text-xs font-semibold text-foreground">Giờ thức dậy từ giấc trưa</label>
                                    <div className="w-full bg-background border border-indigo-500/10 rounded-xl focus-within:border-indigo-500/30 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all overflow-hidden">
                                        <TimeSelect
                                            value={formData.napEndTime || '13:00'}
                                            onChange={(val) => setFormData({ ...formData, napEndTime: val })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Date */}
                <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="size-4 text-violet-500" />
                        Ngày ngủ
                    </label>
                    <DatePicker
                        value={formData.sleepDate}
                        onChange={(val) => setFormData({ ...formData, sleepDate: val })}
                        className="w-full h-13 bg-secondary/20 border-transparent focus:bg-background focus:border-indigo-500/20 focus:ring-2 focus:ring-indigo-500/10 font-medium text-base shadow-none"
                    />
                </div>

                {/* Bed + Wake time ,  Side by side cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-indigo-500/5 rounded-2xl p-5 space-y-3 border border-indigo-500/10">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Moon className="size-4 text-indigo-500" />
                            Giờ đi ngủ
                        </label>
                        <div className="w-full bg-background border border-indigo-500/10 rounded-xl focus-within:border-indigo-500/30 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all text-foreground overflow-hidden">
                            <TimeSelect
                                value={formData.bedTime}
                                onChange={(val) => setFormData({ ...formData, bedTime: val })}
                            />
                        </div>
                    </div>

                    <div className="bg-indigo-500/5 rounded-2xl p-5 space-y-3 border border-indigo-500/10">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Sun className="size-4 text-indigo-500" />
                            Giờ thức dậy
                        </label>
                        <div className="w-full bg-background border border-indigo-500/10 rounded-xl focus-within:border-indigo-500/30 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all text-foreground overflow-hidden">
                            <TimeSelect
                                value={formData.wakeUpTime}
                                onChange={(val) => setFormData({ ...formData, wakeUpTime: val })}
                            />
                        </div>
                    </div>
                </div>

                {/* Sleep Quality */}
                <div className="bg-indigo-500/5 rounded-2xl p-6 space-y-5 border border-indigo-500/10">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Star className="size-4 text-indigo-500" />
                            Chất lượng giấc ngủ
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{qualityConfig.emoji}</span>
                            <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", qualityConfig.badge)}>
                                {formData.sleepQualityScore}/10 · {qualityConfig.label}
                            </span>
                        </div>
                    </div>

                    <input
                        type="range" min="1" max="10"
                        value={formData.sleepQualityScore}
                        onChange={(e) => setFormData({ ...formData, sleepQualityScore: parseInt(e.target.value) })}
                        className="w-full h-2.5 rounded-full appearance-none cursor-pointer accent-indigo-500 bg-indigo-500/10"
                    />
                    <div className="flex justify-between text-[11px] font-medium text-muted-foreground/60">
                        <span>Rất tệ</span>
                        <span>Bình thường</span>
                        <span>Tuyệt vời</span>
                    </div>
                </div>

                {/* Note */}
                <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <AlignLeft className="size-4 text-muted-foreground" />
                        Ghi chú
                        <span className="text-xs text-muted-foreground/60 font-normal">()</span>
                    </label>
                    <textarea
                        value={formData.sleepNote || ''}
                        onChange={(e) => setFormData({ ...formData, sleepNote: e.target.value })}
                        rows={3}
                        maxLength={500}
                        className="w-full px-4 py-3.5 bg-secondary/20 border border-transparent rounded-2xl focus:bg-background focus:border-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none placeholder:text-muted-foreground/50"
                        placeholder="Bạn có gặp ác mộng, hay thức giấc giữa đêm không?"
                    />
                    <div className="text-right text-xs text-muted-foreground/60 px-1">
                        <span>{(formData.sleepNote || '').length}/500</span>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-indigo-500 text-primary-foreground rounded-2xl font-semibold text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                >
                    {isSubmitting ? (
                        <>
                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Đang lưu…
                        </>
                    ) : (
                        <>
                            <Send className="size-4" />
                            Lưu giấc ngủ
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

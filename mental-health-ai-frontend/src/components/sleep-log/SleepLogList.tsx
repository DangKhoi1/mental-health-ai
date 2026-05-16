'use client';

import { SleepLog } from '@/types';
import SleepLogListSkeleton from './SleepLogListSkeleton';
import { Trash2, Moon, Clock, Star, Sunrise, Sunset, Timer, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

const getTheme = (score: number) => {
    if (score >= 8) return { glow: 'bg-emerald-500/10', gradient: 'from-emerald-500/10 via-transparent to-emerald-500/5', shadow: 'hover:shadow-emerald-500/10', card: 'border-emerald-500/20 bg-emerald-500/5', badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500', subBadge: 'border-emerald-500/20 bg-emerald-500/5 text-muted-foreground', button: 'border-emerald-500/20 bg-emerald-500/5 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500', icon: 'text-emerald-500', activeBg: 'bg-emerald-500/20', bar: 'from-emerald-500 via-emerald-500/80 to-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.35)]', dayText: 'text-emerald-500/80', dateBox: 'border-emerald-500/20 bg-emerald-500/5', textVal: 'text-emerald-500' };
    if (score >= 6) return { glow: 'bg-sky-500/10', gradient: 'from-sky-500/10 via-transparent to-sky-500/5', shadow: 'hover:shadow-sky-500/10', card: 'border-sky-500/20 bg-sky-500/5', badge: 'border-sky-500/20 bg-sky-500/10 text-sky-500', subBadge: 'border-sky-500/20 bg-sky-500/5 text-muted-foreground', button: 'border-sky-500/20 bg-sky-500/5 text-muted-foreground hover:bg-sky-500/10 hover:text-sky-500', icon: 'text-sky-500', activeBg: 'bg-sky-500/20', bar: 'from-sky-500 via-sky-500/80 to-sky-500/60 shadow-[0_0_12px_rgba(14,165,233,0.35)]', dayText: 'text-sky-500/80', dateBox: 'border-sky-500/20 bg-sky-500/5', textVal: 'text-sky-500' };
    if (score >= 4) return { glow: 'bg-amber-500/10', gradient: 'from-amber-500/10 via-transparent to-amber-500/5', shadow: 'hover:shadow-amber-500/10', card: 'border-amber-500/20 bg-amber-500/5', badge: 'border-amber-500/20 bg-amber-500/10 text-amber-500', subBadge: 'border-amber-500/20 bg-amber-500/5 text-muted-foreground', button: 'border-amber-500/20 bg-amber-500/5 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500', icon: 'text-amber-500', activeBg: 'bg-amber-500/20', bar: 'from-amber-500 via-amber-500/80 to-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.35)]', dayText: 'text-amber-500/80', dateBox: 'border-amber-500/20 bg-amber-500/5', textVal: 'text-amber-500' };
    return { glow: 'bg-rose-500/10', gradient: 'from-rose-500/10 via-transparent to-rose-500/5', shadow: 'hover:shadow-rose-500/10', card: 'border-rose-500/20 bg-rose-500/5', badge: 'border-rose-500/20 bg-rose-500/10 text-rose-500', subBadge: 'border-rose-500/20 bg-rose-500/5 text-muted-foreground', button: 'border-rose-500/20 bg-rose-500/5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500', icon: 'text-rose-500', activeBg: 'bg-rose-500/20', bar: 'from-rose-500 via-rose-500/80 to-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.35)]', dayText: 'text-rose-500/80', dateBox: 'border-rose-500/20 bg-rose-500/5', textVal: 'text-rose-500' };
};

const getQualityLabel = (score: number) => {
    if (score >= 8) return 'Tốt';
    if (score >= 6) return 'Khá';
    if (score >= 4) return 'Trung bình';
    return 'Thấp';
};

const formatDuration = (durationInHours: number) => {
    const hours = Math.floor(durationInHours);
    const mins = Math.round((durationInHours - hours) * 60);
    return `${hours} giờ ${mins > 0 ? `${mins} phút` : ''}`;
};

// Hàm tính toán phần trăm cho Visual Timeline (từ 18:00 tới 12:00 trưa hôm sau = 18 tiếng)
const getTimelineStyle = (bedTime: Date, wakeTime: Date) => {
    let bedH = bedTime.getHours() + bedTime.getMinutes() / 60;
    let wakeH = wakeTime.getHours() + wakeTime.getMinutes() / 60;

    // Nếu giờ đi ngủ sau nửa đêm nhưng trước 18h (ví dụ 1h sáng), cộng thêm 24
    if (bedH < 18) bedH += 24;
    // Nếu thức dậy nhỏ hơn giờ ngủ hoặc nằm trong khoảng nửa đêm tới 12h trưa
    if (wakeH < 18 && wakeH <= bedH - 24) wakeH += 24;
    else if (wakeH < bedH) wakeH += 24;

    const timelineStart = 18; // 18:00
    const timelineDuration = 18; // 18 tiếng = tới 12:00 trưa

    const startPercent = Math.max(0, Math.min(100, ((bedH - timelineStart) / timelineDuration) * 100));
    const endPercent = Math.max(0, Math.min(100, ((wakeH - timelineStart) / timelineDuration) * 100));
    const widthPercent = Math.max(2, endPercent - startPercent); // tối thiểu 2% để hiển thị bar

    return { left: `${startPercent}%`, width: `${widthPercent}%` };
};

interface SleepLogListProps {
    sleepLogs: SleepLog[];
    isLoading: boolean;
    onDelete: (id: string) => void;
    onSelect: (log: SleepLog) => void;
    onEdit: (log: SleepLog) => void;
}

export default function SleepLogList({ sleepLogs, isLoading, onDelete, onSelect, onEdit }: SleepLogListProps) {
    if (isLoading) {
        return <SleepLogListSkeleton />;
    }

    if (sleepLogs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card rounded-3xl border border-border shadow-sm">
                <div className="w-20 h-20 mb-6 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <Moon className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                    Chưa có dữ liệu giấc ngủ
                </h3>
                <p className="text-muted-foreground max-w-xs mx-auto mb-6">
                    Theo dõi giấc ngủ giúp cải thiện sức khỏe và tinh thần của bạn.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {sleepLogs.map((log) => {
                const date = new Date(log.sleepDate);
                const bedTime = new Date(log.bedTime);
                const wakeTime = new Date(log.wakeUpTime);
                const napStartTime = log.napStartTime ? new Date(log.napStartTime) : null;
                const napEndTime = log.napEndTime ? new Date(log.napEndTime) : null;
                const qualityLabel = getQualityLabel(log.sleepQualityScore);
                const isToday = new Date().toDateString() === new Date(log.createdAt).toDateString();
                const theme = getTheme(log.sleepQualityScore);

                return (
                    <div
                        key={log.sleepLogId}
                        onClick={() => onSelect(log)}
                        className={cn("group relative overflow-hidden rounded-3xl border border-border bg-card text-foreground shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer", theme.shadow)}
                    >
                        <div className={cn("absolute inset-0 bg-linear-to-br pointer-events-none", theme.gradient)} />
                        <div className={cn("absolute -top-16 -right-16 h-52 w-52 rounded-full blur-3xl pointer-events-none", theme.glow)} />

                        <div className="relative p-5 md:p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn("rounded-2xl border px-3 py-2 text-center min-w-18", theme.dateBox)}>
                                        <p className="text-2xl font-bold leading-none">{date.getDate()}</p>
                                        <p className={cn("text-[11px] uppercase tracking-wider mt-1", theme.dayText)}>Tháng {date.getMonth() + 1}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Nhật ký giấc ngủ</p>
                                        <p className="text-base font-semibold">{date.toLocaleDateString('vi-VN', { weekday: 'long' })}</p>
                                        {isToday && (
                                            <span className={cn("mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold", theme.badge)}>Hôm nay</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold", theme.badge)}>
                                        <Star className="w-3.5 h-3.5" />
                                        {log.sleepQualityScore}/10 · {qualityLabel}
                                    </div>
                                    {isToday ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(log);
                                            }}
                                            className={cn("rounded-xl border p-2 transition", theme.button)}
                                            title="Sửa bản ghi (Chỉ trong ngày)"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(log.sleepLogId);
                                            }}
                                            className={cn("rounded-xl border p-2 transition", theme.button)}
                                            title="Xóa bản ghi"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <div className={cn("rounded-2xl border p-3", theme.card)}>
                                    <p className={cn("text-[11px] flex items-center gap-1.5", theme.dayText)}><Sunset className="w-3.5 h-3.5" />Đi ngủ</p>
                                    <p className="mt-1 text-lg font-semibold">{bedTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className={cn("rounded-2xl border p-3", theme.card)}>
                                    <p className={cn("text-[11px] flex items-center gap-1.5", theme.dayText)}><Sunrise className="w-3.5 h-3.5" />Thức dậy</p>
                                    <p className="mt-1 text-lg font-semibold">{wakeTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className={cn("rounded-2xl border p-3", theme.card)}>
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" />Thời lượng</p>
                                    <p className="mt-1 text-lg font-semibold">{formatDuration(log.duration)}</p>
                                </div>
                                <div className={cn("rounded-2xl border p-3", theme.card)}>
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Moon className="w-3.5 h-3.5" />Điểm sức khỏe</p>
                                    <p className="mt-1 text-lg font-semibold">{Math.round(log.sleepHealthScore)}/100</p>
                                </div>
                            </div>

                            <div className={cn("mt-5 rounded-2xl border p-3", theme.card)}>
                                <div className="relative h-8">
                                    <div className={cn("absolute top-2 w-full h-2 rounded-full overflow-hidden", theme.glow)}>
                                        <div className={cn("absolute inset-y-0 left-0 w-[40%]", theme.activeBg)} />
                                    </div>
                                    <div
                                        className={cn("absolute top-1.5 h-3 rounded-full bg-linear-to-r", theme.bar)}
                                        style={getTimelineStyle(bedTime, wakeTime)}
                                    >
                                        <div className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white ml-1" />
                                        <div className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white mr-1" />
                                    </div>
                                    <div className="absolute top-5 w-full flex justify-between text-[10px] font-semibold text-muted-foreground px-1">
                                        <span>18:00</span>
                                        <span>00:00</span>
                                        <span>06:00</span>
                                        <span>12:00</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                                {(napStartTime && napEndTime) ? (
                                    <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", theme.badge)}>
                                        <Clock className="w-3.5 h-3.5" />
                                        Ngủ trưa {napStartTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {napEndTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                ) : (
                                    <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium", theme.subBadge)}>
                                        Không có giấc ngủ trưa
                                    </div>
                                )}

                                <p className="min-w-0 flex-1 text-sm italic text-muted-foreground line-clamp-1">
                                    {log.sleepNote || 'Không có ghi chú thêm'}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}


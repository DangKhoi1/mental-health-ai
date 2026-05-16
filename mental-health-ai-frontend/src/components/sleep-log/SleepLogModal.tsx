'use client';

import { SleepLog } from '@/types';
import { createPortal } from 'react-dom';
import { X, Moon, Bed, Sunrise, Clock, Star, Heart, FileText } from 'lucide-react';

const getQualityColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 4) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
};

const getQualityLabel = (score: number) => {
    if (score >= 8) return 'Tốt';
    if (score >= 6) return 'Khá';
    if (score >= 4) return 'Trung bình';
    return 'Kém';
};

const formatDuration = (durationInHours: number) => {
    const hours = Math.floor(durationInHours);
    const mins = Math.round((durationInHours - hours) * 60);
    return `${hours} giờ ${mins} phút`;
};

interface SleepLogModalProps {
    sleepLog: SleepLog | null;
    onClose: () => void;
}

export default function SleepLogModal({ sleepLog, onClose }: SleepLogModalProps) {
    if (!sleepLog) return null;
    if (typeof document === 'undefined') return null;

    const qualityLabel = getQualityLabel(sleepLog.sleepQualityScore);
    const napStartTime = sleepLog.napStartTime ? new Date(sleepLog.napStartTime) : null;
    const napEndTime = sleepLog.napEndTime ? new Date(sleepLog.napEndTime) : null;

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-border"
                onClick={(e) => e.stopPropagation()}
            >
                { }
                <div className="relative bg-secondary/30 p-4 sm:p-6 border-b border-border">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-card shadow-sm flex items-center justify-center text-indigo-500 shrink-0 backdrop-blur-sm border border-border">
                                <Moon className="w-8 h-8" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg sm:text-2xl font-bold text-foreground flex flex-wrap items-center gap-2">
                                    Giấc ngủ
                                    <span className="text-sm font-normal text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full border border-border">
                                        {new Date(sleepLog.sleepDate).toLocaleDateString('vi-VN')}
                                    </span>
                                </h2>
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        <span>
                                            {formatDuration(sleepLog.duration)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-4 h-4" />
                                        <span>Chất lượng: {qualityLabel}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-background/50 hover:bg-background text-muted-foreground hover:text-destructive rounded-lg transition-colors shadow-sm backdrop-blur-sm border border-transparent hover:border-border"
                            aria-label="Đóng"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                { }
                <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-card">

                    { }
                    <div className="bg-secondary/20 rounded-xl p-4 sm:p-5 border border-secondary/50 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center border border-secondary">
                                    <Bed className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div>
                                    <div className="text-xs text-indigo-500 font-medium uppercase tracking-wider">
                                        Đi ngủ
                                    </div>
                                    <div className="text-lg font-bold text-foreground">
                                        {new Date(sleepLog.bedTime).toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="h-px bg-border flex-1 mx-0 sm:mx-6 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-indigo-500">
                                    <Moon className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-100/50 flex items-center justify-center border border-orange-100">
                                    <Sunrise className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-orange-600 font-medium uppercase tracking-wider">
                                        Thức dậy
                                    </div>
                                    <div className="text-lg font-bold text-foreground">
                                        {new Date(sleepLog.wakeUpTime).toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    { }
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-muted/20 rounded-xl border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground font-medium mb-1">
                                <Star className="w-4 h-4" />
                                Điểm chất lượng
                            </div>
                            <div className={`text-2xl font-bold ${getQualityColor(sleepLog.sleepQualityScore)}`}>
                                {sleepLog.sleepQualityScore}/10
                            </div>
                        </div>
                        {sleepLog.sleepHealthScore && (
                            <div className="p-4 bg-muted/20 rounded-xl border border-border">
                                <div className="flex items-center gap-2 text-muted-foreground font-medium mb-1">
                                    <Heart className="w-4 h-4" />
                                    Điểm sức khỏe
                                </div>
                                <div className={`text-2xl font-bold ${getQualityColor(sleepLog.sleepHealthScore / 10)}`}>
                                    {sleepLog.sleepHealthScore}/100
                                </div>
                            </div>
                        )}
                    </div>

                    {(napStartTime && napEndTime) && (
                        <div className="mb-6 p-4 bg-amber-50/60 dark:bg-amber-500/10 rounded-xl border border-amber-200/70 dark:border-amber-500/20">
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold mb-1">
                                <Clock className="w-4 h-4" />
                                Giấc ngủ trưa
                            </div>
                            <div className="text-sm text-foreground">
                                {napStartTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                {' - '}
                                {napEndTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    )}

                    { }
                    <div className="prose dark:prose-invert max-w-none">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2 text-sm font-medium uppercase tracking-wider">
                            <FileText className="w-4 h-4" />
                            Ghi chú
                        </div>
                        <div className="p-4 sm:p-6 bg-muted/20 rounded-2xl border border-border">
                            {sleepLog.sleepNote ? (
                                <p className="text-foreground whitespace-pre-wrap leading-relaxed wrap-break-word text-base">
                                    {sleepLog.sleepNote}
                                </p>
                            ) : (
                                <span className="text-muted-foreground italic">Không có ghi chú</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Minimalist */}
                <div className="p-4 border-t border-border bg-indigo-500/5 dark:bg-indigo-500/10 flex items-center justify-center gap-2">
                    <Star className="w-3 h-3 text-indigo-500/40 fill-indigo-500/10" />
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">Sống tích cực mỗi ngày</p>
                    <Star className="w-3 h-3 text-indigo-500/40 fill-indigo-500/10" />
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

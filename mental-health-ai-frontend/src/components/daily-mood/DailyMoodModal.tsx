'use client';

import { DailyMood, WorkloadLevel } from '@/types';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, FileText, Activity, Briefcase, Heart } from 'lucide-react';

const moodEmojis: Record<number, { emoji: string; label: string; color: string; gradient: string }> = {
    1: { emoji: '😢', label: 'Rất tệ', color: 'text-red-600 dark:text-red-400', gradient: 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20' },
    2: { emoji: '😢', label: 'Rất tệ', color: 'text-red-600 dark:text-red-400', gradient: 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20' },
    3: { emoji: '😔', label: 'Tệ', color: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20' },
    4: { emoji: '😔', label: 'Tệ', color: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20' },
    5: { emoji: '😐', label: 'Bình thường', color: 'text-yellow-600 dark:text-yellow-400', gradient: 'from-yellow-50 to-lime-50 dark:from-yellow-900/20 dark:to-lime-900/20' },
    6: { emoji: '😐', label: 'Bình thường', color: 'text-yellow-600 dark:text-yellow-400', gradient: 'from-yellow-50 to-lime-50 dark:from-yellow-900/20 dark:to-lime-900/20' },
    7: { emoji: '😊', label: 'Tốt', color: 'text-green-600 dark:text-green-400', gradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' },
    8: { emoji: '😊', label: 'Tốt', color: 'text-green-600 dark:text-green-400', gradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' },
    9: { emoji: '😄', label: 'Rất tốt', color: 'text-green-600 dark:text-green-400', gradient: 'from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20' },
    10: { emoji: '😄', label: 'Rất tốt', color: 'text-green-600 dark:text-green-400', gradient: 'from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20' },
};

const workloadLabels: Record<WorkloadLevel, string> = {
    [WorkloadLevel.LOW]: 'Nhẹ',
    [WorkloadLevel.MEDIUM]: 'Vừa phải',
    [WorkloadLevel.HIGH]: 'Nặng',
};

interface DailyMoodModalProps {
    mood: DailyMood | null;
    onClose: () => void;
}

export default function DailyMoodModal({ mood, onClose }: DailyMoodModalProps) {
    if (!mood) return null;
    if (typeof document === 'undefined') return null;

    const moodInfo = moodEmojis[mood.moodScore] || moodEmojis[5];
    const date = new Date(mood.createdAt);

    const modalContent = (
        <div
            suppressHydrationWarning role="button"
            tabIndex={0}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
        >
            <div
                role="dialog"
                className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
            >
                { }
                <div className={`relative bg-linear-to-r ${moodInfo.gradient} p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700`}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                            <div className="size-12 sm:w-16 sm:h-16 rounded-2xl bg-white/80 dark:bg-gray-800/80 shadow-sm flex items-center justify-center text-2xl sm:text-4xl shrink-0 backdrop-blur-sm">
                                {moodInfo.emoji}
                            </div>
                            <div className="min-w-0">
                                <h2 className={`text-lg sm:text-2xl font-semibold ${moodInfo.color} flex flex-wrap items-center gap-2`}>
                                    {moodInfo.label}
                                    <span className="text-sm font-normal text-gray-500 bg-white/50 dark:bg-gray-800/50 px-2 py-0.5 rounded-full">
                                        {mood.moodScore}/10
                                    </span>
                                </h2>
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="size-4" />
                                        <span>
                                            {date.toLocaleDateString('vi-VN', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                    <div suppressHydrationWarning className="flex items-center gap-1.5">
                                        <Clock className="size-4" />
                                        <span>
                                            {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 text-gray-500 hover:text-red-500 rounded-lg transition-colors shadow-sm backdrop-blur-sm"
                            aria-label="Đóng"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                { }
                <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-gray-800">

                    { }
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium mb-1">
                                <Activity className="size-4" />
                                Mức độ Stress
                            </div>
                            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                                {mood.stressLevel}/10
                            </div>
                        </div>
                        {mood.workloadLevel && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium mb-1">
                                    <Briefcase className="size-4" />
                                    Công việc
                                </div>
                                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {workloadLabels[mood.workloadLevel]}
                                </div>
                            </div>
                        )}
                    </div>

                    { }
                    <div className="prose dark:prose-invert max-w-none">
                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-2 text-sm font-medium uppercase tracking-wider">
                            <FileText className="size-4" />
                            Ghi chú
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                            {mood.note ? (
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed wrap-break-word break-all text-base">
                                    {mood.note}
                                </p>
                            ) : (
                                <span className="text-gray-400 italic">Không có ghi chú</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Minimalist */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-emerald-50/30 dark:bg-emerald-900/10 flex items-center justify-center gap-2">
                    <Heart className="size-3 text-emerald-500/40 fill-emerald-500/10" />
                    <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-[0.2em]">Sống tích cực mỗi ngày</p>
                    <Heart className="size-3 text-emerald-500/40 fill-emerald-500/10" />
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

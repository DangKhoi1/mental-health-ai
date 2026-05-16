'use client';

import { Journal } from '@/types';
import JournalGridSkeleton from './JournalGridSkeleton';
import { Book, Calendar, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JournalGridProps {
    journals: Journal[];
    isLoading: boolean;
    onSelect: (journal: Journal) => void;
    onDelete: (id: string) => void;
}

const moodColors: Record<string, string> = {
    '😊 Vui vẻ': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    '😌 Bình yên': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    '😔 Buồn': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    '😤 Tức giận': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    '😰 Lo lắng': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    '🤔 Suy tư': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
};

export default function JournalGrid({ journals, isLoading, onSelect, onDelete }: JournalGridProps) {
    if (isLoading) {
        return <JournalGridSkeleton />;
    }

    if (journals.length === 0) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 bg-muted/20 border-2 border-dashed border-muted rounded-3xl">
                <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center shadow-sm mb-6 rotate-3">
                    <Book className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                    Trang giấy còn trống
                </h3>
                <p className="text-muted-foreground text-center max-w-sm mb-8">
                    Hãy bắt đầu viết những dòng đầu tiên cho câu chuyện của bạn.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
            {journals.map((journal) => {
                const date = new Date(journal.createdAt);

                return (
                    <div
                        key={journal.journalId}
                        onClick={() => onSelect(journal)}
                        className="group relative flex flex-col bg-card rounded-2xl border border-border/60 shadow-sm hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden p-6"
                    >
                        {/* Decorative paper holes/spiral */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                {date.toLocaleDateString('vi-VN', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'long'
                                })}
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(journal.journalId);
                                }}
                                className="p-1.5 -mr-1.5 text-black/20 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <h3 className="text-lg font-bold text-foreground line-clamp-2 mb-3 leading-snug group-hover:text-amber-500 transition-colors">
                            {journal.title}
                        </h3>

                        {journal.mood && (
                            <div className="mb-4">
                                <span className={cn(
                                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
                                    moodColors[journal.mood] || 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                )}>
                                    {journal.mood}
                                </span>
                            </div>
                        )}

                        <div className="relative flex-1">
                            <p className="text-sm text-foreground/70 leading-relaxed line-clamp-4 font-normal">
                                {journal.content}
                            </p>
                            <div className="absolute bottom-0 w-full h-8 bg-linear-to-t from-card to-transparent" />
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                            <span className="text-xs text-muted-foreground font-medium">
                                {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {/* Example indicator if content is long */}
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold group-hover:text-amber-500 transition-colors">
                                Đọc tiếp
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

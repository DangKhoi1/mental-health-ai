'use client';

import { Journal } from '@/types';
import JournalListSkeleton from './JournalListSkeleton';
import { FileText, Trash2, Pencil, Clock3, BookHeart, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { journalService } from '@/services/journal';

interface JournalListProps {
    journals: Journal[];
    isLoading: boolean;
    onSelect: (journal: Journal) => void;
    onDelete: (id: string) => void;
    onEdit: (journal: Journal) => void;
}

function toPlainPreview(content: string): string {
    return content
        .replace(/<[^>]*>/g, ' ')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`([^`]*)`/g, '$1')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')
        .replace(/^\s{0,3}[-*+]\s+/gm, '')
        .replace(/^\s{0,3}\d+\.\s+/gm, '')
        .replace(/\*\*|__|\*|_|~~/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

const getTheme = (mood: string) => {
    if (mood.includes('Vui vẻ')) return { glow: 'bg-emerald-500/10', gradient: 'from-emerald-500/10 via-transparent to-emerald-500/5', shadow: 'hover:shadow-emerald-500/10', dateBox: 'border-emerald-500/20 bg-emerald-500/5', dateText: 'text-emerald-500/80', badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500', subBadge: 'border-emerald-500/20 bg-emerald-500/5', button: 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-500', card: 'border-emerald-500/20 bg-emerald-500/5', icon: 'text-emerald-500' };
    if (mood.includes('Bình yên')) return { glow: 'bg-sky-500/10', gradient: 'from-sky-500/10 via-transparent to-sky-500/5', shadow: 'hover:shadow-sky-500/10', dateBox: 'border-sky-500/20 bg-sky-500/5', dateText: 'text-sky-500/80', badge: 'border-sky-500/20 bg-sky-500/10 text-sky-500', subBadge: 'border-sky-500/20 bg-sky-500/5', button: 'border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 hover:text-sky-500', card: 'border-sky-500/20 bg-sky-500/5', icon: 'text-sky-500' };
    if (mood.includes('Buồn')) return { glow: 'bg-indigo-500/10', gradient: 'from-indigo-500/10 via-transparent to-indigo-500/5', shadow: 'hover:shadow-indigo-500/10', dateBox: 'border-indigo-500/20 bg-indigo-500/5', dateText: 'text-indigo-500/80', badge: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-500', subBadge: 'border-indigo-500/20 bg-indigo-500/5', button: 'border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 hover:text-indigo-500', card: 'border-indigo-500/20 bg-indigo-500/5', icon: 'text-indigo-500' };
    if (mood.includes('Tức giận')) return { glow: 'bg-rose-500/10', gradient: 'from-rose-500/10 via-transparent to-rose-500/5', shadow: 'hover:shadow-rose-500/10', dateBox: 'border-rose-500/20 bg-rose-500/5', dateText: 'text-rose-500/80', badge: 'border-rose-500/20 bg-rose-500/10 text-rose-500', subBadge: 'border-rose-500/20 bg-rose-500/5', button: 'border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 hover:text-rose-500', card: 'border-rose-500/20 bg-rose-500/5', icon: 'text-rose-500' };
    if (mood.includes('Lo lắng')) return { glow: 'bg-orange-500/10', gradient: 'from-orange-500/10 via-transparent to-orange-500/5', shadow: 'hover:shadow-orange-500/10', dateBox: 'border-orange-500/20 bg-orange-500/5', dateText: 'text-orange-500/80', badge: 'border-orange-500/20 bg-orange-500/10 text-orange-500', subBadge: 'border-orange-500/20 bg-orange-500/5', button: 'border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 hover:text-orange-500', card: 'border-orange-500/20 bg-orange-500/5', icon: 'text-orange-500' };
    if (mood.includes('Suy tư')) return { glow: 'bg-purple-500/10', gradient: 'from-purple-500/10 via-transparent to-purple-500/5', shadow: 'hover:shadow-purple-500/10', dateBox: 'border-purple-500/20 bg-purple-500/5', dateText: 'text-purple-500/80', badge: 'border-purple-500/20 bg-purple-500/10 text-purple-500', subBadge: 'border-purple-500/20 bg-purple-500/5', button: 'border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 hover:text-purple-500', card: 'border-purple-500/20 bg-purple-500/5', icon: 'text-purple-500' };
    return { glow: 'bg-amber-500/10', gradient: 'from-amber-500/10 via-transparent to-amber-500/5', shadow: 'hover:shadow-amber-500/10', dateBox: 'border-amber-500/20 bg-amber-500/5', dateText: 'text-amber-500/80', badge: 'border-amber-500/20 bg-amber-500/10 text-amber-500', subBadge: 'border-amber-500/20 bg-amber-500/5', button: 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:text-amber-500', card: 'border-amber-500/20 bg-amber-500/5', icon: 'text-amber-500' };
};

export default function JournalList({ journals, isLoading, onSelect, onDelete, onEdit }: JournalListProps) {
    const [journalImages, setJournalImages] = useState<{ [key: string]: string[] }>({});

    useEffect(() => {
        const loadAllImages = async () => {
            const nextMap: { [key: string]: string[] } = {};

            await Promise.all(
                journals.map(async (journal) => {
                    try {
                        const res = await journalService.getImages(journal.journalId);
                        if (res.data && Array.isArray(res.data.images)) {
                            nextMap[journal.journalId] = res.data.images.map((img: { cloudinaryUrl: string }) => img.cloudinaryUrl);
                        } else {
                            nextMap[journal.journalId] = [];
                        }
                    } catch (error) {
                        console.error('Error loading images for journal:', journal.journalId, error);
                        nextMap[journal.journalId] = [];
                    }
                })
            );

            setJournalImages(nextMap);
        };

        if (journals.length > 0) {
            loadAllImages();
            return;
        }

        setJournalImages({});
    }, [journals]);
    if (isLoading) {
        return <JournalListSkeleton />;
    }

    if (journals.length === 0) {
        return (
            <div suppressHydrationWarning className="text-center py-16 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
                <div className="size-20 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <FileText className="size-10 text-amber-500" />
                </div>
                <h3 className="text-xl font-medium text-foreground mb-2">
                    Chưa có bài nhật ký nào
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                    Hãy bắt đầu viết nhật ký để ghi lại những khoảnh khắc đáng nhớ và cảm xúc của bạn!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {journals.map((journal, index) => {
                const date = new Date(journal.createdAt);

                const isToday = new Date().toDateString() === date.toDateString();
                const images = journalImages[journal.journalId] || [];
                const theme = getTheme(journal.mood || '');

                return (
                    <div
                        key={`${journal.journalId}-${index}`}
                        className={cn("group relative overflow-hidden rounded-3xl border border-border bg-card text-foreground shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer", theme.shadow)}
                        onClick={() => onSelect(journal)}
                    >
                        <div className={cn("absolute inset-0 bg-linear-to-br pointer-events-none", theme.gradient)} />
                        <div className={cn("absolute -top-16 -right-16 size-52 rounded-full blur-3xl pointer-events-none", theme.glow)} />

                        <div className="relative p-5 md:p-6">
                            <div className="flex items-start justify-between gap-3 min-w-0">
                                <div className="flex min-w-0 items-start gap-3 flex-1">
                                    <div className={cn("rounded-2xl border px-3 py-2 text-center min-w-18 shrink-0", theme.dateBox)}>
                                        <p className="text-2xl font-bold leading-none">{date.getDate()}</p>
                                        <p className={cn("text-[11px] uppercase tracking-wider mt-1", theme.dateText)}>Thg {date.getMonth() + 1}</p>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-muted-foreground">Nhật ký cảm xúc</p>
                                        <h3 className="text-lg font-semibold line-clamp-1">{journal.title}</h3>
                                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                                            {journal.mood ? (
                                                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", theme.badge)}>
                                                    <BookHeart className="size-3.5" />
                                                    {journal.mood}
                                                </span>
                                            ) : (
                                                <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", theme.subBadge)}>
                                                    Không gắn cảm xúc
                                                </span>
                                            )}
                                            {isToday && (
                                                <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold", theme.badge)}>Hôm nay</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold", theme.subBadge)}>
                                        <Clock3 className="size-3.5" />
                                        {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(journal);
                                        }}
                                        className={cn("rounded-xl border p-2 transition", theme.button)}
                                        aria-label="Sửa bài viết"
                                        title="Sửa bài viết"
                                    >
                                        <Pencil className="size-4" />
                                    </button>

                                    {!isToday && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(journal.journalId);
                                            }}
                                            className={cn("rounded-xl border p-2 transition", theme.button)}
                                            aria-label="Xóa bản ghi"
                                            title="Xóa bản ghi"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className={cn("mt-4 rounded-2xl border p-4 sm:p-5", theme.card)}>
                                <p className="block w-full max-w-none text-left text-md leading-relaxed text-muted-foreground line-clamp-5 wrap-break-word whitespace-normal">
                                    {toPlainPreview(journal.content)}
                                </p>
                            </div>

                            {images.length > 0 ? (
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                        <ImageIcon className={cn("size-3.5", theme.icon)} />
                                        <span>{images.length} ảnh</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                                        {images.slice(0, 6).map((imageUrl, imgIndex) => (
                                            <div
                                                key={imgIndex}
                                                className={cn("relative aspect-square rounded-2xl overflow-hidden border bg-secondary/30 shadow-sm", theme.card.split(' ')[0])}
                                            >
                                                <Image
                                                    src={imageUrl}
                                                    alt={`Journal image ${imgIndex + 1}`}
                                                    fill
                                                    className="object-cover transition-transform"
                                                />
                                            </div>
                                        ))}
                                        {images.length > 6 && (
                                            <div className={cn("relative aspect-square rounded-2xl overflow-hidden border-2 flex items-center justify-center shadow-sm", theme.card)}>
                                                <span className={cn("text-xs font-bold", theme.icon)}>
                                                    +{images.length - 6}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 rounded-2xl border border-dashed border-border/60 bg-secondary/20 px-4 py-5 text-center text-xs text-muted-foreground">
                                    Chưa có ảnh
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

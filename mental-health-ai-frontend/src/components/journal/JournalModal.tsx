'use client';

import { Journal } from '@/types';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { aiAnalysisService } from '@/services/aiAnalysis';
import { journalService } from '@/services/journal';
import {
    BookOpen,
    Calendar,
    Clock,
    X,
    Loader2,
    Sparkles,
    Image as ImageIcon,
    Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ImageUploader from './ImageUploader';
import { cn } from '@/lib/utils';

interface JournalModalProps {
    journal: Journal | null;
    onClose: () => void;
}

interface JournalAnalysisData {
    feedback?: string;
}

interface JournalImage {
    imageId: string;
    fileName: string;
    cloudinaryUrl: string;
    mimeType: string;
    fileSize: number;
    displayOrder: number;
    createdAt: string;
}

interface ReflectionLetterData {
    letter: string;
    sentimentScore?: number;
    detectedMood?: string;
}

function getLetterTheme(mood: string) {
    if (mood.includes('Vui vẻ')) return { primary: 'emerald', iconBg: 'bg-emerald-500/10', iconBorder: 'border-emerald-500/20', iconText: 'text-emerald-500', btnBg: 'bg-emerald-500 hover:bg-emerald-600' };
    if (mood.includes('Bình yên')) return { primary: 'sky', iconBg: 'bg-sky-500/10', iconBorder: 'border-sky-500/20', iconText: 'text-sky-500', btnBg: 'bg-sky-500 hover:bg-sky-600' };
    if (mood.includes('Buồn')) return { primary: 'indigo', iconBg: 'bg-indigo-500/10', iconBorder: 'border-indigo-500/20', iconText: 'text-indigo-500', btnBg: 'bg-indigo-500 hover:bg-indigo-600' };
    if (mood.includes('Tức giận')) return { primary: 'rose', iconBg: 'bg-rose-500/10', iconBorder: 'border-rose-500/20', iconText: 'text-rose-500', btnBg: 'bg-rose-500 hover:bg-rose-600' };
    if (mood.includes('Lo lắng')) return { primary: 'orange', iconBg: 'bg-orange-500/10', iconBorder: 'border-orange-500/20', iconText: 'text-orange-500', btnBg: 'bg-orange-500 hover:bg-orange-600' };
    if (mood.includes('Suy tư')) return { primary: 'purple', iconBg: 'bg-purple-500/10', iconBorder: 'border-purple-500/20', iconText: 'text-purple-500', btnBg: 'bg-purple-500 hover:bg-purple-600' };
    return { primary: 'amber', iconBg: 'bg-amber-500/10', iconBorder: 'border-amber-500/20', iconText: 'text-amber-500', btnBg: 'bg-amber-500 hover:bg-amber-600' };
}

export default function JournalModal({ journal, onClose }: JournalModalProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisData, setAnalysisData] = useState<JournalAnalysisData | null>(null);
    const [letterData, setLetterData] = useState<ReflectionLetterData | null>(null);
    const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
    const [images, setImages] = useState<JournalImage[]>([]);
    const [isLoadingImages, setIsLoadingImages] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [showImageUploader, setShowImageUploader] = useState(false);

    const theme = getLetterTheme(journal?.mood || '');

    useEffect(() => {
        if (journal) {
            setLetterData(null);
            setAnalysisData(journal.analysisResult || null);
            loadJournalImages();
        }
    }, [journal]);

    const loadJournalImages = async () => {
        if (!journal) return;
        try {
            setIsLoadingImages(true);
            const res = await journalService.getImages(journal.journalId);
            if (res.data && Array.isArray(res.data.images)) {
                setImages(res.data.images);
            }
        } catch (error) {
            console.error('Error loading images:', error);
        } finally {
            setIsLoadingImages(false);
        }
    };

    const handleAnalyze = async () => {
        if (!journal) return;
        try {
            setIsAnalyzing(true);
            const res = await aiAnalysisService.analyzeJournal(journal.journalId);
            if (res && (res as { data?: JournalAnalysisData }).data) {
                setAnalysisData((res as { data: JournalAnalysisData }).data);
                toast.success('Phân tích thành công!');
            }
        } catch (error) {
            console.error(error);
            toast.error('Lỗi khi phân tích. Vui lòng thử lại sau.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateLetter = async () => {
        if (!journal) return;
        try {
            setIsGeneratingLetter(true);
            const plainContent = journal.content
                .replace(/<[^>]*>/g, ' ')
                .replace(/```[\s\S]*?```/g, ' ')
                .replace(/`([^`]*)`/g, '$1')
                .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
                .replace(/\s+/g, ' ')
                .trim();
            const res = await aiAnalysisService.generateReflectionLetter(
                plainContent,
                journal.mood || undefined,
            );
            if (res?.letter) {
                setLetterData({
                    letter: res.letter,
                    sentimentScore: res.sentimentScore,
                    detectedMood: res.detectedMood,
                });
                toast.success('Lá thư đã được viết riêng cho bạn!');
            } else {
                toast.error('Không nhận được phản hồi. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Lỗi khi tạo lá thư. Vui lòng thử lại sau.');
        } finally {
            setIsGeneratingLetter(false);
        }
    };

    const handleImageUpload = async (file: File) => {
        if (!journal) return;
        try {
            setIsUploadingImage(true);
            const res = await journalService.uploadImage(journal.journalId, file);
            if (res.data) {
                toast.success('Tải ảnh thành công!');
                await loadJournalImages();
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Lỗi khi tải ảnh. Vui lòng thử lại.');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleDeleteImage = async (imageId: string) => {
        try {
            await journalService.deleteImage(imageId);
            toast.success('Xóa ảnh thành công!');
            await loadJournalImages();
        } catch (error) {
            console.error('Error deleting image:', error);
            toast.error('Lỗi khi xóa ảnh. Vui lòng thử lại.');
        }
    };

    if (!journal) return null;
    if (typeof document === 'undefined') return null;

    const isLikelyHtml = /<\/?[a-z][\s\S]*>/i.test(journal.content);
    const date = new Date(journal.createdAt);

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm transition-all"
            onClick={onClose}
        >
            <div
                className="bg-background rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative border border-border/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 lg:pt-8 pb-4 sm:pb-6 border-b border-border/50">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-5">
                            <div className={cn(
                                "w-11 h-11 sm:w-14 sm:h-14 rounded-2xl backdrop-blur-md border shadow-sm flex items-center justify-center shrink-0",
                                theme.iconBg,
                                theme.iconBorder,
                                theme.iconText,
                            )}>
                                <BookOpen className="w-7 h-7" />
                            </div>
                            <div className="flex-1 mt-1">
                                <h2 className="text-lg sm:text-xl font-bold text-foreground line-clamp-2">
                                    {journal.title}
                                </h2>
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm font-medium text-muted-foreground">
                                    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md border", theme.iconBg, theme.iconBorder)}>
                                        <Calendar className={cn("w-4 h-4", theme.iconText)} />
                                        <span className={theme.iconText}>
                                            {date.toLocaleDateString('vi-VN', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md border", theme.iconBg, theme.iconBorder)}>
                                        <Clock className={cn("w-4 h-4", theme.iconText)} />
                                        <span className={theme.iconText}>
                                            {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {journal.mood && (
                                        <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full border", theme.iconBg, theme.iconBorder)}>
                                            <span className={theme.iconText}>{journal.mood}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all shadow-sm backdrop-blur-sm self-start border border-border/50"
                            aria-label="Đóng"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="grid flex-1 min-h-0 gap-0 overflow-hidden relative z-10 lg:grid-cols-[minmax(0,1fr)_360px]">

                    {/* Main Column */}
                    <div className="min-w-0 border-b lg:border-b-0 lg:border-r border-border/50 overflow-y-auto custom-scrollbar">
                        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                            <div className="rounded-3xl border border-border/60 bg-secondary/20 p-4 sm:p-5">
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <div className={cn("flex items-center gap-2 text-sm font-semibold", theme.iconText)}>
                                        <ImageIcon className={cn("w-4 h-4", theme.iconText)} />
                                        <span>Ảnh kỷ niệm ({images.length})</span>
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                                        theme.iconBg,
                                        theme.iconBorder,
                                        theme.iconText,
                                        "hover:opacity-80"
                                    )}>
                                        <Camera className={cn("w-4 h-4", theme.iconText)} />
                                        <button onClick={() => setShowImageUploader((prev) => !prev)}>
                                            {showImageUploader ? ' Ẩn tải ảnh' : 'Thêm ảnh'}
                                        </button>
                                    </div>
                                </div>

                                {images.length > 0 && (
                                    <ImageUploader
                                        journalId={journal.journalId}
                                        images={images}
                                        onImageUpload={handleImageUpload}
                                        onImageDelete={handleDeleteImage}
                                        isUploading={isUploadingImage}
                                        stampStyle={true}
                                    />
                                )}

                                {showImageUploader && (
                                    <div className={images.length > 0 ? 'mt-4' : ''}>
                                        <ImageUploader
                                            journalId={journal.journalId}
                                            images={[]}
                                            onImageUpload={handleImageUpload}
                                            onImageDelete={handleDeleteImage}
                                            isUploading={isUploadingImage}
                                            stampStyle={false}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="rounded-3xl border border-border/60 bg-background/80 backdrop-blur-sm p-5 sm:p-6 lg:p-7 shadow-sm">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <h3 className="text-base font-semibold text-foreground">Nội dung nhật ký</h3>
                                    <span className="text-xs text-muted-foreground">{date.toLocaleDateString('vi-VN')}</span>
                                </div>

                                <div className="prose prose-slate dark:prose-invert max-w-none text-foreground/80 text-base leading-7">
                                    {isLikelyHtml ? (
                                        <div className="whitespace-pre-wrap break-normal" dangerouslySetInnerHTML={{ __html: journal.content }} />
                                    ) : (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {journal.content}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: AI Letter */}
                    <div className={cn("w-full shrink-0 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar", theme.iconBg)}>
                        <div className={cn(
                            "relative overflow-hidden rounded-3xl p-6 border",
                            "bg-background/80 backdrop-blur-2xl shadow-sm"
                        )}>
                            {/* Inner glow */}
                            <div className={cn("absolute top-0 right-0 p-32 bg-current/10 blur-[80px] rounded-full mix-blend-multiply pointer-events-none opacity-20", theme.iconText)} />

                            <div className="relative z-10">
                                <div className="mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            theme.iconBg,
                                            theme.iconText,
                                        )}>
                                            <Sparkles className="w-5 h-5 animate-pulse" />
                                        </div>
                                        <h3 className={cn(
                                            "text-lg font-bold leading-tight bg-linear-to-r bg-clip-text text-transparent",
                                            `[&.from-emerald]:from-emerald-500 [&.from-emerald]:to-emerald-400`,
                                        )}>
                                            <span className={cn("bg-linear-to-r bg-clip-text text-transparent", `from-${theme.primary}-500 to-${theme.primary}-400`)}>
                                                Lá thư từ AI
                                            </span>
                                        </h3>
                                    </div>
                                </div>

                                {!letterData && (
                                    <button
                                        onClick={handleGenerateLetter}
                                        disabled={isGeneratingLetter}
                                        className={cn(
                                            "group mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-300",
                                            "hover:-translate-y-0.5 hover:shadow-lg",
                                            "active:scale-[0.99]",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                                            "disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none",
                                            theme.btnBg,
                                        )}
                                    >
                                        {isGeneratingLetter ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                        )}
                                        {isGeneratingLetter ? 'Đang viết thư...' : 'Nhận lá thư'}
                                    </button>
                                )}

                                {letterData && (
                                    <div className="mt-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                                        <p className="text-[15px] leading-relaxed text-foreground/80 font-medium italic">
                                            {letterData.letter}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 p-4 backdrop-blur-md border-t border-border/50 mt-auto flex items-center justify-center gap-2">
                    <Sparkles className="w-3 h-3 text-muted-foreground/40" />
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">Sống tích cực mỗi ngày</p>
                    <Sparkles className="w-3 h-3 text-muted-foreground/40" />
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

'use client';

import { CreateJournalDto } from '@/types';
import VoiceInput from '@/components/reco/VoiceInput';
import { Mic, PenLine, Smile, Type, Send, Image as ImageIcon, X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import TiptapEditor from './TiptapEditor';
import { useState, useRef } from 'react';
import NextImage from 'next/image';
import { toast } from 'sonner';
import ImageUploader from './ImageUploader';

const moodOptions = [
    { label: '😊 Vui vẻ', value: '😊 Vui vẻ', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500' },
    { label: '😌 Bình yên', value: '😌 Bình yên', bg: 'bg-sky-500/10', border: 'border-sky-500/20', text: 'text-sky-500' },
    { label: '😔 Buồn', value: '😔 Buồn', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-500' },
    { label: '😤 Tức giận', value: '😤 Tức giận', bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-500' },
    { label: '😰 Lo lắng', value: '😰 Lo lắng', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-500' },
    { label: '🤔 Suy tư', value: '🤔 Suy tư', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-500' },
];

interface JournalFormProps {
    formData: CreateJournalDto;
    setFormData: React.Dispatch<React.SetStateAction<CreateJournalDto>>;
    onSubmit: (e: React.FormEvent, pendingImages?: File[]) => void;
    isSubmitting: boolean;
    editJournalId?: string | null;
    existingImages?: {
        imageId: string;
        fileName: string;
        cloudinaryUrl: string;
        mimeType: string;
        fileSize: number;
        displayOrder: number;
        createdAt: string;
    }[];
    onUploadExistingImage?: (file: File) => Promise<void>;
    onDeleteExistingImage?: (imageId: string) => Promise<void>;
    isUploadingExistingImage?: boolean;
}

export default function JournalForm({
    formData,
    setFormData,
    onSubmit,
    isSubmitting,
    editJournalId,
    existingImages = [],
    onUploadExistingImage,
    onDeleteExistingImage,
    isUploadingExistingImage = false,
}: JournalFormProps) {
    const [pendingImages, setPendingImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const maxFileSize = 5 * 1024 * 1024;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) {
                toast.error(`Tệp ${file.name} không phải ảnh hợp lệ.`);
                continue;
            }

            if (file.size > maxFileSize) {
                toast.error(`Ảnh ${file.name} vượt quá 5MB.`);
                continue;
            }

            setPendingImages((prev) => [...prev, file]);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrls((prev) => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (index: number) => {
        setPendingImages((prev) => prev.filter((_, i) => i !== index));
        setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmitWithImages = (e: React.FormEvent) => {
        onSubmit(e, pendingImages);
    };
    return (
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 md:px-8 pt-8 pb-6 bg-linear-to-br from-amber-500/10 to-amber-500/5">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
                        <PenLine className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Viết nhật ký</h2>
                        <p className="text-sm text-muted-foreground">Chia sẻ câu chuyện của bạn hôm nay</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmitWithImages} className="p-6 md:p-8 space-y-7">
                {/* Title */}
                <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Type className="w-4 h-4 text-muted-foreground" />
                        Tiêu đề
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        maxLength={200}
                        minLength={3}
                        className="w-full px-5 py-3.5 bg-secondary/20 border border-transparent rounded-2xl focus:bg-background focus:border-amber-500/20 focus:ring-2 focus:ring-amber-500/10 outline-none text-base font-medium placeholder:text-muted-foreground/50 transition-all duration-200"
                        placeholder="Đặt tiêu đề cho ngày hôm nay..."
                        required
                    />
                    <div className="flex justify-between text-xs text-muted-foreground/60 px-1">
                        <span>{formData.title.length < 3 && formData.title.length > 0 ? 'Tối thiểu 3 ký tự' : ''}</span>
                        <span>{formData.title.length}/200</span>
                    </div>
                </div>

                {/* Mood Chips */}
                <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Smile className="w-4 h-4 text-muted-foreground" />
                        Cảm xúc của bạn
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {moodOptions.map((mood) => {
                            const isSelected = formData.mood === mood.value;
                            return (
                                <button
                                    key={mood.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, mood: mood.value })}
                                    className={cn(
                                        "px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200",
                                        isSelected
                                            ? cn(mood.bg, mood.border, mood.text, "shadow-sm scale-105")
                                            : "bg-background text-muted-foreground border-border/60 hover:bg-secondary/30 hover:border-border"
                                    )}
                                >
                                    {mood.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content + Voice */}
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <PenLine className="w-4 h-4 text-muted-foreground" />
                            Nội dung
                        </label>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/5 rounded-lg border border-amber-500/10">
                            <Mic className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs font-medium text-muted-foreground">Giọng nói</span>
                            <div className="scale-90 origin-right">
                                <VoiceInput
                                    onResult={(text) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            content: `${prev.content}${prev.content ? ' ' : ''}${text}`,
                                        }));
                                    }}
                                    language="vi-VN"
                                />
                            </div>
                        </div>
                    </div>

                    <TiptapEditor
                        content={formData.content}
                        onChange={(content) => setFormData({ ...formData, content })}
                        placeholder="Hôm nay bạn cảm thấy thế nào?..."
                    />

                    <div className="flex justify-between text-xs text-muted-foreground/60 px-1">
                        <span>{formData.content.replace(/<[^>]*>/g, '').length < 10 && formData.content.length > 0 ? 'Tối thiểu 10 ký tự' : ''}</span>
                        <span>{formData.content.replace(/<[^>]*>/g, '').length} ký tự (không tính thẻ định dạng)</span>
                    </div>
                </div>

                {/* Images Section */}
                <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        Thêm ảnh kỷ niệm (tùy chọn)
                    </label>

                    {!editJournalId && (
                        <>
                            {/* Upload area for create mode */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative border-2 border-dashed border-border/60 rounded-2xl p-6 cursor-pointer hover:border-amber-500/40 hover:bg-amber-500/5 transition-all duration-200"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <div className="p-2.5 bg-amber-500/10 rounded-lg">
                                        <Upload className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium text-foreground text-sm">Chọn ảnh để tải lên</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            JPEG, PNG, WebP, GIF (Tối đa 5MB mỗi ảnh)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Preview thumbnails for create mode */}
                            {pendingImages.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Ảnh chọn ({pendingImages.length})
                                    </p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {previewUrls.map((url, index) => (
                                            <div
                                                key={index}
                                                className="relative aspect-square rounded-lg overflow-hidden border-2 border-amber-500/20 bg-secondary/30"
                                            >
                                                <NextImage
                                                    src={url}
                                                    alt={`Preview ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(index)}
                                                    className="absolute top-1 right-1 p-1 bg-destructive/90 hover:bg-destructive rounded-md transition-colors"
                                                >
                                                    <X className="w-3 h-3 text-white" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {editJournalId && onUploadExistingImage && onDeleteExistingImage && (
                        <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
                            <p className="mb-3 text-xs font-medium text-muted-foreground">
                                Ảnh đã lưu ({existingImages.length})
                            </p>
                            <ImageUploader
                                journalId={editJournalId}
                                images={existingImages}
                                onImageUpload={onUploadExistingImage}
                                onImageDelete={onDeleteExistingImage}
                                isUploading={isUploadingExistingImage}
                            />
                        </div>
                    )}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-amber-500 text-primary-foreground rounded-2xl font-semibold text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Lưu nhật ký
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui';

interface JournalImage {
    imageId: string;
    fileName: string;
    cloudinaryUrl: string;
    mimeType: string;
    fileSize: number;
    displayOrder: number;
    createdAt: string;
}

interface ImageUploaderProps {
    journalId: string;
    images: JournalImage[];
    onImageUpload: (file: File) => Promise<void>;
    onImageDelete: (imageId: string) => Promise<void>;
    isUploading?: boolean;
    stampStyle?: boolean; // New prop to show stamp style
}

export default function ImageUploader({
    journalId,
    images,
    onImageUpload,
    onImageDelete,
    isUploading = false,
    stampStyle = false,
}: ImageUploaderProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
    const [pendingDeleteImageId, setPendingDeleteImageId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.type.startsWith('image/')) {
                    setUploadingImageId(`uploading-${Date.now()}-${i}`);
                    try {
                        await onImageUpload(file);
                    } finally {
                        setUploadingImageId(null);
                    }
                }
            }
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setUploadingImageId(`uploading-${Date.now()}-${i}`);
                try {
                    await onImageUpload(file);
                } finally {
                    setUploadingImageId(null);
                }
            }
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRequestDeleteImage = (imageId: string) => {
        setPendingDeleteImageId(imageId);
    };

    const handleConfirmDeleteImage = async () => {
        if (!pendingDeleteImageId) return;
        try {
            await onImageDelete(pendingDeleteImageId);
        } finally {
            setPendingDeleteImageId(null);
        }
    };

    // Stamp rotation angles for variety
    const getStampRotation = (index: number) => {
        const rotations = [2, -3, 1, -2, 3, -1];
        return rotations[index % rotations.length];
    };

    // Stamp style gallery
    if (stampStyle && images && images.length > 0) {
        return (
            <div className="space-y-6">
                {/* Stamps Grid */}
                <div className="flex flex-wrap gap-4 -mx-2 px-2 py-4">
                    {images
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((image, index) => (
                            <div
                                key={image.imageId}
                                className="relative group"
                                style={{
                                    transform: `rotate(${getStampRotation(index)}deg)`,
                                }}
                            >
                                {/* Stamp Container */}
                                <div className="relative rounded-sm overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-all duration-200">
                                    {/* Stamp Border/Frame */}
                                    <div className="absolute inset-0 z-10 pointer-events-none border-2 border-foreground/20" style={{
                                        backgroundImage: `
                      radial-gradient(circle at 2px 2px, foreground/10 1px, transparent 1px)
                    `,
                                        backgroundSize: '8px 8px',
                                    }} />

                                    {/* Image */}
                                    <div className="w-32 h-40 sm:w-40 sm:h-52 relative bg-white">
                                        <Image
                                            src={image.cloudinaryUrl}
                                            alt={image.fileName}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    {/* Delete Button - Positioned on stamp */}
                                    <button
                                        onClick={() => handleRequestDeleteImage(image.imageId)}
                                        className="absolute top-2 right-2 p-1.5 bg-destructive/90 hover:bg-destructive rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                        title="Xóa ảnh"
                                    >
                                        <X className="w-3.5 h-3.5 text-white" />
                                    </button>

                                    {/* Tape effect indicator on hover */}
                                    <div className="absolute top-0 left-1/4 right-1/4 h-2 bg-yellow-200/30 blur-px opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                                </div>
                            </div>
                        ))}
                </div>

                {/* Loading State */}
                {isUploading && uploadingImageId && (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                        <Loader className="w-4 h-4 animate-spin" />
                        Đang tải lên ảnh...
                    </div>
                )}

                <ConfirmDialog
                    open={!!pendingDeleteImageId}
                    title="Xóa ảnh này?"
                    description="Ảnh sẽ bị xóa khỏi nhật ký và không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?"
                    confirmLabel="Xóa ảnh"
                    cancelLabel="Hủy"
                    onClose={() => setPendingDeleteImageId(null)}
                    onConfirm={handleConfirmDeleteImage}
                />
            </div>
        );
    }

    // Original style for upload area
    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                    'relative border-2 border-dashed rounded-2xl p-6 md:p-8 transition-all duration-200',
                    isDragActive
                        ? 'border-amber-500 bg-amber-500/5'
                        : 'border-border/50 hover:border-border hover:bg-secondary/20 cursor-pointer',
                    isUploading && 'opacity-50 pointer-events-none',
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isUploading}
                />

                <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-3 bg-amber-500/10 rounded-xl">
                        <Upload className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-foreground">
                            Kéo ảnh vào đây hoặc nhấn để chọn
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Hỗ trợ: JPEG, PNG, WebP, GIF (Tối đa 5MB mỗi ảnh)
                        </p>
                    </div>
                </div>
            </div>

            {/* Images Gallery */}
            {images && images.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                        Ảnh đã tải lên ({images.length})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {images
                            .sort((a, b) => a.displayOrder - b.displayOrder)
                            .map((image) => (
                                <div
                                    key={image.imageId}
                                    className="relative group rounded-lg overflow-hidden bg-secondary/50 border border-border"
                                >
                                    <div className="aspect-square relative">
                                        <Image
                                            src={image.cloudinaryUrl}
                                            alt={image.fileName}
                                            fill
                                            className="object-cover transition-opacity duration-200 group-hover:opacity-95"
                                        />
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => handleRequestDeleteImage(image.imageId)}
                                        className="absolute top-1 right-1 p-1.5 bg-destructive/90 hover:bg-destructive rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Xóa ảnh"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>

                                    {/* File Info on Hover */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                        <div className="text-xs text-white line-clamp-2">
                                            {image.fileName}
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isUploading && uploadingImageId && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader className="w-4 h-4 animate-spin" />
                    Đang tải lên ảnh...
                </div>
            )}

            <ConfirmDialog
                open={!!pendingDeleteImageId}
                title="Xóa ảnh này?"
                description="Ảnh sẽ bị xóa khỏi nhật ký và không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?"
                confirmLabel="Xóa ảnh"
                cancelLabel="Hủy"
                onClose={() => setPendingDeleteImageId(null)}
                onConfirm={handleConfirmDeleteImage}
            />
        </div>
    );
}

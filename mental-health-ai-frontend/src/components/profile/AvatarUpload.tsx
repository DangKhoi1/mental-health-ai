'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { uploadService } from '@/services';
import { toast } from 'sonner';

interface AvatarUploadProps {
    currentAvatarUrl?: string;
    userName?: string;
    onAvatarChange: (avatarUrl: string) => void;
}

export default function AvatarUpload({
    currentAvatarUrl,
    userName,
    onAvatarChange
}: AvatarUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh (PNG, JPG, JPEG)');
            return;
        }

        
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Kích thước ảnh không được vượt quá 5MB');
            return;
        }

        
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        
        setIsUploading(true);
        try {
            const { avatarUrl } = await uploadService.uploadAvatar(file);
            onAvatarChange(avatarUrl);
            toast.success('Tải ảnh lên thành công!');
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            toast.error('Không thể tải ảnh lên. Vui lòng thử lại.');
            setPreviewUrl(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const displayUrl = previewUrl || currentAvatarUrl;
    const userInitial = userName?.charAt(0)?.toUpperCase() || 'U';

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-bold overflow-hidden border-4 border-background shadow-lg">
                    {displayUrl ? (
                        <img
                            src={displayUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        userInitial
                    )}
                </div>

                {}
                <button
                    type="button"
                    onClick={handleClick}
                    disabled={isUploading}
                    className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                        <Camera className="w-8 h-8 text-white" />
                    )}
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            <div className="text-center">
                <button
                    type="button"
                    onClick={handleClick}
                    disabled={isUploading}
                    className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {isUploading ? 'Đang tải lên...' : 'Thay đổi ảnh đại diện'}
                </button>
                <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, JPEG (tối đa 5MB)
                </p>
            </div>
        </div>
    );
}

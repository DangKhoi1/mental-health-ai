'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ResourceItem } from '@/types/resource.types';
import { Play, FileText, Headphones, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ResourceCardProps {
    resource: ResourceItem;
    isActive?: boolean;
    onClose?: () => void;
}

// Hàm extract YouTube video ID để chuyển thành dạng embed
const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
        let videoId = '';
        if (url.includes('youtube.com/watch')) {
            videoId = new URL(url).searchParams.get('v') || '';
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
    } catch {
        return url;
    }
};

export default function ResourceCard({ resource, isActive = false, onClose }: ResourceCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Auto-open modal when isActive becomes true
    useEffect(() => {
        if (isActive) {
            setIsModalOpen(true);
        }
    }, [isActive]);

    const handleClose = () => {
        setIsModalOpen(false);
        if (onClose) onClose();
    };

    const getIcon = () => {
        switch (resource.typeCode) {
            case 'TYPE_VIDEO': return <Play className="w-4 h-4" />;
            case 'TYPE_ARTICLE': return <FileText className="w-4 h-4" />;
            case 'TYPE_AUDIO': return <Headphones className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const getCategoryLabel = (categoryCode: string) => {
        switch (categoryCode) {
            case 'RES_MEDITATION': return 'Thiền';
            case 'RES_BREATHING': return 'Hít thở';
            case 'RES_ARTICLE': return 'Bài viết';
            case 'RES_VIDEO': return 'Video';
            case 'RES_MUSIC': return 'Âm nhạc';
            default: return categoryCode;
        }
    };

    const getTypeLabel = (typeCode: string) => {
        switch (typeCode) {
            case 'TYPE_VIDEO': return 'Video';
            case 'TYPE_AUDIO': return 'Audio';
            case 'TYPE_ARTICLE': return 'Đọc';
            default: return typeCode;
        }
    };

    const handleOpen = () => {
        setIsModalOpen(true);
    };

    return (
        <>
            <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full">
                <div
                    className="relative h-40 w-full overflow-hidden cursor-pointer"
                    onClick={handleOpen}
                >
                    {resource.thumbnailUrl ? (
                        <img
                            src={resource.thumbnailUrl}
                            alt={resource.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-linear-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                            <div className="p-4 rounded-full bg-primary/10">
                                {getIcon()}
                            </div>
                        </div>
                    )}
                    <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm shadow-sm backdrop-filter pointer-events-none">
                            {getTypeLabel(resource.typeCode)}
                        </Badge>
                    </div>
                    {(resource.typeCode === 'TYPE_VIDEO' || resource.typeCode === 'TYPE_AUDIO') && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                            <div className="bg-white/90 p-3 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                <Play className="w-5 h-5 text-primary fill-primary" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 flex flex-col grow">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-primary px-2 py-0.5 rounded-full bg-primary/10">
                            {getCategoryLabel(resource.categoryCode)}
                        </span>
                        {resource.duration && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {resource.duration}
                            </span>
                        )}
                    </div>

                    <h3
                        className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors cursor-pointer"
                        onClick={handleOpen}
                    >
                        {resource.title}
                    </h3>

                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4 grow">
                        {resource.description}
                    </p>

                    <Button
                        variant="outline"
                        className="w-full mt-auto gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors border-primary/20"
                        onClick={handleOpen}
                    >
                        {resource.typeCode === 'TYPE_ARTICLE' ? (
                            <>
                                <FileText className="w-4 h-4" />
                                Đọc ngay
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Bắt đầu
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Resource Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    {/* Click ra ngoài để đóng */}
                    <div className="absolute inset-0" onClick={handleClose} />

                    <div className={`relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${resource.typeCode !== 'TYPE_VIDEO' ? 'max-w-7xl' : 'max-w-6xl'}`}>
                        {/* Header của modal (tựa đề + nút close) */}
                        {/* <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-10 pointer-events-none">
                            <h3 className="text-white font-medium truncate pr-8 drop-shadow-md text-lg">
                                {resource.title}
                            </h3>
                        </div> */}

                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors z-20 focus:outline-none focus:ring-2 focus:ring-white"
                            aria-label="Đóng"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Iframe wrapper */}
                        <div className={`relative w-full ${resource.typeCode === 'TYPE_VIDEO' ? 'pt-[56.25%]' : 'h-[90vh] bg-white'}`}>
                            <iframe
                                src={getYoutubeEmbedUrl(resource.contentUrl ?? '')}
                                title={resource.title}
                                className="absolute inset-0 w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
                , document.body)}
        </>
    );
}

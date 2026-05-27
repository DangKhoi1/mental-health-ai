'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ResourceItem } from '@/types/resource.types';
import { resourceService } from '@/services/resource.service';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Play, FileText, Headphones } from 'lucide-react';

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

const getTypeIcon = (typeCode: string) => {
    switch (typeCode) {
        case 'TYPE_VIDEO': return <Play className="size-5" />;
        case 'TYPE_ARTICLE': return <FileText className="size-5" />;
        case 'TYPE_AUDIO': return <Headphones className="size-5" />;
        default: return <FileText className="size-5" />;
    }
};

export default function ResourceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const resourceId = params.resourceId as string;
    
    const [resource, setResource] = useState<ResourceItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // First check sessionStorage for resource data (from chatbot)
        const cachedResource = sessionStorage.getItem('openResource');
        if (cachedResource && cachedResource !== resourceId) {
            // Clear old sessionStorage
            sessionStorage.removeItem('openResource');
        }

        // Also check sessionStorage for full resource data
        const cachedData = sessionStorage.getItem(`resource_${resourceId}`);
        if (cachedData) {
            try {
                setResource(JSON.parse(cachedData));
                setShowModal(true);
                setLoading(false);
                return;
            } catch {
                sessionStorage.removeItem(`resource_${resourceId}`);
            }
        }

        // Fetch from API
        resourceService.getById(resourceId)
            .then(data => {
                setResource(data);
                // Cache for future use
                sessionStorage.setItem(`resource_${resourceId}`, JSON.stringify(data));
                setShowModal(true);
            })
            .catch(() => {
                setError('Không tìm thấy tài nguyên này.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [resourceId]);

    const handleClose = () => {
        setShowModal(false);
        // Navigate back to resources list
        router.push('/dashboard/resources');
    };

    // If modal is closed, show a minimal UI
    if (!showModal) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-y-4">
                <p className="text-muted-foreground">Đang chuyển hướng…</p>
                <Button onClick={handleClose} variant="outline">
                    <ArrowLeft className="size-4 mr-2" />
                    Quay lại thư viện
                </Button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-y-4">
                <div className="animate-spin rounded-full size-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Đang tải…</p>
            </div>
        );
    }

    if (error || !resource) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-y-4">
                <p className="text-muted-foreground">{error || 'Không tìm thấy tài nguyên'}</p>
                <Button onClick={handleClose} variant="outline">
                    <ArrowLeft className="size-4 mr-2" />
                    Quay lại thư viện
                </Button>
            </div>
        );
    }

    // Render modal
    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={handleClose} />
            
            <div className={`relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${resource.typeCode !== 'TYPE_VIDEO' ? 'max-w-7xl' : 'max-w-6xl'}`}>
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors z-20 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Đóng"
                >
                    <X className="size-5" />
                </button>

                <div className={`relative w-full ${resource.typeCode === 'TYPE_VIDEO' ? 'pt-[56.25%]' : 'h-[90vh] bg-white'}`}>
                    <iframe
                        src={getYoutubeEmbedUrl(resource.contentUrl ?? '')}
                        title={resource.title}
                        className="absolute inset-0 size-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

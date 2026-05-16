'use client';

import { useState, useEffect, Suspense } from 'react';
import { useResourceStore } from '@/stores/resourceStore';
import ResourceCard from '@/components/resources/ResourceCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchIcon, Sparkles, BookOpen, Wind, Music, Video } from 'lucide-react';
import ResourceCardSkeleton from '@/components/resources/ResourceCardSkeleton';
import { resourceService } from '@/services/resource.service';
import { ResourceItem } from '@/types/resource.types';

function ResourcesContent() {
    const {
        resources,
        isLoading,
        error,
        fetchResources,
        page,
        totalPages,
        total,
        limit,
    } = useResourceStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [activeResource, setActiveResource] = useState<ResourceItem | null>(null);

    // Check sessionStorage for resource to open on mount
    useEffect(() => {
        const resourceId = sessionStorage.getItem('openResource');
        if (resourceId) {
            sessionStorage.removeItem('openResource');
            resourceService.getById(resourceId)
                .then(data => {
                    setActiveResource(data);
                })
                .catch(err => {
                    console.error('Failed to fetch resource:', err);
                });
        }
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchResources(currentPage, limit, debouncedSearch, selectedCategory);
    }, [fetchResources, currentPage, limit, debouncedSearch, selectedCategory]);

    const categories = [
        { id: 'all', label: 'Tất cả', icon: Sparkles },
        { id: 'RES_MEDITATION', label: 'Thiền', icon: Music },
        { id: 'RES_BREATHING', label: 'Hít thở', icon: Wind },
        { id: 'RES_ARTICLE', label: 'Bài viết', icon: BookOpen },
        { id: 'RES_VIDEO', label: 'Video', icon: Video },
        { id: 'RES_MUSIC', label: 'Âm nhạc', icon: Music },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Thư viện chữa lành
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Khám phá các công cụ và bài tập giúp bạn cân bằng cảm xúc.
                </p>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        return (
                            <Button
                                key={cat.id}
                                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                                onClick={() => {
                                    setSelectedCategory(cat.id);
                                    setCurrentPage(1);
                                }}
                                className={`gap-2 rounded-full ${selectedCategory === cat.id ? 'shadow-md' : ''}`}
                            >
                                <Icon className="w-4 h-4" />
                                {cat.label}
                            </Button>
                        );
                    })}
                </div>

                <div className="relative w-full md:w-80">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    <Input
                        placeholder="Tìm kiếm tài liệu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 bg-background/80 backdrop-blur-sm shadow-sm focus:shadow-md transition-shadow h-10"
                    />
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <ResourceCardSkeleton key={i} />
                    ))}
                </div>
            ) : error ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p>{error}</p>
                    <Button
                        variant="link"
                        onClick={() => fetchResources(currentPage, limit, debouncedSearch, selectedCategory)}
                    >
                        Thử lại
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {resources.length > 0 ? (
                        resources.map(resource => (
                            <ResourceCard 
                                key={resource.resourceId} 
                                resource={resource}
                                isActive={activeResource?.resourceId === resource.resourceId}
                                onClose={() => setActiveResource(null)}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-muted-foreground flex flex-col items-center text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4 opacity-50">
                                <SearchIcon className="w-8 h-8" />
                            </div>
                            <p className="w-full max-w-md mx-auto text-center">
                                Không tìm thấy tài liệu nào phù hợp.
                            </p>
                            <Button
                                variant="link"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('all');
                                    setCurrentPage(1);
                                }}
                            >
                                Xóa bộ lọc
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {total > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">
                        Trang {page}/{totalPages} • Tổng {total} tài nguyên
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        >
                            Trước
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5)
                            .map((p) => (
                                <Button
                                    key={p}
                                    variant={page === p ? 'default' : 'outline'}
                                    size="sm"
                                    className="w-8"
                                    onClick={() => setCurrentPage(p)}
                                >
                                    {p}
                                </Button>
                            ))}
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        >
                            Sau
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ResourcesLoading() {
    return (
        <div className="space-y-8">
            <div>
                <div className="h-9 w-64 bg-muted rounded-md animate-pulse" />
                <div className="h-5 w-96 bg-muted rounded-md animate-pulse mt-2" />
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-10 w-24 bg-muted rounded-full animate-pulse" />
                    ))}
                </div>
                <div className="h-10 w-80 bg-muted rounded-md animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <ResourceCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

export default function ResourcesPage() {
    return (
        <Suspense fallback={<ResourcesLoading />}>
            <ResourcesContent />
        </Suspense>
    );
}

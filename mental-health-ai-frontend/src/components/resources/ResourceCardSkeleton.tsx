'use client';

export default function ResourceCardSkeleton() {
    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden animate-pulse flex flex-col h-full">
            {/* Thumbnail */}
            <div className="h-40 w-full bg-muted" />
            {/* Content */}
            <div className="p-4 flex flex-col flex-grow gap-3">
                <div className="flex items-center gap-2">
                    <div className="h-5 w-16 bg-muted rounded-full" />
                    <div className="h-4 w-12 bg-muted rounded-full" />
                </div>
                <div className="h-5 w-3/4 bg-muted rounded-lg" />
                <div className="h-4 w-full bg-muted rounded-lg" />
                <div className="h-4 w-2/3 bg-muted rounded-lg" />
                <div className="h-9 w-full bg-muted rounded-xl mt-auto" />
            </div>
        </div>
    );
}

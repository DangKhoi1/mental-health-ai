import React from 'react';
import { ChevronLeft, ChevronsLeft, ChevronRight, ChevronsRight, Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from './Button';

interface ListToolbarProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchLabel?: string;
    searchPlaceholder?: string;
    filterSlot?: React.ReactNode;
    actionSlot?: React.ReactNode;
    resultsLabel?: string;
    activeTags?: string[];
    hasActiveFilters?: boolean;
    onClearFilters?: () => void;
}

export function ListToolbar({
    searchValue,
    onSearchChange,
    searchLabel = 'Tìm kiếm',
    searchPlaceholder = 'Tìm kiếm...',
    filterSlot,
    actionSlot,
    resultsLabel,
    activeTags = [],
    hasActiveFilters = false,
    onClearFilters,
}: ListToolbarProps) {
    const searchInputId = React.useId();

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1.5 flex-1 min-w-0">
                    <label htmlFor={searchInputId} className="ml-1 block text-sm font-medium text-foreground">
                        {searchLabel}
                    </label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            id={searchInputId}
                            type="text"
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full rounded-xl border border-border bg-muted px-4 py-3 pl-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
                        />
                    </div>
                </div>
                <div className="w-full lg:w-55">{filterSlot}</div>
                <div className="w-full lg:w-auto">{actionSlot}</div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {resultsLabel && (
                    <span className="inline-flex items-center rounded-full border border-border bg-secondary/70 px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {resultsLabel}
                    </span>
                )}
                {activeTags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center rounded-full border border-border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                    >
                        {tag}
                    </span>
                ))}
                {hasActiveFilters && onClearFilters && (
                    <Button variant="outline" size="sm" onClick={onClearFilters} className="h-7 rounded-full px-3 text-xs">
                        <X className="h-3.5 w-3.5" />
                        Xóa bộ lọc
                    </Button>
                )}
            </div>
        </div>
    );
}

interface PaginationControlsProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    summary?: string;
    showWhenSinglePage?: boolean;
}

export function PaginationControls({ page, totalPages, onPageChange, summary, showWhenSinglePage = false }: PaginationControlsProps) {
    if (totalPages <= 1 && !showWhenSinglePage) return null;

    const safeTotalPages = Math.max(1, totalPages);
    const safePage = Math.min(Math.max(1, page), safeTotalPages);

    const start = Math.max(1, safePage - 2);
    const end = Math.min(safeTotalPages, start + 4);
    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">{summary}</span>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    className="h-8 w-8 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                    onClick={() => onPageChange(1)}
                    disabled={safePage === 1}
                    title="Trang đầu"
                >
                    <ChevronsLeft className="mx-auto h-4 w-4" />
                </button>
                <button
                    type="button"
                    className="h-8 w-8 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                    onClick={() => onPageChange(safePage - 1)}
                    disabled={safePage === 1}
                    title="Trang trước"
                >
                    <ChevronLeft className="mx-auto h-4 w-4" />
                </button>
                {pages.map((p) => (
                    <button
                        type="button"
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={clsx(
                            'h-8 w-8 rounded-lg text-xs transition-colors',
                            p === safePage ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-muted'
                        )}
                    >
                        {p}
                    </button>
                ))}
                <button
                    type="button"
                    className="h-8 w-8 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                    onClick={() => onPageChange(safePage + 1)}
                    disabled={safePage === safeTotalPages}
                    title="Trang sau"
                >
                    <ChevronRight className="mx-auto h-4 w-4" />
                </button>
                <button
                    type="button"
                    className="h-8 w-8 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                    onClick={() => onPageChange(safeTotalPages)}
                    disabled={safePage === safeTotalPages}
                    title="Trang cuối"
                >
                    <ChevronsRight className="mx-auto h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

interface ListEmptyStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function ListEmptyState({ title, description, actionLabel, onAction }: ListEmptyStateProps) {
    return (
        <div className="mx-auto flex min-h-55 w-full max-w-md flex-col items-center justify-center space-y-2 px-4 py-14 text-center">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs leading-6 text-muted-foreground">{description}</p>
            {actionLabel && onAction && (
                <Button variant="outline" size="sm" onClick={onAction} className="mt-1 h-8 px-3 text-xs">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}

interface EllipsisTextProps {
    text: string;
    className?: string;
}

export function EllipsisText({ text, className }: EllipsisTextProps) {
    return (
        <span title={text} className={clsx('block truncate', className)}>
            {text}
        </span>
    );
}

export function ListSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="animate-pulse space-y-2 px-4 py-4">
            {Array.from({ length: rows }, (_, r) => (
                <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                    {Array.from({ length: cols }, (_, c) => (
                        <div key={c} className="h-4 rounded bg-muted" />
                    ))}
                </div>
            ))}
        </div>
    );
}

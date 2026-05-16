'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
    footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl', footer }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!mounted || !open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

            <div className={`relative z-50 flex max-h-[90vh] w-full flex-col rounded-2xl border border-border bg-card shadow-[0_20px_60px_rgb(0,0,0,0.12)] ${maxWidth}`}>
                <div className="flex shrink-0 items-center justify-between border-b border-border p-6">
                    <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="hide-scrollbar flex-1 overflow-y-auto p-6">
                    {children}
                </div>

                {footer && (
                    <div className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-card/95 p-4 backdrop-blur-sm">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}

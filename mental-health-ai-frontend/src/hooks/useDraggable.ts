'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Position { x: number; y: number }

/**
 * useDraggable — lets a fixed-position element be repositioned by mouse/touch drag.
 *
 * @param storageKey  localStorage key to persist position (optional)
 * @param initial     initial {x, y} from bottom-right corner (positive = closer to corner)
 */
export function useDraggable<T extends HTMLElement = HTMLDivElement>(storageKey?: string, initial: Position = { x: 0, y: 0 }) {
    const [pos, setPos] = useState<Position | null>(null);

    useEffect(() => {
        let currentPos: Position | null = null;
        if (storageKey && typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved) as Position;
                    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
                        // Clamp initial value to viewport
                        const vw = window.innerWidth;
                        const vh = window.innerHeight;
                        // Use default 48px if ref is not yet set
                        const w = elementRef.current ? elementRef.current.offsetWidth : 48;
                        const h = elementRef.current ? elementRef.current.offsetHeight : 48;
                        currentPos = {
                            x: Math.min(Math.max(0, parsed.x), Math.max(0, vw - w)),
                            y: Math.min(Math.max(0, parsed.y), Math.max(0, vh - h))
                        };
                        setPos(currentPos);
                        // Save the clamped value back if it changed
                        if (currentPos.x !== parsed.x || currentPos.y !== parsed.y) {
                            localStorage.setItem(storageKey, JSON.stringify(currentPos));
                        }
                    }
                }
            } catch {}
        }

        const handleResize = () => {
            setPos((cur) => {
                if (!cur) return cur;
                const vw = window.innerWidth;
                const vh = window.innerHeight;
                const w = elementRef.current ? elementRef.current.offsetWidth : 48;
                const h = elementRef.current ? elementRef.current.offsetHeight : 48;
                const newX = Math.min(Math.max(0, cur.x), Math.max(0, vw - w));
                const newY = Math.min(Math.max(0, cur.y), Math.max(0, vh - h));
                if (newX === cur.x && newY === cur.y) return cur;
                if (storageKey) {
                    try { localStorage.setItem(storageKey, JSON.stringify({ x: newX, y: newY })); } catch {}
                }
                return { x: newX, y: newY };
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [storageKey]);

    const dragging = useRef(false);
    const hasMoved = useRef(false);
    const startMouse = useRef<Position>({ x: 0, y: 0 });
    const startPos = useRef<Position>({ x: 0, y: 0 });
    const elementRef = useRef<T | null>(null);

    const onMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const target = e.target as HTMLElement;
        // Drag starts only when user grabs an explicit drag handle.
        if (!target.closest('[data-drag-handle="true"]')) {
            return;
        }

        if ('button' in e && e.button !== 0) return;

        e.preventDefault();
        dragging.current = true;
        hasMoved.current = false;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        startMouse.current = { x: clientX, y: clientY };
        // If chưa có vị trí tuyệt đối, lấy từ vị trí render hiện tại để kéo mượt từ lần đầu.
        if (pos) {
            startPos.current = { ...pos };
        } else {
            const el = elementRef.current;
            if (el) {
                const rect = el.getBoundingClientRect();
                startPos.current = { x: rect.left, y: rect.top };
            } else {
                startPos.current = { ...initial };
            }
        }
    }, [initial, pos]);

    useEffect(() => {
        const onMove = (e: MouseEvent | TouchEvent) => {
            if (!dragging.current) return;
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            const dx = clientX - startMouse.current.x;
            const dy = clientY - startMouse.current.y;

            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                hasMoved.current = true;
            }

            const el = elementRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            // Clamp so element stays within viewport
            const newX = Math.min(Math.max(0, startPos.current.x + dx), vw - rect.width);
            const newY = Math.min(Math.max(0, startPos.current.y + dy), vh - rect.height);

            setPos({ x: newX, y: newY });
        };

        const onUp = () => {
            if (!dragging.current) return;
            dragging.current = false;
            setPos(current => {
                if (storageKey) {
                    try {
                        if (current) {
                            localStorage.setItem(storageKey, JSON.stringify(current));
                        }
                    } catch {}
                }
                return current;
            });
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchend', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchend', onUp);
        };
    }, [storageKey]);

    const onClickCapture = useCallback((e: React.MouseEvent) => {
        // Prevent accidental click actions right after dragging ends.
        if (hasMoved.current) {
            e.preventDefault();
            e.stopPropagation();
            hasMoved.current = false;
        }
    }, []);

    // Convert x/y absolute pos to CSS (left/top)
    const style: React.CSSProperties = !pos
        ? {}  // let CSS handle default position
        : { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' };

    return { style, onMouseDown, onClickCapture, elementRef, isDragging: dragging };
}

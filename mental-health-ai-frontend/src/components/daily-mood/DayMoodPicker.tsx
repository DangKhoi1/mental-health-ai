'use client';
import { useEffect, useState } from 'react';
import { dailyMoodService } from '@/services';
import { DailyMood } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DayMoodPicker({ date, refreshKey, onSelect, onEdit }: {
    date: string; refreshKey: DailyMood[]; onSelect: (mood: DailyMood) => void; onEdit: (mood: DailyMood) => void;
}) {
    const [entries, setEntries] = useState<DailyMood[]>([]);
    const [selectedId, setSelectedId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const day = date || new Date().toLocaleDateString('en-CA');
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(false);
        const [year, month, date] = day.split('-');
        const apiDate = `${date}/${month}/${year}`;
        void (async () => {
            try {
                const all: DailyMood[] = [];
                let page = 1;
                let totalPages = 1;
                do {
                    const response = await dailyMoodService.getAll(apiDate, apiDate, page, 100);
                    if (response.EC !== 1 || !response.data) throw new Error('Unable to load entries');
                    all.push(...response.data.moods);
                    totalPages = response.data.totalPages;
                    page++;
                } while (page <= totalPages && active);
                if (active) {
                    setEntries(all);
                    setSelectedId(all[0]?.dailyMoodId ?? '');
                }
            } catch {
                if (active) { setEntries([]); setError(true); }
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [day, refreshKey]);
    const selected = entries.find(entry => entry.dailyMoodId === selectedId);
    return <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <label htmlFor="daily-mood-entry" className="block font-medium">Các lần ghi nhận ngày {day.split('-').reverse().join('/')}</label>
        {loading ? <p role="status">Đang tải các lần ghi nhận…</p> : error ? <p role="alert">Không tải được các lần ghi nhận. Vui lòng tải lại trang.</p> : entries.length === 0 ? <p>Chưa có ghi nhận trong ngày này.</p> : <>
            <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger id="daily-mood-entry" className="w-full bg-background">
                    <SelectValue placeholder="Chọn lần ghi nhận" />
                </SelectTrigger>
                <SelectContent>
                    {entries.map(entry => <SelectItem key={entry.dailyMoodId} value={entry.dailyMoodId}>
                        {new Date(entry.recordedAt ?? entry.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} — Cảm xúc {entry.moodScore}/10 · Căng thẳng {entry.stressLevel}/10
                    </SelectItem>)}
                </SelectContent>
            </Select>
            {selected && <div className="space-y-2">
                <p className="whitespace-pre-wrap">{selected.note || 'Không có ghi chú'}</p>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onSelect(selected)}>Xem chi tiết</Button>
                    <Button variant="outline" onClick={() => onEdit(selected)}>Sửa lần ghi này</Button>
                </div>
            </div>}
        </>}
    </div>;
}

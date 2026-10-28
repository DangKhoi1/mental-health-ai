 'use client';
import { DailyMood } from '@/types';
import { Button } from '@/components/ui/button';

export default function RecentMoodChoice({ mood, busy, onEdit, onCreate, onCancel }: {
    mood: DailyMood; busy: boolean; onEdit: () => void; onCreate: () => void; onCancel: () => void;
}) {
    return <div role="alert" className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 space-y-3">
        <p>Bạn vừa ghi nhận lúc {new Date(mood.recordedAt ?? mood.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}. Bạn muốn sửa lần đó hay ghi nhận cảm xúc mới?</p>
        <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={onEdit} variant="outline">Sửa lần vừa ghi</Button>
            <Button disabled={busy} onClick={onCreate}>Ghi nhận mới</Button>
            <Button disabled={busy} onClick={onCancel} variant="ghost">Hủy</Button>
        </div>
    </div>;
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trash2 } from 'lucide-react';
import { dailyMoodService } from '@/services/dailyMood';
import { toast } from 'sonner';

interface TrashedDailyMood {
    dailyMoodId: string;
    moodScore: number;
    deletedAt: string;
}

export default function DailyMoodTrash() {
    const [items, setItems] = useState<TrashedDailyMood[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const res = await dailyMoodService.getTrashed(1, 50);
            setItems((res?.data?.moods as unknown as TrashedDailyMood[]) || []);
        } catch {
            toast.error('Lỗi khi tải dữ liệu thùng rác.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleRestore = async (id: string) => {
        try {
            const res = await dailyMoodService.restore(id);
            if (res?.EC === 1) {
                toast.success('Khôi phục thành công.');
                fetchItems();
            } else {
                toast.error(res?.EM || 'Khôi phục thất bại. Kiểm tra trùng lặp bản ghi.');
            }
        } catch {
            toast.error('Khôi phục thất bại.');
        }
    };

    return (
        <div className="border rounded-xl overflow-hidden bg-card mt-6">
            {isLoading ? (
                <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                    <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></span>
                    Đang tải thùng rác...
                </div>
            ) : items.length === 0 ? (
                <div className="p-16 min-h-65 flex flex-col items-center justify-center text-center">
                    <Trash2 className="w-12 h-12 text-center text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground">Đã xóa gần đây</h3>
                    <p className="text-muted-foreground  mt-1">Không có nhật ký tâm trạng nào bị xóa gần đây.</p>
                </div>
            ) : (
                <div className="divide-y divide-border">
                    {items.map((item) => (
                        <div key={item.dailyMoodId} className="p-5 flex items-center justify-between hover:bg-muted/10 transition-colors group">
                            <div className="flex-1 min-w-0 pr-4">
                                <h4 className="font-medium text-foreground truncate">
                                    Tâm trạng: {item.moodScore}/10
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Đã xóa lúc: {new Date(item.deletedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore(item.dailyMoodId)}
                                className="gap-2 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/5 hover:text-emerald-500 transition-colors shrink-0"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span className="hidden sm:inline">Khôi phục</span>
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

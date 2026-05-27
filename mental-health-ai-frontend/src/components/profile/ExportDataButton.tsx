'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { dailyMoodService, journalService, sleepLogService, userService } from '@/services';

export default function ExportDataButton() {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        toast.info('Đang chuẩn bị dữ liệu…');

        try {
            const [profileRes, moodRes, journalRes, sleepRes] = await Promise.all([
                userService.getProfile(),
                dailyMoodService.getAll(),
                journalService.getAll(1, 1000), // Fetch up to 1000 entries
                sleepLogService.getAll()
            ]);

            const exportData = {
                exportedAt: new Date().toISOString(),
                profile: profileRes,
                dailyMoods: moodRes.data?.moods || [],
                journals: journalRes.data?.journals || [],
                sleepLogs: sleepRes.data?.sleepLogs || []
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `mental-health-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('Xuất dữ liệu thành công!');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Có lỗi xảy ra khi xuất dữ liệu.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
        >
            {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Xuất dữ liệu cá nhân
        </Button>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useSleepLogStore } from '@/stores';
import { CreateSleepLogDto, SleepLog } from '@/types';
import SleepLogForm from '@/components/sleep-log/SleepLogForm';
import SleepLogList from '@/components/sleep-log/SleepLogList';
import SleepLogModal from '@/components/sleep-log/SleepLogModal';
import SleepLogTrash from '@/components/sleep-log/SleepLogTrash';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Calendar, Filter, X, Trash2, Moon } from 'lucide-react';
import { PinGuard } from '@/components/ui/pin-guard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function SleepLogContent() {
    const {
        sleepLogs,
        isLoading,
        isSubmitting,
        fetchSleepLogs,
        createSleepLog,
        updateSleepLog,
        deleteSleepLog,
        page,
        totalPages,
        total,
        limit,
    } = useSleepLogStore();
    const [showForm, setShowForm] = useState(false);
    const [selectedLog, setSelectedLog] = useState<SleepLog | null>(null);
    const [formData, setFormData] = useState<CreateSleepLogDto>({
        sleepDate: new Date().toISOString().split('T')[0],
        bedTime: '22:00',
        wakeUpTime: '06:00',
        sleepQualityScore: 7,
        sleepNote: '',
        sleepType: 'night',
        napStartTime: undefined,
        napEndTime: undefined,
    });

    const [filterDate, setFilterDate] = useState<string>('');
    const [filterQuality, setFilterQuality] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [editTargetId, setEditTargetId] = useState<string | null>(null);

    const formatDateForApi = (dateStr: string) => {
        if (!dateStr) return undefined;
        const [year, month, day] = dateStr.split('-');
        if (!year || !month || !day) return undefined;
        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
        const formattedDate = formatDateForApi(filterDate);
        fetchSleepLogs(formattedDate, formattedDate, currentPage, limit);
    }, [fetchSleepLogs, filterDate, currentPage, limit]);

    const filteredLogs = sleepLogs.filter(log => {
        const matchesDate = filterDate ? new Date(log.sleepDate).toLocaleDateString('en-CA') === filterDate : true;

        let matchesQuality = true;
        if (filterQuality === 'good') matchesQuality = log.sleepQualityScore >= 8;
        if (filterQuality === 'average') matchesQuality = log.sleepQualityScore >= 5 && log.sleepQualityScore < 8;
        if (filterQuality === 'bad') matchesQuality = log.sleepQualityScore < 5;

        return matchesDate && matchesQuality;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const submitData: CreateSleepLogDto = {
            ...formData,
            sleepType: 'night' as const,
            sleepDate: formData.sleepDate.split('-').reverse().join('/'),
            bedTime: `${formData.sleepDate.split('-').reverse().join('/')} ${formData.bedTime}`,
            wakeUpTime: `${formData.sleepDate.split('-').reverse().join('/')} ${formData.wakeUpTime}`,
        };

        // Add nap times if they exist
        if (formData.napStartTime && formData.napEndTime) {
            submitData.napStartTime = `${formData.sleepDate.split('-').reverse().join('/')} ${formData.napStartTime}`;
            submitData.napEndTime = `${formData.sleepDate.split('-').reverse().join('/')} ${formData.napEndTime}`;
        }

        let success;
        if (editTargetId) {
            success = await updateSleepLog(editTargetId, submitData);
        } else {
            success = await createSleepLog(submitData);
        }

        if (success) {
            toast.success(editTargetId ? 'Cập nhật giấc ngủ thành công!' : 'Tạo nhật ký giấc ngủ thành công!');
            handleCloseForm();
        } else {
            const storeError = useSleepLogStore.getState().error;
            toast.error(storeError || 'Có lỗi xảy ra. Vui lòng thử lại.');
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditTargetId(null);
        setFormData({
            sleepDate: new Date().toISOString().split('T')[0],
            bedTime: '22:00',
            wakeUpTime: '06:00',
            sleepQualityScore: 7,
            sleepNote: '',
            sleepType: 'night',
            napStartTime: undefined,
            napEndTime: undefined,
        });
    };

    const handleEdit = (log: SleepLog) => {
        const bd = new Date(log.bedTime);
        const wu = new Date(log.wakeUpTime);
        const formatTime = (d: Date) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });

        // Log.sleepDate coming from backend might be 'YYYY-MM-DD' since it is Date string
        const sDate = log.sleepDate.includes('T') ? log.sleepDate.split('T')[0] : log.sleepDate;

        const editData: CreateSleepLogDto = {
            sleepDate: sDate,
            bedTime: formatTime(bd),
            wakeUpTime: formatTime(wu),
            sleepQualityScore: log.sleepQualityScore,
            sleepNote: log.sleepNote || '',
            sleepType: 'night',
        };

        // Include nap times if they exist
        if (log.napStartTime) {
            const ns = new Date(log.napStartTime);
            editData.napStartTime = formatTime(ns);
        }
        if (log.napEndTime) {
            const ne = new Date(log.napEndTime);
            editData.napEndTime = formatTime(ne);
        }

        setFormData(editData);
        setEditTargetId(log.sleepLogId);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: string) => {
        setDeleteTargetId(id);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;

        const success = await deleteSleepLog(deleteTargetId);

        if (success) {
            toast.success('Xóa nhật ký giấc ngủ thành công!');
        } else {
            const storeError = useSleepLogStore.getState().error;
            toast.error(storeError || 'Bạn không có quyền xóa bản ghi này.');
        }

        setDeleteTargetId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-0 sm:pr-20 lg:pr-32">
                <div className="relative">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight flex items-center gap-3">
                        <span className="w-2 h-8 bg-indigo-500 rounded-full" />
                        Theo dõi giấc ngủ
                    </h1>
                    <p className="text-muted-foreground mt-1 ml-5">
                        Ghi lại và phân tích chất lượng giấc ngủ của bạn mỗi đêm
                    </p>
                </div>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="active" className="flex items-center gap-2">
                        <Moon className="size-4" />
                        Nhật ký
                    </TabsTrigger>
                    <TabsTrigger value="trash" className="flex items-center gap-2">
                        <Trash2 className="size-4" />
                        Đã xóa
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-6 mt-0">
                    {/* Filter & Action Section */}
                    <div className="bg-indigo-500/5 dark:bg-indigo-500/10 p-4 md:p-6 rounded-2xl border border-indigo-500/20 shadow-sm flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-end backdrop-blur-sm">
                        <div className="w-full md:flex-1 gap-y-2">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="size-4" />
                                Lọc theo ngày
                            </label>
                            <DatePicker
                                value={filterDate}
                                onChange={(val) => {
                                    setFilterDate(val);
                                    setCurrentPage(1);
                                }}
                                className="w-full h-12 rounded-xl px-4 bg-background"
                                placeholder="Chọn ngày lọc"
                            />
                        </div>
                        <div className="w-full md:flex-1 gap-y-2">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Filter className="size-4" />
                                Lọc theo chất lượng
                            </label>
                            <Select value={filterQuality} onValueChange={setFilterQuality}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn chất lượng" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="good">Tốt (8-10)</SelectItem>
                                    <SelectItem value="average">Khá (5-7)</SelectItem>
                                    <SelectItem value="bad">Kém (&lt; 5)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pt-2 md:pt-0">
                            {(filterDate || filterQuality !== 'all') && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setFilterDate('');
                                        setFilterQuality('all');
                                    }}
                                    className="flex items-center gap-2 w-full sm:w-auto"
                                >
                                    <X className="size-4" />
                                    Xóa
                                </Button>
                            )}

                            <Button
                                onClick={() => {
                                    if (showForm) {
                                        handleCloseForm();
                                    } else {
                                        setShowForm(true);
                                    }
                                }}
                                className="shadow-sm w-full sm:w-auto md:flex-none flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                {showForm ? (
                                    <>
                                        <X className="size-4" />
                                        Đóng
                                    </>
                                ) : (
                                    <>
                                        <Moon className="size-4" />
                                        Thêm mới
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {showForm && (
                        <SleepLogForm
                            formData={formData}
                            setFormData={setFormData}
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                        />
                    )}

                    <SleepLogModal sleepLog={selectedLog} onClose={() => setSelectedLog(null)} />
                    <ConfirmDialog
                        open={!!deleteTargetId}
                        title="Xóa bản ghi giấc ngủ?"
                        description="Bản ghi sẽ được chuyển vào mục Đã xóa và bạn có thể khôi phục sau đó. Bạn có chắc chắn muốn tiếp tục?"
                        confirmLabel="Xóa"
                        onClose={() => setDeleteTargetId(null)}
                        onConfirm={confirmDelete}
                    />

                    <SleepLogList
                        sleepLogs={filteredLogs}
                        isLoading={isLoading}
                        onDelete={handleDelete}
                        onSelect={setSelectedLog}
                        onEdit={handleEdit}
                    />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">
                            Trang {page}/{totalPages} • {filterDate || filterQuality !== 'all' ? `Hiển thị ${filteredLogs.length}` : `Tổng ${total}`} bản ghi
                        </p>
                        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
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
                </TabsContent>

                <TabsContent value="trash" className="mt-0">
                    <SleepLogTrash />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function SleepLogPage() {
    return (
        <PinGuard resourceName="nhật ký giấc ngủ">
            <SleepLogContent />
        </PinGuard>
    );
}

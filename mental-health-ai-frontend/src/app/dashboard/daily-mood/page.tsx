'use client';

import { useEffect, useState } from 'react';
import { useDailyMoodStore } from '@/stores';
import { CreateDailyMoodDto, WorkloadLevel, DailyMood } from '@/types';
import DailyMoodForm from '@/components/daily-mood/DailyMoodForm';
import DailyMoodList from '@/components/daily-mood/DailyMoodList';
import DailyMoodModal from '@/components/daily-mood/DailyMoodModal';
import DailyMoodTrash from '@/components/daily-mood/DailyMoodTrash';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Calendar, Filter, Plus, X, Trash2, BookOpen } from 'lucide-react';
import { PinGuard } from '@/components/ui/pin-guard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function DailyMoodContent() {
    const {
        moods,
        isLoading,
        isSubmitting,
        fetchMoods,
        createMood,
        updateMood,
        deleteMood,
        page,
        totalPages,
        total,
        limit,
    } = useDailyMoodStore();
    const [showForm, setShowForm] = useState(false);
    const [selectedMood, setSelectedMood] = useState<DailyMood | null>(null);
    const [formData, setFormData] = useState<CreateDailyMoodDto>({
        moodScore: 5,
        stressLevel: 5,
        workloadLevel: WorkloadLevel.MEDIUM,
        note: '',
    });

    const [filterDate, setFilterDate] = useState<string>('');
    const [filterMood, setFilterMood] = useState<string>('all');
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
        fetchMoods(formattedDate, formattedDate, currentPage, limit);
    }, [fetchMoods, filterDate, currentPage, limit]);

    const filteredMoods = moods.filter(mood => {
        const matchesDate = filterDate ? new Date(mood.createdAt).toLocaleDateString('en-CA') === filterDate : true;

        let matchesMood = true;
        if (filterMood === 'good') matchesMood = mood.moodScore >= 8;
        if (filterMood === 'neutral') matchesMood = mood.moodScore >= 5 && mood.moodScore < 8;
        if (filterMood === 'bad') matchesMood = mood.moodScore < 5;

        return matchesDate && matchesMood;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let success;
        if (editTargetId) {
            success = await updateMood(editTargetId, formData);
        } else {
            success = await createMood(formData);
        }

        if (success) {
            toast.success(editTargetId ? 'Cập nhật tâm trạng thành công!' : 'Tạo nhật ký tâm trạng thành công!');
            handleCloseForm();
        } else {
            const storeError = useDailyMoodStore.getState().error;
            toast.error(storeError || 'Có lỗi xảy ra. Vui lòng thử lại.');
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditTargetId(null);
        setFormData({
            moodScore: 5,
            stressLevel: 5,
            workloadLevel: WorkloadLevel.MEDIUM,
            note: '',
        });
    }

    const handleEdit = (mood: DailyMood) => {
        setFormData({
            moodScore: mood.moodScore,
            stressLevel: mood.stressLevel,
            workloadLevel: mood.workloadLevel || WorkloadLevel.MEDIUM,
            note: mood.note || '',
        });
        setEditTargetId(mood.dailyMoodId);
        setShowForm(true);
        // Scroll to top to see form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: string) => {
        setDeleteTargetId(id);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;

        const success = await deleteMood(deleteTargetId);

        if (success) {
            toast.success('Xóa bản ghi tâm trạng thành công!');
        } else {
            const storeError = useDailyMoodStore.getState().error;
            toast.error(storeError || 'Bạn không có quyền xóa bản ghi này.');
        }

        setDeleteTargetId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-0 sm:pr-20 lg:pr-32">
                <div className="relative">
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <span className="w-2 h-8 bg-emerald-500 rounded-full" />
                        Theo dõi tâm trạng
                    </h1>
                    <p className="text-muted-foreground mt-1 ml-5">
                        Ghi lại cảm xúc hằng ngày của bạn để thấu hiểu bản thân hơn
                    </p>
                </div>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="active" className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Nhật ký
                    </TabsTrigger>
                    <TabsTrigger value="trash" className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Đã xóa
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-6 mt-0">
                    {/* Filter & Action Section */}
                    <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-4 md:p-6 rounded-2xl border border-emerald-500/20 shadow-sm flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-end backdrop-blur-sm">
                        <div className="w-full md:flex-1 space-y-2">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
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
                        <div className="w-full md:flex-1 space-y-2">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                Lọc theo tâm trạng
                            </label>
                            <Select value={filterMood} onValueChange={setFilterMood}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn tâm trạng" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="good">Tốt (8-10)</SelectItem>
                                    <SelectItem value="neutral">Bình thường (5-7)</SelectItem>
                                    <SelectItem value="bad">Tệ (&lt; 5)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pt-2 md:pt-0">
                            {(filterDate || filterMood !== 'all') && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setFilterDate('');
                                        setFilterMood('all');
                                    }}
                                    className="flex items-center gap-2 w-full sm:w-auto"
                                >
                                    <X className="w-4 h-4" />
                                    Xóa bộ lọc
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
                                        <X className="w-4 h-4" />
                                        Đóng
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        Thêm mới
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {showForm && (
                        <DailyMoodForm
                            formData={formData}
                            setFormData={setFormData}
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                        />
                    )}

                    <DailyMoodModal mood={selectedMood} onClose={() => setSelectedMood(null)} />
                    <ConfirmDialog
                        open={!!deleteTargetId}
                        title="Xóa bản ghi tâm trạng?"
                        description="Bản ghi sẽ được chuyển vào mục Đã xóa và bạn có thể khôi phục sau đó. Bạn có chắc chắn muốn tiếp tục?"
                        confirmLabel="Xóa"
                        onClose={() => setDeleteTargetId(null)}
                        onConfirm={confirmDelete}
                    />

                    <DailyMoodList
                        moods={filteredMoods}
                        isLoading={isLoading}
                        onDelete={handleDelete}
                        onSelect={setSelectedMood}
                        onEdit={handleEdit}
                    />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">
                            Trang {page}/{totalPages} • {filterDate || filterMood !== 'all' ? `Hiển thị ${filteredMoods.length}` : `Tổng ${total}`} bản ghi
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
                    <DailyMoodTrash />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function DailyMoodPage() {
    return (
        <PinGuard resourceName="tâm trạng">
            <DailyMoodContent />
        </PinGuard>
    );
}

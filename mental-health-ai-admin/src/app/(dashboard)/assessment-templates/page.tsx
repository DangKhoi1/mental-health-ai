'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Lock as LockIcon, Plus, Search, Settings, Trash2, Unlock, X } from 'lucide-react';
import { toast } from 'sonner';
import {
    Alert,
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input,
    LoadingSpinner,
    Modal,
    PaginationControls,
    Select,
    TextArea,
    ConfirmDialog,
} from '@/components/ui';
import { assessmentService } from '@/services';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';

interface AssessmentTemplate {
    assessmentTemplateId: string;
    title: string;
    typeCode: string;
    description?: string;
    isActive: boolean;
    totalQuestions?: number;
}

const fallbackTemplates: AssessmentTemplate[] = [
    { assessmentTemplateId: 't1', title: 'Bài đánh giá PHQ-9', typeCode: 'PHQ9', isActive: true, totalQuestions: 9 },
    { assessmentTemplateId: 't2', title: 'Bài đánh giá GAD-7', typeCode: 'GAD7', isActive: true, totalQuestions: 7 },
    { assessmentTemplateId: 't3', title: 'Bài đánh giá stress', typeCode: 'DASS', isActive: false, totalQuestions: 21 },
];

export default function AssessmentTemplatePage() {
    const PAGE_SIZE = 10;
    const router = useRouter();
    const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<AssessmentTemplate | null>(null);
    const [pendingDeleteTemplate, setPendingDeleteTemplate] = useState<AssessmentTemplate | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        typeCode: '',
        description: '',
        isActive: true,
    });

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await assessmentService.getAssessmentTemplates();
            const list = (res?.templates || res?.data || []) as AssessmentTemplate[];
            setTemplates(Array.isArray(list) && list.length > 0 ? list : fallbackTemplates);
        } catch {
            setTemplates(fallbackTemplates);
            setError('Không tải được backend, đang hiển thị dữ liệu mẫu.');
        } finally {
            setLoading(false);
        }
    };

    const filteredTemplates = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return templates.filter((template) => {
            const matchKeyword =
                !keyword ||
                template.title.toLowerCase().includes(keyword) ||
                template.typeCode.toLowerCase().includes(keyword) ||
                (template.description || '').toLowerCase().includes(keyword);

            const matchStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && template.isActive) ||
                (statusFilter === 'inactive' && !template.isActive);

            return matchKeyword && matchStatus;
        });
    }, [templates, search, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));
    const paginatedTemplates = useMemo(
        () => filteredTemplates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
        [filteredTemplates, currentPage],
    );

    const activeCount = useMemo(
        () => templates.filter((item) => item.isActive).length,
        [templates],
    );

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setCurrentPage(1);
    };

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenModal = (template?: AssessmentTemplate) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                title: template.title,
                typeCode: template.typeCode,
                description: template.description || '',
                isActive: template.isActive,
            });
        } else {
            setEditingTemplate(null);
            setFormData({
                title: '',
                typeCode: '',
                description: '',
                isActive: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTemplate) {
                await assessmentService.updateAssessmentTemplate(editingTemplate.assessmentTemplateId, formData);
                toast.success('Cập nhật bài đánh giá thành công.');
            } else {
                await assessmentService.createAssessmentTemplate(formData);
                toast.success('Tạo bài đánh giá thành công.');
            }
            setIsModalOpen(false);
            await loadData();
        } catch {
            toast.error('Có lỗi xảy ra khi lưu bài đánh giá.');
        }
    };

    const handleDelete = (template: AssessmentTemplate) => {
        setPendingDeleteTemplate(template);
    };

    const confirmDeleteTemplate = async () => {
        if (!pendingDeleteTemplate) return;
        try {
            await assessmentService.deleteAssessmentTemplate(pendingDeleteTemplate.assessmentTemplateId);
            toast.success('Xóa bài đánh giá thành công.');
            setPendingDeleteTemplate(null);
            await loadData();
        } catch {
            toast.error('Có lỗi xảy ra khi xóa bài đánh giá.');
        }
    };

    const toggleStatus = async (template: AssessmentTemplate) => {
        try {
            await assessmentService.updateAssessmentTemplate(template.assessmentTemplateId, { isActive: !template.isActive });
            toast.success(template.isActive ? 'Đã khóa bài đánh giá.' : 'Đã mở bài đánh giá.');
            await loadData();
        } catch {
            toast.error('Có lỗi xảy ra khi cập nhật trạng thái.');
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Quản lý bài đánh giá tâm lý"
                description="Định nghĩa các bài đánh giá tâm lý và cấu hình tổng quát."
            >

            </PageHeader>

            <Card className="border-border/70 shadow-sm">
                <CardContent className="space-y-4 p-4 md:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                            <div className="space-y-1.5">
                                <label className="ml-1 block text-sm font-medium text-foreground">Tìm kiếm</label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        className="pl-11"
                                        placeholder="Tìm theo tiêu đề, mã hoặc mô tả..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>
                            </div>

                            <Select
                                label="Lọc trạng thái"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
                                    setCurrentPage(1);
                                }}
                                options={[
                                    { value: 'all', label: 'Tất cả trạng thái' },
                                    { value: 'active', label: 'Đang hoạt động' },
                                    { value: 'inactive', label: 'Đang khóa' },
                                ]}
                            />
                        </div>

                        <div className="flex items-center gap-2 lg:pb-0.5">
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                disabled={!search && statusFilter === 'all'}
                            >
                                <X className="h-4 w-4" />
                                Xóa lọc
                            </Button>
                            <Button onClick={() => handleOpenModal()}>
                                <Plus className="h-4 w-4" />
                                Thêm bài đánh giá
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
                        <span>
                            Hiển thị <span className="font-semibold text-foreground">{paginatedTemplates.length}</span> kết quả
                        </span>
                        <span>
                            Tổng: <span className="font-semibold text-foreground">{templates.length}</span>
                        </span>
                        <span>
                            Đang hoạt động: <span className="font-semibold text-foreground">{activeCount}</span>
                        </span>
                    </div>
                </CardContent>
            </Card>

            {error && <Alert variant="warning">{error}</Alert>}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {loading ? (
                    <div className="col-span-full flex justify-center py-20">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <Card className="col-span-full border-dashed border-border/80 bg-muted/20">
                        <CardContent className="flex min-h-55 flex-col items-center justify-center py-16 text-center">
                            <div className="rounded-full bg-white p-3 shadow-sm">
                                <Search className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-foreground">Không tìm thấy bài đánh giá phù hợp</h3>
                            <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                Thử đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc trạng thái để xem thêm kết quả.
                            </p>
                            <div className="mt-5">
                                <Button variant="outline" onClick={clearFilters}>
                                    Xóa lọc
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    paginatedTemplates.map((template) => (
                        <Card key={template.assessmentTemplateId} className="flex flex-col border-border/70 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div className="flex-1 mr-4">
                                    <Badge variant={template.isActive ? 'success' : 'danger'}>
                                        {template.isActive ? 'Đang mở' : 'Đang khóa'}
                                    </Badge>
                                    <CardTitle className="text-xl mt-2">{template.title}</CardTitle>
                                </div>
                                <Badge variant="outline">{template.typeCode}</Badge>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">
                                    {template.description || 'Không có mô tả.'}
                                </p>
                                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                                    <span className="text-sm font-medium">{template.totalQuestions || 0} câu hỏi</span>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => router.push('/assessment-questions')}
                                            title="Quản lý câu hỏi"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleOpenModal(template)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-amber-400 text-amber-950 border-amber-500 hover:bg-amber-400"
                                            onClick={() => toggleStatus(template)}
                                        >
                                            {template.isActive ? <LockIcon className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() => handleDelete(template)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {!loading && filteredTemplates.length > 0 && (
                <PaginationControls
                    page={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    showWhenSinglePage
                    summary={`Hiển thị ${paginatedTemplates.length} trên tổng ${filteredTemplates.length} bài đánh giá • Trang ${currentPage}/${totalPages}`}
                />
            )}

            <ConfirmDialog
                open={!!pendingDeleteTemplate}
                title="Xóa bài đánh giá?"
                description={pendingDeleteTemplate ? 'Hành động này sẽ xóa bài đánh giá và toàn bộ câu hỏi liên quan.' : undefined}
                confirmLabel="Xóa"
                confirmVariant="danger"
                onClose={() => setPendingDeleteTemplate(null)}
                onConfirm={confirmDeleteTemplate}
            />

            {/* Create/Edit Modal */}
            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTemplate ? 'Sửa bài đánh giá' : 'Thêm bài đánh giá mới'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Tiêu đề bài đánh giá"
                        placeholder="Ví dụ: Đánh giá Trầm cảm PHQ-9"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Mã bài đánh giá"
                            placeholder="Ví dụ: PHQ9"
                            required
                            disabled={!!editingTemplate}
                            value={formData.typeCode}
                            onChange={(e) => setFormData({ ...formData, typeCode: e.target.value })}
                        />
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-foreground ml-1">Trạng thái</label>
                            <div className="flex h-12 items-center px-4 bg-muted border border-border rounded-xl">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <label htmlFor="isActive" className="ml-3 text-sm text-foreground">Đang hoạt động</label>
                            </div>
                        </div>
                    </div>
                    <TextArea
                        label="Mô tả"
                        placeholder="Mô tả ngắn gọn về mục đích của bài đánh giá này..."
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <div className="pt-4 flex justify-end gap-3">
                        <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                        <Button type="submit">Lưu thay đổi</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

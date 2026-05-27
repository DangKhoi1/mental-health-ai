'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, ChevronDown, X } from 'lucide-react';
import { toast } from 'sonner';
import {
    Alert,
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    ConfirmDialog,
    Input,
    ListEmptyState,
    ListSkeleton,
    ListToolbar,
    PaginationControls,
    TextArea,
    Select,
} from '@/components/ui';
import { assessmentService } from '@/services/assessment';
import { PageHeader } from '@/components/layout/PageHeader';

interface Template {
    id: string;
    title: string;
    description?: string;
    typeCode: string;
    isActive: boolean;
    createdAt?: string;
    questionsCount?: number;
}

interface Question {
    id: string;
    content: string;
    order: number;
    options?: QuestionOption[];
}

interface QuestionOption {
    id: string;
    optionText: string;
    score: number;
}

interface TemplateForm {
    title: string;
    description: string;
    typeCode: string;
    isActive: boolean;
}

const defaultForm: TemplateForm = {
    title: '',
    description: '',
    typeCode: 'GENERAL',
    isActive: true,
};

const ASSESSMENT_TYPES = [
    { value: 'GENERAL', label: 'Đánh giá chung' },
    { value: 'STRESS', label: 'Đánh giá căng thẳng' },
    { value: 'ANXIETY', label: 'Đánh giá lo âu' },
    { value: 'DEPRESSION', label: 'Đánh giá trầm cảm' },
    { value: 'SLEEP', label: 'Đánh giá chất lượng giấc ngủ' },
];

export default function AssessmentsPage() {
    const PAGE_SIZE = 6;
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Template | null>(null);
    const [form, setForm] = useState<TemplateForm>(defaultForm);
    const [submitting, setSubmitting] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<Template | null>(null);

    const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
    const [templateQuestions, setTemplateQuestions] = useState<Record<string, Question[]>>({});
    const [loadingQuestions, setLoadingQuestions] = useState<Record<string, boolean>>({});
    const [currentPage, setCurrentPage] = useState(1);

    const formCardRef = React.useRef<HTMLDivElement>(null);

    const filteredTemplates = useMemo(
        () =>
            templates.filter((t) =>
                (search ? t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()) : true)
                && (typeFilter ? t.typeCode === typeFilter : true),
            ),
        [templates, search, typeFilter],
    );
    const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));
    const paginatedTemplates = useMemo(
        () => filteredTemplates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
        [filteredTemplates, currentPage],
    );
    const hasActiveFilters = search.trim().length > 0 || typeFilter !== '';

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await assessmentService.getAssessmentTemplates();
            const payload = data as {
                templates?: Template[];
                data?: { templates?: Template[] } | Template[];
            };
            const list = Array.isArray(data)
                ? data
                : payload?.templates
                ?? (Array.isArray(payload?.data) ? payload.data : payload?.data?.templates)
                ?? [];
            setTemplates(Array.isArray(list) ? list : []);
        } catch {
            toast.error('Không thể tải danh sách bài đánh giá');
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    };

    const loadQuestions = async (templateId: string) => {
        if (templateQuestions[templateId]) return;

        try {
            setLoadingQuestions((p) => ({ ...p, [templateId]: true }));
            const data = await assessmentService.getAssessmentTemplateById(templateId);
            const payload = data as {
                template?: { questions?: Question[] };
                questions?: Question[];
            };
            setTemplateQuestions((p) => ({
                ...p,
                [templateId]: payload?.template?.questions || payload?.questions || [],
            }));
        } catch {
            toast.error('Không thể tải câu hỏi');
        } finally {
            setLoadingQuestions((p) => ({ ...p, [templateId]: false }));
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const focusForm = () => {
        requestAnimationFrame(() => {
            formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };

    const openCreate = () => {
        setEditing(null);
        setForm(defaultForm);
        setShowForm(true);
        focusForm();
    };

    const openEdit = (template: Template) => {
        setEditing(template);
        setForm({
            title: template.title || '',
            description: template.description || '',
            typeCode: template.typeCode || 'GENERAL',
            isActive: template.isActive,
        });
        setShowForm(true);
        focusForm();
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            toast.error('Vui lòng nhập tiêu đề bài đánh giá');
            return;
        }

        setSubmitting(true);
        try {
            if (editing) {
                await assessmentService.updateAssessmentTemplate(editing.id, form);
                toast.success('Cập nhật bài đánh giá thành công');
            } else {
                await assessmentService.createAssessmentTemplate(form);
                toast.success('Tạo bài đánh giá thành công');
            }
            setShowForm(false);
            setEditing(null);
            setForm(defaultForm);
            await loadTemplates();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
            toast.error(`Lỗi: ${msg}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (template: Template) => {
        setSubmitting(true);
        try {
            await assessmentService.deleteAssessmentTemplate(template.id);
            toast.success('Xóa bài đánh giá thành công');
            setPendingDelete(null);
            await loadTemplates();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
            toast.error(`Lỗi: ${msg}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleExpand = async (template: Template) => {
        if (expandedTemplateId === template.id) {
            setExpandedTemplateId(null);
        } else {
            setExpandedTemplateId(template.id);
            await loadQuestions(template.id);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Quản lý bài đánh giá"
                description="Chuẩn hóa bộ câu hỏi, trạng thái và nội dung hiển thị cho người dùng."
            />

            <ListToolbar
                searchValue={search}
                onSearchChange={(value) => {
                    setSearch(value);
                    setCurrentPage(1);
                }}
                searchPlaceholder="Tìm theo tên hoặc mô tả..."
                filterSlot={(
                    <Select
                        value={typeFilter}
                        onChange={(e) => {
                            setTypeFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        options={[
                            { value: '', label: 'Tất cả loại đánh giá' },
                            ...ASSESSMENT_TYPES,
                        ]}
                    />
                )}
                actionSlot={(
                    <Button onClick={openCreate} className="w-full gap-2 sm:w-auto">
                        <Plus size={18} />
                        Thêm bài đánh giá
                    </Button>
                )}
                resultsLabel={`${filteredTemplates.length} bài đánh giá`}
                activeTags={typeFilter ? [ASSESSMENT_TYPES.find((t) => t.value === typeFilter)?.label || typeFilter] : []}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={() => {
                    setSearch('');
                    setTypeFilter('');
                    setCurrentPage(1);
                }}
            />

            {/* Form */}
            {showForm && (
                <div ref={formCardRef}>
                    <Card className="border-border bg-accent/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <h2 className="text-lg font-semibold">{editing ? 'Chỉnh sửa' : 'Tạo mới'} bài đánh giá</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditing(null);
                                    setForm(defaultForm);
                                }}
                            >
                                <X size={18} />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-foreground">Tiêu đề *</label>
                                <Input
                                    value={form.title}
                                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                                    placeholder="Ví dụ: Đánh giá căng thẳng hàng ngày"
                                    disabled={submitting}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700">Mô tả</label>
                                <TextArea
                                    value={form.description}
                                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                    placeholder="Mô tả bài đánh giá..."
                                    disabled={submitting}
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Loại đánh giá *</label>
                                    <Select
                                        options={ASSESSMENT_TYPES}
                                        value={form.typeCode}
                                        onChange={(e) => setForm((p) => ({ ...p, typeCode: e.target.value }))}
                                        disabled={submitting}
                                    />
                                </div>

                                <div className="flex items-end">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={form.isActive}
                                            onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                                            disabled={submitting}
                                            className="size-4"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Kích hoạt</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditing(null);
                                        setForm(defaultForm);
                                    }}
                                    disabled={submitting}
                                >
                                    Hủy
                                </Button>
                                <Button onClick={handleSave} disabled={submitting} className="gap-2">
                                    {submitting && <Loader2 className="size-4 animate-spin" />}
                                    {submitting ? 'Đang lưu...' : 'Lưu'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Error Alert */}
            {error && <Alert variant="error">{error}</Alert>}

            {/* Loading */}
            {loading ? (
                <ListSkeleton rows={6} cols={3} />
            ) : filteredTemplates.length === 0 ? (
                <Card>
                    <CardContent>
                        <ListEmptyState
                            title={search || typeFilter ? 'Không tìm thấy bài đánh giá phù hợp' : 'Chưa có bài đánh giá nào'}
                            description="Thử thay đổi bộ lọc hoặc tạo mới một bài đánh giá để bắt đầu."
                            actionLabel={hasActiveFilters ? 'Đặt lại bộ lọc' : undefined}
                            onAction={hasActiveFilters ? () => {
                                setSearch('');
                                setTypeFilter('');
                            } : undefined}
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {paginatedTemplates.map((template) => (
                        <Card key={template.id} className="overflow-hidden">
                            <div className="flex items-center justify-between p-4">
                                <div className="flex flex-1 items-center gap-3">
                                    <button
                                        onClick={() => handleToggleExpand(template)}
                                        className="size-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                                    >
                                        <ChevronDown
                                            size={18}
                                            strokeWidth={2.5}
                                            className={`transition-transform ${expandedTemplateId === template.id ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-foreground">{template.title}</h3>
                                        {template.description && (
                                            <p title={template.description} className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                                        )}
                                    </div>
                                    <Badge variant={template.isActive ? 'default' : 'warning'}>
                                        {template.isActive ? 'Kích hoạt' : 'Tắt'}
                                    </Badge>
                                    <Badge variant="outline">
                                        {ASSESSMENT_TYPES.find((t) => t.value === template.typeCode)?.label}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => openEdit(template)}
                                        disabled={submitting}
                                        title="Chỉnh sửa"
                                        className="size-10 p-0"
                                    >
                                        <Edit2 size={16} />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setPendingDelete(template)}
                                        disabled={submitting}
                                        title="Xóa"
                                        className="size-10 p-0"
                                    >
                                        <Trash2 size={16} className="text-red-600" />
                                    </Button>
                                </div>
                            </div>

                            {/* Expanded Questions */}
                            {expandedTemplateId === template.id && (
                                <div className="border-t bg-muted/30 p-4">
                                    {loadingQuestions[template.id] ? (
                                        <ListSkeleton rows={3} cols={2} />
                                    ) : (templateQuestions[template.id] || []).length === 0 ? (
                                        <p className="text-center text-muted-foreground py-4">Chưa có câu hỏi nào</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {(templateQuestions[template.id] || []).map((q, idx) => (
                                                <div key={q.id} className="bg-card p-3 rounded border border-border">
                                                    <p className="font-medium text-foreground">
                                                        {idx + 1}. {q.content}
                                                    </p>
                                                    {q.options && q.options.length > 0 && (
                                                        <div className="mt-2 ml-4 space-y-1">
                                                            {q.options.map((opt) => (
                                                                <p key={opt.id} className="text-sm text-muted-foreground">
                                                                    • {opt.optionText} (Điểm: {opt.score})
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                    <PaginationControls
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        showWhenSinglePage
                        summary={`Hiển thị ${paginatedTemplates.length} trên tổng ${filteredTemplates.length} bài đánh giá • Trang ${currentPage}/${totalPages}`}
                    />
                </div>
            )}

            {/* Delete Confirmation */}
            {pendingDelete && (
                <ConfirmDialog
                    open={Boolean(pendingDelete)}
                    title="Xóa bài đánh giá"
                    description={`Bạn có chắc chắn muốn xóa "${pendingDelete.title}"? Hành động này không thể hoàn tác.`}
                    onClose={() => setPendingDelete(null)}
                    onConfirm={() => handleDelete(pendingDelete)}
                    confirmLabel="Xóa"
                    cancelLabel="Hủy"
                />
            )}
        </div>
    );
}

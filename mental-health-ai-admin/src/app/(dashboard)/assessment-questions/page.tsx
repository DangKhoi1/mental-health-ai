'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Filter, Plus, Save, Search, Trash2, X } from 'lucide-react';
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
import { PageHeader } from '@/components/layout/PageHeader';

interface Option {
    id: string;
    optionText: string;
    score: number;
}

interface Question {
    assessmentQuestionId: string;
    content: string;
    order: number;
    options?: Option[];
}

interface AssessmentTemplate {
    assessmentTemplateId: string;
    title: string;
    typeCode: string;
    isActive: boolean;
    questions?: Question[];
}

const templateFallback: AssessmentTemplate[] = [
    {
        assessmentTemplateId: 't1',
        title: 'Bộ câu hỏi trầm cảm PHQ-9',
        typeCode: 'PHQ9',
        isActive: true,
        questions: [
            { assessmentQuestionId: 'q1', content: 'Bạn có cảm thấy buồn bã kéo dài không?', order: 1, options: [] },
        ],
    },
];

export default function AssessmentQuestionsPage() {
    const PAGE_SIZE = 10;
    const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [pendingDeleteQuestion, setPendingDeleteQuestion] = useState<Question | null>(null);
    const [formData, setFormData] = useState({
        content: '',
        order: 1,
        options: [] as Option[],
    });
    const [currentPage, setCurrentPage] = useState(1);

    const resetQuestionForm = () => {
        setEditingQuestion(null);
        setFormData({
            content: '',
            order: 1,
            options: [],
        });
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetQuestionForm();
    };

    const loadData = async (templateIdToSelect?: string) => {
        try {
            setLoading(true);
            setError(null);
            const res = await assessmentService.getAssessmentTemplates();
            const payload = res as {
                EC?: number;
                templates?: AssessmentTemplate[];
                data?: { templates?: AssessmentTemplate[] } | AssessmentTemplate[];
            };

            // Kiểm tra EC từ backend
            if (payload.EC !== undefined && payload.EC !== 1) {
                console.warn('Backend returned error:', payload);
            }

            const list = (
                payload?.templates
                ?? (Array.isArray(payload?.data) ? payload.data : payload?.data && 'templates' in payload.data ? (payload.data as { templates: AssessmentTemplate[] }).templates : [])
                ?? []
            ) as AssessmentTemplate[];
            const actual = Array.isArray(list) && list.length > 0 ? list : templateFallback;

            const withQuestions = await Promise.all(
                actual.map(async (item) => {
                    try {
                        const detail = await assessmentService.getAssessmentTemplateById(item.assessmentTemplateId);
                        const detailPayload = detail as { EC?: number; template?: AssessmentTemplate };

                        // Kiểm tra EC cho từng template
                        if (detailPayload.EC !== undefined && detailPayload.EC !== 1) {
                            console.warn('Failed to load template:', item.assessmentTemplateId, detailPayload);
                            return item;
                        }

                        return detailPayload?.template ? (detailPayload.template as AssessmentTemplate) : item;
                    } catch (err) {
                        console.warn('Error loading template:', item.assessmentTemplateId, err);
                        return item;
                    }
                })
            );

            setTemplates(withQuestions);

            const toSelect = templateIdToSelect || (withQuestions.length > 0 ? withQuestions[0].assessmentTemplateId : '');
            setSelectedTemplateId(toSelect);
        } catch (err) {
            console.error('Error loading data:', err);
            setTemplates(templateFallback);
            setSelectedTemplateId(templateFallback[0].assessmentTemplateId);
            setError('Không tải được backend, đang hiển thị dữ liệu mẫu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const selectedTemplate = templates.find((t) => t.assessmentTemplateId === selectedTemplateId);

    const questionStats = useMemo(() => {
        const questions = selectedTemplate?.questions || [];
        const keyword = search.trim().toLowerCase();

        const filteredQuestions = questions.filter((question) => {
            if (!keyword) return true;

            const optionText = (question.options || [])
                .map((opt) => `${opt.optionText} ${opt.score}`)
                .join(' ')
                .toLowerCase();

            return (
                question.content.toLowerCase().includes(keyword) ||
                String(question.order || '').includes(keyword) ||
                optionText.includes(keyword)
            );
        });

        return {
            total: questions.length,
            filtered: filteredQuestions,
        };
    }, [selectedTemplate, search]);
    const sortedQuestions = useMemo(
        () => questionStats.filtered.slice().sort((a: Question, b: Question) => (a.order || 0) - (b.order || 0)),
        [questionStats.filtered],
    );
    const totalPages = Math.max(1, Math.ceil(sortedQuestions.length / PAGE_SIZE));
    const paginatedQuestions = useMemo(
        () => sortedQuestions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
        [sortedQuestions, currentPage],
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedTemplateId]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const templateOptions = templates.map((t) => ({ value: t.assessmentTemplateId, label: `${t.title} (${t.typeCode})` }));

    const clearFilters = () => {
        setSearch('');
    };

    const handleOpenModal = (question?: Question) => {
        if (question) {
            setEditingQuestion(question);
            setFormData({
                content: question.content,
                order: question.order || 1,
                options: question.options || [],
            });
        } else {
            setEditingQuestion(null);
            const nextOrder = (selectedTemplate?.questions?.length || 0) + 1;
            setFormData({
                content: '',
                order: nextOrder,
                options: [],
            });
        }
        setIsModalOpen(true);
    };

    const handleAddOption = () => {
        const newOption: Option = {
            id: Math.random().toString(36).substr(2, 9),
            optionText: '',
            score: 0,
        };
        setFormData({ ...formData, options: [...formData.options, newOption] });
    };

    const handleRemoveOption = (id: string) => {
        setFormData({ ...formData, options: formData.options.filter(o => o.id !== id) });
    };

    const handleOptionChange = (id: string, field: keyof Option, value: string | number) => {
        setFormData({
            ...formData,
            options: formData.options.map(o => o.id === id ? { ...o, [field]: value } : o)
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTemplateId) return;

        try {
            if (editingQuestion) {
                const res = await assessmentService.updateAssessmentQuestion(editingQuestion.assessmentQuestionId, formData);
                const payload = res as { EC?: number; EM?: string };
                if (payload.EC === 1) {
                    toast.success('Cập nhật câu hỏi thành công.');
                    handleCloseModal();
                    await loadData(selectedTemplateId);
                } else {
                    toast.error(payload.EM || 'Cập nhật câu hỏi thất bại.');
                }
            } else {
                const res = await assessmentService.createAssessmentQuestion({
                    ...formData,
                    templateId: selectedTemplateId
                });
                const payload = res as { EC?: number; EM?: string };
                if (payload.EC === 1) {
                    toast.success('Tạo câu hỏi thành công.');
                    handleCloseModal();
                    await loadData(selectedTemplateId);
                } else {
                    toast.error(payload.EM || 'Tạo câu hỏi thất bại.');
                }
            }
        } catch (err) {
            console.error('Submit error:', err);
            toast.error('Có lỗi xảy ra khi lưu câu hỏi.');
        }
    };

    const handleDelete = (question: Question) => {
        setPendingDeleteQuestion(question);
    };

    const confirmDeleteQuestion = async () => {
        if (!pendingDeleteQuestion) return;
        try {
            await assessmentService.deleteAssessmentQuestion(pendingDeleteQuestion.assessmentQuestionId);
            toast.success('Xóa câu hỏi thành công.');
            setPendingDeleteQuestion(null);
            await loadData(selectedTemplateId);
        } catch {
            toast.error('Có lỗi xảy ra khi xóa câu hỏi.');
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Quản lý câu hỏi đánh giá"
                description="Cấu hình chi tiết các câu hỏi và các lựa chọn trả lời."
            >

            </PageHeader>

            {error && <Alert variant="warning">{error}</Alert>}

            <Card className="border-border/70 shadow-sm">
                <CardContent className="space-y-4 p-4 md:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
                            <div className="space-y-1.5">
                                <label className="ml-1 block text-sm font-medium text-foreground">Tìm kiếm câu hỏi</label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        className="pl-11"
                                        placeholder="Tìm theo nội dung, số thứ tự hoặc lựa chọn..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>
                            </div>

                            <Select
                                label="Chọn bài đánh giá"
                                value={selectedTemplateId}
                                onChange={(e) => {
                                    setSelectedTemplateId(e.target.value);
                                    setCurrentPage(1);
                                }}
                                options={templateOptions.length > 0 ? templateOptions : [{ value: '', label: 'Không có bài đánh giá' }]}
                            />
                        </div>

                        <div className="flex items-center gap-2 lg:pb-0.5">
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                disabled={!search}
                            >
                                <X className="h-4 w-4" />
                                Xóa lọc
                            </Button>
                            <Button onClick={() => handleOpenModal()} disabled={!selectedTemplateId}>
                                <Plus className="h-4 w-4" />
                                Thêm câu hỏi
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
                        <span>
                            Bài đánh giá: <span className="font-semibold text-foreground">{selectedTemplate?.title || 'Chưa chọn'}</span>
                        </span>
                        <span>
                            Tổng câu hỏi: <span className="font-semibold text-foreground">{questionStats.total}</span>
                        </span>
                        <span>
                            Đang hiển thị: <span className="font-semibold text-foreground">{paginatedQuestions.length}</span>
                        </span>
                        {selectedTemplate && (
                            <Badge variant={selectedTemplate.isActive ? 'success' : 'danger'}>
                                {selectedTemplate.isActive ? 'Đang hoạt động' : 'Đang khóa'}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                        {selectedTemplate ? `Danh sách câu hỏi: ${selectedTemplate.title}` : 'Chọn bài đánh giá để xem câu hỏi'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner size="md" />
                        </div>
                    ) : !selectedTemplate ? (
                        <div className="flex min-h-55 items-center justify-center text-center text-muted-foreground">
                            Chọn một bài đánh giá để quản lý câu hỏi.
                        </div>
                    ) : questionStats.filtered.length === 0 ? (
                        <div className="flex min-h-55 items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center text-muted-foreground">
                            {search
                                ? 'Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại.'
                                : 'Bài đánh giá này chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.'}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/50">
                                            <th className="sticky top-0 z-10 w-24 bg-muted/90 px-4 py-3 text-left font-medium text-muted-foreground backdrop-blur-sm">Thứ tự</th>
                                            <th className="sticky top-0 z-10 bg-muted/90 px-4 py-3 text-left font-medium text-muted-foreground backdrop-blur-sm">Nội dung câu hỏi</th>
                                            <th className="sticky top-0 z-10 w-44 bg-muted/90 px-4 py-3 text-left font-medium text-muted-foreground backdrop-blur-sm">Lựa chọn</th>
                                            <th className="sticky top-0 z-10 w-28 bg-muted/90 px-4 py-3 text-center font-medium text-muted-foreground backdrop-blur-sm">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {paginatedQuestions
                                            .map((q: Question, idx: number) => (
                                                <tr key={q.assessmentQuestionId || idx} className="transition-colors hover:bg-muted/30">
                                                    <td className="px-4 py-4">
                                                        <Badge variant="outline">Câu {q.order || (idx + 1 + (currentPage - 1) * PAGE_SIZE)}</Badge>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="font-medium text-foreground">{q.content}</div>
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            {q.options?.length || 0} lựa chọn trả lời
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-muted-foreground">
                                                        {(q.options || []).length > 0 ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {q.options!
                                                                    .slice()
                                                                    .sort((a: Option, b: Option) => a.score - b.score)
                                                                    .map((opt: Option) => (
                                                                        <Badge key={opt.id} variant="outline" className="max-w-full whitespace-normal text-left leading-5">
                                                                            <span className="font-semibold text-foreground">{opt.score}:</span>
                                                                            <span className="ml-1 wrap-break-word">{opt.optionText || '—'}</span>
                                                                        </Badge>
                                                                    ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">Chưa có lựa chọn</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            <Button size="sm" variant="outline" onClick={() => handleOpenModal(q)} title="Chỉnh sửa">
                                                                <Edit2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button size="sm" variant="danger" onClick={() => handleDelete(q)} title="Xóa">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4">
                                {totalPages > 1 ? (
                                    <PaginationControls
                                        page={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                        summary={`Hiển thị ${paginatedQuestions.length} trên tổng ${sortedQuestions.length} câu hỏi • Trang ${currentPage}/${totalPages}`}
                                    />
                                ) : (
                                    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                                        Hiển thị {paginatedQuestions.length} trên tổng {sortedQuestions.length} câu hỏi • Trang {currentPage}/{totalPages}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                open={!!pendingDeleteQuestion}
                title="Xóa câu hỏi?"
                description={pendingDeleteQuestion ? 'Câu hỏi sẽ bị xóa khỏi bài đánh giá hiện tại.' : undefined}
                confirmLabel="Xóa"
                confirmVariant="danger"
                onClose={() => setPendingDeleteQuestion(null)}
                onConfirm={confirmDeleteQuestion}
            />

            {/* Question Modal */}
            <Modal
                open={isModalOpen}
                onClose={handleCloseModal}
                title={editingQuestion ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi mới'}
                maxWidth="max-w-3xl"
                footer={(
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" type="button" onClick={handleCloseModal}>Hủy</Button>
                        <Button type="submit" form="question-form">
                            <Save className="w-4 h-4" /> Lưu thông tin
                        </Button>
                    </div>
                )}
            >
                <form id="question-form" onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3">
                            <TextArea
                                label="Nội dung câu hỏi"
                                placeholder="Nhập nội dung câu hỏi khảo sát..."
                                required
                                rows={3}
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            />
                        </div>
                        <div className="col-span-1">
                            <Input
                                label="Thứ tự"
                                type="number"
                                required
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h5 className="font-semibold text-foreground">Các lựa chọn trả lời</h5>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                                <Plus className="w-4 h-4" /> Thêm lựa chọn
                            </Button>
                        </div>

                        <div className="space-y-3 pr-2">
                            {formData.options.map((opt: Option, idx: number) => (
                                <div key={opt.id} className="flex gap-3 items-end bg-muted/50 p-3 rounded-xl border border-border">
                                    <div className="flex-1">
                                        <Input
                                            label={idx === 0 ? "Nội dung lựa chọn" : ""}
                                            placeholder="Ví dụ: Không bao giờ"
                                            value={opt.optionText}
                                            onChange={(e) => handleOptionChange(opt.id, 'optionText', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            label={idx === 0 ? "Điểm" : ""}
                                            type="number"
                                            value={opt.score}
                                            onChange={(e) => handleOptionChange(opt.id, 'score', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="danger"
                                        className="h-11.5 w-11.5"
                                        onClick={() => handleRemoveOption(opt.id)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {formData.options.length === 0 && (
                                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-xl">
                                    Chưa có lựa chọn nào. Bài đánh giá cần các lựa chọn điểm để tính kết quả.
                                </div>
                            )}
                        </div>
                    </div>

                </form>
            </Modal>
        </div>
    );
}

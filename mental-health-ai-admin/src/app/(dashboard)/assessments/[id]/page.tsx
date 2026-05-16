'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Edit2, Trash2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
    Alert,
    Button,
    Card,
    CardContent,
    CardHeader,
    ConfirmDialog,
    Input,
    LoadingSpinner,
    TextArea,
} from '@/components/ui';
import { assessmentService } from '@/services/assessment';

interface QuestionOption {
    id: string;
    optionText: string;
    score: number;
}

interface Question {
    id: string;
    templateId: string;
    content: string;
    order: number;
    options?: QuestionOption[];
}

interface Template {
    id: string;
    title: string;
    description?: string;
}

interface QuestionForm {
    content: string;
    order: number;
    options: Array<{ optionText: string; score: number | string }>;
}

const defaultForm: QuestionForm = {
    content: '',
    order: 1,
    options: [
        { optionText: '', score: 0 },
        { optionText: '', score: 1 },
    ],
};

export default function QuestionsPage() {
    const router = useRouter();
    const params = useParams();
    const templateId = params?.id as string;

    const [template, setTemplate] = useState<Template | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Question | null>(null);
    const [form, setForm] = useState<QuestionForm>(defaultForm);
    const [submitting, setSubmitting] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<Question | null>(null);

    const formCardRef = React.useRef<HTMLDivElement>(null);

    const loadData = useCallback(async () => {
        if (!templateId) return;
        try {
            setLoading(true);
            setError(null);
            const data = await assessmentService.getAssessmentTemplateById(templateId);
            setTemplate({
                id: data.id,
                title: data.title,
                description: data.description,
            });
            setQuestions(data.questions || []);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
            toast.error(`Lỗi: ${msg}`);
            setError('Không thể tải bài đánh giá');
        } finally {
            setLoading(false);
        }
    }, [templateId]);

    useEffect(() => {
        if (templateId) {
            loadData();
        }
    }, [templateId, loadData]);

    const focusForm = () => {
        requestAnimationFrame(() => {
            formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };

    const openCreate = () => {
        setEditing(null);
        setForm({
            ...defaultForm,
            order: Math.max(...questions.map((q) => q.order || 0), 0) + 1,
        });
        setShowForm(true);
        focusForm();
    };

    const openEdit = (question: Question) => {
        setEditing(question);
        setForm({
            content: question.content || '',
            order: question.order || 1,
            options: (question.options || []).map((o) => ({
                optionText: o.optionText,
                score: o.score,
            })),
        });
        setShowForm(true);
        focusForm();
    };

    const handleSave = async () => {
        if (!form.content.trim()) {
            toast.error('Vui lòng nhập nội dung câu hỏi');
            return;
        }
        if (form.options.some((o) => !o.optionText.trim())) {
            toast.error('Vui lòng nhập đầy đủ nội dung cho tất cả lựa chọn');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                templateId,
                content: form.content,
                order: form.order,
                options: form.options.map((o) => ({
                    id: Math.random().toString(36),
                    optionText: o.optionText,
                    score: Number(o.score),
                })),
            };

            if (editing) {
                await assessmentService.updateAssessmentQuestion(editing.id, payload);
                toast.success('Cập nhật câu hỏi thành công');
            } else {
                await assessmentService.createAssessmentQuestion(payload);
                toast.success('Tạo câu hỏi thành công');
            }
            setShowForm(false);
            setEditing(null);
            setForm(defaultForm);
            await loadData();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
            toast.error(`Lỗi: ${msg}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (question: Question) => {
        setSubmitting(true);
        try {
            await assessmentService.deleteAssessmentQuestion(question.id);
            toast.success('Xóa câu hỏi thành công');
            setPendingDelete(null);
            await loadData();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
            toast.error(`Lỗi: ${msg}`);
        } finally {
            setSubmitting(false);
        }
    };

    const addOption = () => {
        const maxScore = Math.max(...form.options.map((o) => Number(o.score)), 0);
        setForm((p) => ({
            ...p,
            options: [...p.options, { optionText: '', score: maxScore + 1 }],
        }));
    };

    const removeOption = (idx: number) => {
        if (form.options.length <= 2) {
            toast.error('Phải có ít nhất 2 lựa chọn');
            return;
        }
        setForm((p) => ({
            ...p,
            options: p.options.filter((_, i) => i !== idx),
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="gap-2"
                >
                    <ArrowLeft size={18} />
                    Quay lại
                </Button>
            </div>

            <div>
                <h1 className="text-3xl font-bold text-slate-900">{template?.title}</h1>
                {template?.description && (
                    <p className="mt-1 text-slate-600">{template.description}</p>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <div ref={formCardRef}>
                    <Card className="border-blue-200 bg-blue-50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <h2 className="text-lg font-semibold">{editing ? 'Chỉnh sửa' : 'Thêm'} câu hỏi</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditing(null);
                                    setForm(defaultForm);
                                }}
                                disabled={submitting}
                            >
                                <X size={18} />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Nội dung câu hỏi *</label>
                                <TextArea
                                    value={form.content}
                                    onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                                    placeholder="Nhập câu hỏi..."
                                    disabled={submitting}
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700">Thứ tự</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={form.order}
                                    onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) }))}
                                    disabled={submitting}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-700">Lựa chọn *</label>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={addOption}
                                        disabled={submitting}
                                        className="gap-1"
                                    >
                                        <Plus size={14} />
                                        Thêm lựa chọn
                                    </Button>
                                </div>

                                {form.options.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <Input
                                                placeholder={`Lựa chọn ${idx + 1}`}
                                                value={opt.optionText}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        options: p.options.map((o, i) =>
                                                            i === idx ? { ...o, optionText: e.target.value } : o,
                                                        ),
                                                    }))
                                                }
                                                disabled={submitting}
                                            />
                                        </div>
                                        <div className="w-20">
                                            <Input
                                                type="number"
                                                placeholder="Điểm"
                                                value={opt.score}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        options: p.options.map((o, i) =>
                                                            i === idx ? { ...o, score: e.target.value } : o,
                                                        ),
                                                    }))
                                                }
                                                disabled={submitting}
                                            />
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => removeOption(idx)}
                                            disabled={submitting}
                                        >
                                            <X size={16} />
                                        </Button>
                                    </div>
                                ))}
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
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {submitting ? 'Đang lưu...' : 'Lưu'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Error Alert */}
            {error && <Alert variant="error">{error}</Alert>}

            {/* Questions List */}
            {questions.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-slate-500 mb-4">Chưa có câu hỏi nào trong bài đánh giá này.</p>
                        <Button onClick={openCreate}>Thêm câu hỏi đầu tiên</Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus size={18} />
                        Thêm câu hỏi
                    </Button>

                    <div className="space-y-3">
                        {questions
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .map((q, idx) => (
                                <Card key={q.id}>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div>
                                                <h3 className="font-semibold text-slate-900">
                                                    {q.order || idx + 1}. {q.content}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => openEdit(q)}
                                                    disabled={submitting}
                                                >
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setPendingDelete(q)}
                                                    disabled={submitting}
                                                >
                                                    <Trash2 size={16} className="text-red-600" />
                                                </Button>
                                            </div>
                                        </div>

                                        {q.options && q.options.length > 0 && (
                                            <div className="ml-4 space-y-1">
                                                {q.options.map((opt) => (
                                                    <p key={opt.id} className="text-sm text-slate-700">
                                                        ○ {opt.optionText} <span className="text-slate-500">(Điểm: {opt.score})</span>
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                    </div>
                </>
            )}

            {/* Delete Confirmation */}
            {pendingDelete && (
                <ConfirmDialog
                    open={Boolean(pendingDelete)}
                    title="Xóa câu hỏi"
                    description={`Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.`}
                    onClose={() => setPendingDelete(null)}
                    onConfirm={() => handleDelete(pendingDelete)}
                    confirmLabel="Xóa"
                    cancelLabel="Hủy"
                />
            )}
        </div>
    );
}

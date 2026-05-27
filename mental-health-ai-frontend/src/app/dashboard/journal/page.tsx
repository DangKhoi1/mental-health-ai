'use client';

import { useEffect, useState } from 'react';
import { useJournalStore } from '@/stores';
import { Journal, CreateJournalDto } from '@/types';
import JournalForm from '@/components/journal/JournalForm';
import JournalList from '@/components/journal/JournalList';
import JournalModal from '@/components/journal/JournalModal';
import JournalTrash from '@/components/journal/JournalTrash';
import { journalService } from '@/services/journal';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, PenTool, Search, X, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { PinGuard } from '@/components/ui/pin-guard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface JournalImage {
    imageId: string;
    fileName: string;
    cloudinaryUrl: string;
    mimeType: string;
    fileSize: number;
    displayOrder: number;
    createdAt: string;
}

function JournalContent() {
    const {
        journals,
        isLoading,
        isSubmitting,
        fetchJournals,
        createJournal,
        updateJournal,
        deleteJournal,
        page,
        totalPages,
        total,
        limit,
    } = useJournalStore();
    const [showForm, setShowForm] = useState(false);
    const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
    const [formData, setFormData] = useState<CreateJournalDto>({
        title: '',
        content: '',
        mood: '',
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [filterMood, setFilterMood] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [editTargetId, setEditTargetId] = useState<string | null>(null);
    const [editingImages, setEditingImages] = useState<JournalImage[]>([]);
    const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);

    useEffect(() => {
        fetchJournals(currentPage, limit, searchQuery);
    }, [fetchJournals, currentPage, limit, searchQuery]);

    const filteredJournals = journals.filter(journal => {
        const matchesSearch = journal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            journal.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMood = filterMood === 'all' || journal.mood === filterMood;
        return matchesSearch && matchesMood;
    });

    const handleSubmit = async (e: React.FormEvent, pendingImages?: File[]) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.content.trim()) return;

        let success;
        let createdJournalId: string | null = null;

        if (editTargetId) {
            success = await updateJournal(editTargetId, formData);
        } else {
            const result = await createJournal(formData);
            success = result.success;
            createdJournalId = result.journalId;
        }

        if (success) {
            // Upload pending images if any
            if (!editTargetId && pendingImages && pendingImages.length > 0) {
                if (!createdJournalId) {
                    toast.error('Đã tạo nhật ký nhưng chưa lấy được mã bài viết để tải ảnh. Vui lòng thử thêm ảnh lại sau.');
                    handleCloseForm();
                    return;
                }

                try {
                    let uploadedCount = 0;
                    const failedFiles: string[] = [];

                    for (const file of pendingImages) {
                        const uploadRes = await journalService.uploadImage(createdJournalId, file);
                        if (uploadRes?.EC === 1) {
                            uploadedCount += 1;
                        } else {
                            failedFiles.push(file.name);
                        }
                    }

                    if (failedFiles.length === 0) {
                        toast.success(`Bài nhật ký và ${uploadedCount} ảnh đã được tạo thành công!`);
                    } else if (uploadedCount > 0) {
                        toast.error(`Đã tải ${uploadedCount}/${pendingImages.length} ảnh. Một số ảnh lỗi: ${failedFiles.slice(0, 2).join(', ')}`);
                    } else {
                        toast.error('Bài nhật ký đã tạo nhưng không ảnh nào tải lên thành công. Vui lòng thử lại.');
                    }
                } catch (error) {
                    console.error('Error uploading images:', error);
                    toast.error('Bài nhật ký được tạo thành công, nhưng có lỗi tải ảnh. Bạn có thể thêm ảnh sau.');
                }
            } else {
                toast.success(editTargetId ? 'Cập nhật bài viết thành công!' : 'Bài nhật ký đã được tạo thành công!');
            }

            handleCloseForm();
        } else {
            const storeError = useJournalStore.getState().error;
            toast.error(storeError || 'Có lỗi xảy ra. Vui lòng thử lại.');
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditTargetId(null);
        setEditingImages([]);
        setFormData({ title: '', content: '', mood: '' });
    };

    const loadEditingImages = async (journalId: string) => {
        try {
            const res = await journalService.getImages(journalId);
            const images = Array.isArray(res?.data?.images) ? res.data.images : [];
            setEditingImages(images);
        } catch (error) {
            console.error('Error loading journal images for edit:', error);
            setEditingImages([]);
        }
    };

    const handleEditImageUpload = async (file: File) => {
        if (!editTargetId) return;
        try {
            setIsUploadingEditImage(true);
            const uploadRes = await journalService.uploadImage(editTargetId, file);
            if (uploadRes?.EC !== 1) {
                toast.error(uploadRes?.EM || 'Tải ảnh thất bại. Vui lòng thử lại.');
                return;
            }

            await loadEditingImages(editTargetId);
            await fetchJournals(currentPage, limit, searchQuery);
            toast.success('Tải ảnh thành công!');
        } catch (error) {
            console.error('Error uploading edit image:', error);
            toast.error('Tải ảnh thất bại. Vui lòng thử lại.');
        } finally {
            setIsUploadingEditImage(false);
        }
    };

    const handleEditImageDelete = async (imageId: string) => {
        if (!editTargetId) return;
        try {
            const deleteRes = await journalService.deleteImage(imageId);
            if (deleteRes?.EC !== 1) {
                toast.error(deleteRes?.EM || 'Xóa ảnh thất bại. Vui lòng thử lại.');
                return;
            }

            await loadEditingImages(editTargetId);
            await fetchJournals(currentPage, limit, searchQuery);
            toast.success('Xóa ảnh thành công!');
        } catch (error) {
            console.error('Error deleting edit image:', error);
            toast.error('Xóa ảnh thất bại. Vui lòng thử lại.');
        }
    };

    const handleEdit = (journal: Journal) => {
        setFormData({
            title: journal.title,
            content: journal.content,
            mood: journal.mood || '',
        });
        setEditTargetId(journal.journalId);
        setShowForm(true);
        loadEditingImages(journal.journalId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: string) => {
        setDeleteTargetId(id);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;

        const deletingId = deleteTargetId;
        const success = await deleteJournal(deletingId);

        if (success) {
            toast.success('Xóa bài nhật ký thành công!');
        } else {
            const storeError = useJournalStore.getState().error;
            toast.error(storeError || 'Bạn không có quyền xóa bài nhật ký này.');
        }

        if (success && selectedJournal?.journalId === deletingId) {
            setSelectedJournal(null);
        }
        setDeleteTargetId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-0 sm:pr-20 lg:pr-32">
                <div className="relative">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight flex items-center gap-3">
                        <span className="w-2 h-8 bg-amber-500 rounded-full" />
                        Nhật ký cảm xúc
                    </h1>
                    <p className="text-muted-foreground mt-1 ml-5">
                        Ghi lại những suy nghĩ, cảm xúc và kỷ niệm đáng nhớ
                    </p>
                </div>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="active" className="flex items-center gap-2">
                        <BookOpen className="size-4" />
                        Nhật ký
                    </TabsTrigger>
                    <TabsTrigger value="trash" className="flex items-center gap-2">
                        <Trash2 className="size-4" />
                        Đã xóa
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-6 mt-0">
                    {/* Filter & Action Section */}
                    <div className="bg-amber-500/5 dark:bg-amber-500/10 p-4 md:p-6 rounded-2xl border border-amber-500/20 shadow-sm flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-end backdrop-blur-sm">
                        <div className="w-full md:flex-1 gap-y-2">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Search className="size-4" />
                                Tìm kiếm
                            </label>
                            <Input
                                type="text"
                                placeholder="Tìm theo tiêu đề hoặc nội dung..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full"
                            />
                        </div>
                        <div className="w-full md:flex-1 gap-y-2">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Filter className="size-4" />
                                Lọc theo cảm xúc
                            </label>
                            <Select 
                                value={filterMood} 
                                onValueChange={(val) => {
                                    setFilterMood(val);
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn cảm xúc" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả cảm xúc</SelectItem>
                                    <SelectItem value="😊 Vui vẻ">😊 Vui vẻ</SelectItem>
                                    <SelectItem value="😌 Bình yên">😌 Bình yên</SelectItem>
                                    <SelectItem value="😔 Buồn">😔 Buồn</SelectItem>
                                    <SelectItem value="😤 Tức giận">😤 Tức giận</SelectItem>
                                    <SelectItem value="😰 Lo lắng">😰 Lo lắng</SelectItem>
                                    <SelectItem value="🤔 Suy tư">🤔 Suy tư</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pt-2 md:pt-0">
                            {(searchQuery || filterMood !== 'all') && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setFilterMood('all');
                                        setCurrentPage(1);
                                    }}
                                    className="flex items-center gap-2 w-full sm:w-auto text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                                >
                                    <X className="size-4" />
                                    Xóa bộ lọc
                                </Button>
                            )}
                            <Button
                                onClick={() => {
                                    if (showForm) {
                                        handleCloseForm();
                                    } else {
                                        setShowForm(true);
                                        setSelectedJournal(null);
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
                                        <PenTool className="size-4" />
                                        Viết mới
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {showForm && (
                        <JournalForm
                            formData={formData}
                            setFormData={setFormData}
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                            editJournalId={editTargetId}
                            existingImages={editingImages}
                            onUploadExistingImage={handleEditImageUpload}
                            onDeleteExistingImage={handleEditImageDelete}
                            isUploadingExistingImage={isUploadingEditImage}
                        />
                    )}

                    <JournalModal journal={selectedJournal} onClose={() => setSelectedJournal(null)} />
                    <ConfirmDialog
                        open={!!deleteTargetId}
                        title="Xóa bài nhật ký?"
                        description="Bài viết sẽ được chuyển vào mục Đã xóa và bạn có thể khôi phục sau đó. Bạn có chắc chắn muốn tiếp tục?"
                        confirmLabel="Xóa"
                        onClose={() => setDeleteTargetId(null)}
                        onConfirm={confirmDelete}
                    />

                    <JournalList
                        journals={filteredJournals}
                        isLoading={isLoading}
                        onSelect={setSelectedJournal}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                    />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">
                            Trang {page}/{totalPages} • {searchQuery || filterMood !== 'all' ? `Hiển thị ${filteredJournals.length}` : `Tổng ${total}`} bản ghi
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
                    <JournalTrash />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function JournalPage() {
    return (
        <PinGuard resourceName="nhật ký cảm xúc">
            <JournalContent />
        </PinGuard>
    );
}

'use client';

import Image from 'next/image';
import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  ListEmptyState,
  ListSkeleton,
  ListToolbar,
  Input,
  PaginationControls,
  Select,
  TextArea,
} from '@/components/ui';
import { resourceService } from '@/services';
import { PageHeader } from '@/components/layout/PageHeader';

type ResourceCategory = 'RES_MEDITATION' | 'RES_BREATHING' | 'RES_ARTICLE' | 'RES_VIDEO' | 'RES_MUSIC';
type ResourceType = 'TYPE_VIDEO' | 'TYPE_ARTICLE' | 'TYPE_AUDIO';

interface ResourceRow {
  resourceId: string;
  title: string;
  description: string;
  categoryCode: ResourceCategory;
  typeCode: ResourceType;
  contentUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
  isActive: boolean;
}

const FALLBACK_IMAGES = [
  '/images/resources/resource-1.svg',
  '/images/resources/resource-2.svg',
  '/images/resources/resource-3.svg',
];

interface ResourceForm {
  title: string;
  description: string;
  categoryCode: ResourceCategory;
  typeCode: ResourceType;
  contentUrl: string;
  thumbnailUrl: string;
  duration: string;
  isActive: boolean;
}

const defaultForm: ResourceForm = {
  title: '',
  description: '',
  categoryCode: 'RES_ARTICLE',
  typeCode: 'TYPE_ARTICLE',
  contentUrl: '',
  thumbnailUrl: '',
  duration: '',
  isActive: true,
};

const getCategoryLabel = (code: string) => {
  const map: Record<string, string> = {
    RES_MEDITATION: 'Thiền',
    RES_BREATHING: 'Hít thở',
    RES_ARTICLE: 'Bài viết',
    RES_VIDEO: 'Video',
    RES_MUSIC: 'Âm nhạc',
  };
  return map[code] ?? code;
};

const getTypeLabel = (code: string) => {
  const map: Record<string, string> = {
    TYPE_ARTICLE: 'Bài viết',
    TYPE_VIDEO: 'Video',
    TYPE_AUDIO: 'Âm thanh',
  };
  return map[code] ?? code;
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ResourceRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ title?: string; description?: string }>({});
  const [form, setForm] = useState<ResourceForm>(defaultForm);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'delete' | 'toggle'; item: ResourceRow } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const formCardRef = React.useRef<HTMLDivElement>(null);

  const focusForm = () => {
    requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleUploadThumbnail = async () => {
    if (!thumbnailFile) return;
    setUploadingThumbnail(true);
    try {
      const url = await resourceService.uploadThumbnail(thumbnailFile);
      setForm((p) => ({ ...p, thumbnailUrl: url }));
      toast.success('Ảnh thumbnail đã được tải lên Cloudinary.');
    } catch {
      toast.error('Không tải được ảnh lên Cloudinary.');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const clearThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    setForm((p) => ({ ...p, thumbnailUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadData = useCallback(async (targetPage = page, keyword = search, targetCategory = category) => {
    try {
      setLoading(true);
      setError(null);
      const res = await resourceService.getResources(true, targetPage, limit, keyword, targetCategory);
      const list = (res?.resources || []) as ResourceRow[];
      setResources(list);
      setTotal(res?.total || list.length);
      setTotalPages(res?.totalPages || 1);
    } catch {
      setResources([]);
      setTotal(0);
      setTotalPages(1);
      setError('Không thể tải danh sách tài liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [category, limit, page, search]);

  useEffect(() => {
    loadData(page, search, category);
  }, [category, loadData, page, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setThumbnailFile(null);
    setThumbnailPreview('');
    setFormErrors({});
    setShowForm(true);
    focusForm();
  };

  const openEdit = (item: ResourceRow) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description,
      categoryCode: item.categoryCode,
      typeCode: item.typeCode,
      contentUrl: item.contentUrl || '',
      thumbnailUrl: item.thumbnailUrl || '',
      duration: item.duration || '',
      isActive: item.isActive,
    });
    setThumbnailFile(null);
    setThumbnailPreview(item.thumbnailUrl || '');
    setFormErrors({});
    setShowForm(true);
    focusForm();
  };

  const saveResource = async () => {
    const nextErrors: { title?: string; description?: string } = {};
    if (!form.title.trim()) nextErrors.title = 'Vui lòng nhập tiêu đề.';
    if (!form.description.trim()) nextErrors.description = 'Vui lòng nhập mô tả.';
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      categoryCode: form.categoryCode,
      typeCode: form.typeCode,
      contentUrl: form.contentUrl || undefined,
      thumbnailUrl: form.thumbnailUrl || undefined,
      duration: form.duration || undefined,
      isActive: form.isActive,
    };

    try {
      if (editing) {
        await resourceService.updateResource(editing.resourceId, payload);
        toast.success('Cập nhật tài liệu thành công.');
      } else {
        await resourceService.createResource(payload);
        toast.success('Thêm tài liệu thành công.');
      }
      setShowForm(false);
      setEditing(null);
      await loadData(page, search, category);
    } catch {
      toast.error('Không thể lưu tài liệu thư viện.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteResource = async (resourceId: string) => {
    const item = resources.find((resource) => resource.resourceId === resourceId);
    if (!item) return;
    setPendingAction({ type: 'delete', item });
  };

  const toggleActive = async (item: ResourceRow) => {
    setPendingAction({ type: 'toggle', item });
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction.type === 'delete') {
        await resourceService.deleteResource(pendingAction.item.resourceId);
        toast.success('Xóa tài liệu thành công.');
      } else {
        await resourceService.updateResource(pendingAction.item.resourceId, { isActive: !pendingAction.item.isActive });
        toast.success(pendingAction.item.isActive ? 'Đã khóa tài liệu.' : 'Đã mở tài liệu.');
      }
      await loadData(page, search, category);
    } catch {
      toast.error(
        pendingAction.type === 'delete'
          ? 'Không thể xóa tài liệu.'
          : 'Không thể cập nhật trạng thái tài liệu.',
      );
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý thư viện"
        description="Thêm, cập nhật và xóa tài liệu trong thư viện chữa lành."
      />

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <ListToolbar
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchLabel="Tìm kiếm tài liệu thư viện"
            searchPlaceholder="Tìm theo tiêu đề hoặc mô tả"
            filterSlot={(
              <Select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Tất cả danh mục' },
                  { value: 'RES_MEDITATION', label: 'Thiền' },
                  { value: 'RES_BREATHING', label: 'Hít thở' },
                  { value: 'RES_ARTICLE', label: 'Bài viết' },
                  { value: 'RES_VIDEO', label: 'Video' },
                  { value: 'RES_MUSIC', label: 'Âm nhạc' },
                ]}
              />
            )}
            actionSlot={(
              <Button variant="primary" onClick={openCreate} className="w-full sm:w-auto">
                <Plus className="size-4" /> Thêm tài liệu
              </Button>
            )}
            resultsLabel={`${total} tài liệu`}
            activeTags={category ? [`Danh mục: ${getCategoryLabel(category)}`] : []}
            hasActiveFilters={search.trim().length > 0 || category !== ''}
            onClearFilters={() => {
              setSearch('');
              setCategory('');
              setPage(1);
            }}
          />
        </CardHeader>

        {showForm && (
          <div ref={formCardRef} className="mb-6 rounded-2xl border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">{editing ? 'Cập nhật tài liệu' : 'Thêm tài liệu mới'}</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Tiêu đề"
                value={form.title}
                error={formErrors.title}
                onChange={(e) => {
                  setForm((p) => ({ ...p, title: e.target.value }));
                  if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: undefined }));
                }}
              />
              <Input label="URL nội dung" value={form.contentUrl} onChange={(e) => setForm((p) => ({ ...p, contentUrl: e.target.value }))} />
              <Select
                label="Danh mục"
                value={form.categoryCode}
                onChange={(e) => setForm((p) => ({ ...p, categoryCode: e.target.value as ResourceCategory }))}
                options={[
                  { value: 'RES_MEDITATION', label: 'Thiền' },
                  { value: 'RES_BREATHING', label: 'Hít thở' },
                  { value: 'RES_ARTICLE', label: 'Bài viết' },
                  { value: 'RES_VIDEO', label: 'Video' },
                  { value: 'RES_MUSIC', label: 'Âm nhạc' },
                ]}
              />
              <Select
                label="Loại"
                value={form.typeCode}
                onChange={(e) => setForm((p) => ({ ...p, typeCode: e.target.value as ResourceType }))}
                options={[
                  { value: 'TYPE_ARTICLE', label: 'Bài viết' },
                  { value: 'TYPE_VIDEO', label: 'Video' },
                  { value: 'TYPE_AUDIO', label: 'Âm thanh' },
                ]}
              />
              <Input label="Thời lượng" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} />
              <div className="space-y-3 md:col-span-2">
                <label className="ml-1 block text-sm font-medium text-foreground">Ảnh thumbnail</label>
                <div className="flex flex-col items-start gap-4 sm:flex-row">
                  <div className="relative flex h-36 w-52 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted">
                    {thumbnailPreview || form.thumbnailUrl ? (
                      <>
                        <Image
                          src={thumbnailPreview || form.thumbnailUrl}
                          alt="preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={clearThumbnail}
                          className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                        >
                          <X className="size-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImagePlus className="size-8 opacity-40" />
                        <span className="text-xs">Chưa có ảnh</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={handleThumbnailChange}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus className="size-4" /> Chọn ảnh
                      </Button>
                      {thumbnailFile && !uploadingThumbnail && (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={handleUploadThumbnail}
                        >
                          Tải lên Cloudinary
                        </Button>
                      )}
                      {uploadingThumbnail && (
                        <Button type="button" variant="primary" size="sm" disabled>
                          <Loader2 className="size-4 animate-spin" /> Đang tải...
                        </Button>
                      )}
                    </div>
                    {thumbnailFile && (
                      <p className="text-xs text-muted-foreground">
                        {thumbnailFile.name} ({(thumbnailFile.size / 1024).toFixed(1)} KB)
                        {form.thumbnailUrl && !thumbnailPreview.startsWith('blob:') ? ' — Đã tải lên ✓' : ''}
                      </p>
                    )}
                    {form.thumbnailUrl && (
                      <p className="break-all text-xs text-primary">{form.thumbnailUrl}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <TextArea
                  label="Mô tả"
                  value={form.description}
                  error={formErrors.description}
                  rows={4}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, description: e.target.value }));
                    if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: undefined }));
                  }}
                />
              </div>
              <div className="flex justify-end gap-2 md:col-span-2">
                <Button variant="secondary" onClick={() => setShowForm(false)}>Hủy</Button>
                <Button variant="primary" loading={submitting} onClick={saveResource}>Lưu</Button>
              </div>
            </div>
          </div>
        )}

        <CardContent>
          {loading ? (
            <ListSkeleton rows={6} cols={3} />
          ) : (
            resources.length === 0 ? (
              <ListEmptyState
                title="Không tìm thấy tài liệu phù hợp"
                description="Hãy đổi từ khóa, thay danh mục hoặc thêm mới tài liệu vào thư viện."
                actionLabel="Đặt lại bộ lọc"
                onAction={() => {
                  setSearch('');
                  setCategory('');
                  setPage(1);
                }}
              />
            ) : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((item, index) => (
                <div key={item.resourceId} className="border border-border rounded-lg overflow-hidden bg-card">
                  <div className="relative h-40 w-full">
                    <Image
                      src={item.thumbnailUrl || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground line-clamp-2 min-w-0 flex-1">{item.title}</h3>
                      <Badge variant={item.isActive ? 'success' : 'danger'} className="shrink-0 whitespace-nowrap">
                        {item.isActive ? 'Đang mở' : 'Đã khóa'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    <div className="text-xs text-muted-foreground">
                      Danh mục: <span className="font-medium text-foreground">{getCategoryLabel(item.categoryCode)}</span>
                      {' • '}
                      Loại: <span className="font-medium text-foreground">{getTypeLabel(item.typeCode)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(item)}>
                        <Edit2 className="size-4" /> Sửa
                      </Button>
                      <Button type="button" variant="danger" size="sm" onClick={() => deleteResource(item.resourceId)}>
                        <Trash2 className="size-4" /> Xóa
                      </Button>
                      <Button type="button" className="col-span-2" variant="ghost" size="sm" onClick={() => toggleActive(item)}>
                        {item.isActive ? 'Khóa tài liệu' : 'Mở tài liệu'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            {totalPages > 1 ? (
              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                summary={`Trang ${page}/${totalPages} • Tổng ${total} tài liệu`}
              />
            ) : (
              <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                Trang {page}/{totalPages} • Tổng {total} tài liệu
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!pendingAction}
        title={pendingAction?.type === 'delete' ? 'Xác nhận xóa tài liệu?' : pendingAction?.item.isActive ? 'Xác nhận khóa tài liệu?' : 'Xác nhận mở tài liệu?'}
        description={pendingAction?.type === 'delete'
          ? 'Tài liệu này sẽ bị xóa khỏi hệ thống.'
          : 'Trạng thái tài liệu này sẽ được cập nhật cho người dùng.'}
        confirmLabel={pendingAction?.type === 'delete' ? 'Xóa' : pendingAction?.item.isActive ? 'Khóa' : 'Mở'}
        confirmVariant={pendingAction?.type === 'delete' ? 'danger' : pendingAction?.item.isActive ? 'danger' : 'success'}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
      />
    </div>
  );
}

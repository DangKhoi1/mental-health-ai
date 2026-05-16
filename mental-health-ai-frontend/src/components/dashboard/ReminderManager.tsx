'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import {
    Plus,
    Trash2,
    Bell,
    BellOff,
    Clock,
    X,
    Save,
    Search,
    CalendarDays,
    Filter,
    ArrowUpDown,
    Pencil,
    AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { notificationService } from '@/services/notification';

type StatusFilter = 'all' | 'active' | 'inactive' | 'scheduled' | 'unscheduled';
type SortMode = 'createdDesc' | 'createdAsc' | 'scheduleAsc' | 'scheduleDesc' | 'titleAsc';

const toDateTimeLocalValue = (dateStr?: string) => {
    if (!dateStr) {
        return '';
    }

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const offsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const toApiDateTime = (dateTimeLocal: string) => {
    if (!dateTimeLocal) {
        return undefined;
    }

    const date = new Date(dateTimeLocal);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }

    return date.toISOString();
};

const isPastDate = (dateStr: string) => {
    if (!dateStr) return false;
    const selected = new Date(dateStr);
    if (Number.isNaN(selected.getTime())) return false;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return selected < startOfToday;
};

const isFutureDateTime = (dateStr: string, hour: string, minute: string) => {
    if (!dateStr) return true;
    const candidate = new Date(`${dateStr}T${hour}:${minute}`);
    if (Number.isNaN(candidate.getTime())) return false;
    return candidate.getTime() > Date.now();
};

export default function ReminderManager() {
    const {
        reminders,
        fetchReminders,
        fetchNotifications,
        fetchUnreadCount,
        createNotification,
        toggleActive,
        removeNotification,
    } = useNotificationStore();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleHour, setScheduleHour] = useState('08');
    const [scheduleMinute, setScheduleMinute] = useState('00');

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortMode, setSortMode] = useState<SortMode>('createdDesc');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [pendingRepeatId, setPendingRepeatId] = useState<string | null>(null);
    const [repeatOpen, setRepeatOpen] = useState(false);
    const [repeatDate, setRepeatDate] = useState('');
    const [repeatHour, setRepeatHour] = useState('08');
    const [repeatMinute, setRepeatMinute] = useState('00');
    const confirmRepeatButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        fetchReminders();
    }, [fetchReminders]);

    const filteredReminders = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        const filtered = reminders.filter((item) => {
            if (
                keyword &&
                !(`${item.title} ${item.message}`.toLowerCase().includes(keyword))
            ) {
                return false;
            }

            if (statusFilter === 'active' && !item.isActive) {
                return false;
            }
            if (statusFilter === 'inactive' && item.isActive) {
                return false;
            }
            if (statusFilter === 'scheduled' && !item.scheduleTime) {
                return false;
            }
            if (statusFilter === 'unscheduled' && item.scheduleTime) {
                return false;
            }

            return true;
        });

        return filtered.sort((a, b) => {
            if (sortMode === 'titleAsc') {
                return a.title.localeCompare(b.title, 'vi-VN');
            }

            if (sortMode === 'createdAsc') {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }

            if (sortMode === 'scheduleAsc') {
                const aTime = a.scheduleTime ? new Date(a.scheduleTime).getTime() : Number.MAX_SAFE_INTEGER;
                const bTime = b.scheduleTime ? new Date(b.scheduleTime).getTime() : Number.MAX_SAFE_INTEGER;
                return aTime - bTime;
            }

            if (sortMode === 'scheduleDesc') {
                const aTime = a.scheduleTime ? new Date(a.scheduleTime).getTime() : Number.MIN_SAFE_INTEGER;
                const bTime = b.scheduleTime ? new Date(b.scheduleTime).getTime() : Number.MIN_SAFE_INTEGER;
                return bTime - aTime;
            }

            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [reminders, searchTerm, statusFilter, sortMode]);

    const selectedReminder = useMemo(() => {
        if (!selectedId) {
            return null;
        }

        return reminders.find((item) => item.notificationId === selectedId) || null;
    }, [selectedId, reminders]);

    useEffect(() => {
        setRepeatOpen(false);
    }, [selectedReminder?.notificationId]);

    useEffect(() => {
        if (!filteredReminders.length) {
            setSelectedId(null);
            return;
        }

        if (!selectedId || !filteredReminders.some((item) => item.notificationId === selectedId)) {
            setSelectedId(filteredReminders[0].notificationId);
        }
    }, [filteredReminders, selectedId]);

    const summary = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        let active = 0;
        let dueToday = 0;
        let overdue = 0;

        reminders.forEach((item) => {
            if (item.isActive) {
                active += 1;
            }

            if (!item.scheduleTime || !item.isActive) {
                return;
            }

            const schedule = new Date(item.scheduleTime);
            if (Number.isNaN(schedule.getTime())) {
                return;
            }

            if (schedule >= startOfToday && schedule < endOfToday) {
                dueToday += 1;
            }

            if (schedule < now) {
                overdue += 1;
            }
        });

        return {
            total: reminders.length,
            active,
            dueToday,
            overdue,
        };
    }, [reminders]);

    const resetForm = () => {
        setEditingId(null);
        setTitle('');
        setMessage('');
        setScheduleDate('');
        setScheduleHour('08');
        setScheduleMinute('00');
    };

    const openCreateForm = () => {
        resetForm();
        setShowForm(true);
    };

    const openEditForm = (id: string) => {
        const reminder = reminders.find((item) => item.notificationId === id);
        if (!reminder) {
            toast.error('Không tìm thấy nhắc nhở để chỉnh sửa');
            return;
        }

        setEditingId(reminder.notificationId);
        setTitle(reminder.title);
        setMessage(reminder.message);

        const dtLocal = toDateTimeLocalValue(reminder.scheduleTime);
        if (dtLocal) {
            const [datePart, timePart] = dtLocal.split('T');
            setScheduleDate(datePart);
            if (timePart) {
                const [hr, min] = timePart.split(':');
                setScheduleHour(hr || '08');
                setScheduleMinute(min || '00');
            }
        } else {
            setScheduleDate('');
            setScheduleHour('08');
            setScheduleMinute('00');
        }

        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!title.trim() || !message.trim()) {
            toast.error('Vui lòng nhập tiêu đề và nội dung');
            return;
        }

        if (scheduleDate && isPastDate(scheduleDate)) {
            toast.error('Không được chọn ngày trong quá khứ');
            return;
        }

        if (scheduleDate && !isFutureDateTime(scheduleDate, scheduleHour, scheduleMinute)) {
            toast.error('Thời gian nhắc nhở phải ở tương lai');
            return;
        }

        setIsSubmitting(true);
        try {
            let localDateTime = '';
            if (scheduleDate) {
                localDateTime = `${scheduleDate}T${scheduleHour}:${scheduleMinute}`;
            }

            const payload = {
                title: title.trim(),
                message: message.trim(),
                type: 'REMINDER' as const,
                scheduleTime: scheduleDate ? toApiDateTime(localDateTime) : undefined,
                isActive: true,
            };

            if (editingId) {
                await notificationService.update(editingId, payload);
                await Promise.all([fetchReminders(), fetchNotifications(), fetchUnreadCount()]);
                toast.success('Đã cập nhật nhắc nhở');
            } else {
                await createNotification(payload);
                toast.success('Đã tạo nhắc nhở mới');
            }

            resetForm();
            setShowForm(false);
        } catch (error) {
            const message =
                error instanceof Error && error.message
                    ? error.message
                    : editingId
                        ? 'Không thể cập nhật nhắc nhở'
                        : 'Không thể tạo nhắc nhở';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggle = async (id: string) => {
        setPendingToggleId(id);
        try {
            await toggleActive(id);
            toast.success('Đã cập nhật trạng thái nhắc nhở');
        } catch (error) {
            const message =
                error instanceof Error && error.message
                    ? error.message
                    : 'Không thể cập nhật nhắc nhở';
            toast.error(message);
        } finally {
            setPendingToggleId(null);
        }
    };

    const handleDelete = async (id: string) => {
        setPendingDeleteId(id);
        try {
            await removeNotification(id);
            toast.success('Đã xóa nhắc nhở');

            if (selectedId === id) {
                setSelectedId(null);
            }

            if (editingId === id) {
                resetForm();
                setShowForm(false);
            }
        } catch (error) {
            const message =
                error instanceof Error && error.message
                    ? error.message
                    : 'Không thể xóa nhắc nhở';
            toast.error(message);
        } finally {
            setPendingDeleteId(null);
        }
    };

    const openRepeatPopup = (id: string) => {
        const reminder = reminders.find((item) => item.notificationId === id);
        if (!reminder) {
            toast.error('Không tìm thấy nhắc nhở để lặp lại');
            return;
        }

        const now = Date.now();
        const currentSchedule = reminder.scheduleTime
            ? new Date(reminder.scheduleTime).getTime()
            : Number.NaN;
        const suggestedDateTime =
            Number.isFinite(currentSchedule) && currentSchedule > now
                ? toDateTimeLocalValue(reminder.scheduleTime)
                : toDateTimeLocalValue(new Date(now + 15 * 60_000).toISOString());

        const [nextDate = '', timePart = '08:00'] = suggestedDateTime.split('T');
        const [nextHour = '08', nextMinute = '00'] = timePart.split(':');

        setRepeatDate(nextDate);
        setRepeatHour(nextHour);
        setRepeatMinute(nextMinute);
        setRepeatOpen(true);
    };

    const handleRepeatReminder = async (id: string) => {
        const reminder = reminders.find((item) => item.notificationId === id);
        if (!reminder) {
            toast.error('Không tìm thấy nhắc nhở để lặp lại');
            return;
        }

        if (!repeatDate) {
            toast.error('Vui lòng chọn ngày nhắc lại');
            return;
        }

        if (isPastDate(repeatDate)) {
            toast.error('Không được chọn ngày trong quá khứ');
            return;
        }

        if (!isFutureDateTime(repeatDate, repeatHour, repeatMinute)) {
            toast.error('Thời gian nhắc nhở phải ở tương lai');
            return;
        }

        const nextTime = toApiDateTime(`${repeatDate}T${repeatHour}:${repeatMinute}`);
        if (!nextTime) {
            toast.error('Không thể xử lý thời gian nhắc mới');
            return;
        }

        setPendingRepeatId(id);
        try {
            await createNotification({
                title: reminder.title,
                message: reminder.message,
                type: 'REMINDER',
                scheduleTime: nextTime,
                isActive: true,
                data: reminder.data,
            });
            setRepeatOpen(false);
            toast.success('Đã lặp lại nhắc nhở', {
                description: 'Đã tạo nhắc nhở mới, nhắc nhở cũ vẫn được giữ lại.',
            });
        } catch (error) {
            const message =
                error instanceof Error && error.message
                    ? error.message
                    : 'Không thể lặp lại nhắc nhở';
            toast.error(message);
        } finally {
            setPendingRepeatId(null);
        }
    };

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return 'Không đặt lịch';
        try {
            return new Date(dateStr).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const getReminderStatus = (scheduleTimeValue?: string, isActive?: boolean) => {
        if (!isActive) {
            return {
                label: 'Tạm dừng',
                className: 'bg-muted text-muted-foreground border-border',
            };
        }

        if (!scheduleTimeValue) {
            return {
                label: 'Đang chạy',
                className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
            };
        }

        const schedule = new Date(scheduleTimeValue);
        const now = new Date();

        if (!Number.isNaN(schedule.getTime()) && schedule < now) {
            return {
                label: 'Đến hạn',
                className: 'bg-amber-500/10 text-amber-700 border-amber-200',
            };
        }

        return {
            label: 'Đã lên lịch',
            className: 'bg-sky-500/10 text-sky-700 border-sky-200',
        };
    };

    const repeatPreview = useMemo(() => {
        if (!repeatDate) {
            return {
                text: 'Vui lòng chọn ngày và giờ để xem trước.',
                isValid: false,
            };
        }

        const isoValue = toApiDateTime(`${repeatDate}T${repeatHour}:${repeatMinute}`);
        if (!isoValue) {
            return {
                text: 'Thời gian không hợp lệ.',
                isValid: false,
            };
        }

        const isFuture = new Date(isoValue).getTime() > Date.now();
        const previewDate = new Date(isoValue);
        const weekday = previewDate.toLocaleDateString('vi-VN', {
            weekday: 'long',
        });
        const dateTime = previewDate.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        const formatted = `${weekday}, ${dateTime}`;

        return {
            text: `Sẽ nhắc vào: ${formatted}`,
            isValid: isFuture,
        };
    }, [repeatDate, repeatHour, repeatMinute]);

    useEffect(() => {
        if (repeatOpen && repeatPreview.isValid) {
            confirmRepeatButtonRef.current?.focus();
        }
    }, [repeatOpen, repeatPreview.isValid, repeatDate, repeatHour, repeatMinute]);

    const applyRepeatOffset = (minutes: number) => {
        const target = new Date(Date.now() + minutes * 60_000);
        const dtLocal = toDateTimeLocalValue(target.toISOString());
        const [datePart = '', timePart = '08:00'] = dtLocal.split('T');
        const [hourPart = '08', minutePart = '00'] = timePart.split(':');

        setRepeatDate(datePart);
        setRepeatHour(hourPart);
        setRepeatMinute(minutePart);
    };

    const filterButtonClass = (value: StatusFilter) =>
        statusFilter === value
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-background text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground';

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Card className="border-border/70">
                    <CardContent className="px-4 py-3">
                        <p className="text-xs text-muted-foreground">Tổng nhắc nhở</p>
                        <p className="mt-1 text-2xl font-semibold text-foreground">{summary.total}</p>
                    </CardContent>
                </Card>
                <Card className="border-emerald-200 bg-emerald-50/40 dark:bg-emerald-900/10">
                    <CardContent className="px-4 py-3">
                        <p className="text-xs text-emerald-700">Đang bật</p>
                        <p className="mt-1 text-2xl font-semibold text-emerald-700">{summary.active}</p>
                    </CardContent>
                </Card>
                <Card className="border-sky-200 bg-sky-50/40 dark:bg-sky-900/10">
                    <CardContent className="px-4 py-3">
                        <p className="text-xs text-sky-700">Đến hạn hôm nay</p>
                        <p className="mt-1 text-2xl font-semibold text-sky-700">{summary.dueToday}</p>
                    </CardContent>
                </Card>
                <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-900/10">
                    <CardContent className="px-4 py-3">
                        <p className="text-xs text-amber-700">Quá hạn</p>
                        <p className="mt-1 text-2xl font-semibold text-amber-700">{summary.overdue}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary" />
                            Quản lý nhắc nhở
                        </CardTitle>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                onClick={() => {
                                    if (showForm) {
                                        setShowForm(false);
                                        resetForm();
                                        return;
                                    }
                                    openCreateForm();
                                }}
                                size="sm"
                            >
                                {showForm ? <X className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
                                {showForm ? 'Đóng' : 'Thêm mới'}
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {showForm && (
                        <div className="rounded-xl border border-border/70 bg-muted/30 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm font-semibold text-foreground">
                                    {editingId ? 'Chỉnh sửa nhắc nhở' : 'Tạo nhắc nhở mới'}
                                </p>
                                {editingId && (
                                    <Badge variant="outline" className="text-xs">
                                        Đang chỉnh sửa
                                    </Badge>
                                )}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Tiêu đề</label>
                                    <Input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="VD: Uống nước, thiền 10 phút"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Nội dung</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Mô tả chi tiết nhắc nhở"
                                        rows={3}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Thời gian ()</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr] gap-3">
                                        <DatePicker
                                            value={scheduleDate}
                                            onChange={setScheduleDate}
                                            disablePastDates
                                            className="w-full h-12 rounded-xl px-4"
                                        />
                                        <Select value={scheduleHour} onValueChange={setScheduleHour} disabled={!scheduleDate}>
                                            <SelectTrigger className="w-full h-12 rounded-xl focus:ring-ring border-input px-3 [&>svg]:hidden">
                                                <SelectValue placeholder="Giờ" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 24 }).map((_, i) => (
                                                    <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                                        {i.toString().padStart(2, '0')} giờ
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={scheduleMinute} onValueChange={setScheduleMinute} disabled={!scheduleDate}>
                                            <SelectTrigger className="w-full h-12 rounded-xl focus:ring-ring border-input px-3 [&>svg]:hidden">
                                                <SelectValue placeholder="Phút" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 60 }).map((_, i) => (
                                                    <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                                        {i.toString().padStart(2, '0')} phút
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex items-end justify-end gap-2">
                                    {editingId && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                resetForm();
                                                setShowForm(false);
                                            }}
                                            size="sm"
                                        >
                                            Hủy
                                        </Button>
                                    )}
                                    <Button type="button" onClick={handleSubmit} isLoading={isSubmitting} size="sm">
                                        {!isSubmitting && <Save className="mr-1 h-4 w-4" />}
                                        {editingId ? 'Lưu cập nhật' : 'Lưu nhắc nhở'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                        <div className="space-y-3">
                            <div className="rounded-xl border border-border/70 p-3">
                                <div className="flex flex-col gap-3">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Tìm theo tiêu đề hoặc nội dung"
                                            className="pl-9"
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" onClick={() => setStatusFilter('all')} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filterButtonClass('all')}`}>
                                            Tất cả
                                        </button>
                                        <button type="button" onClick={() => setStatusFilter('active')} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filterButtonClass('active')}`}>
                                            Đang bật
                                        </button>
                                        <button type="button" onClick={() => setStatusFilter('inactive')} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filterButtonClass('inactive')}`}>
                                            Tạm dừng
                                        </button>
                                        <button type="button" onClick={() => setStatusFilter('scheduled')} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filterButtonClass('scheduled')}`}>
                                            Có lịch
                                        </button>
                                        <button type="button" onClick={() => setStatusFilter('unscheduled')} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filterButtonClass('unscheduled')}`}>
                                            Không có lịch
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Filter className="h-3.5 w-3.5" />
                                            <span>{filteredReminders.length} kết quả</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                                            <Select value={sortMode} onValueChange={(val) => setSortMode(val as SortMode)}>
                                                <SelectTrigger className="h-8 w-32.5 text-xs">
                                                    <SelectValue placeholder="Sắp xếp" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="createdDesc">Mới nhất</SelectItem>
                                                    <SelectItem value="createdAsc">Cũ nhất</SelectItem>
                                                    <SelectItem value="scheduleAsc">Lịch sắp tới</SelectItem>
                                                    <SelectItem value="scheduleDesc">Lịch xa nhất</SelectItem>
                                                    <SelectItem value="titleAsc">Tiêu đề A-Z</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {filteredReminders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-muted-foreground">
                                    <BellOff className="mb-3 h-10 w-10 opacity-40" />
                                    <p className="text-sm font-medium">Không có nhắc nhở phù hợp bộ lọc</p>
                                    <p className="mt-1 text-xs">Thử đổi từ khóa tìm kiếm hoặc đổi cách lọc mới</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredReminders.map((reminder) => {
                                        const status = getReminderStatus(reminder.scheduleTime, reminder.isActive);
                                        const isSelected = selectedId === reminder.notificationId;
                                        const isPendingToggle = pendingToggleId === reminder.notificationId;
                                        const isPendingDelete = pendingDeleteId === reminder.notificationId;

                                        return (
                                            <div
                                                key={reminder.notificationId}
                                                className={`rounded-xl border p-3 transition-all ${isSelected
                                                    ? 'border-primary/50 bg-primary/5'
                                                    : 'border-border/60 bg-background hover:border-primary/30'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <button
                                                        onClick={() => handleToggle(reminder.notificationId)}
                                                        disabled={isPendingToggle}
                                                        className={`mt-0.5 rounded-lg p-1.5 transition-colors ${reminder.isActive
                                                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                            }`}
                                                        title={reminder.isActive ? 'Tạm dừng nhắc nhở' : 'Kích hoạt nhắc nhở'}
                                                    >
                                                        {reminder.isActive ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                                                    </button>

                                                    <button
                                                        onClick={() => setSelectedId(reminder.notificationId)}
                                                        type="button"
                                                        className="flex-1 text-left"
                                                    >
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className={`text-sm font-semibold ${reminder.isActive ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                                                                {reminder.title}
                                                            </p>
                                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.className}`}>
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{reminder.message}</p>
                                                        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground/80">
                                                            <span className="inline-flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {formatDateTime(reminder.scheduleTime)}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1">
                                                                <CalendarDays className="h-3 w-3" />
                                                                Tạo: {formatDateTime(reminder.createdAt)}
                                                            </span>
                                                        </div>
                                                    </button>

                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => openEditForm(reminder.notificationId)}
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                                            onClick={() => handleDelete(reminder.notificationId)}
                                                            disabled={isPendingDelete}
                                                            title="Xóa nhắc nhở"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <Card className="h-fit border-border/70">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Chi tiết nhắc nhở</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!selectedReminder ? (
                                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                                        Chọn một nhắc nhở để xem thông tin chi tiết.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-lg font-semibold text-foreground">{selectedReminder.title}</p>
                                            <p className="mt-1 text-sm text-muted-foreground">{selectedReminder.message}</p>
                                        </div>

                                        <div className="grid gap-3 text-sm">
                                            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái</p>
                                                <p className="mt-1 font-medium text-foreground">
                                                    {selectedReminder.isActive ? 'Đang bật' : 'Tạm dừng'}
                                                </p>
                                            </div>

                                            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Lịch nhắc</p>
                                                <p className="mt-1 font-medium text-foreground">{formatDateTime(selectedReminder.scheduleTime)}</p>
                                            </div>

                                            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Ngày tạo</p>
                                                <p className="mt-1 font-medium text-foreground">{formatDateTime(selectedReminder.createdAt)}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Popover open={repeatOpen} onOpenChange={setRepeatOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => openRepeatPopup(selectedReminder.notificationId)}
                                                        disabled={pendingRepeatId === selectedReminder.notificationId}
                                                    >
                                                        <Clock className="mr-1 h-4 w-4" />
                                                        Lặp lại
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent align="start" className="w-80 space-y-4">
                                                    <p className="text-sm font-semibold text-foreground">Chọn thời gian nhắc lại</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 px-2 text-xs"
                                                            onClick={() => applyRepeatOffset(15)}
                                                        >
                                                            +15p
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 px-2 text-xs"
                                                            onClick={() => applyRepeatOffset(30)}
                                                        >
                                                            +30p
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 px-2 text-xs"
                                                            onClick={() => applyRepeatOffset(60)}
                                                        >
                                                            +1h
                                                        </Button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-muted-foreground">Ngày</p>
                                                            <DatePicker
                                                                value={repeatDate}
                                                                onChange={setRepeatDate}
                                                                disablePastDates
                                                                className="h-10"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="space-y-1">
                                                                <p className="text-xs text-muted-foreground">Giờ</p>
                                                                <Select value={repeatHour} onValueChange={setRepeatHour}>
                                                                    <SelectTrigger className="h-10">
                                                                        <SelectValue placeholder="Giờ" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {Array.from({ length: 24 }).map((_, i) => (
                                                                            <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                                                                {i.toString().padStart(2, '0')} giờ
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-xs text-muted-foreground">Phút</p>
                                                                <Select value={repeatMinute} onValueChange={setRepeatMinute}>
                                                                    <SelectTrigger className="h-10">
                                                                        <SelectValue placeholder="Phút" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {Array.from({ length: 60 }).map((_, i) => (
                                                                            <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                                                                {i.toString().padStart(2, '0')} phút
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className={`rounded-md border px-3 py-2 text-sm ${repeatPreview.isValid
                                                            ? 'border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-900/15 dark:text-sky-200'
                                                            : 'border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-900/15 dark:text-amber-200'
                                                            }`}
                                                    >
                                                        {repeatPreview.text}
                                                    </div>

                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setRepeatOpen(false)}
                                                        >
                                                            Hủy
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            ref={confirmRepeatButtonRef}
                                                            isLoading={pendingRepeatId === selectedReminder.notificationId}
                                                            onClick={() => handleRepeatReminder(selectedReminder.notificationId)}
                                                        >
                                                            Xác nhận
                                                        </Button>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openEditForm(selectedReminder.notificationId)}
                                            >
                                                <Pencil className="mr-1 h-4 w-4" />
                                                Chỉnh sửa
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleToggle(selectedReminder.notificationId)}
                                                disabled={pendingToggleId === selectedReminder.notificationId}
                                            >
                                                {selectedReminder.isActive ? (
                                                    <>
                                                        <BellOff className="mr-1 h-4 w-4" />
                                                        Tạm dừng
                                                    </>
                                                ) : (
                                                    <>
                                                        <Bell className="mr-1 h-4 w-4" />
                                                        Kích hoạt
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDelete(selectedReminder.notificationId)}
                                                disabled={pendingDeleteId === selectedReminder.notificationId}
                                            >
                                                <Trash2 className="mr-1 h-4 w-4" />
                                                Xóa
                                            </Button>
                                        </div>

                                        {!selectedReminder.scheduleTime && (
                                            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 dark:bg-amber-900/10 dark:text-amber-200">
                                                <p className="inline-flex items-center gap-1 font-medium">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    Nhắc nhở này chưa có lịch cụ thể.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

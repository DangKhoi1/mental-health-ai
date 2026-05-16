'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge, Button, Input, Modal, Select, DatePicker } from '@/components/ui';
import { userService } from '@/services';

interface RoleOption {
    roleId: number;
    roleName: string;
    isActive: boolean;
}

interface EditUserModalProps {
    open: boolean;
    userId: string | null;
    onClose: () => void;
    onSuccess: () => void;
    roles: RoleOption[];
}

interface UserDetailResponse {
    user?: {
        userId: string;
        email: string;
        fullName: string;
        phoneNumber?: string;
        dateOfBirth?: string;
        genderCode?: string;
        isActive?: boolean;
        isDeleted?: boolean;
        provider?: string;
        role?: {
            roleId: number;
            roleName: string;
        };
    };
    data?: {
        user?: UserDetailResponse['user'];
    };
}

const GENDER_OPTIONS = [
    { value: 'MALE', label: 'Nam' },
    { value: 'FEMALE', label: 'Nữ' },
    { value: 'OTHER', label: 'Khác' },
];

const toDateInputValue = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

export function EditUserModal({ open, userId, onClose, onSuccess, roles }: EditUserModalProps) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [genderCode, setGenderCode] = useState('');
    const [roleId, setRoleId] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isDeleted, setIsDeleted] = useState(false);
    const [provider, setProvider] = useState<'LOCAL' | 'GOOGLE'>('LOCAL');
    const isLocalAccount = provider === 'LOCAL';

    const activeRoles = useMemo(() => roles.filter((role) => role.isActive), [roles]);

    useEffect(() => {
        const loadUser = async () => {
            if (!open || !userId) return;

            try {
                setFetching(true);
                const res = (await userService.getUserById(userId)) as UserDetailResponse;
                const user = res?.user || res?.data?.user;

                if (!user) {
                    throw new Error('Không tìm thấy người dùng');
                }

                setEmail(user.email || '');
                setFullName(user.fullName || '');
                setPhoneNumber(user.phoneNumber || '');
                setDateOfBirth(toDateInputValue(user.dateOfBirth));
                setGenderCode(user.genderCode || '');
                setRoleId(user.role?.roleId ? String(user.role.roleId) : '');
                setIsActive(user.isActive ?? true);
                setIsDeleted(!!user.isDeleted);
                setProvider((user.provider || 'LOCAL').toUpperCase().includes('GOOGLE') ? 'GOOGLE' : 'LOCAL');
            } catch (error) {
                console.error('Load user detail error:', error);
                toast.error('Không thể tải thông tin người dùng.');
            } finally {
                setFetching(false);
            }
        };

        void loadUser();
    }, [open, userId]);

    const resetForm = () => {
        setEmail('');
        setFullName('');
        setPhoneNumber('');
        setDateOfBirth('');
        setGenderCode('');
        setRoleId('');
        setIsActive(true);
        setIsDeleted(false);
        setProvider('LOCAL');
    };

    const handleClose = () => {
        if (loading || fetching) return;
        resetForm();
        onClose();
    };

    const validatePhone = (value: string) => /^[0-9]{10,11}$/.test(value);
    const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    const handleSubmit = async () => {
        if (!userId) return;
        if (isDeleted) return toast.warning('Tài khoản đã xóa không thể chỉnh sửa.');
        if (!fullName.trim()) return toast.warning('Vui lòng nhập họ tên.');
        if (!phoneNumber.trim()) return toast.warning('Vui lòng nhập số điện thoại.');
        if (!validatePhone(phoneNumber)) return toast.warning('Số điện thoại không hợp lệ.');
        if (isLocalAccount) {
            if (!email.trim()) return toast.warning('Vui lòng nhập email.');
            if (!validateEmail(email.trim())) return toast.warning('Email không hợp lệ.');
        }
        if (!genderCode) return toast.warning('Vui lòng chọn giới tính.');
        if (!roleId) return toast.warning('Vui lòng chọn vai trò.');

        try {
            setLoading(true);
            const res = await userService.updateUser(userId, {
                email: isLocalAccount ? email.trim() : undefined,
                fullName: fullName.trim(),
                phoneNumber: phoneNumber.trim(),
                dateOfBirth: dateOfBirth || undefined,
                genderCode,
                roleId: Number(roleId),
                isActive,
            });

            if (res?.EC === 0) {
                throw new Error(res?.EM || 'Không thể cập nhật người dùng.');
            }

            toast.success('Cập nhật người dùng thành công.');
            resetForm();
            onClose();
            onSuccess();
        } catch (error) {
            console.error('Update user error:', error);
            toast.error(error instanceof Error ? error.message : 'Không thể cập nhật người dùng.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={handleClose} title="Chỉnh sửa người dùng">
            {fetching ? (
                <div className="space-y-3 py-4 text-sm text-muted-foreground">Đang tải dữ liệu người dùng...</div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-foreground">Nguồn đăng nhập</p>
                            <p className="text-xs text-muted-foreground">Quyền quản trị không phụ thuộc phương thức đăng nhập.</p>
                        </div>
                        <Badge variant={provider === 'GOOGLE' ? 'info' : 'outline'}>{provider}</Badge>
                    </div>

                    {isDeleted && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            Tài khoản này đã được đánh dấu xóa mềm và không thể chỉnh sửa thêm.
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Email</label>
                        <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={!isLocalAccount || isDeleted}
                            placeholder={isLocalAccount ? 'Nhập email hợp lệ' : 'Tài khoản GOOGLE không cho đổi email'}
                        />
                        {!isLocalAccount && (
                            <p className="text-xs text-muted-foreground">
                                Email của tài khoản GOOGLE được đồng bộ từ nhà cung cấp đăng nhập.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Họ và tên</label>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isDeleted} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Số điện thoại</label>
                            <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={isDeleted} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Ngày sinh</label>
                            <DatePicker 
                                value={dateOfBirth} 
                                onChange={setDateOfBirth} 
                                disableFutureDates 
                                className={isDeleted ? 'opacity-50 pointer-events-none' : ''} 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Giới tính</label>
                            <Select
                                value={genderCode}
                                onChange={(e) => setGenderCode(e.target.value)}
                                options={GENDER_OPTIONS}
                                disabled={isDeleted}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Vai trò</label>
                            <Select
                                value={roleId}
                                onChange={(e) => setRoleId(e.target.value)}
                                options={activeRoles.map((role) => ({ value: String(role.roleId), label: role.roleName }))}
                                disabled={isDeleted}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-foreground">Trạng thái tài khoản</p>
                            <p className="text-xs text-muted-foreground">Bật/tắt quyền truy cập cho người dùng.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsActive((prev) => !prev)}
                            disabled={isDeleted}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${isActive
                                ? 'bg-emerald-500 text-white'
                                : 'bg-muted text-muted-foreground'
                                }`}
                        >
                            {isActive ? 'Đang hoạt động' : 'Đã khóa'}
                        </button>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={handleClose} disabled={loading || fetching}>
                            Hủy
                        </Button>
                        <Button onClick={handleSubmit} loading={loading} disabled={fetching || isDeleted}>
                            Lưu thay đổi
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

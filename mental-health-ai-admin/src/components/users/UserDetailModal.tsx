'use client';

import React, { useEffect, useState } from 'react';
import { Badge, Button, Input, Modal } from '@/components/ui';
import { userService } from '@/services';

interface UserDetailModalProps {
    open: boolean;
    userId: string | null;
    onClose: () => void;
}

interface UserDetailResponse {
    user?: {
        userId: string;
        email: string;
        fullName: string;
        phoneNumber?: string;
        dateOfBirth?: string;
        genderCode?: string;
        provider?: string;
        isActive?: boolean;
        role?: {
            roleId: number;
            roleName: string;
        };
        createdAt?: string;
    };
    data?: {
        user?: UserDetailResponse['user'];
    };
}

function formatDate(value?: string) {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('vi-VN');
}

function getProvider(provider?: string) {
    const normalized = (provider || 'LOCAL').toUpperCase();
    return normalized.includes('GOOGLE') ? 'GOOGLE' : 'LOCAL';
}

export function UserDetailModal({ open, userId, onClose }: UserDetailModalProps) {
    const [state, setState] = React.useReducer(
        (prev: any, next: any) => ({ ...prev, ...next }),
        { loading: false, user: null as UserDetailResponse['user'] | null }
    );
    const { loading, user } = state;

    useEffect(() => {
        const loadUser = async () => {
            if (!open || !userId) return;
            try {
                setState({ loading: true });
                const res = (await userService.getUserById(userId)) as UserDetailResponse;
                const data = res?.user || res?.data?.user || null;
                setState({ user: data, loading: false });
            } catch {
                setState({ loading: false });
            }
        };

        void loadUser();
    }, [open, userId]);

    const provider = getProvider(user?.provider);

    return (
        <Modal open={open} onClose={onClose} title="Chi tiết người dùng">
            {loading ? (
                <div className="py-4 text-sm text-muted-foreground">Đang tải dữ liệu...</div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-foreground">Nguồn đăng nhập</p>
                            <p className="text-xs text-muted-foreground">Phân biệt tài khoản nội bộ và Google OAuth.</p>
                        </div>
                        <Badge variant={provider === 'GOOGLE' ? 'info' : 'outline'}>{provider}</Badge>
                    </div>

                    <Input label="Email" value={user?.email || '--'} disabled />
                    <Input label="Họ và tên" value={user?.fullName || '--'} disabled />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input label="Số điện thoại" value={user?.phoneNumber || '--'} disabled />
                        <Input label="Ngày sinh" value={formatDate(user?.dateOfBirth)} disabled />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input label="Giới tính" value={user?.genderCode || '--'} disabled />
                        <Input label="Vai trò" value={user?.role?.roleName || '--'} disabled />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input label="Trạng thái" value={user?.isActive ? 'Đang hoạt động' : 'Đã khóa'} disabled />
                        <Input label="Ngày tham gia" value={formatDate(user?.createdAt)} disabled />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button variant="outline" onClick={onClose}>Đóng</Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

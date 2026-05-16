'use client';

import { User } from '@/types';
import { formatDate } from '@/utils/formatDate';

interface ProfileDisplayProps {
    user: User | null;
    onEdit: () => void;
}

export default function ProfileDisplay({ user, onEdit }: ProfileDisplayProps) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Họ và tên</span>
                <span className="font-medium text-foreground">{user?.fullName}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Số điện thoại</span>
                <span className="font-medium text-foreground">{user?.phoneNumber}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Giới tính</span>
                <span className="font-medium text-foreground">{user?.gender?.valueVi || 'Chưa cập nhật'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Ngày sinh</span>
                <span className="font-medium text-foreground">{user?.dateOfBirth ? formatDate(user.dateOfBirth) : 'Chưa cập nhật'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono text-sm text-muted-foreground">{user?.userId?.slice(0, 8)}...</span>
            </div>

            <button
                onClick={onEdit}
                className="w-full mt-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold transition-all hover:-translate-y-0.5 shadow-sm"
            >
                Chỉnh sửa hồ sơ
            </button>
        </div>
    );
}

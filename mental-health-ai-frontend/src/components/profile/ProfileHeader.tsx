'use client';

import { User } from '@/types';
import Image from 'next/image';

interface ProfileHeaderProps {
    user: User | null;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
    return (
        <div suppressHydrationWarning className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold overflow-hidden border-2 border-primary/20">
                {user?.avatarUrl ? (
                    <Image src={user.avatarUrl} alt="Avatar" width={80} height={80} className="size-full object-cover" />
                ) : (
                    user?.fullName?.charAt(0) || 'U'
                )}
            </div>
            <div>
                <h2 className="text-xl font-semibold text-foreground">
                    {user?.fullName}
                </h2>
                <p className="text-md font-medium text-primary">@{user?.email}</p>
                {user?.createdAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Tham gia từ: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                )}
            </div>
        </div>
    );
}

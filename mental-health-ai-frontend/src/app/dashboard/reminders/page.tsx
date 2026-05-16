'use client';

import ReminderManager from '@/components/dashboard/ReminderManager';

export default function RemindersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Nhắc nhở</h1>
                <p className="text-muted-foreground mt-1">Quản lý các nhắc nhở hàng ngày để chăm sóc sức khỏe tinh thần</p>
            </div>
            <ReminderManager />
        </div>
    );
}

'use client';

import { User } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import AvatarUpload from './AvatarUpload';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ProfileFormData {
    fullName: string;
    dateOfBirth: string;
    phoneNumber: string;
    genderCode: string;
    avatarUrl?: string;
}

interface ProfileEditFormProps {
    user: User | null;
    formData: ProfileFormData;
    setFormData: (data: ProfileFormData) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    isLoading: boolean;
}

export default function ProfileEditForm({
    user,
    formData,
    setFormData,
    onSubmit,
    onCancel,
    isLoading
}: ProfileEditFormProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            { }
            <div className="flex justify-center pb-6 border-b border-border">
                <AvatarUpload
                    currentAvatarUrl={formData.avatarUrl || user?.avatarUrl}
                    userName={user?.fullName}
                    onAvatarChange={(avatarUrl) => setFormData({ ...formData, avatarUrl })}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="h-12 rounded-xl bg-background border-input focus:ring-ring"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="h-12 rounded-xl bg-muted cursor-not-allowed opacity-70"
                />
                <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="phoneNumber">Số điện thoại</Label>
                <Input
                    id="phoneNumber"
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="h-12 rounded-xl bg-background border-input focus:ring-ring"
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="gender">Giới tính</Label>
                    <Select
                        value={formData.genderCode}
                        onValueChange={(value) => setFormData({ ...formData, genderCode: value })}
                    >
                        <SelectTrigger className="h-12 rounded-xl bg-background border-input">
                            <SelectValue placeholder="Chọn giới tính" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MALE">Nam</SelectItem>
                            <SelectItem value="FEMALE">Nữ</SelectItem>
                            <SelectItem value="OTHER">Khác</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Ngày Sinh</Label>
                    <DatePicker
                        value={formData.dateOfBirth}
                        onChange={(value) => setFormData({ ...formData, dateOfBirth: value })}
                        placeholder="Chọn ngày sinh"
                        disableFutureDates
                        className="h-12 rounded-xl px-4 bg-background border-input focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground">Không thể chọn ngày trong tương lai</p>
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <Button
                    type="button"
                    onClick={onCancel}
                    variant="outline"
                    className="flex-1 h-12 rounded-xl border-border hover:bg-muted text-foreground"
                >
                    Hủy
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-sm"
                >
                    {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </div>
        </form>
    );
}

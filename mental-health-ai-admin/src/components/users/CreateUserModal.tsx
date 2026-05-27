'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button, Input, Modal, Select, DatePicker } from '@/components/ui';
import { userService } from '@/services';

interface RoleOption {
    roleId: number;
    roleName: string;
    isActive: boolean;
}

interface CreateUserModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    roles: RoleOption[];
}

const GENDER_OPTIONS = [
    { value: 'MALE', label: 'Nam' },
    { value: 'FEMALE', label: 'Nữ' },
    { value: 'OTHER', label: 'Khác' },
];

export function CreateUserModal({ open, onClose, onSuccess, roles }: CreateUserModalProps) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [genderCode, setGenderCode] = useState('');
    const [roleId, setRoleId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeRoles = useMemo(() => roles.filter((role) => role.isActive), [roles]);

    const resetForm = () => {
        setUsername('');
        setEmail('');
        setPassword('');
        setFullName('');
        setPhoneNumber('');
        setDateOfBirth('');
        setGenderCode('');
        setRoleId('');
    };

    const handleClose = () => {
        if (isSubmitting) return;
        resetForm();
        onClose();
    };

    const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const validatePhone = (value: string) => /^[0-9]{10,11}$/.test(value);

    const handleSubmit = async () => {
        if (!username.trim() || username.length < 3) return toast.warning('Tên đăng nhập phải có ít nhất 3 ký tự.');
        if (!email.trim()) return toast.warning('Vui lòng nhập email.');
        if (!validateEmail(email)) return toast.warning('Email không hợp lệ.');
        if (!password.trim() || password.length < 6) return toast.warning('Mật khẩu phải có ít nhất 6 ký tự.');
        if (!fullName.trim()) return toast.warning('Vui lòng nhập họ tên.');
        if (!phoneNumber.trim()) return toast.warning('Vui lòng nhập số điện thoại.');
        if (!validatePhone(phoneNumber)) return toast.warning('Số điện thoại không hợp lệ.');
        if (!genderCode) return toast.warning('Vui lòng chọn giới tính.');
        if (!roleId) return toast.warning('Vui lòng chọn vai trò.');

        try {
            setIsSubmitting(true);
            await userService.createUser({
                username: username.trim(),
                email: email.trim(),
                password,
                fullName: fullName.trim(),
                phoneNumber: phoneNumber.trim(),
                genderCode,
                roleId: Number(roleId),
                dateOfBirth: dateOfBirth || undefined,
            });
            toast.success('Tạo người dùng thành công.');
            resetForm();
            onClose();
            onSuccess();
        } catch (error: any) {
            console.error('Create user error:', error);
            toast.error(error?.message || 'Không thể tạo người dùng.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal open={open} onClose={handleClose} title="Thêm người dùng">
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input label="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Nhập tên đăng nhập" />
                    <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
                </div>

                <Input label="Mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ít nhất 6 ký tự" />
                <Input label="Họ và tên" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nhập họ tên" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input label="Số điện thoại" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0912345678" />
                    <DatePicker label="Ngày sinh" value={dateOfBirth} onChange={setDateOfBirth} disableFutureDates />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Select
                        label="Giới tính"
                        value={genderCode}
                        onChange={(e) => setGenderCode(e.target.value)}
                        options={[{ value: '', label: 'Chọn giới tính' }, ...GENDER_OPTIONS]}
                    />
                    <Select
                        label="Vai trò"
                        value={roleId}
                        onChange={(e) => setRoleId(e.target.value)}
                        options={[
                            { value: '', label: 'Chọn vai trò' },
                            ...activeRoles.map((role) => ({ value: String(role.roleId), label: role.roleName })),
                        ]}
                    />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit} loading={isSubmitting}>
                        Tạo người dùng
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

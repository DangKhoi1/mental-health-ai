export type Allcode = {
  id: string;
  keyMap: string;
  type: string;
  valueEn: string;
  valueVi: string;
};

export interface User {
  userId: string;
  username: string;
  email?: string;
  provider?: string;
  providerId?: string;
  fullName: string;
  avatar?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  dateOfBirth: string;
  phoneNumber: string;
  gender: Allcode;
  genderCode?: string;
  role?: {
    roleId: string;
    roleName: string;
  };
  isActive?: boolean;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  fullName: string;
  genderCode: string;
  phoneNumber: string;
  dateOfBirth?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

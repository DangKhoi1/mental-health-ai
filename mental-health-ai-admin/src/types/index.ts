// ============================================
// User Types
// ============================================
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role?: Role;
  lastLogin?: string;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  password: string;
  roleId: string;
}

export interface UpdateUserRequest {
  email?: string;
  fullName?: string;
  roleId?: string;
  isActive?: boolean;
}

// ============================================
// Role & Permission Types
// ============================================
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  code: string;
  createdAt: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds: string[];
}

// ============================================
// Assessment Types
// ============================================
export interface Assessment {
  id: string;
  userId: string;
  title: string;
  type: string;
  score: number;
  result: string;
  createdAt: string;
  user?: User;
}

// ============================================
// Journal Types
// ============================================
export interface Journal {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

// ============================================
// Sleep Log Types
// ============================================
export interface SleepLog {
  id: string;
  userId: string;
  sleepStartTime: string;
  sleepEndTime: string;
  duration: number;
  quality: number;
  notes?: string;
  createdAt: string;
  user?: User;
}

// ============================================
// Daily Mood Types
// ============================================
export interface DailyMood {
  id: string;
  userId: string;
  mood: string;
  intensity: number;
  note?: string;
  createdAt: string;
  user?: User;
}

// ============================================
// Resource Types
// ============================================
export interface Resource {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceRequest {
  title: string;
  description: string;
  content: string;
  category: string;
  image?: string;
}

// ============================================
// Report Types
// ============================================
export interface Report {
  id: string;
  title: string;
  type: 'USER' | 'USAGE' | 'AI' | 'SYSTEM';
  generatedAt: string;
  generatedBy: string;
  data: unknown;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  type?: string;
}

// ============================================
// Dashboard Stats Types
// ============================================
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalAssessments: number;
  totalJournals: number;
  totalResources: number;
  avgUserSessionTime: number;
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
}

// ============================================
// API Response Types
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================
// Auth Types
// ============================================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AdminAuthState {
  isAuthenticated: boolean;
  user?: User;
  token?: string;
  loading: boolean;
}

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, Lock, MoreVertical, Plus, SquarePen, Trash2, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  ListEmptyState,
  ListSkeleton,
  ListToolbar,
  PaginationControls,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui';
import { roleService, userService } from '@/services';
import { PageHeader } from '@/components/layout/PageHeader';
import { CreateUserModal } from '@/components/users/CreateUserModal';
import { EditUserModal } from '@/components/users/EditUserModal';
import { UserDetailModal } from '@/components/users/UserDetailModal';

interface UserRow {
  userId: string;
  fullName: string;
  email: string;
  provider?: string;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  role?: {
    roleId: number;
    roleName: string;
  };
}

interface RoleOption {
  roleId: number;
  roleName: string;
  isActive: boolean;
}


export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingStatusUser, setPendingStatusUser] = useState<UserRow | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<UserRow | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const actionMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hasActiveFilters = search.trim().length > 0;

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const loadUsers = useCallback(async (targetPage = currentPage, keyword = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await userService.getUsers(targetPage, itemsPerPage, keyword);
      const list = (res?.users || res?.data || []) as UserRow[];
      setUsers(list);
      setTotalPages(res?.totalPages || 1);
      setTotalUsers(res?.total || list.length);
    } catch {
      setUsers([]);
      setTotalPages(1);
      setTotalUsers(0);
      setError('Không thể tải danh sách người dùng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  const loadRoles = async () => {
    try {
      const res = await roleService.getRoles();
      const list = (res?.roles || []) as RoleOption[];
      setRoles(list.filter((role) => role.isActive));
    } catch {
      setRoles([]);
    }
  };

  useEffect(() => {
    loadUsers(currentPage, search);
  }, [currentPage, search, loadUsers]);

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!openActionMenuId) return;
      const menuEl = actionMenuRefs.current[openActionMenuId];
      if (menuEl && !menuEl.contains(event.target as Node)) {
        setOpenActionMenuId(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenActionMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openActionMenuId]);

  const toggleUserStatus = async (user: UserRow) => {
    setPendingStatusUser(user);
  };

  const confirmToggleUserStatus = async () => {
    if (!pendingStatusUser) return;

    if (pendingStatusUser.isDeleted) {
      toast.warning('Tài khoản đã xóa không thể đổi trạng thái.');
      setPendingStatusUser(null);
      return;
    }

    try {
      await userService.updateUser(pendingStatusUser.userId, { isActive: !pendingStatusUser.isActive });
      await loadUsers(currentPage, search);
      toast.success(pendingStatusUser.isActive ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.');
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.userId === pendingStatusUser.userId ? { ...u, isActive: !u.isActive } : u))
      );
      toast.error('Không thể cập nhật trạng thái tài khoản.');
    } finally {
      setPendingStatusUser(null);
    }
  };

  const handleDeleteUser = (user: UserRow) => {
    if (user.isDeleted) {
      toast.info('Tài khoản này đã được xóa trước đó.');
      return;
    }
    setPendingDeleteUser(user);
  };

  const confirmDeleteUser = async () => {
    if (!pendingDeleteUser) return;

    try {
      await userService.deactivateUser(pendingDeleteUser.userId);
      await loadUsers(currentPage, search);
      toast.success('Đã xóa tài khoản.');
    } catch {
      toast.error('Không thể xóa tài khoản.');
    } finally {
      setPendingDeleteUser(null);
    }
  };

  const handleEditUser = (user: UserRow) => {
    setEditUserId(user.userId);
  };

  const handleViewDetails = (user: UserRow) => {
    setDetailUserId(user.userId);
  };

  const toggleActionMenu = (userId: string) => {
    setOpenActionMenuId((current) => (current === userId ? null : userId));
  };

  const closeActionMenu = () => setOpenActionMenuId(null);

  const getProvider = (provider?: string) => {
    const normalized = (provider || 'LOCAL').toUpperCase();
    return normalized.includes('GOOGLE') ? 'GOOGLE' : 'LOCAL';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý người dùng"
        description="Xem danh sách người dùng, xem chi tiết, chỉnh sửa thông tin, khóa/mở tài khoản và gán vai trò."
      />

      {error && <Alert variant="warning">{error}</Alert>}

      <Card>
        <CardHeader>
          <ListToolbar
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setCurrentPage(1);
            }}
            searchLabel="Tìm kiếm người dùng"
            searchPlaceholder="Tìm theo họ tên hoặc email"
            filterSlot={null}
            actionSlot={(
              <Button variant="primary" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Thêm người dùng
              </Button>
            )}
            resultsLabel={`${totalUsers} người dùng`}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={() => {
              setSearch('');
              setCurrentPage(1);
            }}
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <ListSkeleton rows={8} cols={6} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell header className="sticky top-0 z-10 bg-secondary">Họ tên</TableCell>
                      <TableCell header className="sticky top-0 z-10 bg-secondary">Email</TableCell>
                      <TableCell header className="sticky top-0 z-10 bg-secondary">Provider</TableCell>
                      <TableCell header className="sticky top-0 z-10 bg-secondary">Vai trò</TableCell>
                      <TableCell header className="sticky top-0 z-10 bg-secondary">Trạng thái</TableCell>
                      <TableCell header className="sticky top-0 z-10 bg-secondary">Ngày tạo</TableCell>
                      <TableCell header className="sticky top-0 z-10 bg-secondary text-right">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <ListEmptyState
                            title="Không tìm thấy người dùng phù hợp"
                            description="Thử tìm với từ khóa khác hoặc đặt lại bộ lọc hiện tại."
                            actionLabel={hasActiveFilters ? 'Đặt lại bộ lọc' : undefined}
                            onAction={hasActiveFilters ? () => {
                              setSearch('');
                              setCurrentPage(1);
                            } : undefined}
                          />
                        </td>
                      </tr>
                    ) : users.map((user, index) => {
                      const openUpward = index >= users.length - 2;

                      return (
                        <TableRow key={user.userId}>
                          <TableCell className="font-medium">{user.fullName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span title={user.email} className="block max-w-64 truncate">{user.email}</span>
                              {getProvider(user.provider) === 'LOCAL' ? (
                                <span title="Tài khoản LOCAL có thể sửa email">
                                  <SquarePen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getProvider(user.provider) === 'GOOGLE' ? 'info' : 'outline'}>
                              {getProvider(user.provider)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.role?.roleName || 'Người dùng'}</Badge>
                          </TableCell>
                          <TableCell>
                            {user.isDeleted ? (
                              <Badge variant="danger">Đã xóa</Badge>
                            ) : (
                              <Badge variant={user.isActive ? 'success' : 'danger'}>
                                {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                          <TableCell className="text-right">
                            <div
                              className="relative inline-flex"
                              ref={(el) => {
                                actionMenuRefs.current[user.userId] = el;
                              }}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                title="Thao tác"
                                className="h-10 w-10 p-0"
                                onClick={() => toggleActionMenu(user.userId)}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>

                              {openActionMenuId === user.userId && (
                                <div className={`absolute right-0 z-20 min-w-44 overflow-hidden rounded-xl border border-border bg-popover p-1 text-left shadow-lg space-y-1 ${openUpward ? 'bottom-12' : 'top-12'}`}>
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                                    onClick={() => {
                                      handleViewDetails(user);
                                      closeActionMenu();
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                    Xem chi tiết
                                  </button>
                                  {!user.isDeleted && (
                                    <>
                                      <button
                                        type="button"
                                        className="flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-sky-600 transition-colors hover:bg-sky-50"
                                        onClick={() => {
                                          handleEditUser(user);
                                          closeActionMenu();
                                        }}
                                      >
                                        <SquarePen className="h-4 w-4" />
                                        Chỉnh sửa
                                      </button>
                                      <button
                                        type="button"
                                        className="flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-amber-600 transition-colors hover:bg-amber-50"
                                        onClick={() => {
                                          toggleUserStatus(user);
                                          closeActionMenu();
                                        }}
                                      >
                                        {user.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                        {user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                      </button>
                                      <button
                                        type="button"
                                        className="flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                                        onClick={() => {
                                          handleDeleteUser(user);
                                          closeActionMenu();
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Xóa tài khoản
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6">
                <PaginationControls
                  page={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  summary={`Hiển thị ${users.length} trên tổng ${totalUsers} người dùng • Trang ${currentPage}/${totalPages}`}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!pendingStatusUser}
        title={pendingStatusUser?.isActive ? 'Xác nhận khóa tài khoản?' : 'Xác nhận mở khóa tài khoản?'}
        description={pendingStatusUser ? `${pendingStatusUser.fullName} sẽ được cập nhật trạng thái truy cập hệ thống.` : undefined}
        confirmLabel={pendingStatusUser?.isActive ? 'Khóa' : 'Mở khóa'}
        confirmVariant={pendingStatusUser?.isActive ? 'danger' : 'success'}
        onClose={() => setPendingStatusUser(null)}
        onConfirm={confirmToggleUserStatus}
      />

      <ConfirmDialog
        open={!!pendingDeleteUser}
        title="Xác nhận xóa tài khoản?"
        description={pendingDeleteUser ? `Tài khoản ${pendingDeleteUser.fullName} sẽ được đánh dấu đã xóa và không thể đăng nhập.` : undefined}
        confirmLabel="Xóa tài khoản"
        confirmVariant="danger"
        onClose={() => setPendingDeleteUser(null)}
        onConfirm={confirmDeleteUser}
      />

      <CreateUserModal
        open={createOpen}
        roles={roles}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => loadUsers(currentPage, search)}
      />

      <EditUserModal
        open={!!editUserId}
        userId={editUserId}
        roles={roles}
        onClose={() => setEditUserId(null)}
        onSuccess={() => loadUsers(currentPage, search)}
      />

      <UserDetailModal
        open={!!detailUserId}
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
      />
    </div>
  );
}

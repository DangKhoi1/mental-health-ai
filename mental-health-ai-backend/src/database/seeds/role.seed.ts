import { DataSource } from 'typeorm';
import { Role } from '../../modules/role/entities/role.entity';
import { Permission } from '../../modules/permission/entities/permission.entity';
import { RolePermission } from '../../modules/role-permission/entities/role-permission.entity';

export const roleSeedData = [
  {
    roleName: 'Admin',
    description: 'Quản trị viên hệ thống với toàn quyền truy cập',
    isActive: true,
  },
  {
    roleName: 'User',
    description: 'Người dùng thông thường',
    isActive: true,
  },
];

export const permissionSeedData = [
  {
    permissionName: 'Register user',
    apiPath: '/api/auth/register',
    method: 'POST',
    module: 'AUTH',
  },
  {
    permissionName: 'User login',
    apiPath: '/api/auth/login',
    method: 'POST',
    module: 'AUTH',
  },

  {
    permissionName: 'Get all users',
    apiPath: '/api/users',
    method: 'GET',
    module: 'USERS',
  },
  {
    permissionName: 'Get my profile',
    apiPath: '/api/users/me',
    method: 'GET',
    module: 'USERS',
  },
  {
    permissionName: 'Get user by ID',
    apiPath: '/api/users/:id',
    method: 'GET',
    module: 'USERS',
  },
  {
    permissionName: 'Get health summary',
    apiPath: '/api/users/me/health-summary',
    method: 'GET',
    module: 'USERS',
  },
  {
    permissionName: 'Get privacy pin status',
    apiPath: '/api/users/me/privacy-pin/status',
    method: 'GET',
    module: 'USERS',
  },
  {
    permissionName: 'Set privacy pin',
    apiPath: '/api/users/me/privacy-pin/set',
    method: 'POST',
    module: 'USERS',
  },
  {
    permissionName: 'Verify privacy pin',
    apiPath: '/api/users/me/privacy-pin/verify',
    method: 'POST',
    module: 'USERS',
  },
  {
    permissionName: 'Remove privacy pin',
    apiPath: '/api/users/me/privacy-pin',
    method: 'DELETE',
    module: 'USERS',
  },
  {
    permissionName: 'Update profile',
    apiPath: '/api/users/profile/:id',
    method: 'PATCH',
    module: 'USERS',
  },
  {
    permissionName: 'Deactivate user',
    apiPath: '/api/users/:id',
    method: 'DELETE',
    module: 'USERS',
  },

  {
    permissionName: 'Create role',
    apiPath: '/api/roles/create-role',
    method: 'POST',
    module: 'ROLES',
  },
  {
    permissionName: 'Get all roles',
    apiPath: '/api/roles/all-roles',
    method: 'GET',
    module: 'ROLES',
  },
  {
    permissionName: 'Get role by ID',
    apiPath: '/api/roles/role-by-id/:id',
    method: 'GET',
    module: 'ROLES',
  },
  {
    permissionName: 'Update role',
    apiPath: '/api/roles/update-role/:id',
    method: 'PATCH',
    module: 'ROLES',
  },
  {
    permissionName: 'Delete role',
    apiPath: '/api/roles/delete-role/:id',
    method: 'DELETE',
    module: 'ROLES',
  },

  {
    permissionName: 'Create permission',
    apiPath: '/api/permissions/create-permission',
    method: 'POST',
    module: 'PERMISSIONS',
  },
  {
    permissionName: 'Get all permissions',
    apiPath: '/api/permissions/all-permissions',
    method: 'GET',
    module: 'PERMISSIONS',
  },
  {
    permissionName: 'Get permissions by module',
    apiPath: '/api/permissions/permissions-by-module',
    method: 'GET',
    module: 'PERMISSIONS',
  },
  {
    permissionName: 'Get permission by ID',
    apiPath: '/api/permissions/permission-by-id/:id',
    method: 'GET',
    module: 'PERMISSIONS',
  },
  {
    permissionName: 'Update permission',
    apiPath: '/api/permissions/update-permission/:id',
    method: 'PATCH',
    module: 'PERMISSIONS',
  },
  {
    permissionName: 'Delete permission',
    apiPath: '/api/permissions/delete-permission/:id',
    method: 'DELETE',
    module: 'PERMISSIONS',
  },

  {
    permissionName: 'Create role permission',
    apiPath: '/api/role-permissions/create-role-permission',
    method: 'POST',
    module: 'ROLE-PERMISSIONS',
  },
  {
    permissionName: 'Delete role permission',
    apiPath: '/api/role-permissions/delete-role-permission',
    method: 'DELETE',
    module: 'ROLE-PERMISSIONS',
  },
  {
    permissionName: 'Get all role permissions',
    apiPath: '/api/role-permissions/all-role-permissions',
    method: 'GET',
    module: 'ROLE-PERMISSIONS',
  },
  {
    permissionName: 'Get permissions by role ID',
    apiPath: '/api/role-permissions/by-role/:roleId',
    method: 'GET',
    module: 'ROLE-PERMISSIONS',
  },
  {
    permissionName: 'Get roles by permission ID',
    apiPath: '/api/role-permissions/by-permission/:permissionId',
    method: 'GET',
    module: 'ROLE-PERMISSIONS',
  },

  {
    permissionName: 'Get assessment templates',
    apiPath: '/api/assessments/templates',
    method: 'GET',
    module: 'ASSESSMENTS',
  },
  {
    permissionName: 'Get admin assessment templates',
    apiPath: '/api/assessments/admin/templates',
    method: 'GET',
    module: 'ASSESSMENTS',
  },
  {
    permissionName: 'Get template with questions',
    apiPath: '/api/assessments/templates/:id',
    method: 'GET',
    module: 'ASSESSMENTS',
  },
  {
    permissionName: 'Start assessment session',
    apiPath: '/api/assessments/sessions',
    method: 'POST',
    module: 'ASSESSMENTS',
  },
  {
    permissionName: 'Submit assessment answers',
    apiPath: '/api/assessments/sessions/:id/submit',
    method: 'POST',
    module: 'ASSESSMENTS',
  },
  {
    permissionName: 'Get session result',
    apiPath: '/api/assessments/sessions/:id',
    method: 'GET',
    module: 'ASSESSMENTS',
  },
  {
    permissionName: 'Get user assessment history',
    apiPath: '/api/assessments/history',
    method: 'GET',
    module: 'ASSESSMENTS',
  },

  {
    permissionName: 'Create assessment template',
    apiPath: '/api/assessments/templates',
    method: 'POST',
    module: 'ASSESSMENTS',
  },
  {
    permissionName: 'Update assessment template',
    apiPath: '/api/assessments/templates/:id',
    method: 'PATCH',
    module: 'ASSESSMENTS',
  },
  {
    permissionName: 'Delete assessment template',
    apiPath: '/api/assessments/templates/:id',
    method: 'DELETE',
    module: 'ASSESSMENTS',
  },
  {
    permissionName: 'Create assessment question',
    apiPath: '/api/assessments/questions',
    method: 'POST',
    module: 'ASSESSMENTS',
  },
  {
    permissionName: 'Update assessment question',
    apiPath: '/api/assessments/questions/:id',
    method: 'PATCH',
    module: 'ASSESSMENTS',
  },
  {
    permissionName: 'Delete assessment question',
    apiPath: '/api/assessments/questions/:id',
    method: 'DELETE',
    module: 'ASSESSMENTS',
  },

  {
    permissionName: 'Create chat session',
    apiPath: '/api/chat/sessions',
    method: 'POST',
    module: 'CHAT',
  },
  {
    permissionName: 'Get chat sessions',
    apiPath: '/api/chat/sessions',
    method: 'GET',
    module: 'CHAT',
  },
  {
    permissionName: 'Get chat messages',
    apiPath: '/api/chat/sessions/:id/messages',
    method: 'GET',
    module: 'CHAT',
  },
  {
    permissionName: 'Send chat message',
    apiPath: '/api/chat/sessions/:id/messages',
    method: 'POST',
    module: 'CHAT',
  },
  {
    permissionName: 'Delete chat session',
    apiPath: '/api/chat/sessions/:id',
    method: 'DELETE',
    module: 'CHAT',
  },

  {
    permissionName: 'AI chat',
    apiPath: '/api/ai-analysis/chat',
    method: 'POST',
    module: 'AI-ANALYSIS',
  },
  {
    permissionName: 'Get dashboard recommendations',
    apiPath: '/api/ai-analysis/saved-recommendations',
    method: 'GET',
    module: 'AI-ANALYSIS',
  },
  {
    permissionName: 'Generate dashboard recommendations',
    apiPath: '/api/ai-analysis/dashboard-recommendations',
    method: 'POST',
    module: 'AI-ANALYSIS',
  },

  {
    permissionName: 'Create notification',
    apiPath: '/api/notifications',
    method: 'POST',
    module: 'NOTIFICATIONS',
  },
  {
    permissionName: 'Get notifications',
    apiPath: '/api/notifications',
    method: 'GET',
    module: 'NOTIFICATIONS',
  },
  {
    permissionName: 'Get notification reminders',
    apiPath: '/api/notifications/reminders',
    method: 'GET',
    module: 'NOTIFICATIONS',
  },
  {
    permissionName: 'Get unread notification count',
    apiPath: '/api/notifications/unread-count',
    method: 'GET',
    module: 'NOTIFICATIONS',
  },
  {
    permissionName: 'Mark all notifications as read',
    apiPath: '/api/notifications/read-all',
    method: 'PATCH',
    module: 'NOTIFICATIONS',
  },
  {
    permissionName: 'Mark notification as read',
    apiPath: '/api/notifications/:id/read',
    method: 'PATCH',
    module: 'NOTIFICATIONS',
  },
  {
    permissionName: 'Toggle notification active',
    apiPath: '/api/notifications/:id/toggle-active',
    method: 'PATCH',
    module: 'NOTIFICATIONS',
  },
  {
    permissionName: 'Update notification',
    apiPath: '/api/notifications/:id',
    method: 'PATCH',
    module: 'NOTIFICATIONS',
  },
  {
    permissionName: 'Delete notification',
    apiPath: '/api/notifications/:id',
    method: 'DELETE',
    module: 'NOTIFICATIONS',
  },

  {
    permissionName: 'Get dashboard stats',
    apiPath: '/api/dashboard/stats',
    method: 'GET',
    module: 'DASHBOARD',
  },
  {
    permissionName: 'Get dashboard mood stats',
    apiPath: '/api/dashboard/mood-stats',
    method: 'GET',
    module: 'DASHBOARD',
  },

  {
    permissionName: 'Get report overview',
    apiPath: '/api/reports/overview',
    method: 'GET',
    module: 'REPORTS',
  },
  {
    permissionName: 'Export report overview',
    apiPath: '/api/reports/export',
    method: 'GET',
    module: 'REPORTS',
  },

  {
    permissionName: 'Get all resources',
    apiPath: '/api/resources',
    method: 'GET',
    module: 'RESOURCES',
  },
  {
    permissionName: 'Get resource by ID',
    apiPath: '/api/resources/:id',
    method: 'GET',
    module: 'RESOURCES',
  },
  {
    permissionName: 'Create resource',
    apiPath: '/api/resources',
    method: 'POST',
    module: 'RESOURCES',
  },
  {
    permissionName: 'Update resource',
    apiPath: '/api/resources/:id',
    method: 'PATCH',
    module: 'RESOURCES',
  },
  {
    permissionName: 'Delete resource',
    apiPath: '/api/resources/:id',
    method: 'DELETE',
    module: 'RESOURCES',
  },

  {
    permissionName: 'Upload avatar',
    apiPath: '/api/upload/avatar',
    method: 'POST',
    module: 'UPLOAD',
  },
  {
    permissionName: 'Upload resource thumbnail',
    apiPath: '/api/upload/resource-thumbnail',
    method: 'POST',
    module: 'UPLOAD',
  },

  {
    permissionName: 'Create daily mood',
    apiPath: '/api/daily-moods/create-daily-mood',
    method: 'POST',
    module: 'DAILY-MOODS',
  },
  {
    permissionName: 'Get all daily moods',
    apiPath: '/api/daily-moods/all-daily-moods',
    method: 'GET',
    module: 'DAILY-MOODS',
  },
  {
    permissionName: 'Get daily mood stats',
    apiPath: '/api/daily-moods/get-daily-mood-stats',
    method: 'GET',
    module: 'DAILY-MOODS',
  },
  {
    permissionName: 'Get daily mood by ID',
    apiPath: '/api/daily-moods/get-daily-mood-by-id/:id',
    method: 'GET',
    module: 'DAILY-MOODS',
  },
  {
    permissionName: 'Delete daily mood',
    apiPath: '/api/daily-moods/delete-daily-mood/:id',
    method: 'DELETE',
    module: 'DAILY-MOODS',
  },
  {
    permissionName: 'Update daily mood',
    apiPath: '/api/daily-moods/update-daily-mood/:id',
    method: 'PUT',
    module: 'DAILY-MOODS',
  },
  {
    permissionName: 'Restore daily mood',
    apiPath: '/api/daily-moods/restore-daily-mood/:id',
    method: 'PUT',
    module: 'DAILY-MOODS',
  },
  {
    permissionName: 'Get all daily moods deleted',
    apiPath: '/api/daily-moods/trashed',
    method: 'GET',
    module: 'DAILY-MOODS',
  },

  {
    permissionName: 'Create journal',
    apiPath: '/api/journals',
    method: 'POST',
    module: 'JOURNALS',
  },
  {
    permissionName: 'Get all journals',
    apiPath: '/api/journals',
    method: 'GET',
    module: 'JOURNALS',
  },
  {
    permissionName: 'Get journal by ID',
    apiPath: '/api/journals/:id',
    method: 'GET',
    module: 'JOURNALS',
  },
  {
    permissionName: 'Delete journal',
    apiPath: '/api/journals/:id',
    method: 'DELETE',
    module: 'JOURNALS',
  },
  {
    permissionName: 'Update journal',
    apiPath: '/api/journals/update-journal/:id',
    method: 'PUT',
    module: 'JOURNALS',
  },
  {
    permissionName: 'Restore journal',
    apiPath: '/api/journals/restore-journal/:id',
    method: 'PUT',
    module: 'JOURNALS',
  },
  {
    permissionName: 'Get all journals deleted',
    apiPath: '/api/journals/trashed',
    method: 'GET',
    module: 'JOURNALS',
  },

  {
    permissionName: 'Create sleep log',
    apiPath: '/api/sleep-logs/create-sleep-log',
    method: 'POST',
    module: 'SLEEP-LOGS',
  },
  {
    permissionName: 'Get all sleep logs',
    apiPath: '/api/sleep-logs/get-all-sleep-logs',
    method: 'GET',
    module: 'SLEEP-LOGS',
  },
  {
    permissionName: 'Get sleep log stats',
    apiPath: '/api/sleep-logs/get-sleep-log-stats',
    method: 'GET',
    module: 'SLEEP-LOGS',
  },
  {
    permissionName: 'Get sleep log by ID',
    apiPath: '/api/sleep-logs/get-sleep-log-by-id/:id',
    method: 'GET',
    module: 'SLEEP-LOGS',
  },
  {
    permissionName: 'Delete sleep log',
    apiPath: '/api/sleep-logs/delete-sleep-log/:id',
    method: 'DELETE',
    module: 'SLEEP-LOGS',
  },
  {
    permissionName: 'Update sleep log',
    apiPath: '/api/sleep-logs/update-sleep-log/:id',
    method: 'PUT',
    module: 'SLEEP-LOGS',
  },
  {
    permissionName: 'Restore sleep log',
    apiPath: '/api/sleep-logs/restore-sleep-log/:id',
    method: 'PUT',
    module: 'SLEEP-LOGS',
  },
  {
    permissionName: 'Get all sleep logs deleted',
    apiPath: '/api/sleep-logs/trashed',
    method: 'GET',
    module: 'SLEEP-LOGS',
  },
];

const adminPermissions = permissionSeedData.map((p) => p.permissionName);

const userPermissions = [
  'User login',
  'Get my profile',
  'Get health summary',
  'Get privacy pin status',
  'Set privacy pin',
  'Verify privacy pin',
  'Remove privacy pin',
  'Update profile',
  'Upload avatar',
  'Get assessment templates',
  'Get template with questions',
  'Start assessment session',
  'Submit assessment answers',
  'Get session result',
  'Get user assessment history',
  'Create chat session',
  'Get chat sessions',
  'Get chat messages',
  'Send chat message',
  'Delete chat session',
  'AI chat',
  'Get dashboard recommendations',
  'Generate dashboard recommendations',
  'Create notification',
  'Get notifications',
  'Get notification reminders',
  'Get unread notification count',
  'Mark all notifications as read',
  'Mark notification as read',
  'Toggle notification active',
  'Update notification',
  'Delete notification',
  'Create daily mood',
  'Get all daily moods',
  'Get daily mood stats',
  'Get daily mood by ID',
  'Delete daily mood',
  'Update daily mood',
  'Restore daily mood',
  'Get all daily moods deleted',
  'Create journal',
  'Get all journals',
  'Get journal by ID',
  'Delete journal',
  'Update journal',
  'Restore journal',
  'Get all journals deleted',
  'Create sleep log',
  'Get all sleep logs',
  'Get sleep log stats',
  'Get sleep log by ID',
  'Delete sleep log',
  'Update sleep log',
  'Restore sleep log',
  'Get all sleep logs deleted',
  'Get all resources',
  'Get resource by ID',
];

const rolePermissionsMap: Record<string, string[]> = {
  Admin: adminPermissions,
  User: userPermissions,
};

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);
  const rolePermissionRepository = dataSource.getRepository(RolePermission);

  console.log('Seeding permissions...');
  for (const data of permissionSeedData) {
    const existing = await permissionRepository.findOne({
      where: { permissionName: data.permissionName },
    });

    if (!existing) {
      await permissionRepository.save(permissionRepository.create(data));
      console.log(`Created permission: ${data.permissionName}`);
    } else {
      console.log(`Skipped (exists): ${data.permissionName}`);
    }
  }

  console.log('\nSeeding roles...');
  for (const data of roleSeedData) {
    let role = await roleRepository.findOne({
      where: { roleName: data.roleName },
    });

    if (!role) {
      role = roleRepository.create(data);
      await roleRepository.save(role);
      console.log(`Created role: ${data.roleName}`);
    } else {
      console.log(`Skipped (exists): ${data.roleName}`);
    }

    const permissionNames = rolePermissionsMap[data.roleName] || [];
    const permissions = await permissionRepository.find({
      where: permissionNames.map((name) => ({ permissionName: name })),
    });

    console.log(
      `Assigning ${permissions.length} permissions to ${data.roleName}...`,
    );

    for (const permission of permissions) {
      const existing = await rolePermissionRepository.findOne({
        where: { roleId: role.roleId, permissionId: permission.permissionId },
      });

      if (!existing) {
        const rolePermission = rolePermissionRepository.create({
          roleId: role.roleId,
          permissionId: permission.permissionId,
        });
        await rolePermissionRepository.save(rolePermission);
      }
    }

    console.log(
      `Assigned ${permissions.length} permissions to ${data.roleName}`,
    );
  }

  console.log('\nRole seeding completed!');
}

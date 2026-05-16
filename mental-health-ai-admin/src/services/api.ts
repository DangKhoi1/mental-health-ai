import { assessmentService } from './assessment';
import { authService } from './auth';
import { dashboardService } from './dashboard';
import { permissionService } from '../services/permission';
import { reportService } from '../services/report';
import { resourceService } from './resource.service';
import { rolePermissionService } from '../services/rolePermission';
import { roleService } from './role';
import { userService } from './user';

export const apiService = {
  ...authService,
  ...userService,
  ...dashboardService,
  ...resourceService,
  ...roleService,
  ...permissionService,
  ...rolePermissionService,
  ...assessmentService,
  ...reportService,
};

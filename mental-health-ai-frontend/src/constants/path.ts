export const publicPaths = {
  HOME: '/trangchu',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
} as const;

export const dashboardPaths = {
  ROOT: '/dashboard',
  DAILY_MOOD: '/dashboard/daily-mood',
  JOURNAL: '/dashboard/journal',
  SLEEP_LOG: '/dashboard/sleep-log',
  ASSESSMENT: '/dashboard/assessment',
  REPORTS: '/dashboard/reports',
  CHAT: '/dashboard/chat',
  PROFILE: '/dashboard/profile',
  SETTINGS: '/dashboard/settings',
} as const;


export const apiPaths = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  ACCOUNT: '/auth/account',
  
  PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  
  DAILY_MOOD: '/daily-mood',
  JOURNAL: '/journal',
  SLEEP_LOG: '/sleep-log',
  ASSESSMENT: '/assessment',
  ASSESSMENT_TEMPLATES: '/assessment/templates',
} as const;

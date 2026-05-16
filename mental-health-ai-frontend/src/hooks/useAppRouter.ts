import { useRouter } from 'next/navigation';
import { publicPaths, dashboardPaths } from '@/constants';

export const useAppRouter = () => {
  const router = useRouter();

  return {
    goHome: () => router.push(publicPaths.HOME),
    goLogin: () => router.push(publicPaths.LOGIN),
    goRegister: () => router.push(publicPaths.REGISTER),
    goForgotPassword: () => router.push(publicPaths.FORGOT_PASSWORD),

    goDashboard: () => router.push(dashboardPaths.ROOT),
    goDailyMood: () => router.push(dashboardPaths.DAILY_MOOD),
    goJournal: () => router.push(dashboardPaths.JOURNAL),
    goSleepLog: () => router.push(dashboardPaths.SLEEP_LOG),
    goAssessment: () => router.push(dashboardPaths.ASSESSMENT),
    goReports: () => router.push(dashboardPaths.REPORTS),
    goChat: () => router.push(dashboardPaths.CHAT),
    goProfile: () => router.push(dashboardPaths.PROFILE),
    goSettings: () => router.push(dashboardPaths.SETTINGS),

    goTo: (path: string) => router.push(path),
    goBack: () => router.back(),
    refresh: () => router.refresh(),
    replace: (path: string) => router.replace(path),
  };
};
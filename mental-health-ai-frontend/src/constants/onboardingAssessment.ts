export const ONBOARDING_PENDING_FLAG = 'new_user_onboarding_pending';
export const ONBOARDING_IN_PROGRESS_FLAG = 'onboarding_assessment_in_progress';
export const ONBOARDING_ASSESSMENT_TYPE_CODE = 'MHB6';
export const ONBOARDING_ASSESSMENT_ROUTE = '/dashboard/assessment/start-assessment?onboarding=1';

export function getOnboardingPendingFlagKey(userId?: string | null) {
    return userId ? `${ONBOARDING_PENDING_FLAG}:${userId}` : ONBOARDING_PENDING_FLAG;
}

export function getOnboardingInProgressFlagKey(userId?: string | null) {
    return userId ? `${ONBOARDING_IN_PROGRESS_FLAG}:${userId}` : ONBOARDING_IN_PROGRESS_FLAG;
}

export function clearLegacyOnboardingFlags() {
    localStorage.removeItem(ONBOARDING_PENDING_FLAG);
    localStorage.removeItem(ONBOARDING_IN_PROGRESS_FLAG);
}

export function isOnboardingAssessmentType(typeCode?: string | null) {
    return typeCode === ONBOARDING_ASSESSMENT_TYPE_CODE;
}
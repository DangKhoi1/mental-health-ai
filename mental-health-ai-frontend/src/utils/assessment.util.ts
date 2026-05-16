export enum ResultLevel {
    MINIMAL = 'MINIMAL',
    MILD = 'MILD',
    MODERATE = 'MODERATE',
    MODERATELY_SEVERE = 'MODERATELY_SEVERE',
    SEVERE = 'SEVERE',
    LOW = 'LOW',
    HIGH = 'HIGH',
}

/**
 * Calculate guest result level based on type code and total score.
 * Mirrors the logic in the backend's AssessmentService.getResultLevel()
 */
export function calculateGuestResultLevel(typeCode: string, score: number): ResultLevel {
    switch (typeCode) {
        case 'MHB6':
            if (score >= 15) return ResultLevel.SEVERE;
            if (score >= 12) return ResultLevel.MODERATELY_SEVERE;
            if (score >= 8) return ResultLevel.MODERATE;
            if (score >= 4) return ResultLevel.MILD;
            return ResultLevel.MINIMAL;
        case 'PHQ9':
            if (score >= 20) return ResultLevel.SEVERE;
            if (score >= 15) return ResultLevel.MODERATELY_SEVERE;
            if (score >= 10) return ResultLevel.MODERATE;
            if (score >= 5) return ResultLevel.MILD;
            return ResultLevel.MINIMAL;
        case 'GAD7':
            if (score >= 15) return ResultLevel.SEVERE;
            if (score >= 10) return ResultLevel.MODERATE;
            if (score >= 5) return ResultLevel.MILD;
            return ResultLevel.MINIMAL;
        case 'PSS':
            if (score >= 27) return ResultLevel.HIGH;
            if (score >= 14) return ResultLevel.MODERATE;
            return ResultLevel.LOW;
        default:
            if (score >= 20) return ResultLevel.SEVERE;
            if (score >= 10) return ResultLevel.MODERATE;
            return ResultLevel.MINIMAL;
    }
}

export interface GuestResultData {
    totalScore: number;
    resultLevelCode: ResultLevel;
    status: 'COMPLETED';
    completedAt: string;
    isGuest: boolean;
}

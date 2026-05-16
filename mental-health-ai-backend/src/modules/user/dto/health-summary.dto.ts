export class LatestAssessmentDto {
  title: string;
  score: number;
  maxScore: number;
  level: string;
  levelText: string;
  completedAt: Date;
}

export class MoodTrendDataDto {
  date: string;
  moodScore: number;
  stressLevel: number;
}

export class HealthSummaryDto {
  currentStatus: string;
  statusColor: string;
  latestAssessment: LatestAssessmentDto | null;
  moodTrend: MoodTrendDataDto[];
  averageMoodScore: number;
  averageStressLevel: number;
  trendDirection: 'improving' | 'stable' | 'declining';
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  hasData: boolean;
}

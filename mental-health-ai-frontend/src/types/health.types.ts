export interface LatestAssessment {
  title: string;
  score: number;
  maxScore: number;
  level: string;
  levelText: string;
  completedAt: string;
}

export interface MoodTrendData {
  date: string;
  moodScore: number;
  stressLevel: number;
}

export interface HealthSummary {
  currentStatus: string;
  statusColor: string;
  latestAssessment: LatestAssessment | null;
  moodTrend: MoodTrendData[];
  averageMoodScore: number;
  averageStressLevel: number;
  trendDirection: 'improving' | 'stable' | 'declining';
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  hasData: boolean;
}

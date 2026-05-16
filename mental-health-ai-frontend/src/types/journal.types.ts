export interface Journal {
  journalId: string;
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
  createdAt: string;
  userId: string;
  analysisResult?: {
    sentimentScore: number;
    detectedMood: string;
    feedback?: string;
  };
}

export interface CreateJournalDto {
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
}

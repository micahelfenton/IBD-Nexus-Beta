// FIX: Removed circular dependency import.
export enum AppScreen {
  DASHBOARD,
  JOURNAL_VIEW,
  DIET,
}

export interface JournalSummary {
    mentalWellnessScore: number; // Scale of 1-10
    physicalSymptoms: string[];
    moods: string[];
    foodEaten: string[];
    exercise: string[];
    flareUpRisk: number; // Percentage
    // New detailed IBD fields
    stoolType?: 'Diarrhea' | 'Soft' | 'Normal' | 'Hard' | 'Not mentioned';
    stoolColor?: string;
    bloodInStool?: boolean;
    crampsSeverity?: number; // 0-10
}

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface ImageAnalysisResult {
    redDetections: BoundingBox[];
    brownDetections: BoundingBox[];
}


export interface JournalEntry {
  id: string;
  date: string;
  transcription: string;
  summary: JournalSummary;
  imageUrl?: string;
  imageAnalysis?: ImageAnalysisResult;
}

// The flow for creating a new entry
export enum NewEntryState {
  NONE,
  VOICE_INPUT,
  PROCESSING,
  SUMMARY,
}
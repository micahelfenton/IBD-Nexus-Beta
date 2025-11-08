// FIX: Removed circular dependency import.
export enum AppScreen {
  DASHBOARD,
  JOURNAL_VIEW,
  DIET,
  TREND_ANALYSIS,
  MENU_SCANNER,
  INGREDIENT_SCANNER,
}

export interface UserDietaryProfile {
  avoidsInsolubleFiber: boolean;
  avoidsHighFODMAP: boolean;
  avoidsDairy: boolean;
  avoidsSpicy: boolean;
  avoidsFatty: boolean;
}

export type MenuItemRisk = 'safe' | 'caution' | 'avoid';

export interface MenuItemAnalysis {
    itemName: string;
    risk: MenuItemRisk;
    reason: string;
    suggestion?: string;
    boundingBox: BoundingBox;
}

export interface MenuAnalysisResult {
    items: MenuItemAnalysis[];
}

export type IngredientRisk = 'green' | 'amber' | 'red';

export interface IngredientAnalysis {
    ingredientName: string;
    risk: IngredientRisk;
    reason: string;
}

export interface IngredientAnalysisResult {
    ingredients: IngredientAnalysis[];
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

export interface TrendAnalysisResult {
  riskTrend: {
    metric: "FlareUpRisk";
    changePercent: number;
    timeframe: string;
    startValue: number;
    endValue: number;
  };
  wellnessTrend: {
    metric: "MentalWellnessScore";
    changePercent: number;
    timeframe: string;
    startValue: number;
    endValue: number;
  };
  correlationInsights: {
    highRiskFoodTrigger: string;
    highRiskMoodTrigger: string;
  };
  stoolPattern: {
    mostFrequentType: string;
    bloodInStoolCount: number;
  };
  overallInterpretation: string;
}


// The flow for creating a new entry
export enum NewEntryState {
  NONE,
  VOICE_INPUT,
  PROCESSING,
  SUMMARY,
}
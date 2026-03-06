// ============================================
// Question Bank Types (Decision 27)
// Schema for pre-built + AI-generated questions
// ============================================

export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
}

export interface QuestionBankEntry {
  id: string;
  /** Which round this question is for */
  round: "BUILD" | "EXPAND" | "DEFINE" | "DEFEND";
  /** Which role leads this question type */
  leadRole: "architect" | "merchant" | "diplomat" | "lorekeeper" | "warlord";
  /** Curriculum domain */
  domain: string;
  /** Epoch range where this question is valid */
  epochMin: number;
  epochMax: number;
  /** Terrain conditions (optional — narrows selection) */
  terrainConditions?: string[];
  /** Min tech tier required for this question */
  techTierMin?: number;
  /** Civilization state tags for contextual matching */
  civStateTags?: string[];
  /** The question prompt text */
  promptText: string;
  /** Answer options (2-4 choices) */
  options: QuestionOption[];
  /** Allow free-text "Propose your own" action */
  allowFreeText: boolean;
  /** Historical context paragraph */
  historicalContext: string;
  /** 6th grade scaffolding sentence starters */
  scaffolding6th: string;
  /** 7/8 grade guided questions */
  scaffolding78: string;
}

/**
 * Team state snapshot used for question selection
 */
export interface TeamStateSnapshot {
  epoch: number;
  round: string;
  role: string;
  territoryCount: number;
  techTier: number;
  terrainTypes: string[];
  resourceLevels: Record<string, number>;
  isInDarkAge: boolean;
  warExhaustionLevel: number;
  isContactOpen: boolean;
  population: number;
  hasSpecificBuildings: string[];
}

/**
 * Scaffolding configuration per class
 */
export interface ScaffoldingConfig {
  grade: "6th" | "7_8th";
  /** Minimum sentences required in justification */
  minSentences: number;
  /** Whether to show sentence starters */
  showSentenceStarters: boolean;
  /** Whether to show guided questions */
  showGuidedQuestions: boolean;
}

export const SCAFFOLDING_PRESETS: Record<string, ScaffoldingConfig> = {
  "6th": {
    grade: "6th",
    minSentences: 2,
    showSentenceStarters: true,
    showGuidedQuestions: false,
  },
  "7_8th": {
    grade: "7_8th",
    minSentences: 2,
    showSentenceStarters: false,
    showGuidedQuestions: true,
  },
};

// ============================================
// Epoch State Machine (Decision 79)
// 11-phase epoch clock with 4 action rounds
// ============================================

export type EpochStep =
  | "login"
  | "build"
  | "build_routing"
  | "expand"
  | "expand_routing"
  | "define"
  | "define_routing"
  | "defend"
  | "defend_routing"
  | "resolve"
  | "exit";

export interface EpochTimerConfig {
  /** Minutes per action round */
  roundMinutes: number;
  /** Minutes per routing phase */
  routingMinutes: number;
  /** Minutes for defend (shorter) */
  defendMinutes: number;
  /** Grade level */
  grade: "6th" | "7_8th";
}

export const TIMER_PRESETS: Record<string, EpochTimerConfig> = {
  "6th": {
    roundMinutes: 8,
    routingMinutes: 2,
    defendMinutes: 6,
    grade: "6th",
  },
  "7_8th": {
    roundMinutes: 6,
    routingMinutes: 1,
    defendMinutes: 5,
    grade: "7_8th",
  },
};

/** Ordered sequence of steps in an epoch */
export const EPOCH_STEP_ORDER: EpochStep[] = [
  "login",
  "build",
  "build_routing",
  "expand",
  "expand_routing",
  "define",
  "define_routing",
  "defend",
  "defend_routing",
  "resolve",
  "exit",
];

/** Map steps to their display labels */
export const STEP_LABELS: Record<EpochStep, string> = {
  login: "Login & Recap",
  build: "BUILD Round",
  build_routing: "Route Production",
  expand: "EXPAND Round",
  expand_routing: "Route Reach",
  define: "DEFINE Round",
  define_routing: "Route Legacy",
  defend: "DEFEND Round",
  defend_routing: "Route Resilience",
  resolve: "RESOLVE",
  exit: "Exit Hook",
};

/** Map action steps to their round type */
export const STEP_TO_ROUND: Partial<Record<EpochStep, string>> = {
  build: "BUILD",
  build_routing: "BUILD",
  expand: "EXPAND",
  expand_routing: "EXPAND",
  define: "DEFINE",
  define_routing: "DEFINE",
  defend: "DEFEND",
  defend_routing: "DEFEND",
};

/** Map action steps to the resource they generate */
export const STEP_TO_RESOURCE: Partial<Record<EpochStep, string>> = {
  build: "production",
  expand: "reach",
  define: "legacy",
  defend: "resilience",
};

/**
 * Get the timer duration (seconds) for a given epoch step
 */
export function getStepDuration(step: EpochStep, config: EpochTimerConfig): number {
  switch (step) {
    case "login":
      return 120; // 2 min for recap
    case "build":
    case "expand":
    case "define":
      return config.roundMinutes * 60;
    case "defend":
      return config.defendMinutes * 60;
    case "build_routing":
    case "expand_routing":
    case "define_routing":
    case "defend_routing":
      return config.routingMinutes * 60;
    case "resolve":
      return 0; // DM-triggered, no timer
    case "exit":
      return 60; // 1 min for exit hook display
    default:
      return 0;
  }
}

/**
 * Get the next step in the epoch sequence. Returns null if at end.
 */
export function getNextStep(current: EpochStep): EpochStep | null {
  const idx = EPOCH_STEP_ORDER.indexOf(current);
  if (idx === -1 || idx === EPOCH_STEP_ORDER.length - 1) return null;
  return EPOCH_STEP_ORDER[idx + 1];
}

/**
 * Get the previous step. Returns null if at start.
 */
export function getPreviousStep(current: EpochStep): EpochStep | null {
  const idx = EPOCH_STEP_ORDER.indexOf(current);
  if (idx <= 0) return null;
  return EPOCH_STEP_ORDER[idx - 1];
}

/**
 * Check if a step is an action round (where students submit)
 */
export function isActionStep(step: EpochStep): boolean {
  return ["build", "expand", "define", "defend"].includes(step);
}

/**
 * Check if a step is a routing phase (where lead role routes resources)
 */
export function isRoutingStep(step: EpochStep): boolean {
  return step.endsWith("_routing");
}

/**
 * Get the leading role for an action step
 */
export function getLeadRole(step: EpochStep): string | null {
  switch (step) {
    case "build":
    case "build_routing":
      return "architect";
    case "expand":
    case "expand_routing":
      return "merchant";
    case "define":
    case "define_routing":
      return "diplomat";
    case "defend":
    case "defend_routing":
      return "warlord";
    default:
      return null;
  }
}

/**
 * Compute overall epoch progress (0-100)
 */
export function getEpochProgress(step: EpochStep): number {
  const idx = EPOCH_STEP_ORDER.indexOf(step);
  if (idx === -1) return 0;
  return Math.round((idx / (EPOCH_STEP_ORDER.length - 1)) * 100);
}

/**
 * Determine if all required submissions are in for a given action step
 */
export function canAutoAdvance(
  step: EpochStep,
  submittedRoles: string[],
  activeRoles: string[]
): boolean {
  if (!isActionStep(step)) return false;
  return activeRoles.every((role) => submittedRoles.includes(role));
}

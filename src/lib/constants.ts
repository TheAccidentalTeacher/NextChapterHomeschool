// ============================================
// ClassCiv Game Constants
// Decision references noted inline
// ============================================

// --- Resources (Decision 41) ---
export const RESOURCES = {
  production: { emoji: "⚙️", label: "Production", color: "#f59e0b" },
  reach:      { emoji: "🧭", label: "Reach",      color: "#3b82f6" },
  legacy:     { emoji: "📜", label: "Legacy",      color: "#a855f7" },
  resilience: { emoji: "🛡️", label: "Resilience",  color: "#22c55e" },
  food:       { emoji: "🌾", label: "Food",        color: "#84cc16" },
} as const;

// --- Roles (Decision 70/77) ---
export const ROLES = {
  architect:  { emoji: "🏗️", label: "Architect",  description: "Builds structures, manages territory" },
  merchant:   { emoji: "💰", label: "Merchant",   description: "Handles trade, manages economy" },
  diplomat:   { emoji: "🤝", label: "Diplomat",   description: "Negotiates alliances, resolves conflicts" },
  lorekeeper: { emoji: "📖", label: "Lorekeeper", description: "Creates mythology, cultural artifacts" },
  warlord:    { emoji: "⚔️", label: "Warlord",    description: "Manages military, defensive strategy" },
} as const;

// --- Rounds (Decision 31) ---
export const ROUNDS: { type: string; label: string; emoji: string }[] = [
  { type: "EXPAND",  label: "Expand",  emoji: "🗺️" },
  { type: "BUILD",   label: "Build",   emoji: "🏗️" },
  { type: "RESOLVE", label: "Resolve", emoji: "⚡" },
  { type: "DEFINE",  label: "Define",  emoji: "📜" },
];

// --- Terrain Types (Decision 60/61) ---
export const TERRAIN = {
  plains:       { label: "Plains",       emoji: "🌾", color: "#a3d977" },
  forest:       { label: "Forest",       emoji: "🌲", color: "#2d6a4f" },
  mountain:     { label: "Mountain",     emoji: "⛰️", color: "#8d99ae" },
  desert:       { label: "Desert",       emoji: "🏜️", color: "#e9c46a" },
  coastal:      { label: "Coastal",      emoji: "🏖️", color: "#48cae4" },
  river_valley: { label: "River Valley", emoji: "🏞️", color: "#7ecf8e" },
  tundra:       { label: "Tundra",       emoji: "❄️", color: "#caf0f8" },
  jungle:       { label: "Jungle",       emoji: "🌴", color: "#1b4332" },
} as const;

// --- Depletion Thresholds (Decision 87) ---
export const DEPLETION = {
  WARNING_THRESHOLD: 30,       // yield -25% at ≤30%
  CRITICAL_THRESHOLD: 10,     // triggers depletion event at ≤10%
  RECOVERY_RATE: 15,          // +15 per unworked epoch
  TICK_DOWN_PER_ACTION: 8,    // -8 per resource-gathering action
} as const;

// --- First Settler Decay (Decision 90) ---
export const FOUNDING = {
  FIRST_SETTLER_DECAY_EPOCHS: 4,  // bonus decays after 4 epochs
  RESOURCE_HUB_BONUS: 0.15,       // +15% yield
  NATURAL_LANDMARK_CI: 5,         // +5 CI flat bonus
} as const;

// --- Trade (Decision 69) ---
export const TRADE = {
  AGREEMENT_YIELD_BONUS: 0.05, // +5% on shipped resource
  VASSAL_TRIBUTE_PERCENT: 20,  // 20% auto-pull
  CONSECUTIVE_EPOCHS_FOR_CONFEDERATION: 3, // v2
} as const;

// --- War (Decision 65) ---
export const WAR = {
  EXHAUSTION_LEVEL_1_PENALTY: 0.15, // -15%
  EXHAUSTION_LEVEL_2_PENALTY: 0.30, // -30%
} as const;

// --- Victory Conditions (Decision 74) ---
export const VICTORY_TYPES = [
  { key: "economic",      label: "Economic",      description: "Highest total banked resources" },
  { key: "population",    label: "Population",     description: "Highest population count" },
  { key: "cultural",      label: "Cultural",       description: "Highest CI spread" },
  { key: "scientific",    label: "Scientific",     description: "First to Tier 4 tech tree" },
  { key: "endgame_epoch", label: "Endgame Epoch",  description: "Narrative wild card" },
] as const;

// --- Math Gate (Decision 88) ---
export const MATH_GATE = {
  WRONG_ANSWER_YIELD_PENALTY: 0.25, // 25% reduced yield on wrong answer
  DIFFICULTY_LEVELS: ["multiply", "divide", "ratio", "percent"] as const,
} as const;

// --- Regions (Decision 60) ---
export const REGIONS = [
  { id: 1,  label: "Alaska + Western Canada" },
  { id: 2,  label: "Eastern Canada + Eastern US" },
  { id: 3,  label: "Mexico + Central America + Caribbean" },
  { id: 4,  label: "South America" },
  { id: 5,  label: "Western Europe + North Africa" },
  { id: 6,  label: "Eastern Europe + Russia" },
  { id: 7,  label: "Middle East + Central Asia" },
  { id: 8,  label: "Sub-Saharan Africa" },
  { id: 9,  label: "South Asia (India subcontinent)" },
  { id: 10, label: "East Asia (China, Mongolia)" },
  { id: 11, label: "Southeast Asia" },
  { id: 12, label: "Pacific + Japan + Korea + Australia" },
] as const;

// ============================================
// ClassCiv Tech Tree Data Model
// Decision 62: ~30 techs, 5 tiers, Legacy-funded
// Prerequisites enforce progression chains.
// ============================================

export interface TechDefinition {
  id: string;
  name: string;
  emoji: string;
  tier: number;           // 1-5
  legacyCost: number;
  prerequisites: string[]; // tech IDs required
  unlocks: string[];       // what this tech enables
  curriculumHook: string;  // teaching connection
  category: "agriculture" | "military" | "economy" | "culture" | "science" | "governance";
}

// --- TIER 1 (~35 Legacy) --- No prerequisites
const TIER_1: TechDefinition[] = [
  {
    id: "animal_husbandry",
    name: "Animal Husbandry",
    emoji: "🐄",
    tier: 1,
    legacyCost: 35,
    prerequisites: [],
    unlocks: ["Granary building", "Food yields +10%"],
    curriculumHook: "How did domesticating animals transform early civilizations?",
    category: "agriculture",
  },
  {
    id: "pottery",
    name: "Pottery",
    emoji: "🏺",
    tier: 1,
    legacyCost: 35,
    prerequisites: [],
    unlocks: ["Food tradeable on Spot Board", "Storage capacity +20%"],
    curriculumHook: "Why was the ability to store food a game-changer for settlement?",
    category: "economy",
  },
  {
    id: "mining",
    name: "Mining",
    emoji: "⛏️",
    tier: 1,
    legacyCost: 35,
    prerequisites: [],
    unlocks: ["Ore resources visible", "Production +15% in mountain sub-zones"],
    curriculumHook: "How did access to metals shape who had power?",
    category: "science",
  },
  {
    id: "sailing",
    name: "Sailing",
    emoji: "⛵",
    tier: 1,
    legacyCost: 35,
    prerequisites: [],
    unlocks: ["Sea routes for trade", "Coastal sub-zone reveals"],
    curriculumHook: "How did sea travel expand the known world?",
    category: "economy",
  },
  {
    id: "writing",
    name: "Writing",
    emoji: "✍️",
    tier: 1,
    legacyCost: 35,
    prerequisites: [],
    unlocks: ["Civilization Codex", "Library building", "+5 Legacy one-time"],
    curriculumHook: "Why is writing considered the start of recorded history?",
    category: "culture",
  },
];

// --- TIER 2 (~60 Legacy, requires 2× T1) ---
const TIER_2: TechDefinition[] = [
  {
    id: "the_wheel",
    name: "The Wheel",
    emoji: "☸️",
    tier: 2,
    legacyCost: 60,
    prerequisites: ["animal_husbandry", "mining"],
    unlocks: ["Builder unit cost −2", "Trade route speed +25%"],
    curriculumHook: "How did the wheel revolutionize both agriculture and warfare?",
    category: "science",
  },
  {
    id: "bronze_working",
    name: "Bronze Working",
    emoji: "🗡️",
    tier: 2,
    legacyCost: 60,
    prerequisites: ["mining", "pottery"],
    unlocks: ["Swordsman unit", "Walls cost reduced", "Ore → bronze smelting"],
    curriculumHook: "What was the Bronze Age and why was it significant?",
    category: "military",
  },
  {
    id: "masonry",
    name: "Masonry",
    emoji: "🧱",
    tier: 2,
    legacyCost: 60,
    prerequisites: ["mining", "pottery"],
    unlocks: ["Walls building", "Building durability +1"],
    curriculumHook: "How did stone construction change what civilizations could build?",
    category: "science",
  },
  {
    id: "calendar",
    name: "Calendar",
    emoji: "📅",
    tier: 2,
    legacyCost: 60,
    prerequisites: ["writing", "animal_husbandry"],
    unlocks: ["Planting season bonus", "Festival events"],
    curriculumHook: "Why was tracking seasons essential for agricultural civilizations?",
    category: "culture",
  },
  {
    id: "currency",
    name: "Currency",
    emoji: "🪙",
    tier: 2,
    legacyCost: 60,
    prerequisites: ["writing", "pottery"],
    unlocks: ["Market building", "Trade agreements", "Formal economy"],
    curriculumHook: "How did money replace barter and what changed?",
    category: "economy",
  },
  {
    id: "archery",
    name: "Archery",
    emoji: "🏹",
    tier: 2,
    legacyCost: 60,
    prerequisites: ["animal_husbandry", "mining"],
    unlocks: ["Archer unit", "Ranged defense bonus"],
    curriculumHook: "How did ranged weapons change the balance of power?",
    category: "military",
  },
  {
    id: "celestial_navigation",
    name: "Celestial Navigation",
    emoji: "🌟",
    tier: 2,
    legacyCost: 60,
    prerequisites: ["sailing", "writing"],
    unlocks: ["Deep sea trade routes", "Scout range +2"],
    curriculumHook: "How did early navigators use stars to cross oceans?",
    category: "science",
  },
  {
    id: "irrigation",
    name: "Irrigation",
    emoji: "💧",
    tier: 2,
    legacyCost: 60,
    prerequisites: ["animal_husbandry", "pottery"],
    unlocks: ["Aqueduct building", "River valley food +25%"],
    curriculumHook: "Why were river valleys the cradles of civilization?",
    category: "agriculture",
  },
];

// --- TIER 3 (~90 Legacy, requires 2× T2) ---
const TIER_3: TechDefinition[] = [
  {
    id: "iron_working",
    name: "Iron Working",
    emoji: "⚔️",
    tier: 3,
    legacyCost: 90,
    prerequisites: ["bronze_working", "the_wheel"],
    unlocks: ["Iron units", "Stronger weapons", "Bronze → iron smelting"],
    curriculumHook: "What advantages did iron have over bronze?",
    category: "military",
  },
  {
    id: "construction",
    name: "Construction",
    emoji: "🏗️",
    tier: 3,
    legacyCost: 90,
    prerequisites: ["masonry", "the_wheel"],
    unlocks: ["Aqueduct building", "Building cost −2 globally"],
    curriculumHook: "How did engineering enable monumental construction?",
    category: "science",
  },
  {
    id: "mathematics",
    name: "Mathematics",
    emoji: "📐",
    tier: 3,
    legacyCost: 90,
    prerequisites: ["currency", "calendar"],
    unlocks: ["Catapult unit", "Trade calculations exact", "Resource projections"],
    curriculumHook: "How did math advance both commerce and warfare?",
    category: "science",
  },
  {
    id: "philosophy",
    name: "Philosophy",
    emoji: "🤔",
    tier: 3,
    legacyCost: 90,
    prerequisites: ["writing", "calendar"],
    unlocks: ["Government choices", "CI bonus +10%"],
    curriculumHook: "How did philosophy shape governance systems?",
    category: "governance",
  },
  {
    id: "drama_and_poetry",
    name: "Drama & Poetry",
    emoji: "🎭",
    tier: 3,
    legacyCost: 90,
    prerequisites: ["writing", "calendar"],
    unlocks: ["Festival event", "CI spread +20%", "Cultural victory bonus"],
    curriculumHook: "How did art and storytelling build cultural identity?",
    category: "culture",
  },
  {
    id: "horseback_riding",
    name: "Horseback Riding",
    emoji: "🐴",
    tier: 3,
    legacyCost: 90,
    prerequisites: ["archery", "the_wheel"],
    unlocks: ["Cavalry unit", "Movement range +1"],
    curriculumHook: "How did mounted warriors transform warfare?",
    category: "military",
  },
  {
    id: "optics",
    name: "Optics",
    emoji: "🔭",
    tier: 3,
    legacyCost: 90,
    prerequisites: ["celestial_navigation", "mathematics"],
    unlocks: ["Scout vision +3", "Lighthouse building"],
    curriculumHook: "How did seeing farther change exploration and defense?",
    category: "science",
  },
  {
    id: "trade_routes",
    name: "Trade Routes",
    emoji: "🛣️",
    tier: 3,
    legacyCost: 90,
    prerequisites: ["currency", "celestial_navigation"],
    unlocks: ["Formal Trade Agreements", "Route income doubled"],
    curriculumHook: "How did the Silk Road and other routes connect civilizations?",
    category: "economy",
  },
  {
    id: "terrace_farming",
    name: "Terrace Farming",
    emoji: "🌾",
    tier: 3,
    legacyCost: 90,
    prerequisites: ["irrigation", "masonry"],
    unlocks: ["Mountain food production", "Depletion recovery +10"],
    curriculumHook: "How did terrace farming make mountains farmable?",
    category: "agriculture",
  },
  {
    id: "crop_rotation",
    name: "Crop Rotation",
    emoji: "🌱",
    tier: 3,
    legacyCost: 90,
    prerequisites: ["irrigation", "calendar"],
    unlocks: ["Soil fertility recovery +15", "Farm output +20%"],
    curriculumHook: "How did crop rotation solve the problem of soil exhaustion?",
    category: "agriculture",
  },
];

// --- TIER 4 (~120 Legacy, requires 3× T3) ---
const TIER_4: TechDefinition[] = [
  {
    id: "steel",
    name: "Steel",
    emoji: "🗡️",
    tier: 4,
    legacyCost: 120,
    prerequisites: ["iron_working", "construction", "mathematics"],
    unlocks: ["Steel units", "Top-tier military", "Iron → steel smelting"],
    curriculumHook: "How did steel transform both construction and warfare?",
    category: "military",
  },
  {
    id: "engineering",
    name: "Engineering",
    emoji: "⚙️",
    tier: 4,
    legacyCost: 120,
    prerequisites: ["construction", "mathematics", "iron_working"],
    unlocks: ["Wonder cost −20%", "Building repair free"],
    curriculumHook: "How did engineering enable wonders of the ancient world?",
    category: "science",
  },
  {
    id: "civil_service",
    name: "Civil Service",
    emoji: "📋",
    tier: 4,
    legacyCost: 120,
    prerequisites: ["philosophy", "mathematics", "trade_routes"],
    unlocks: ["Bureaucracy government", "Admin efficiency +15%"],
    curriculumHook: "How did organized government change how empires were managed?",
    category: "governance",
  },
  {
    id: "feudalism",
    name: "Feudalism",
    emoji: "🏰",
    tier: 4,
    legacyCost: 120,
    prerequisites: ["philosophy", "horseback_riding", "construction"],
    unlocks: ["Vassal system", "Knight unit", "Feudal hierarchy"],
    curriculumHook: "How did feudalism organize medieval society?",
    category: "governance",
  },
  {
    id: "guilds",
    name: "Guilds",
    emoji: "🔨",
    tier: 4,
    legacyCost: 120,
    prerequisites: ["trade_routes", "mathematics", "currency"],
    unlocks: ["Production +25%", "Specialist workers"],
    curriculumHook: "How did trade guilds protect craftsmanship and workers?",
    category: "economy",
  },
  {
    id: "education",
    name: "Education",
    emoji: "🎓",
    tier: 4,
    legacyCost: 120,
    prerequisites: ["philosophy", "drama_and_poetry", "optics"],
    unlocks: ["Research speed +25%", "Legacy yield +15%"],
    curriculumHook: "How did formalized education accelerate civilization?",
    category: "culture",
  },
  {
    id: "chivalry",
    name: "Chivalry",
    emoji: "🛡️",
    tier: 4,
    legacyCost: 120,
    prerequisites: ["horseback_riding", "iron_working", "philosophy"],
    unlocks: ["Knight unit", "War exhaustion recovery +10"],
    curriculumHook: "How did the code of chivalry shape medieval warfare?",
    category: "military",
  },
];

// --- TIER 5 (~160 Legacy, requires 3× T4) ---
const TIER_5: TechDefinition[] = [
  {
    id: "printing_press",
    name: "Printing Press",
    emoji: "📰",
    tier: 5,
    legacyCost: 160,
    prerequisites: ["education", "guilds", "engineering"],
    unlocks: ["CI spread +50%", "Research speed +30%"],
    curriculumHook: "How did the printing press democratize knowledge?",
    category: "culture",
  },
  {
    id: "gunpowder",
    name: "Gunpowder",
    emoji: "💣",
    tier: 5,
    legacyCost: 160,
    prerequisites: ["steel", "engineering", "chivalry"],
    unlocks: ["Musketeer unit", "Siege weapons", "Walls less effective vs gunpowder"],
    curriculumHook: "How did gunpowder end the age of castles?",
    category: "military",
  },
  {
    id: "astronomy",
    name: "Astronomy",
    emoji: "🔭",
    tier: 5,
    legacyCost: 160,
    prerequisites: ["education", "optics", "engineering"],
    unlocks: ["Full map reveal", "Endgame Epoch: Lunar Race eligible"],
    curriculumHook: "How did astronomy connect science to exploration?",
    category: "science",
  },
  {
    id: "banking",
    name: "Banking",
    emoji: "🏦",
    tier: 5,
    legacyCost: 160,
    prerequisites: ["guilds", "civil_service", "education"],
    unlocks: ["Bank decay −50%", "Resource loans", "Economic victory bonus"],
    curriculumHook: "How did banking institutions fuel economic growth?",
    category: "economy",
  },
  {
    id: "diplomatic_corps",
    name: "Diplomatic Corps",
    emoji: "🤝",
    tier: 5,
    legacyCost: 160,
    prerequisites: ["civil_service", "education", "guilds"],
    unlocks: ["Diplomatic immunity", "Alliance network", "War prevention"],
    curriculumHook: "How did formal diplomacy prevent (and sometimes cause) wars?",
    category: "governance",
  },
  {
    id: "scientific_method",
    name: "Scientific Method",
    emoji: "🔬",
    tier: 5,
    legacyCost: 160,
    prerequisites: ["astronomy", "printing_press", "banking"],
    unlocks: ["All research costs −25%", "Endgame Epoch: Mars eligible"],
    curriculumHook: "How did the scientific method change how humans understand the world?",
    category: "science",
  },
  {
    id: "scientific_agriculture",
    name: "Scientific Agri.",
    emoji: "🧬",
    tier: 5,
    legacyCost: 160,
    prerequisites: ["education", "guilds", "engineering"],
    unlocks: ["Farm output ×2", "Famine immunity", "Full soil recovery"],
    curriculumHook: "How did science transform farming and food production?",
    category: "agriculture",
  },
];

// --- Complete Tech Tree ---
export const TECH_TREE: TechDefinition[] = [
  ...TIER_1,
  ...TIER_2,
  ...TIER_3,
  ...TIER_4,
  ...TIER_5,
];

/**
 * Get a tech by ID
 */
export function getTech(id: string): TechDefinition | undefined {
  return TECH_TREE.find((t) => t.id === id);
}

/**
 * Get all techs in a specific tier
 */
export function getTechsByTier(tier: number): TechDefinition[] {
  return TECH_TREE.filter((t) => t.tier === tier);
}

/**
 * Check if a team can start researching a tech
 * based on their completed techs and the tech's prerequisites.
 */
export function canResearch(
  techId: string,
  completedTechIds: string[]
): boolean {
  const tech = getTech(techId);
  if (!tech) return false;
  if (completedTechIds.includes(techId)) return false; // already researched
  return tech.prerequisites.every((prereq) => completedTechIds.includes(prereq));
}

/**
 * Get the number of required T(n-1) techs needed to start any T(n) tech
 */
export function getRequiredPrereqCount(tier: number): number {
  if (tier <= 1) return 0;
  if (tier <= 3) return 2;
  return 3; // T4 and T5 require 3 prereqs
}

/**
 * Get the research state of each tech for a team
 */
export type TechState = "locked" | "available" | "in_progress" | "completed";

export function getTechStates(
  completedTechIds: string[],
  activeResearchId: string | null,
  legacyInvested: Record<string, number>
): Record<string, TechState> {
  const states: Record<string, TechState> = {};

  for (const tech of TECH_TREE) {
    if (completedTechIds.includes(tech.id)) {
      states[tech.id] = "completed";
    } else if (tech.id === activeResearchId) {
      states[tech.id] = "in_progress";
    } else if (canResearch(tech.id, completedTechIds)) {
      states[tech.id] = "available";
    } else {
      states[tech.id] = "locked";
    }
  }

  return states;
}

/**
 * CATEGORY COLORS for visual grouping
 */
export const CATEGORY_COLORS: Record<string, string> = {
  agriculture: "#84cc16",  // lime
  military: "#ef4444",     // red
  economy: "#f59e0b",      // amber
  culture: "#a855f7",      // purple
  science: "#3b82f6",      // blue
  governance: "#06b6d4",   // cyan
};

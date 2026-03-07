// ============================================
// Victory Engine — Victory Condition Calculation
// Decision 74: Economic, Population, Cultural,
// Scientific, Endgame Epoch — no Domination
// ============================================

export type VictoryType =
  | "economic"
  | "population"
  | "cultural"
  | "scientific"
  | "endgame_lunar_race"
  | "endgame_mars_colonization"
  | "endgame_warp_speed";

export interface VictoryCondition {
  type: VictoryType;
  label: string;
  description: string;
  emoji: string;
}

export const VICTORY_CONDITIONS: Record<VictoryType, VictoryCondition> = {
  economic: {
    type: "economic",
    label: "Economic Victory",
    description: "Highest total banked resources (all 4 combined)",
    emoji: "💰",
  },
  population: {
    type: "population",
    label: "Population Victory",
    description: "Highest population count at game end",
    emoji: "👥",
  },
  cultural: {
    type: "cultural",
    label: "Cultural Victory",
    description: "Highest CI score AND CI presence across >50% of sub-zones",
    emoji: "🎭",
  },
  scientific: {
    type: "scientific",
    label: "Scientific Victory",
    description: "First team to reach Tier 4 tech tree",
    emoji: "🔬",
  },
  endgame_lunar_race: {
    type: "endgame_lunar_race",
    label: "Lunar Race",
    description: "First civ to research Space Exploration plants the flag",
    emoji: "🌙",
  },
  endgame_mars_colonization: {
    type: "endgame_mars_colonization",
    label: "Mars Colonization",
    description: "First civ to hit resource + research threshold",
    emoji: "🔴",
  },
  endgame_warp_speed: {
    type: "endgame_warp_speed",
    label: "Warp Speed + Alien Contact",
    description: "Deep space message — every civ submits first-contact response",
    emoji: "🛸",
  },
};

// ---- Team Data Interfaces ----

export interface TeamStanding {
  teamId: string;
  teamName: string;
  rank: number;
  score: number;
  achieved: boolean;
}

export interface TeamData {
  id: string;
  name: string;
  resources: {
    production: number;
    reach: number;
    legacy: number;
    resilience: number;
  };
  population: number;
  ciScore: number;
  ciSpread: number;             // percentage of sub-zones with CI presence
  totalSubZones: number;
  highestTechTier: number;
  completedTechs: string[];
  wondersCompleted: string[];
}

export interface VictoryResult {
  type: VictoryType;
  standings: TeamStanding[];
  achievedBy: string | null;    // teamId of winner
}

// ---- Calculation Functions ----

/**
 * Calculate standings for Economic Victory.
 * Sum of all 4 banked resources.
 */
function calculateEconomic(teams: TeamData[]): VictoryResult {
  const scored = teams.map((t) => ({
    teamId: t.id,
    teamName: t.name,
    score:
      t.resources.production +
      t.resources.reach +
      t.resources.legacy +
      t.resources.resilience,
    achieved: false,
  }));

  scored.sort((a, b) => b.score - a.score);
  scored.forEach((s, i) => (s.achieved = i === 0));

  return {
    type: "economic",
    standings: scored.map((s, i) => ({ ...s, rank: i + 1 })),
    achievedBy: scored[0]?.teamId ?? null,
  };
}

/**
 * Calculate standings for Population Victory.
 */
function calculatePopulation(teams: TeamData[]): VictoryResult {
  const scored = teams.map((t) => ({
    teamId: t.id,
    teamName: t.name,
    score: t.population,
    achieved: false,
  }));

  scored.sort((a, b) => b.score - a.score);
  scored.forEach((s, i) => (s.achieved = i === 0));

  return {
    type: "population",
    standings: scored.map((s, i) => ({ ...s, rank: i + 1 })),
    achievedBy: scored[0]?.teamId ?? null,
  };
}

/**
 * Calculate standings for Cultural Victory.
 * Highest CI score AND CI presence across >50% of sub-zones.
 */
function calculateCultural(teams: TeamData[]): VictoryResult {
  const scored = teams.map((t) => ({
    teamId: t.id,
    teamName: t.name,
    score: t.ciScore,
    meetsSpread: t.ciSpread > 50,
    achieved: false,
  }));

  scored.sort((a, b) => b.score - a.score);

  // Winner must meet spread threshold
  const winner = scored.find((s) => s.meetsSpread);
  if (winner) winner.achieved = true;

  return {
    type: "cultural",
    standings: scored.map((s, i) => ({ ...s, rank: i + 1 })),
    achievedBy: winner?.teamId ?? null,
  };
}

/**
 * Calculate standings for Scientific Victory.
 * First team to reach Tier 4 tech tree.
 */
function calculateScientific(teams: TeamData[]): VictoryResult {
  const scored = teams.map((t) => ({
    teamId: t.id,
    teamName: t.name,
    score: t.highestTechTier,
    achieved: t.highestTechTier >= 4,
  }));

  scored.sort((a, b) => b.score - a.score);

  // First Tier 4 team wins
  const winner = scored.find((s) => s.achieved);

  return {
    type: "scientific",
    standings: scored.map((s, i) => ({ ...s, rank: i + 1 })),
    achievedBy: winner?.teamId ?? null,
  };
}

/**
 * Calculate standings for Endgame: Lunar Race.
 */
function calculateLunarRace(teams: TeamData[]): VictoryResult {
  const scored = teams.map((t) => ({
    teamId: t.id,
    teamName: t.name,
    score: t.completedTechs.includes("space_exploration") ? 1 : 0,
    achieved: t.completedTechs.includes("space_exploration"),
  }));

  scored.sort((a, b) => b.score - a.score);
  const winner = scored.find((s) => s.achieved);

  return {
    type: "endgame_lunar_race",
    standings: scored.map((s, i) => ({ ...s, rank: i + 1 })),
    achievedBy: winner?.teamId ?? null,
  };
}

/**
 * Calculate standings for Endgame: Mars Colonization.
 * Requires both resource threshold and research threshold.
 */
function calculateMarsColonization(teams: TeamData[]): VictoryResult {
  const RESOURCE_THRESHOLD = 200; // total across all resources
  const scored = teams.map((t) => {
    const totalRes =
      t.resources.production + t.resources.reach + t.resources.legacy + t.resources.resilience;
    const hasResources = totalRes >= RESOURCE_THRESHOLD;
    const hasResearch = t.highestTechTier >= 4;
    return {
      teamId: t.id,
      teamName: t.name,
      score: totalRes,
      achieved: hasResources && hasResearch,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const winner = scored.find((s) => s.achieved);

  return {
    type: "endgame_mars_colonization",
    standings: scored.map((s, i) => ({ ...s, rank: i + 1 })),
    achievedBy: winner?.teamId ?? null,
  };
}

/**
 * Calculate standings for Endgame: Warp Speed.
 * Narrative-driven — all civs submit first-contact response.
 * Scored by DM discretion (CI score used as proxy).
 */
function calculateWarpSpeed(teams: TeamData[]): VictoryResult {
  const scored = teams.map((t) => ({
    teamId: t.id,
    teamName: t.name,
    score: t.ciScore, // proxy score
    achieved: false,
  }));

  scored.sort((a, b) => b.score - a.score);
  scored.forEach((s, i) => (s.achieved = i === 0));

  return {
    type: "endgame_warp_speed",
    standings: scored.map((s, i) => ({ ...s, rank: i + 1 })),
    achievedBy: scored[0]?.teamId ?? null,
  };
}

// ---- Main Victory Engine ----

const CALCULATORS: Record<VictoryType, (teams: TeamData[]) => VictoryResult> = {
  economic: calculateEconomic,
  population: calculatePopulation,
  cultural: calculateCultural,
  scientific: calculateScientific,
  endgame_lunar_race: calculateLunarRace,
  endgame_mars_colonization: calculateMarsColonization,
  endgame_warp_speed: calculateWarpSpeed,
};

/**
 * Calculate all active victory conditions for a game.
 */
export function calculateVictories(
  teams: TeamData[],
  activeConditions: VictoryType[]
): VictoryResult[] {
  return activeConditions.map((type) => CALCULATORS[type](teams));
}

/**
 * Calculate composite overall standings.
 * Points: 1st=6, 2nd=5, 3rd=4, 4th=3, 5th=2, 6th=1
 */
export function calculateOverallStandings(
  results: VictoryResult[],
  teams: TeamData[]
): TeamStanding[] {
  const points: Record<string, number> = {};
  const names: Record<string, string> = {};

  for (const team of teams) {
    points[team.id] = 0;
    names[team.id] = team.name;
  }

  const maxTeams = teams.length;

  for (const result of results) {
    for (const standing of result.standings) {
      points[standing.teamId] =
        (points[standing.teamId] ?? 0) + (maxTeams + 1 - standing.rank);
    }
  }

  const standings = Object.entries(points)
    .map(([teamId, score]) => ({
      teamId,
      teamName: names[teamId] ?? "Unknown",
      score,
      achieved: false,
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score);

  standings.forEach((s, i) => {
    s.rank = i + 1;
    s.achieved = i === 0;
  });

  return standings;
}

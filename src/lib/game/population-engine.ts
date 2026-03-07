// ============================================
// Population Engine (Decision 41, 43, 45)
// Food passive from Farm/Granary. Pop = yield multiplier + capacity.
// ============================================

export interface PopulationState {
  populationCurrent: number;
  foodCurrent: number;
  foodCapacity: number;
  hasFarm: boolean;
  hasGranary: boolean;
  farmCount: number;
}

export interface PopulationTickResult {
  newPopulation: number;
  newFood: number;
  foodGenerated: number;
  foodConsumed: number;
  populationChange: number;
  events: string[];
}

/** Food generated per Farm per epoch (calibrated for 30-epoch arc: 1 farm = breakeven at pop 5) */
const FOOD_PER_FARM = 5;

/** Food consumption per population unit per epoch */
const FOOD_PER_POP = 1;

/** Food threshold ratio for growth (food must exceed this × pop) */
const GROWTH_THRESHOLD = 1.5;

/** Population growth per tick when conditions are met */
const POP_GROWTH_RATE = 1;

/** Population decline per tick during famine */
const FAMINE_DECLINE_RATE = 1;

/** Minimum population (can't go to zero — Decision 75: no civ death) */
const MIN_POPULATION = 1;

/**
 * Process one epoch of population + food simulation
 */
export function tickPopulation(state: PopulationState): PopulationTickResult {
  const events: string[] = [];
  let { populationCurrent, foodCurrent } = state;

  // --- Food Generation ---
  let foodGenerated = 0;
  if (state.hasFarm) {
    foodGenerated = state.farmCount * FOOD_PER_FARM;
  }
  foodCurrent += foodGenerated;

  // --- Food Consumption ---
  const foodConsumed = populationCurrent * FOOD_PER_POP;
  foodCurrent -= foodConsumed;

  // --- Granary: halve food decay (spoilage) ---
  // If granary exists, food floor is 0 (no additional spoilage loss)
  // Without granary, additional -1 spoilage per epoch
  if (!state.hasGranary && foodCurrent > 0) {
    const spoilage = Math.ceil(foodCurrent * 0.1);
    foodCurrent -= spoilage;
    if (spoilage > 0) {
      events.push(`Food spoilage: -${spoilage} (no Granary)`);
    }
  }

  // --- Population Growth / Decline ---
  let populationChange = 0;

  if (foodCurrent <= 0) {
    // Famine: population declines
    foodCurrent = 0;
    populationChange = -FAMINE_DECLINE_RATE;
    events.push("⚠️ Famine! Population declining.");
  } else if (foodCurrent > populationCurrent * GROWTH_THRESHOLD) {
    // Surplus: population grows
    populationChange = POP_GROWTH_RATE;
    events.push("🌾 Food surplus — population growing!");
  }

  populationCurrent = Math.max(MIN_POPULATION, populationCurrent + populationChange);

  // Clamp food
  if (foodCurrent > state.foodCapacity) {
    foodCurrent = state.foodCapacity;
  }
  foodCurrent = Math.max(0, foodCurrent);

  return {
    newPopulation: populationCurrent,
    newFood: foodCurrent,
    foodGenerated,
    foodConsumed,
    populationChange,
    events,
  };
}

/**
 * Get unit cap based on population
 */
export function getUnitCap(population: number): number {
  if (population <= 3) return 2;
  if (population <= 5) return 4;
  if (population <= 8) return 6;
  if (population <= 12) return 8;
  return 10;
}

/**
 * Get building slots based on population
 */
export function getBuildingSlots(population: number): number {
  if (population <= 3) return 3;
  if (population <= 5) return 5;
  if (population <= 8) return 7;
  if (population <= 12) return 9;
  return 12;
}

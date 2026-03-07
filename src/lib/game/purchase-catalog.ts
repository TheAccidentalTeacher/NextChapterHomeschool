// ============================================
// ClassCiv Purchase Catalog
// Decision 39: 13 purchasable items in 3 categories
// Defines all buildings, units, and supplies with
// costs, benefits, tech gates, and destruction rules.
// ============================================

import type { ResourceType } from "@/types/database";

export type AssetCategory = "building" | "unit" | "supply";

export interface PurchaseItem {
  key: string;
  name: string;
  emoji: string;
  category: AssetCategory;
  costAmount: number;
  costResource: ResourceType;
  benefit: string;
  techGate: string | null;       // tech_key required, null = no gate
  destroyedBy: string | null;    // event key that destroys it, null = indestructible
  isStackable: boolean;          // can you build multiple?
}

// --- BUILDINGS (cost: Production) ---
export const BUILDINGS: PurchaseItem[] = [
  {
    key: "farm",
    name: "Farm",
    emoji: "🌾",
    category: "building",
    costAmount: 6,
    costResource: "production",
    benefit: "+3 Food/epoch auto",
    techGate: null,
    destroyedBy: "fire",
    isStackable: true,
  },
  {
    key: "granary",
    name: "Granary",
    emoji: "🏛️",
    category: "building",
    costAmount: 8,
    costResource: "production",
    benefit: "Food decay halved",
    techGate: null,
    destroyedBy: null,
    isStackable: false,
  },
  {
    key: "barracks",
    name: "Barracks",
    emoji: "⚔️",
    category: "building",
    costAmount: 10,
    costResource: "production",
    benefit: "Soldiers cost 4 instead of 6",
    techGate: null,
    destroyedBy: "raid",
    isStackable: false,
  },
  {
    key: "market",
    name: "Market",
    emoji: "🏪",
    category: "building",
    costAmount: 8,
    costResource: "production",
    benefit: "Trade routes +50% Reach",
    techGate: null,
    destroyedBy: null, // blockadeable but not destroyable
    isStackable: false,
  },
  {
    key: "aqueduct",
    name: "Aqueduct",
    emoji: "💧",
    category: "building",
    costAmount: 12,
    costResource: "production",
    benefit: "Immune to disease/drought events",
    techGate: null,
    destroyedBy: "drought",
    isStackable: false,
  },
  {
    key: "library",
    name: "Library",
    emoji: "📚",
    category: "building",
    costAmount: 10,
    costResource: "production",
    benefit: "+25% Legacy permanently",
    techGate: null,
    destroyedBy: null,
    isStackable: false,
  },
  {
    key: "walls",
    name: "Walls",
    emoji: "🧱",
    category: "building",
    costAmount: 14,
    costResource: "production",
    benefit: "First attack/epoch absorbed at zero loss",
    techGate: null,
    destroyedBy: "siege",
    isStackable: false,
  },
];

// --- UNITS (cost: Reach or Resilience) ---
export const UNITS: PurchaseItem[] = [
  {
    key: "scout",
    name: "Scout",
    emoji: "🧭",
    category: "unit",
    costAmount: 5,
    costResource: "reach",
    benefit: "Reveals 3 fog sub-zones",
    techGate: null,
    destroyedBy: "expand_crit",
    isStackable: true,
  },
  {
    key: "soldier",
    name: "Soldier",
    emoji: "🛡️",
    category: "unit",
    costAmount: 6,
    costResource: "resilience",
    benefit: "Defends territory in battle",
    techGate: null,
    destroyedBy: "raid",
    isStackable: true,
  },
  {
    key: "merchant_unit",
    name: "Merchant",
    emoji: "💰",
    category: "unit",
    costAmount: 7,
    costResource: "reach",
    benefit: "Active trade routes, Reach bonus",
    techGate: null,
    destroyedBy: "raid",
    isStackable: true,
  },
  {
    key: "builder",
    name: "Builder",
    emoji: "🔨",
    category: "unit",
    costAmount: 8,
    costResource: "production",
    benefit: "Building cost −3 while deployed",
    techGate: null,
    destroyedBy: "tools_break",
    isStackable: true,
  },
];

// --- SUPPLIES (cost: Production or Resilience) ---
export const SUPPLIES: PurchaseItem[] = [
  {
    key: "food_stores",
    name: "Food Stores",
    emoji: "🥫",
    category: "supply",
    costAmount: 4,
    costResource: "production",
    benefit: "Buffer vs famine",
    techGate: null,
    destroyedBy: "drought",
    isStackable: true,
  },
  {
    key: "medicine",
    name: "Medicine",
    emoji: "💊",
    category: "supply",
    costAmount: 5,
    costResource: "resilience",
    benefit: "Buffer vs disease/plague",
    techGate: null,
    destroyedBy: "plague",
    isStackable: true,
  },
  {
    key: "repair_tools",
    name: "Repair Tools",
    emoji: "🔧",
    category: "supply",
    costAmount: 4,
    costResource: "production",
    benefit: "Rebuild damaged buildings",
    techGate: null,
    destroyedBy: "fire",
    isStackable: true,
  },
];

// --- Combined catalog ---
export const PURCHASE_CATALOG: PurchaseItem[] = [
  ...BUILDINGS,
  ...UNITS,
  ...SUPPLIES,
];

/**
 * Look up a purchase item by key
 */
export function getPurchaseItem(key: string): PurchaseItem | undefined {
  return PURCHASE_CATALOG.find((item) => item.key === key);
}

/**
 * Get items by category
 */
export function getItemsByCategory(category: AssetCategory): PurchaseItem[] {
  return PURCHASE_CATALOG.filter((item) => item.category === category);
}

/**
 * Calculate adjusted cost considering Builder discount
 */
export function getAdjustedCost(
  item: PurchaseItem,
  hasBuilder: boolean
): number {
  if (hasBuilder && item.category === "building") {
    return Math.max(1, item.costAmount - 3);
  }
  return item.costAmount;
}

// ============================================
// ClassCiv Database Types
// Derived from Decisions 1–93 in BRAINSTORM.md
// ============================================

// --- Enums ---

export type UserRole = "student" | "teacher" | "projector";

export type RoleName =
  | "architect"
  | "merchant"
  | "diplomat"
  | "lorekeeper"
  | "warlord";

export type RoundType = "EXPAND" | "BUILD" | "RESOLVE" | "DEFINE";

export type EpochPhase = "active" | "resolving" | "completed";

export type ResourceType =
  | "production"
  | "reach"
  | "legacy"
  | "resilience"
  | "food";

export type TerrainType =
  | "plains"
  | "forest"
  | "mountain"
  | "desert"
  | "coastal"
  | "river_valley"
  | "tundra"
  | "jungle";

export type FoundingClaim =
  | "first_settler"
  | "resource_hub"
  | "natural_landmark";

export type VictoryType =
  | "economic"
  | "population"
  | "cultural"
  | "scientific"
  | "endgame_epoch";

export type ConflictType = "war" | "duel";

export type TradeType = "spot" | "agreement";

export type NpcType = "caravan" | "colossus" | "survivor";

export type ActionType =
  | "expand"
  | "build"
  | "research"
  | "trade"
  | "diplomacy"
  | "define"
  | "military";

export type GovernmentType =
  | "chiefdom"
  | "monarchy"
  | "republic"
  | "theocracy"
  | "bureaucracy"
  | "democracy";

// --- Core Tables ---

export interface Game {
  id: string;
  name: string;
  teacher_id: string;
  current_epoch: number;
  current_round: RoundType;
  epoch_phase: EpochPhase;
  math_gate_enabled: boolean;
  math_gate_difficulty: "multiply" | "divide" | "ratio" | "percent";
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  game_id: string;
  name: string;
  civilization_name: string | null;
  region_id: number;
  population: number;
  government_type: GovernmentType;
  is_in_dark_age: boolean;
  war_exhaustion_level: number; // 0 = none, 1 = -15%, 2 = -30%
  confederation_id: string | null; // v2: nullable FK for confederation
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  clerk_user_id: string;
  display_name: string;
  current_role: RoleName;
  is_absent: boolean;
  joined_at: string;
}

export interface TeamResource {
  id: string;
  team_id: string;
  resource_type: ResourceType;
  amount: number;
  updated_at: string;
}

// --- Map & Territory ---

export interface SubZone {
  id: string;
  game_id: string;
  zone_number: number;
  terrain_type: TerrainType;
  controlled_by_team_id: string | null;
  // Decision 87: Depletion system
  soil_fertility: number;    // 0–100
  wildlife_stock: number;    // 0–100
  fertility_cap: number;     // max recovery cap, defaults 100
  // Decision 90: Landmark founding
  founding_claim: FoundingClaim | null;
  settlement_name: string | null;
  founding_epoch: number | null;
  first_settler_decay_epochs: number; // epochs until First Settler bonus decays
  founding_bonus_active: boolean;
  // GeoJSON coordinates stored as JSONB
  geojson: Record<string, unknown>;
  yield_modifier: number;    // terrain-based multiplier
}

export interface TeamFogState {
  id: string;
  team_id: string;
  sub_zone_id: string;
  is_visible: boolean;
  revealed_at: string | null;
}

// --- Tech Tree (Decision 62) ---

export interface TechResearch {
  id: string;
  team_id: string;
  tech_key: string;           // e.g. "pottery", "bronze_working", "philosophy"
  tier: number;               // 1–5
  researched_at: string;
  researched_epoch: number;
}

// --- Economy & Trade (Decision 69) ---

export interface TradeOffer {
  id: string;
  game_id: string;
  offering_team_id: string;
  offering_resource: ResourceType;
  offering_amount: number;
  requesting_resource: ResourceType;
  requesting_amount: number;
  trade_type: TradeType;
  is_open: boolean;
  created_epoch: number;
  created_at: string;
}

export interface TradeAgreement {
  id: string;
  game_id: string;
  team_a_id: string;
  team_b_id: string;
  resource_a_to_b: ResourceType;
  amount_a_to_b: number;
  resource_b_to_a: ResourceType;
  amount_b_to_a: number;
  start_epoch: number;
  duration_epochs: number;
  consecutive_epochs: number; // tracks confederation eligibility
  is_active: boolean;
}

export interface TradeEmbargo {
  id: string;
  game_id: string;
  imposing_team_id: string;
  target_team_id: string;
  start_epoch: number;
  end_epoch: number | null;
  is_active: boolean;
}

// --- Buildings & Purchases (Decision 39) ---

export interface TeamAsset {
  id: string;
  team_id: string;
  asset_key: string;          // e.g. "farm", "library", "granary", "wall"
  sub_zone_id: string;
  built_epoch: number;
  is_active: boolean;
}

// --- Submissions (Decision 70) ---

export interface EpochSubmission {
  id: string;
  team_id: string;
  game_id: string;
  epoch: number;
  round_type: RoundType;
  role: RoleName;
  submitted_by: string;        // clerk_user_id
  content: string;             // the actual submission text/JSON
  dm_score: number | null;     // Scott's rating
  dm_feedback: string | null;
  submitted_at: string;
  scored_at: string | null;
}

// --- Wonders (Decision 39, tier 4+) ---

export interface WonderProgress {
  id: string;
  team_id: string;
  wonder_key: string;
  production_invested: number;
  production_required: number;
  is_complete: boolean;
  completed_epoch: number | null;
}

// --- Conflict (Decision 65) ---

export interface EpochConflictFlag {
  id: string;
  game_id: string;
  epoch: number;
  aggressor_team_id: string;
  defender_team_id: string;
  conflict_type: ConflictType;  // v2: includes "duel"
  justification: string | null;
  outcome: string | null;
  resolved_at: string | null;
}

// --- NPCs (Decision 68) ---

export interface Npc {
  id: string;
  game_id: string;
  npc_type: NpcType;
  name: string;
  description: string;
  terrain_origin: TerrainType | null;  // for survivor specialists
  bonus_type: string | null;           // e.g. "reach_cost_minus_2"
  is_active: boolean;
  spawned_epoch: number;
}

export interface NpcAction {
  id: string;
  npc_id: string;
  team_id: string;
  action_description: string;
  epoch: number;
  created_at: string;
}

export interface NpcReputation {
  id: string;
  team_id: string;
  npc_id: string;
  reputation_score: number;   // -100 to +100
}

// --- Vassals (Decision 63) ---

export interface VassalRelationship {
  id: string;
  game_id: string;
  overlord_team_id: string;
  vassal_team_id: string;
  tribute_percent: number;     // default 20
  start_epoch: number;
  end_epoch: number | null;
  is_active: boolean;
}

// --- Cultural Influence (Decision 67) ---

export interface CulturalArtifact {
  id: string;
  team_id: string;
  artifact_type: "mythology_creature" | "codex_entry" | "flag" | "festival";
  name: string;
  description: string;
  image_url: string | null;
  ci_value: number;            // cultural influence points contributed
  created_epoch: number;
  created_at: string;
}

// --- Civilization Identity (Decisions 76, 89, 91) ---

export interface CivilizationName {
  id: string;
  team_id: string;
  name: string;
  approved_by_dm: boolean;
  approved_at: string | null;
}

export interface CivilizationFlag {
  id: string;
  team_id: string;
  image_url: string;
  approved_by_dm: boolean;
  uploaded_at: string;
}

export interface CivilizationCodex {
  id: string;
  team_id: string;
  language_name: string | null;
  deity_name: string | null;
  core_belief: string | null;
  legacy_bonus_applied: boolean;
  created_epoch: number;
  updated_at: string;
}

// --- Events (Decision 33, 87, 92, 93) ---

export interface D20Event {
  id: string;
  game_id: string;
  epoch: number;
  team_id: string;
  roll: number;                // 1–20
  event_key: string;           // e.g. "plague", "gold_rush", "piracy"
  event_description: string;
  coastal_only: boolean;       // Decision 92: piracy events
  resource_impact: Record<string, number>; // JSONB: { "food": -10, "production": 5 }
  resolved: boolean;
  created_at: string;
}

export interface GameEvent {
  id: string;
  game_id: string;
  epoch: number;
  event_type: string;          // "depletion", "festival", "war_declared", etc.
  description: string;
  affected_team_ids: string[];
  metadata: Record<string, unknown>; // JSONB for flexible event data
  created_at: string;
}

// --- HeyGen Assets (Decision 82) ---

export interface HeygenAsset {
  id: string;
  game_id: string;
  asset_type: "narrator_clip" | "npc_clip";
  video_url: string;
  transcript: string | null;
  epoch: number | null;
  created_at: string;
}

// --- Projector (Decision 83) ---

export interface ProjectorState {
  id: string;
  game_id: string;
  current_view: "map" | "resolve" | "leaderboard" | "event" | "recap";
  active_team_spotlight: string | null;
  animation_queue: Record<string, unknown>[]; // JSONB array
  updated_at: string;
}

// --- DM Tools ---

export interface DailyRecap {
  id: string;
  game_id: string;
  epoch: number;
  recap_text: string;          // AI-generated narrative
  narration_video_url: string | null;
  created_at: string;
}

export interface PrivateMessage {
  id: string;
  game_id: string;
  from_team_id: string | null; // null = from DM
  to_team_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// --- Epoch Role Assignments (Decision 71) ---

export interface EpochRoleAssignment {
  id: string;
  team_id: string;
  epoch: number;
  clerk_user_id: string;
  role: RoleName;
  is_substitute: boolean;     // true if covering for absent teammate
  original_role: RoleName | null; // their normal role if substituting
}

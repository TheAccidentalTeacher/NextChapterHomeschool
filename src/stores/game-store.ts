import { create } from "zustand";
import type {
  Game,
  Team,
  TeamResource,
  TeamAsset,
  SubZone,
  EpochSubmission,
  TechResearch,
  RoundType,
} from "@/types/database";

// ============================================
// ClassCiv Client State Store (Zustand)
// Holds the current game session data
// ============================================

interface GameState {
  // --- Core game state ---
  game: Game | null;
  myTeam: Team | null;
  allTeams: Team[];
  myResources: TeamResource[];
  myAssets: TeamAsset[];
  myTechs: TechResearch[];
  subZones: SubZone[];
  submissions: EpochSubmission[];

  // --- UI state ---
  selectedSubZoneId: string | null;
  isSidebarOpen: boolean;
  activeRound: RoundType | null;
  isPurchaseMenuOpen: boolean;

  // --- Actions ---
  setGame: (game: Game) => void;
  setMyTeam: (team: Team) => void;
  setAllTeams: (teams: Team[]) => void;
  setMyResources: (resources: TeamResource[]) => void;
  setMyAssets: (assets: TeamAsset[]) => void;
  setMyTechs: (techs: TechResearch[]) => void;
  setSubZones: (zones: SubZone[]) => void;
  setSubmissions: (subs: EpochSubmission[]) => void;
  addAsset: (asset: TeamAsset) => void;
  selectSubZone: (id: string | null) => void;
  toggleSidebar: () => void;
  setActiveRound: (round: RoundType | null) => void;
  togglePurchaseMenu: () => void;
  reset: () => void;
}

const initialState = {
  game: null,
  myTeam: null,
  allTeams: [],
  myResources: [],
  myAssets: [],
  myTechs: [],
  subZones: [],
  submissions: [],
  selectedSubZoneId: null,
  isSidebarOpen: true,
  activeRound: null,
  isPurchaseMenuOpen: false,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setGame: (game) => set({ game }),
  setMyTeam: (team) => set({ myTeam: team }),
  setAllTeams: (teams) => set({ allTeams: teams }),
  setMyResources: (resources) => set({ myResources: resources }),
  setMyAssets: (assets) => set({ myAssets: assets }),
  setMyTechs: (techs) => set({ myTechs: techs }),
  setSubZones: (zones) => set({ subZones: zones }),
  setSubmissions: (subs) => set({ submissions: subs }),
  addAsset: (asset) => set((s) => ({ myAssets: [...s.myAssets, asset] })),
  selectSubZone: (id) => set({ selectedSubZoneId: id }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setActiveRound: (round) => set({ activeRound: round }),
  togglePurchaseMenu: () => set((s) => ({ isPurchaseMenuOpen: !s.isPurchaseMenuOpen })),
  reset: () => set(initialState),
}));

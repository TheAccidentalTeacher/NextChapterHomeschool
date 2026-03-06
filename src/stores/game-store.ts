import { create } from "zustand";
import type {
  Game,
  Team,
  TeamResource,
  SubZone,
  EpochSubmission,
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
  subZones: SubZone[];
  submissions: EpochSubmission[];

  // --- UI state ---
  selectedSubZoneId: string | null;
  isSidebarOpen: boolean;
  activeRound: RoundType | null;

  // --- Actions ---
  setGame: (game: Game) => void;
  setMyTeam: (team: Team) => void;
  setAllTeams: (teams: Team[]) => void;
  setMyResources: (resources: TeamResource[]) => void;
  setSubZones: (zones: SubZone[]) => void;
  setSubmissions: (subs: EpochSubmission[]) => void;
  selectSubZone: (id: string | null) => void;
  toggleSidebar: () => void;
  setActiveRound: (round: RoundType | null) => void;
  reset: () => void;
}

const initialState = {
  game: null,
  myTeam: null,
  allTeams: [],
  myResources: [],
  subZones: [],
  submissions: [],
  selectedSubZoneId: null,
  isSidebarOpen: true,
  activeRound: null,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setGame: (game) => set({ game }),
  setMyTeam: (team) => set({ myTeam: team }),
  setAllTeams: (teams) => set({ allTeams: teams }),
  setMyResources: (resources) => set({ myResources: resources }),
  setSubZones: (zones) => set({ subZones: zones }),
  setSubmissions: (subs) => set({ submissions: subs }),
  selectSubZone: (id) => set({ selectedSubZoneId: id }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setActiveRound: (round) => set({ activeRound: round }),
  reset: () => set(initialState),
}));

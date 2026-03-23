// ============================================
// StudentDashboardClient — Main student game view
// Decision 70: Five specialized roles per team
// Decision 27: Turn-based round submission flow
//
// This is the primary client component for logged-in students.
// It fetches team info, epoch state, resources, and questions,
// then renders the appropriate role panel (Architect, Merchant,
// Diplomat, Lorekeeper, Warlord) based on the student's
// assigned role. Also handles:
//   - CivNamePrompt (first-visit naming flow)
//   - IntelDrop / GlobalEvent modals
//   - Resource routing panel for the leading role
//   - Round submission + justification
//   - Real-time epoch state sync via polling
// ============================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { SignOutButton } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import TopBar from "@/components/dashboard/TopBar";
import ResourceBar from "@/components/dashboard/ResourceBar";
import PopulationBar from "@/components/dashboard/PopulationBar";
import LoginRecapCard from "@/components/dashboard/LoginRecapCard";
import ArchitectPanel from "@/components/dashboard/ArchitectPanel";
import MerchantPanel from "@/components/dashboard/MerchantPanel";
import DiplomatPanel from "@/components/dashboard/DiplomatPanel";
import LorekeeperPanel from "@/components/dashboard/LorekeeperPanel";
import WarlordPanel from "@/components/dashboard/WarlordPanel";
import RoundSubmissionCard from "@/components/submission/RoundSubmissionCard";
import SubmissionStatus from "@/components/submission/SubmissionStatus";
import RoutingPanel from "@/components/game/RoutingPanel";
import TechTree from "@/components/game/TechTree";
import CityPanel from "@/components/game/CityPanel";
import IntelDropModal from "@/components/modals/IntelDropModal";
import GlobalEventModal from "@/components/modals/GlobalEventModal";
import CivNamePrompt from "@/components/student/CivNamePrompt";
import ClientErrorBoundary from "@/components/ClientErrorBoundary";
import { getLeadRole, isActionStep, isRoutingStep, STEP_TO_ROUND, STEP_TO_RESOURCE, type EpochStep } from "@/lib/game/epoch-machine";
import type { RoleName, ResourceType } from "@/types/database";
import { debug } from "@/lib/debug";
import type { TeamRegion, SubZoneData, MapMarker } from "@/components/map/GameMap";

const TEAM_COLOR_PALETTE = [
  "#e63946", "#2a9d8f", "#e9c46a", "#f4a261",
  "#457b9d", "#a8dadc", "#6a4c93", "#06d6a0",
  "#118ab2", "#ffd166", "#ef476f", "#a7c957",
];

const GameMap = dynamic(() => import("@/components/map/GameMap"), { ssr: false });

interface TeamInfo {
  id: string;
  game_id: string;
  name: string;
  civilization_name: string | null;
  region_id: number;
  population: number;
  is_in_dark_age: boolean;
  war_exhaustion_level: number;
}

interface MemberInfo {
  assigned_role: RoleName;
  secondary_role?: string | null;
  cover_info?: {
    is_substitute: true;
    covering_role: string;
    original_role: string;
  } | null;
}

interface TeammateInfo {
  id: string;
  display_name: string;
  assigned_role: string;
  secondary_role: string | null;
  is_absent: boolean;
  is_self: boolean;
}

interface EpochState {
  current_epoch: number;
  current_step: EpochStep;
  is_paused: boolean;
  current_round: string;
  math_gate_enabled: boolean;
  math_gate_difficulty: string;
  class_period: string;
}

interface Props {
  userId: string;
  displayName: string;
}

const ROLE_BADGE: Record<string, string> = {
  architect: "border-amber-700 bg-amber-950/60 text-amber-200",
  merchant:  "border-emerald-700 bg-emerald-950/60 text-emerald-200",
  diplomat:  "border-sky-700 bg-sky-950/60 text-sky-200",
  lorekeeper:"border-purple-700 bg-purple-950/60 text-purple-200",
  warlord:   "border-red-700 bg-red-950/60 text-red-200",
};
const ROLE_EMOJI: Record<string, string> = {
  architect: "🏗️", merchant: "🪙", diplomat: "🕊️", lorekeeper: "📜", warlord: "⚔️",
};

function TeammatesPanel({ teammates }: { teammates: TeammateInfo[] }) {
  if (teammates.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-800 bg-stone-900/40 px-4 py-3">
      <span className="text-xs text-stone-500 shrink-0">Team:</span>
      {teammates.map((tm) => (
        <div
          key={tm.id}
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
            tm.is_self
              ? "border-stone-500 bg-stone-700/60 text-white"
              : tm.is_absent
              ? "border-stone-700 bg-stone-900 text-stone-500 opacity-50"
              : (ROLE_BADGE[tm.assigned_role] ?? "border-stone-700 text-stone-300")
          }`}
        >
          <span>{ROLE_EMOJI[tm.assigned_role] ?? "🎭"}</span>
          {tm.secondary_role && !tm.is_absent && (
            <span className="opacity-70">{ROLE_EMOJI[tm.secondary_role] ?? "🎭"}</span>
          )}
          <span>{tm.display_name}</span>
          {tm.is_self && <span className="text-stone-400 font-normal"> · you</span>}
          {!tm.is_self && !tm.is_absent && (
            <span className="capitalize font-normal opacity-70">
              {" · "}{tm.assigned_role}{tm.secondary_role ? ` + ${tm.secondary_role}` : ""}
            </span>
          )}
          {tm.is_absent && !tm.is_self && (
            <span className="font-normal"> · absent</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function StudentDashboardClient({ userId, displayName }: Props) {
  debug.render("StudentDashboardClient mounted", { userId, displayName });
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [role, setRole] = useState<RoleName | null>(null);
  const [secondaryRole, setSecondaryRole] = useState<RoleName | null>(null);
  const [coverInfo, setCoverInfo] = useState<{ covering_role: string; original_role: string } | null>(null);
  const [epoch, setEpoch] = useState<EpochState | null>(null);
  const [resources, setResources] = useState<Record<ResourceType, number>>({
    production: 0,
    reach: 0,
    legacy: 0,
    resilience: 0,
    food: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"action" | "map" | "role" | "tech">("action");
  const [unlockedTechs, setUnlockedTechs] = useState<string[]>([]);
  const [activeResearchId, setActiveResearchId] = useState<string | null>(null);
  const [legacyInvested, setLegacyInvested] = useState<Record<string, number>>({});
  // Role-switcher: lets one student submit for any role during testing
  const [overrideRole, setOverrideRole] = useState<RoleName | null>(null);
  const [teammates, setTeammates] = useState<TeammateInfo[]>([]);
  const [allTeamRegions, setAllTeamRegions] = useState<TeamRegion[]>([]);
  const [subZones, setSubZones] = useState<SubZoneData[]>([]);
  const [selectedSubZone, setSelectedSubZone] = useState<SubZoneData | null>(null);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  // Live question from the bank (Decision 27)
  const [currentQuestion, setCurrentQuestion] = useState<{
    id: string;
    promptText: string;
    options: Array<{ id: string; label: string; description?: string }>;
    allowFreeText: boolean;
    historicalContext: string;
    scaffolding6th: string;
    scaffolding78: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    debug.auth("Fetching student data...", { userId });
    try {
      // Get team info
      const meRes = await fetch("/api/me/team");
      if (!meRes.ok) {
        debug.error("Failed to fetch /api/me/team", { status: meRes.status });
        setLoading(false);
        return;
      }
      const meData = await meRes.json();
      const t = meData.team;
      const m: MemberInfo = meData.member;
      if (!t) {
        debug.auth("No team found for student — showing CivNamePrompt or empty state", meData);
        setLoading(false);
        return;
      }

      debug.auth("Student data loaded", { team: t.name, role: m?.assigned_role, gameId: t.game_id });
      setTeam(t);
      setRole(m?.assigned_role ?? null);
      setSecondaryRole((m?.secondary_role as RoleName | null | undefined) ?? null);
      setTeammates(meData.teammates ?? []);
      // Surface cover assignment if this student is substituting for an absent teammate
      if (m?.cover_info?.is_substitute) {
        setCoverInfo({
          covering_role: m.cover_info.covering_role,
          original_role: m.cover_info.original_role,
        });
      } else {
        setCoverInfo(null);
      }

      // Get epoch state
      const epochRes = await fetch(`/api/games/${t.game_id}/epoch/state`);
      if (epochRes.ok) {
        const ed = await epochRes.json();
        debug.epoch("Epoch state loaded", ed);
        setEpoch({
          current_epoch: ed.current_epoch ?? 1,
          current_step: ed.current_step ?? "login",
          is_paused: ed.is_paused ?? false,
          current_round: ed.current_round ?? "BUILD",
          math_gate_enabled: ed.math_gate_enabled ?? false,
          math_gate_difficulty: ed.math_gate_difficulty ?? "multiply",
          class_period: ed.class_period ?? "6th",
        });
      }

      // Get resources
      const resRes = await fetch(`/api/games/${t.game_id}/resources?team_id=${t.id}`);
      if (resRes.ok) {
        const rd = await resRes.json();
        if (rd.resources) {
          debug.resource("Resources loaded", rd.resources);
          setResources(rd.resources);
        }
      }

      // Get tech research state
      const techRes = await fetch(`/api/games/${t.game_id}/research?team_id=${t.id}`);
      if (techRes.ok) {
        const td = await techRes.json();
        setUnlockedTechs(td.completedTechIds ?? []);
        setActiveResearchId(td.activeResearchId ?? null);
        setLegacyInvested(td.legacyInvested ?? {});
      }

      // Get all team region assignments for map rendering
      const mapRes = await fetch(`/api/games/${t.game_id}/map-data`);
      if (mapRes.ok) {
        const md = await mapRes.json();
        const teams: Array<{ id: string; name: string; civilization_name: string | null; region_id: number }> =
          md.teams ?? [];
        setAllTeamRegions(
          teams.map((tm, i) => ({
            teamId: tm.id,
            regionId: tm.region_id,
            color: TEAM_COLOR_PALETTE[i % TEAM_COLOR_PALETTE.length],
            name: tm.civilization_name ?? tm.name,
          }))
        );
      }

      // Get sub-zones for map interactivity + CityPanel
      const szRes = await fetch(
        `/api/games/${t.game_id}/sub-zones?region_id=${t.region_id}`
      );
      if (szRes.ok) {
        const szd = await szRes.json();
        setSubZones(szd.subZones ?? []);
      }

      // Get unit markers for the map
      const unitsRes = await fetch(
        `/api/games/${t.game_id}/units?team_id=${t.id}`
      );
      if (unitsRes.ok) {
        const ud = await unitsRes.json();
        setMapMarkers(ud.markers ?? []);
      }
    } catch (err) {
      debug.error("StudentDashboard fetchData failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Fetch contextual question whenever team, role, or round changes (Decision 27)
  useEffect(() => {
    if (!team || !role) return;
    const effectiveRoleForQ = overrideRole ?? role;
    const stepNow = epoch?.current_step ?? "login";
    const roundNow = STEP_TO_ROUND[stepNow] ?? epoch?.current_round ?? "BUILD";
    if (!isActionStep(stepNow)) return; // only fetch during action phases

    async function fetchQuestion() {
      try {
        const res = await fetch(
          `/api/games/${team!.game_id}/questions?team_id=${team!.id}&round=${roundNow}&role=${effectiveRoleForQ}`
        );
        if (res.ok) {
          const data = await res.json();
          setCurrentQuestion(data.question ?? null);
        }
      } catch {
        // question fetch failure is non-critical — card falls back to placeholder
      }
    }
    fetchQuestion();
  }, [team, role, overrideRole, epoch?.current_step, epoch?.current_round]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-stone-500">Loading your civilization…</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex justify-end">
          <SignOutButton>
            <button
              type="button"
              className="rounded-lg border border-stone-700 bg-stone-900/70 px-3 py-1.5 text-sm text-stone-300 transition hover:border-red-700 hover:bg-red-900/20 hover:text-red-300"
            >
              ↩ Log out
            </button>
          </SignOutButton>
        </div>
        <h1 className="text-2xl font-bold text-amber-400">
          Welcome, {displayName}
        </h1>
        <p className="text-stone-400">
          You haven&apos;t been assigned to a team yet. Ask your teacher to add you.
        </p>
        <CivNamePrompt />
      </div>
    );
  }

  const currentStep = epoch?.current_step ?? "login";
  const currentEpoch = epoch?.current_epoch ?? 1;
  const currentRound = STEP_TO_ROUND[currentStep] ?? epoch?.current_round ?? "BUILD";
  const isAction = isActionStep(currentStep);
  const isRouting = isRoutingStep(currentStep);
  const resourceType = (STEP_TO_RESOURCE[currentStep] ?? "production") as ResourceType;
  const leadRole = getLeadRole(currentStep) as RoleName | null;

  const handleSubZoneClick = (sz: SubZoneData) => {
    setSelectedSubZone(sz);
  };

  const ROLES: RoleName[] = ["architect", "merchant", "diplomat", "lorekeeper", "warlord"];
  const ROLE_ICONS: Record<RoleName, string> = {
    architect: "🏛", merchant: "🪙", diplomat: "🕊", lorekeeper: "📖", warlord: "⚔",
  };
  const safeRole: RoleName = role && ROLES.includes(role) ? role : "architect";
  // Covering students use the absent student's role so their submission counts for that role.
  // Debug override still takes highest priority.
  const effectiveRole = overrideRole ?? (coverInfo?.covering_role as RoleName | undefined) ?? safeRole;
  const routeEligibleRoles = [safeRole, secondaryRole, coverInfo?.covering_role as RoleName | undefined].filter(Boolean);
  const canRouteThisStep = !!leadRole && routeEligibleRoles.includes(leadRole);

  const rolePanelMap: Record<RoleName, React.ReactNode> = {
    architect: (
      <ArchitectPanel
        teamBuildings={subZones
          .filter((z) => z.controlled_by_team_id === team.id)
          .flatMap((z) =>
            (z.buildings ?? []).map((b) => ({
              key: b,
              subZone: z.id,
              subZoneName: z.settlement_name ?? z.name,
              isActive: true,
            }))
          )}
        resources={resources}
        ownedSubZones={subZones
          .filter((z) => z.controlled_by_team_id === team.id)
          .map((z) => ({
            id: z.db_id ?? z.id,
            name: z.name,
            settlementName: z.settlement_name ?? null,
          }))}
        unlockedTechs={unlockedTechs}
        hasBuilder={mapMarkers.some(
          (m) => m.teamId === team.id && m.type === "builder"
        )}
        ownedAssetKeys={subZones
          .filter((z) => z.controlled_by_team_id === team.id)
          .flatMap((z) => z.buildings ?? [])}
      />
    ),
    merchant: (
      <MerchantPanel
        reachAvailable={resources.reach}
        tradeOffers={[]}
        activeAgreements={[]}
        isEmbargoActive={false}
        unlockedTechs={unlockedTechs}
      />
    ),
    diplomat: (
      <DiplomatPanel
        alliances={[]}
        laws={[]}
        pendingProposals={[]}
        warExhaustion={team.war_exhaustion_level}
        unlockedTechs={unlockedTechs}
      />
    ),
    lorekeeper: (
      <LorekeeperPanel
        creatures={[]}
        codex={null}
        hasWritingTech={unlockedTechs.includes("writing")}
        ciScore={0}
        ciSpread={0}
        flagUrl={null}
      />
    ),
    warlord: (
      <WarlordPanel
        units={mapMarkers
          .filter((m) => m.teamId === team.id && ["scout","soldier","merchant","builder"].includes(m.type))
          .map((m) => ({
            type: m.type as "scout" | "soldier" | "merchant" | "builder",
            count: m.count,
            subZone: m.subZoneId,
            health: 100,
          }))}
        armyStrength={mapMarkers
          .filter((m) => m.teamId === team.id && m.type === "soldier")
          .reduce((sum, m) => sum + m.count, 0)}
        resilienceAvailable={resources.resilience}
        warExhaustion={team.war_exhaustion_level}
        defenseStatus={[]}
        unlockedTechs={unlockedTechs}
      />
    ),
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <ClientErrorBoundary
        fallback={
          <div className="rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-3 text-sm text-stone-300">
            {team.civilization_name ?? team.name} · {safeRole} · Epoch {currentEpoch}
          </div>
        }
      >
        <TopBar
          teamName={team.name}
          civName={team.civilization_name}
          role={safeRole}
          epoch={currentEpoch}
          step={currentStep}
          isPaused={epoch?.is_paused ?? false}
          timerRemaining={0}
          resources={[
            { type: "production" as ResourceType, amount: resources.production },
            { type: "reach" as ResourceType, amount: resources.reach },
            { type: "legacy" as ResourceType, amount: resources.legacy },
            { type: "resilience" as ResourceType, amount: resources.resilience },
            { type: "food" as ResourceType, amount: resources.food },
          ]}
          population={team.population}
          ciScore={0}
        />
      </ClientErrorBoundary>

      <div className="flex justify-end">
        <SignOutButton>
          <button
            type="button"
            className="rounded-lg border border-stone-700 bg-stone-900/70 px-3 py-1.5 text-sm text-stone-300 transition hover:border-red-700 hover:bg-red-900/20 hover:text-red-300"
          >
            ↩ Log out
          </button>
        </SignOutButton>
      </div>

      {/* Secondary role badge — shown when this student holds two roles */}
      {secondaryRole && !coverInfo && (
        <div className="flex items-center gap-3 rounded-lg border border-purple-800/50 bg-purple-900/20 px-4 py-2.5">
          <span className="text-xl">{ROLE_EMOJI[secondaryRole] ?? "🎭"}</span>
          <div>
            <p className="text-sm font-semibold text-purple-300">
              You hold two roles this epoch: {role} + {secondaryRole}
            </p>
            <p className="text-xs text-purple-500/80">
              Complete both role submissions when it&apos;s your turn. Your primary submission is as {role}.
            </p>
          </div>
        </div>
      )}

      {/* Covering student banner — shown only when this student is substituting for an absent teammate */}
      {coverInfo && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-700/50 bg-amber-900/20 px-4 py-2.5">
          <span className="text-xl">🔄</span>
          <div>
            <p className="text-sm font-semibold text-amber-300">
              Covering {coverInfo.covering_role.charAt(0).toUpperCase() + coverInfo.covering_role.slice(1)} role this epoch
            </p>
            <p className="text-xs text-amber-500/80">
              A teammate is absent — you&apos;re stepping in as {coverInfo.covering_role}. Your submission will count for them.
              Your original role is {coverInfo.original_role}.
            </p>
          </div>
        </div>
      )}

      {/* Role switcher — dev/testing only, hidden in production */}
      {process.env.NEXT_PUBLIC_DEBUG === "true" && (        <div className="flex items-center gap-1 rounded-lg bg-stone-900/60 p-1">
          <span className="shrink-0 px-1 text-xs text-violet-500">🧪</span>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setOverrideRole(effectiveRole === r && r !== role ? null : r)}
              className={`flex-1 rounded px-2 py-1 text-xs font-medium capitalize transition ${
                effectiveRole === r
                  ? "bg-amber-800/50 text-amber-300 ring-1 ring-amber-600/40"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              {ROLE_ICONS[r]} {r}{r === role ? " ·" : ""}
            </button>
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg bg-stone-900/50 p-1">
        {(["action", "map", "role", "tech"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm capitalize transition ${
              tab === t
                ? "bg-stone-700 text-white"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            {t === "action" ? "📝 Action" : t === "map" ? "🗺️ Map" : t === "tech" ? "🔬 Tech" : `${effectiveRole ? "🎭 " + effectiveRole : "🎭 Role"}`}
          </button>
        ))}
      </div>

      {/* Modals */}
      {team && (
        <ClientErrorBoundary fallback={null}>
          <>
          <IntelDropModal gameId={team.game_id} teamId={team.id} />
          <GlobalEventModal gameId={team.game_id} epoch={currentEpoch} />
          </>
        </ClientErrorBoundary>
      )}

      {/* Tab Content */}
      {tab === "action" && (
        <ClientErrorBoundary
          fallback={
            <div className="rounded-xl border border-amber-800/40 bg-amber-900/10 p-4 text-sm text-amber-200">
              Your team dashboard hit a display problem, but your login worked. Refresh once. If it happens again, raise your hand and stay on this screen.
            </div>
          }
        >
        <div className="space-y-4">
          {/* Teammates Panel — always visible */}
          <ClientErrorBoundary fallback={null}>
            <TeammatesPanel teammates={teammates} />
          </ClientErrorBoundary>

          {/* Login Recap */}
          {currentStep === "login" && (
            <ClientErrorBoundary fallback={null}>
              <LoginRecapCard
                gameId={team.game_id}
                teamId={team.id}
                epoch={currentEpoch}
              />
            </ClientErrorBoundary>
          )}

          {/* Submission or Routing */}
          {isAction && effectiveRole && (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ClientErrorBoundary
                  fallback={
                    <div className="rounded-xl border border-red-800/40 bg-red-900/10 p-4 text-sm text-red-200">
                      The question card failed to load. Refresh once, then tell your teacher if it happens again.
                    </div>
                  }
                >
                  <RoundSubmissionCard
                    gameId={team.game_id}
                    teamId={team.id}
                    epoch={currentEpoch}
                    roundType={currentRound}
                    role={effectiveRole}
                    promptText={
                      currentQuestion?.promptText ??
                      "What strategic decision will your civilization make this round?"
                    }
                    options={
                      currentQuestion?.options ?? [
                        { id: "a", label: "Focus on growth and expansion" },
                        { id: "b", label: "Invest in infrastructure" },
                        { id: "c", label: "Strengthen defenses" },
                      ]
                    }
                    historicalContext={
                      currentQuestion?.historicalContext ??
                      "Your civilization faces a pivotal moment."
                    }
                    allowFreeText={currentQuestion?.allowFreeText ?? true}
                    grade={(epoch?.class_period === "6th" ? "6th" : "7_8th") as "6th" | "7_8th"}
                  />
                </ClientErrorBoundary>
              </div>
              <div>
                <ClientErrorBoundary fallback={null}>
                  <SubmissionStatus
                    gameId={team.game_id}
                    teamId={team.id}
                    currentRound={currentRound}
                  />
                </ClientErrorBoundary>
              </div>
            </div>
          )}

          {isRouting && effectiveRole && (
            <ClientErrorBoundary fallback={null}>
              {canRouteThisStep ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-amber-700/40 bg-amber-900/10 px-4 py-3">
                    <p className="text-sm font-semibold text-amber-300">
                      {leadRole?.charAt(0).toUpperCase()}{leadRole?.slice(1)}: route your team&apos;s {resourceType} now.
                    </p>
                    <p className="text-xs text-amber-200/80">
                      Use the controls below to decide how your team will use the resources earned this round.
                    </p>
                  </div>
                  <RoutingPanel
                    gameId={team.game_id}
                    teamId={team.id}
                    roundType={currentRound}
                    totalEarned={resources[resourceType] ?? 0}
                    resourceType={resourceType}
                    onComplete={fetchData}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-5 text-center">
                  <p className="text-sm font-semibold text-stone-200">
                    Waiting for the {leadRole ?? "lead"} to route {resourceType}.
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    You&apos;re done for this phase. Stay with your team and get ready for the next step.
                  </p>
                </div>
              )}
            </ClientErrorBoundary>
          )}

          {/* Resources display */}
          <ClientErrorBoundary fallback={null}>
            <div className="grid gap-4 md:grid-cols-2">
              <ResourceBar
                resources={resources}
                population={team.population}
              />
              <PopulationBar
                population={team.population}
                foodStored={resources.food}
                growthRate={resources.food > team.population ? 1 : resources.food < team.population ? -1 : 0}
              />
            </div>
          </ClientErrorBoundary>
        </div>
        </ClientErrorBoundary>
      )}

      {tab === "map" && (
        <div className="space-y-0">
          <div
            className={`overflow-hidden border border-stone-800 transition-all duration-200 ${
              selectedSubZone ? "rounded-t-xl" : "rounded-xl"
            }`}
          >
            <div
              className={`transition-all duration-200 ${
                selectedSubZone ? "h-[300px]" : "h-[500px]"
              }`}
            >
              <GameMap
                subZones={subZones}
                teamColors={allTeamRegions.map((tr) => ({ teamId: tr.teamId, color: tr.color, name: tr.name }))}
                teamRegions={allTeamRegions}
                focusRegionId={team.region_id}
                fogState={[]}
                markers={mapMarkers}
                showFog={false}
                onSubZoneClick={handleSubZoneClick}
              />
            </div>
          </div>
          {selectedSubZone && (
            <CityPanel
              subZone={selectedSubZone}
              teamId={team.id}
              regionId={team.region_id}
              role={effectiveRole ?? "architect"}
              allTeams={allTeamRegions.map((tr) => ({
                id: tr.teamId,
                name: tr.name,
                color: tr.color,
              }))}
              gameId={team.game_id}
              epoch={currentEpoch}
              resources={resources}
              hasBuilder={false}
              unlockedTechs={unlockedTechs}
              mathGateEnabled={epoch?.math_gate_enabled ?? false}
              mathGateDifficulty={epoch?.math_gate_difficulty ?? "multiply"}
              onClose={() => setSelectedSubZone(null)}
              onBuildSuccess={async () => {
                // Re-fetch sub-zones so buildings appear immediately
                const szRes = await fetch(
                  `/api/games/${team.game_id}/sub-zones?region_id=${team.region_id}`
                );
                if (szRes.ok) {
                  const szd = await szRes.json();
                  const fresh: SubZoneData[] = szd.subZones ?? [];
                  setSubZones(fresh);
                  // Also update selectedSubZone so the panel reflects new buildings
                  const updated = fresh.find((z) => z.id === selectedSubZone.id);
                  if (updated) setSelectedSubZone(updated);
                }
                // Refresh resources since production/reach/resilience was spent
                const resRes = await fetch(
                  `/api/games/${team.game_id}/resources?team_id=${team.id}`
                );
                if (resRes.ok) {
                  const rd = await resRes.json();
                  if (rd.resources) setResources(rd.resources);
                }
                // Refresh unit markers so newly deployed units appear on map
                const unitsRes = await fetch(
                  `/api/games/${team.game_id}/units?team_id=${team.id}`
                );
                if (unitsRes.ok) {
                  const ud = await unitsRes.json();
                  setMapMarkers(ud.markers ?? []);
                }
              }}
            />
          )}
        </div>
      )}

      {tab === "role" && effectiveRole && rolePanelMap[effectiveRole]}

      {tab === "tech" && team && (
        <TechTree
          completedTechIds={unlockedTechs}
          activeResearchId={activeResearchId}
          legacyInvested={legacyInvested}
          onSelectResearch={async (techId) => {
            try {
              const res = await fetch(`/api/games/${team.game_id}/research`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "select",
                  team_id: team.id,
                  tech_id: techId,
                }),
              });
              if (res.ok) {
                setActiveResearchId(techId);
                fetchData();
              }
            } catch (err) {
              debug.error("Failed to select research", err);
            }
          }}
          onInvestResearch={async (amount) => {
            try {
              const res = await fetch(`/api/games/${team.game_id}/research`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "invest",
                  team_id: team.id,
                  amount,
                }),
              });
              if (res.ok) fetchData();
            } catch (err) {
              debug.error("Failed to invest in research", err);
            }
          }}
        />
      )}
    </div>
  );
}

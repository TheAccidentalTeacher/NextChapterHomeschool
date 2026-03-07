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
import IntelDropModal from "@/components/modals/IntelDropModal";
import GlobalEventModal from "@/components/modals/GlobalEventModal";
import CivNamePrompt from "@/components/student/CivNamePrompt";
import { isActionStep, isRoutingStep, STEP_TO_ROUND, STEP_TO_RESOURCE, type EpochStep } from "@/lib/game/epoch-machine";
import type { RoleName, ResourceType } from "@/types/database";
import { debug } from "@/lib/debug";

const GameMap = dynamic(() => import("@/components/map/GameMap"), { ssr: false });

interface TeamInfo {
  id: string;
  game_id: string;
  name: string;
  civilization_name: string | null;
  population: number;
  is_in_dark_age: boolean;
  war_exhaustion_level: number;
}

interface MemberInfo {
  assigned_role: RoleName;
}

interface EpochState {
  current_epoch: number;
  current_step: EpochStep;
  is_paused: boolean;
  current_round: string;
}

interface Props {
  userId: string;
  displayName: string;
}

export default function StudentDashboardClient({ userId, displayName }: Props) {
  debug.render("StudentDashboardClient mounted", { userId, displayName });
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [role, setRole] = useState<RoleName | null>(null);
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

  const rolePanelMap: Record<RoleName, React.ReactNode> = {
    architect: (
      <ArchitectPanel
        teamBuildings={[]}
        resources={resources}
        ownedSubZones={[]}
        unlockedTechs={unlockedTechs}
        hasBuilder={false}
        ownedAssetKeys={[]}
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
        units={[]}
        armyStrength={0}
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
      <TopBar
        teamName={team.name}
        civName={team.civilization_name}
        role={role ?? "architect"}
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
            {t === "action" ? "📝 Action" : t === "map" ? "🗺️ Map" : t === "tech" ? "🔬 Tech" : `${role ? "🎭 " + role : "🎭 Role"}`}
          </button>
        ))}
      </div>

      {/* Modals */}
      {team && (
        <>
          <IntelDropModal gameId={team.game_id} teamId={team.id} />
          <GlobalEventModal gameId={team.game_id} epoch={currentEpoch} />
        </>
      )}

      {/* Tab Content */}
      {tab === "action" && (
        <div className="space-y-4">
          {/* Login Recap */}
          {currentStep === "login" && (
            <LoginRecapCard
              gameId={team.game_id}
              teamId={team.id}
              epoch={currentEpoch}
            />
          )}

          {/* Submission or Routing */}
          {isAction && role && (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <RoundSubmissionCard
                  gameId={team.game_id}
                  teamId={team.id}
                  epoch={currentEpoch}
                  roundType={currentRound}
                  role={role}
                  promptText="What strategic decision will your civilization make this round?"
                  options={[
                    { id: "a", label: "Focus on growth and expansion" },
                    { id: "b", label: "Invest in infrastructure" },
                    { id: "c", label: "Strengthen defenses" },
                  ]}
                  historicalContext="Your civilization faces a pivotal moment."
                  allowFreeText={true}
                  grade="7_8th"
                />
              </div>
              <div>
                <SubmissionStatus
                  gameId={team.game_id}
                  teamId={team.id}
                  currentRound={currentRound}
                />
              </div>
            </div>
          )}

          {isRouting && role && (
            <RoutingPanel
              gameId={team.game_id}
              teamId={team.id}
              roundType={currentRound}
              totalEarned={10}
              resourceType={resourceType}
              onComplete={fetchData}
            />
          )}

          {/* Resources display */}
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
        </div>
      )}

      {tab === "map" && (
        <div className="overflow-hidden rounded-xl border border-stone-800">
          <div className="h-[500px]">
            <GameMap
              subZones={[]}
              teamColors={[]}
              fogState={[]}
              markers={[]}
              showFog={true}
            />
          </div>
        </div>
      )}

      {tab === "role" && role && rolePanelMap[role]}

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
        />
      )}
    </div>
  );
}

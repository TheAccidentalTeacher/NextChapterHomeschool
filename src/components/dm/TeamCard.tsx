import { ROLES, REGIONS } from "@/lib/constants";
import type { RoleName } from "@/types/database";

interface TeamMember {
  id: string;
  display_name: string;
  assigned_role: RoleName;
  secondary_role?: RoleName | null;
  is_absent: boolean;
}

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    civilization_name: string | null;
    region_id: number;
    population: number;
    team_members?: TeamMember[];
  };
  gameId: string;
  onRoleChange: (memberId: string, role: RoleName) => void;
  onAbsenceToggle: (memberId: string, absent: boolean) => void;
  onRemoveStudent: (memberId: string) => void;
}

export default function TeamCard({
  team,
  onRoleChange,
  onAbsenceToggle,
  onRemoveStudent,
}: TeamCardProps) {
  const region = REGIONS.find((r) => r.id === team.region_id);
  const members = team.team_members ?? [];

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-5">
      {/* Team Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-stone-200">{team.name}</h3>
          {team.civilization_name && (
            <p className="text-sm text-amber-400">
              🏛️ {team.civilization_name}
            </p>
          )}
          <p className="mt-1 text-xs text-stone-500">
            {region?.label ?? `Region ${team.region_id}`} · Pop:{" "}
            {team.population}
          </p>
        </div>
        <span className="rounded-full bg-stone-800 px-2 py-0.5 text-xs text-stone-400">
          {members.length}/5
        </span>
      </div>

      {/* Members List */}
      <div className="mt-4 space-y-2">
        {members.length === 0 ? (
          <p className="text-xs text-stone-600 italic">
            No students assigned yet
          </p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                member.is_absent
                  ? "border-orange-800 bg-orange-950/30"
                  : "border-stone-800 bg-stone-900/30"
              }`}
            >
              {/* Name */}
              <span
                className={`flex-1 text-sm ${
                  member.is_absent
                    ? "text-orange-400 line-through"
                    : "text-stone-300"
                }`}
              >
                {member.display_name}
                {member.secondary_role && !member.is_absent && (
                  <span className="ml-1 rounded bg-purple-900/40 px-1 py-0.5 text-xs text-purple-400">
                    +{member.secondary_role}
                  </span>
                )}
              </span>

              {/* Role Selector */}
              <select
                value={member.assigned_role}
                onChange={(e) =>
                  onRoleChange(member.id, e.target.value as RoleName)
                }
                className="rounded border border-stone-700 bg-stone-800 px-2 py-1 text-xs text-stone-300 focus:border-red-500 focus:outline-none"
              >
                {Object.entries(ROLES).map(([key, role]) => (
                  <option key={key} value={key}>
                    {role.emoji} {role.label}
                  </option>
                ))}
              </select>

              {/* Absent Toggle */}
              <button
                type="button"
                onClick={() => onAbsenceToggle(member.id, !member.is_absent)}
                className={`rounded px-2 py-1 text-xs transition ${
                  member.is_absent
                    ? "bg-orange-800 text-orange-200"
                    : "bg-stone-800 text-stone-500 hover:bg-stone-700"
                }`}
                title={member.is_absent ? "Mark present" : "Mark absent"}
              >
                {member.is_absent ? "Absent" : "Present"}
              </button>

              {/* Remove */}
              <button
                type="button"
                onClick={() => onRemoveStudent(member.id)}
                className="rounded px-1.5 py-1 text-xs text-stone-600 transition hover:bg-red-900/30 hover:text-red-400"
                title="Remove from team"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// ClassCiv Contact Engine
// Decisions 54, 56, 57: Auto-fire on proximity,
// DM override, contact window toggle
// ============================================

export interface ContactEvent {
  teamAId: string;
  teamBId: string;
  triggerType: "proximity" | "dm_override";
  epoch: number;
  subZoneId: string | null;
}

/**
 * Check if two teams are in contact range.
 * Adjacent sub-zones = in contact.
 * Extended by Celestial Navigation / Astronomy tech.
 */
export function checkProximity(
  teamASubZones: string[],
  teamBSubZones: string[],
  adjacencyMap: Record<string, string[]>,
  teamATechs: string[]
): boolean {
  // Base range: adjacent sub-zones
  for (const szA of teamASubZones) {
    const neighbors = adjacencyMap[szA] ?? [];
    for (const szB of teamBSubZones) {
      if (neighbors.includes(szB)) {
        return true;
      }
    }
  }

  // Extended range with Celestial Navigation (2-hop)
  if (teamATechs.includes("celestial_navigation")) {
    for (const szA of teamASubZones) {
      const neighbors1 = adjacencyMap[szA] ?? [];
      for (const n1 of neighbors1) {
        const neighbors2 = adjacencyMap[n1] ?? [];
        for (const szB of teamBSubZones) {
          if (neighbors2.includes(szB)) {
            return true;
          }
        }
      }
    }
  }

  // Extended range with Astronomy (3-hop)
  if (teamATechs.includes("astronomy")) {
    for (const szA of teamASubZones) {
      const neighbors1 = adjacencyMap[szA] ?? [];
      for (const n1 of neighbors1) {
        const neighbors2 = adjacencyMap[n1] ?? [];
        for (const n2 of neighbors2) {
          const neighbors3 = adjacencyMap[n2] ?? [];
          for (const szB of teamBSubZones) {
            if (neighbors3.includes(szB)) {
              return true;
            }
          }
        }
      }
    }
  }

  return false;
}

/**
 * Detect all new contacts for a given epoch.
 * Returns pairs of team IDs that are newly in contact.
 */
export function detectNewContacts(
  teams: { id: string; subZones: string[]; techs: string[] }[],
  existingContacts: { teamAId: string; teamBId: string }[],
  adjacencyMap: Record<string, string[]>
): { teamAId: string; teamBId: string }[] {
  const newContacts: { teamAId: string; teamBId: string }[] = [];

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const tA = teams[i];
      const tB = teams[j];

      // Already contacted?
      const alreadyContacted = existingContacts.some(
        (c) =>
          (c.teamAId === tA.id && c.teamBId === tB.id) ||
          (c.teamAId === tB.id && c.teamBId === tA.id)
      );
      if (alreadyContacted) continue;

      // Check both directions (either team's tech can extend range)
      const inRange =
        checkProximity(tA.subZones, tB.subZones, adjacencyMap, tA.techs) ||
        checkProximity(tB.subZones, tA.subZones, adjacencyMap, tB.techs);

      if (inRange) {
        newContacts.push({ teamAId: tA.id, teamBId: tB.id });
      }
    }
  }

  return newContacts;
}

/**
 * Check if a team has the Brooklyn Bridge wonder bonus
 * (can contact any team regardless of proximity).
 */
export function hasUniversalDiplomacy(activeBonuses: string[]): boolean {
  return activeBonuses.includes("universal_diplomacy");
}

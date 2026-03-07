// ============================================
// Civilization History Generator
// Decision 68: Haiku generates 3-paragraph
// history-textbook-style summaries per team
// ============================================

export interface CivHistoryInput {
  teamId: string;
  teamName: string;
  civName: string;
  epochs: number;
  territory: string[];
  resourceArc: {
    epoch: number;
    production: number;
    reach: number;
    legacy: number;
    resilience: number;
    population: number;
  }[];
  wondersCompleted: string[];
  techsResearched: string[];
  wars: { opponent: string; epoch: number; won: boolean }[];
  tradeAgreements: number;
  mythologyCreatures: string[];
  codexEntries: number;
  flagUrl?: string;
  victoryTypes: string[];
  submissionCount: number;
  roleSummary: Record<string, number>; // role → epochs played
}

export interface CivHistory {
  teamId: string;
  teamName: string;
  historyText: string;
  generatedAt: string;
}

/**
 * Generate a Haiku prompt for a team's civilization history.
 * Returns the prompt text to send to Claude Haiku.
 */
export function buildHistoryPrompt(input: CivHistoryInput): string {
  const warRecord =
    input.wars.length > 0
      ? input.wars
          .map((w) => `${w.won ? "Victory" : "Defeat"} against ${w.opponent} (Epoch ${w.epoch})`)
          .join("; ")
      : "no wars fought";

  const wonderList =
    input.wondersCompleted.length > 0
      ? input.wondersCompleted.join(", ")
      : "no wonders completed";

  const techList =
    input.techsResearched.length > 0
      ? input.techsResearched.slice(0, 10).join(", ")
      : "no technologies researched";

  const peakPop = Math.max(...input.resourceArc.map((r) => r.population), 0);
  const finalRes = input.resourceArc[input.resourceArc.length - 1];

  return `You are a historian writing for a 7th-grade classroom civilization simulation game called ClassCiv. 

Write a 3-paragraph history-textbook-style summary of this civilization's arc. Use a serious, historical voice — imagine this being read aloud to a class.

CIVILIZATION DATA:
- Name: ${input.civName} (Team: ${input.teamName})
- Duration: ${input.epochs} epochs
- Territory: ${input.territory.length} sub-zones: ${input.territory.slice(0, 5).join(", ")}${input.territory.length > 5 ? "..." : ""}
- Peak population: ${peakPop}
- Final resources: Production ${finalRes?.production ?? 0}, Reach ${finalRes?.reach ?? 0}, Legacy ${finalRes?.legacy ?? 0}, Resilience ${finalRes?.resilience ?? 0}
- Wonders: ${wonderList}
- Technologies: ${techList}
- Military record: ${warRecord}
- Trade agreements: ${input.tradeAgreements}
- Mythology creatures created: ${input.mythologyCreatures.length}${input.mythologyCreatures.length > 0 ? ` (${input.mythologyCreatures.join(", ")})` : ""}
- Codex entries: ${input.codexEntries}
- Total submissions: ${input.submissionCount}
- Most-played role: ${Object.entries(input.roleSummary).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "diversified leadership"}
- Victory conditions achieved: ${input.victoryTypes.length > 0 ? input.victoryTypes.join(", ") : "none"}

RULES:
1. Exactly 3 paragraphs. No headings.
2. Paragraph 1: The founding and early rise.
3. Paragraph 2: The middle period — key events, conflicts, achievements, turning points.
4. Paragraph 3: The final state of the civilization and its legacy.
5. Reference specific events from the data (wonders built, wars fought, technology milestones).
6. DO NOT mention "game" or "simulation" — write as if this is real history.
7. Keep the tone accessible for 7th graders but dignified. Think National Geographic narrator meets textbook prose.
8. ~150-250 words total.`;
}

/**
 * Generate civilization history using Haiku API.
 * In production, this calls the Anthropic API with the prompt.
 */
export async function generateCivHistory(
  input: CivHistoryInput,
  apiKey?: string
): Promise<CivHistory> {
  const prompt = buildHistoryPrompt(input);
  const key = apiKey ?? process.env.ANTHROPIC_API_KEY;

  if (!key) {
    // Fallback: return a template-based history
    return {
      teamId: input.teamId,
      teamName: input.teamName,
      historyText: generateFallbackHistory(input),
      generatedAt: new Date().toISOString(),
    };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("Haiku API error:", response.status);
      return {
        teamId: input.teamId,
        teamName: input.teamName,
        historyText: generateFallbackHistory(input),
        generatedAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    const historyText =
      result.content?.[0]?.text ?? generateFallbackHistory(input);

    return {
      teamId: input.teamId,
      teamName: input.teamName,
      historyText,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Haiku generation failed:", err);
    return {
      teamId: input.teamId,
      teamName: input.teamName,
      historyText: generateFallbackHistory(input),
      generatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Fallback template-based history when API is unavailable.
 */
function generateFallbackHistory(input: CivHistoryInput): string {
  const peakPop = Math.max(...input.resourceArc.map((r) => r.population), 0);
  const finalRes = input.resourceArc[input.resourceArc.length - 1];

  const p1 = `The ${input.civName} rose from modest origins in ${input.territory[0] ?? "uncharted lands"}, where ${input.teamName} established their first settlements. Over the course of ${input.epochs} epochs, this civilization would grow to command ${input.territory.length} sub-zones, reaching a peak population of ${peakPop} citizens.`;

  const achievements: string[] = [];
  if (input.wondersCompleted.length > 0) {
    achievements.push(`completed the ${input.wondersCompleted[0]}`);
  }
  if (input.techsResearched.length >= 5) {
    achievements.push(`mastered ${input.techsResearched.length} technologies`);
  }
  if (input.wars.length > 0) {
    const wins = input.wars.filter((w) => w.won).length;
    achievements.push(`fought ${input.wars.length} wars (winning ${wins})`);
  }
  if (input.tradeAgreements > 0) {
    achievements.push(`negotiated ${input.tradeAgreements} trade agreements`);
  }

  const p2 =
    achievements.length > 0
      ? `The middle epochs saw the ${input.civName} ${achievements.join(", and ")}. Their people left ${input.submissionCount} recorded decisions in the historical archive, each one shaping the trajectory of their civilization.`
      : `Through careful governance and steady growth, the ${input.civName} navigated the challenges of each epoch, leaving ${input.submissionCount} recorded decisions in their historical archive.`;

  const p3 = `By the final epoch, the ${input.civName} held resources of ${finalRes?.production ?? 0} Production, ${finalRes?.reach ?? 0} Reach, ${finalRes?.legacy ?? 0} Legacy, and ${finalRes?.resilience ?? 0} Resilience. ${input.victoryTypes.length > 0 ? `They achieved ${input.victoryTypes.join(" and ")} victory.` : "Their legacy endures in the records of history."} The story of ${input.civName} is one of ${input.wars.length > 2 ? "conquest and ambition" : input.tradeAgreements > 3 ? "diplomacy and commerce" : "perseverance and growth"}.`;

  return `${p1}\n\n${p2}\n\n${p3}`;
}

/**
 * Generate all histories for a game in one batch.
 */
export async function generateAllHistories(
  inputs: CivHistoryInput[],
  apiKey?: string
): Promise<CivHistory[]> {
  const results: CivHistory[] = [];

  for (const input of inputs) {
    const history = await generateCivHistory(input, apiKey);
    results.push(history);
    // Small delay between API calls
    await new Promise((r) => setTimeout(r, 500));
  }

  return results;
}

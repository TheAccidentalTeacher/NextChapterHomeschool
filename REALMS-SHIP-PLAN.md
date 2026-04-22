# ClassCiv Realms — Ship Plan
**Soft-live deploy:** **Wednesday April 22, 2026** — system deployed, DM and students may touch a rehearsal/preview state. Goal for Wed: *smooth*, not full production.
**Hard-live (first real Epoch 1):** **Thursday April 23, 2026** — both classes run Epoch 1 with score persistence. 6th Grade Period 4 (12:25–1:25). 7/8 Grade Period 7 (2:20–3:05).
**Hard deadline:** portfolios in hand by **Friday May 22, 2026** (final school week; contract ends May 24). Revised calendar (§10) targets portfolios by Thu May 7 — ~2 weeks of cushion.
**Drafted:** April 21, 2026. **Revised v1.1:** evening (panel review). **Revised v1.2:** night (Q1–Q17 locked, calendar compressed). **Revised v1.3:** later night — NPC civilizations added. **Revised v1.4:** after thirty-finding external audit — NPCs deferred, F1–F4 ship-blockers resolved. **Revised v1.5:** reconciliation after pulling Scott's parallel work stream — Realms migrations renumbered 011–015 (009/010 taken by remote), existing files marked in §13, Pass 4 + Pass 8 scope reduced.
**Author:** Council of the Unserious, on behalf of Scott Somers.

> **⚠️ Revision context.** v1.0 assumed one week of human-paced solo development. v1.1 corrected to Opus 4.7 build rate after Scott's correction. v1.2 locked seventeen operational decisions and compressed hard-live to Thu Apr 23. v1.3 added NPC civilizations. v1.4 — **an external thirty-finding audit identified four ship-blockers (F1–F4)**: (a) Wed Apr 22 is a teaching day, not a build day; (b) `student-safe-completion.ts` does not exist in this repo (confirmed by file inspection); (c) Epoch 1 cannot fit in a 45-min period as designed; (d) Guardrail 1 contradicts the vassalage-on-zero-sub-zones trigger. **Council decision: cut NPCs back to v1.4-post-hard-live. Ship v1.2 scope Thursday Apr 23 as the panel originally reviewed.** NPC design work preserved in Appendix D for a future build cycle. Only Decisions B and C remain open.

---

## Table of Contents

1. [Context & Decisions Locked](#1-context--decisions-locked)
2. [Current State (Post-Audit)](#2-current-state-post-audit)
2.5 [Panel Review & Design Corrections (v1.1)](#25-panel-review--design-corrections-v11)
3. [Iteration 1 — Safety Cleanup](#3-iteration-1--safety-cleanup)
4. [Realms v2 — Product Design](#4-realms-v2--product-design)
4.5 [Alliance & War Consequences Matrix](#45-alliance--war-consequences-matrix)
4.6 [The Four Non-Negotiables (Polgara's Child-First Guardrails)](#46-the-four-non-negotiables-polgaras-child-first-guardrails)
4.6.2 [Losing with Dignity (Decision B)](#462-losing-with-dignity-decision-b-locked--option-1--positive-narrative)
4.7 [NPC Civilizations — DEFERRED to v1.4-post-hard-live](#47-npc-civilizations--deferred-to-v14-post-hard-live)
5. [The 10-Epoch Arc](#5-the-10-epoch-arc)
6. [Scale Rules (8–40 Students)](#6-scale-rules-840-students)
6.1 [Geography Additions (v1.1)](#61-geography-additions-panel-review-v11)
7. [Random Draft System](#7-random-draft-system)
8. [Test Stack](#8-test-stack)
9. [Migrations Required](#9-migrations-required)
9.5 [Build Order — Eight Passes (v1.1)](#95-build-order--eight-passes-v11)
10. [Calendar — April 21 to May 24](#10-calendar--april-21-to-may-24)
11. [Open Decisions](#11-open-decisions)
11.1 [Operational Q-lock log (Q1–Q17)](#111-operational-q-lock-log-q1q17--apr-21-evening)
11.2 [DM Undo scope (Q17 locked)](#112-dm-undo-scope-q17-locked--this-is-life)
12. [Deferred Items (Post-Contract)](#12-deferred-items-post-contract)
13. [File-Level Change List](#13-file-level-change-list)

---

## 1. Context & Decisions Locked

### The core shift
The original ClassCiv design is a **15-epoch, 6-week, team-based civilization simulation**. Six weeks is no longer available. The remaining classroom runway is **10 class sessions × 45 minutes = 450 minutes per class**. Across two classes that is 900 total instructional minutes before the teaching contract ends.

This is a **compression**, not a correction. The 15-epoch arc was designed in good faith and will be preserved as the v1 product. The compressed arc is a distinct v2 product: **ClassCiv Realms** (working name, subject to rebrand).

### Two-product strategy
| Version | Status | Students | Shape |
|---|---|---|---|
| **v1 — Team-based ClassCiv** | Shipped, runs in production, frozen for this build cycle | 3–5 students per team, 5 specialist roles, 15 epochs | Preserved as-is |
| **v2 — ClassCiv Realms** | Active build, ships for current classes | 1 student per civilization, no roles, 10 epochs | New mode, same repo |

Both versions coexist in the same codebase, gated by `games.game_mode ∈ ('team', 'realms')`. The v1 code paths are untouched.

### Other locked decisions
- **No public hardening in this cycle.** Iterations 2, 3, 4 from the original audit (public-endpoint auth, RLS tightening, AI safety wrapper) are deferred. Scope is classroom-only. If the product later goes public, these come back on the board before launch.
- **Iteration 5 (migration hygiene) skipped** — optional, not load-bearing.
- **Role rotation removed for Realms.** Each student owns one civilization end-to-end. Identity matters more than role exposure in a 10-epoch game.
- **Anna is not involved in ClassCiv.** All narrative, runbook, and finale writing is Scott's work with Council editorial review. (Correction recorded because an earlier draft of this plan erroneously assigned writing tasks to Anna Somers — that assignment is void. Anna's active work is NCHO Shopify, which is a separate product entirely.)

---

## 2. Current State (Post-Audit)

### What ships in the codebase today
- Next.js 16.1.6, React 19.2.3, TypeScript strict
- Clerk auth (username-only, Decision 83)
- Supabase Postgres + Realtime (29 tables, 8 migrations deployed)
- Leaflet map with 12 regions / 72 sub-zones
- 11-phase epoch state machine
- Submissions + DM scoring
- Resource engine (yield, depletion, population, bank decay, war exhaustion)
- Replay viewer
- Epilogue + Anthropic Claude Haiku civilization histories
- Projector display with event overlays
- Simulation engine in `scripts/simulate.ts`

### Known findings from the initial audit
Thirteen findings were identified. The ones relevant to this build cycle:

| # | Finding | Status |
|---|---|---|
| 1 | RLS policies are permissive (`using (true)`) | **Accepted risk, classroom-only** |
| 2 | `admin.ts` uses anon key by design | **Accepted risk, classroom-only** |
| 3 | Anthropic call not routed through safety wrapper | **Accepted risk, DM approves civ names** |
| 4 | Hardcoded Supabase key in `scripts/nuke-all-games.ts` | **Fix in Iteration 1** |
| 5 | `/api/solo/create` has no auth or rate limit | **Accepted risk, deferred** |
| 6 | Student first-name passwords | **Accepted risk, Decision 83** |
| 7 | Migration 007 has hardcoded teacher Clerk ID | **Accepted risk, documented** |
| 8 | Haiku model `claude-3-haiku-20240307` is retired | **Fix in Iteration 1** |
| 9 | No CI / test harness | **Partially addressed by Test Stack below** |
| 10 | `next.config.ts` has no security headers | **Deferred** |
| 11 | Middleware logs every request | **Fix in Iteration 1** |
| 12 | Operational docs live in stale sibling repo | **Fix in Iteration 1** |
| 13 | `simulate.ts` uses anon key | **Works as-is given permissive RLS** |

### Repository layout
- `D:\classciv\classciv-src\` — **canonical repo**, Vercel-linked, GitHub remote `TheAccidentalTeacher/NextChapterHomeschool`
- `D:\classciv\classroom-civ\` — stale sibling with broken `.git`, contains operational runbooks that must be pulled into canonical before deletion
- `D:\classciv\civ-game\` — empty `.vscode` shell, delete

---

## 2.5. Panel Review & Design Corrections (v1.1)

**Context.** On April 21 (evening), the Council convened a seven-member external review panel to stress-test v1.0 of this plan against classroom reality, student behavior, historical accuracy, geography, and military strategy. A ground-truth code audit of `src/lib/game/` was performed in parallel. Thirty-seven concerns were surfaced. All are addressed in v1.1; none were deferred.

### 2.5.1 Code-vs-plan gap (exposed by the audit)

The v1.0 plan described alliance and war mechanics as if they were implemented. They are not. The engine foundations exist; the student-facing scaffolding does not.

| System | Engine | API | UI | DM tools | Tests | v1.0 status | v1.1 scope |
|---|---|---|---|---|---|---|---|
| War exhaustion | ✅ | ⚠️ partial | ❌ | ✅ | ⚠️ | Assumed done | Wire UI, add assertions |
| Battle resolution | ✅ | ❌ | ❌ | ⚠️ manual | ❌ | Assumed automated | Build auto-mutation hook |
| Vassal / tribute | ✅ | ❌ | ❌ | ⚠️ manual | ❌ | Assumed done | Build UI, wire tribute |
| **Alliances** | ❌ | ❌ | ❌ | ❌ | ❌ | **Assumed done** | **Schema + API + UI from zero** |
| Diplomat DEFINE round | ⚠️ role enum only | ❌ | ❌ | — | ❌ | Assumed spec'd | Spec + build |
| Victory (war interaction) | ✅ | ✅ | ✅ | — | ✅ | No domination type | Add domination victory |
| Epoch gating | ❌ | ❌ | ❌ | ❌ | ❌ | Documented only | Enforce in validation |

**Implication.** The phrase "Alliances unlock Epoch 4, Wars unlock Epoch 6" in v1.0 was aspirational, not implemented. v1.1 treats this as new-build scope and reflects it in Section 9 (Migration 015), Section 9.5 (Pass 1 and Pass 3), and Section 4.5 (Consequences Matrix).

### 2.5.2 Panel composition

Seven external personas reviewed the plan:

1. **Mira Halversen** — senior product designer, 14 years in K–12 edtech
2. **Jayden** — 7th-grade boy, competitive, short attention span, will try to break the game
3. **Kira** — 7th-grade girl, writes fanfic, cares about narrative and identity
4. **Ms. Reyes** — 22-year veteran middle school teacher, classroom management focus
5. **Dr. Bram Holloway** — comparative historian, pedagogical framing
6. **Dr. Elena Morozov** — cultural geographer, map/adjacency realism
7. **Col. Tomas Vega (ret.)** — military strategist, war-purpose-and-cost framing

### 2.5.3 Consolidated findings (37 items) — all addressed in v1.1

**Category A — Missing code the v1.0 plan assumed (12 items; sections 4, 4.5, 9, 9.5):**
A1. `alliances` table schema | A2. Alliance proposal/accept/break API | A3. DEFINE round submission option set | A4. Epoch-gating enforcement in submission validation | A5. Battle-to-DB mutation hook | A6. Vassal UI | A7. RulerDashboard | A8. DiplomacyPanel | A9. FoundingClaim | A10. DraftCeremony | A11. ContactMap | A12. Reputation / aggression scoring columns.

**Category B — Gameplay consequence gaps (8 items; section 4.5):**
B1. Won-war reward undefined | B2. Alliance combat support unspecified | B3. Peace-treaty path missing | B4. War-exhaustion stacking ceiling absent | B5. Vassal continuity-of-play absent | B6. Alliance clustering uncapped | B7. No aggressor reputation cost | B8. No domination victory type.

**Category C — UX and learnability gaps (7 items; section 4 expanded):**
C1. First-login dashboard screen undefined | C2. Locked-panel visibility unspecified (grayed vs invisible) | C3. Projector HTML5 audio autoplay bug | C4. Claim-timer unfair to network drops | C5. Contact-map state transition undefined | C6. Founding-writeup input modality undefined | C7. Non-violent victory path not legible to students.

**Category D — Classroom operational gaps (6 items; section 10 expanded, Pass 8):**
D1. Bell-schedule minute budget insufficient for Epoch 1 as planned | D2. DM undo/moderation tool missing | D3. Substitute runbook missing | D4. IEP accommodation layer missing | D5. Parent-facing one-pager missing | D6. Crisis communication script for emotional incidents missing.

**Category E — Narrative and identity gaps (4 items; section 4.6, 5 expanded):**
E1. Conquered-civ name/lore persistence undefined | E2. Alliance treaty-text capture missing | E3. Portfolio content specification missing | E4. Betrayal in-game narrative beat undefined.

### 2.5.4 Build-rate correction (v1.0 → v1.1)

v1.0 estimates were in human-dev-hours. v1.1 estimates are in Opus-4.7-directed-build minutes, with Scott as director. The full thirty-seven-item scope is approximately **5–7 hours of focused build session**, not one week. No scope cut. See Section 9.5 for the eight-pass build order.

### 2.5.5 Full panel critique — raw findings by persona

Preserved for future reviewers. Where v1.1 has addressed a finding, the resolution section is cited.

**Mira Halversen (design):** C1 (RulerDashboard undefined → §4 expanded), C2 (locked-panel visibility → §4 "DiplomacyPanel"), C3 (audio autoplay → §7 revised), C4 (claim timer fairness → §7 revised), C5 (contact-map transition → §4 "ContactMap"), C6 (founding input → §4 "FoundingClaim").

**Jayden (7th-grade boy):** B1 (won-war reward → §4.5), B6 (alliance clustering → §4.5), B5 (vassal continuity → §4.6 Guardrail 2), "draft position fairness" (→ §7 last-pick-or-skipped bonus), "rage-quit mulligan path" (→ §11 Decision J).

**Kira (7th-grade girl):** E1 (civ-name persistence → §4.6 Guardrail 1), E2 (alliance treaty text → §4.5 row and §4 DiplomacyPanel), C7 (non-violent victory legible → §4.6 Guardrail 3), E4 (betrayal narrative beat → §4.5 "Break Alliance" row), E3 (portfolio contains her words → §4.6 Guardrail 4).

**Ms. Reyes (teacher):** D1 (bell-schedule math → §10 revised; Epoch 1 split across two sessions if needed), D2 (DM undo → §4 "DMControlBar additions" and §10 Pass 8), D3 (substitute runbook → §10 Pass 8), D4 (IEP accommodations → §10 Pass 8), D5 (parent one-pager → §10 Pass 8 by Apr 24), D6 (crisis script → §10 Pass 8).

**Dr. Holloway (historian):** "Whig arc" (→ §5 Reformation option added to E7/E8), "alliance-before-war ahistorical" (→ §10 Pass 8 DM-runbook note), "Kaiju tonal mismatch" (→ §5 rename to 'The Beast That Walked'), "religious reform absent" (→ §5 Reformation submission).

**Dr. Morozov (geographer):** "adjacency graph unspecified" (→ §6 expanded, §11 Decision F), "Western Europe magnet" (→ §6 region attractiveness balancing note), "resource distribution by region" (→ §11 Decision G), "Madagascar problem" (→ §6 isolated-start compensation mechanic), "war geography / leap-conquest" (→ §4.5 "Battle Resolved" adjacency rule).

**Col. Vega (strategist):** "Clausewitzian object" (→ §4.5 war declaration requires justification), B2 (alliance combat support → §4.5 "Alliance combat support" row), B3 (peace treaty → §4.5 "Sue for Peace" row), B4 (exhaustion stacking ceiling → §4.5 confirmation-gate at 75), B5 (vassalage visible and playable → §4.6 Guardrail 2), B7 (reputation cost → §4.5 "Break Alliance" and aggression_score), "proxy pressure / ultimatum" (→ §4.5 "Issue Ultimatum" row), B8 (domination victory → §4.5 and §9 Migration 015).

---

## 3. Iteration 1 — Safety Cleanup

**Ships:** Monday April 21, 2026 (evening) — folded into Pass 6 of the v1.1 build order (see §9.5).
**Status (as of v1.1 revision):** NOT YET SHIPPED. All four items verified unfinished by file inspection: `classroom-docs/` directory does not exist in canonical repo, `civilization-history.ts:126` still references retired Haiku model, `nuke-all-games.ts:10–11` still has hardcoded URL + publishable key, `middleware.ts` still logs every request.
**Effort:** ≈15 minutes at Opus 4.7 build rate.
**Risk:** Low.
**Gate:** `npm run build` clean; `simulate.ts --dry-run --epochs 2` green; live smoke test as `scott` + one student + projector.

### Changes
1. **Inventory `D:\classciv\classroom-civ\` with `ls -la` before any copy or delete** (F20 fix, v1.4). The audit identified risk of losing unrelated in-progress work in the stale sibling. Confirm directory contents against the expected list below:
   - `D:\classciv\classroom-civ\DAY-1-DM-RUNBOOK-6TH.md` → `D:\classciv\classciv-src\classroom-docs\`
   - `D:\classciv\classroom-civ\DAY-1-STUDENT-GUIDE-6TH.md` → same
   - `D:\classciv\classroom-civ\TEAM-ROSTERS.md` → same
   - `D:\classciv\classroom-civ\DAY-ONE-PLAYBOOK.md` → same (additional file noted in earlier audit)
2. If any other files are present, copy them to a `D:\classciv\classciv-src\classroom-docs\from-stale-sibling\` directory for Scott to review before deletion. Do NOT blind-delete.
3. Delete `D:\classciv\classroom-civ\` and `D:\classciv\civ-game\` only after the inventory review is complete.
3. Update Anthropic model ID in `src/lib/ai/civilization-history.ts:127`:
   ```diff
   - model: "claude-3-haiku-20240307",
   + model: "claude-haiku-4-5-20251001",
   ```
4. Remove the hardcoded Supabase URL and publishable key from `scripts/nuke-all-games.ts` — switch to `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.SUPABASE_SERVICE_ROLE_KEY`. If the script is dev-only, also rename to `scripts/dev-nuke-games.ts` and add a loud confirmation prompt.
5. Trim middleware `console.log` calls in `src/middleware.ts` — keep only error cases and the role-redirect path. Remove per-request `[MW] METHOD path` logging.

---

## 4. Realms v2 — Product Design

### The product sentence
**ClassCiv Realms is a 10-session classroom civilization game where each student plays one sovereign civilization on a shared world map, making individual decisions and negotiating with peers across a ten-epoch narrative arc.**

### How Realms differs from Team
| Dimension | Team (v1) | Realms (v2) |
|---|---|---|
| Civilizations per student | Shared with 2–4 teammates | One, solo |
| Specialist roles | 5 (Architect/Merchant/Diplomat/Lorekeeper/Warlord) | None — each student does all round types |
| Epochs | 15 | 10 |
| Session shape | 4 action rounds × 8 min + routing | 1 decision turn × 25 min, 4 submissions in parallel |
| Diplomacy | Open from Epoch 1 | Alliances unlock Epoch 4, Wars unlock Epoch 6 |
| Absence handling | Cover system (engine exists) | Civilization idles; DM can make light narrative moves on behalf |
| Fit for marketing | Narrower (requires team-friendly classroom) | Broader (any class of 8–40 students) |

### Realms game mode — architecture summary
- `games.game_mode = 'realms'`, `games.total_epochs = 10`
- Each student is a `team` of one with `teams.is_solo = true`
- The 29-table schema and all engine modules (`yield-calculator`, `depletion-engine`, `battle-resolver`, etc.) are reused without modification
- Route-level and component-level rendering branches on `game_mode`

### New UI components required

Each component spec includes the v1.1 panel findings that shaped it.

1. **`src/components/dashboard/RulerDashboard.tsx`** — replaces the five role panels for Realms games.
   - **First-login state (addresses C1):** civ name, civ flag, current epoch, sub-zone, resource summary, round prompt, victory-path-progress strip (cultural + economic + domination, all visible from E1 per §4.6 Guardrail 3), and a locked/unlocked marker for the DiplomacyPanel tab.
   - **No blank states.** If a resource is zero, show "—" not empty. If a round is pending submission, show the prompt in the central panel, not a modal.

2. **`src/components/realms/FoundingClaim.tsx`** — draft-turn UI.
   - **Input modality (addresses C6):** sub-zone select on the map + two-sentence textarea with a scaffolded prompt ("Your civilization is called ______. It is known for ______."). Optional third field for a 1–2 word motto. Voice-to-text button for accessibility (D4).
   - **Countdown:** visual client-side; authoritative server-side deadline (see §7 revision for network-drop fairness).

3. **`src/components/realms/DiplomacyPanel.tsx`** — unlocks at E4.
   - **Locked state (addresses C2):** visible, grayed, tooltip "Unlocks at Epoch 4." Preview of the seven DEFINE round submission types so children anticipate diplomacy. NOT invisible — anticipation is the point.
   - **Unlocked state (E4+):** seven submission options from the DEFINE-round spec (see §4.4), each opening a targeted dialog with ally/target select, justification textarea (treaty or casus-belli text captured per E2), and a "Sign" confirmation.

4. **`src/components/projector/DraftCeremony.tsx`** — order reveal.
   - **Audio fix (addresses C3):** HTML5 audio requires a prior user gesture on the projector tab in Chrome. Runbook and component BOTH require a one-time click on an "Arm Ceremony" button before the first name reveal. Fallback to silent if audio context blocked.
   - Per-name reveal ~4 seconds with a 2-second hold; queue position animates from center to list.

5. **`src/components/projector/ContactMap.tsx`** — civ-pair visibility.
   - **State transition (addresses C5):** on first contact between two civs, both flags pulse simultaneously for 2 seconds and a line animates between their sub-zones, then decays to a subtle dotted edge that persists for the rest of the game. The dotted edge is the "they have met" visual state. Used to drive awareness in low-density classes (15 students / 12 regions).

### 4.4 DEFINE round — diplomat submission options (addresses A3, C7, B1–B8, E2)

The DEFINE round accepts the following seven submission types. All are validated against epoch gates (§4.5). All capture a free-text justification field (stored for §4.6 Guardrail 4 portfolio content).

| Submission type | Unlocks | Target | Free-text field | DM score impact |
|---|---|---|---|---|
| Propose Alliance | E4+ | one civ | Treaty text (required, ≥1 sentence) | Higher for coherent terms |
| Accept / Reject Alliance | when pending | self | Optional reply | Higher for narrative reply |
| Break Alliance | active alliance only | one ally | Justification (required) | Higher for coherent reason; still incurs −15 resilience + reputation cost |
| Propose Trade Agreement | E2+ | one civ | Resource terms JSON + narrative | Higher for mutual benefit |
| Issue Ultimatum | E4+ | one civ | Demand + threat text (required) | Creates flag; if E6+ and target refuses, auto-war with zero extra exhaustion |
| Declare War | E6+ | one civ | Casus belli (required) | Higher for historically-legible reason |
| Sue for Peace | active war only | one belligerent | Proposed reparations (optional resource transfer) | Both sides gain +5 resilience on acceptance |
| Propose Vassalage | E6+, battle-loser or willing submission | one civ | Terms (tribute %, duration) | See §4.5 vassalage row |

**Validation:** self-targeting blocked. Pre-epoch-gate submissions rejected with "Unlocks at Epoch X" message. Max outbound diplomatic submissions per epoch per civ: **2** (prevents Jayden from spamming 15 ultimatums in one turn — addresses B6 alliance-clustering adjacent concern).

### Reused components (no change)
- `GameMap`, `SubZoneLayer`, `MarkerLayer`, `RegionLayer`
- `TopBar`, `ResourceBar`, `PopulationBar`
- `SubmissionQueue`, `SubmissionOverrideModal`, `DMControlBar`
- `ReplayClient`, `ReplayMapPanel`
- Epilogue flow in `src/app/epilogue/`
- All `src/components/modals/*` and `src/components/projector/*` existing

---

## 4.5. Alliance & War Consequences Matrix

**Purpose.** Every diplomatic action must produce a real DB mutation and a student-visible effect. Otherwise alliances and wars are theater. This matrix is the acceptance contract for Pass 2 and Pass 3 of the build order (§9.5).

**Rule of adjacency (addresses geographer finding):** a Declare War action requires the attacker to control a sub-zone adjacent to the target's nearest sub-zone. Non-adjacent attacks are rejected with "Your forces cannot yet reach [civ]." Exception: naval sub-zones (if any) bridge adjacency across water once a `NAVAL` tech or equivalent exists. If adjacency graph (§11 Decision F) is not yet loaded at v1.1 ship, a placeholder "any declaration permitted" flag runs until Apr 24 when the graph loads.

| Action | Mechanical Consequence | DB Mutation | Student-Visible Effect |
|---|---|---|---|
| **Propose Alliance** (E4+) | Creates pending treaty. Both parties locked from declaring war on each other while pending. | `alliances` row, `status='pending'`, `proposer_team_id`, `target_team_id`, `treaty_text`. | Target gets notification. DiplomacyPanel shows Accept / Reject. Projector event: "[Civ] proposes alliance with [Civ]." |
| **Accept Alliance** | Shared fog of war. Ally available as support in battle-resolver. Treaty text stored for portfolio. | `alliances.status='active'`, bidirectional entries, `accepted_at` timestamp. | Both flags glow in shared accent on projector. Treaty text visible on both dashboards and in both epilogues. |
| **Reject Alliance** | No state change beyond closing the pending record. | `alliances.status='rejected'`, `rejected_at`. | Both parties see the outcome. No reputation cost for rejection. |
| **Break Alliance** | Immediate. −15 resilience to breaker. `teams.reputation_score −= 10`. Target gains optional "Casus Belli" flag (free war declaration with zero exhaustion cost next epoch). | `alliances.status='broken'`, `teams.reputation_score` decrement, `teams.casus_belli_target` set on ex-ally. | **PUBLIC PROJECTOR EVENT — full drama treatment (Q9 locked).** See §4.5.1 for copy voice. Betrayal fires a large, red, centered projector overlay that names both civs, names the broken treaty text, and stays on-screen for 8 seconds before decaying. DM narrates aloud. Captured in both epilogues. |
| **Propose Trade Agreement** (E2+) | Pending contract. If accepted, resource-routing hook fires each epoch per terms until duration expires or war declared. | `trade_agreements` row (existing table). | Trade indicator on dashboard. Resource ticker shows inbound/outbound. |
| **Issue Ultimatum** (E4+) | Creates pending flag. If target complies by next epoch end, no state change. If refuses (or no reply), at E6+ auto-escalates to war with zero extra exhaustion; at E4–E5 expires as diplomatic incident (reputation −5 on issuer if demand unreasonable per DM scoring). | `epoch_submissions` row with `ultimatum` type; `teams.reputation_score` on expiry. | Projector event. Target has one epoch to reply on DiplomacyPanel. |
| **Declare War** (E6+) | +25 war exhaustion to declarer. `epoch_conflict_flags` entry created. Trade with target blocked. Requires casus belli text; DM scoring penalty if unjustified. Requires adjacency (see rule above). | `teams.war_exhaustion_level += 25`, `epoch_conflict_flags` insert, `trade_agreements` where both parties → suspended. | Projector event: "[Civ] declares war on [Civ]." Both civs see war indicator. |
| **Exhaustion Stacking Gate** (addresses B4) | When a civ at war_exhaustion ≥75 attempts a second declaration, dashboard shows a confirmation modal: "Your civilization is exhausted. A second war will trigger civil unrest next epoch." Requires typed confirmation. | Client-side + server-side check. | Modal. Requires typing "CONFIRM" to proceed. Adds friction to self-destruct. |
| **Battle Resolution — Winner** | +5 exhaustion, −2 population, −15% bank next epoch, +sub-zone IF score differential ≥10. | Auto-mutation hook (Pass 2 of build order): `teams.population`, `teams.war_exhaustion_level`, `team_resources.bank_delta_next_epoch`, `sub_zones.controlled_by_team_id`. | Map recolors. Projector overlay shows casualty count and sub-zone transfer. |
| **Battle Resolution — Loser** (F4 fix, v1.4) | +10 exhaustion, −3 to −5 population (RNG per war-exhaustion.ts), −25% bank, loses sub-zone IF differential ≥10. **Guardrail-1 preservation rule:** the engine NEVER transfers a loser's last remaining sub-zone. If loser holds exactly one sub-zone entering the battle, sub-zone transfer is suppressed regardless of score differential. Instead, at score differential ≥20, the engine offers vassalage to the loser next turn; the loser's last sub-zone becomes a tributary enclave within the liege's sphere of influence. If loser refuses vassalage, the battle result is downgraded to a pyrrhic victor win (no transfer, both sides fully exhausted). | Same hook. Loser team row and at least one sub-zone ownership ALWAYS preserved. `sub_zones.controlled_by_team_id` never flips on a team's last sub-zone. | Map recolors, loser's flag stays on at least one sub-zone (never erased). Projector shows loss narrative + vassalage offer if triggered. Loser's dashboard offers vassalage option. |
| **Alliance Combat Support** (Q6 + F9 fix, v1.4) | Ally may send a **declared subset** of soldiers to defender's side. Submission payload includes `soldiers_committed: integer` with validation **min(1, max(ally's current soldier count))** — zero-commit is NOT permitted (F9 exploit closed). If ally has zero soldiers, ally cannot contribute combat support this epoch; alliance remains active but "unable to assist" flag fires on projector for transparency. Committed soldiers contribute to the battle roll and are at risk of loss per battle-resolver.ts. Ally's d20 roll and barracks/walls bonuses apply. | Battle-resolver receives third participant with soldier count = committed subset (always ≥1). `epoch_submissions` captures `soldiers_committed`. Server-side validation rejects zero-commit with 400. | Projector overlay shows three flags with ally's committed count visible. If ally had zero soldiers available, overlay shows "[ally] was unable to assist" with defender rolling alone. No silent symbolic-support dodge. |
| **Vassalage** (Q7 locked — negotiable tribute; Q10 locked — liege sees tribute only) | Tribute is negotiable on proposal. Liege proposes `tribute_percent` in range **10–30%** (default 20%). Vassal may accept, counter-propose, or reject. On active vassalage: declared % of vassal's yields route to liege each epoch. Vassal continues submitting all rounds including DEFINE, but cannot declare war independently. Vassal keeps civ-name, flag, sub-zone, lore, and portfolio ownership. Can revolt after 3 epochs at cost of −30 resilience. **Privacy:** liege's dashboard shows only the tribute-in flow from each vassal (resource amount, epoch). Liege does NOT see the vassal's submissions, round decisions, or internal state. Vassal's dashboard is not visible to liege (see §4.6.1). | `vassal_relationships` active row (`tribute_percent` stored 10–30), resource-yield hook, submission-validation allows all types except outbound-war. Liege dashboard queries only `resource_events` where destination = liege AND source_type = 'tribute'. | Vassal flag retains own color + small liege-banner overlay. Vassal dashboard shows tribute outflow. Liege dashboard shows tribute inflow only — no vassal-submission visibility. Civ-name stays in projector headers and epilogue unchanged. |
| **Sue for Peace** | Both sides +5 resilience on acceptance. `epoch_conflict_flags.outcome='peace'`. War exhaustion decays per normal schedule. | Update existing flag row. | DM narrates. Both civs flagged as "at peace" on dashboard. |
| **Aggression Score** (addresses B7) | `teams.aggression_score` increments on unjustified war declaration (DM scoring <3 on casus belli), unjustified alliance break, or ultimatum expiry-as-issuer. Decays −5 per epoch. At ≥20, other civs see "unreliable ally" warning when this civ proposes alliance. | `teams.aggression_score` column (Migration 015). | DiplomacyPanel shows warning badge. DM-facing flag. Reputation is retrievable. |
| **Cultural Victory** (any path, resolved E10) | Wins on Legacy threshold, regardless of war state. | Existing victory-engine.ts path. | Dashboard shows "Cultural" progress strip from E1 (addresses C7 / Guardrail 3). |
| **Economic Victory** (E10) | Wins on Bank + Production composite, regardless of war state. | Existing. | Same visibility. |
| **Domination Victory** (E10; unlocks at E6) | **NEW.** Composite = (sub-zones controlled × 2) + (active vassals × 3) + (wars won − wars lost). Top score at E10 wins if no cultural/economic winner exceeds threshold. Weights locked Q3. | New victory type in victory-engine.ts (Migration 015). | Visible from E6 when wars unlock. Dashboard third progress strip. |

### 4.5.1 Battle & diplomacy auto-resolution policy (Q1 locked)

Battle resolution is **fully automatic** once a conflict flag reaches resolve-state. No secondary DM confirmation is required before resource mutations fire. DM scoring of the casus belli text happens BEFORE the battle resolves and is the only gate — once scored, the engine mutates automatically.

**Full audit row required.** Every auto-mutation writes a row to `game_events` with `event_type = 'battle_resolution' | 'alliance_broken' | 'tribute_routed' | ...`, the full pre-state and post-state of every affected team column, the originating submission ID, the DM score, and a timestamp. This row is queryable, replayable, and visible to the DM in a new "Event Log" tab on the DM dashboard. The DM Undo button (Pass 8) uses this row to reverse a resolution if needed — it does not re-compute from scratch; it restores from the `pre_state` JSON blob.

**Why fully-auto-but-logged:** at 15+20 = 35 students, multi-step DM confirmations on every battle add 2–4 minutes of classroom dead time per resolution. Auto-with-log gets the same safety floor (reversible) without stalling the class.

### 4.5.2 Betrayal event copy voice (Q9 locked — "full drama")

When an alliance breaks, the projector overlay fires with dramatic copy. The goal is public, memorable, and tonally sharp — the betrayal is the emotional signature moment of the game. Copy template (with substitution variables):

> **"⚔ BETRAYAL ⚔"**
>
> **{BREAKER_CIV_NAME} has broken its treaty with {TARGET_CIV_NAME}.**
>
> *The treaty once read:* "{TREATY_TEXT}"
>
> *{BREAKER_CIV_NAME} gave this reason:* "{BREAK_JUSTIFICATION}"
>
> *The world will remember.*
>
> *— {TARGET_CIV_NAME} has been granted the Casus Belli. Wars between them now carry no exhaustion cost.*

**Visual:** large, centered, red border pulse, 8-second hold before decay to the event log stream at the bottom of the projector. Audio: if Arm-Ceremony gesture was satisfied, plays a low single-drum-hit. Silent otherwise.

**Editorial rules (Polgara):**
- The treaty text is quoted verbatim — the child who wrote it sees her words on screen as context for the betrayal.
- The breaker's justification is also quoted verbatim — the breaker-child owns her reason publicly.
- No gratuitous villain framing. The copy is dramatic but does not editorialize ("has betrayed" not "has evilly betrayed").
- The overlay does not name children by real name — only civ names. This is deliberate. Public drama is between civilizations, not between the actual humans in the room.

---

## 4.6. The Four Non-Negotiables (Polgara's Child-First Guardrails)

These guardrails are not preferences. They are acceptance criteria for shipping. Any Pass that violates one of these does not ship until the violation is repaired.

1. **A conquered civilization retains its name, lore, flag, and epilogue.** Even as a vassal, the child's flag stays on the sub-zone. Her civ-name stays in projector headers. Her founding prose survives to the portfolio. The map does not erase her. *Enforcement:* Battle-resolution hook must transfer `controlled_by_team_id` on the sub-zone but NEVER delete the team row. Vassal relationship preserves team identity.

2. **Vassalage is a playable state, not a benching.** The vassal child still submits every round. Tribute routes to the liege; choices still shape her civilization's story. Her DEFINE round is limited (no outbound war) but otherwise open (culture, trade, reform, revolt after 3 epochs). *Enforcement:* submission validation must permit vassal DEFINE/BUILD/EXPAND; RulerDashboard must render a full round prompt for vassals, never a "your civ is defeated, wait for others" message.

3. **A cultural or economic victory path is visibly flagged on every child's dashboard from Epoch 1.** "Your civilization can triumph through wisdom, wealth, or might." Plain English. Always visible. Three progress strips on RulerDashboard from first login. *Enforcement:* RulerDashboard component test must assert all three strips render with initial values on Epoch 1 load.

4. **The portfolio contains her words.** Founding submission prose, treaty texts she wrote, ultimatum justifications, sue-for-peace reparation terms, and the Haiku-generated civilization epilogue. Not yield statistics. Not score tables. Her words, her civilization's arc, her name. *Enforcement:* portfolio generation queries `epoch_submissions.content.free_text_action` and `alliances.treaty_text` for the team; unit test asserts non-empty prose payload in every portfolio.

**Operational rule:** if a build Pass compromises one of these four, the Pass is incomplete. Shipping on top of a violation creates the incident that defines the product in parents' memory.

### 4.6.1 Liege privacy boundary (Q10 locked — "only the tribute")

When one civilization becomes vassal to another, the liege receives **only** the tribute flow. The liege dashboard does not show the vassal's round submissions, resource inventory, population, war-exhaustion level, alliance list, or any other internal state. Vassalage is an economic relationship, not a surveillance relationship.

**Why this is a guardrail, not a feature choice:** the classroom is not a labor-simulation. The intent of vassalage in this game is to keep a defeated civilization mechanically alive with her story intact (Guardrail 2), not to grant a victor power over another child's decisions. Jayden holding vassalage over Kira gets him tribute, a banner, and a domination-victory bonus — nothing he can use to control her turn.

**Implementation:**
- Liege dashboard queries `resource_events` where `destination_team_id = liege_id AND source_type = 'tribute'` only.
- No join to vassal's `epoch_submissions`, `team_resources`, or any internal-state table from the liege's dashboard path.
- Asserted by `assertLiegeSeesOnlyTribute` test: liege dashboard response contains no vassal-submission data when hit via the authenticated liege session.

**Vassal's privacy is reciprocal:** vassal does not see liege's internal state either, beyond the tribute rate and the liege's civ-name on her own flag.

### 4.6.2 Losing with dignity (Decision B locked — Option 1 + positive narrative)

The engine declares winners and the standings are real. A child who finishes in 14th of 15 places has finished in 14th place. The game does not pretend otherwise.

**And yet.** Every civilization — winner or loser, ranked 1st or ranked last — receives a **dignifying narrative epilogue** generated at end-of-game. This is not consolation. This is the child's civilization being *remembered on its own terms*.

**Policy:**

1. **The engine produces ranks.** Cultural, Economic, and Domination victories are declared per §4.5. Composite standings rank every team 1 through N. No obfuscation on the leaderboard.

2. **Haiku produces narrative epilogues, one per civilization, regardless of rank.** Input: that civ's founding prose (the child's words), her treaty texts (her words), her casus belli if she warred (her words), her reformation choice if she reformed (her words), her key game events. Output: a 3–5 sentence narrative in the voice of a historian looking back, honoring what that civilization WAS, not merely what it scored.

3. **The projector finale runs in two beats.** Beat 1: winners crowned, standings displayed, applause. Beat 2: a scroll of every civilization's narrative epilogue, largest font, one at a time, regardless of rank. The child who came in 14th watches her civilization named and honored on the same projector that just crowned first place.

4. **The portfolio includes the epilogue for her own civilization.** Every child's PDF carries her civilization's dignifying epilogue alongside her founding prose, her treaty texts, and the final standings. Guardrail 4 remains: her words. The Haiku epilogue is built FROM her words and reflects them back as history.

**Copy voice (Polgara's lock):**
- Honoring, not pitying. "Civilization Marinthia stood upon the northern coast for ten ages. Her traders filled the harbors of three peoples. When the winter came, her lamp held."
- Specific to what she did. Generic "you tried your best" copy is forbidden. The epilogue MUST reference at least one concrete event from her actual playthrough.
- Past tense. Historical register. "Was," not "is." Her civilization is now part of the recorded past, like every civilization before her. Remembered.
- No ranking language in the epilogue itself. The ranking is shown separately. The epilogue is about the civilization's character, not its finishing position.

**Implementation:**
- Haiku prompt template (lives in `src/lib/ai/civilization-epilogue.ts` — existing file per Pass 6 update to the model ID, reused for this purpose).
- One call per civilization at end-of-game, using `claude-haiku-4-5-20251001`.
- Input: structured JSON of the civ's full arc — founding, alliances, wars, betrayals, reformation, final state.
- Output: 3–5 sentences, past tense, specific, dignifying.
- Storage: `teams.epilogue_text`.
- Cost: ≈35 Haiku calls per full two-class arc at ~$0.003 each ≈ $0.10 total. Trivial.

**Assertion (added to §8):** `assertEpilogueGeneratedForEveryTeam` — at end-of-game, every team row has non-empty `epilogue_text`, and the text references at least one concrete game event from that civ's history.

**Note:** this is NOT the NPC epilogue. That is deferred to v1.4 per Appendix D. This is the student-civ epilogue that ships Thu Apr 23 — it uses the existing `civilization-history.ts` path, already live in the codebase, with the Haiku model ID updated in Pass 6.

---

## 4.7. NPC Civilizations — DEFERRED to v1.4-post-hard-live

**Status: DEFERRED.** NPCs will not ship with the Thu Apr 23 hard-live. Design work is preserved intact in **Appendix D** for a future build cycle.

**Why deferred (v1.4 revision, post-external-audit):**

The v1.3 NPC specification was drafted on the same night Pass 1 was scheduled to begin. A thirty-finding external audit identified four ship-blockers, two of which were NPC-specific or NPC-adjacent:

- **F2 (nuclear).** The non-negotiable safety wrapper `src/lib/ai/student-safe-completion.ts` does not exist in the ClassCiv repository (file inspection confirmed). v1.3 built NPCs on a dependency that was not there. Building the wrapper, porting it from CoursePlatform, or shipping NPCs without it all violate the plan as written.
- **F7.** Pass 4 budget was understated by roughly 40% when NPC work was folded in on top of five new UI components and an adjacency seed build.
- Silk pattern note (accepted): v1.3 added a first-class system the night before ship because v1.2 felt too easy. That is feature creep wearing the mask of ambition.
- Decision O (formal DM pre-approval queue for NPC projector prose) is not truly deferrable once NPCs are live — Mrs. Andersson as a substitute teacher cannot reflexively DM-Undo an off-tone NPC event.

**What this defers:** the full NPC system — dynamic target civ count, five personalities, hybrid rule-based + Haiku AI, safety-wrapped Haiku prose, NPC Panel in DM UI, NPCs-can-win policy, the Haiku safety prompt, post-generation filtering, fallback canned copy, and Decision O pre-approval queue. All preserved in Appendix D.

**What this preserves (v1.2 scope):** the full panel-reviewed alliance and war system for peer-to-peer play. A class of 15 or 20 real students has a rich diplomatic world between themselves. The original ClassCiv Realms experience as the panel validated it.

**When v1.4 NPC work unlocks:** after Thu Apr 23 hard-live is stable for at least one full week of real classroom use (through Thu Apr 30 minimum, ideally through Thu May 7). First-class observation of whether the peer-only world actually feels thin replaces the speculation that drove v1.3's scope creep. At that point:
1. Build `src/lib/ai/student-safe-completion.ts` from scratch or port from CoursePlatform
2. Add NPC schema columns to a new Migration 014
3. Build the rule-layer decision trees and Haiku integration
4. Build the formal DM pre-approval queue (Decision O resolved in v1.4 scope, not deferred past it)
5. Build the NPC Panel DM UI
6. Test against a rehearsal game before exposing to real classes

**Preserve this lesson:** v1.3's collapse was caused by a scope addition on the eve of ship. v1.4 NPC work ships only after hard-live is observed. No v1.5 "later night" additions.

---

## 5. The 10-Epoch Arc

One epoch per class session. One session = 45 minutes.

| Epoch | Day | Theme | Mechanics | DM narrative beat |
|---|---|---|---|---|
| 1 | Founding | Identity, territory, worldbuilding | Random draft → claim sub-zone → 2-sentence founding submission | "In the beginning…" |
| 2 | First Light | Early growth | BUILD + EXPAND rounds | Resources start flowing |
| 3 | Culture Emerges | Identity deepens | Full 4-round epoch | Mythology, codex entries |
| 4 | **Alliances Unlock** | First diplomacy | Diplomacy panel activates; DM fires First Contact events if density low | "The world has grown smaller" |
| 5 | The First Crisis | External pressure | DM fires one global event (Plague / Famine / **Mr. Somers-zilla**) | Players respond, not plan |
| 6 | **Wars Unlock** | Conflict becomes possible | War declarations live (require casus belli + adjacency per §4.5); DM may force one between rivals | "A border has been crossed" |
| 7 | Trade Winds | Multi-epoch agreements | Merchants' instinct even without a Merchant role; **Reformation** option available (spend Legacy to exit Dark Age or reshape culture) | Formal trade economy visible |
| 8 | Wonders | Legacy projects | First to 60 Legacy triggers a wonder option; Reformation still available | "A monument for the ages" |
| 9 | The Reckoning | Second crisis | Dark Age checks fire; surviving civs make last moves; Reformation is the comeback path | "Not all will endure" |
| 10 | Endgame | Finale + epilogue (two-beat per §4.6.2) | Beat 1: winners crowned + standings displayed. Beat 2: dignifying Haiku epilogue for EVERY civilization, largest font, one at a time, regardless of rank. Replay begins after both beats. | "This is how their story ended" |

**Narrative revisions (v1.1 and v1.2):**
- **"Kaiju" renamed to "Mr. Somers-zilla"** per Scott's Q-K call (v1.2), overriding the historian's mythic-neutral suggestion. This is a classroom-specific in-joke with the teacher's name baked in. Mechanic unchanged — Mr. Somers-zilla rampages as a global crisis with the same damage profile as a kaiju event (population hit, production suppression, optional wonder-destruction if a civ has built one). Copy voice is teacher-personal and memorable: *"Mr. Somers-zilla has emerged from the deep. The world trembles. Your civilizations must respond."* Historians may wince; children will remember it forever.
- **Reformation option added** at E7–E9 (previously absent per historian's "religious/cultural reform missing" finding). A civ in Dark Age may spend 20 Legacy to trigger Reformation: exit Dark Age, recover 10 resilience, lose 5 population (schism attrition). A healthy civ may also reform to convert existing Legacy into a one-epoch production bonus. Implementation: new DEFINE-adjacent submission type "Reform Culture" available to BUILD round lead.
- **Historical framing note (added to DM runbook):** "Our game sequences diplomacy before war for pacing; historically, war typically came first." Prevents children from internalizing v2's gate sequence as anthropological fact.

### Bail-out points
If the calendar slips (snow day, assembly, flu wave):
- After Epoch 4: scripted 4-epoch finale ready
- After Epoch 6: scripted 6-epoch finale ready
- After Epoch 8: scripted 8-epoch finale ready

All three finale variants live in `classroom-docs/finale-scripts/`. Scott writes these by May 3.

---

## 6. Scale Rules (8–40 Students)

Realms must work for any class size from 8 to 40 students without rebalancing. The lever is **enrollment**, derived at runtime from `SELECT count(*) FROM teams WHERE game_id = ?`. (NPC padding was considered in v1.3 and deferred to v1.4 — see §4.7.)

### Square-root scaling for victory thresholds
```typescript
function scaledThreshold(base: number, enrollment: number): number {
  return Math.round(base * Math.sqrt(enrollment / 15));
}
```
Rationale: doubling class size does not double resource accumulation at the top end — depletion and shared crises dampen it. Empirically, square root tracks.

### Sub-zone claim distribution
- If `enrollment ≤ 12` (map region count): **enforce one civ per region first**; remaining students free-pick. Ensures global spread in small classes.
- If `enrollment > 12`: **cap at 4 civs per region**. Prevents dogpiling on appealing regions (Western Europe tends to be the magnet).

### DM contact intervention (low-density support)
At 15 students on 12 regions, civilizations may never meet organically. The DM uses existing Intel Drop and Global Event tools to broadcast first contacts.

| Enrollment | First forced contact | Second forced contact |
|---|---|---|
| 8–14 | Epoch 2 | Epoch 4 |
| 15–24 | Epoch 3 | Epoch 5 |
| 25–40 | Epoch 4 | Optional |

Current classes:
- **6th Grade (15 students):** First contact at Epoch 3 — DM announces 5 civ pairs on the projector with short narrative prose. Second contact at Epoch 5 — DM fires global crisis that forces diplomatic response.
- **7/8 Grade (20 students):** First contact at Epoch 3 — 8 pairs. Second contact at Epoch 5.

### Extreme low enrollment (future feature, not built now)
If a class drops below 8, `games.allow_dual_civ = true` lets each student run two civilizations. Uses existing `vassal_relationships` schema. Flag exists in migration; UI not built until needed.

### 6.1 Geography additions (panel review v1.1)

**Adjacency graph (addresses Dr. Morozov's core finding).** The 12 regions / 72 sub-zones need an explicit adjacency edge list stored as `sub_zone_adjacencies(sub_zone_a_id, sub_zone_b_id, edge_type)` where edge_type ∈ ('land', 'coastal', 'naval_required', 'impassable'). Loaded once as seed data. Consumed by:
- War declaration validation (§4.5 adjacency rule)
- First-contact detection in contact-engine.ts (two civs with adjacent sub-zones auto-meet on E2)
- Sub-zone transfer legality (conqueror must hold adjacent sub-zone to claim conquered territory)

Seed data compilation is a **one-hour task, deferred to Pass 4** of the build order. Until loaded, a permissive flag `games.adjacency_strict = false` allows declarations without adjacency check.

**Region attractiveness balancing.** Panel identified the "Western Europe magnet" — children cluster in familiar-looking regions, leaving Arctic/Sahara unused. Two-part mitigation:
1. **Draft cap enforcement** (already in §6): ≤12 enrollment enforces one civ per region first; >12 caps at 4 per region.
2. **Region-specific yield bonuses (NEW):** each region has a thematic resource advantage so barren-looking regions are mechanically attractive. Configuration in `supabase/seed/region_yields.sql`. Examples:
   - Arctic regions: +25% research yield from BUILD submissions
   - Sahara/desert regions: +15% bank retention (lower decay)
   - Coastal regions: +20% trade reach multiplier
   - Lush regions: +15% food yield, standard baseline for population pressure
   - Mountain regions: +30% defense bonus (defender walls effective from turn 1)
  
  This is a Pass 4 build item. Until configured, all regions share baseline yields (geography cosmetic — this is the v1.0 state; v1.1 makes it mechanical).

**Madagascar problem (isolated starts).** If a sub-zone has zero adjacent sub-zones not held by the same civ (island / extreme isolation), the child receives an `isolated_start` flag with compensating mechanics: +1 scout range, +5 starting food, first-contact auto-triggered with the nearest mainland civ on E2 regardless of distance. Flag stored on `team_members.isolated_start`. Detection runs at draft completion.

**War geography (addresses "leap conquest" concern).** Per §4.5 adjacency rule, all war declarations and conquest claims require attacker-to-target sub-zone adjacency. Alliance combat support bypasses this — an ally can lend soldiers to a defender regardless of attacker's geography.

---

## 7. Random Draft System

### Purpose
Fair, auditable, and ceremonial assignment of starting sub-zones. Prevents first-come-first-served rewarding fast typers.

### Flow
1. DM clicks **Randomize Draft Order** on `/dm/game/[id]` after all students are logged in.
2. Server generates cryptographically-random permutation using `crypto.randomInt()` and Fisher-Yates. Seed stored in `games.founding_seed` for auditability.
3. Projector reveals order one name at a time with a 2-second animation beat (~30 seconds total for 15 students).
4. Student at position #1 gets 60 seconds to click any unclaimed sub-zone on their map.
5. Queue advances on claim or deadline.
6. Student at final position gets a **+10 starting resource bonus** (their choice of resource type) — compensation for last-pick position.

### API endpoints (new)
| Method | Endpoint | Auth |
|---|---|---|
| `POST` | `/api/games/[id]/founding/randomize` | Teacher |
| `GET` | `/api/games/[id]/founding/order` | Auth |
| `POST` | `/api/games/[id]/founding/claim` | Student |
| `POST` | `/api/games/[id]/founding/skip` | Teacher |

### Schema (Migration 013)
```sql
ALTER TABLE team_members
  ADD COLUMN founding_pick_order integer,
  ADD COLUMN claim_deadline timestamptz,
  ADD COLUMN claim_completed_at timestamptz;

ALTER TABLE games
  ADD COLUMN founding_seed text,
  ADD COLUMN founding_started_at timestamptz;
```

### Fairness guarantees
- Seed generated in the same transaction as `founding_pick_order` writes (prevents pre-roll attacks)
- Server-side `claim_deadline` enforcement (client countdown is visual only)
- Re-randomize blocked after first `claim_completed_at` is set
- `/founding/skip` atomic reorder — no race condition where two students think it is their turn
- **Network-drop fairness (v1.1, addresses panel finding C4):** a student whose turn is skipped due to server-side timeout (no claim received within 60 s) receives the same +10 resource bonus as the last-pick student. Detection: if `claim_completed_at` is null at timeout, log `skip_reason='timeout'` and grant bonus. This prevents WiFi hiccups from punishing children who showed up.
- **Mulligan path (v1.1, addresses §11 Decision J):** before E2 action round begins, DM has a one-click "Re-found" button on the DM panel per student. Useful for a student who picked a sub-zone by accident or had their device crash during Founding. Single-use per student per game. After E2 starts, civilization is locked.

### Projector ceremony
Drumbeat sound (via HTML5 audio) during name reveal. Each name enters large, holds 2 seconds, shrinks to queue position. The wait between names is the moment students start caring. Do not shortcut.

**Audio autoplay fix (v1.1, addresses panel finding C3):** Chrome (and all modern browsers) block HTML5 `<audio>` autoplay without a prior user gesture on the tab. The projector is a second-screen tab that does not receive user clicks. Solution: the DM runbook requires a one-time click on an "Arm Ceremony" button on the projector tab before the first name reveal (ideally during the pre-class load). If the audio context remains blocked at ceremony time, fall back to silent with a "🥁" visual glyph pulse on each name. Documented in `classroom-docs/PROJECTOR-SETUP.md` (new file, Pass 8).

---

## 8. Test Stack

Five layers. Layers 0–4. Target: Sunday-night confidence before every Monday class.

### Layer 0 — Type & build
```bash
npm run build
```
Already exists. Runs on every Vercel deploy.

### Layer 1 — Engine simulation (extend existing `simulate.ts`)
```bash
npx tsx scripts/simulate.ts --mode realms --students 15 --epochs 10 --fast
npx tsx scripts/simulate.ts --mode realms --students 20 --cinematic
npx tsx scripts/simulate.ts --mode realms --students 8 --dry-run
```
Simulates full Realms game headless. Validates engine math, state transitions, victory triggers.

### Layer 2 — Invariant assertions (add to `simulate.ts`)
After each epoch:
- `assertNoNegativeResources`
- `assertSubzoneOwnershipConsistent`
- `assertSubmissionCountMatchesEnrollment`
- `assertVictoryNotFiredEarly`
- `assertDepletionBounded`
- `assertPopulationConservation`
- `assertDiplomacyGatesEnforced` (no Propose Alliance before E4; no Declare War before E6; no Ultimatum before E4)
- `assertDraftOrderComplete`
- `assertFirstSettlerDecayApplied`

**New assertions in v1.1 (addresses panel findings, category A/B/E):**
- `assertAllianceNoCombatSupportBeforeAccept` — ally cannot contribute to battle until alliance `status='active'`
- `assertAllianceTreatyTextCaptured` — every active alliance must have non-empty `treaty_text` (supports portfolio per Guardrail 4)
- `assertBattleConsequencesMutated` — after battle resolution, loser's population, war_exhaustion, and bank columns all show expected deltas; winner's deltas match §4.5 matrix
- `assertSubZoneTransferOnlyOnAdjacency` — sub-zone cannot transfer to an attacker not holding an adjacent sub-zone (once adjacency graph loaded)
- `assertVassalStillSubmits` — vassal teams continue producing `epoch_submissions` rows every epoch; any vassal with zero submissions is a Guardrail 2 violation
- `assertConqueredCivPersists` — no team row is ever deleted as a consequence of battle; civ-name survives in team row (Guardrail 1)
- `assertVassalTributeRoutes` — liege's resource bank shows inbound tribute equal to 20% of vassal's earned resources in the epoch
- `assertNonViolentVictoryProgressVisible` — RulerDashboard render test asserts all three victory progress strips (cultural / economic / domination) render with initial values on Epoch 1 load (Guardrail 3)
- `assertPortfolioContainsProse` — portfolio generation for any team produces non-empty `founding_text` AND at least one `treaty_text` OR `justification_text` if the civ formed an alliance or issued a diplomatic action (Guardrail 4)
- `assertExhaustionCeilingConfirmation` — second war declaration when exhaustion ≥75 requires confirmation flag set in submission payload
- `assertAggressionScoreDecay` — aggression_score decrements by 5 each epoch barring new triggering events
- `assertAllianceClusterCapObserved` — no civ holds more than 2 active outbound alliances (Decision I locked at 2 in v1.2)
- `assertLiegeSeesOnlyTribute` — liege dashboard API response includes no vassal submission data, no vassal resource inventory, no vassal internal state; only resource_events where source_type='tribute' (§4.6.1, Q10 locked)
- `assertBattleAuditRowWritten` — every auto-mutation from battle resolution writes a `game_events` row with pre_state and post_state (§4.5.1, Q1 locked)
- `assertDmUndoRestoresFromPreState` — DM Undo test fixture mutates state, invokes undo, asserts state matches pre_state blob exactly

**v1.4 additions (from external audit fixes):**
- `assertGuardrail1NeverErases` (F4) — no `sub_zones.controlled_by_team_id` transfer ever leaves the losing team with zero sub-zones; simulate battles at differential ≥20 and assert loser retains ≥1 sub-zone
- `assertAllianceMinSoldierCommit` (F9) — submission with `soldiers_committed = 0` is rejected at validation layer with 400; only ally teams at zero total soldiers may omit (and then the "unable to assist" flag fires)
- `assertCasusBelliChildTableIntegrity` (F6) — a team can hold multiple unconsumed casus_belli_grants rows simultaneously; chronological grant + consumption tested
- `assertVassalageDurationMinimum` (F11) — `vassal_relationships.end_epoch` is either NULL or ≥ start_epoch + 3
- `assertAdjacencyStrictBeforeHardLive` (F18) — on any game with `total_epochs = 10` and first submission timestamp ≥ Apr 23 2026 00:00, `games.adjacency_strict = true`
- `assertEpilogueGeneratedForEveryTeam` (Decision B + §4.6.2) — every team row at end-of-game has non-empty `teams.epilogue_text` referencing at least one concrete game event from that civ's history (founding, alliance, war, betrayal, reformation, or notable resource state). No generic copy permitted.

NPC-specific assertions (`assertHaikuCallsRouteThroughWrapper`, etc.) deferred to v1.4-post-hard-live build cycle. See Appendix D.

Each assertion fails loudly with team ID + violated invariant. Catches engine regressions before real students see them.

### Layer 3 — Rehearsal game (real UI, fake students)
```bash
npx tsx scripts/create-rehearsal-game.ts
# prints 5 logins and a game ID
# ...open 5 browser tabs, walk the flow...
npx tsx scripts/create-rehearsal-game.ts --cleanup [gameId]
```

**New additions:**
- `games.is_rehearsal` column (Migration 014) gates special UI
- DM **Fast-Forward Epoch** button (visible only on rehearsal games) auto-scores pending submissions at deterministic 3/5 and advances. Runs 10 epochs in two minutes.
- Student dashboard **Fill & Submit** button (visible only on rehearsal games) auto-fills a reasonable decision.
- Cleanup deletes both Supabase rows and Clerk test accounts.

### Layer 4 — Snapshot-diff testing
```bash
npx tsx scripts/snapshot-check.ts --fixture realms-15 --checkpoint post-founding
npx tsx scripts/snapshot-check.ts --fixture realms-15 --all
```

Dumps game state at three checkpoints (post-Founding, post-Epoch-5, post-Endgame) to JSON. Compares to committed golden files in `tests/golden/`. Deterministic seed (`test-fixture-001`) always produces the same draft order. Any diff = regression.

### Sunday-night protocol (30–40 minutes)
```bash
# 1. Headless sanity
npx tsx scripts/simulate.ts --mode realms --students 15 --fast

# 2. Invariants
npx tsx scripts/simulate.ts --mode realms --students 15 --fast --assert

# 3. Golden snapshots
npx tsx scripts/snapshot-check.ts --fixture realms-15 --all

# 4. Build
npm run build

# 5. Rehearsal game
npx tsx scripts/create-rehearsal-game.ts
# Open 5 tabs, walk flow for ~10 min

# 6. Cleanup
npx tsx scripts/create-rehearsal-game.ts --cleanup [gameId]
```

Every Sunday through May 17.

---

## 9. Migrations Required

All migrations go into `supabase/migrations/` and are applied via `scripts/run-migration.ts` or the Supabase SQL editor.

> **⚠️ Renumbered in v1.5 (Apr 21 night).** The v1.4 plan numbered Realms migrations 009–013. While the plan was being revised, Scott's parallel work pushed `009_submissions_delete_policy.sql` and `010_clear_submissions_function.sql` to remote. Realms migrations renumbered to **011–015** to avoid collision. Existing 009/010 are classroom-safety fixes for the current `epoch_submissions` table (DELETE policy + clear-submissions RPC function); they are prerequisites but require no Realms-specific change.

### Migration 011 — `add_compression_config.sql`
```sql
ALTER TABLE games
  ADD COLUMN total_epochs integer NOT NULL DEFAULT 10,
  ADD COLUMN current_template text NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN finale_triggered boolean NOT NULL DEFAULT false;
```

### Migration 012 — `add_game_mode.sql`
```sql
ALTER TABLE games
  ADD COLUMN game_mode text NOT NULL DEFAULT 'team'
    CHECK (game_mode IN ('team', 'realms'));

ALTER TABLE teams
  ADD COLUMN is_solo boolean NOT NULL DEFAULT false;
```

### Migration 013 — `add_founding_draft.sql`
See Section 7.

### Migration 014 — `add_rehearsal_flag.sql`
```sql
ALTER TABLE games
  ADD COLUMN is_rehearsal boolean NOT NULL DEFAULT false,
  ADD COLUMN test_fixture_name text;
```

### Migration 015 — `add_alliances_and_reputation.sql` (NEW in v1.1)
Adds alliance schema, reputation/aggression columns, isolated-start flag, adjacency configuration, and the domination victory type.

```sql
-- NPC columns removed in v1.4 (NPCs deferred — see §4.7). They will return in Migration 014 post-hard-live.

-- Alliance system (addresses panel finding A1, A2)
CREATE TABLE alliances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  proposer_team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  target_team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending','active','broken','rejected','expired')),
  treaty_text text NOT NULL,
  proposed_epoch integer NOT NULL,
  accepted_epoch integer,
  broken_epoch integer,
  rejected_epoch integer,
  proposed_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  broken_at timestamptz,
  rejected_at timestamptz,
  CHECK (proposer_team_id <> target_team_id)
);

CREATE INDEX idx_alliances_game_status ON alliances(game_id, status);
CREATE INDEX idx_alliances_proposer_active ON alliances(proposer_team_id) WHERE status = 'active';
CREATE INDEX idx_alliances_target_active ON alliances(target_team_id) WHERE status = 'active';

-- Reputation / aggression (addresses B7, E4)
ALTER TABLE teams
  ADD COLUMN reputation_score integer NOT NULL DEFAULT 0,
  ADD COLUMN aggression_score integer NOT NULL DEFAULT 0;

-- Casus belli grants (F6 fix, v1.4 — child table replaces single-UUID column so a civ can hold multiple outstanding grants)
CREATE TABLE casus_belli_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holder_team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  grantor_team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  granted_epoch integer NOT NULL,
  expires_epoch integer NOT NULL,
  consumed boolean NOT NULL DEFAULT false,
  consumed_at timestamptz,
  CHECK (holder_team_id <> grantor_team_id)
);

CREATE INDEX idx_casus_belli_holder_unconsumed ON casus_belli_grants(holder_team_id) WHERE consumed = false;

-- Vassal duration semantics (F11 fix, v1.4)
-- `vassal_relationships` already has `start_epoch` and `end_epoch`.
-- Semantics now explicit: `end_epoch` is the negotiated duration's end. Vassalage auto-dissolves when `current_epoch > end_epoch`. If `end_epoch IS NULL`, vassalage is open-ended (revolt after 3 epochs per §4.5). `end_epoch` minimum = start_epoch + 3 to prevent "0-duration" vassalage exploits.
ALTER TABLE vassal_relationships
  ADD CONSTRAINT vassal_duration_minimum CHECK (end_epoch IS NULL OR end_epoch >= start_epoch + 3);

-- Isolated start compensation (addresses Madagascar problem)
ALTER TABLE team_members
  ADD COLUMN isolated_start boolean NOT NULL DEFAULT false;

-- Adjacency configuration (addresses geographer finding)
CREATE TABLE sub_zone_adjacencies (
  sub_zone_a_id uuid NOT NULL REFERENCES sub_zones(id) ON DELETE CASCADE,
  sub_zone_b_id uuid NOT NULL REFERENCES sub_zones(id) ON DELETE CASCADE,
  edge_type text NOT NULL CHECK (edge_type IN ('land','coastal','naval_required','impassable')),
  PRIMARY KEY (sub_zone_a_id, sub_zone_b_id),
  CHECK (sub_zone_a_id <> sub_zone_b_id)
);

ALTER TABLE games
  ADD COLUMN adjacency_strict boolean NOT NULL DEFAULT false;

-- Victory type addition (addresses B8)
-- victory_type enum extended in application code; no DB constraint change needed if stored as text.
-- If enum type: ALTER TYPE victory_type_enum ADD VALUE 'domination';
```

### Deploy order
011 → 012 → 013 → 014 → 015. Each applied in sequence. 013 has no cross-dependencies on 009–012 but shares the same window. Apply all five in a single Tuesday evening session per the §10 calendar.

---

## 9.5. Build Order — Eight Passes (v1.1)

**Context.** At Opus 4.7 build rate with Scott as director, the full thirty-seven-item panel scope plus the four original migrations plus Iteration 1 cleanup equals approximately **5–7 hours of focused session time**. This section defines the sequence. Each Pass has a clear gate; no Pass ships unless its gate is green.

**Operational rule:** Passes 1 → 8 are ordered so each layer stands on the previous. Do not reorder without updating the dependency graph at the end of this section.

### Pass 1 — Schema & Gates (≈25 min)
**Ships:** Migrations 011 + 012 + 013 + 014 + 015. Epoch-gating enforced in submission validation layer (`src/app/api/games/[id]/submissions/route.ts`).
**Gate:** `npm run build` clean. `SELECT * FROM alliances` returns empty set (confirms table exists). Submission POST with `type='declare_war'` and `epoch < 6` returns 403 with "Wars unlock at Epoch 6" message.

### Pass 2 — Battle-to-DB Hook & Domination Victory (≈35 min)
**Ships:** Battle-resolver.ts result object now consumed by a new endpoint `POST /api/games/[id]/battles/resolve` that atomically mutates population, war_exhaustion, bank_delta, sub_zone ownership, and (if triggered) creates vassal relationship. Victory-engine.ts adds domination victory type per §4.5.
**Gate:** `assertBattleConsequencesMutated` passes on simulate.ts. Manual smoke: DM resolves a battle in rehearsal game → loser's population decrements on dashboard within 1 s.

### Pass 3 — DEFINE Round Submission Options (≈25 min, v1.4 reverted to v1.2 scope)
**Ships:** Seven diplomat submission types per §4.4, validation in place, DM-scoring path wired. API routes:
- `POST /api/games/[id]/alliances/propose`
- `POST /api/games/[id]/alliances/[allianceId]/respond`
- `POST /api/games/[id]/alliances/[allianceId]/break`
- `POST /api/games/[id]/battles/declare` (creates conflict flag, triggers Pass 2 resolve path)
- `POST /api/games/[id]/peace/sue`
- `POST /api/games/[id]/ultimatums/issue`
- `POST /api/games/[id]/vassalage/propose`

**Gate:** `assertDiplomacyGatesEnforced`, `assertAllianceTreatyTextCaptured`, `assertAllianceClusterCapObserved` pass. NPC AI work deferred to v1.4-post-hard-live per §4.7.

### Pass 4 — Realms UI Components (≈110 min, v1.5 reduced — RegionPickerMap/RegionSelectCard already ship)
**Ships:** RulerDashboard, DiplomacyPanel (with grayed-locked state per Mira's C2 finding), DraftCeremony (with Arm-Ceremony audio fix per C3), ContactMap (with pulse+dotted-edge state per C5). Conquered-civ name persistence rendered per §4.6 Guardrail 1. Adjacency seed data hand-authored and loaded (≈60-min sub-task); `games.adjacency_strict = true` MUST be set before Thu Apr 23 hard-live (F18 gate).

**v1.5 scope reduction:** `FoundingClaim.tsx` is no longer needed — `RegionSelectCard.tsx` + `RegionPickerMap.tsx` already ship in `src/components/game/` and cover the draft flow comprehensively (civ naming + region claim in a unified two-step UI). Pass 4 budget drops from ≈150 min to ≈110 min. Remaining UI work is RulerDashboard + DiplomacyPanel + DraftCeremony + ContactMap + adjacency seed.

**Gate:** `assertNonViolentVictoryProgressVisible` passes. Rehearsal game with 5 fake students walks full E1 → E6 flow without console errors. All four §4.6 Guardrails assert-passing. `games.adjacency_strict = true` verified in DB before hard-live (F18).

### Pass 5 — Vassal UI & Continuity (≈30 min)
**Ships:** Vassal state branches in RulerDashboard (liege-banner overlay, tribute-routing indicator, restricted DEFINE round with "cannot declare war while vassal" tooltip, revolt option after 3 epochs). Tribute-routing hook in yield-calculator.ts.
**Gate:** `assertVassalStillSubmits`, `assertConqueredCivPersists`, `assertVassalTributeRoutes` pass. Manual smoke: in rehearsal game, force a battle with score-differential ≥20, loser accepts vassalage → vassal dashboard still shows all round prompts in the next epoch.

### Pass 6 — Iteration 1 Cleanup (≈15 min)
**Ships:** Original four items from §3. Classroom docs copied from stale sibling to canonical. Haiku model ID updated. Nuke-script env-var refactor + rename. Middleware log trim.
**Gate:** Original Iteration 1 gate. Slots in after Pass 5 or any earlier breathing room.

### Pass 7 — Test Stack Extension (≈45 min)
**Ships:** Realms mode in simulate.ts. Invariant assertions (the full list from §8 including all v1.1 additions). Golden snapshot fixtures for realms-15 and realms-20 at post-founding / post-E5 / post-endgame.
**Gate:** Sunday-night protocol runs green end-to-end in <45 min on a clean dev database.

### Pass 8 — Classroom Ops Package (≈30 min, v1.5 reduced — DM panels already ship)

**v1.5 scope reduction:** `DMDebugPanel.tsx`, `DMRosterPanel.tsx`, and `dm-log.ts` already ship. Pass 8 docs/ops work drops from ≈45 min to ≈30 min. The two routes referenced by DMRosterPanel (`/api/games/[id]/auto-covers`, `/api/games/[id]/covers`) are still needed and move to Pass 1 scope.

### Pass 8 — Classroom Ops Package (original spec retained below)
**Ships:** Updated DM runbook with v1.1 mechanics. Substitute playbook (`classroom-docs/SUB-PLAYBOOK.md` — what Mrs. Andersson does if Scott is out). IEP accommodation notes (text-to-speech, simplified mode, peer support patterns). Parent-facing one-pager (`classroom-docs/PARENT-ONE-PAGER.md` — ready by Apr 24). Crisis communication script for emotional incidents (`classroom-docs/CRISIS-SCRIPT.md` — DM undo button wording, narrative cover templates). DM undo button on DMControlBar: reverses last battle or last diplomatic action in the current epoch, creates `game_events` audit row.
**Gate:** All eight docs exist and are linked from the top-level README.

### Pass dependency graph
```
Pass 1 ──► Pass 2 ──► Pass 3 ──► Pass 4 ──► Pass 5 ──► Pass 7
                │                                        ▲
                └────────────────────────────────────────┘
                (simulate.ts extension depends on Pass 2)

Pass 6 independent — slots anywhere after Pass 1.
Pass 8 independent — documentation-only, slots after Pass 4 or later for runbook accuracy.
```

### Total
**v1.4 (prior): ≈5h 40m.**
**v1.5 (current): ≈5h 5m.** v1.4 − 40 min Pass 4 reduction (FoundingClaim superseded by existing RegionSelectCard + RegionPickerMap) − 15 min Pass 8 reduction (DMDebugPanel + DMRosterPanel + dm-log.ts already ship) + 20 min Pass 1 addition (auto-covers and covers routes referenced by DMRosterPanel but not yet built; also migration renumber 009→011). All 37 panel items still addressed. All 4 ship-blockers (F1–F4) still resolved. NPC work still deferred per §4.7 and Appendix D.

---

## 10. Calendar — April 21 to May 24

### Build week (v1.4 — rewritten against actual teaching-day windows per F1)

**Scott's real availability (from audit F1):** Wednesday Apr 22 is a teaching day. Period 4 (12:25–1:25) and Period 7 (2:20–3:05) are in-classroom. Scott's Wednesday build windows are: (a) 6:00–7:30 AM before school, (b) a single ~45-min prep period mid-day, (c) 3:30 PM onward (post-school bell).

| Day / Window | Work | Gate |
|---|---|---|
| **Tue Apr 21 evening** (tonight, ≈3h) | **Build session 1: Passes 1 + 2 + 3 (v1.2 scope, no NPCs).** Migrations 011–015 (with v1.4 F6 casus_belli_grants child table + F11 vassal duration constraint), epoch gates enforced, battle-to-DB auto-mutation + audit-log rows (Q1), DEFINE submission options + seven API routes, F9 min-soldier-commit validation, F4 Guardrail-1 last-sub-zone preservation in battle-resolver. | Schema + gates + battle + submissions all green in simulate.ts. `assertGuardrail1NeverErases` + `assertAllianceMinSoldierCommit` green. |
| **Wed Apr 22 6:00–7:30 AM** (pre-school, ≈1.5h) | **Build session 2a: Pass 4 start.** RulerDashboard, DiplomacyPanel (grayed-locked state), FoundingClaim (scaffolded input), DraftCeremony (Arm-Ceremony audio fix), ContactMap. | Components render without errors in dev server. |
| **Wed Apr 22 prep period (60 min, per Decision U)** | **Adjacency seed data authoring.** Scott hand-authors the sub_zone_adjacencies JSON seed (~100 items across 72 sub-zones). Load with `scripts/load-adjacency.ts`. Set `games.adjacency_strict = true`. | `assertAdjacencyStrictBeforeHardLive` pathway satisfied. 80+ adjacency edges loaded. |
| **Wed Apr 22 3:30–5:30 PM** (post-school, ≈2h) | **Build session 2b: Passes 5 + 6 + 8.** Vassal UI with tribute-only liege view (Q10), Iteration 1 cleanup (per F20 `ls -la` inventory of classroom-civ before delete), PARENT-ONE-PAGER.md drafted + **admin CC required** (F13) — email to parents Wed 7:00 PM only after admin sign-off. Mr. Somers-zilla crisis copy. DM undo button. **Rollback play (F14) authored:** one-page desk doc covering "Period 4 Epoch 1 breaks — options A/B/C, decision tree, who to call." | Vassal privacy asserts green. Admin sign-off on parent email. Rollback play printed on Scott's desk. Deploy to Vercel. |
| **Wed Apr 22 5:30–6:30 PM** | **Soft-live rehearsal.** Scott runs a 5-tab rehearsal game end-to-end solo, walking Founding → E6 flow on the deployed Vercel build. Any breakage captured in a hotfix list. | No crashes. Feedback captured. |
| **Wed Apr 22 6:30–9:30 PM** (evening, ≈3h) | **Build session 3: Pass 7 + hotfix + F24 rehearsal portfolio.** Test stack extension, golden snapshots, any soft-live breakage repaired. **Rehearsal portfolio PDF generated from the rehearsal-game fixture** — first test of `generate-portfolios.ts` happens NOW, not on May 7 (F24 fix). Scott reviews the rehearsal PDF personally. | Sunday-night protocol runs green end-to-end. A real PDF has been generated and read. Zero known bugs. |
| **Thu Apr 23 Period 4 (12:25–1:25)** | **HARD-LIVE, Class 1 (6th grade, 15 students).** **Epoch 1 is FOUNDING-ONLY per F3.** Draft ceremony (~10 min), claim window (~12 min), founding prose writing (~10 min), DM framing (~3 min). No BUILD/EXPAND/DEFINE/DEFEND rounds on Thursday. | All 15 team rows have founding submissions and claimed sub-zones. Projector event log clean. Rollback play untouched (ideally). |
| **Thu Apr 23 Period 7 (2:20–3:05)** | **HARD-LIVE, Class 2 (7/8 grade, 20 students).** Same Founding-only scope. 20 students in 45 min is even tighter — Scott may accelerate the claim window or split the draft into two cohorts of 10. | All 20 team rows have founding submissions and claimed sub-zones. |
| **Fri Apr 24** (both classes) | **Epoch 1 completion + Epoch 2 start.** BUILD / EXPAND / DEFINE / DEFEND rounds for each civ now run, picking up from the Founding-only Thursday session. Epoch 2 (First Light) if there is time remaining. | Each class completes the full 4-round submission cycle at least once. |
| **Mon Apr 27** | Epoch 2 or 3 — depending on Friday's pace. If Thursday-Friday split caused lag, catch up here. | Both classes at same epoch by end of day. |
| **Tue Apr 28** | **Epoch 4 — Alliances Unlock.** DiplomacyPanel activates. | First alliance proposals observed. |
| **Wed Apr 29** | Epoch 5 — First Crisis. Mr. Somers-zilla OR Plague OR Famine. | Crisis resolution captured in `game_events`. |
| **Thu Apr 30** | **Epoch 6 — Wars Unlock.** First betrayal events possible next epoch. | `assertDiplomacyGatesEnforced` holds through E6 threshold. |
| **Fri May 1** | Epoch 7 — Trade Winds. Reformation option available. | |
| **Mon May 4** | Epoch 8 — Wonders. | |
| **Tue May 5** | Epoch 9 — The Reckoning. | |
| **Wed May 6** | **Epoch 10 — Endgame.** Finale on projector. Victory engine resolves. Replay begins. | Both classes complete E10 with named winners. |
| **Thu May 7** | Portfolios generated and printed overnight as PDFs (Q15). Pipeline already dry-run Apr 22, so this is routine. | PDFs generated for every child in both classes. |
| **Fri May 8** | **Portfolios handed to each child in person.** Debrief / story-sharing day. | Every child has received her printed PDF in hand. |

**Notes on the v1.4 rewrite:**
- Wednesday Apr 22 is now correctly modeled as a teaching day. Build sessions fit Scott's actual windows (before school, prep period, after school). Soft-live rehearsal is Scott-solo in a 5-tab session, not real-students.
- **Epoch 1 on Thu Apr 23 is Founding-only** per F3. The full 4-round epoch structure begins Fri Apr 24 as "E1 completion + E2 start."
- **Parent email requires admin CC** (F13). No email sends without principal or front-office sign-off.
- **Rehearsal portfolio PDF generated Apr 22** (F24), not left to May 7.
- **Rollback play authored Wed afternoon** (F14) on Scott's desk before hard-live.
- **`games.adjacency_strict = true` is a hard-live gate** (F18). Adjacency seed must load during Wednesday prep period.
- Build total: ≈5h 40m across three sessions Tue evening / Wed morning / Wed afternoon / Wed evening.
- Buffer days preserved. If Friday Apr 24 Epoch 1 completion slips, Monday absorbs it.
- **Never deploy to Vercel Fri 3 PM → Sun 8 PM** remains in force. Wed Apr 22 deploy is the last production push until Thu Apr 23 morning if a hotfix is required pre-hard-live.

> **Earlier weekly tables removed in v1.2.** The pre-compression weekly tables (Apr 27 / May 4 / May 11 / May 18) previously documented a Mon Apr 27 → Tue May 12 arc. The compressed Thu Apr 23 → Fri May 8 arc in the table above supersedes them. Single source of truth.

### Post-finale: weeks of May 11, May 18, and May 22

| Week | Focus |
|---|---|
| May 11 – May 15 | **Buffer + reteach week.** If E10 slipped to Mon May 11, it runs here. Otherwise: extension activities, student civilization presentations, parent-facing showcase (optional). Scott prepares the teacher-side lessons-learned doc. |
| May 18 – May 22 | **Contract wind-down.** Final week of classroom instruction. Confirm every child received her printed PDF portfolio (the hard deadline is Friday May 22). Repo cleanup: archive the two Realms games to `archived_realms_games` table, preserve team games in on-hold state per Decision E. Export the replay data for summer review. |
| May 23 – May 24 | Contract officially ends May 24. All classroom deliverables closed. Scott shifts focus to summer work — NCHO support and SomersSchool build. |

### Hard rules
- **Never deploy to Vercel between Friday 3 PM and Sunday 8 PM.** If something breaks Saturday it cannot be smoke-tested with real traffic.
- **Never apply a migration during a school day.** Migrations run Sunday night or after 4 PM on weekdays.
- **Buffer days are sacred.** They are not feature days. If a session is missed, the buffer absorbs it.

---

## 11. Open Decisions

**v1.2 status: all decisions except B and C are LOCKED.** B and C remain open per their original needed-by dates.

| # | Decision | Status | Resolution |
|---|---|---|---|
| A | Bank-decay rate | ✅ **LOCKED** | **5%** — compressed economy for 10-epoch arc |
| B | Victory outcome frame | ✅ **LOCKED — Option 1 with positive-narrative-for-losers** | Engine declares winners by victory type (Cultural / Economic / Domination) and standings are real. Every non-winning civilization receives a dignifying narrative epilogue rooted in her own words — founding prose, treaty texts, casus belli, reformation choices. Losing is real; erasure is not. See new §4.6.2 for the spec. |
| C | Scripted finale wording per enrollment size (15 and 20 versions) | ⏳ OPEN | Needed by Fri May 1. Scott drafts from `classroom-docs/finale-template.md`. |
| D | Product name — "Realms" is placeholder | ✅ **LOCKED** | Stays "Realms" in code identifiers. Marketing name can diverge later. |
| E | Whether to preserve current team-based games or archive before seeding Realms | ✅ **LOCKED** | **On hold, not archived.** Realms is a new game entirely — no epilogue inheritance from team games. Team games remain in DB untouched (Scott may resume post-contract if desired). No state merge. |
| F | Adjacency graph data source | ✅ **LOCKED** | Hand-author JSON seed for the 72 sub-zones. `supabase/seed/sub_zone_adjacencies.sql`. |
| G | Region yield bonuses enabled at ship | ✅ **LOCKED** | Enable with conservative values (+15–25%). Flag `games.region_yields_enabled = true` at seed. Rollback flag preserved. |
| H | Soft-live on Wed Apr 22 — real students or rehearsal only | ✅ **LOCKED** | **Wed Apr 22 = SOFT-LIVE with real students** (preview/rehearsal epoch, no score persistence). **Thu Apr 23 = HARD-LIVE, Epoch 1 real, score-persistent.** Goal for Wed: smooth. Bugs caught Wed are hotfixed Wed evening. |
| I | Alliance cluster cap | ✅ **LOCKED** | Max **2 active outbound alliances per civ.** Forces harder diplomatic choices; reduces 4-way-dogpile risk. `assertAllianceClusterCapObserved` default = 2. |
| J | Mulligan / re-found path | ✅ **LOCKED** | DM one-click re-found button per student, single-use, locked after E2 starts. |
| K | Kaiju rename | ✅ **LOCKED** | **"Mr. Somers-zilla."** Classroom-specific in-joke. Mechanical behavior unchanged (global crisis, same damage profile). Copy voice is teacher-personal, not mythic-neutral — specific to this classroom. Historian's "Beast That Walked" suggestion overridden by Scott. |
| L | Reformation submission | ✅ **LOCKED — use as written** | Scott confirmed v1.4 after re-explanation. Reformation is available during the **BUILD round** as a special submission option once per civilization per game, unlocked at Epoch 7 (mid-game). Costs 20 Legacy; recovers 10 resilience; loses 5 population (schism attrition). Comeback path from Dark Age or proactive cultural pivot. See §5. |
| M | Non-violent victory dashboard copy | ✅ **LOCKED** | "Your civilization can triumph through wisdom (Cultural), wealth (Economic), or might (Domination). All three paths are open to you." Visible on RulerDashboard from Epoch 1 per Guardrail 3. |
| N | Substitute-teacher runbook technical floor | ✅ **LOCKED** | Zero coding background assumed. Mouse-and-click only. All DM operations through `/dm/` web UI. No terminal commands. Written for Mrs. Andersson or front-office staff. |
| O | **NPC formal DM pre-approval queue for projector prose** | ⏸️ **DEFERRED with NPC scope to v1.4-post-hard-live** | Decisions P, Q, R below remain semantically locked per Scott's answers — they apply when NPC work resumes. Decision O is now understood as **in-scope for v1.4 NPC build**, not deferred past it (audit clarified that Mrs. Andersson as a substitute cannot reflexively DM-Undo an off-tone NPC event). |
| P | NPC dynamic target civ count range | ⏸️ **DEFERRED (preserved for v1.4)** | Minimum 10, maximum 25. DM sets per game via slider at game-create. Default: `max(12, enrollment + ceil(enrollment × 0.25))` clamped to [10, 25]. Locked as a design decision; code lives in v1.4. |
| Q | NPC AI controller | ⏸️ **DEFERRED (preserved for v1.4)** | Hybrid: rule-layer decision trees for routine actions, Haiku (`claude-haiku-4-5-20251001`) for diplomatic prose. All Haiku calls route through `src/lib/ai/student-safe-completion.ts` **which must be built as part of v1.4 NPC work** (the file does not currently exist in this repo per F2). |
| R | NPCs can win victories | ⏸️ **DEFERRED (preserved for v1.4)** | Yes. All three victory types. No handicap, no cap. Rationale preserved. |
| S | Roster firstname collision check (F15) | ✅ **LOCKED** | Scott confirmed: no duplicate first names in either Period 4 (6th, 15 students) or Period 7 (7/8, 20 students) rosters. Clerk usernames = first name only, per original Decision 83. No collision mitigation required. |
| T | Period 7 Epoch 1 draft compression (F3 follow-up) | ✅ **LOCKED — Option B (parallel cohorts)** | Split Period 7's 20 students into two cohorts of 10. Cohort 1 claims sub-zones via draft order while Cohort 2 writes Founding prose on Chromebooks. Swap after ~18 min. Projector shows the active cohort's draft; Cohort 2 writes against a slide-deck prompt. Total: 10-min intro + 18-min Cohort-1-draft + 18-min Cohort-2-draft + 2-min closing ≈ 48 min (vs 45-min period). Fits cleanly if Scott opens the laptops before the bell. |
| U | Wednesday prep-period length (F1 follow-up) | ✅ **LOCKED — 60 min** | Scott confirmed 1-hour prep period mid-day Wednesday. Adjacency seed authoring + load fits with margin. Previous §10 estimate of 45 min is revised upward; no change to the build plan is required. |

### 11.1 Operational Q-lock log (Q1–Q17) — Apr 21 evening

For future-Scott audit trail:

| Q | Topic | Scott's call | Lives in |
|---|---|---|---|
| Q1 | Battle resolution auto-commit | Fully automatic, logged in `game_events` | §4.5.1 |
| Q2 | Current team games | On hold, new game for Realms (not archived-for-epilogue) | Decision E |
| Q3 | Domination weights | Accepted as proposed | §4.5 |
| Q4 | Bank-decay rate | Compressed 5% | Decision A |
| Q5 | Backstab cost sufficient | Yes | §4.5 (no change) |
| Q6 | Alliance combat support | Subset-declared soldiers | §4.5 Alliance Combat Support row |
| Q7 | Vassal tribute | Negotiable (10–30%) | §4.5 Vassalage row |
| Q8 | Alliance cluster cap | 2 | Decision I |
| Q9 | Betrayal event projector | Public, full drama treatment | §4.5.2 |
| Q10 | Liege's view of vassal | Only tribute-in, nothing else | §4.6.1 |
| Q11 | Live dates | Wed Apr 22 soft / Thu Apr 23 hard | §10 rewritten |
| Q12 | Adjacency seed source | Hand-author JSON | Decision F |
| Q13 | Region yields at ship | Enable conservative | Decision G |
| Q14 | Dashboard victory copy | Approved as drafted | Decision M |
| Q15 | Portfolio medium | Printed PDF | §10 + §13 |
| Q16 | Sub-runbook tech floor | Zero-coding | Decision N |
| Q17 | DM Undo scope | Technical bug-repair only, not emotional comfort | §10 + §4.5.1 + new §11.2 |

### 11.2 DM Undo scope (Q17 locked — "this is life")

The DM Undo button is a **technical tool for reversing a buggy or accidentally-triggered resolution**, not an emotional comfort tool. The game has real consequences. A child who loses a battle, loses a sub-zone, or is publicly betrayed on the projector has *lost*, and the appropriate classroom response is the narrative frame of the game itself — her civilization endures (Guardrail 1), she still plays (Guardrail 2), she has other victory paths (Guardrail 3), and her words appear in her portfolio (Guardrail 4).

**DM Undo is for:**
- A battle that resolved against the wrong target due to a UI misfire
- A declaration submitted by the wrong child (e.g., device left logged in)
- An auto-mutation that violated an adjacency rule the engine should have blocked
- A DM-entered score that was wrong (e.g., keyed 5 when meant 3)

**DM Undo is NOT for:**
- A child who is upset about a legitimate outcome
- A child who wants a do-over on a strategic choice
- "Undoing" a public betrayal event because it was emotionally loud — that is the game working as designed

**Editorial note (Polgara):** "Fierce care is not the same as softness. Your child can handle losing. What your child cannot handle is being erased. The game refuses to erase her; it does not refuse to test her."

**Implementation:** DM Undo button writes a new row to `game_events` with `event_type = 'dm_undo'`, pointer to the original event row, and DM's justification text (required, min 10 characters). The engine restores from the original event's `pre_state` blob. All undos are audited and appear in the post-game replay.

---

## 12. Deferred Items (Post-Contract)

Not built in this cycle. Revisit summer 2026 when Realms moves toward public launch.

- **Iteration 2** — Public-endpoint hardening: auth/rate-limit on `/api/solo/create`, security headers in `next.config.ts`, middleware log cleanup beyond basic.
- **Iteration 3** — RLS tightening on student-authored tables. Required before any non-classroom deployment.
- **Iteration 4** — Central AI safety wrapper (`src/lib/ai/safe-completion.ts`). Required before accepting unmoderated user text into prompts.
- **Iteration 5** — Migration hygiene: move `007_reset_game_data.sql` to `scripts/archived-one-shots/`.
- **Iteration 6** — CI via GitHub Actions running `simulate.ts --dry-run --epochs 3` on every PR.
- **Phases 7–14 from original BUILD-PLAN.md** — Purchase Menu UI, Tech Tree UI, Wonder UI, full HeyGen video integration, full NPC UI, Portfolio Export beyond current HTML, math gate UI polish.
- **Dual-civ mode** for classes under 8 students.
- **v1 (Team) compression variant** — if any team-based classroom ever needs a <6-week run.

---

## 13. File-Level Change List

Expected new and modified files. Actual count may shift during build.

### New files
```
classroom-docs/
  DAY-1-DM-RUNBOOK-6TH.md              (copied from stale sibling, Pass 6)
  DAY-1-STUDENT-GUIDE-6TH.md           (copied, Pass 6)
  TEAM-ROSTERS.md                      (copied, Pass 6)
  finale-template.md                   (Scott writes, Pass 8)
  finale-e4.md                         (Scott writes by May 1)
  finale-e6.md                         (new)
  finale-e8.md                         (new)
  finale-e10.md                        (new)
  PROJECTOR-SETUP.md                   (NEW v1.1 — Arm Ceremony audio instructions, Pass 8)
  SUB-PLAYBOOK.md                      (NEW v1.1 — substitute teacher runbook, Pass 8)
  PARENT-ONE-PAGER.md                  (NEW v1.1 — parent-facing Realms explainer, Pass 8, email Wed Apr 22 per v1.2)
  CRISIS-SCRIPT.md                     (NEW v1.1 — DM undo wording + narrative covers, Pass 8)
  IEP-ACCOMMODATIONS.md                (NEW v1.1 — text-to-speech, simplified mode, peer support, Pass 8)

supabase/migrations/
  011_add_compression_config.sql
  012_add_game_mode.sql
  013_add_founding_draft.sql
  014_add_rehearsal_flag.sql
  015_add_alliances_and_reputation.sql (NEW v1.1 — alliance schema + reputation + adjacency + isolated_start)

supabase/seed/
  region_yields.sql                    (NEW v1.1 — region-specific yield bonuses, Pass 4)
  sub_zone_adjacencies.sql             (NEW v1.1 — adjacency edge list, Pass 4)

(Draft/founding flow — v1.5 reconciliation:)
  ✅ EXISTS: src/app/api/games/[id]/randomize-draft/route.ts
    → Fisher-Yates shuffle of `teams.draft_order`. Supersedes the plan's `/founding/randomize`
      endpoint. Uses `teams.draft_order` (integer) rather than the originally-planned
      `team_members.founding_pick_order`. Simpler schema, already working.
  ✅ EXISTS: src/app/api/games/[id]/presence/route.ts — student heartbeat (updates team_members.last_seen_at)
  ✅ EXISTS: src/app/api/games/[id]/reset/route.ts — teacher-only full game reset (includes draft reshuffle)
  ✅ EXISTS: src/app/api/games/[id]/roster/route.ts — DM live roster with presence + cover assignments

  Realms still to build (Pass 1 / Pass 3):
  ⏳ src/app/api/games/[id]/founding/order/route.ts (GET) — student queries whose turn it is
  ⏳ src/app/api/games/[id]/founding/claim/route.ts (POST) — student submits founding text + locks turn
  ⏳ src/app/api/games/[id]/founding/skip/route.ts (POST) — DM skips a student whose turn timed out
  ⏳ src/app/api/games/[id]/auto-covers/route.ts (POST) — referenced by DMRosterPanel but not shipped
  ⏳ src/app/api/games/[id]/covers/route.ts (DELETE) — referenced by DMRosterPanel but not shipped

src/app/api/games/[id]/alliances/      (NEW v1.1 — Pass 3)
  propose/route.ts
  [allianceId]/respond/route.ts
  [allianceId]/break/route.ts

src/app/api/games/[id]/battles/        (NEW v1.1 — Pass 2 + 3)
  declare/route.ts
  resolve/route.ts

src/app/api/games/[id]/peace/          (NEW v1.1 — Pass 3)
  sue/route.ts

src/app/api/games/[id]/ultimatums/     (NEW v1.1 — Pass 3)
  issue/route.ts

src/app/api/games/[id]/vassalage/      (NEW v1.1 — Pass 3 + 5)
  propose/route.ts
  [relationshipId]/respond/route.ts
  [relationshipId]/revolt/route.ts

(NPC-related files — `src/app/api/games/[id]/npc/*`, `src/lib/game/npc-ai.ts`, `src/lib/game/npc-spawn.ts`, `src/lib/ai/npc-haiku.ts`, `src/lib/ai/npc-fallback-copy.ts`, `src/lib/ai/student-safe-completion.ts` — all deferred to v1.4-post-hard-live per §4.7. The wrapper file does not currently exist in this repo per F2.)

src/components/dashboard/
  RulerDashboard.tsx                   (⏳ Pass 4 — student main dashboard with 3 victory progress strips per Guardrail 3 — STILL NEEDS BUILDING)

src/components/game/                   (v1.5 reconciliation — existing draft UI)
  ✅ RegionPickerMap.tsx                (Leaflet map with 12 regions; supersedes planned map layer of FoundingClaim)
  ✅ RegionSelectCard.tsx               (two-step draft flow: civ name → region claim; supersedes FoundingClaim.tsx entirely)

src/components/dm/                     (v1.5 reconciliation — existing DM tooling)
  ✅ DMDebugPanel.tsx                   (event log with filters; covers part of Pass 8 DM debug surface)
  ✅ DMRosterPanel.tsx                  (live attendance + role coverage; covers part of Pass 8 DM tooling)

src/lib/
  ✅ dm-log.ts                          (singleton event logger; used by DMDebugPanel)

src/components/realms/
  DiplomacyPanel.tsx                   (⏳ Pass 4 — grayed-locked preview per C2 — STILL NEEDS BUILDING)
  VassalBanner.tsx                     (⏳ Pass 5 — liege-banner overlay + tribute indicator — STILL NEEDS BUILDING)
  (FoundingClaim.tsx — REMOVED v1.5; superseded by RegionSelectCard.tsx above)

src/components/projector/
  DraftCeremony.tsx                    (Pass 4 — with Arm Ceremony audio fix per C3)
  ContactMap.tsx                       (Pass 4 — with pulse+dotted-edge state per C5)

scripts/
  create-rehearsal-game.ts             (Pass 7)
  snapshot-check.ts                    (Pass 7)
  load-adjacency.ts                    (NEW v1.1 — Pass 4 — seeds sub_zone_adjacencies from JSON)
  generate-portfolios.ts               (NEW v1.2 — Pass 7/8 — generates per-child PDF portfolio for print, Q15)

tests/golden/
  realms-15-students-post-founding.json
  realms-15-students-post-epoch-5.json
  realms-15-students-post-endgame.json
  realms-20-students-post-founding.json
  realms-20-students-post-epoch-5.json
  realms-20-students-post-endgame.json

REALMS-SHIP-PLAN.md                    (this file)
```

### Modified files
```
src/lib/ai/civilization-history.ts     (Haiku model ID — Pass 6)
src/lib/game/epoch-machine.ts          (template-aware phase sequence + epoch gates)
src/lib/game/victory-engine.ts         (enrollment-scaled thresholds + domination victory type v1.1)
src/lib/game/battle-resolver.ts        (v1.1 — accept third participant for alliance combat support, return adjacency check result)
src/lib/game/war-exhaustion.ts         (v1.1 — exhaustion ceiling confirmation flag)
src/lib/game/contact-engine.ts         (v1.1 — adjacency-driven first-contact in addition to epoch-gated)
src/lib/game/yield-calculator.ts       (v1.1 — region bonus multiplier + vassal tribute routing)
src/lib/game/vassal-engine.ts          (v1.1 — ensure civ-name persistence, revolt gating)
src/middleware.ts                      (log trim — Pass 6)
src/app/dashboard/StudentDashboardClient.tsx  (game_mode branching → renders RulerDashboard for Realms)
src/app/api/games/[id]/submissions/route.ts   (v1.1 — epoch-gate validation for DEFINE round types)
src/components/dm/DMControlBar.tsx     (Fast-Forward button for rehearsal games + DM Undo button v1.1)
src/components/dm/SubmissionQueue.tsx  (rehearsal Fill & Submit button)
scripts/simulate.ts                    (Realms mode, invariant assertions — all v1.1 additions)
scripts/nuke-all-games.ts              (env var refactor, rename to dev-nuke-games.ts)
.gitignore                             (existing pending change)
README.md                              (v1.1 — link to all classroom-docs)
```

### Deleted
```
D:\classciv\classroom-civ\              (entire directory after doc copy)
D:\classciv\civ-game\                   (entire directory)
```

---

## Appendix A — Council Consensus on This Plan

**Gandalf** (creator): Architecture is sound. Realms reuses ~75% of existing code. The draft ceremony is a genuine ship feature, not a gimmick.

**Data** (auditor): Twenty-three distinct concerns were raised across conversation turns. All either resolved, accepted as classroom-only risk, or explicitly deferred. Risk ledger is complete.

**Polgara** (editorial): The child-first constraint is met. Ceremony at Founding, compensation for last-pick, in-person portfolio handoff, locked-in civilization identity for 10 epochs. The story of each child's civilization is ownable and portable.

**Earl** (operations): 33 days to contract end. Plan fits with buffer. Never-deploy-on-weekends is non-negotiable. Ship the 21–26 week hard, relax on the play weeks, stay vigilant for snow days.

**Silk** (pattern): The tests-as-rehearsals insight is the pattern that makes this plan work. Scott is a solo developer with a day job. Every feature that doubles as classroom infrastructure ships twice. Every feature that only serves developers ships half.

---

## Appendix B — Document Maintenance

- **Owner:** Scott Somers
- **Review cadence:** update at the end of each calendar week through May 22
- **Version history:**
  - **1.0** — April 21, 2026 (initial draft, morning). Thirteen sections. Assumed human-dev build pace.
  - **1.1** — April 21, 2026 (evening). Panel review by seven external personas + ground-truth code audit of `src/lib/game/`. Added: Section 2.5 (panel findings, 37 items, code-vs-plan gap table), Section 4.4 (DEFINE round submission options spec), Section 4.5 (Alliance & War Consequences Matrix — the operational contract), Section 4.6 (Polgara's Four Non-Negotiables), Section 6.1 (geography additions — adjacency, region yields, Madagascar compensation), Section 9.5 (eight-pass build order at Opus 4.7 rate), Migration 015 (alliances + reputation + adjacency + isolated_start), new assertions in Section 8, revised calendar with Wed Apr 22 soft-live, new open decisions F–N, expanded file list. Build-rate corrected from ~1 week to ~5–7 hours of focused session. No scope cut.
  - **1.2** — April 21, 2026 (night). Q&A session with Scott, 17 operational questions locked (see §11.1). Key shifts: (a) Hard-live pulled from Mon Apr 27 → **Thu Apr 23** per Q11 — four school days earlier; §10 calendar fully rewritten, portfolio date moves from May 13 → May 8. (b) Battle resolution is **fully auto with full audit log** per Q1; DM Undo scope explicitly narrowed to technical repair only per Q17 (§4.5.1, §11.2). (c) Alliance combat support uses **subset-declared soldiers** per Q6. (d) Vassal tribute is **negotiable 10–30%** per Q7. (e) Betrayal events fire **publicly on projector with full drama copy** per Q9 (§4.5.2). (f) Liege sees **only tribute flow** from vassals — never vassal's internal state — per Q10 (§4.6.1 added). (g) Alliance cluster cap **cut to 2** per Q8 (Decision I). (h) Kaiju renamed **"Mr. Somers-zilla"** per Q-K (§5). (i) Decision E locked: prior team games on hold, Realms is a new game. Decisions A, D, F, G, H, I, J, K, L, M, N all resolved. Decisions B and C remain open per their original dates. No scope cut.
  - **1.3** — April 21, 2026 (later night). NPC civilizations added as a first-class system. *This revision was reverted in v1.4 after external audit.*
  - **1.5** — April 21, 2026 (late night). **Reconciliation pass after pulling Scott's parallel work stream** from remote. Realms migrations renumbered from 009–013 to **011–015** (remote had already pushed `009_submissions_delete_policy.sql` and `010_clear_submissions_function.sql`). §13 file list updated: `randomize-draft/route.ts`, `presence/route.ts`, `reset/route.ts`, `roster/route.ts`, `DMDebugPanel.tsx`, `DMRosterPanel.tsx`, `dm-log.ts`, `RegionPickerMap.tsx`, `RegionSelectCard.tsx` all marked as EXISTING. `FoundingClaim.tsx` removed — superseded by `RegionSelectCard.tsx` + `RegionPickerMap.tsx`. Pass 4 budget reduced from ≈150 min to ≈110 min. Pass 8 reduced from ≈45 min to ≈30 min. Pass 1 gains `/api/games/[id]/auto-covers` and `/api/games/[id]/covers` routes (referenced by existing DMRosterPanel but not yet shipped). Canonical repo designation moved from `D:\classciv\classciv-src\` (jumpdrive, now deprecated) to `c:\Users\Valued Customer\OneDrive\Desktop\classciv\classciv-src\` per Scott's move. Total build budget: v1.4's 5h 40m → v1.5's 5h 5m. No scope cut.
  - **1.4** — April 21, 2026 (after external audit). **Thirty-finding external audit identified four ship-blockers (F1–F4).** Council response: cut NPCs back to post-hard-live, ship v1.2 scope Thu Apr 23 as panel-reviewed. Key changes: (a) F1 — Wed Apr 22 calendar rewritten against actual teaching-day windows (before-school / prep-period / after-school). (b) F2 nuclear — `src/lib/ai/student-safe-completion.ts` confirmed non-existent in this repo by file inspection; NPC work deferred to v1.4-post-hard-live, wrapper to be built at that time. (c) F3 — Epoch 1 on Thu Apr 23 explicitly scoped as Founding-only; full 4-round epoch structure begins Fri Apr 24. (d) F4 — Guardrail 1 vs vassalage contradiction resolved: engine never transfers a team's last sub-zone; vassalage triggers on would-be-last-loss instead of zero-sub-zones. (e) F6 — `casus_belli_target` replaced with `casus_belli_grants` child table supporting multiple outstanding grants. (f) F9 — zero-commit alliance exploit closed; minimum 1 soldier commit enforced. (g) F11 — vassal duration semantics made explicit with `end_epoch >= start_epoch + 3` constraint. (h) F13 — parent email requires admin CC. (i) F14 — rollback play documented, on Scott's desk Wed evening. (j) F18 — `games.adjacency_strict = true` enforced as hard-live gate. (k) F20 — classroom-civ directory inventoried before delete. (l) F24 — portfolio PDF pipeline dry-run Wed Apr 22, not deferred to May 7. NPC design work preserved in new Appendix D for future build. Build budget reverted from 8h 0m (v1.3) to ≈5h 40m. **Decisions B, L, S, T, U all locked by Scott:** B = Option 1 (winners-and-losers) with positive-narrative-for-losers via Haiku epilogue per-civ (new §4.6.2); L = Reformation accepted as written; S = no roster firstname collisions in either period; T = Period 7 parallel-cohort draft; U = 60-min Wed prep period. **Only Decision C remains open** (finale wording template, needed Fri May 1).
- **Next review:** April 27, 2026 (start of second playable week) — verify Passes 1–8 all green, rehearsal-portfolio PDF pipeline validated, Sunday-night protocol passing two consecutive weeks.

If any migration number, file path, or schedule item changes, edit this document first, then implement. The document leads the build, not the other way around.

---

## Appendix C — Panel Review Log (v1.1)

Raw transcript of the seven-persona stress test, preserved for audit. If future Scott or a future maintainer asks "why does the plan call for X?" — the answer is here.

### Mira Halversen, Senior Product Designer (14 years K–12 edtech)
1. RulerDashboard first-login state is undefined. Resolution → §4 expanded component spec.
2. DiplomacyPanel "locked before Epoch 4" — locked how? Resolution → §4, grayed + preview.
3. HTML5 audio autoplay will fail silently on the projector tab. Resolution → §7 Arm Ceremony button.
4. 60-second claim timer punishes network drops. Resolution → §7 timeout-receives-bonus.
5. ContactMap state transition undefined. Resolution → §4, pulse + dotted-edge.
6. Founding writeup input modality undefined. Resolution → §4, scaffolded textarea.

### Jayden, 7th-grade boy
1. What do I GET from winning a war? Resolution → §4.5 full matrix (sub-zone transfer, tribute if vassalage triggered).
2. Alliance clustering (4-on-1 dogpile). Resolution → §11 Decision I (cap at 3 outbound alliances), §4.5 aggression score.
3. Defeated civ continuity — losing = sitting? Resolution → §4.6 Guardrail 2 (vassal still plays), §4.5 vassalage row.
4. Draft position fairness. Resolution → §7 last-pick bonus (pre-existing) + timeout bonus.
5. Rage-quit mulligan. Resolution → §11 Decision J (DM re-found single-use).

### Kira, 7th-grade girl
1. Civ name/lore persistence under conquest. Resolution → §4.6 Guardrail 1.
2. Alliance treaty text capture. Resolution → §4.5 treaty_text required field.
3. Non-violent victory path legibility. Resolution → §4.6 Guardrail 3, §11 Decision M.
4. Betrayal narrative beat. Resolution → §4.5 Break Alliance row fires projector event.
5. Portfolio contains her words. Resolution → §4.6 Guardrail 4.

### Ms. Reyes, veteran middle-school teacher
1. Bell schedule minute budget. Resolution → §10 calendar revised with compressed Epoch 1 plan.
2. DM undo / moderation tool. Resolution → Pass 8 DM Undo button.
3. Substitute coverage. Resolution → §11 Decision N + Pass 8 SUB-PLAYBOOK.md.
4. IEP accommodations. Resolution → Pass 8 IEP-ACCOMMODATIONS.md.
5. Parent-facing communication. Resolution → Pass 8 PARENT-ONE-PAGER.md (email Apr 24).
6. Crisis incident script. Resolution → Pass 8 CRISIS-SCRIPT.md.

### Dr. Bram Holloway, historian
1. Whig-arc linearity; no comeback path. Resolution → §5 Reformation option at E7–E9.
2. Alliance-before-war ahistorical. Resolution → Pass 8 DM-runbook historical note.
3. Kaiju tonal mismatch. Resolution → §5 renamed "The Beast That Walked" (§11 Decision K).
4. No religious/cultural reform event. Resolution → §5 Reformation submission (§11 Decision L).

### Dr. Elena Morozov, geographer
1. Adjacency graph unspecified. Resolution → §6.1 + Migration 015 sub_zone_adjacencies + §11 Decision F.
2. Western Europe magnet. Resolution → §6.1 region attractiveness balancing.
3. Resource distribution by region. Resolution → §6.1 region-yield bonuses (§11 Decision G).
4. Madagascar problem (isolated starts). Resolution → §6.1 + Migration 015 isolated_start flag + compensation mechanics.
5. War geography / leap conquest. Resolution → §4.5 adjacency rule for Declare War.

### Col. Tomas Vega (ret.), military strategist
1. Clausewitzian object of war. Resolution → §4.4 + §4.5 casus belli required field, DM scoring on justification.
2. Alliance combat support unspecified. Resolution → §4.5 third BattleParticipant row.
3. Peace treaty path missing. Resolution → §4.5 Sue for Peace row + API route Pass 3.
4. War exhaustion stacking. Resolution → §4.5 confirmation gate at ≥75.
5. Vassalage visible and playable. Resolution → §4.6 Guardrail 2 + Pass 5.
6. Aggressor reputation cost. Resolution → §4.5 aggression_score + Break Alliance reputation decrement.
7. Proxy pressure / ultimatums. Resolution → §4.4 Issue Ultimatum submission type + §4.5 row.
8. Domination victory missing. Resolution → §4.5 Domination Victory row + Migration 015 + Pass 2.

**Review quorum:** all seven personas independently flagged at least one finding. No two personas produced contradictory recommendations. Thirty-seven distinct items; none duplicated across the personas' lists (consolidated count is real). All addressed in v1.1.

---

## Appendix D — NPC Civilizations Design (DEFERRED to v1.4-post-hard-live)

This appendix preserves the NPC system design work from v1.3 for a future build cycle. **NPCs do NOT ship with the Thu Apr 23 hard-live.** See §4.7 for the deferral rationale.

**When this appendix is executed:** after Thu Apr 23 hard-live is stable through at least one full week of real classroom use. Observe whether the peer-only world actually feels thin before building padding.

### D.1 Purpose

A low-enrollment class on a 12-region map may feel thin. NPCs fill the world so a class of 8 students + 8 NPCs yields the same diplomatic richness as a class of 16 students. Students interact with NPCs the same way they interact with each other. NPCs are indistinguishable from peer civs in the student UI. Deliberate.

### D.2 Dynamic target civ count (Decision P — locked design, deferred implementation)

Range: **10 minimum, 25 maximum**. DM sets `games.target_civ_count` at game creation via slider. NPCs fill the gap: `npc_count = max(0, target_civ_count - student_enrollment)`. Default on create: `max(12, enrollment + ceil(enrollment × 0.25))` clamped to [10, 25].

### D.3 Five personalities

| Personality | Rule-layer behavior | Haiku voice |
|---|---|---|
| **Aggressive** | Declares war readily on weakest adjacent rival. Breaks alliances when advantageous. Low reputation threshold. Prioritizes soldiers and walls. | Blunt, martial, proud. "The weak are fuel for the strong." |
| **Defensive** | Builds walls first. Accepts alliances readily. Rarely initiates war but fights hard when attacked. Prioritizes resilience. | Measured, watchful, principled. "We do not strike first. We do not yield second." |
| **Merchant** | Prioritizes trade agreements with every adjacent civ. Neutral on wars — accepts defensive, rejects offensive. Hoards bank. | Shrewd, warm, practical. "Every treaty is a ledger, every ledger a friendship." |
| **Mystic** | Pursues cultural victory. Builds wonders. Initiates Reformation mid-game. High Legacy accumulation. | Oracular, elliptical, literary. "The stars remember what the sword forgets." |
| **Isolationist** | Builds walls. **Probabilistically** rejects alliance proposals (~70% reject rate, not deterministic per F21 fix). Rarely leaves starting sub-zone. High research. | Terse, austere, cold. "We know our borders. They are enough." |

### D.4 Hybrid AI architecture

**Rule layer (deterministic).** Personality-keyed decision tree per round type.

**Haiku layer (generative).** Called only when the rule layer selects a prose-requiring diplomatic action. Model: `claude-haiku-4-5-20251001`. All calls route through `src/lib/ai/student-safe-completion.ts` — **which must be built or ported from CoursePlatform as the first step of v1.4 NPC work** (the file does not currently exist in this repo per F2).

### D.5 Safety wrapper requirements

The wrapper must:
- Route only through Anthropic API (per CLAUDE.md no-Groq rule)
- Apply post-generation content filter (violence, slurs, politics, real-world names/places). **Real-world-toponym filter is explicit** per F19 — must reject Babylonia, Egypt, Rome, etc.
- Regenerate on filter failure (up to 2 retries)
- Fall back to canned personality copy (`src/lib/ai/npc-fallback-copy.ts`) on repeated failure
- Log every call + response + filter verdict to `ai_safety_log` table
- Handle Haiku timeout with bounded wait + fallback (F29 fix — no end-of-epoch stall)

### D.6 Decision O — formal DM pre-approval queue (in-scope for v1.4 NPC build, NOT deferred past it)

Per audit, Mrs. Andersson as a substitute teacher cannot reflexively DM-Undo an off-tone NPC projector event. Decision O ships WITH the NPC system, not after it. Pre-approval queue: every NPC diplomatic prose piece is held in a DM-review queue for ≤10 seconds before hitting the projector. DM can one-click approve, edit, or regenerate. Batch-approve-all shortcut available.

### D.7 NPC submission pathway + DM overrides + narrative presence + cost model

Preserved from v1.3 spec: end-of-epoch `processNpcSubmissions(gameId)` pathway, NPC Panel tab on DMControlBar with Override/Change-Personality/Delete/Promote-to-Student buttons, NPCs appear in epilogue with equal narrative weight to student civs, ~$0.15–0.30 Haiku cost for a two-class arc. **Promote-to-Student button (F12 fix):** the incoming student is required to rewrite the founding 2-sentence before her first turn. Her words, not Haiku's. Portfolio annotation: "founding prose authored by [student name] on [date] upon reclamation of the [civ name] civilization."

### D.8 NPC-aware assertions (v1.4 build scope)

Deferred from §8: `assertHaikuCallsRouteThroughWrapper`, `assertNpcHoldsValidPersonality`, `assertNpcSubmissionsGenerated` (epoch-aware per F17 — expects round-count matching that epoch's active rounds, not always 4), `assertNpcInvisibleToStudents`, `assertTargetCivCountRespected`, `assertAiSafetyLogPopulated`, `assertNpcWinEligible`, `assertFallbackCopyUsedOnFilterFail`, `assertToponymFilterCatchesRealWorldNames` (F19), `assertHaikuTimeoutFallsBackGracefully` (F29), `assertPromoteStudentRequiresRefound` (F12).

### D.9 Lesson from v1.3

The v1.3 NPC addition was drafted on the same night Pass 1 was scheduled to begin. The external audit caught the blockers the Council missed in its own review. Future NPC work ships only after hard-live is observed, not speculative — and no new first-class systems are added to a plan inside 48 hours of ship. This lesson is preserved in the plan body (§4.7) and here.

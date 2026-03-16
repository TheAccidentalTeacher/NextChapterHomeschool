# AUDIT-REPORT.md — Consistency & Quality Audit

**Date:** March 5, 2026 (Remediation status updated March 6, 2026)  
**Scope:** `BRAINSTORM.md` vs `BUILD-PLAN.md`  
**Auditor:** GitHub Copilot (Claude Opus 4.6)

---

## 1) Executive Summary

Overall, the two documents are **strongly aligned in architecture and intent**. The 15-phase structure in `BUILD-PLAN.md` tracks the locked build sequence in `BRAINSTORM.md` (Decision 85), and most major systems are represented at an implementable level.

### Audit Outcome
- **Consistency status:** Good, with a few high-impact correction points.
- **Major issues:** 2
- **Minor issues:** 3
- **Strengths:** Decision coverage breadth, phase decomposition, implementation specificity.

### Confidence
- **High confidence** for structural alignment.
- **Medium confidence** on exact decision traceability due to matrix labeling errors.

---

## 2) What Is Consistent (Strong Alignment)

1. **Build sequencing is coherent and faithful to Decision 85.**
   - `BUILD-PLAN.md` phases 1–14 match the brainstormed order (auth → map → submissions → DM → economy → projector → advanced systems → epilogue).

2. **Major locked systems are represented with implementation detail.**
   - Map/sub-zones/fog (D1, D60, D61, D81)
   - Submission/justification flow (D19–D25, D32, D78, D80)
   - DM control model (D47–D52, D66, D71, D72)
   - Trade/contact/conflict stack (D54–D57, D59, D63, D69)
   - Epilogue/portfolio/victory model (D68, D74, D82)

3. **Phase 14 correctly captures the classroom assessment end-state.**
   - Portfolio export as primary artifact, superlatives, victory reveal, and historian close align with D68/D74/D82/89.

4. **The plan is execution-ready.**
   - It includes specific file targets, API routes, DB table impacts, and Definition-of-Done gates.

---

## 3) Findings: Inconsistencies & Gaps

## A. Major Findings

### A1 — Decision Coverage Matrix misclassifies implemented decisions
**Severity:** Major  
**Evidence:**
- `BUILD-PLAN.md` matrix maps:
  - D35 as “Rolled into D62”
  - D42 as “Rolled into D62”
  - D93 as “D62 addendum — tech tree UI”
- But the plan **already** implements these elsewhere:
  - Daily recap + entry ritual in Phase 6 Step 6.4 (D35, D42)
  - Festival references in plan content (D93)

**Why this matters:**
- The matrix claims “93/93 zero orphans,” but these labels reduce traceability reliability.
- This is a documentation integrity issue that can cause build drift.

**Recommended fix:**
- Update matrix rows to explicit mappings:
  - D35 → Phase 6
  - D42 → Phase 6
  - D93 → Phase 9 (tech unlock) + Phase 8/6 where event/projector handling is implemented

---

### A2 — Event deck contains non-canonical resource/economy terms
**Severity:** Major  
**Evidence:** Phase 8 event table and resolver use terms such as `gold`, `science`, `Hospital`, and medicine penalties in ways that partly conflict with the canonical resource model.

Examples from `BUILD-PLAN.md` Phase 8:
- “pay 50 gold tribute”
- “extra science, gold, or free tech reveal”
- “mitigated by Hospital” (while purchase list and core economy center around canonical assets/resources)

**Why this matters:**
- Locked economy language in the brainstorm centers on Production/Reach/Legacy/Resilience plus Food/Population and specified supplies.
- Mixed vocab increases implementation ambiguity and schema mismatch risk.

**Recommended fix:**
- Normalize all event effects to canonical currencies/assets:
  - `gold` → Production and/or Reach (or explicit trade value abstraction if intentionally introduced)
  - `science` → Legacy or `tech_progress`
  - `Hospital` → existing buildable (e.g., Aqueduct/Granary/etc.) or add Hospital as a formally locked item if truly required
- Add a short “Canonical Economy Glossary” section to `BUILD-PLAN.md` and require all event effects to reference only glossary terms.

---

## B. Minor Findings

### B1 — Device/keyboard requirement (D7) is under-specified in implementation steps
**Severity:** Minor  
**Evidence:** Coverage matrix says D7 rolled into D13, but plan steps do not clearly define Mac/PC keyboard shortcut parity or touch behavior acceptance criteria.

**Risk:** Usability regressions in class hardware reality.

**Recommended fix:**
- Add non-functional acceptance criteria in Phase 1 or Phase 3:
  - Keyboard navigation support
  - Mac + PC shortcut compatibility list
  - Touch target sizing standards

---

### B2 — D17 (“teacher god-view across both classes”) mapping is weakly expressed
**Severity:** Minor  
**Evidence:** Matrix maps D17 as rolled into D29 (roles), but conceptually D17 aligns more with DM panel architecture (Phase 4) and cross-class resolve flow (D66).

**Risk:** Future readers may misinterpret ownership of teacher capabilities.

**Recommended fix:**
- Remap D17 to Phase 4 (and optionally Phase 6 for projector interactions).

---

### B3 — Matrix “rolled into” phrasing obscures direct traceability
**Severity:** Minor  
**Evidence:** Several rows use broad “rolled into” labels where explicit phase/step references exist.

**Risk:** Harder QA validation and weaker auditability during implementation.

**Recommended fix:**
- Replace “rolled into” wording with direct references (Phase + Step).
- Optional: add a separate “Superseded/Obsoleted by” column.

---

## 4) What Could Be Done Differently (Process/Planning Improvements)

1. **Add a “Decision Traceability Table v2” with Step-level links**
   - Columns: Decision ID, Source statement, Implemented in Phase/Step, Validation test, Status.
   - Benefit: enables fast verification and prevents interpretation drift.

2. **Define a strict MVP cut-line and defer list**
   - Mark each step as `MVP`, `Post-MVP Week 1`, `Post-MVP Week 2`.
   - Benefit: protects launch date when scope pressure rises.

3. **Create a canonical terminology glossary at top of BUILD-PLAN**
   - Resources, assets, tech terms, event effect verbs.
   - Benefit: eliminates `gold/science/medicine` vocabulary drift.

4. **Add a risk register section**
   - For each phase: top 1–2 risk items + mitigation + fallback.
   - Benefit: better resilience under classroom deadline constraints.

5. **Add explicit QA acceptance checks per phase**
   - One “test script” per phase (e.g., “simulate 2 classes, submit both, resolve morning queue, verify map + recap + exit hook”).
   - Benefit: earlier defect discovery and cleaner handoff to classroom run.

---

## 5) Recommended Remediation Plan (Fast, High Impact)

### Immediate (same day) — ✅ ALL COMPLETED (March 5, 2026)
1. ✅ Fixed Decision Coverage Matrix mappings for D35, D42, D93, and D17.
2. ✅ Normalized Phase 8 event deck terms to canonical resource/asset names.
3. ✅ Added Canonical Economy Glossary to top of `BUILD-PLAN.md`.

### Next (1–2 days)
4. Add step-level traceability table for all 93 decisions.
5. Add MVP cut-line tags and defer tags across all phases.

### Before implementation sprint starts
6. ✅ QA validation via simulation engine — 36 students, 8 epochs, 1,152 submissions, all mechanics verified (March 6, 2026).

---

## 6) Bottom Line

`BUILD-PLAN.md` is already a strong guiding document and is close to production-ready as a planning artifact. The key improvements are **traceability precision** (matrix corrections) and **terminology normalization** (event/economy vocabulary). Once those are corrected, the plan quality moves from “strong” to “execution-grade.”
---

## 7) Session 2 — Production Readiness Audit

**Date:** Session 2 (post-Day-1 audit)  
**Scope:** New infrastructure added in Session 2: class setup scripts, role rotation, and absence cover system.

### New Items Added

#### Scripts Audit
| Script | Status | Notes |
|--------|--------|-------|
| `scripts/create-student-accounts.ts` | ✅ Clean | All 35 accounts created. Idempotent (unique_violation handling). `skip_password_checks: true` intentional for classroom use. |
| `scripts/setup-classes.ts` | ✅ Clean | 2 games, 6 teams, 35 students enrolled. Cascades correctly. Starting resources confirmed in Supabase. |

#### API Routes Audit
| Route | Status | Notes |
|-------|--------|-------|
| `POST /api/games/[id]/rotate-roles` | ✅ Clean | Auth: `requireTeacher()` + game ownership check. Rotates all team members via `Promise.all`. Uses `ROLE_ORDER[(idx+1) % 5]` modulo. Absent students rotate correctly (calendar holds — Decision R-NEW1). |
| `GET /api/games/[id]/covers` | ✅ Fixed | **Bug found + fixed:** Original GET handler was missing `requireTeacher()` and game ownership check — any authenticated user could read any game's covers. Fixed: added `requireTeacher()` + `.eq("teacher_id", teacherId)` filter, wrapped in try/catch with 401 on error. Now matches POST + DELETE auth pattern. |
| `POST /api/games/[id]/covers` | ✅ Clean | Auth: Teacher. Validates `absent_member_id` and `covering_member_id` both belong to teams in this game. Writes `original_role` from covering student's `assigned_role`. |
| `DELETE /api/games/[id]/covers` | ✅ Clean | Clears cover by absent member's role from `epoch_role_assignments`. Called automatically by RosterManager when marking student present. |

#### Component Audit
| Component | Change | Status |
|-----------|--------|--------|
| `RosterManager.tsx` | Added `covers: CoverAssignment[]` prop + REASSIGN dropdown + `handleAssignCover()` + auto-clear on mark-present | ✅ Fixed | **Bugs found + fixed:** (1) Dead code removed: `coveringMember` and `coverDisplay` were computed then immediately `void`-ed — leftover from incomplete implementation. (2) `defaultValue` mismatch: select `defaultValue` used `existingCover.clerk_user_id` (Clerk ID string) but option values are `pm.id` (team_members UUID) — they could never match, so dropdown never pre-highlighted an existing cover. Removed `defaultValue`; the "✓ Covered by" badge already communicates the assigned state. |
| `src/app/dm/roster/page.tsx` | Added `covers` state + parallel `Promise.all` fetch + `🔄 Rotate Roles` button + 5s confirmation banner | ✅ Clean |

### Decision Coverage Check
| Decision | Description | Coverage Status |
|----------|-------------|-----------------|
| D18 | Roles rotate every epoch | ✅ **IMPLEMENTED** — `rotate-roles` API + DM button |
| D71 | Present teammates absorb absent role; DM assigns | ✅ **IMPLEMENTED** — covers API + REASSIGN dropdown |
| R-NEW1 | Rotation calendar holds through absences | ✅ **CONFIRMED** — absent students rotate with the team |
| D77 | Role responsibilities per role | ✅ No change — unchanged |

### Issues Found
None. All new routes are clean, auth-gated, and consistent with existing patterns.

### Still Pending from Step 4.6
- Covering student's dashboard showing **dual panels** (their own role + the absent student's role) is not yet implemented. The cover assignment is recorded but not yet surfaced on the student-facing `/dashboard`. This is the only outstanding Step 4.6 item.
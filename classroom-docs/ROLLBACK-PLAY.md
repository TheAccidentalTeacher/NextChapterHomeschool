# Rollback Play — Thursday April 23, 2026 Hard-Live

**For Scott's desk.** One page. Read top to bottom before Period 4.

**Why this exists:** F14 — Pass 4 (panel review). Thursday Apr 23 Period 4 ends at 1:25 PM. Period 7 starts at 2:20 PM. Fifty-five minutes. If Period 4 hits a P0 bug during Epoch 1, you need to decide what to do with Period 7 before the bell rings.

---

## During Period 4 — symptom check

### Green: proceed normally
- Students logged in
- Draft ceremony ran
- Each student claimed a sub-zone
- Each student submitted a founding text

### Yellow: degraded but playable
- One or two students cannot log in (roster panel shows them offline)
  → mark them absent, AUTO-COVERS handles their turn
- Projector audio silent (Arm Ceremony forgotten)
  → game still works, visual drum pulse only
- Slow / laggy map rendering
  → ask students to refresh; check WiFi saturation

### Red: P0 — game is broken
- Database error on submission
- Draft randomizer refuses to run
- Authentication failures across the class
- Supabase outage (check status.supabase.com on your phone)

---

## If Red during Period 4 — three doors

### Door A — Defer Period 7 to Friday
**Pick this if:** bug appears systemic (Supabase outage, DB migration issue, Vercel down). Root cause is not likely to resolve in 55 minutes.

**Action:**
1. Finish Period 4 with the paper backup activity (see `DAY-1-STUDENT-GUIDE-6TH.md` reflection questions 1–4).
2. At 1:30 PM, text [admin name]: "ClassCiv has a P0 bug, moving Period 7 Epoch 1 to Friday."
3. Period 7 runs the same paper backup. Mark attendance in the roster panel as normal so AUTO-COVERS doesn't fire Friday.

### Door B — Reset and re-run Period 7 with a fresh game
**Pick this if:** bug is game-specific, not system-wide (e.g., Period 4's game state got corrupted). You verified from your phone that other Supabase/Vercel services are up.

**Action:**
1. Finish Period 4 on paper backup.
2. On your DM panel, create a new game for Period 7 BEFORE the bell (at 1:30 PM). Use the same class roster.
3. Run `npx tsx scripts/load-adjacency.ts <new-game-id>` from a terminal on your laptop if you have it. Otherwise: leave adjacency_strict = false for Period 7. Diplomacy still works. Wars have weaker geography but that is Friday's problem.
4. Period 7 runs normally on the new game.
5. Tonight, you reconcile the two periods on different games and decide whether to archive Period 4's broken game.

### Door C — Manual override, push through Period 7 on same game
**Pick this if:** bug affects ONE student or ONE route (e.g., one student cannot submit; but draft ran). The rest of the class is unaffected.

**Action:**
1. Period 4 finishes on paper for the affected student; the rest submit normally.
2. Period 7 runs normally on its own game (Period 4 and Period 7 have separate games from the start — confirm this on the Games dashboard).
3. After school: DM the affected student's submission manually via the Override button, or Scott codes around the bug before Friday.

---

## Phone numbers / phone-a-friend

- **[Admin name]:** [phone number]
- **[Principal]:** [phone number]
- **IT:** [phone number] if Chromebook-side
- **Scott's own spouse phone** (for sanity check): [phone number]

## What NOT to do

- Do not run `npx tsx scripts/dev-nuke-games.ts` during a live class. That deletes everything.
- Do not push code to Vercel during class. Hotfix deploys can land between classes, not during.
- Do not skip Period 7 silently. If you defer, tell admin.

## After the dust settles

Tonight, regardless of which door you picked:
1. Write up what happened in a two-line note in the class journal.
2. If Door A or B, plan the Friday recovery path on paper before tomorrow morning.
3. Get some sleep. The rest of the arc is 9 more epochs. This can absorb one rough Thursday.

# TESTING-GUIDE.md — ClassCiv End-to-End Testing Walkthrough

> Step-by-step guide to test the full ClassCiv game loop.
> Last updated: March 6, 2026

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **App Running** | Either `npm run dev` locally OR deployed at [next-chapter-homeschool.vercel.app](https://next-chapter-homeschool.vercel.app) |
| **Clerk Users** | Pre-created (see below) |
| **Supabase** | Database with schema deployed (`001_initial_schema.sql` + `002_fix_current_round.sql`) |
| **Browser** | Chrome/Edge recommended. Use incognito for multi-user testing. |

---

## Test Accounts

These accounts have been created via the Clerk Backend API:

| Username | Password | Role | Clerk User ID |
|----------|----------|------|---------------|
| `scott` | `ClassCiv2026!` | teacher | `user_3AZrclOVGSEZVBxczHdpiqxQHIx` |
| `student1` | `ClassCiv2026!` | student | `user_3AZrhY6ErRY6PpKKVx3q5lwXG91` |
| `student2` | `ClassCiv2026!` | student | `user_3AZrhRUcqAEvkoWB8JT0GYCZZS4` |
| `student3` | `ClassCiv2026!` | student | `user_3AZrheomO492Jo89Y8daLiRniXK` |

> **To create more users:** Use the Clerk Backend API or [dashboard.clerk.com](https://dashboard.clerk.com). Set `publicMetadata` to `{ "role": "student" }`.

> **Production student accounts (35 real students):** Username = password = first name lowercase (e.g., `kalaya`/`kalaya`). All 35 accounts are live. Two live games — 6th Grade (12:25–1:25) and 7th & 8th (2:20–3:05). Sign in as `scott` to see both games at `/dm`.

---

## Test Flow — Full Game Loop

### Phase 1: Teacher Login & Game Creation

1. **Open the app** — Go to the landing page (`/`)
2. **Click "Student / Teacher Login"** — Goes to `/sign-in`
3. **Sign in as `scott` / `ClassCiv2026!`**
4. **Expected:** Redirects to `/dm` (DM Overview page)
   - If you see `/dashboard` instead, the middleware redirect isn't working. Try navigating directly to `/dm`.
5. **Click "+ New Game"** (or go to `/dm/setup`)
6. **Fill in the form:**
   - Game Name: `Test Game — Spring 2026`
   - Class Period: `6th Grade`
   - Round Timer: 8 minutes (default)
   - Epoch Count: 15 (default)
   - Victory Conditions: leave all checked
7. **Click "Create Game"**
8. **Expected:** Redirects back to `/dm` with the new game card visible

**Verification:**
- [ ] Teacher lands on `/dm` after login
- [ ] Game creation form works
- [ ] New game appears in the DM overview list

---

### Phase 2: Team & Roster Setup

1. **From `/dm`, click on your game card** — Goes to `/dm/game/[id]`
2. **Go to the Roster page** — `/dm/roster`
3. **Select your game** from the dropdown (if multiple exist)
4. **Create teams** — Click "Add Team" for each:
   - Team 1: "Eagles" (or any name)
   - Team 2: "Wolves"
   - (Create as many as 6-8 for a full classroom)
5. **Add students to teams:**
   - In the Eagles team card, type `student1` and click "Add"
   - In the Wolves team card, type `student2` and click "Add"
   - Add `student3` to either team
6. **Assign roles** — Each student needs a role:
   - 🏗️ Architect
   - 💰 Merchant
   - 🤝 Diplomat
   - 📖 Lorekeeper
   - ⚔️ Warlord

**Verification:**
- [ ] Teams are created successfully
- [ ] Students are added to teams by Clerk username
- [ ] Role assignment works
- [ ] Team cards display members and roles

---

### Phase 3: Student Login & Dashboard

> **Use an incognito window** (Ctrl+Shift+N) for student testing — this keeps the teacher session active in the main window.

1. **Open incognito window** → Go to the app
2. **Click "Student / Teacher Login"**
3. **Sign in as `student1` / `ClassCiv2026!`**
4. **Expected:** Lands on `/dashboard`
5. **Dashboard should show:**
   - Top bar with team name, epoch, current phase
   - Map section (may show blank if no regions assigned yet)
   - Role panel based on assigned role
   - Resource bar (all zeros initially)

**Verification:**
- [ ] Student lands on `/dashboard`
- [ ] Team info loads correctly
- [ ] Role panel matches assigned role
- [ ] Resource bar displays (all zeros is expected)

---

### Phase 4: Civilization Naming

1. **As student** — The `CivNamePrompt` component should appear
2. **Enter a civilization name** (e.g., "The Ironborn Republic")
3. **Submit** — Name goes to pending status
4. **Switch to teacher window** → Navigate to `/dm/names`
5. **Expected:** Pending name submission appears
6. **Approve or reject** the name
7. **Switch back to student** — Refresh → approved name should display in TopBar

**Verification:**
- [ ] Students can submit civ names
- [ ] Names appear in the DM names queue
- [ ] Teacher can approve/reject
- [ ] Approved names display in student dashboard

---

### Phase 5: Epoch Advancement (DM Game Page)

1. **As teacher** — Go to `/dm/game/[id]` (click your game from `/dm`)
2. **The DM Control Bar** should show:
   - Current epoch and phase
   - Pause/Resume button
   - Advance button
3. **Click "Advance"** to move through phases:
   - LOGIN → BUILD → BUILD_ROUTING → EXPAND → etc.
4. **Test pause/resume** — Click Pause, verify students see paused state

**Verification:**
- [ ] DM Control Bar displays correctly
- [ ] Advance button progresses through epoch phases
- [ ] Pause/resume toggles correctly
- [ ] Phase changes are visible to students (via polling)

---

### Phase 6: Submissions

1. **Advance to a round phase** (e.g., BUILD) **as teacher**
2. **As student** — The `RoundSubmissionCard` should appear with:
   - A question prompt
   - Multiple choice options
   - Justification field (with sentence starters for 6th grade)
3. **Select an option and write a justification**
4. **click "Submit"**
5. **As teacher** — Check the `SubmissionQueue` on the DM game page
6. **Expected:** Student's submission appears in the queue
7. **Click on the submission** to open the `SubmissionOverrideModal`
8. **Score it** (1-5) and optionally add feedback
9. **Submit the score**

**Verification:**
- [ ] Questions load during the correct round phase
- [ ] Students can select options and write justifications
- [ ] Submissions appear in the DM queue in real-time
- [ ] DM can score submissions (1-5 scale)
- [ ] Scored submissions update status

---

### Phase 7: DM Tools

Test each DM tool on the game management page:

#### Intel Drop
1. **Open "Intel Drop" form** on the DM game page
2. **Select a team** and type a message
3. **Send** — Message goes to that team only
4. **As student on that team** — Check for the `IntelDropModal` appearing

#### Global Event
1. **Open "Global Event" form**
2. **Choose a preset** (Flood, Plague, Gold Rush, etc.) or type custom text
3. **Fire the event**
4. **As student** — `GlobalEventModal` should appear
5. **On projector** — `EventCardOverlay` should display

#### Push to Projector
1. **Open "Push to Projector" form**
2. **Type an announcement** and push
3. **Open `/projector`** in another tab — Announcement should overlay

**Verification:**
- [ ] Intel drops reach specific teams
- [ ] Global events broadcast to all students
- [ ] Events display on projector
- [ ] Push-to-projector announcements work

---

### Phase 8: Resource Routing

1. **After a submission is scored**, advance to the routing phase (e.g., BUILD_ROUTING)
2. **As student** — The `RoutingPanel` should appear
3. **Set sliders** to split resources between Spend / Contribute / Bank
4. **Confirm the routing**

**Verification:**
- [ ] Routing panel appears during routing phases
- [ ] Sliders work correctly (sum to 100%)
- [ ] Resources update after routing

---

### Phase 9: Map Display

1. **As student or teacher** — The map should render with:
   - CartoDB dark tile layer
   - Sub-zone polygons (colored by terrain or ownership)
   - Fog-of-war (unexplored areas dimmed)
   - Markers for buildings/units (if any exist)
2. **Click a sub-zone** — Info should display (terrain, depletion, bonus)
3. **As teacher** — Map shows all zones (no fog)
4. **On projector** — Map displays full view

**Verification:**
- [ ] Map renders without errors
- [ ] Sub-zones display with correct colors
- [ ] Click interactions work
- [ ] Fog-of-war differentiates by team
- [ ] Projector shows full map

---

### Phase 10: Projector View

1. **Open `/projector`** in a separate browser tab (no login needed)
2. **Expected displays:**
   - Map with all teams visible
   - Current epoch/phase indicator
3. **Test overlays by triggering from DM:**
   - Pause → `PausedOverlay` (blur + "GAME PAUSED")
   - Fire global event → `EventCardOverlay`
   - Push announcement → `AnnouncementOverlay`
   - Advance to RESOLVE → `ResolveSequence` animation
   - Advance to EXIT → `ExitHookCard` with reflection prompt

**Verification:**
- [ ] Projector loads without login
- [ ] Map displays correctly
- [ ] Paused overlay appears/disappears
- [ ] Event cards display and auto-dismiss
- [ ] Resolve sequence animates
- [ ] Exit hook shows reflection prompt

---

### Phase 11: Role Rotation

1. **Sign in as scott** → Go to `/dm/roster`
2. **Select a game** from the dropdown
3. **Note the current roles** for each team member (e.g., Team 1: Kalaya=architect, Kisu=merchant, ...)
4. **Click `🔄 Rotate Roles`** (amber button, top-right of the roster page)
5. **Expected:**
   - Amber confirmation banner appears: "✅ Roles rotated successfully" (auto-dismisses after 5s)
   - All team members' roles shift forward by one position:
     - architect → merchant
     - merchant → diplomat
     - diplomat → lorekeeper
     - lorekeeper → warlord
     - warlord → architect
6. **Refresh the roster** — verify the new roles are persisted in the database
7. **Rotate again** to verify idempotency — each click advances by one more position

**API spot-check:**
```bash
# Direct API test (replace GAME_ID and CLERK_TOKEN)
curl -X POST http://localhost:3000/api/games/GAME_ID/rotate-roles \
  -H "Authorization: Bearer CLERK_TOKEN"
# Returns: { "rotated": 35 }   (or however many members)
```

**Verification:**
- [ ] `🔄 Rotate Roles` button appears on the roster page
- [ ] Confirmation banner appears and auto-dismisses
- [ ] All team members' roles advance by exactly one position
- [ ] Absent students also rotate (their role in DB shifts — calendar holds)
- [ ] Multiple consecutive rotations cycle correctly (5 rotations = back to start)

---

### Phase 12: Absence Cover Assignment (REASSIGN)

1. **Sign in as scott** → Go to `/dm/roster`
2. **Find a student** (e.g., Kalaya on 6th Grade Team 1)
3. **Mark them absent** — toggle their absent checkbox
4. **Expected:**
   - Kalaya's row turns orange/highlighted
   - A **REASSIGN dropdown** appears below her row
   - The dropdown lists present teammates with their current roles in parentheses: "Kisu (merchant)", "Sayna (diplomat)", etc.
5. **Select a covering student** from the dropdown (e.g., "Kisu (merchant)")
6. **Expected:**
   - Dropdown confirms: ✓ Covered by Kisu +[absent role]
   - The cover is recorded in `epoch_role_assignments` with `is_substitute: true`
7. **Test marking absent student present again:**
   - Toggle Kalaya back to present
   - Expected: cover assignment clears automatically (DELETE /covers fires)
   - REASSIGN dropdown disappears

**API spot-check:**
```bash
# GET covers for a game
curl http://localhost:3000/api/games/GAME_ID/covers \
  -H "Authorization: Bearer CLERK_TOKEN"
# Returns: { "epoch": 1, "covers": [{ clerk_user_id, role, team_id, is_substitute, original_role }] }
```

**Verification:**
- [ ] Absent students show orange/highlighted row
- [ ] REASSIGN dropdown appears under absent student
- [ ] Dropdown shows only *present* teammates (not other absent students)
- [ ] Selecting a teammate records the cover in DB (`epoch_role_assignments`)
- [ ] Cover confirmation badge shows "✓ Covered by [name]"
- [ ] Marking student present clears the cover automatically
- [ ] GET /covers returns the correct active covers for current epoch

---

## Troubleshooting

### "Already signed in" loop
Clerk says `<SignIn/>` can't render when already signed in. This is normal — navigate directly to `/dm` (teacher) or `/dashboard` (student).

### Teacher stuck on `/dashboard`
The middleware should redirect teachers to `/dm`. If it doesn't:
- Verify the user's `publicMetadata.role` is `"teacher"` in Clerk dashboard
- Check the middleware is deployed (latest commit includes the fix using `clerkClient()`)

### Map not rendering
Leaflet requires CSS to be loaded. Check:
- The `MapWrapper` component handles SSR-safe dynamic import
- Browser console for missing CSS/JS errors

### Submissions not showing in queue
- Verify the student is on a team (`/api/me/team` returns data)
- Check the epoch is on the correct round phase
- The submission queue polls every 5 seconds

### Database errors
- Check Supabase dashboard → Table Editor for data
- Verify RLS policies allow the operation
- Check the Supabase project is active (free tier pauses after inactivity)

---

## Creating Additional Test Users

### Via PowerShell (Windows)

```powershell
$secret = (Get-Content ".env.local" | Where-Object { $_ -match '^CLERK_SECRET_KEY=' }) -replace 'CLERK_SECRET_KEY=',''
$headers = @{ "Authorization" = "Bearer $secret"; "Content-Type" = "application/json" }
$body = '{"username":"newstudent","password":"ClassCiv2026!","public_metadata":{"role":"student"}}'
Invoke-RestMethod -Uri "https://api.clerk.com/v1/users" -Method POST -Headers $headers -Body $body
```

### Via cURL (Mac/Linux)

```bash
curl -X POST https://api.clerk.com/v1/users \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"username":"newstudent","password":"ClassCiv2026!","public_metadata":{"role":"student"}}'
```

---

## Console Warnings (Safe to Ignore)

| Warning | Reason |
|---------|--------|
| `Clerk has been loaded with development keys` | Using Clerk dev instance — expected in dev/staging |
| `[DOM] Input elements should have autocomplete attributes` | Clerk's internal form inputs — not our code |
| `<SignIn/> component cannot render when user is already signed in` | Navigating to `/sign-in` while logged in — redirect is working |

---

---

## Simulation Engine — Automated Full-Game Testing

The simulation engine runs 36 simulated students across 6 teams through a complete game — exercising all game mechanics end-to-end against live Supabase.

### Running a Simulation

> **Important:** All commands must be run from the `classroom-civ/` directory.

```bash
# Quick 3-epoch test
npx tsx scripts/simulate.ts --fast --epochs 3

# Full 8-epoch simulation (default)
npx tsx scripts/simulate.ts --fast --epochs 8

# Dry run (simulates everything but writes nothing to DB)
npx tsx scripts/simulate.ts --dry-run
```

### What It Tests

- **Epoch State Machine:** All 11 steps per epoch (login → build → build_routing → expand → expand_routing → define → define_routing → defend → defend_routing → resolve → exit)
- **Question Selector:** Picks contextually appropriate questions based on round type, epoch, and team state
- **Yield Calculator:** Full yield formula with justification multiplier, d20 roll, terrain bonuses
- **Resource Routing:** Each team's lead role allocates yields across spend/contribute/bank
- **Population Engine:** Food-driven growth, famine at food ≤ 0, population loss
- **Bank Decay:** 10% per epoch on banked resources
- **Dark Ages:** Trigger check (combined famine + war exhaustion + depletion)

### What to Expect

| Epochs | Students | Submissions | ~Time (fast mode) |
|--------|----------|-------------|-------------------|
| 3 | 36 | 432 | ~50 seconds |
| 8 | 36 | 1,152 | ~2 minutes |

### Cleaning Up Simulation Data

```bash
# Delete a specific simulation game and all its data
npx tsx scripts/simulate.ts --cleanup GAME_ID
```

The game ID is printed at the end of every simulation run. Simulation log files are saved to `simulation-log-{gameId}.txt` and are gitignored.

### Verified Results (March 6, 2026)

- **3-epoch test:** PASSED — 6 teams, 36 students, 432 submissions, 50.6s
- **8-epoch test:** PASSED — 6 teams, 36 students, 1,152 submissions, 121.1s
- All game mechanics working: yields, routing, population, famine, bank decay, epoch transitions
- By epoch 8, all teams hit famine (population → 1) because purchase menu (Phase 7) isn't built yet — no way to buy farms

---

*This guide covers Phases 0-6 + Simulation Engine of the ClassCiv build. Additional testing for Phases 7+ (purchases, d20 events, tech tree, trade, wonders, NPCs) will be added as those features are built.*

---

## Sprint 7�9 Feature Tests (Invest Legacy, First Settler Decay, Math Gate)

> Added: commit 1663413

### T-A: Tech Tree � Invest Legacy

**Setup:**
1. Sign in as student in a game
2. Select a tech for research (POST research action:select)
3. Navigate to the Tech tab

**Test A1 � Invest input appears**
- Click the in-progress tech node ? selection panel opens
- Expected: Progress bar + "?? Invest Legacy" input + button visible
- Edge: Input defaults to `1`; button disabled when input is empty/zero

**Test A2 � Invest partial amount**
- Enter `5` in the invest field ? click "?? Invest Legacy"
- Expected: `team_resources.legacy -= 5`; `legacyInvested[techId]` in metadata += 5; progress bar advances; `fetchData` refreshes the UI
- Verify (DB): `teams.metadata.legacy_invested[techId]` = 5

**Test A3 � Invest to completion (exact)**
- Set up tech needing exactly 10 Legacy; invest 10
- Expected: Tech moves to `completed`; active research banner disappears; `tech_research` row inserted; `legacy_invested` key cleared from metadata; `game_events` row with `tech_completed`

**Test A4 � Invest with overflow**
- Tech needs 3 more Legacy; invest 10
- Expected: Tech completes; team gets back 7 Legacy (net cost = 3)
- Verify: `team_resources.legacy = original - 3`

**Test A5 � Insufficient Legacy**
- Team has 2 Legacy; invest 5
- Expected: Server returns 400; UI refetches (no progress update)

---

### T-B: First Settler Decay

**Setup (DB):**
- Create a sub-zone with `founding_claim = 'first_settler'`, `founding_bonus_active = true`, `founding_epoch = 2`, `first_settler_decay_epochs = 2`, `yield_modifier = 1.20`

**Test B1 � Early advance (no decay)**
- Start at epoch 2; DM advances to epoch 3
- Expected: `founding_bonus_active` stays `true`; `yield_modifier` stays `1.20`

**Test B2 � Decay fires exactly on expiry**
- Advance from epoch 3 to epoch 4 (epoch 2 + decay 2 = epoch 4)
- Expected: `founding_bonus_active = false`; `yield_modifier = 1.10` (1.20 - 0.10)
- Verify DM sees no DB error; epoch advances normally

**Test B3 � Decay fires even if past expiry**
- Set `founding_epoch = 1`, `first_settler_decay_epochs = 1`; advance to epoch 5
- Expected: Decay runs on the epoch-increment call; `founding_bonus_active = false`

**Test B4 � Resource Hub / Natural Landmark unaffected**
- Sub-zone with `founding_claim = 'resource_hub'` and `founding_bonus_active = true`
- Advance epoch past founding_epoch + 4
- Expected: No changes (decay query filters `founding_claim = 'first_settler'` only)

**Test B5 � No sub-zones (zero rows)**
- Game with no settled sub-zones ? advance epoch
- Expected: Route completes without error; no DB updates attempted

---

### T-C: Math Gate � Building Purchases

**Setup:** Set `math_gate_enabled = true` on the game row (PATCH `/api/games/[id]`)

**Test C1 � Modal appears**
- Student tries to buy a building
- Expected: MathGateModal renders with a math problem, answer input, Submit button

**Test C2 � Correct answer (multiply)**
- Set `math_gate_difficulty = 'multiply'`; solve problem correctly
- Expected: "? Correct!" shown; building purchased; `sub_zone.yield_modifier` unchanged

**Test C3 � Wrong answer (penalty)**
- Enter wrong answer
- Expected: "? Incorrect. 25% yield penalty applied."; building still purchased; `sub_zone.yield_modifier -= 0.25`
- Verify: If `yield_modifier` was 1.10, it becomes 0.85; floor is 0.50

**Test C4 � Yield floor enforced**
- Zone at `yield_modifier = 0.60`; wrong answer twice
- Expected: First penalty ? 0.35 ? clamped to 0.50; second wrong answer ? stays at 0.50

**Test C5 � Cancel action**
- Open modal ? click "Cancel action"
- Expected: Modal closes; no building purchased; resources unchanged

**Test C6 � Founding flow + math gate**
- First build in unfounded zone ? founding form ? fill name + claim ? "Found & Build"
- Expected: Math gate fires AFTER founding form submission, BEFORE API call
- Wrong answer: City still founded; `math_penalty: true` sent to assets route; yield penalty applied to new zone

**Test C7 � Math gate disabled**
- Set `math_gate_enabled = false`
- Expected: No modal; builds proceed directly

**Test C8 � Difficulty: divide**
- Set `math_gate_difficulty = 'divide'`
- Expected: Problem format is `A � B = ?`

**Test C9 � Difficulty: ratio**
- Set `math_gate_difficulty = 'ratio'`
- Expected: Problem format is `A : B = ? : C`; hint shown

**Test C10 � Difficulty: percent**
- Set `math_gate_difficulty = 'percent'`
- Expected: Problem format is `What is X% of Y?` with friendly percentages (10/20/25/50%)

---

## Full Integration Smoke Test (30-minute run-through)

Run this before a live classroom session to confirm everything works end-to-end.

1. **Teacher:** Create game + assign teams to regions
2. **Students (3 windows):** Log in, confirm dashboard loads with team name
3. **DM:** Advance to BUILD step
4. **Student (Architect):** Open map ? click own zone ? buy a building (math gate if enabled)
5. **Student (Architect):** Found first city (founding modal + claim)
6. **Student:** Open Tech tab ? select tier-1 research ? invest Legacy
7. **DM:** Advance to DEFINE step ? routing step
8. **Student:** Submit Legacy routing
9. **DM:** Advance to RESOLVE ? click Next Epoch
10. **Verify:** Leaderboard on projector updates; First Settler check ran if any zones were founded
11. **DM:** Toggle math gate on/off from PATCH request
12. **Student:** Repeat building purchase with math gate enabled; answer wrong ? verify yield penalty in DB
13. **All:** Confirm no console errors in any browser

---

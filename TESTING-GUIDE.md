# TESTING-GUIDE.md — ClassCiv End-to-End Testing Walkthrough

> Step-by-step guide to test the full ClassCiv game loop.
> Last updated: March 6, 2026

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **App Running** | Either `npm run dev` locally OR deployed at [next-chapter-homeschool.vercel.app](https://next-chapter-homeschool.vercel.app) |
| **Clerk Users** | Pre-created (see below) |
| **Supabase** | Database with schema deployed (`001_initial_schema.sql`) |
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

*This guide covers Phases 0-6 of the ClassCiv build. Additional testing for Phases 7+ (purchases, d20 events, tech tree, trade, wonders, NPCs) will be added as those features are built.*

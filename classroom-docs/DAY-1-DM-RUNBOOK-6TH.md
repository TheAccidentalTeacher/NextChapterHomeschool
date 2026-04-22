# 🎮 DM Runbook — Day 1 Dry Run
### Classroom Civ · 6th Grade · March 2026

---

## Readiness Checklist (Do Before Class)

- [ ] Open [DM Panel](https://bit.ly/SomersCiv) in your browser — keep this tab open all class
- [ ] Open [/dm/roster](https://next-chapter-homeschool.vercel.app/dm/roster) in a second tab
- [ ] Have [TEAM-ROSTERS.md](./TEAM-ROSTERS.md) printed or open for student login help
- [ ] Confirm student passwords are set in Clerk (check [Clerk Dashboard](https://dashboard.clerk.com) → Users)
- [ ] Test login yourself as one student to confirm the dashboard loads

---

## Today's Goal

**This is a dry run.** Objective is to:
1. Get all 15 students logged in successfully
2. Complete the **BUILD round** together as a class
3. Have the Architect on each team complete the routing step
4. Debrief what worked / what was confusing

You do NOT need to complete all 4 rounds today. Stop after BUILD + routing if you're short on time.

---

## Epoch Flow Reference

Each Epoch has 11 phases. For today, you'll use the first 3:

| Phase | Name | Duration | What Happens |
|-------|------|----------|-------------|
| 1 | **Login & Recap** | 2 min | Students log in, see their team |
| 2 | **BUILD Round** | 8 min | All roles submit decisions |
| 3 | **Route Production** | 2 min | Architect routes Production resources |
| 4 | **EXPAND Round** | 8 min | *(optional today)* |
| 5 | **Route Reach** | 2 min | *(optional today)* |
| 6 | **DEFINE Round** | 8 min | *(optional today)* |
| 7 | **Route Legacy** | 2 min | *(optional today)* |
| 8 | **DEFEND Round** | 6 min | *(optional today)* |
| 9 | **Route Resilience** | 2 min | *(optional today)* |
| 10 | **RESOLVE** | DM-triggered | *(optional today)* |
| 11 | **Exit Hook** | 1 min | *(optional today)* |

> **Lead roles by round:** BUILD → Architect · EXPAND → Merchant · DEFINE → Diplomat · DEFEND → Warlord

---

## Step-by-Step Runbook

### Before Students Arrive

1. Navigate to [/dm/roster](https://next-chapter-homeschool.vercel.app/dm/roster)
2. Select **Classroom Civ — 6th Grade 2025-26** from the dropdown
3. Click **🌅 New Epoch** — this rotates roles + auto-covers any absences
4. Confirm you see all 5 teams with student names visible

---

### Phase 1 — Login (2 min)

**Your actions:**
- Tell students the URL: `bit.ly/SomersCiv`
- Walk around and confirm everyone gets to their dashboard
- Watch for students who can't log in — check [TEAM-ROSTERS.md](./TEAM-ROSTERS.md) for their exact username

**What students should see:**
- Their team name at the top
- A colored chip row showing teammates + roles
- A purple badge if they hold two roles
- "Login & Recap" as the current phase

**Common issues:**
| Problem | Fix |
|---------|-----|
| "No team found" | Student's Clerk account username doesn't match what's in DB — check Clerk dashboard |
| Wrong team showing | Student may have logged in under someone else's account — force logout |
| Missing teammates | Check Supabase `team_members` table — run the SQL check below |
| Absent student | Go to Roster tab → mark them absent → covers auto-assign |

**SQL quick-check if needed:**
```sql
SELECT display_name, assigned_role, secondary_role
FROM team_members
WHERE team_id IN (SELECT id FROM teams WHERE game_id = '1da295e7-b24a-403e-9894-574c6adfd985')
ORDER BY team_id, display_name;
```
*(6th grade game ID: `1da295e7-b24a-403e-9894-574c6adfd985`)*

---

### Phase 2 — Advance to BUILD Round

**Your actions:**
1. In the DM panel, navigate to the **Games** tab or use the Manage button for the 6th grade game
2. Advance the epoch step to **BUILD**
3. Announce to the class: *"BUILD round is starting — you have 8 minutes. Read the question on your screen with your team and submit your answer."*

**What students should see:**
- A decision card with a historical scenario
- Answer options (usually 3–4)
- A text box for their justification (1–2 sentences)
- A countdown timer
- A **Submit** button

**Your job during this phase:**
- Walk the room — make sure every team is discussing, not just one person typing
- Remind them at 3 minutes: *"You have 3 minutes — make sure everyone agrees on an answer"*
- Watch the submission status in your DM panel — you can see which roles have submitted

**If a team submits wrong/too fast:** That's OK for today — this is a dry run.

**Timer runs out and someone didn't submit:** Also OK today — default answer is selected.

---

### Phase 3 — Route Production (2 min)

**Your actions:**
1. Advance the step to **Route Production** 
2. Announce: *"Architects — a routing screen just appeared for you. You have 2 minutes to decide where your Production resources go."*

**What Architects should see:**
- A routing panel (different from the submission card)
- Options to allocate Production points

**Other students:** They wait. Tell them to look at the resource bar at the top of their screen — they should see their Production ticking up as results come in.

---

### After BUILD + Routing — Debrief

Stop here if you're low on time, or continue to EXPAND if class is going well.

**Debrief questions to ask aloud:**
- "Did everyone find their role on screen?"
- "Did dual-role students see both roles?"
- "What was confusing about the BUILD question?"
- "Architects — what did the routing screen look like? Was it clear?"
- "Did the timer feel too long, too short, or about right?"

---

### Optional: Continue to EXPAND

If you have time (25+ min remaining), advance through:
- EXPAND Round (8 min) — Merchant leads
- Route Reach (2 min) — Merchant routes

Then stop and debrief again, or advance to DEFINE if the pace is good.

---

## Absence Handling

If a student arrives late or needs to be marked absent:
1. Go to [/dm/roster](https://next-chapter-homeschool.vercel.app/dm/roster)
2. Find the student → click **Absent**
3. Their role auto-distributes to a present teammate immediately
4. If you want to manually override who covers: use the dropdown that appears

To un-absent a student who shows up late:
1. Click **Present** next to their name
2. Their cover assignment clears automatically

---

## DM Controls Reference

| Button | Where | What It Does |
|--------|-------|-------------|
| 🌅 New Epoch | Roster tab | Rotates roles + auto-covers absences |
| ⚡ Auto-Cover Absences | Roster tab | Runs cover logic without rotating |
| 🔄 Rotate Roles | Roster tab | Rotates only, no cover logic |
| Manage → Advance Step | Games tab | Moves the epoch forward one phase |
| Projector | Overview card | Opens the projector/display view |

---

## End of Class

1. Tell students to stay logged in until you've confirmed their submission went through (visible in DM panel)
2. Note anything broken or confusing — add to the issues list below
3. Do NOT click New Epoch again until next class

---

## Things to Watch For Today

Track these observations for feedback:

| # | Thing to watch | Notes |
|---|---------------|-------|
| 1 | How long does login actually take? | |
| 2 | Do students immediately understand their dual roles? | |
| 3 | Is the BUILD question pitched at the right level? Too hard? Too easy? | |
| 4 | Do teams discuss or does one student just submit for everyone? | |
| 5 | Does the 8-minute timer feel right for 6th grade? | |
| 6 | Did any student get "wrong team" or "no team found"? | |
| 7 | Did Architects understand the routing step? | |

---

## Quick Reference

| | |
|---|---|
| **6th Grade Game ID** | `1da295e7-b24a-403e-9894-574c6adfd985` |
| **Student URL** | `bit.ly/SomersCiv` |
| **DM URL** | `bit.ly/SomersCiv` → sign in → DM Panel |
| **Roster URL** | `bit.ly/SomersCiv/dm/roster` |
| **Round timer** | 8 min / round (6th grade) |
| **Total Epoch time** | ~50 min (all 4 rounds) |
| **Today's target** | 1–2 rounds |

---

*Day 1 Dry Run · Classroom Civ 6th Grade 2025-26 · March 2026*

# BRAINSTORM.md — ClassCiv (Working Title)
### A Civilization × Oregon Trail Hybrid Anchor Project for Middle School Classrooms
> *Living document. Never delete — append and date. This is the mission brief.*
> *Built with: Scott Somers + The Brand Whisperer | Stack: Claude Sonnet/Opus 4.6 | March 2, 2026*

---

## ❓ UNANSWERED QUESTIONS — BLOCK EVERYTHING UNTIL RESOLVED

| # | Question | Why It Blocks Us |
|---|---------|------------------|
| U1 ✅ LOCKED | **What does a team actually DO during one epoch?** | ✅ Fully answered. 4 rounds: BUILD → EXPAND → DEFINE → DEFEND. Each role leads one round. All submit every round. Justification multiplier. Live resolution on projector. See Decisions 23, 28-32, 37-38, 70, 77-80. |

---

## 📋 MASTER QUESTION BANK — Work Through These In Order
*These are the ~75 questions that need answers before this game is fully designed and built. Organized by category. Work through them session by session. When a question is answered, move it to LOCKED DECISIONS.*

---

### CATEGORY 1 — Roles & Team Dynamics
*What each student IS inside their civilization.*

| # | Question | Why It Matters |
|---|---------|---------------|
| R1 | ~~**What are the exact role names — and do they rotate each epoch or stay fixed for the 3-week project?**~~ | ✅ LOCKED — Roles rotate every epoch. See Decision 18. |
| R-NEW1 ✅ LOCKED | **How does rotation handle uneven absences?** | ✅ Calendar holds. Miss an epoch, miss that role. Rotation doesn't shift. Portfolio tracks gaps. See Decision 77. ✅ **CONFIRMED IN CODE:** `rotate-roles` API rotates ALL members including absent ones — their DB role shifts with the calendar even if they missed that epoch. |
| R2 ✅ LOCKED | **5 roles in a flexible pool — teams fill what they have** | Architect, Merchant, Diplomat, Lorekeeper, Warlord. Teams fill roles based on how many students are present. Dormant roles sit empty — no penalty for missing. 1 student = holds all roles solo. 4th student = activates dormant role. No hardcoded team size requirement anywhere in the code. → **Decision 29** |
| R3 | ~~**Does each role bring its OWN decision question to the table each epoch — or do all roles look at the same decision and each has a weighted vote?**~~ | ✅ LOCKED — Each role brings its own distinct question(s). See Decision 19. |
| R4 ✅ LOCKED | **No single leadership role — leadership rotates by round** | Each role leads their own round. Architect leads BUILD. Merchant leads EXPAND. Diplomat leads DEFINE (laws portion). Lorekeeper leads creature creation. Warlord leads DEFEND. Leadership is distributed, not owned. → **Decision 30** |
| R5 ✅ LOCKED | **Can a student be removed from their role mid-project?** | ✅ No. Roles rotate every epoch (Decision 18). Classroom management ≠ game mechanic. See Decision 77. |
| R6 ✅ LOCKED | **Does a student's role affect their individual grade?** | ✅ No. Portfolio quality is the grade, not role performance or game standing. See Decisions 74, 77. |
| R7 ✅ LOCKED | **What does the Merchant (was Scout/Explorer) actually DO on the student's screen?** | ✅ Merchant leads EXPAND: Spot Trade Board, Trade Agreements, territory expansion, caravan management. See Decision 77. |
| R8 ✅ LOCKED | **What does the Merchant/Trade role actually DO?** | ✅ Leads EXPAND round, manages Spot Trade Board + Trade Agreements + Embargo + caravan units, routes Reach. See Decision 77. |
| R9 ✅ LOCKED | **What does the Architect (was Engineer/Builder) actually DO?** | ✅ Leads BUILD round: construction panel, building queue, infrastructure placement, routes Production. See Decision 77. |
| R10 ✅ LOCKED | **What does the Lorekeeper (was Scholar/Culture) actually DO?** | ✅ Leads DEFINE (mythology): creature gallery, cultural artifacts, CI score + spread map. See Decision 77. |
| R11 ✅ LOCKED | **Is there a "Spy" role?** | ✅ No. Not in v1. Five roles mapped (Decision 70). Espionage via tech tree (Optics, Astronomy). V2 consideration. See Decision 77. |
| R12 ✅ LOCKED | **Does the Warlord have authority the other roles don't?** | ✅ No single override. Warlord/Diplomat mutually check each other — Warlord can't declare war without Diplomat escalation (Decision 57). See Decision 77. |

---

### CATEGORY 2 — The Epoch Loop (Bell to Bell)
*The heartbeat. Everything else depends on this.*

| # | Question | Why It Matters |
|---|---------|---------------|
| E-NEW1 | ~~**How many rounds are in one epoch?**~~ | ✅ LOCKED — 4 rounds per epoch (BUILD → EXPAND → DEFINE → DEFEND). Decision 23 superseded Decision 20. See Decision 23. |
| E-NEW2 | ~~**Do all roles submit in every round?**~~ | ✅ LOCKED — All roles participate in all 4 rounds. See Decision 23. |
| E-NEW3 | ~~**How do the 6 domains map to 4 rounds?**~~ | ✅ LOCKED — Fixed round names (BUILD/EXPAND/DEFINE/DEFEND), dynamic questions inside each round per epoch. See Decisions 23 and 25. |
| E-NEW4 ✅ LOCKED | **Does every role weigh in on every round?** | ✅ All roles submit every round. Leading role weighted most. Architect leads BUILD, Merchant leads EXPAND, Diplomat leads DEFINE (laws), Lorekeeper leads DEFINE (mythology), Warlord leads DEFEND. See Decision 78. |
| E-NEW5 ✅ LOCKED | **How does the outcome of a round get measured?** | ✅ Both mechanical + justification. Outcome = mechanical result x justification multiplier (0.5-2.0x). Scott sets multiplier based on reasoning quality. See Decision 78. |
| E-NEW6 ✅ LOCKED | **Does progression work as UNLOCK, CONSEQUENCE, or both?** | ✅ Both from day one. Good decisions unlock new options (aqueduct, trade route). Bad decisions trigger consequences (disease, unrest). Full Civ/Oregon Trail DNA. See Decision 78. |
| E-NEW7 ✅ LOCKED | **Mythology round = whole-team mythological creature creation** | Each epoch, the entire team receives a shared creature-generation prompt. They collaborate together — not individual role submissions — to create a mythological creature. This is the one round where all roles contribute to a single team artifact. The creature is a portfolio piece, builds their civilization's mythology lore bank, and is the most memorable thing they make all unit. Standalone in ClassCiv (does not require MythoLogic Codex, but may integrate in future). → **Decision 26** |
| E-NEW8 ✅ LOCKED | **Question generation = pre-built bank (base) + AI override (supplement)** | The game maintains a pre-built question bank indexed by domain × civilization stage — auto-selects each epoch based on team state. When a team's situation gets weird or specific enough that the bank doesn't have the right fit, AI generates a custom question from that team's actual state. Scott never writes questions manually from scratch. → **Decision 27** |
| E-NEW9 ✅ LOCKED | **How does the game know a civilization's current state for dynamic questions?** | ✅ Tracked fields: territory, tech tier, resources (all 6), event flags, wonder %, military, trade, Dark Ages, War Exhaustion, vassalage, contact. Epochs 1–3 = shared bank. Epoch 4+ = team-specific. Haiku override for edge cases. See Decision 78. |
| M1 ✅ LOCKED | **4th round: DEFEND (Military domain) — added every epoch** | Option C chosen. Epoch structure is now 4 rounds: BUILD / EXPAND / DEFINE / DEFEND. DEFEND = Military. Stands alone as its own round at the end of every epoch. Doubles as classroom pacing pressure — teams that goof off early don't get through DEFEND, and that has real game consequences. → **Decision 28** |
| M2 ✅ LOCKED | **What do early-epoch military prompts look like?** | ✅ Pre-contact = internal threats: brigands, raiders, wildlife, civil unrest, refugees. Same domain that later matters post-contact. See Decision 79. |
| M3 ✅ LOCKED | **How does military strength feed into the contact/war overlay?** | ✅ Shadow variable: soldier count + military buildings + Warlord justification history + War Exhaustion. Determines post-contact option range. Scott controls intel via private drops (Decision 50). See Decision 79. |
| E-NEW2b ✅ LOCKED | **Each role leads their own round; all roles participate in all rounds** | Architect leads BUILD, Merchant leads EXPAND, Diplomat leads DEFINE (laws), Lorekeeper leads DEFINE (creature), Warlord leads DEFEND. Every role still submits in every round — the leading role drives the question, others support. → Decisions 29 and 30 |
| K1 ✅ LOCKED | **Teacher-triggered Kaiju attack mechanic — pure spectacle, zero game penalty** | Scott can unleash one of 7 kaiju against any team or all teams at any moment from the DM panel. Students get a full-screen animated attack sequence (SimCity/Godzilla energy — kaiju visually stomps the civilization). Completely cosmetic: no stat loss, no resource penalty, no game consequence. Pure chaos and delight. 7 kaiju total — roster locked (see K-NEW1). → **Decision 34** |
| K-NEW1 ✅ LOCKED | **The 7 Kaiju roster — finalized** | 1. **Kraken** — erupts from coastal/ocean tiles, tentacles engulf the city. 2. **Thunderbird** — dive-bombs from the sky, lightning strike animation. 3. **Rexar** (giant lizard, original Godzilla-inspired design) — stomps in from the map edge, classic kaiju walk. 4. **Kodiak** (giant Polar Bear) — lumbers in from the northern wilderness, Alaska-specific crowd pleaser. 5. **Chimera** (lion/goat/serpent) — mythology unit tie-in, three-headed animation. 6. **Cyclops** — mythology unit tie-in, single eye glow, boulder throw. 7. **ZORG-9** (space alien in a flying saucer) — the silly one, saucer descends, abduction beam sweeps the city, then warps away. → Decision 34 (roster component) |
| E1 ✅ LOCKED | **Entry ritual: Day 1 = cinematic intro; subsequent days = daily recap on login** | Day 1: students log in and see the game's opening cinematic/narrative introduction to their civilization and the world. Every day after: students log in and see a recap of what happened the previous class day before anything else. Recap generation method TBD (see E-REC). → **Decision 35** |
| E-REC ✅ LOCKED | **Claude Haiku generates narrative recap — fires at session start from full game state snapshot** | No template, no Scott writing. Haiku reads game state (resources, events, decisions, asset changes) and writes a narrative paragraph per team. Stored in Supabase alongside the state row. Pennies per class day. → **Decision 42** |
| E2 ✅ LOCKED | **How many distinct phases are in one epoch — and how long is each?** | ✅ 11 phases: Login 3min → BUILD 8+2 → EXPAND 8+2 → DEFINE 8+2 → DEFEND 6+1 → RESOLVE 5 → Exit 2 = 47min + 3 buffer. 7/8 compresses rounds. See Decision 79. |
| E3 ✅ LOCKED | **Is turn resolution visible to all teams live?** | ✅ Yes — live. Scott hits RESOLVE, projector erupts, whole class watches. Already locked by Decision 76. See Decision 79. |
| E4 ✅ LOCKED | **What is "the loud moment"?** | ✅ The RESOLVE moment. Territory shifts, wonder completions, battle outcomes, NPC activations — all on the projector simultaneously. See Decisions 31, 34, 40, 76, 79. |
| E5 ✅ LOCKED | **d20 random event system — one per day, random round, student-facing popup** | One event fires per class day. The round it fires in is randomized (any of the 4 rounds). Students get a popup with a 20-sided die roll: 1–10 positive (9–10 extremely positive), 11–20 negative (19–20 extremely negative). Never civilization-ending. Scott can still hand-fire curriculum events (plague, colonization) independently of this system. → **Decision 33** |
| E6 ✅ LOCKED | **Two-layer resolution: automatic round resolution + teacher-triggered epoch RESOLVE** | Layer 1 fires automatically after each round submission — student devices show immediate stat/resource changes. Layer 2 is Scott's RESOLVE button on the projector — class-wide dramatic moment, map updates, events fire. Outcome math may be algorithmic, AI-generated (Haiku from game state), or teacher-overridden. Scott hits the button; the system does the work; Scott narrates. → **Decision 31** |
| E7 ✅ LOCKED | **7/8 class runs same 4-round epoch structure as 6th grade — just faster** | Same BUILD → EXPAND → DEFINE → DEFEND loop. 15 fewer minutes = tighter per-round discussion, not a structural change. Configurable round timer per class. → **Decision 44** |
| E8 ✅ LOCKED | **Exit ritual: Haiku-generated preview card on logout screen** | At RESOLVE time, Haiku generates a per-team hook sentence based on current game state and next-epoch threat/opportunity. Displays on every student screen + projector mirror on logout. Students carry that line into the hallway. → **Decision 46** |

---

### CATEGORY 3 — The Decision System
*How a team moves from discussion to submission.*

| # | Question | Why It Matters |
|---|---------|---------------|
| W-NEW1 ✅ LOCKED | **Is the written piece a PRE-decision memo or POST-decision reflection?** | ✅ PRE-decision. Student writes WHY before submitting, before teacher resolves. Decision 21 already locks this. See Decision 80. |
| W-NEW2 ✅ LOCKED | **Is the written component submitted inside the app or on paper?** | ✅ In-app. Attached to submission, logged in DB, visible to Scott before resolution, exported to portfolio PDF. Decision 21 confirms. See Decision 80. |
| W-NEW3 | ~~**Does Scott READ written reasoning before resolving turns?**~~ | ✅ LOCKED — Yes. Written reasoning submitted before resolution. Stronger historical justification = better game outcome. See Decision 22. |
| W-NEW4 ✅ LOCKED | **How leading/scaffolded do the written prompts need to be?** | ✅ Grade-differentiated. 6th = sentence starters with historical anchors. 7/8 = guided questions. Per-class config, adjustable mid-unit. See Decision 80. |
| W-NEW5 ✅ LOCKED | **Is the written component submitted in-app or on paper?** | ✅ Duplicate of W-NEW2. In-app. See Decision 80. |
| D1 ✅ LOCKED | **Each role submits independently — but all roles must submit before the round closes** | Every role has their own submission row (Architect submits to BUILD, Warlord submits to DEFEND, etc.). The round doesn't close until all present roles have submitted. Scott sees who pulled their weight. Absent students leave a visible gap. No one can free-ride on the team's submission. → **Decision 32** |
| D2 ✅ LOCKED | **What if the team doesn't agree?** | ✅ Leading role has final authority. No formal vote. No overthrow mechanic. Advisory input from other roles visible to Scott. See Decision 80. |
| D3 ✅ LOCKED | **How many decisions does a team make per epoch?** | ✅ 4 per epoch — one per round (BUILD, EXPAND, DEFINE, DEFEND). Each student submits 4 times, leads 1. See Decision 80. |
| D4 ✅ LOCKED | **Are decisions presented AS questions, or as an open action menu?** | ✅ Question-based with 2–4 contextual options + free-text "propose your own action" alternative. See Decision 80. |
| D5 ✅ LOCKED | **What does the decision input screen look like for a student?** | ✅ Card-style: round name + context prompt + option buttons + free-text + scaffolded justification area. Submit grayed until option + 2-sentence minimum. See Decision 80. |
| D6 ✅ LOCKED | **Does the game remember what decisions a team made and why?** | ✅ Yes — everything logged: team_id, student_id, role, epoch, round, option, justification, multiplier, teacher edits, consequences. This IS the portfolio backbone. See Decisions 21, 22, 32, 74, 80. |

---

### CATEGORY 4 — Map, Tiles & Territory
*The board itself.*

| # | Question | Why It Matters |
|---|---------|---------------|
| M1 ✅ LOCKED | **No hex tiles, no square tiles — named geographic sub-zones within each macro-region.** | Each of the 12 macro-regions is divided into 5–8 named geographic sub-zones (pre-drawn GeoJSON polygons). Sub-zones are terrain-tagged and curriculum-named: Copper River Delta, Nile River Valley, Straits of Gibraltar, Mongolian Steppe, etc. Expansion = claiming a named sub-zone. Buildings placed in a sub-zone. Scouts reveal adjacent sub-zones. Fog of war lifts per sub-zone. → **Decision 61** |
| M2 ✅ LOCKED | **How big is one tile, and how many tiles per region?** | ✅ Obsolete. Decision 61 replaced tiles with named sub-zones (5–8 per region, ~60–80 total). See Decision 81. |
| M3 ✅ LOCKED | **What information does a sub-zone hold?** | ✅ Name, region_id, terrain_type, yield modifiers, owner_team_id, fog_state, buildings, units, GeoJSON, cultural_influence overlay. See Decision 81. |
| M4 ✅ LOCKED | **How does fog of war work mechanically?** | ✅ Per-team, per-sub-zone. Starts hidden. Scout reveal = permanent. Independent per team. Optics = 3×. Torii Gate = full clear. DB: team_fog_state junction table. See Decision 81. |
| M5 ✅ LOCKED | **Can two civilizations occupy the same sub-zone?** | ✅ Units coexist (open borders default). Ownership (buildings, claims) is exclusive. Contesting owned territory = Decision 59. See Decision 81. |
| M6 ✅ LOCKED | **Does the map need to be geographically accurate to real Earth?** | ✅ Yes. Decision 1 locks Real Earth, Leaflet-based. GDA map reusable. Accuracy IS the educational payload. See Decision 81. |

---

### CATEGORY 5 — Game Mechanics (The Civ Layer)
*Resources, buildings, tech, wonders, trade, military.*

| # | Question | Why It Matters |
|---|---------|---------------|
| G1 ✅ LOCKED | **6 tracked dimensions: 4 economy resources + Food 🌾 + Population 👥 as separate survival layer** | The 4 core resources (Production ⚙️, Reach 🧭, Legacy 📜, Resilience 🛡️) flow through the Spend/Contribute/Bank routing panel. Food and Population are the survival layer — not routed, not contributed to wonders. Food is generated passively by buildings and consumed continuously. Population is a numeric count that grows/shrinks based on food and events. → **Decision 41** |
| G2 ✅ LOCKED | **Yes — regions have different natural advantages. Inequality is intentional and visible on draft day.** | Each region has a terrain-based bonus profile displayed on the draft screen. The Nile gets food, the steppe gets reach, the mountains get resilience. Draft order (earned via Kahoot) makes the selection meaningful — you know what you're trading away when you pick. → **Decision 60** |
| G3 ✅ LOCKED | **5-tier tech tree, prerequisite chains, Legacy-funded research, ~30 techs, designed for 6-week arc.** | Research currency: Legacy 📜 from DEFINE round. Teams pick one active research project per epoch and contribute Legacy toward it. Hard prerequisite gates — no skipping tiers. Vassal States unlocked via Feudalism (Tier 4). Cultural victory path and expanded government forms gated behind higher tiers. → **Decision 62** |
| G4 ✅ LOCKED | **12 team-specific wonders: free placement, all 4 resource tracks required, tiered milestones, HeyGen completion event.** | Any team builds any wonder anywhere — strategic choice is the bonus, not the location. All 4 resource tracks must advance (neglected round = visible gap). Milestones at 25/50/75% give temporary perks. Full completion = permanent bonus + projector HeyGen moment. Teams can build multiple wonders across the simulation. → **Decisions 36, 37, 38, 39, 40** |
| G5 ✅ LOCKED | **Two-tier trade: Spot Trade Board (open market, any civ, anonymous, RESOLVE-executed) + Trade Agreements (named multi-epoch auto-executing contracts between specific civs, Diplomat-managed). Embargo available. Resources only — tech and territory not tradeable.** | See Decision 69. |
| G6 ✅ LOCKED | **Military: Soldiers built via Resilience, DEFEND round hijacked into Battle Round on conflict approval, d20 + justification + buildings determine outcome, territory contestable across epochs.** | Warlord role owns military. Soldiers are mobile map units. Conflict requires Diplomat escalation first + DM approval. Battle Round fires in place of normal DEFEND. Barracks = attacker bonus, Walls = defender bonus. Loser takes Resilience suppression + unit losses + possible tile transfer. Territory can be retaken. → **Decisions 28, 29, 59** |
| G7 ✅ LOCKED | **Population: display + yield multiplier + capacity unlock. Food passive from Farm/Granary. Starvation = shrinking population = weaker everything.** | Population is a full mechanical layer — visible count, yield modifier, unit cap, building slot unlock. Farm auto-generates food each epoch if built. No Farm = slow population risk. Granary expands food cap. Population mechanics (exact formula, crisis thresholds) locked conceptually; exact numbers TBD in build. → **Decisions 41, 43, 45** |
| G8 ✅ LOCKED | **Events: d20 random event once per day (team-specific roll) + teacher-fired curriculum events + optional HeyGen narrator clip + Kaiju chaos button.** | d20 fires one event per class day at a random round — moderate positive/negative on a curve, never civilization-ending. Scott fires curriculum events (plague, golden age, raider wave) separately at any time. Global events broadcast to projector + all devices simultaneously. Kaiju is cosmetic chaos with zero game impact. → **Decisions 33, 34, 51** |
| G9 ✅ LOCKED | **Cultural Victory is a formal win condition. CI is a separate tracked score. Physical student art = real CI bonus. No artist = no bonus. Historically accurate inequality.** | See Decision 67. |
| G10 ✅ LOCKED | **Final epoch = Epilogue Epoch. No resources, no combat. Haiku civ histories read aloud, victory reveals, class superlative vote, portfolio export PDF, HeyGen historian closing narration.** | See Decision 68. |
| V1 ✅ LOCKED | **Vassal tribute: auto-pull. War obligation: yes but refusable at cost. Conquest: vassal goes free. Chains: flat only. DM panel: full visibility.** | See Decision 63. |
| NPC1 ✅ LOCKED | **5 archetypes: Horde, Sanctuary, Colossus, Caravan, Recluse. Real Reputation DB value. Tech-tier lifecycle triggers. Empire rise/peak/decline/fall with contested territory aftermath. Rome and Mongols preset.** | See Decision 64. |
| TIMING1 ✅ LOCKED | **Option C: simultaneous resolution. Both classes submit → Pending. Scott RESOLVES every morning during prep. Map updates. Grace mode queues pending submissions if he misses a day.** | See Decision 66. |

---

### CATEGORY 5B — The Grand Project Mechanic
*The Civ caravan/shields system. Long-arc construction. The thing that takes the whole simulation to build.*

> **Scott's reference:** In Civ 1–3, you could send a caravan from one city to another and those shields (production) would contribute to a building or wonder in the destination city. For a world wonder like the Pyramids, caravans from across your empire would slowly fill the progress bar. He wants something like this — but teams earn contribution through each round, and can route production toward immediate needs OR a long-arc Grand Project that takes most of the simulation.

| # | Question | Why It Matters |
|---|---------|---------------|
| GP1 ✅ LOCKED | **Team-specific Grand Project — 12 wonders, one per region, build anywhere** | Each team builds ONE wonder across the whole simulation. Wonders are sourced from all 12 starting regions but placement is completely free — a team can build ANY wonder anywhere. The Taj Mahal in Alaska. The Trans-Alaska Pipeline in South America. Geographically anachronistic and entirely intentional — teams choose the benefit they need, not the structure they're geographically near. Each wonder has one massive unique permanent bonus that activates on completion. Full roster locked — see GP1-W. → **Decision 36** |
| GP1-W ✅ LOCKED | **The 12 Wonders — roster, source region, and completion bonus** | See table below. |

**THE 12 WONDERS OF CLASSCIV**

| # | Wonder | Source Region | Completion Bonus |
|---|--------|-------------|------------------|
| 1 | **Trans-Alaska Pipeline** | Alaska + W. Canada | All trade routes and caravans move at double speed permanently. Supply chains never break. |
| 2 | **Brooklyn Bridge** | Eastern Canada + Eastern US | Unlocks diplomacy with ANY team regardless of contact state. You can talk to anyone, anywhere, anytime. |
| 3 | **Grand Coulee Dam** | Western US + Mexico + C. America | BUILD round production doubles every epoch from completion forward. The engine of your civilization runs hot. |
| 4 | **El Castillo** (Chichen Itza) | Caribbean + N. South America | All DEFINE round Knowledge gains double. Your civilization's scholars and lorekeepers are the sharpest in the world. |
| 5 | **Machu Picchu** | Southern South America | Your civilization is immune to all military attacks for 2 full epochs after completion. Untouchable in the mountains. |
| 6 | **The Colosseum** | Western Europe + Mediterranean | All DEFEND rounds auto-resolve at minimum success threshold — you are never exposed, never undefended. |
| 7 | **Stonehenge** | Northern Europe + British Isles | Immune to all d20 negative event rolls from completion forward. The stones hold. Bad luck cannot touch you. |
| 8 | **Great Pyramid of Giza** | North Africa + Middle East | All Grand Project contributions cost half the production points. Build faster than anyone. Legacy multiplied. |
| 9 | **Great Zimbabwe** | Sub-Saharan Africa | All trade routes generate double resources. Wealth compounds every epoch. |
| 10 | **Trans-Siberian Railway** | Russia + Caucasus + C. Asia | Territory expansion costs zero production for 3 epochs after completion. You cover ground like nobody else. |
| 11 | **Taj Mahal** | South Asia + East Asia | No team may declare war on you after completion. Cultural dominance is total protection. |
| 12 | **Floating Torii Gate** (Itsukushima) | Pacific + Japan + Korea + Australia | Fog of war clears across the ENTIRE map for your team on completion. You see everything. |
| GP2 ✅ LOCKED | **4-resource, 4-track economy — every round generates its own resource type, all four feed the wonder** | Each round generates one primary resource: BUILD→Production ⚙️, EXPAND→Reach 🧭, DEFINE→Legacy 📜, DEFEND→Resilience 🛡️. The wonder has 4 matching contribution tracks — one per round. All four tracks must advance. A team that neglects DEFEND has a wonder with a thin Fortification track. Yield formula: Base Yield × Written Justification Multiplier × d20 modifier (if event fires that round). → **Decision 37** |
| GP3 ✅ LOCKED | **Explicit per-epoch routing: Spend / Contribute / Bank — visible team decision after each round** | After a round resolves, the team sees: *"You earned 12 Production this round."* They choose how to split it: SPEND (buy from the purchase menu immediately), CONTRIBUTE (route to the wonder's matching track), or BANK (hold it — but banked resources decay slowly and can be stolen by events). This is a visible, explicit choice — not an automatic calculation. The routing panel is the Oregon Trail supply-buying screen reborn. → **Decision 38** |
| GP4 ✅ LOCKED | **Full purchase menu + degradation table — see Economy Architecture section** | Buildings (permanent, map-placed): Farm, Granary, Barracks, Market, Aqueduct, Library, Walls. Units (mobile, can be lost): Scout, Soldier, Merchant, Builder. Supplies (consumable, deplete over time): Food Stores, Medicine, Repair Tools. Full degradation rules: what can break, be stolen, or depleted by which event types. → **Decision 39. See ECONOMY ARCHITECTURE section below.** |
| GP5 ✅ LOCKED | **Wonder completion is a continuous pursuit — teams produce until done, then start the next. Tiered milestones give partial credit. Completion is a class-wide event.** | Teams contribute to their wonder every round they're able. No hard deadline. When it's done, start the next one — teams can build multiple wonders across the simulation (revises Decision 36 one-wonder cap). Completion: big projector eruption, dramatic animation, Scott narrates, whole class hears the bonus go live. Partial: tiered milestones at 25/50/75% unlock small temporary perks (not permanent — just keeps momentum alive for teams behind the curve). → **Decision 40** |

---

### CATEGORY 6 — Teacher / DM Control Panel
*The God view. Everything Scott can see and touch that students can't.*

| # | Question | Why It Matters |
|---|---------|---------------|
| T1 ✅ LOCKED | **Teacher dashboard: map left (god-view), submission queue right, DM controls bottom** | Left panel: full Leaflet map with fog removed, all territories visible, unit positions, event queue overlaid. Right panel: submission queue — which teams have submitted this round, which are pending (green/red per team per role). Bottom bar: DM controls — fire event, pause all timers, override a submission, trigger Kaiju, hit RESOLVE. → **Decision 47** |
| T2 ✅ LOCKED | **Hard PAUSE button — freezes all timers, holds all submissions, projects PAUSED state** | Single button on the DM controls bar. Freezes all round timers across all student devices. Holds the submission queue (no new submissions accepted while paused). Projector shows a PAUSED overlay so the class knows the game is stopped. Unpause resumes all timers from where they stopped. → **Decision 48** |
| T3 ✅ LOCKED | **Full override: teacher can edit submitted text AND attach an outcome modifier** | Both. Full edit access to what the team wrote before RESOLVE runs. Plus a separate DM consequence field Scott can attach (e.g., "You built it — but here's what that cost you historically"). Original submission is preserved in DB with edit history. → **Decision 49** |
| T4 ✅ LOCKED | **Private intel drop: dramatic full-screen interrupt on target team's screens only, then fades** | Scott types the message, targets a team, fires it. Their screens go into a dramatic interrupt modal — styled like a scroll or dispatch, visible only to them. Fades after they dismiss it. Never appears on the projector. Never visible to other teams. → **Decision 50** |
| T5 ✅ LOCKED | **Global event: dramatic projector overlay + simultaneous push to all student devices** | Scott fires it from the DM bar. Projector erupts with a full-screen announcement overlay. Every student MacBook receives the same notification simultaneously via Supabase Realtime. Both hit at the same time. → **Decision 51** |
| T6 ✅ LOCKED | **Speed up: yes. Roll back: no.** | Scott can compress a round timer or skip ahead to close an epoch early when time is short. He cannot revert a team's game state. Consequences stand. If a decision was bad, the DM consequence field (Decision 49) is the teaching tool — steer from where it is, don't erase it. History doesn't roll back. Neither does ClassCiv. → **Decision 52** |

---

### CATEGORY 7 — Inter-Class Contact & The Colonial Moment
*The most consequential design decision in the whole project.*

| # | Question | Why It Matters |
|---|---------|---------------|
| C1 ✅ LOCKED | **Both classes know everything, always. Fair game from day one.** | Each continent has representatives from BOTH classes. 6th grade civs aren't isolated in the Americas — they're global, same as 7/8. Everyone knows the other class exists and is on the same map from the first epoch. Contact isn't a surprise colonial discovery moment — it's an inevitable collision both sides can see coming. This reframes the entire dynamic: Both sides are peers on a globe-spanning map with full awareness and agency. → **Decision 53** |
| C2 ✅ LOCKED | **Auto-fires on proximity, with DM override.** | When a team from one class enters contact range of a team from the other class, the system fires the contact event automatically — both teams see a contact notification, projector gets the announcement. Scott has a manual override on the DM bar to suppress, delay, or trigger contact himself if the automatic fire lands at a bad moment. Default is automatic. Control is always available. → **Decision 54** |
| C3 ✅ LOCKED | **Contact window toggle on the DM bar. Off by default. Scott flips it when the curriculum is ready.** | Proximity detection runs all the time. But contact events cannot fire until Scott opens the window. Default state = suppressed, no matter how close teams get. When Scott has done the pre-contact lesson and the class is ready for that chapter, he flips the toggle. From that point, C2 takes over — auto-fires on proximity, DM override available. The switch is the game master staying ahead of his own simulation. → **Decision 56** |
| C4 ✅ LOCKED | **Trade (Merchant), alliance and diplomacy (Diplomat) — conflict gated, not instant. No ignoring.** | On contact, teams must engage — no silent treatment. Diplomat role owns all diplomatic interaction: alliance proposals, grievances, formal exchanges. Merchant role owns trade: resource offers, exchange terms. Conflict is not a button — it requires diplomatic contact first, then an escalation declaration routed through Scott's DM bar for approval before anything fires in the game. Conflict mechanics (what actually happens when conflict resolves) flagged as a separate question. → **Decision 57** |
| C5 ✅ LOCKED | **No pre-framing. These kids grew up together. Trust the room.** | The classroom community doesn't map to the historical dynamic the game depicts. These aren't strangers divided by historical grievance — they're kids who have been together their whole lives. No colonizer/colonized racial framing gets imported into a room that didn't invite it. No built-in emotional scaffolding, no pause-for-identity-work protocol. Scott reads the room and handles what comes up — but that's teaching, not game design. The contact event fires as a game event. The room will be fine. → **Decision 58** |

---

### CATEGORY 8 — Student UX & Interface
*What a kid actually sees on their MacBook.*

| # | Question | Why It Matters |
|---|---------|---------------|
| U1 ✅ LOCKED | **Individual logins. Every student has their own Clerk account and sees their own role-specific dashboard. No shared screens, no crowding.** | See Decision 70. |
| U2 ✅ LOCKED | **Landing screen = role panel. Persistent top bar shows team's 4 resources + CI score + current epoch. Map is a tab, not the default. Their job is the first thing they see.** | See Decision 70. |
| U3 ✅ LOCKED | **Map visible on every student screen as a tab — always accessible, never the default. Shows their territory, fog of war, known NPC positions. No other teams' resource data.** | See Decision 70. |
| U4 ✅ LOCKED | **Complexity unlocks with the tech tree. Day 1 UI is simple. A Warlord on Epoch 1 sees: units, DEFEND/EXPAND button, army strength. Cavalry option doesn't appear until Horseback Riding is researched. Every icon labeled.** | See Decision 70. |
| U5 ✅ LOCKED | **No open chat. No direct messaging. Diplomacy proposals route through the Diplomat's submission interface — Scott sees every one on his DM panel before resolution. In-person verbal negotiation IS the diplomacy. The game records and executes what they agreed to face-to-face.** | See Decision 70. |
| U6 ✅ LOCKED | **Student MacBooks are silent. All audio comes from the classroom projector computer — event stings, fanfares, HeyGen clips. Individual device sound in a classroom is a chaos machine.** | See Decision 70. |

---

### CATEGORY 9 — Classroom Display (The Projector)
*The shared screen that makes the room collective.*

| # | Question | Why It Matters |
|---|---------|---------------|
| P1 ✅ LOCKED | **Default projector display = the world map, full screen, live, always. No leaderboard, no resource counts — those are private. The map IS the shared world.** | See Decision 76. |
| P2 ✅ LOCKED | **Resolution sequence = 8–12 seconds of animation: territory shifts, wonder completions, event cards, Pyrrhic messages, NPC activations. Map settles into resolved state. The room reacts. That reaction is the moment.** | See Decision 76. |
| P3 ✅ LOCKED | **Two separate computers. Classroom computer logged into `projector` role account — display-only, server-driven, no interaction needed. Scott's desk computer logged into `teacher` DM role — full god-view. Scott pushes events to the projector from his desk. Zero overlap, zero leakage.** | See Decision 76. |
| P4 ✅ LOCKED | **Teams name their civilization on Day 1. Scott approves before the name goes live anywhere. Named civs appear on projector, in Haiku text, in portfolio export. Inappropriate names blocked at DM approval gate.** | See Decision 76. |

---

### CATEGORY 10 — Absent Students & Edge Cases
*What happens when it gets weird — and it will get weird.*

| # | Question | Why It Matters |
|---|---------|---------------|
| A1 ✅ LOCKED | **Absent role → present teammate absorbs it (team votes; Scott assigns if no consensus). No AI fill. No vacancy.** | See Decision 71. ✅ **IMPLEMENTED:** `GET/POST/DELETE /api/games/[id]/covers` records substitute assignments. REASSIGN dropdown on `/dm/roster` shows present teammates. Cover auto-clears when student marked present. |
| A2 ✅ LOCKED | **No ghost civs. Every absent role is redistributed to a present teammate. Someone is always covering.** | See Decision 71. ✅ **IMPLEMENTED:** `epoch_role_assignments` rows with `is_substitute: true` track all active covers. |
| A3 ✅ LOCKED | **No in-app catch-up system. Teammates debrief the returning student in-person. That conversation IS the learning.** | See Decision 72. |
| A4 ✅ LOCKED | **Conflict rule: war declaration beats trade submission. Scott gets a conflict flag on DM panel with manual override options.** | See Decision 72. |

---

### CATEGORY 11 — Scoring, Victory & End Game
*How it ends, and what it means.*

| # | Question | Why It Matters |
|---|---------|---------------|
| S1 ✅ LOCKED | **Yes, there is a winner — but the game always runs to completion. No Domination victory. Final standings (1–6 per class) calculated at Epilogue. Victory conditions are constructive: Economic, Population, Cultural, Scientific, and the wild-card Endgame Epoch (Mars colonization / alien contact).** | See Decision 74. |
| S2 ✅ LOCKED | **Multiple victory paths: Economic growth, Population, Cultural Influence, Scientific research tier reached first. No Domination. Endgame Epoch adds Mars/alien narrative finisher for the whole class.** | See Decision 74. |
| S3 ✅ LOCKED | **Final epoch = Epilogue Epoch. Haiku civ histories, victory reveals, superlative vote, portfolio export PDF, HeyGen historian closing narration.** | See Decision 68. |
| S4 ✅ LOCKED | **Portfolio export PDF is the grade artifact. Scott grades the portfolio, not the game outcome. Score/standing affects nothing on the report card.** | See Decision 74. |
| S5 ✅ LOCKED | **No full collapse. A civ that hits crisis thresholds enters a Dark Ages state — reduced yields, no expansion, but fully recoverable. Students stay in the game.** | See Decision 75. |

---

### CATEGORY 12 — Equity & Representation
*Every civilization on this map is treated as a full civilization. Same rules. Same board. That’s the whole policy.*

| # | Question | Why It Matters |
|---|---------|---------------|
| N1 ✅ LOCKED | **Indigenous civs get the same mechanics as every other civ. They are full civilizations, not a special category.** | See Decision 73. |
| N2 ✅ LOCKED | **No separate indigenous mechanics. Same tech tree, same economy, same roles. Sophistication is expressed through historical framing, not a different ruleset.** | See Decision 73. |
| N3 ✅ LOCKED | **No consultation mechanic built into the game. Scott knows his community. Contact events are DM-controlled narrative — same as every other d20 event.** | See Decision 73. |
| N4 ✅ LOCKED | **Contact event tone is controlled by Scott at the DM panel, same as every other event. Framing is his to set, class by class, day by day.** | See Decision 73. |

---

### CATEGORY 13 — Assessment & Educational Standards
*Why the principal lets this happen.*

| # | Question | Why It Matters |
|---|---------|---------------|
| AS1 ✅ LOCKED | **Which Alaska state standards does the game explicitly address?** | ✅ Geography, History, Government, Economics, ELA. Formal crosswalk = pre-launch documentation task, not a build blocker. See Decision 82. |
| AS2 ✅ LOCKED | **Is there an individual written component?** | ✅ Yes — 4 justifications per epoch, in-app (Decision 21). The game IS the writing assignment. See Decision 82. |
| AS3 ✅ LOCKED | **Does the game produce anything exportable for a portfolio or parent report?** | ✅ Yes — portfolio export PDF at Epilogue (Decisions 68, 74). Full simulation record. See Decision 82. |
| AS4 ✅ LOCKED | **Is this a formative or summative assessment — or both?** | ✅ Both. Justification multiplier = formative (immediate feedback). Portfolio PDF = summative (full arc). See Decision 82. |

---

### CATEGORY 14 — Auth, Identity & Data Privacy
*COPPA, FERPA, and keeping parents comfortable.*

| # | Question | Why It Matters |
|---|---------|---------------|
| ID1 ✅ LOCKED | **How do students log in?** | ✅ Clerk accounts with code-based login. Scott pre-creates accounts, hands out login cards. No Google SSO dependency. See Decision 83. |
| ID2 ✅ LOCKED | **Is any student PII stored?** | ✅ Minimal. First name + class code only. No last names, birthdates, addresses. Scott keeps ID mapping locally. COPPA/FERPA compliant. See Decision 83. |
| ID3 ✅ LOCKED | **Does the teacher need a separate account?** | ✅ Yes — three auth roles (Decision 76): student, teacher, projector. No admin layer v1. See Decision 83. |
| ID4 ✅ LOCKED | **What happens to the game data at the end of the unit?** | ✅ Export portfolio PDFs, soft-archive game state. NEW GAME creates fresh instance without destroying old. See Decision 83. |

---

### CATEGORY 15 — Tech Stack, Architecture & Hosting
*How it gets built and where it lives.*

| # | Question | Why It Matters |
|---|---------|---------------|
| TS1 ✅ LOCKED | **What is the confirmed tech stack?** | ✅ Next.js App Router + TypeScript + Tailwind, Supabase (PostgreSQL + Realtime), Clerk, Vercel, Leaflet, Claude (Haiku live / Sonnet build-time), HeyGen + Starfish TTS. See Decision 84. |
| TS2 ✅ LOCKED | **How does real-time sync work?** | ✅ Supabase Realtime (PostgreSQL changes broadcast via WebSocket). Projector subscribes to game_state changes. No polling. See Decision 84. |
| TS3 ✅ LOCKED | **What are the core database tables?** | ✅ ~25 tables: games, epochs, rounds, civilizations, students, roles, resources, decisions, justifications, events, wonders, techs, trade_offers, npc_encounters, sub_zones, fog_of_war, military_shadow, population, portfolio_entries, etc. See Decision 84. |
| TS4 ✅ LOCKED | **How do views share a single deployment?** | ✅ Same URL, role-based routing. /dashboard (students), /dm (teacher), /projector. Clerk middleware + RLS enforce access. See Decision 84. |
| TS5 ✅ LOCKED | **What are hosting costs at classroom scale?** | ✅ Effectively free. Vercel free tier, Supabase free tier (500MB), Clerk free tier (10K MAU). AI narration = only metered cost (<$5/mo). See Decision 84. |
| TS6 ✅ LOCKED | **What is the architecture philosophy?** | ✅ Prototype-first, product-aware. Build for Scott's classroom, don't block scaling. Supabase RLS + Clerk roles = multi-tenant ready without building multi-tenancy. See Decision 84. |
| TS7 ✅ LOCKED | **Is AI event narration v1 or v2?** | ✅ v1. Claude Haiku generates epoch narration at RESOLVE. Cost negligible. Projector reads AI-narrated events aloud — THE spectacle moment. See Decision 84. |

---

### CATEGORY 16 — Build Order & MVP
*What gets built first — and what does "done" mean for launch.*

| # | Question | Why It Matters |
|---|---------|---------------|
| B1 ✅ LOCKED | **What is the MVP feature set?** | ✅ Auth (Clerk) + map (Leaflet) + roster/teams + decision submissions + DM panel + resource tracking + projector view. That's playable. See Decision 85. |
| B2 ✅ LOCKED | **What is the target launch date?** | ✅ First class day after spring break (~early-mid April 2026). ~4 weeks build window. Tight but achievable for MVP scope. See Decision 85. |
| B3 ✅ LOCKED | **What is the build sequence?** | ✅ 14-phase sequence: 1) Supabase schema + RLS, 2) Clerk auth, 3) Student dashboard, 4) DM panel, 5) Projector, 6) Map (Leaflet), 7) Teams/roster, 8) Decision submissions, 9) Resource engine, 10) AI narration, 11) Question bank, 12) RESOLVE animation, 13) Portfolio export, 14) Polish. See Decision 85. |
| B4 ✅ LOCKED | **Can the GDA Leaflet map be reused?** | ✅ Yes. Same Leaflet setup, different data layer. GDA tile boundaries → ClassCiv sub-zones. Scott already knows the tooling. See Decision 85. |
| B5 ✅ LOCKED | **Who is building this?** | ✅ Scott + AI (Claude). Solo developer with AI pair-programming. No team, no contractors. Scope must stay achievable for one person. See Decision 85. |

---

*75 questions. Work two at a time. This is the map. Scott leads.*

---

## THE CONCEPT IN ONE PARAGRAPH

A browser-based, teacher-run, team-played strategy game that runs as a class-wide anchor project over days or weeks. Teams of 3–5 students represent civilizations — building, expanding, trading, and surviving. Civilization provides the architecture: turn-based strategy, resource management, tech trees, diplomacy, territory, and multiple paths to victory. Oregon Trail provides the narrative spine: a journey with real stakes, random events that hit hard, resource tension, and decisions that matter and cannot be undone. The teacher is the Game Master — watching the board, injecting events, steering the curriculum. Geography, history, economics, tactics, and collaboration aren't the game's "educational layer." They ARE the game.

---

## WHY THIS WORKS IN A CLASSROOM

### What Civilization Gets Right (That Classrooms Never Use)
Sid Meier's core design philosophy is "a series of interesting decisions." Every turn, you face tradeoffs. More food OR more production? Build an army OR expand culturally? Ally with a neighbor OR go independent? There is no correct answer — only your answer and its consequences. This is how teachers wish students engaged with history, geography, and economics. Civilization has been teaching this since 1991. We're finally bringing it into the classroom where it belongs.

### What Oregon Trail Gets Right (That Civilization Doesn't Have)
Oregon Trail creates *stakes*. You care about your party because they're *yours*. Random events punch with real force: dysentery isn't a stat — it's a death. The game forces resource prioritization under uncertainty (do I spend money on medicine or food?), generates genuine emotional investment, and produces stories teams remember years later. Civilization is sprawling strategy. Oregon Trail is gut-punch survival narrative. Together: a game a middle schooler cannot put down.

### Why Team-Based Changes Everything
Individual games end when interest does. A team game is social — you can't quit without abandoning your teammates. The Architect can't ignore the Merchant's resource warning. The Warlord's military choices affect everyone. The Diplomat's failed negotiation with another team has consequences the whole class can see. And when your civilization falls to a plague event while the other team thrives, the debrief writes itself: *"What could you have done differently?"* That question — that's the lesson.

---

## THE CIVILIZATION MECHANICS WE'RE BORROWING
> *Reference section: documents what ClassCiv borrows FROM original Civilization (Sid Meier's). Resource names below (Gold, Science, Culture) are original Civ resources — ClassCiv's own resources are Production ⚙️, Reach 🧭, Legacy 📜, Resilience 🛡️, Food 🌾, Population 👥 (Decision 41). This section is design ancestry, not game spec.*

### The Map
- Hex-grid or square-grid tile map (decision: see Open Questions)
- Tiles have terrain types: **grassland, plains, hills, mountains, rivers, forests, desert, coast**
- Different terrain = different yields (food, production, gold, etc.)
- Resources distributed on tiles: **bonus** (always visible), **strategic** (revealed by tech — iron, horses, coal), **luxury** (happiness/culture bonuses)
- Fog of war — teams only see explored tiles
- Teacher sees the FULL MAP at all times

### Cities and Settlements
- Each team starts with one **settlement** (founding city)
- Cities grow when food surplus fills a growth bar
- Cities produce **units** and **buildings** over turns using production points
- Buildings improve city yields: granary (+food), market (+gold), library (+science), barracks (+military)
- Expanding: teams can found new settlements by sending a **Settler unit** to an empty tile

### Yields — The Five Resources
Every city generates these each turn based on tiles worked and buildings owned:

| Yield | What It Does | How You Get More |
|-------|-------------|-----------------|
| 🌾 **Food** | City grows; keeps population alive | Farm tiles, rivers, grassland, granary |
| ⚙️ **Production** | Build things faster | Mine tiles, hills, forests, workshop |
| 💰 **Gold** | Trade, upgrade units, buy buildings | Market tiles, coast, trade routes |
| 📚 **Science** | Advance the tech tree | Libraries, universities, great scientists |
| 🎭 **Culture** | Advance the civics tree | Monuments, amphitheaters, artists |

### The Tech Tree
Linear + branching research tree. Each tech takes X turns of accumulated science to unlock. Unlocks:
- New unit types (warriors → swords → cavalry → cannons)
- New buildings (granary → aqueduct → hospital)
- New tile improvements (farms, mines, roads, irrigation)
- Strategic resource access (can't use iron until you've researched Iron Working)

**Educational hook:** The tech tree IS a history timeline. Unlocking Writing means your civilization has writing. Unlocking Sailing opens coast tiles and trade. Unlocking Printing Press gives you a culture boost. The teacher can tie each unlock to a lesson beat.

### The Civics Tree (Government)
Parallel to tech tree but driven by culture points. Unlocks:
- Government types (Chiefdom → Monarchy → Republic → Democracy)
- Policy cards (slot into your government for bonuses: +10% production, +1 gold per trade route, etc.)
- Diplomatic options (embassies, alliances, open borders)

**Educational hook:** Students literally choose their government and experience tradeoffs. A Monarchy produces units faster but loses culture. A Republic produces more gold. Democracy is harder to maintain but generates happiness. This is a political science lesson that plays like a video game.

### Military Units and Combat
- Units belong to a team's civilization
- Units occupy tiles — one unit per tile (movement and blocking)
- Combat: attacker and defender calculate strength + terrain bonus + unit type modifier
- Casualties: units don't die instantly — they take damage, can be healed by skipping a turn
- Unit types: Warrior, Archer, Horseman, Catapult/Siege, Scout (civilian-ish, fast, no attack)

**Keep it simple for v1:** No deep combat formula. Strength + die roll. Teacher can adjudicate.

### Diplomacy Between Teams
- Teams can **open borders** (units can pass through each other's territory)
- **Trade routes**: one team's gold surplus helps another team's production
- **Alliances**: military cooperation, share map vision
- **Declarations of war**: no surprise attacks — a team must declare war one turn before attacking
- **Denouncements**: public accusation of bad behavior — all teams see it, costs the accused team culture
- **World Congress**: teacher can call an all-class vote on a rule change, resource redistribution, or historic event. Teams vote. Majority wins. This is real history in motion.

### Victory Conditions
Multiple paths — teams can win different ways:

> ⚠️ **Pre-lock brainstorm. Victory conditions locked in Decision 74:** Economic, Population, Cultural, Scientific, Endgame Epoch (wild card). **No Domination. No Geographic. No Survival.** The rows below are early concepts — some were cut, some evolved. Decision 74 is authoritative.

| Victory | How | Educational Hook |
|---------|-----|-----------------|
| 🗺️ **Geographic** | First team to reveal 80% of the map | Geography: terrain, exploration |
| 📚 **Scientific** | First team to complete the tech tree | Science, history of innovation |
| 🎭 **Cultural** | Highest culture score when the game ends | Arts, government, soft power |
| 💰 **Economic** | Richest civilization (gold + trade buildings) | Economics, trade, resources |
| 🧭 **Survival** | Oregon Trail style — all party members reach an objective alive | Resource management, survival |
| 📖 **Knowledge** | Complete all assigned learning activities tied to game events | Teacher-controlled, ties to curriculum |

**Class design note:** Teacher chooses which victory conditions are active at game start. First week of class might be Geographic + Scientific only. Active conditions are configured in game setup — see Decision 74 for the locked ClassCiv victory condition set (no Domination).

---

## THE OREGON TRAIL MECHANICS WE'RE BORROWING

### The Supply System (The Gut-Punch Layer)
On top of the Civ resource system, teams track **survival supplies** that can be depleted by events:

| Supply | Default | Can Be Lost By |
|--------|---------|---------------|
| 🥩 Food | 100 | Drought event, population growth, failed hunt, long march |
| 💊 Medicine | 20 | Disease event, injury event |
| 🪵 Materials | 50 | Construction, fixing broken infrastructure |
| 🐎 Draft Animals | 5 | Injury event, overwork, battle casualties |

These are separate from city yields. They are the team's **traveling inventory** — what they have RIGHT NOW, not what they produce per turn. Run them to zero and bad things happen.

### The Journey Spine (Teacher-Controlled)
Unlike open Civ where you sprawl in all directions, this game has a **directional arc**. The teacher picks a historical journey as the map's spine:
- The Silk Road (ancient world — China to Rome)
- Age of Exploration (Atlantic crossing, New World contact)
- Lewis & Clark / American West (ties to Oregon Trail directly)
- The Ancestral Migration (Indigenous peoples of North America — culturally powerful for Scott's classroom)
- A custom map (teacher builds their own)

Teams navigate this arc while also building civilization-style. Tension between **moving forward** (Oregon Trail) and **building in place** (Civilization) is the core strategic dilemma.

### Random Events — The Oregon Trail Punch
One event fires per class day, in a randomly selected round. Each team gets their own d20 popup — independent rolls, simultaneous chaos. Teams cannot predict them. They can only prepare.

**The d20 scale:**
| Roll | Result |
|------|--------|
| 1–8 | Moderate positive (food bonus, tech boost, favorable weather, trade windfall) |
| 9–10 | Extremely positive (wonder discovered, great person born, golden age triggered) |
| 11–18 | Moderate negative (drought, raid, road washed out, disease outbreak) |
| 19–20 | Extremely negative (famine, devastating raid, earthquake, epidemic) |

**The floor rule:** No roll — ever — eliminates a civilization. Extremely negative means real pain and real consequences. It does not mean game over. The floor exists because the point is drama, not defeat.

**Sample event deck:**

| Event | Effect | Can Be Mitigated By |
|-------|--------|-------------------|
| 🌧️ **Drought** | -30 food this turn | Aqueduct building, river tiles |
| 🤒 **Dysentery Outbreak** | -1 population, -20 medicine | Hospital building, medicine stockpile |
| 🌊 **River Crossing** | Halt movement until you build a bridge (costs materials) or roll the dice to ford (50/50: cross OR lose a unit) | Road technology, bridge building |
| 🌪️ **Storm Destroys Farm** | One farm tile removed | Just bad luck. Rebuild it. |
| 🏹 **Raid** | Neighboring hostile force attacks — lose units or pay 50 gold tribute | Military units, walled city |
| 🤝 **Trade Caravan Arrives** | Can trade one surplus resource for something you need | Trade route tech, market |
| 🌟 **Great Person Born** | A Great Scientist/Artist/General appears — bonus to science/culture/military | Can't predict. Just lucky. |
| ☠️ **Plague** | Affects ALL teams — everyone loses population and medicine | Hospitals, medicine stockpile |
| 👑 **World Congress Called** | Teacher triggers a class vote — all teams participate | Diplomacy; negotiate before the vote |
| 🏔️ **Mountain Pass Discovered** | A shortcut opens on the map — first team to reach it gets +2 movement for the rest of the game | Scouts, fast units |
| 📜 **Ancient Ruins Found** | A team discovers a bonus — extra science, gold, or a free tech reveal | Exploration |

**The teacher CHOOSES when events fire.** Random events from a deck can be queued. Teacher can also **hand-fire** a specific event at a specific team to create a teachable moment. Teaching the Black Death? Fire the plague. Teaching resource scarcity? Fire drought on the richest team. Teaching colonial contact? Have a teacher-controlled "outside civilization" appear with overwhelming military strength and let students decide how to respond.

---

## THE TEACHER AS GAME MASTER

This is the design principle everything else serves.

The teacher is not playing against students. The teacher IS the game world. Like a D&D dungeon master or a historical simulation facilitator, the teacher:

1. **Sets up the game** — chooses map, time period, starting resources, which victory conditions are active
2. **Advances the turn** — students cannot skip ahead; the teacher controls turn resolution
3. **Injects events** — from a queue or manually, targeting all teams, specific teams, or the map itself
4. **Debriefs** — after each turn (or every few turns), pauses the game and draws the lesson: *"What just happened? Why? What does that remind you of in history?"*
5. **Adjusts the world** — can add resources, remove units, change a terrain tile, for narrative/teaching purposes
6. **Scales difficulty** — early in the year, no domination victory, no plague events. As the class develops, the world gets harder and more complex.

**The teacher's admin panel is the whole game.** Student team panels are limited. The teacher panel has God view.

---

## THE KAIJU BUTTON

*This is not a mechanic. This is a gift.*

Scott's DM panel has a dedicated **KAIJU** button. He selects a target (one team, several teams, or ALL teams simultaneously), picks one of 7 kaiju, and fires. Every targeted student gets a full-screen animated takeover:

> A massive creature emerges and tears through the civilization's territory. Buildings shake. The screen rumbles. The kaiju roars.

Then: nothing. The game resumes. No stat loss. No resource penalty. No consequence whatsoever.

The entire point is the reaction in the room.

**The 7 Kaiju — LOCKED:**

| # | Name | Type | Attack Style |
|---|------|------|--------------|
| 1 | **Kraken** | Giant sea creature | Erupts from ocean/coastal tiles, tentacles engulf the city |
| 2 | **Thunderbird** | Massive storm bird | Dive-bombs from the sky, lightning strike animation |
| 3 | **Rexar** | Giant lizard (original design) | Stomps in from the map edge, classic kaiju walk, Godzilla energy |
| 4 | **Kodiak** | Giant Polar Bear | Lumbers in from the north, distinctly Alaskan — these kids will absolutely lose it |
| 5 | **Chimera** | Lion/goat/serpent hybrid | Mythology unit tie-in, three-headed rage animation |
| 6 | **Cyclops** | One-eyed giant | Mythology unit tie-in, single eye glow, boulder-throw animation |
| 7 | **ZORG-9** | Space alien in a flying saucer | The silly one. Saucer descends, abduction beam sweeps the city, then warps out. *Takes nothing. Leaves chaos.* |

Each kaiju has a distinct animation, a distinct sound, and a distinct visual style. The attack sequence is 5–8 seconds. Then it’s over and the game is exactly as it was.

**Build note:** All 7 need original art (not licensed characters). Pixel art or illustrated style works well for animation. Commission 7 designs specifically for ClassCiv. Chimera and Cyclops double as mythology unit Easter eggs — students who paid attention in DEFINE round will recognize them immediately.

---

## TEAM STRUCTURE AND ROLES

Teams of 3–5. Every member has a role. Every role has a dashboard function.

| Role | Responsibilities | In-Game Function |
|------|-----------------|-----------------|
| 🏛️ **Architect** | Leads BUILD round. Plans construction, manages building queue, places infrastructure on sub-zones. | Routes Production ⚙️ |
| 🧭 **Merchant** | Leads EXPAND round. Manages Spot Trade Board, Trade Agreements, territory expansion, caravan units. | Routes Reach 🧭 |
| ⚖️ **Diplomat** | Leads DEFINE (laws). Alliance proposals, grievances, law creation panel, de-escalation window in Battle Round. | Routes Legacy 📜 |
| 📜 **Lorekeeper** | Leads DEFINE (mythology). Runs creature creation, manages cultural artifacts, tracks CI score and spread. | Co-leads DEFINE with Diplomat. |
| ⚔️ **Warlord** | Leads DEFEND round. Commands military units, manages army strength, handles Battle Round interface. | Routes Resilience 🛡️ |

**In a team of 3:** All 3 roles present. Absent roles absorbed by teammates per Decision 71.
**In a team of 5:** All five roles, full specialization.
**No role may be vacant.** Every person has a job every round.

**The Lorekeeper is the creative spine.** Each epoch the Lorekeeper leads whole-team creature creation — every student contributes — and the mythology gallery builds across the simulation. Physical art submissions earn Cultural Influence bonuses. These artifacts appear in the portfolio PDF at game end.
---

## EDUCATIONAL STANDARDS ALIGNMENT

This hits across multiple subject areas. That's the point. It's an *anchor* project — other lessons feed into it, and it feeds into other lessons.

### Geography
- Terrain identification and its effect on human settlement
- Resource distribution and trade patterns
- Map reading, coordinates, compass rose, scale
- Biomes and climate zones (if map is Earth-realistic)
- Migration patterns and their causes

### History
- Rise and fall of civilizations (students EXPERIENCE this, not just read about it)
- Technology as a driver of historical change
- Trade routes and cultural exchange
- Conflict, diplomacy, treaties
- Cause and effect across time (every tech decision has downstream consequences)

### Economics
- Scarcity and resource allocation
- Supply and demand (event-driven price changes in trade)
- Opportunity cost (build the farm OR the mine — not both this turn)
- Trade and comparative advantage
- Government economic policy (policy cards = economic decisions)

### Government / Civics
- Types of government and their tradeoffs
- Voting and representation (World Congress events)
- Diplomacy, treaties, war, and peace
- Policy decisions and their consequences

### ELA
- Scribe journals — narrative writing, cause/effect, reflection
- Decision-point events require reading comprehension
- Post-game essays: *"Your civilization lost the Scientific Victory. Explain why, using evidence from the game, and connect it to one real historical civilization."*

### Math (embedded)
- Resource calculations each turn
- Probability in combat and events
- Growth functions (population growth formula)
- Trade ratio math

---

## TECHNICAL ARCHITECTURE
> ⚠️ **Pre-lock brainstorm section.** Stack confirmed in Decision 84. Views and routing confirmed in Decisions 70 and 76. Build sequence locked in Decision 85. See those decisions for authoritative specs. The sections below are the original thinking — useful context, not the source of truth.

### What We're Building
A web app. Runs in any browser. No install. Teacher opens on laptop, connects to projector. Students open on Chromebooks, tablets, or phones.

### Stack
- **Frontend:** Next.js App Router + TypeScript + Tailwind CSS
- **Backend:** Next.js API routes (serverless) or Node.js server
- **Database:** Supabase (PostgreSQL) — game state, team data, event log, journals
- **Real-time:** Supabase Realtime subscriptions — turn resolution pushes to all clients instantly
- **Auth:** Clerk — teacher account (admin) + team accounts (simple login per team)
- **Hosting:** Vercel (Next.js native, zero-config deploy)
- **AI Events (optional, Phase 2):** Claude API for dynamically generated event narratives — instead of "Drought: -30 food," the event reads *"A three-week drought has dried your river tributaries. Your farmers are desperate."*

### Views

**Teacher Admin Panel (full screen, projector-ready)**
- God-view map (all tiles revealed, all teams visible)
- Turn control (advance turn, pause, rewind to review)
- Event queue (drag events from deck to queue; fire on demand)
- Team status sidebar (health summary of all teams at a glance)
- Diplomacy log (all inter-team communications)
- World Congress trigger
- Game settings (active victory conditions, difficulty knobs)

**Team Dashboard (tablet/Chromebook)**
- Tab 1: **Map** — their explored territory, fog of war on unexplored
- Tab 2: **City** — their settlement(s), yields, buildings in progress, build queue
- Tab 3: **Resources** — current food/production/gold/science/culture + supply inventories
- Tab 4: **Military** — unit list, locations, orders
- Tab 5: **Diplomacy** — messages from other teams, active treaties, pending trades
- Tab 6: **Journal** (Scribe only) — entry field, past entries log
- Tab 7: **Tech Tree** — current research, progress, available techs

**Projector Display (read-only, full screen)**
- Animated map, all teams visible
- Turn counter and current phase
- Recent events (scrolling log)
- Victory condition progress bars
- "Now Resolving: Turn 12..." with dramatic flair

### Data Model (Core)
```
Game
  └── Teams[]
        └── name, role assignments, resources, settlements[]
  └── Map
        └── tiles[][] (terrain, resources, ownership, units)
  └── TurnHistory[]
        └── turn number, actions[], events[], resolutions[]
  └── EventDeck[]
        └── event type, effect, narrative text, is_fired
  └── Diplomacy[]
        └── trade offers, alliances, wars, messages

Team
  ├── food, production, gold, science, culture (per-turn yields)
  ├── food_supply, medicine, materials, draft_animals (inventory)
  ├── tech_progress (current research + tree completion)
  ├── civics_progress
  ├── government_type
  ├── journal_entries[]
  └── victory_progress (each condition tracked separately)
```

### Build Phases

| Phase | What Gets Built | When |
|-------|----------------|------|
| **Phase 1** | Static game board (map renders, tiles display), teacher admin frame | Start |
| **Phase 2** | Team login + resource dashboards, manual turn advance | Early |
| **Phase 3** | Turn submission system, action resolution, resource calculation | Core |
| **Phase 4** | Event system — deck, queue, fire, effect application | Core |
| **Phase 5** | Diplomacy — messaging, trade offers, war declarations | Mid |
| **Phase 6** | Tech tree + civics tree (visual, interactive) | Mid |
| **Phase 7** | Scribe journal + PDF export | Mid |
| **Phase 8** | Projector display (read-only animated view) | Late |
| **Phase 9** | Victory condition tracking + win detection | Late |
| **Phase 10** | Polish, AI event narratives, teacher QOL features | Polish |

**Velocity Rule:** *The first playable version has a map, two teams, a teacher who can fire one event, and resources that change. That's it. Get to that in the first session and iterate from there.*

---

## HEYGEN VIDEO ARCHITECTURE (Decision 55)

### The Core Rule
**All HeyGen video is pre-rendered. Nothing generates at runtime.** Scott builds the asset library before the simulation runs, previews every clip, approves it, and stores it. The app fires stored URLs at the right moment. No API calls during class. No rendering delays. No surprises.

### Why Pre-Rendered Only
- HeyGen video generation takes 2–10+ minutes — unusable in a live classroom
- Scott's preview requirement: he sees every clip before any student sees it
- Pre-rendered = instant playback from Supabase Storage URLs
- One-time cost per clip — build it once, use it every simulation run forever

### The Asset Library — What Gets Pre-Rendered

| Trigger | Decision | Video | Count |
|---------|----------|-------|-------|
| Wonder completion | 40 | Historian narrator, 20–40 sec, per wonder | ~8–12 clips (one per wonder type) |
| Contact event | 54 | Historian narrator, 30–45 sec, single dramatic moment | 1 clip |
| Global events | 51 | Historian narrator, 15–30 sec, per event type | ~8–12 clips (famine, plague, golden age, raiders, trade wind, etc.) |
| Exit ritual audio | 46 | **Audio only** — Starfish TTS, not video | Generated at RESOLVE time, not pre-rendered |

**Total pre-render effort:** ~20–25 short clips. One afternoon of build work before the simulation begins.

### Build Workflow (Scott's Process)
1. Write the script for each clip (historian narrator voice — authoritative, cinematic, short)
2. Call HeyGen API: `POST /v2/video/generate` with chosen public avatar + TTS voice
3. Poll for completion (`GET /v1/video_status.get`)
4. **Preview the rendered clip** — approve or revise the script and re-render
5. Download and upload to Supabase Storage
6. Record the public URL in a `heygen_assets` table: `event_type`, `asset_name`, `video_url`, `duration_sec`, `created_at`

### Storage & Delivery
```typescript
// heygen_assets table
{
  id: uuid,
  event_type: 'wonder_completion' | 'contact_event' | 'global_event' | 'exit_audio',
  asset_name: string,        // e.g. 'wonder_great_library', 'event_famine'
  video_url: string,         // Supabase Storage public URL (never expires)
  audio_url: string | null,  // for TTS-only assets
  duration_sec: number,
  created_at: timestamp
}
```

> **CRITICAL:** HeyGen signed URLs expire in 7 days. Always download the rendered file and re-upload to Supabase Storage. The `video_url` stored in the DB should be the **Supabase Storage URL**, not the HeyGen URL.

### Projector Playback Component
The projector view has a `<VideoOverlay>` component. When the app fires an event that has an associated `video_url`, the component:
1. Receives the URL via Supabase Realtime event broadcast
2. Renders a full-screen `<video>` overlay (above the map, below no other UI)
3. Plays once, then dismisses automatically when it ends
4. Scott can skip it manually from the DM bar if needed

### Exit Ritual — Starfish TTS (Real-Time Exception)
The exit hook sentence is the one real-time audio use case. Haiku generates the sentence at RESOLVE time → the app calls `POST /v1/audio/text_to_speech` (HeyGen Starfish TTS) → receives an audio URL in seconds → stores it in `daily_recap.preview_audio_url` → plays on projector at logout.

```typescript
// Starfish TTS call at RESOLVE time
const ttsResponse = await fetch('https://api.heygen.com/v1/audio/text_to_speech', {
  method: 'POST',
  headers: { 'X-Api-Key': process.env.HEYGEN_API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: haikuGeneratedHookSentence,  // from Claude Haiku
    voice_id: HISTORIAN_VOICE_ID,       // consistent voice across all sessions
    speed: 0.95,
    pitch: -2
  })
});
// Returns audio_url in ~1-3 seconds. Store in daily_recap table.
```

**Cost:** $0.000333/sec. A 10-second hook sentence = $0.003. Negligible.

### Engine & Cost
- **Avatar engine:** Avatar III ($0.0167/sec) — sufficient quality for classroom projector display
- **Avatar IV** ($0.10/sec) is 6× more expensive — not needed here
- **Estimated clip cost:** 30-second clip × $0.0167 = **$0.50 per clip**
- **Full asset library:** 25 clips × $0.50 = **~$12.50 total, one-time**
- **Per re-render** (script revision): ~$0.50 per clip
- **Starfish TTS per session:** <$0.01

### API Key Note
HeyGen API key and web plan credits are **separate billing pools**. The pre-render build workflow uses the API key (pay-as-you-go). The key goes in `.env.local` as `HEYGEN_API_KEY`. Upload endpoint is `upload.heygen.com` (different host from `api.heygen.com`) — see heygen-api-deep-dive.md for full reference.

---

## THE SETTINGS — WHAT PERIOD DOES THIS LIVE IN?

The engine is period-agnostic. The **scenario pack** determines the era, the map, the starting techs, and the event deck flavor. Scenarios are content, not code. Adding a new scenario = new JSON data, not a rewrite.

### Scenario 1: The Ancient World (Mediterranean/Middle East)
- Map: Mediterranean basin, Nile, Tigris/Euphrates, Aegean
- Teams: Egypt, Mesopotamia, Greece, Rome, Persia, Carthage
- Journey spine: Trade routes from Mesopotamia to the Mediterranean
- Events: drought on the Nile, Persian invasion, eruption of Vesuvius (Pompei event for the team at that tile)
- Ties to: 6th grade World History curriculum

### Scenario 2: The Age of Exploration (Atlantic World)
- Map: Atlantic Ocean + coasts of Europe, Africa, Americas
- Starting teams: Spain, Portugal, England, France, indigenous coastal civilizations
- Journey spine: Crossing the Atlantic, first contact, trade route establishment
- Events: hurricane, scurvy (medicine drain), indigenous contact (diplomacy or conflict decision), mutiny (random unit loss)
- Ties to: 7th grade World History / US History

### Scenario 3: The American West (Oregon Trail Direct)
- Map: Missouri → Oregon coast, full overland route
- Teams: Pioneer families, Pawnee, Lakota, Shoshone, Nez Perce, fur traders
- Journey spine: THE Oregon Trail — Fort Kearney, Chimney Rock, Fort Laramie, South Pass, Fort Hall, The Dalles
- Events: dysentery, cholera, river crossings, buffalo hunt, blizzard, hostile encounter choice, Great Salt Lake detour
- Victory conditions: Survival victory primary; Economic (arrived with most resources), Cultural (best documented journey — Scribe journals graded)
- Note: THIS version requires cultural sensitivity decisions upfront. The indigenous teams are NOT villains. This scenario can be incredibly powerful and incredibly painful if done wrong. **Teacher should run simulation debrief discussions about perspective and power.**
- Ties to: 8th grade US History / Geography

### Scenario 4: The Ancestral Migration (Indigenous North America — Scott's Classroom)
- Map: North America prior to European contact
- Teams: Ahtna Athabascan (Copper River Basin), Tlingit (coast), Yup'ik (western Alaska), Haudenosaunee (Great Lakes), Cherokee (Southeast), Lakota (Great Plains)
- Journey spine: Seasonal migration routes — following game, salmon runs, trade networks
- Events: volcanic activity (relevant to Alaska!), salmon run failure, trade partner encounter, severe winter
- Victory conditions: Geographic (strongest territory), Cultural (highest cultural knowledge preserved), Survival
- The game's design ensures no civilization starts in a subordinate position — all teams begin with equal agency on the same globe. This scenario makes that most explicit.
- Ties to: Alaska cultural standards, state history, indigenous studies

### Scenario 5: Teacher Custom
- Teacher builds from scratch using admin panel scenario editor
- Define map size, terrain, starting teams, resources, event deck
- Full openness for any time period or place

---

## OPEN QUESTIONS — ✅ ALL RESOLVED (Decision 86)

*Every open question has been answered. See Decision 86 in the LOCKED DECISIONS table for full rationale.*

| # | Question | Resolution |
|---|---------|-----------|
| 1 ✅ | **What does a team DO during one epoch?** | Answered by Decisions 23, 28-32, 37-38, 70, 77-80. Four rounds: BUILD → EXPAND → DEFINE → DEFEND. Each role leads one round. |
| 2 ✅ | **Is Region 12 too big?** | Stays as-is. Split into 12a/12b only if 13+ teams needed. 12 regions > 6 civs = plenty. |
| 3 ✅ | **Snake draft or straight draft?** | Snake draft (Decision 8). Last-pick inequality is intentional — see OQ4. |
| 4 ✅ | **Starting region inequality — intentional?** | Yes. Historical accuracy > game balance. Sahara teams learn WHY civilizations near rivers thrived. Resource rebalancing through NPC events and trade. |
| 5 ✅ | **7/8 shorter period pacing?** | Rounds compress to 5-6 min (Decision 79). Same epoch structure, faster pace. |
| 6 ✅ | **Hex tiles or square tiles?** | Obsoleted. Decision 61 — sub-zones, not tiles. Leaflet polygons on real geography. |
| 7 ✅ | **Simultaneous turns or sequential?** | Simultaneous submit → batch resolve (Decision 78). All teams submit, then RESOLVE fires at once on projector. |
| 8 ✅ | **Which scenario goes first?** | Real Earth only for v1 (Decision 1). Scenario packs = v2+. Event system carries historical context, no special identity overlay required. |
| 9 ✅ | **Combat: how complex?** | Decision 59 — DM-gated, never auto-fire. Military = shadow variable (Decision 79). Full combat resolution = separate locked decision. |
| 10 ✅ | **Game length?** | 3-week arc, ~15 epochs (Decision 86). Single unit. Full-year = v2 consideration. |
| 11 ✅ | **Working title / final name?** | ClassCiv = working title. Name finalized before marketing push, not before build. |

---

## CONSTRAINTS & NON-NEGOTIABLES

- Works on Chromebooks — no install, no download, just a URL
- Teacher has complete control at all times — can pause, override, adjust, inject at any moment
- Designed for 6–8th grade: readable UI, not cluttered, mobile-friendly
- No student data stored beyond username and game state — COPPA/FERPA compliant (same as MythoLogic)
- Faith integration: none in the base game. The engine is secular. Scenarios can have culturally appropriate spiritual elements where historically accurate (e.g., indigenous spiritual practices, medieval religion) but it's never forced, always labeled, teaches about — not as.
- **The game must be teachable without the teacher having played Civilization.** The admin panel must be intuitive enough that a non-gamer teacher can run a session after a 30-minute orientation.

---

## THE DESIGN PRINCIPLE (POST IT ON THE WALL)

> *"Every decision a student makes should be one a real person in history actually had to make."*

If a student asks "why does it matter which government I choose?" the answer is: ask the Romans when they switched from Republic to Empire. Ask the French in 1789. Ask the Founding Fathers which was better — Articles of Confederation or the Constitution. The game should make every choice feel like it echoes across centuries — because it does.

---

## LOCKED DECISIONS

| # | Decision | What We Decided | Why |
|---|---------|----------------|-----|
| 1 | **Map** | Real Earth, Leaflet-based | Students spent all year building a mental map of Earth. Every tile they touch is geography they already know. Unexplored zones (Japan, Korea, Pacific, Australia) are literal fog of war — the game pre-teaches what comes next in the curriculum. |
| 2 | **Class structure** | ~~Two separate classes on one shared map~~ → **Superseded by Decisions 95 + 96** | ~~6th grade covers the Americas. 7/8 covers Old World. Same Supabase game, shared map, cross-class contact.~~ → Two fully isolated Supabase game records. Each class plays its own full global Risk-style map. No shared game state. No cross-class contact in v1. See Decisions 95 and 96. |
| 3 | **Class time difference** | 7/8 class is 15 minutes shorter | Epoch length and turn structure must accommodate both. 7/8 gets a tighter loop. |
| 4 | **Player count** | Up to ~37 students, plan for 50 with overflow | 15 sixth graders + 22 seventh/eighth graders + absent coverage buffer |
| 5 | **Team count** | Up to 12 teams total | Risk-style — 12 regions, 12 civilizations, whole Earth in play |
| 6 | **Team size** | 3–5 per team | Flexible enough to survive absences without breaking |
| 7 | **Devices** | MacBooks primarily | Touch interface + Mac AND PC keyboard shortcuts required |
| 8 | **Team persistence** | Yes — saved across sessions | Game runs 6 weeks post spring break (~30 epochs). See Decision 94. State must persist between class periods. |
| 9 | **Absent student handling** | ~~Three options, teacher chooses per student per day~~ → **Superseded by Decision 71:** present teammates absorb the absent role. No AI fill, no vacancy. | ~~(a) AI fills their role, (b) present teammates absorb their job, (c) teacher plays their actions directly from DM panel~~ → See **Decision 71.** Team votes who absorbs; Scott assigns from DM panel if no consensus. |
| 10 | **World structure** | Phase model: isolated → contact → diplomacy/war | Each team starts isolated. Mirrors history: the Olmecs didn't know China existed. Isolation → Discovery → Trade → Conflict = world history as a live game loop. |
| 11 | **Contact trigger** | Option C — earned through tech OR teacher-fired | Teams can earn contact by building Sailing tech / Trade Ships / expanding to fog of war boundary. Teacher can ALSO fire contact at any moment to serve a curriculum beat (Silk Road, colonization, etc.). Students never know which events are random, which are planned, which are AI-generated. That's a feature. |
| 12 | **The big colonial moment** | ~~Teacher controls it deliberately~~ → **Superseded by Decision 96** | ~~When Scott is ready to teach colonization, he fires the contact event between 6th grade (Americas) and 7/8 grade (Old World).~~ → Cross-class contact removed from v1 scope. Each class is in a fully isolated game with its own full-globe map. Colonial contact between classes = v2 consideration (multi-school matchups, or a future full-school event). In-class civilization contact (within the same game) still exists per Decisions 10, 11, 54, 56. |
| 13 | **Team formation** | Scott pre-assigns all teams | No best friends together. Team formation help from Brand Whisperer comes later. |
| 14 | **Day 1 draft system** | Kahoot-style geography blitz → team score → pick order | Loud, projected, timed, competitive. Rewards geography knowledge from the year. Teams with highest score pick their starting region first. |
| 15 | **Draft order format** | Snake draft | Team 1 picks first, Team 12 picks second round first. Prevents last-place team from getting only what's left. |
| 16 | **Starting region selection** | Teams choose from 12 defined regions | Earned via Kahoot score. First come first served is replaced by draft order. |
| 17 | **Teacher role** | Dungeon Master / God view across BOTH classes | Scott sees everything. Students see only their explored territory. Scott fires events, resolves turns, fills absent roles, controls contact, and steers the narrative. Kids don't know how much is random, how much is planned, how much is AI-generated. |
| 18 | **Role rotation** | Roles rotate every epoch | Every student plays every role across the 3-week project. Historically rich — students experience what it costs to be the General vs. the Merchant vs. the Scholar. Absence complication: if a student misses an epoch, do they skip that role in the rotation or does the schedule hold and they just miss it? **See R-NEW1.** ✅ **IMPLEMENTED:** `POST /api/games/[id]/rotate-roles` cycles all members forward one position. `🔄 Rotate Roles` button on `/dm/roster`. All 35 production students enrolled with initial roles. |
| 19 | **Each role brings its own decision** | Role-based distinct questions per epoch | The Scout doesn't vote on what the Engineer builds. The Merchant doesn't decide where the General marches. Each role owns their domain and brings their own question(s) to the team. The team discusses, but the role-holder has authority in their lane. |
| 20 | **Multiple rounds per epoch** | ~~3 rounds per epoch~~ → **4 rounds per epoch** *(superseded by Decision 23 — BUILD/EXPAND/DEFINE/DEFEND)* | Each round: all roles read their domain prompt, team discusses, all roles submit decision + written justification, teacher resolves before next round begins. |
| 21 | **Daily written component** | Written reasoning submitted IN-APP with each decision, before teacher resolves | Students justify their decision using scaffolded sentence starters with historical anchors. Better reasoning = better outcome, at teacher discretion. **See W-NEW4 and W-NEW5.** |
| 22 | **Written reasoning to outcome link** | Good historical justification earns a gameplay advantage, at teacher discretion | Geography/history knowledge = better game results. Curriculum IN, civilization advantage OUT. |
| 23 | **Epoch round structure — 7 domains, 4 rounds** | BUILD (Tech + Hygiene), EXPAND (Exploration + Trade), DEFINE (Laws + Mythology), DEFEND (Military) | 4 rounds per epoch. 7 domains total. BUILD and EXPAND carry 2 domains each; DEFINE carries 2 (Laws + whole-team creature creation); DEFEND carries 1. DEFEND is the final round every epoch — teams must earn it by staying on task. See Decision 28. |
| 24 | **Outcome drives next epoch options** | Combined result of all 3 rounds determines what is available the NEXT epoch | Strong tech = new build options unlock. Neglected hygiene = disease event looms. Successful exploration = new territory opens. Bad laws = civil unrest triggers. This IS the progression system. **See E-NEW5 and E-NEW6.** |
| 25 | **Dynamic round questions** | Round structure is fixed; questions inside each round change every epoch based on civilization state | A coastal civilization in epoch 8 gets a different Exploration prompt than a landlocked one in epoch 3. The round names never change. What the team is *asked* inside that round tracks where they actually are. This keeps the ritual predictable and the content fresh. **See E-NEW8 (who generates the questions) and E-NEW9 (how the game knows civilization state).**  |
| 26 | **Mythology round = whole-team creature creation** | DEFINE round's Mythology domain is a shared team prompt — entire team collaborates on one mythological creature per epoch | This is the one exception to the individual role submission pattern. All roles contribute to one artifact. Each epoch they get a new creature prompt. Builds the civilization's mythology lore over time. Portfolio piece. Standalone in ClassCiv (MythoLogic Codex integration possible in future). |
| 27 | **Question generation: pre-built bank + Haiku live override** | Build time: Sonnet generates rich static question bank (domain × civ stage × epoch range). Runtime: Claude Haiku fires on DM trigger for edge-case teams. | Bank covers 90%+ of epochs automatically — free at runtime, no latency, works offline. Haiku override = fractions of a cent per call, fast, handles weird team states the bank doesn't cover. Scott never writes questions. Two-model split: Sonnet builds it once, Haiku supplements it live when needed. |
| 28 | **DEFEND is the 4th round — and a classroom pacing lever** | Military domain lives in its own dedicated final round every epoch | Teams that lose time goofing off in rounds 1–3 don’t finish DEFEND. Skipping DEFEND = no military allocation that epoch = exposed to events and contact consequences. The game enforces focus without Scott having to be the bad guy. Early epochs: brigands, raiders, internal threats. Later: contact shadow variable. See M2 and M3. |
| 29 | **5 roles, flexible pool** | Architect, Merchant, Diplomat, Lorekeeper, Warlord — teams fill as many as they have students | 3 students = 3 active roles (Lorekeeper dormant by default since Mythology is whole-team anyway). 4 students = full roster. 1 student = holds all roles. Role slots never hardcoded to team size. New student joins mid-unit = picks up dormant role. Nothing breaks. |
| 30 | **No single leader role — leadership distributed by round** | Each role leads their own domain round | Architect leads BUILD. Merchant leads EXPAND. Diplomat leads DEFINE (laws). Lorekeeper leads creature creation. Warlord leads DEFEND. Leadership rotates naturally every round. Culturally flexible — no one title that has to translate across 12 civilizations. |
| 31 | **Two-layer resolution: automatic round + teacher-triggered epoch RESOLVE** | Layer 1 = automatic after each round (student devices show immediate stat/resource feedback). Layer 2 = Scott hits RESOLVE after all 4 rounds complete (projector erupts, map updates, events fire, Scott narrates). Resolution outcomes can be algorithmic, Haiku-generated from game state, or teacher-overridden. Scott controls the moment; the system handles the math. Resolves E3 (live visibility) and E4 (loud moment) simultaneously. |
| 32 | **Independent role submissions — round gates on all present roles submitting** | Each role submits their own decision + justification per round (separate DB rows). The round doesn't close for a team until all present roles have submitted. Scott's teacher dashboard shows individual submission status per role per round. Absent roles leave a visible gap. No free-riding. Shapes the entire DB schema: submissions table keyed to team × role × round × epoch. |
| 33 | **d20 random event system — one per day, student-facing popup, scaled outcomes** | One random event fires per class day. Round placement is randomized across the 4 rounds. Teams get an in-app d20 popup: 1–8 = moderate positive, 9–10 = extremely positive, 11–18 = moderate negative, 19–20 = extremely negative. Never civilization-ending — 19–20 hurts badly but cannot wipe a team. Scott retains the ability to hand-fire curriculum-specific events (plague, colonization, trade caravan) outside this system at any moment. The d20 roll is team-specific — each team rolls independently. Kids remember their rolls. |
| 34 | **Kaiju attack — teacher-triggered DM chaos button, pure spectacle, zero penalty** | Scott selects any of 7 kaiju, targets one team or all teams, fires from the DM panel. Full-screen animated attack: kaiju stomps the city. Completely cosmetic — zero game impact. Roster: Kraken, Thunderbird, Rexar (giant lizard), Kodiak (Polar Bear), Chimera, Cyclops, ZORG-9 (UFO/space alien — the silly one). All original designs — no licensed characters. Chimera and Cyclops tie into the Mythology (DEFINE) round. Kodiak is the Alaska crowd-pleaser. ZORG-9 exists purely to make a 7th grader spit out their lunch. |
| 35 | **Entry ritual: Day 1 = cinematic intro; subsequent days = daily recap** | Day 1: students log in, see the opening cinematic/narrative intro to the game world and their civilization. Every subsequent day: login screen shows yesterday's recap before anything else — what happened, what changed, what's coming. Recap generation method TBD (see E-REC). Projector likely mirrors the student recap on entry. |
| 36 | **12 team-specific Wonders — free placement, massive permanent bonuses** | Each team builds one wonder across the whole simulation. 12 wonders, one sourced from each starting region, but any team can build any wonder anywhere. The strategic choice is the BONUS, not the location. Wonders take most of the simulation to complete. Completion = projector moment + permanent game-changing bonus. Roster: Trans-Alaska Pipeline (trade speed), Brooklyn Bridge (open diplomacy), Grand Coulee Dam (double BUILD production), El Castillo (double Knowledge), Machu Picchu (2-epoch military immunity), The Colosseum (DEFEND always succeeds), Stonehenge (d20 negative immunity), Great Pyramid (half-cost contributions), Great Zimbabwe (double trade), Trans-Siberian Railway (free expansion), Taj Mahal (war immunity), Floating Torii Gate (full map reveal). |
| 37 | **4-resource, 4-track economy — every round generates one unique resource type** | BUILD → Production ⚙️. EXPAND → Reach 🧭. DEFINE → Legacy 📜. DEFEND → Resilience 🛡️. Each round feeds its own matching track on the wonder progress bar. All 4 tracks must advance — a neglected round leaves a visible gap. Yield = Base Yield × Written Justification Quality Multiplier × d20 modifier (if event fires that round). The DB resources table has 4 fields per team per epoch row. |
| 38 | **Explicit routing: Spend / Contribute / Bank — visible team decision after every round** | After each round auto-resolves, the team sees their earned resource total and chooses how to split it: SPEND (buy from the menu immediately), CONTRIBUTE (route to the wonder track), or BANK (hold — decays slowly, can be stolen). Explicit, visible, team-level decision. Not automatic. This is the Oregon Trail buy-screen moment every round. Routing panel = its own UI component, fires between rounds. |
| 39 | **Full purchase menu and degradation table — 3 categories, 13 purchasable items** | Buildings (permanent, map-placed, attached to territory): Farm, Granary, Barracks, Market, Aqueduct, Library, Walls. Units (mobile, appear on map as SVG markers, can be lost): Scout, Soldier, Merchant, Builder. Supplies (consumable inventory, visible as counts): Food Stores, Medicine, Repair Tools. See degradation table in ECONOMY ARCHITECTURE section. |
| 40 | **Wonder completion model — continuous production, multiple wonders, tiered milestones, big completion event** 🎬 HeyGen | Teams contribute to their current wonder every round they can allocate resources to it. No epoch deadline — production continues until done. On completion: start the next wonder. Teams can build multiple wonders over the 3-week simulation (Decision 36 one-wonder cap revised — it was a floor, not a ceiling). Completion event: **pre-rendered HeyGen narrator video fires on the projector** — a historian avatar delivers the moment ("The Great Library stands complete. Knowledge begins to flow across your empire."). Each wonder has its own pre-rendered clip. Built once, stored in Supabase Storage, fires instantly. Scott narrates what bonus just went live; the whole class hears it. Partial credit via tiered milestones: **25%** = +1 bonus to that track's yield next epoch (momentum perk, minor); **50%** = one-time d20 negative event immunity on the wonder's matching round (protective perk, meaningful); **75%** = one free contribution round — route that track's resource at half cost once (endgame push perk, gets teams over the finish line). Milestones are temporary perks only — they expire after use or after 1 epoch. Permanent bonuses only fire on full completion. |
| 41 | **Food and Population tracked as separate survival dimensions — distinct from the 4 core economy resources** | ClassCiv has 6 tracked dimensions per team, not 4. The 4 economy resources (Production ⚙️, Reach 🧭, Legacy 📜, Resilience 🛡️) flow through the Spend/Contribute/Bank routing panel. Food 🌾 and Population 👥 are the survival layer beneath them — not routed, not contributed to wonders, not purchased. Food is generated passively by buildings (Farms, Granaries) and consumed continuously by population. Population is a numeric count that grows slowly under healthy conditions and shrinks under famine, plague, and war events. Both have their own DB columns, their own display in the Civilization Panel, and their own crisis conditions. Schema impact: `team_resources` table gains `food_current`, `food_capacity`, `population_current`, `population_cap` columns. |
| 42 | **Daily recap generated by Claude Haiku — fires at session start using full game state snapshot** | Each class day, when students log in, Haiku receives the full game state snapshot for that team (resources, wonder progress, events that fired, decisions made, assets gained/lost) and generates a narrative recap paragraph. Displayed on the login screen before the epoch begins. Also mirrored on the projector. Haiku writes it fresh every session — no template, no Scott writing. Cost: pennies per class day. Supabase stores the generated text alongside the game state row it was generated from, so replays are possible. |
| 43 | **Food generation: passive auto-yield if Farm/Granary exists — the decision is BUILDING the infrastructure, not farming every epoch** | If a team has a Farm, food auto-generates each epoch without a per-round action. If they have a Granary, food cap expands. No Farm = no passive food = population slowly at risk. The explicit decision is: did you spend Production to build the Farm? Once built, it produces. This keeps the survival layer present (you feel the pressure of food) without forcing a "go farm" button every 50-minute class. Population is tracked as a numeric count; what it affects mechanically (yield multipliers, unit caps, event severity) is TBD — flagged for G1-POP follow-up. |
| 44 | **E7: 7/8 class runs all 4 rounds — same structure as 6th grade, just faster** | No rounds dropped to accommodate the shorter period. 7/8 runs BUILD → EXPAND → DEFINE → DEFEND every epoch, same as 6th grade. 15 fewer minutes means tighter per-round discussion windows, not a structural difference. The epoch template is identical; the pacing is compressed. Implementation note: consider a configurable round timer that Scott can set independently per class. |
| 45 | **Population does all three things: display, yield multiplier, capacity unlock** | Population 👥 is a full mechanical layer. (1) **Display:** count visible in the Civilization Panel — students see it rise and fall. (2) **Yield multiplier:** population scales base yield slightly — a thriving city outproduces a dying one. Exact formula TBD (suggest: yield × (1 + pop_modifier) where pop_modifier = (current_pop / base_pop - 1) × 0.1 — 10% swing at max). (3) **Capacity unlock:** population determines unit cap (more people = more soldiers/scouts you can field) and building slots (overcrowded city can't add more districts until pop is sustained). Schema impact: `population_current`, `population_cap`, `pop_modifier` columns; building_slots and unit_cap derived from population tier threshold. |
| 46 | **Exit ritual: app-generated preview card on logout screen — Haiku writes the hook** 🎬 HeyGen/TTS | When the epoch closes and students log out, the last thing they see is a preview card — Haiku-generated, per-team, based on the current game state and what's likely coming next epoch. "Your walls are low. The raiders have been circling. Tomorrow you choose." Displayed on every student screen and mirrored on the projector. The app generates it at RESOLVE time and stores it. Students carry that sentence into the hallway. **Audio layer: Haiku-generated text → HeyGen Starfish TTS → audio clip plays on the projector as students pack up.** Starfish TTS is fast (audio-only, not video rendering — synthesizes in seconds). Cost: less than a penny per session. The hook sentence is spoken aloud into the room. |
| 47 | **Teacher dashboard layout: god-view map left, submission queue right, DM controls bottom** | Left: full Leaflet map, fog removed, all territories visible, unit positions, event queue overlaid. Right: submission queue showing each team × role × current round — green = submitted, red = pending. Scott sees at a glance who is still working without walking the room. Bottom bar: fire event, pause all timers, override a submission, trigger Kaiju, hit RESOLVE. Single screen. He never has to leave it to run the class. |
| 48 | **Hard PAUSE: freezes all timers + submissions, projector shows PAUSED overlay** | One button on the DM bar. Freezes all round timers across every student device simultaneously (Supabase Realtime broadcast). Submission queue locks — no new submissions accepted. Projector shows a PAUSED overlay so the whole class sees the game is stopped. Unpause resumes all timers from the exact moment they froze. No lost time, no lost submissions. |
| 49 | **Teacher override: full edit access to submitted text + separate DM consequence field** | From the submission queue panel, Scott can click any submitted decision and get a full edit modal: (1) editable text field containing what the team wrote — he can change any of it; (2) a separate DM consequence field where he types an outcome modifier that fires at resolution ("You built the aqueduct — but Rome's engineers also knew sanitation required a sewer system. You'll need it next epoch."). Both fields write to the DB. Original submission is preserved as `original_text`; edited version is `teacher_edited_text`; consequence is `dm_consequence`. Resolution logic runs off the edited text. The audit trail stays intact for grading and reflection. |
| 50 | **Private intel drop: dramatic interrupt modal on target team's screens only, then fades** | From the DM panel, Scott selects a team, types his message, fires it. That team's screens interrupt with a full-screen modal — styled like a messenger dispatch or scroll, distinct visual treatment from normal game UI. "Your Scout returns with a message: there is a civilization to the east. You alone know this." Team dismisses it manually. Never appears on the projector. Never visible to other teams. Stored in DB as `private_messages` table (team_id, epoch, round, message_text, delivered_at, dismissed_at). |
| 51 | **Global event broadcast: projector overlay + simultaneous Realtime push to all student devices** 🎬 HeyGen | Scott fires from the DM bar. Two things happen in the same moment: projector displays a full-screen announcement overlay (styled distinct from normal UI — bigger, more dramatic), and every student MacBook receives the same notification via Supabase Realtime broadcast. The whole room sees it at once — projector and personal screens simultaneously. No delay between projector and devices. **Pre-rendered HeyGen video option: Scott can attach a pre-rendered historian narrator clip to a global event before firing it. Common event types (famine, plague, golden age, trade wind, raider wave) each have a pre-rendered clip in the asset library. Scott picks the event + optional clip from the DM bar, fires once — projector plays the video, Realtime push fires simultaneously.** |
| 52 | **Speed up: yes. Roll back: no. Consequences are permanent.** | Scott can compress a round timer or close an epoch early when time is short (adjustable timer controls on the DM bar). He cannot revert a team's game state to before a decision resolved. What happened, happened. If a decision created a bad outcome, the DM consequence field is the tool — Scott steers the lesson forward from where the game actually is. This is more honest, more dramatic, and more historically accurate. History doesn’t offer undo buttons. Neither does ClassCiv. |
| 53 | **Contact awareness** | ~~Both classes on same map, all continents represented~~ → **Superseded by Decision 96** | ~~No isolated Americas. Both 6th and 7/8 spread across all continents from day one.~~ → Each class has its own isolated full-globe game. Within each class's game, all regions are fair game from turn one — teams start in different regions, fog of war lifts as scouts explore. Cross-class contact does not exist in v1. Intra-class contact (within the same game's teams) still follows Decisions 10, 11, 54, 56, 57. |
| 54 | **Contact event: auto-fires on proximity, DM override available** 🎬 HeyGen | The system detects when a team from one class moves into contact range of a team from the other class and fires the contact event automatically. Both teams receive a contact notification on their screens; the projector gets the announcement. Scott retains a manual control on the DM bar to suppress, delay, or manually trigger contact if the automatic fire lands at a wrong moment (mid-explanation, wrong period in the lesson, etc.). Automatic is the default — DM override is the safety valve. **Pre-rendered HeyGen contact video fires on the projector when contact triggers — a historian narrator delivers the moment dramatically. One pre-rendered clip, built once, stored in Supabase Storage, fires every time contact occurs across the whole run of the simulation.** |
| 55 | **HeyGen integration: all video pre-rendered, previewed by Scott, stored in Supabase, fired on demand** 🎬 HeyGen | Nothing renders at runtime. Scott builds the asset library before the simulation runs, previews every clip, approves it, and stores it. The app fires stored Supabase Storage URLs at the right moment. Asset library: ~20–25 clips (wonder completions, contact event, global event types). Total one-time cost ~$12.50 at Avatar III rates. Starfish TTS is the one real-time exception — exit ritual audio synthesized from Haiku text at RESOLVE time, sub-penny per session. See HEYGEN VIDEO ARCHITECTURE section for full build workflow, DB schema, and projector playback component spec. |
| 56 | **Contact window toggle: proximity detection always live, events suppressed until Scott opens it** | A toggle on the DM bar. Off by default — teams can be adjacent and nothing fires. When Scott has done the pre-contact curriculum and the class is ready, he flips it. From that point, Decision 54 rules: auto-fires on proximity, DM override available. Prevents a 7th grader wandering too far east on Day 1 from blowing up the lesson plan before the curriculum has gotten there. The game master stays ahead of his own simulation. |
| 57 | **Contact interaction: Diplomat owns diplomacy + alliances, Merchant owns trade. Conflict gated behind diplomacy first, then Scott's DM approval. No ignoring allowed.** | When contact fires, both teams must engage — silence is not an option. What each role can do: the Diplomat submits formal exchanges, alliance proposals, grievances, and any escalation declarations. The Merchant submits trade offers (resource type, quantity, terms) which the other team's Merchant counters or accepts. Conflict cannot be declared without at least one prior diplomatic exchange AND Scott's explicit DM bar approval before it resolves in the game. Twelve-year-olds don't get a "declare war" button that fires immediately. Conflict *is* possible — it just has to be earned and approved. Conflict resolution mechanics (what actually happens when conflict fires: units lost, resources raided, territory effects) flagged as a separate open question. |
| 58 | **Contact events: no pre-framing required, no built-in emotional scaffolding. Trust the room.** | These kids have grown up together their whole lives. The social fabric in this classroom does not map to the historical dynamic the contact event depicts. Don't import a colonizer/colonized racial frame that isn't native to this room. When contact fires, it fires as a game event between kids who know each other as whole people, not as historical archetypes. Scott reads the room. If something comes up that needs tending, he tends it — that's teaching, not game design. No structural pre-framing session, no mandatory debrief protocol, no identity-work component baked into the app. The game trusts the teacher. The teacher trusts his kids. |
| 59 | **Conflict resolution: DEFEND round becomes the Battle Round. Territory can be contested and retaken across subsequent epochs.** | When Scott approves a conflict declaration, that epoch's DEFEND round is hijacked for both teams simultaneously — it becomes a Battle Round. Before Warlords submit, each team's Diplomat gets a 3-minute de-escalation window to send a final offer; if accepted, conflict is cancelled and both teams earn a Resilience bonus. If rejected or ignored, Warlords submit military strategy with full written justification. Resolution modifier stack: Soldiers fielded (quantity matters), Warlord written justification quality (historical/geographic reasoning = tactical edge, same as Decision 22), Barracks building (attacker bonus), Walls building (defender bonus), d20 roll (both teams roll independently — luck factor), Scott's DM consequence field (final word, always). Loser takes: Resilience 🛡️ suppression next epoch, 1–2 Soldiers removed from the map, possible border tile transfer visible on the projector in real time. Nothing is civilization-ending. Territory change is NOT permanent — the losing team can declare a new conflict the following epoch to contest the tile, requiring the same Diplomat escalation → DM approval → Battle Round sequence. Jerusalem rule: contested territory can trade hands across multiple epochs indefinitely. |
| 60 | **Geographic Catan layer: each region has a visible natural advantage — shown to all students on Day 1. Decisions 14–16 (Kahoot draft) stand.** | Every region has a terrain-based bonus profile visible to all students from the moment draft day begins. The bonus profile is displayed on the draft screen alongside each region — teams know exactly what they're choosing when they pick. This makes the Kahoot draft *more* strategic, not less: you're not just picking a spot on the map, you're picking a bonus identity for your civilization. Bonus profiles: 🌊 Coastal/Frontier (Alaska, Caribbean, Pacific) → +Reach 🧭, trade routes cost less. 🌲 Forest (Eastern Canada/US) → +Production ⚙️, builds faster. 🌾 River Valley (W. US/Mexico/C. America, Nile/Tigris region, East Asia) → +Food 🌾, passive base food without a Farm. 🏛️ Crossroads (W. Europe/Mediterranean) → +Legacy 📜, laws and mythology generate more. ⛰️ Mountain (S. America, Caucasus) → +Resilience 🛡️, defense bonuses, harder to raid. 🌊 Cold Coastal (N. Europe/British Isles) → +Resilience 🛡️. 🌾 Mineral Rich (Sub-Saharan Africa) → +Production ⚙️, strongest raw yield. 🧭 Steppe (Russia/Central Asia) → +Reach 🧭, Silk Road bonus. 🌊 Island/Fog (Pacific/Japan/Korea/Australia) → +Reach 🧭, fog reveals faster. Bonus profiles are a starting modifier — not a ceiling. Any civilization can build anything. DB: `region_bonus_type` column on the `regions` table; modifier applied at yield calculation each round. |
| 61 | **Territory system: named geographic sub-zones replace hex/square tiles entirely.** | Each of the 12 macro-regions is divided into 5–8 pre-drawn named geographic sub-zones (GeoJSON polygons). Sub-zones are terrain-tagged and curriculum-named — Copper River Delta, Nile River Valley, Straits of Gibraltar, Mongolian Steppe, Ganges Plain, etc. No hex grid math, no coordinate systems, no diagonal movement weirdness. Expansion = claiming a named sub-zone via EXPAND round. Buildings placed in a specific named sub-zone. Units (Scouts, Soldiers, Merchants) pinned to a sub-zone. Scouts reveal adjacent sub-zones; fog lifts per sub-zone as they move. Territory boundary changes update GeoJSON polygon ownership → Supabase Realtime → Leaflet re-renders team color overlay instantly. Students talking about "the Nile Delta" or "the Straits of Gibraltar" are doing geography. That is not an accident. DB: `sub_zones` table (`id`, `name`, `region_id`, `terrain_type`, `geojson`, `owner_team_id` nullable, `fog_state`, `buildings[]`, `units[]`). |
| 62 | **Deep 5-tier tech tree — prerequisite chains, Legacy-funded, ~30 techs, built for the 6-week arc.** | Research currency: Legacy 📜 (DEFINE round). Teams choose one active research project per epoch; Legacy contributed fills that tech's bar; unlock when full. Hard prerequisite gates — cannot skip. **TIER 1 (~35 Legacy each, available Epoch 1):** Animal Husbandry (→Granary buildable, Cart unit, Pasture improvement). Pottery (→Food Stores cap ×2, food tradeable). Mining (→Mountain sub-zones yield Production, ore activatable). Sailing (→Scout enters coastal sub-zones, Merchant sea routes). Writing (→Library buildable, written justification earns +25% yield bonus). **TIER 2 (~60 Legacy, requires 2× Tier 1):** The Wheel (→Roads cut Reach cost −25%, Caravan unit). Bronze Working (→Swordsman unit, Walls −30%). Masonry (→Wonder contributions −20% Production). Calendar (→seasonal event preview 1 epoch ahead, one-time food bonus). Currency (→Market buildable, inter-team resource pricing). Archery (→Archer unit, ranged DEFEND advantage). Celestial Navigation (→deep ocean sub-zones, extended contact range). **TIER 3 (~90 Legacy, requires 2× Tier 2):** Iron Working (→Iron-tier units +25% combat strength, Barracks upgrade). Construction (→Aqueduct buildable, Bridge cross-river free). Mathematics (→Catapult/Siege unit, all yields +10% base). Philosophy (→government type choices unlock, Diplomat gets second de-escalation window in Battle Round). Drama & Poetry (→mythology creatures grant Legacy bonus, cultural influence radiates to adjacent sub-zones). Horseback Riding (→Cavalry unit: 2× movement, high attack). Optics (→Lighthouse: Scout coastal reveal ×3, fog clears faster in ocean sub-zones). Trade Routes (→formal multi-epoch inter-team trade agreements, Merchant generates passive Reach). **TIER 4 (~120 Legacy, requires 3× Tier 3):** Steel (→Steel-tier units strongest military, Castle building). Engineering (→Wonder construction −30%, damaged buildings repair instantly). Civil Service (→Bureaucracy government form, second Diplomat active simultaneously). **Feudalism (→VASSAL STATE mechanic unlocked** — team can formally pledge or receive vassalage; requires both teams to agree and Scott's DM approval). Guilds (→Merchant establishes permanent trade hub in sub-zone, passive Reach income every epoch). Education (→University building, Legacy yield ×2 permanently). Chivalry (→Knight unit: strongest mobile, de-escalation cultural bonus reduces war likelihood). **TIER 5 (~160 Legacy, requires 3× Tier 4):** Printing Press (→laws spread passively to adjacent civs, Legacy ×1.5). Gunpowder (→Musketeer unit + Cannon siege weapon, bypasses Walls). Astronomy (→full contact range with any civ on map, fog clears globally over time). Banking (→banked resources stop decaying, +5% interest per epoch). Diplomatic Corps (→formal treaty enforcement by game engine, United Civilizations vote mechanic active). Scientific Method (→all future research costs −25%, Science mini-track unlocked). **Vassal mechanic detail (requires Feudalism):** lesser civ gets military protection from liege + small resource tribute each epoch; loses: independent war declaration (must request through liege), contributes 20% of resources to liege per epoch. Revolt: costs Resilience, requires Feudalism tech on vassal's side, full Diplomat escalation sequence. DB: `tech_research` (team_id, tech_id, legacy_invested, completed, epoch_completed); `vassal_relationships` (liege_team_id, vassal_team_id, epoch_formed, active, terms_text). Pace: 450 total Legacy in 30 epochs if consistently invested → Tier 3 reachable in 3 weeks, Tier 4–5 in 6 weeks. **UI NOTE (Student-originated, Decision 62 addendum — Item G):** The ore-to-metal progression that already exists in the tech tree (Mining → Bronze Working → Iron Working → Steel) must be surfaced visibly in the Architect's BUILD panel as an explicit refinement chain. When a team has a sub-zone with ore resources but lacks the relevant tech, the panel shows: *"You have iron ore in this sub-zone. Research Bronze Working to begin smelting it into usable metal. Current status: raw ore only."* No new data model. No new DB columns. The progression chain is already in the design — this is a display requirement, not a mechanics change. Students see: Mine ore → Use Production to refine → Unlock stronger units. The civilization that can PROCESS its ore is richer than the one that just digs it up. Copper → Bronze → Iron → Steel is the tech tree of human civilization, and students should read it as such on their screen. |
| 63 | **Vassal State terms: auto-pull tribute (20%), war obligation refusable at cost, liege conquest = vassal freedom, no chains beyond one level, full DM visibility.** | Tribute: the game automatically deducts 20% of the vassal's total earned resources each epoch (all 4 types) and routes them to the liege — no honor system, no manual transfer, pure engine enforcement. War obligation: when the liege enters a Battle Round, the vassal receives a notification and MUST submit in their next DEFEND round on the liege's behalf — OR they can refuse, which costs 25 Resilience and begins a countdown to automatic revolt if done twice. Conquest: if the liege civilization is militarily defeated and loses their home sub-zone, the vassal relationship auto-terminates and the vassal gains full independence immediately — the conquering team gets the liege's territory, NOT the vassal relationship. Chains: flat relationships only — no vassal-of-a-vassal. If a vassal gets Feudalism tech and tries to take their own vassal, they must first revolt and become independent. DM panel: Scott sees a live `VASSAL BONDS` panel showing all active liege → vassal pairings, current tribute routing each epoch, revolt risk flags. DB: `vassal_relationships` table gains `tribute_auto_pull: true`, `war_obligation_refusals: number`, `revolt_risk_flag: boolean`. |
| 64 | **NPC system: 5 archetypes, real Reputation DB per team per NPC, tech-tier lifecycle triggers, empire rise/peak/decline/fall with contested territory aftermath.** | **5 archetypes:** (1) **Horde** — 2–3 sub-zones, auto-pulse raids the lowest-Resilience adjacent team each epoch, can be bribed with Merchant tribute to skip one epoch, ends by disintegrating (territory goes neutral). (2) **Sanctuary** — 1–2 sub-zones, never attacks, passive trade offer every 2 epochs, cultural conquest costs −10 CI permanently if you conquer them militarily. (3) **Colossus** — 8–12 sub-zones, dormant until triggered, exerts passive Legacy drain (−1/epoch) on adjacent civs whose Legacy total is less than the Colossus's, defeating even one of their sub-zones fires a projector announcement. (4) **Caravan** — no territory, travels a preset route, generates a trade popup when passing through a sub-zone with a Market or active Merchant, can be robbed (costs 1 Soldier, −20 Reputation, Caravan reroutes for 3 epochs). (5) **Recluse** — 3–5 sub-zones, extreme military defense bonus, 1-epoch attack warning before retaliating, can only be befriended through 3 consecutive DEFINE-round Lorekeeper cultural exchanges. **Tech-tier lifecycle triggers (no calendar dates — NPCs rise with the civilization level of the room):** Rome (Colossus): spawns dormant in Mediterranean sub-zones from Epoch 1. Activates Imperial phase when 3+ player teams reach Tier 3 → expands aggressively, exerts cultural pressure. Runs 8–10 epochs. Enters Decline (loses 1 sub-zone/epoch, ceases attacks). Falls: projector fires *"Rome has fallen."* All Rome sub-zones go neutral. Adjacent teams must claim them through EXPAND or they stay contested. Mongol Horde (Horde): spawns dormant in Central Asian sub-zones. Activates when 2+ player teams reach Tier 4 → raids every epoch at full strength. Runs 6–8 epochs. Disintegrates: projector fires *"The Great Khan is dead. The Horde fractures. Who fills the steppe?"* Sub-zones go neutral. Preset defaults always in game: Rome, Mongol Horde, one generic Sanctuary (Scott assigns location at setup), one generic Caravan route (Scott assigns route at setup). **Reputation:** real DB value per team per NPC (0–100). Robbing Caravan: −20. Attacking Sanctuary without Diplomat contact: −15. Gifting Sanctuary: +10. Trade with Caravan: +5. Passive recovery: +5/epoch. Below 30: Caravans permanently reroute around that team until recovered. Below 10: all Sanctuaries refuse contact. Teaching anchor: teams that play aggressively burn long-term trade and diplomatic infrastructure — the engine enforces the consequence without Scott having to say a word. **DM NPC panel:** SPAWN NPC, NPC ROSTER (shows lifecycle stage, auto-pulse status, last action for each), OVERRIDE THIS EPOCH, GIVE ORDERS, DISSOLVE, and the **WAKE ROME button** — immediately triggers Rome's Imperial phase regardless of tech tier state (for curriculum moments when Scott needs it now). DB: `npcs` (id, name, archetype, sub_zones[], lifecycle_stage, soldier_strength, auto_pulse_active, tech_tier_trigger, active_epochs_remaining). `npc_actions` append-only log. `npc_reputation` (team_id, npc_id, score). |
| 65 | **War Exhaustion: war has systemic multi-epoch consequences for both sides including the winner. ClassCiv is not a war game — the engine enforces that.** | **Immediate post-war consequences (both teams, every Battle Round):** Population: winner −2 Pop, loser −3 to −5 Pop (scaled to Soldiers fielded — more troops engaged = more deaths on both sides). Production: both teams −30% Production yield next epoch (supply chains broken, labor pool depleted). Banked resources: loser loses 25% of banked resources to winner (plunder); winner loses 15% of their own bank (cost of campaign). Soldiers: loser loses 1–3 units; winner loses 1 unit — Pyrrhic element. **Population recovery suppression:** population does NOT auto-recover the epoch following combat. Passive recovery resumes at +1 Pop/epoch ONLY if a Farm and Granary both exist. A civ that wars twice in 5 epochs without a recovery interval faces genuine collapse. **War Exhaustion counter:** every war declaration adds +25 Exhaustion. Passive decay: −10/epoch. At 50+: all yields −15%. At 75+: all yields −30%, Diplomat cannot submit trade offers (diplomatic isolation), d20 event pool skews negative (exhausted civs attract opportunists). At 100: Civil Unrest fires automatically — Resilience collapses, Warlord submission is cancelled this round as internal factions fight. **The Pyrrhic projector message:** after any Battle Round where the winner lost Soldiers and population, the projector displays: *"Victory is secured. But the fields are quiet, and the families waiting at home are fewer than before."* Scott narrates what this cost. **Teaching anchor:** Germany post-WWI. Russian birthrate collapse post-WWII. The Ottoman Empire's continuous-war drain. Students who try to conquer everything will feel these mechanics. Students who build through diplomacy, trade, and culture will watch the warmongers collapse and understand *why* without Scott having to lecture. The engine teaches it. DB: `team_metrics` gains `war_exhaustion: number`, `pop_recovery_suppressed: boolean`, `pop_recovery_suppressed_until_epoch: number`. |
| 66 | **Cross-class timing** | ~~Option C simultaneous resolution — both classes submit → Pending. Scott RESOLVES every morning.~~ → **Superseded by Decision 96** | ~~Morning RESOLVE, grace mode, cross-class conflict pass, RESOLVE READY notification.~~ → No cross-class RESOLVE needed. Each game resolves independently during or after each class period. Scott hits RESOLVE for the 6th grade game during 6th grade class, and RESOLVE for the 7/8 game during 7/8 class (or after). No shared pending queue. No morning sync step. Each game is fully independent. Existing per-game `resolution_status: 'pending' | 'resolved'` on epoch_submissions is still used within each individual game's RESOLVE flow. |
| 67 | **Cultural Victory is a formal win condition. CI is a separate tracked score. Physical hand-drawn student art uploads as Cultural Artifact = real CI bonus. No artist on your team = no art bonus. By design.** | **Cultural Influence (CI)** is a separate tracked score distinct from the 4 resources and not routed through Spend/Contribute/Bank. Generates from: each mythology creature completed (+5 CI, DEFINE round); Drama & Poetry tech (CI radiates to 1 adjacent sub-zone/epoch passively); Printing Press tech (CI radiates 2 sub-zones further); high Legacy output (every 10 Legacy earned in a DEFINE round = +1 CI that epoch); **Physical Art Artifact submission (+15 CI per Scott-approved piece).** **Physical Art Artifact process:** any student on the team creates original physical artwork during class, at home, or whenever Scott permits. The Lorekeeper notes "Art Artifact pending" in their DEFINE round submission. Scott scans or photographs the piece and uploads it to Supabase Storage via the DM panel. Scott approves → +15 CI assigned to that team immediately. Art displays in: the team's Civilization Panel under a permanent "Cultural Gallery" tab; the projector at approval moment (art shows full-screen for ~5 seconds with announcement *"Civilization X has produced a new cultural artifact"*); and the team's portfolio export PDF at game end. Teams without an artistic student receive no art bonus. This is explicitly intentional — not every civilization produced Michelangelo. The student who draws well is suddenly a strategic asset. Their specific talent directly affects their team's victory path in a way no other mechanic creates. Art approval is DM-gated — nothing is publicly visible until Scott reviews it. **CI spread mechanic:** CI overlays sub-zones without transferring ownership. A sub-zone under cultural influence shows a color tint in the influencing team's color. At 100% CI in any sub-zone, that team earns +2 Legacy/epoch from it (cultural presence generating intellectual output — Roman influence on Britain, Arabic numerals in Europe, American pop culture everywhere). **Cultural Victory condition:** highest total CI score at game end AND CI presence (any%) across more than 50% of all map sub-zones. Can be achieved without owning any sub-zones outside the starting region. DB: `team_ci_score: number` on team metrics; `cultural_influence` overlay on `sub_zones` table ({team_id: score}); `cultural_artifacts` (id, team_id, image_url, ci_bonus, epoch_submitted, dm_approved, artist_name). |
| 68 | **The final epoch is the Epilogue Epoch: no resources, no combat. Civilization histories read aloud, victory conditions revealed, class superlative vote, portfolio export, HeyGen historian closes.** | The final class period is the Epilogue Epoch — gameplay stops, story begins. Structure: **(1) The Civilization Summary:** Haiku generates a 3-paragraph history-textbook-style summary of each team's full simulation arc — territorial choices, wars fought, wonders built, myths created, cultural artifacts submitted, diplomatic relationships. Scott reads each aloud. These students hear their civilization's story told seriously, in the voice of history. **(2) Victory Condition Reveals:** Scott announces which victory conditions were active (configured on Day 1 before the simulation begins) and which team achieved each. Active victory conditions per Decision 74: Economic (highest total banked resources), Population (highest population count), Cultural (highest CI spread), Scientific (first to Tier 4 tech tree), and Endgame Epoch (narrative wild card — Lunar Race, Mars Colonization, or Warp Speed). No Domination victory condition exists. **(3) The Class Superlative Vote:** every student submits votes for OTHER teams (no self-voting). Categories: Most Ruthless Civilization / Most Surprising Comeback / Best Diplomat / Civilization We Most Feared / Civilization We Wished We Were. Results announced publicly. **(4) Portfolio Export:** each team's full simulation record generates as a PDF — every epoch decision, all round submissions, mythology creatures, Cultural Gallery with all approved art, wonder history, map snapshot of final state, full resource arc. This IS the primary assessment artifact — Scott grades from the export, not from memory. **(5) The Historian's Epilogue** — HeyGen pre-rendered clip fires on the projector as the final act. The historian avatar delivers a closing narration about the simulation as a whole. Something like: *"Empires are not built by the sword alone. They are built by the farmer who made the fields, the merchant who opened the road, the artist who made the people remember who they were. Six civilizations rose. The record is permanent. History has been made."* Map fades. Simulation ends. DB: `portfolio_exports` table; `epilogue_generated: boolean` on `game_state`; HeyGen asset filed under `event_type: 'epilogue'` in `heygen_assets`. |
| 69 | **Trade: two-tier system — Spot Trade Board (open market, async-native) + Trade Agreements (named multi-epoch auto-executing contracts). Embargo available. Resources only — tech and territory not tradeable.** | **Tier 1 — Spot Trade Board:** Any Merchant posts an offer to a shared board visible to all 6 civs: resource offered, quantity, resource requested, quantity. Open to any civ — async-native, cross-class native. First Merchant to accept wins it. Executes at next RESOLVE. Board is anonymous on fill — you see who filled your offer after resolution, not before. Unaccepted offers expire after 3 epochs. No negotiation — it's a market. Keeps the Merchant role active every epoch regardless of diplomatic relationships. **Tier 2 — Trade Agreement:** Diplomat proposes a named multi-epoch deal to a specific civ: resource type, quantity per epoch, return resource type, quantity per epoch, duration in epochs, auto-renew yes/no. Receiving civ's Diplomat accepts, counters, or declines during their class period — full async, no same-window coordination needed. Once both Diplomats agree AND Scott approves from DM panel, it auto-executes at every RESOLVE without anyone touching it. Both civs receive +5% yield bonus on their sent resource for the duration (specialization reward — the Silk Road made everyone better at what they shipped). Visible to Scott and both participant teams only — all other teams blind to the terms. Cancellable with 1-epoch notice: the cancelling civ takes −10 Reputation with the other civ and a small Legacy penalty. Breaking contracts has costs. Teaching anchor: Ottoman capitulations, Hanseatic League, Bretton Woods. **What can be traded:** the 4 economy resources — Production ⚙️, Reach 🧭, Legacy 📜, Resilience 🛡️. Food 🌾 becomes tradeable once Pottery tech is researched (Tier 1, Decision 62). Tech cannot be traded (knowledge transfer is a separate Diplomatic Corps mechanic). Territory cannot be traded (must be earned through EXPAND or transferred through vassalage). **The Embargo:** Warlord can file a trade embargo against one civ per epoch. That civ's Spot Trade Board offers are hidden from the filer and vice versa. Any active Trade Agreements with that civ go frozen — resources stop flowing but the agreement persists and can be unfrozen when the embargo lifts. Filing an embargo is a public diplomatic signal: appears on the DM panel and on the embargoed civ's Diplomat screen. The filer loses their own access to that civ's trade — embargoes cost the filer too. Strategic, not free. Teaching anchor: Napoleon's Continental System, OPEC 1973, US-China trade war — economic warfare as an alternative to military conflict. **DB:** `trade_offers` (team_id, resource_offered, qty_offered, resource_requested, qty_requested, status, epoch_posted, filled_by_team_id). `trade_agreements` (id, proposing_team_id, receiving_team_id, terms_json, status, epoch_start, epoch_end, dm_approved). `trade_embargoes` (filing_team_id, target_team_id, epoch_filed, active). |
| 70 | **Student UX: individual Clerk logins, role-specific landing screens, map as a tab, complexity gates behind the tech tree, no open chat, MacBooks silent.** | **Auth:** every student has their own Clerk account. Roles assigned at game setup: Lorekeeper, Warlord, Merchant, Diplomat, Architect. Role determines what the dashboard shows — same game, different views. No shared screens, no crowding around one MacBook, no kid coasting on someone else's account. Portfolio export is per-student. **Landing screen on login:** the student's role panel is center-screen. Persistent top bar always shows: team name, civilization name, current epoch number, 4 resource counts (Food/Production/Reach/Resilience), CI score, current epoch phase. The map is a tab in the nav — always accessible, never the default. Their job is the first thing they see when they sit down. **Map tab:** shows their territory (colored), fog of war (gray unexplored), known NPC positions, sub-zone names. Does NOT show other teams' resource counts, tech tree progress, banked resources, or unit counts — that intelligence is earned through Optics, Scouts, and Diplomacy, not handed to them by the UI. **Progressive complexity:** the UI reveals itself with the tech tree. A Warlord on Epoch 1 sees units, one DEFEND button, one EXPAND button, and their army strength. The Cavalry option physically doesn't appear in the interface until Horseback Riding is researched. The Warlord can't accidentally try to do something they haven't unlocked. Every icon has a text label. Every button has a tooltip. The game teaches itself one epoch at a time. **Communication:** no open chat, no direct messaging between students or teams. Diplomacy proposals are structured form submissions through the Diplomat's interface. Scott sees every outgoing proposal on his DM panel before it resolves. In-person verbal negotiation in the classroom IS diplomacy — the game records and executes the outcome. **Sound:** student MacBooks produce zero audio. Silent. All game audio — event stings, wonder fanfares, HeyGen clips, resolution sequence sounds — comes from the classroom projector computer's speakers only. **Exit hooks:** at the end of each epoch, after submission, each student sees a 1–2 sentence Haiku-generated recap of what their role contributed this epoch. Brief, personal, historical-voice. The Lorekeeper reads what the scribes recorded. The Warlord reads what the generals reported. DB: Clerk `role` metadata on each user profile; `student_epoch_recap` (student_id, epoch, text) stored per-resolution. |
| 71 | **Absent role → redistributed to a present teammate that epoch. Team votes who absorbs it; Scott assigns from DM panel if no consensus. No AI fill, no vacancy, no ghost civ.** | **The core principle:** history doesn't wait for absentees — but their civilization doesn't die either. When a student is absent, their role is redistributed to a present teammate for that epoch. That present student now carries two jobs. **Selection order:** (1) In 7/8 grade, a Deputy absorbs the absent role first — that's what deputies are for. (2) In 6th grade (no deputies), the team nominates someone; Scott assigns from his DM panel if they can't decide. (3) Scott's DM panel shows a roster card at the start of each epoch — any absent student's role slot is highlighted in orange with a REASSIGN button. One click opens a dropdown of present teammates. Scott confirms, the system reassigns. The covering student now sees both role panels on their dashboard until that epoch closes. **What the covering student does:** they submit both role's actions — EXPAND and BUILD if they're covering both Architect and another role, for instance. They're credited in the Haiku recap for both. It is briefly heroic and slightly exhausting and the kids treat it as a badge of honor. **No vacancy ever:** a role that goes uncovered is a game design hole. Contributions that don't happen leave sub-zone gaps, undefended territory, unspent resources. The game is designed around every role acting each epoch — the absent handling respects that structure. **DB:** `epoch_role_assignments` (team_id, epoch, role, assigned_student_id, covering_for_student_id nullable) — when covering_for_student_id is set, that student's dashboard shows the dual panel view. Covering assignment logged for Scott's records and portfolio accuracy — the absent student's portfolio notes the epoch as absent, the covering student gets credit for heroic service. |
| 72 | **A3/A4 — Returning students catch up in-person with teammates. Contradictory submissions: war beats trade; Scott sees a conflict flag and can override.** | **A3 — Returning student catch-up:** no in-app recap system. A student who missed two epochs comes back and their teammates tell them what happened. This is not a design gap — it is intentional. The in-person debrief is richer than any AI summary because it requires the present students to recall, narrate, and explain. "You were gone when we went to war with the Birch Confederacy" is a more powerful learning moment said out loud than read in a text panel. The game state is fully visible on the player's dashboard when they log back in — current resource counts, territory on the map, research tier, epoch number. The mechanics tell the what. Teammates tell the why. No Haiku recap on login for absences, no missed-epoch feed, no AI debrief system to build. **A4 — Contradictory submission resolution:** war declaration supersedes trade submission when two teams file conflicting actions in the same epoch. The system detects the conflict at submission close and generates a CONFLICT FLAG on Scott's DM panel — a red banner identifying both teams, both submitted actions, and the automatic resolution recommendation ("WAR beats TRADE — trade route blocked"). Scott sees this before RESOLVE fires. He can accept the recommendation with one click OR use a manual override dropdown: choose which action prevails, or rule that both fail (standoff epoch for those two civs), or resolve in a custom way. **Conflict detection rules (priority ladder):** War Declaration > Embargo > Trade Agreement > Spot Trade. Any lower-priority action that conflicts with a higher-priority action from the same pair of teams is flagged. Scott is never surprised at RESOLVE — conflicts are surfaced, not silently swallowed. **DB:** `epoch_conflict_flags` (id, epoch, team_a_id, team_b_id, action_a_type, action_b_type, auto_resolution, teacher_override, resolved_at) — created by the submission engine when a contradiction is detected, resolved by Scott at RESOLVE time. Flags log to history for Scott's records and for the student portfolio narrative. |
| 73 | **N-series: every civilization uses the same mechanics. Named accurately. No special ruleset. Contact framing is Scott's to set at the DM panel.** | **The core principle:** every civilization on this map is a full civilization. Same tech tree, same economy, same roles, same map presence. There is no special indigenous ruleset, no separate subsistence track, no alternative mechanics. Sophistication is expressed through historical framing and the teacher's voice — not through a different ruleset. The Haudenosaunee ran one of the most advanced confederate governance systems in recorded history. The Maya built cities with accurate astronomical calendars. The Ahtna Athabascan built a copper trade network spanning Interior Alaska. None of them need a handicap. They need to be on the board. **N1 — Civ representation:** when the map includes a region associated with a specific nation, that civilization is named specifically and accurately — Ahtna Athabascan, not "Alaska Native." Same 5 roles. Same tech tree. Same economy. Same map presence. **N2 — No special mechanics:** one ruleset. It applies to everyone. Historical nuance lives in the event text, the Haiku recap narrative, and Scott's teaching in the room — not in a separate mechanical layer. **N3 — No built-in consultation gate:** how and when Scott involves the community in the classroom narrative is a human relationship, not a database flag. The game doesn't build a checkbox for it. **N4 — Contact framing:** the contact event fires like every other event. Scott writes the flavor text. Scott controls the narrative weight. The system surfaces the event and gives Scott the pen. No hardcoded tone. No default framing. The teacher decides what this moment means for these kids on that day. |
| 74 | **S1/S2/S4 — Yes there's a winner (standings 1–6), but NO Domination. Game always runs full-length. Victory conditions are constructive. Portfolio PDF is the grade artifact, not game standing.** | **S1 — Winning:** there IS a winner, ranked 1st through 6th within each class period at the Epilogue Epoch. But the game does NOT end when someone hits a victory condition — the game always runs to the scheduled final epoch. Every team plays every epoch. Final standings are calculated at the Epilogue, not during play. One team achieving a victory condition is a narrative milestone announced on the projector during that epoch's RESOLVE — a moment of triumph, not a game-over screen. The other civs keep playing because history didn't stop when Rome was ascendant — the other civilizations kept building, kept surviving, kept competing for their own legacy. Standings at the end reflect the full arc, not who spiked first. The two classes (6th, 7/8) each produce their own 1–6 standings — no cross-class ranking. **S2 — Victory conditions (NO Domination):** the active victory conditions Scott can toggle at game setup are: (1) **Economic Victory** — highest total banked resources at Epilogue. (2) **Population Victory** — highest population count at Epilogue. (3) **Cultural Victory** — Cultural Influence score (CI — see Decision 67). (4) **Scientific Victory** — first civ to reach Tier 4 of the tech tree. (5) **Endgame Epoch — the wild card:** as the game advances into the modern era, a class-wide narrative event fires. Scott chooses: *Lunar Race* (first civ to research Space Exploration gets to plant the flag), *Mars Colonization* (cooperative or competitive — first civ to hit a resource+research threshold gets the colony), *Warp Speed + Alien Contact* (the full 2050 crazy run — the projector shows a deep space message and every civ gets to submit their first-contact diplomatic response as their final act of the unit). The Endgame Epoch is a narrative finale Scott selects based on class energy and how the game played out — it's not a fifth separate competition, it's the curtain call that puts every civ's arc in perspective. No Domination victory condition exists. There is no mechanical reward for conquering other civs' home territory — war has Pyrrhic costs and War Exhaustion (Decision 65), but war is a tool not a win condition. Civs that choose military aggression as their primary strategy will find the economics work against them. The lesson is in the mechanics. **S4 — Grade:** the portfolio export PDF (generated at Epilogue Epoch) is the primary assessment artifact. Each student's portfolio contains: their role's decisions per epoch with written justifications, their Haiku epoch recaps, their cultural artifact submissions (if Artist), their civ's final stats, and the Epilogue history paragraph. Scott grades the portfolio — the quality of thinking, the written justifications, the engagement with the historical framing. Game standing (1st vs 6th) does not affect the grade. A team that finishes 6th but wrote thoughtful justifications and engaged with the history at every epoch can earn full marks. A team that wins the Economic Victory via ruthless cheese mechanics with no written reflection gets graded on the reflection, not the win. **DB:** `victory_conditions` table (game_id, condition_type, active, triggered_by_team_id, triggered_at_epoch) — tracks which conditions are enabled per game instance and records when/if each is triggered. Endgame Epoch type stored in `game_settings` (endgame_epoch_type: enum lunar/mars/warp). |
| 75 | **S5 — No civ death. Crisis threshold triggers Dark Ages: reduced yields, no expansion, recoverable. Students stay in the game.** | **The principle:** no team gets knocked out of ClassCiv. There is no ejection, no death screen, no respawn humiliation. A civilization in genuine crisis — population low, resources depleted, War Exhaustion at 100, multiple disaster events in sequence — enters **Dark Ages** status. **Dark Ages mechanics:** triggered automatically when ALL of the following are true simultaneously: Population ≤ 3, Resilience = 0, and either War Exhaustion ≥ 75 OR a Famine/Plague event fired in the same epoch. When triggered: (1) All yields reduced by 50%. (2) EXPAND submissions are locked — the civ cannot claim new sub-zones. (3) TRADE submissions are restricted — only Spot Trade available, no new Agreements. (4) A **DARK AGES** banner appears on the projector during that epoch's map render — the room notices. (5) Haiku recap for the epoch describes the civ in crisis using historical-voice language: *"The granaries stand empty. The roads fall silent. But the people endure."* **Recovery path:** the civ exits Dark Ages when Population returns to ≥ 5 AND Resilience ≥ 10. Recovery is intentionally achievable — defensive play, a friendly Trade Agreement, a positive d20 event, or a deliberate BUILD epoch focused on Granary and Farm will pull them out. Scott's DM panel shows a DARK AGES status badge on the affected team's card with a recovery progress bar. **Why this works:** every student stays at the table. A civ in Dark Ages is behind, humbled, and fighting to survive — which is exactly where the most engaged historical thinking happens. The kids who dragged their civ into crisis have something to fix. That's better pedagogy than ejecting them from the game. Historically: Western Rome (476 CE) didn't end civilization — it entered a transformation. Byzantine Rome, the Carolingian successor, the Islamic Golden Age flourishing alongside Europe's dark period — the full picture is what makes it interesting. The game teaches that by keeping every civ alive and letting the dark periods be recoverable, not fatal. **DB:** `team_metrics` gains `dark_ages_status: boolean`, `dark_ages_since_epoch: number`. Server checks Dark Ages trigger conditions on every RESOLVE and sets the flag automatically. Recovery check runs on same RESOLVE loop. |
| 76 | **Projector: two separate computers, three auth roles, server-driven display. World map default, animated resolution sequence, all audio from projector speakers. Scott pushes events from his desk.** | **Hardware setup:** two computers, completely separate. (1) **Classroom computer** — logged into a `projector` Clerk account with display-only role. HDMI out to the projector. Sits at the front of the room, no keyboard/mouse interaction needed during a running epoch. Browser pointed at `/projector` route — a full-screen, server-driven display that auto-refreshes via Supabase Realtime subscriptions. (2) **Scott's desk computer** — logged into his `teacher` Clerk account with full DM panel access. This is `/dm` — the god-view. What's on Scott's screen is never visible to students. There is no mirroring, no toggle, no risk of accidentally showing the class his resource data or unresolved submissions. **The three auth roles:** `student` (role-specific dashboard, map tab, submission forms), `teacher` (full DM panel — god-view map, all teams' data, NPC controls, RESOLVE button, event firing), `projector` (read-only display, receives pushed content from server, auto-refreshes). **Default projector state (idle, between submissions):** world map fills the entire screen. Sub-zones colored by owning team. Fog of war renders unexplored areas in muted gray. Contested sub-zones have a subtle pulse animation. No resource numbers. No leaderboard. Just the map — let the class debate it. The map is alive and beautiful even when nothing is happening. **Resolution event sequence (fires when Scott hits RESOLVE):** ~10 seconds of animated transitions. Territory ownership shifts on the map. Population counters adjust. New buildings appear as icons on sub-zones. Wonder completion: full-screen card (team name, wonder name, permanent bonus, 10 seconds — let the other teams feel it). Battle Round outcome: map zooms to contested sub-zone, both teams' Pyrrhic costs displayed, Pyrrhic message text. NPC activation: map dims, dramatic overlay, narrator text. Cultural artifact approval: art fills screen for 5 seconds, artist credit shown. d20 event: card slides in from right, flavor text + effect + sub-zone named, 8 seconds. After all events resolve, map settles into new state. **Scott's push controls (from DM panel at his desk):** FIRE EVENT dropdown, WAKE ROME button, `PUSH TO PROJECTOR` toggle for any custom message or announcement. The projector computer just renders whatever the server tells it to show — Scott never has to touch the classroom computer during class. **Audio:** all game audio plays through the classroom computer's speakers — event stings, wonder fanfares, resolution sequence music, HeyGen clip audio. Scott's desk computer is silent. Student MacBooks are silent. One audio source, the room's shared speakers. **Civilization names on projector:** teams name their civilization on Day 1 during setup. Scott approves via DM panel before the name appears anywhere in the system. Once approved: the name appears on the projector map as a label on their home sub-zone, in all Haiku-generated recap text (*"The Copper River Confederacy expanded south this epoch..."*), in Battle Round announcements, in the portfolio export PDF, and in the Epilogue Epoch histories. Inappropriate name attempts are blocked at the DM approval gate — nothing goes live until Scott says yes. The name is permanent once approved; changing it costs Scott a manual override. DB: Clerk role metadata for `projector` account; `projector_state` table (current_view, active_event, last_pushed_at) updated by server on RESOLVE and event triggers; `civilization_names` (team_id, name, approved_by_teacher, approved_at). |
| 77 | **Roles fully defined: rotation holds, no removal, no Spy, five dashboards mapped to Decision 70 names.** | **R-NEW1:** Rotation calendar holds through absences — miss Epoch 3, you miss that role; rotation doesn't shift for you. Decision 71 handles redistribution; portfolio tracks which roles each student played and which epochs they missed. **R5:** No mid-epoch removal. Roles rotate every epoch (Decision 18). Classroom management ≠ game mechanic — Scott handles it as a teacher, not through the engine. **R6:** Role does not affect individual grade. Decision 74: portfolio quality is the grade. The role you hold in a given epoch doesn't weight your grade — the quality of your thinking in whatever role you hold does. **R11:** No Spy role in v1. Five roles are mapped (Decision 70). Espionage mechanics live in the tech tree (Optics, Astronomy reveal fog and contact range). Spy role = v2 consideration at most. **R12:** No single leader has override authority. Warlord can't declare war without Diplomat filing escalation (Decision 57). Diplomat can't prevent Warlord from building military strength. Mutual checks — historically accurate civilian/military leadership tension. **Role dashboards (Decision 70 names):** **Architect** = leads BUILD. Screen: available buildings (tech-gated construction panel), building queue, infrastructure placement by sub-zone, building health/status. Routes Production. **Merchant** = leads EXPAND. Screen: Spot Trade Board (post/accept offers), active Trade Agreements, Embargo status, caravan unit management, trade route visualization on map, territory expansion proposals. Routes Reach. **Diplomat** = leads DEFINE (laws). Screen: diplomacy interface (proposals, alliances, grievances, de-escalation window), law creation panel, treaty status board. Routes Legacy. **Lorekeeper** = leads DEFINE (mythology). Screen: mythology creature gallery (past creatures), current creature prompt, cultural artifacts tab, CI score + spread map, Cultural Gallery. Co-leads DEFINE with Diplomat. **Warlord** = leads DEFEND. Screen: military units (count, location, health), army strength summary, defense status per sub-zone, Battle Round interface when active. Routes Resilience. |
| 78 | **Round outcome model, progression type, and state tracking for dynamic questions — all locked.** | **E-NEW4:** All roles submit every round (Decision 32); leading role's submission is weighted most heavily in resolution. Other roles submit support/advisory input for their domain within the round — Scott sees everything. **E-NEW5:** Option C — both mechanical and quality-based. Each round produces a base mechanical result amplified by the justification multiplier (already in the yield formula). Scott sets multiplier per team per round via one click on DM panel: 0.5× weak / 1.0× standard / 1.5× strong / 2.0× exceptional. **E-NEW6:** Both UNLOCK and CONSEQUENCE from day one. Neglect hygiene → disease event looms (consequence). Invest in tech → aqueduct unlocks (reward). Ignore laws → civil unrest triggers. Build a wonder → permanent bonus. Both are already baked into the event system (d20 consequences) and tech tree (progression unlocks). Scott's workload = the system handles math, he narrates. **E-NEW9:** State fields driving question selection: territory held (sub-zone count + coastal boolean), tech tier per domain, resource totals (all 6 dimensions), active event flags (disease/drought/unrest), wonder progress %, military strength (soldier count + buildings), trade routes (active agreements), Dark Ages status, War Exhaustion level, vassalage status, contact status. Epochs 1–3 run off a shared starter question bank — state hasn't diverged enough. Epoch 4+ triggers team-specific questions from the bank. Haiku override fires when a team's state is genuinely weird and the bank doesn't cover it. |
| 79 | **Epoch clock: 11-phase timing within a class period. Live resolution. RESOLVE = the loud moment. Pre-contact military = internal threats. Military shadow variable.** | **E2 — 50-minute epoch (6th grade):** (1) Login + Recap 3 min. (2) BUILD round 8 min. (3) BUILD routing 2 min. (4) EXPAND round 8 min. (5) EXPAND routing 2 min. (6) DEFINE round 8 min. (7) DEFINE routing 2 min. (8) DEFEND round 6 min. (9) DEFEND routing 1 min. (10) DM RESOLVE 5 min. (11) Exit hook 2 min. Total: 47 min + 3 min buffer for chaos and transitions. **7/8 (35 min):** rounds compress to 5–6 min, routing to 1 min each, login/resolve/exit stay same. Tight but doable — older kids move faster. Configurable round timer per class. **E3:** Live resolution — Scott hits RESOLVE, projector erupts, whole class watches map update in real time. Already locked by Decision 76 (animated resolution sequence). **E4:** The RESOLVE moment IS the loud moment. Territory shifts, wonder completions, battle outcomes, NPC activations, d20 consequences — all visible simultaneously on the projector. The room erupts. Secondary loud moments: Kaiju attacks, wonder completions, first contact event between classes. Already effectively locked by Decisions 31, 34, 40, 76. **M2 (military):** Pre-contact DEFEND prompts = internal threats: brigands, raiders, dangerous wildlife, civil unrest, natural disaster defense, refugee decisions. Example: *"A raiding party has been spotted near your southern border. You have X soldiers and Y walls. How do you defend?"* or *"Drought refugees from a neighboring region are arriving — accept them (pop boost, food drain) or turn them away (resilience boost, legacy penalty)?"* The military domain pre-contact builds the same army that matters post-contact. **M3:** Military strength = shadow variable accumulating across all pre-contact epochs. On contact, the game checks: total soldiers, military buildings (Barracks, Walls), Warlord justification quality history, War Exhaustion level. Neglected DEFEND = limited post-contact options (must diplomacy, can't project force). Strong DEFEND = full range (alliance, trade from strength, war, intimidation). Comparison shown to Scott on DM panel — he controls how much each team knows about the other's strength via private intel drops (Decision 50). |
| 80 | **Written component details and full decision system locked: scaffolding, authority, count, input format, logging.** | **W-NEW1:** PRE-decision justification. Students write WHY before submitting, before teacher resolves. Already locked by Decision 21. No post-reflection in v1 — the portfolio export and Epilogue Epoch serve that purpose. **W-NEW2/W-NEW5:** In-app. Justification attached to the submission, logged in DB, visible to Scott on DM panel before resolution, exported to portfolio PDF automatically. Paper creates a separate grading pile and loses the decision-context link. Already confirmed by Decision 21. **W-NEW4:** Grade-differentiated scaffolding. **6th grade** = heavy scaffolding: sentence starters with historical anchors. *"As the [role], I propose [action] because in [place/time we studied], we learned that [historical fact]. This will help our civilization by [outcome]."* **7/8 grade** = lighter scaffolding: guided questions. *"What is your proposed action? What historical evidence supports this strategy? What risks do you foresee?"* Scaffolding complexity = per-class configuration in game setup. Same submission form, different placeholder text and helper prompts. Scott can tighten or loosen mid-unit if kids are struggling or outgrowing the starters. **D2:** Leading role has final authority in their round. No formal vote mechanic. No overthrow mechanic. The Architect decides what gets built in BUILD. If the team disagrees, they voice it, but the leading role submits. Other roles submit advisory input Scott sees. Deadlocked teams: leading role's submission stands. If it becomes a real classroom problem, Scott handles it as a teacher. Historically: the Architect who builds a wall when the team wanted a farm has to live with it next epoch. Consequences teach. **D3:** 4 decisions per epoch — one per round (BUILD, EXPAND, DEFINE, DEFEND). Each student submits 4 times per epoch (once per round supporting/leading), but only leads 1 of those 4. Manageable in 50 minutes. **D4:** Question-based with contextual options. Each round: historically-grounded prompt with 2–4 options + a free-text "propose your own action" alternative. Not pure open menu (too much cognitive load for 6th graders), not pure multiple choice (too limiting). Context + options + justification. Example: *"Your scouts report fertile land to the south, but raiders were spotted near the western border. (A) Expand south for farmland, (B) Fortify western border, (C) Send merchant to negotiate passage, (D) Propose your own action: ___."* The free-text option lets advanced students break out; Scott rewards creativity via the multiplier. **D5:** Card-style input. Top: round name + domain icon + epoch number. Middle: decision prompt (2–3 sentences of historical context + question). Below: 2–4 option buttons with short labels + free-text option. Bottom: scaffolded text area for justification (sentence starters for 6th grade). Submit button grayed until option selected AND justification has minimum 2 sentences. Role badge in corner. **D6:** Yes — everything logged. Every submission: team_id, student_id, role, epoch, round, option_selected, justification_text, justification_multiplier, timestamp, teacher_edited_text, dm_consequence. This is the portfolio backbone. These logs generate the PDF, and Haiku reads them for recaps. Already confirmed by Decisions 21, 22, 32, 49, 74. |
| 81 | **Map mechanics locked: fog of war, sub-zone data model, occupation rules. Tile questions obsoleted by Decision 61.** | **M2 (tiles):** Obsolete. Decision 61 replaced tiles with named geographic sub-zones (5–8 per macro-region, ~60–80 total across 12 regions). No hex grid, no square grid, no coordinate system. **M3 (sub-zone data):** Each sub-zone holds: name (curriculum name — "Copper River Delta," "Straits of Gibraltar"), region_id, terrain_type, resource yield modifiers (Decision 60 bonus profiles), owner_team_id (nullable), fog_state, buildings array, units array, GeoJSON polygon data, cultural_influence overlay ({team_id: CI score}). **M4 (fog of war):** Per-team, per-sub-zone. All sub-zones start as 'hidden' (gray overlay on Leaflet map). When a team's Scout enters an adjacent sub-zone via EXPAND round, that sub-zone's fog state changes to 'revealed' for that team only. Revealed sub-zones stay revealed permanently. Each team's fog is independent — my scout revealing the Nile doesn't reveal it for you. Optics tech: Scout reveals 3× sub-zones at once. Floating Torii Gate wonder: all fog clears for that team globally. DB: `team_fog_state` junction table (team_id, sub_zone_id, state: 'hidden' or 'revealed'). **M5:** Units can coexist in a sub-zone without automatic conflict — open borders default. Ownership (buildings, territorial claim) is exclusive: first to claim via EXPAND wins unclaimed sub-zones. Contesting an already-owned sub-zone requires Diplomat escalation + DM approval + Battle Round (Decision 59). **M6:** Geographically accurate Real Earth — already locked by Decision 1. GDA Leaflet map is a directly reusable base layer. Students recognizing the Nile when they build on it IS the educational payload. |
| 82 | **Assessment locked: standards = documentation task, individual writing = justifications, portfolio = export PDF, both formative and summative.** | **AS1:** ClassCiv covers Alaska Content Standards for Geography (maps, regions, human-environment interaction), History (change over time, cause/effect), Government (systems, laws, authority), Economics (scarcity, trade, specialization), and ELA (argumentative/explanatory writing via justifications). Formal standards crosswalk = pre-launch documentation deliverable, not a build blocker. Scott has already mapped 94 standards to MythoLogic Codex — same standards-mapping methodology applies here. **AS2:** Yes — already locked. Decision 21: written justification per round, in-app. Each student submits 4 written justifications per epoch (one per round). That IS the individual written component. No separate journal or essay needed — the game IS the writing assignment. **AS3:** Yes — already locked. Decision 74: portfolio export PDF at Epilogue. Decision 68: full simulation record including all epoch decisions, submissions, mythology creatures, Cultural Gallery art, wonder history, final map snapshot, full resource arc. The PDF is the exportable artifact AND the marketing piece. **AS4:** Both. Written justifications each epoch = formative assessment (Scott reads before resolution, sets justification multiplier = immediate feedback loop — students see better reasoning → better game outcomes within the same class period). Portfolio PDF at Epilogue = summative assessment (full arc of a student's thinking across the simulation, graded holistically). Already locked by Decisions 21, 22, 74. |
| 83 | **Auth, identity, data privacy locked: Clerk code-based login, minimal PII, three roles, export-then-archive.** | **ID1:** Clerk accounts — already locked in Decision 70. Passwordless code-based login: Scott pre-creates all student accounts and hands each student a physical login card with their unique code. No Google SSO dependency (keeps the app independent of school IT decisions). Same Clerk pattern used in MythoLogic Codex. **ID2:** Minimal PII. Clerk stores first name + class code only — no email required for student accounts. The game DB (Supabase) stores student_id (Clerk ID), role assignments, and all submissions. No last names, no birthdates, no addresses stored in the cloud. Scott maintains a local mapping of student_id → real name in a spreadsheet on his desk computer, not in the database. COPPA/FERPA compliant — same pattern as MythoLogic Codex. **ID3:** Yes — three separate auth roles already locked in Decision 76: student (role dashboard), teacher (DM god-view), projector (display-only). No admin layer for v1 — Scott is the only teacher. Multi-school admin architecture = v2+ if this becomes a product. **ID4:** Export, then soft-archive. At Epilogue: portfolio PDFs generated and downloaded by Scott. Game state in Supabase marked as completed but NOT deleted — Scott can access the full game log for grading reference through the next semester. NEW GAME button on DM panel creates a fresh game instance without destroying the archived one. Data is tiny (text + a few image URLs). Formal data retention/deletion policy = v2+ concern if this becomes a product. |
| 84 | **Tech stack fully confirmed: Next.js + Supabase + Clerk + Vercel + Leaflet + Claude + HeyGen. Real-time. Role-based routing. Free at classroom scale. Prototype-first, product-aware.** | **TS1:** Confirmed, no changes. Next.js App Router + TypeScript + Tailwind (frontend). Supabase PostgreSQL + Realtime (backend/DB/real-time). Clerk (auth, 3 roles). Vercel (hosting). Leaflet (map). Claude Haiku (live recaps, exit hooks, NPC behavior, optional event narration). Claude Sonnet (build-time question bank generation). HeyGen (pre-rendered video + Starfish TTS). Supabase Realtime handles 50 concurrent connections easily on the free tier — classroom scale is well within limits. **TS2:** Yes — real-time via Supabase Realtime. Projector receives resolution event pushes. Student devices show live submission status (green/red checkmarks as teammates submit). RESOLVE broadcast triggers simultaneous update on projector + all student screens. Between resolution events, standard HTTP polling is fine. **TS3:** Core DB tables (complete schema): `games`, `teams`, `team_resources`, `sub_zones`, `epoch_submissions`, `wonder_progress`, `team_assets`, `tech_research`, `trade_offers`, `trade_agreements`, `trade_embargoes`, `npcs`, `npc_actions`, `npc_reputation`, `vassal_relationships`, `heygen_assets`, `cultural_artifacts`, `daily_recap`, `epoch_role_assignments`, `private_messages`, `epoch_conflict_flags`, `victory_conditions`, `projector_state`, `civilization_names`, `team_fog_state`. Append-only event log: `game_events` (game_id, epoch, round, event_type, target_team_id, d20_roll, effect, narrative_text, timestamp). **TS4:** Same Next.js app, role-based routing via Clerk middleware. student → `/dashboard`, teacher → `/dm`, projector → `/projector`. Already confirmed by Decision 76. **TS5:** Free at classroom scale. Vercel free tier handles traffic. Supabase free tier (50K MAU). Clerk free tier (10K MAU). Claude Haiku: pennies per session. HeyGen pre-render: ~$12.50 one-time. Starfish TTS: sub-penny per session. Custom domain (classciv.com): ~$12/year. Total ongoing: under $5/month. **TS6:** Prototype-first, product-aware. Use `game_id` on every table so multiple game instances coexist. Use Clerk roles that can expand to multi-school. Don't hardcode Scott's roster anywhere. But do NOT build multi-tenancy, admin dashboards, or usage analytics for v1. Ship it for one classroom. Architecture is clean enough to layer product features later. **TS7:** Yes, v1 feature. Scott types event description on DM panel → optional "Generate flavor text" button calls Haiku → Haiku writes dramatic narration (*"The rains have not come. The Nile runs thin. Your farmers watch the water retreat."*) → fires on projector. Single API call, cheap, fast, optional per event. |
| 85 | **Build order and MVP locked: MVP by first post-spring-break class day. Solo + AI build. GDA Leaflet map reusable.** | **B1 — MVP:** Clerk auth (3 roles) + Leaflet map (12 regions, sub-zones, team colors) + team roster (6 teams per class, 5 students each, assigned roles) + submission form per round (question prompt + option selection + justification text) + teacher DM panel (submission queue, justification multiplier slider, RESOLVE button) + resource tracking (4 resources, basic yield calculation) + projector view (world map + resolution color updates). That's v0. Everything else (fog of war, purchase menu, wonder system, d20 events, HeyGen clips, Kaiju, NPC civs, trade, tech tree UI) layers in subsequent build phases. **B2:** Target: first post-spring-break class day (~early-mid April 2026). ~4 weeks build time from March 4, 2026. MVP must be playable by that date. Polish continues during the 3-week run. **B3:** Build sequence: (1) Auth + team/game setup. (2) Map layer (Leaflet + GeoJSON sub-zones + fog + team colors). (3) Submission system (per round, per role, question + justification). (4) DM panel (submission queue + RESOLVE + multiplier). (5) Resource engine (yield formula + routing panel + bank tracking). (6) Projector display (map + resolution animation). (7) Purchase menu + buildings on map. (8) d20 event system. (9) Tech tree UI + research tracking. (10) Wonder system (4-track + milestones). (11) Trade system (Spot Board + Agreements). (12) HeyGen clips + Kaiju animations. (13) NPC system. (14) Portfolio PDF export + Epilogue. **B4:** GDA Leaflet map = directly reusable as ClassCiv map base layer (same GeoJSON polygon approach). MythoLogic Codex Clerk auth pattern = directly applicable. Claude API integration patterns carry from existing projects. Scott is not starting from zero — he's assembling proven pieces from his existing portfolio. **B5:** Solo + AI, same as every previous project (The Consortium, GDA, MythoLogic Codex, Sourdough Pete, Lesson Companion, Curriculum Factory). Claude Sonnet/Opus as code partner. No human collaborator needed for v1. If this becomes a product, a human dev may join for scale/reliability — but for a classroom prototype, the vibe-coding model is proven and fast. |
| 86 | **Open questions sweep: Region 12 stays, draft inequality intentional, Real Earth only (v1), combat locked, 3-week arc, working title = ClassCiv.** | **OQ1 (epoch gameplay loop):** Fully answered by Decisions 23, 28, 29, 30, 31, 32, 37, 38, 70, 77, 78, 79, 80. **OQ2 (Region 12 too big?):** Stays as-is. Split into 12a (Japan/Korea) + 12b (Pacific/Australia/NZ) only if 13+ teams needed. With 3 civs per class (6 total), the 12-region count is more than sufficient. **OQ3 (snake draft fairness):** Last-pick team gets the toughest starting region. Intentional. Historically accurate — Decision 60 makes inequality visible on draft day as a design feature. The lesson: what you start with matters, but what you build matters more. The team that studies hardest for the Kahoot geography blitz gets first pick — preparation IS the equalizer. **OQ4 (starting inequality):** Already locked by Decision 60. Intentional. **OQ5 (7/8 shorter period):** Already locked by Decision 44 — same structure, compressed timing. **OQ6 (hex or square tiles?):** Obsolete — Decision 61 replaced all tile systems with named geographic sub-zones. **OQ7 (simultaneous or sequential turns?):** Simultaneous. All teams submit within the round timer, then Scott hits RESOLVE once. Already locked by Decisions 31 and 66. **OQ8 (which scenario first?):** V1 has ONE configuration: Real Earth map, all 12 regions, both classes on the same globe. The scenario pack system (Ancient World, Age of Exploration, American West, Ancestral Migration, Teacher Custom) is a v2+ content layer — JSON data packs, not code changes. For this classroom run, the real Earth map IS the scenario. **OQ9 (combat complexity):** Already locked by Decision 59 — d20 roll + Warlord justification quality + Soldiers fielded + buildings (Barracks/Walls) + Scott's DM consequence field as final word. Simple enough for v1, rich enough to teach. **OQ10 (game length):** 6-week arc post-spring-break = 30 epochs per class. Canonical arc locked by Decision 94. Tech tree pacing (Decision 62) was designed for this arc from the start. Game length = a per-game config Scott sets at setup. **OQ11 (name):** ClassCiv. Functional, memorable, accurate. If this becomes a product, the name can evolve — but "ClassCiv" is self-explanatory for what walks into a classroom. Keep it. |
| 87 | **Sub-zone depletion system: overfarming and overhunting reduce yields. Technology enables active recovery and yield enhancement above baseline.** | **Base mechanic:** Every sub-zone gains two new tracked values — `soil_fertility` and `wildlife_stock` (both 0–100, starting at 100). Each BUILD or EXPAND action that works that sub-zone's resources ticks the relevant value down slightly (exact decay rate TBD during Phase 9 tuning — suggest −3 to −5 per active epoch). **Threshold effects:** At 30%: yield modifier kicks in — Food or Production yield from that sub-zone reduced by 25%. At 10%: sub-zone generates a depletion event (d20-style popup: *"The land is exhausted. Your farmers plant and nothing grows."*) and the Leaflet map tile shifts color (green → yellow → brown). Both student devices and projector show the color shift — the class sees it happening. **Passive recovery:** Leave a sub-zone unworked for 2–3 epochs and it recovers slowly. The mechanic for this is already implied by the system. **Tech-gated active recovery and yield enhancement (Scott's amendment — locked):** Passive rest is not the only option, and it is not the ceiling. Technology unlocks active restoration AND the ability to push sub-zone fertility *above* the baseline: (1) **Irrigation** (Tier 2, Water Systems tech) → unlocks an Architect BUILD action: "Irrigate Sub-zone" — costs Production ⚙️, accelerates recovery from depletion (recovery in 1 epoch instead of 2–3). Coastal and River Valley sub-zones irrigating near water sources get a passive +10% Food yield permanently. This is Mesopotamian irrigation, the Nile flood cycle made into a tech unlock. (2) **Terrace Farming** (Tier 3, requires Irrigation + Masonry) → unlocks a BUILD option that permanently raises a sub-zone's `soil_fertility` cap to 120 — yield bonus above the default baseline. Mountain and Hill terrain sub-zones only. This is the Inca at Machu Picchu; terraced fields where flat land doesn't exist. (3) **Crop Rotation** (Tier 3, requires Irrigation + Animal Husbandry) → passively prevents depletion from accelerating beyond −2 per epoch in any sub-zone where a Farm exists. Effectively the soil never degrades as fast once this tech is researched. The Dust Bowl happened because farmers didn't rotate. (4) **Scientific Agriculture** (Tier 5, requires Printing Press + Philosophy) → raises the `soil_fertility` cap to 135 across all owned sub-zones. The Green Revolution. Sustained population growth becomes possible. **Map visualization:** 3-tier color shift is visible on both student screens and projector. Fertility/stock values shown in the sub-zone detail panel on hover — students can see the number. Teachers can see ALL sub-zones' values on the DM panel (god view). **DB:** `soil_fertility: integer` and `wildlife_stock: integer` columns added to `sub_zones` table. `sub_zone_fertility_cap: integer` column added (default 100, modified by tech). Decay calculation runs server-side on each RESOLVE pass for every worked sub-zone. Recovery increment runs same pass for unworked sub-zones. **Teaching anchor:** The Dust Bowl, passenger pigeon, the Aral Sea — depletion side. The Nile flood cycle, Incan terracing, the Green Revolution — restoration and enhancement side. HEI is not just "humans damage the environment." It is *"humans damage, adapt, and sometimes improve."* The tech tree teaches both sides of that story. | Student-originated (Decision 87) |
| 88 | **Math Gate: DM-configurable math problem fires before any transaction confirms. Correct = full transaction. Wrong = reduced yield. Difficulty set per class.** | **What it is:** An optional mode Scott toggles from the DM panel — off by default, can be activated or deactivated at any point mid-game. When active, any transaction in the configured action types triggers a modal before the confirmation screen: a math problem the submitting student must answer before the action executes. **Action types Scott can enable it on (each toggled independently):** (1) Spot Trade Board purchases and offers. (2) Building purchases from the Architect's BUILD menu. (3) Territory expansion via EXPAND (Reach cost conversion). Scott can enable it for all three, one, or any combination — configurable per-class in game settings. **Correct answer:** transaction executes at full value. **Wrong answer:** transaction executes at reduced yield — the student miscalculated the exchange rate and paid or received less than intended. Exact penalty TBD during Phase 8 tuning (suggest: 15–20% reduction, not full cancellation — the transaction still happens, just less efficiently). **Difficulty is class-configurable** in the game settings panel — Scott sets it at game setup or can change it between epochs: 6th grade default = multiplication and division (integer math at game scale — "Your trade costs 40 Production ⚙️. You have 63. How much will you have left?"). 7/8 grade default = ratios and percentages ("You're trading 40 Production for 25 Reach. What percentage of your Production bank is that? Is this a fair rate?"). Scott can also write custom problem types — a free-text override field in settings. **UI:** The math modal slides in over the transaction confirmation screen. Problem displayed large and clear. Input field. Submit answer button. Timer optional (Scott can set a time limit per question or leave it open). If timed and student doesn't answer in time: transaction executes at reduced yield automatically (you hesitated, the merchant walked). **No retry:** one attempt per transaction. Wrong answer logged in Scott's DM panel alongside the transaction record — Scott can see exactly which student got which problem wrong without interrupting the game. Aggregate wrong-answer data visible in DM panel as a math performance summary across all teams: which problem types are tripping kids up, how often. Cross-curricular gold. **Teaching anchor:** math is not a worksheet. It is the thing that determines whether your trade is profitable. A 25% tariff isn't abstract when the wrong answer costs your civilization 10 Reach. Students who kept answering history questions with the number that rhymes with heaven will now face arithmetic consequences for it. | Student-originated (Decision 88) |
| 89 | **Civilization flag: both physical upload AND in-app SVG builder. DM-gated. Displayed on projector, Civilization Panel, map pin, and portfolio PDF. Lorekeeper owns it.** | **Two creation methods, both available, student's choice:** (1) **Physical upload** — student draws the flag on paper (at home, in class, whenever). The Lorekeeper photographs or scans it and uploads via the Lorekeeper dashboard. Standard image file (JPG/PNG), stored in Supabase Storage. Zero extra UI beyond a file input. Maximum creative freedom — markers, watercolors, anything. Physical art that becomes digital. (2) **In-app SVG flag builder** — a simple constrained canvas embedded in the Lorekeeper dashboard. Five controls: background color, shape overlay (stripe, cross, chevron, star, circle, crescent), foreground color, optional text/symbol, preview. Not a full design tool. Outputs a clean, legible SVG stored alongside the upload option. **Both methods feed the same display system.** Flag appears: Civilization Panel header, projector roster screen (all team flags visible during class overview), portfolio export PDF (flag on civilization title page), and as a small flag pin on the team's home sub-zone on the Leaflet map. **DM gate:** nothing goes live until Scott approves from the DM panel. One click. Inappropriate flags (it will happen exactly once) are blocked before anyone else sees them. **Lorekeeper is flag-keeper:** upload and build interface lives only in the Lorekeeper dashboard. The flag is a cultural artifact. That is the Lorekeeper's domain. **No mechanical effect.** Pure identity. But a student who drew their flag at home and sees it on the projector that morning has a different relationship to their civilization than one who didn't. That's the whole point. **DB:** `civilization_flags` (team_id, file_url, flag_type: 'upload'|'svg', dm_approved: boolean, approved_at: timestamp, created_by_student_id). | Student-originated (Decision 89) |
| 90 | **Landmark founding bonus: first building in a sub-zone triggers a one-time modal — name the settlement, choose a founding claim. First Settler decays at a random rate (1–4 epochs, rolled on founding).** | **Trigger:** When a team places their first building in any sub-zone, a one-time modal fires before the action confirms: the student names the settlement AND chooses one founding claim. No take-backs. **Three founding claims:** (1) **First Settler** — small yield bonus to that sub-zone (Food 🌾 +10% or Production ⚙️ +10%, based on terrain type). Decay duration is rolled at founding: 1, 2, 3, or 4 epochs (equal probability). The student does NOT see how long it lasts — just that it's temporary. Historically true: Jamestown faded. Plymouth endured. Constantinople lasted a thousand years. Nobody knew on founding day. When it expires, a brief event popup fires: *"The early-settler advantage in [settlement name] has faded. The land is what your people make of it now."* (2) **Resource Hub** — modest permanent bonus (+15%) to the sub-zone's dominant terrain resource type (Food on plains/river, Production on mountain/forest, Reach on coastal). Named on the sub-zone tooltip: *"[Settlement name] — Resource Hub."* This is Constantinople, Venice: geography as economic engine. (3) **Natural Landmark** — permanent +2 Legacy 📜 per RESOLVE from that sub-zone. Generates a named flag marker on the Leaflet projector map, visible to all teams. Named on the map itself. This is Alexandria, Mecca, Jerusalem: places that mattered because everyone agreed they mattered. **Settlement name:** free text, student-entered, max 32 characters. Persists on the Leaflet map as a sub-zone label for the rest of the game. Portfolio export includes the settlement name, founding claim, and epoch of founding. **DB:** `founding_claim: 'first_settler' | 'resource_hub' | 'natural_landmark'`, `settlement_name: text`, `founding_epoch: integer`, `first_settler_decay_epochs: integer` (null if not First Settler — rolled 1–4 at insert), `founding_bonus_active: boolean` — all added to `sub_zones` table. Decay check runs server-side each RESOLVE: if `current_epoch >= founding_epoch + first_settler_decay_epochs`, set `founding_bonus_active = false` and fire the expiry popup. | Student-originated (Decision 90) |
| 91 | **Civilization Codex: Lorekeeper portfolio artifact unlocked at Writing tech. Language name, deity/belief, founding law. +5 Legacy one-time. Gated behind Writing (Tier 1).** | **Unlock gate:** Writing tech (Tier 1, already in tech tree). When researched, a new tab appears in the Lorekeeper dashboard: **Civilization Codex**. Three fields, all free text, all optional but encouraged: (1) **Language name** — what does your civilization call its own tongue? Can be an invented word, a real language family, anything. Max 40 characters. (2) **Deity or core belief** — one sentence. Not a mythology creature (those are separate). This is the underlying belief system. Sun worshippers. Ancestor venerators. Merchant faith. (3) **Founding law or principle** — one sentence. The rule your civ lives by. This is the Diplomat's domain made permanent: what did your civilization decide at the very beginning? **Completion reward:** +5 Legacy 📜 as a one-time bonus, fires on the RESOLVE pass after the Codex is submitted. **Portfolio display:** Codex entries appear as a dedicated page in the portfolio PDF export, directly after the civilization name/flag page and before the mythology creatures. Displayed in the Cultural Gallery on the projector view alongside mythology artifacts. **No mechanical modifiers beyond the one-time Legacy bonus.** Pure identity artifact. This is the record-keeping moment — the clay tablet, the papyrus scroll. Students are creating the thing archaeologists dig up. **DB:** `civilization_codex` table (team_id, language_name: text, deity_belief: text, founding_law: text, completed: boolean, completed_epoch: integer, legacy_bonus_paid: boolean). Created at game setup, empty until Writing is researched and Lorekeeper fills it in. | Student-originated (Decision 91) |
| 92 | **Piracy events appended to d20 deck: two coastal-only negative events that fire when a team has active sea-route Trade Agreements. Appends to Decision 33.** | **Two new event entries in the d20 deck, conditional on the team having at least one active Trade Agreement routed through a coastal or ocean sub-zone:** (1) **Piracy** (moderate negative — fires on d20 roll 14–16 when coastal condition is true): *"Raiders have seized your trade caravan in the open water. Lose 15% of your Reach bank."* Reach deducted immediately on RESOLVE. Trade Agreement remains active — this is a hit, not a shutdown. (2) **Pirate Fleet Blockade** (severe negative — fires on d20 roll 19–20 when coastal condition is true): *"A pirate fleet has blockaded your coastal trade route. All active Trade Agreements via sea routes are suspended for 1 epoch."* Sea-route Agreements resume automatically the following epoch unless a second Blockade fires. **Condition check:** at event generation, the server checks `trade_agreements` for the affected team — if zero sea-route agreements exist, these two entries are excluded from that epoch's roll pool for that team (no false piracy events for landlocked civs). **Counter-mechanic (v1 note):** Sailing tech (Tier 1) and Naval Warfare (Tier 3) already in the tree — DM can narrate that advanced naval techs confer piracy resistance as a flavor justification even without a hard mechanical modifier in v1. Hard piracy resistance modifier can be a v2 upgrade. **Teaching anchor:** Barbary pirates, the Hanseatic League, the British East India Company's security budget — the cost of maritime trade is always partly security. A student whose coastal Trade Agreement just got blockaded now understands why the Mediterranean city-states built war galleys. **DB:** two new rows in the `d20_events` table — `event_type: 'piracy'`, `coastal_only: true`, `severity: 'moderate'|'severe'`. Event generation query already filters by terrain conditions for other events; same pattern applies here. | Student-originated (Decision 92, appends to Decision 33) |
| 93 | **Festival event: DEFINE round sub-option unlocked at Drama & Poetry (Tier 3). Costs 10 Legacy. Grants +8 CI + +5% yield bonus next epoch only. 3-epoch cooldown. Lorekeeper or Diplomat, DM chooses.** | **Unlock gate:** Drama & Poetry tech (Tier 3, already in tech tree). When researched, a new sub-option appears in the DEFINE round action menu: **Hold a Festival**. **Cost:** 10 Legacy 📜, deducted immediately on RESOLVE. **Effects:** (1) +8 CI to the holding civilization, applied this epoch. CI already generates from mythology creatures (Decision 67) and Codex completion (Decision 91) — Festival is a one-time spike, not a steady drip. The 10 Legacy cost and 3-epoch cooldown kill the exploit path. (2) Population happiness modifier: +5% yield bonus to ALL that civilization's active sub-zones for the following epoch only. Expires automatically. One epoch of bounty, then back to baseline. Not cumulative with other yield modifiers — it's additive on top of base yield, not multiplicative. **Projector effect:** a brief announcement card fires at RESOLVE: *"The [Civilization Name] holds a Great Festival — people from [home sub-zone] gather in celebration."* All teams see it. The room feels it. Historically accurate: the Olympics suspended warfare. The Games were social infrastructure. **Cooldown:** 3 epochs minimum between Festivals. Enforced server-side. `last_festival_epoch` column on the team record; if `current_epoch < last_festival_epoch + 3`, the sub-option is grayed out and shows countdown. **Role assignment:** default is Lorekeeper (festival = cultural act). DM can reassign it to Diplomat in game settings if the class dynamic calls for it. Both can't hold one simultaneously — one flag per team per cooldown window. **Teaching anchor:** The Olympics. Aztec ballcourt. Roman bread and circuses. Gladiatorial games. The Hajj. Every civilization found a way to gather its people in shared spectacle. The Festival mechanic teaches that entertainment is not frivolous — it is the social technology that prevents civilizations from fragmenting under pressure. A civ that invests in culture holds together longer. **DB:** `last_festival_epoch: integer` (nullable) on `teams` table. Festival action creates a standard DEFINE round submission with `action_type: 'festival'`. RESOLVE handler checks cooldown, deducts Legacy, applies CI delta and next-epoch yield modifier. | Student-originated (Decision 93, extends Decision 62 Drama & Poetry tech) |
| 94 | **6-week / 30-epoch arc locked as canonical game length. All balance calibrated to this arc.** | Scott confirmed the game runs 6 full weeks post-spring-break, not 3. One epoch = one ~47-min class period (Decision E2). 30 epochs = 30 class days = 6 weeks at 5 days/week. Balance calibrated: bank decay (Decision 38) = 5%/epoch (0.95^30 ≈ 21% bank survival — survivable); farm food generation (Decision 43) = 5 food/epoch per Farm (breakeven at pop 5 with 1 farm, growth possible at 2 farms). Tech tree pacing: Tier 3 reachable ~epoch 15 (week 3), Tier 4–5 by epoch 25–30 (Decision 62). Simulation default (simulate.ts `--epochs`) is 30. Stale "3-week arc" references in Decisions 8, 85 OQ10, and the Session Log are superseded by this entry. |
| 95 | **Team size standard: 3 students per team. 6th = 5 teams of 3. 7/8 = 6 teams (4×3 + 2×4). Dormant roles handled by DM absent-coverage mechanic.** | Teams of 5 were too large — with only 5 roles, accountability gets diluted and students coast. Teams of 3 are the minimum viable unit: everyone is accountable, every role is visible, nobody hides. **6th grade (15 students): 5 teams of 3.** Students split evenly from the original 3-team structure. Each team of 3 starts with Architect, Merchant, and Diplomat active; Lorekeeper and Warlord are dormant. **7/8th grade (20 students): 6 teams — 4 teams of 3 + 2 teams of 4.** With 4 students, Architect/Merchant/Diplomat/Lorekeeper are active; Warlord is dormant initially. **Dormant role coverage:** each epoch, Scott assigns the dormant role to a present teammate via the DM panel (same absent-coverage mechanic already built in `epoch_role_assignments`). Rotation is unaffected (Decision 18 + R-NEW1): all 5 roles cycle through every student regardless of initial dormancy. By Epoch 3 every student on every team will have held a different role. Why this matters strategically: on a 3-person team with a dormant Warlord, DEFEND is uncovered Epoch 1. Scott assigns cover from DM panel. That coverage decision is itself a teaching moment — who do you trust to defend when your Warlord is away? Supersedes the 3–5 range in Decision 6; 3 is now the standard, 4 is acceptable, 5 is retired. ✅ **IMPLEMENTED:** `scripts/setup-classes.ts` CLASSES array rewritten March 15, 2026. `scripts/007_reset_game_data.sql` created to clear old 3-team structure before re-seed. |
| 96 | **Each class plays the full global Risk-style map independently. No cross-class contact in v1. 11 of 12 regions occupied at game start.** | The original shared-map design (Decisions 2, 12, 53, 66) required cross-class architecture that added complexity without adding immediate classroom value. The simpler, more powerful design: each class has its own full-globe game. 6th grade's 5 teams start in 5 different regions spread across all continents. 7/8's 6 teams start in 6 different regions. Both classes see a world that already has civilizations in every direction from day one — this IS Risk. **6th grade game regions (5 teams):** Region 1 (Alaska + Western Canada), Region 3 (Mexico + Central America + Caribbean), Region 4 (South America), Region 8 (Sub-Saharan Africa), Region 10 (East Asia). **7/8 grade game regions (6 teams):** Region 2 (Eastern Canada + Eastern US), Region 5 (Western Europe + North Africa), Region 6 (Eastern Europe + Russia), Region 7 (Middle East + Central Asia), Region 9 (South Asia — Indian subcontinent), Region 12 (Pacific + Japan + Korea + Australia). **Region 11 (Southeast Asia):** unoccupied at start — NPC territory or fog of war, rich expansion target for adjacent civs. **Why both classes see the full globe:** no student is playing in a bubble. Alaska team knows Europe exists from day one. East Asia knows the Americas are there. Every team must decide: build at home first, or push outward? That tension IS the game. The Mongol Horde activates in Central Asia (Region 7) and threatens everyone. Rome activates in Western Europe (Region 5) and the Middle East (Region 7) team feels the pressure. Global spread makes every NPC and every other civ a relevant fact from the first session. **Cross-class contact:** removed from v1. Each game produces its own winner (1st through 5th/6th within the class). The colonial contact mechanic (the original exciting idea from Decision 12) is preserved as a v2 feature — potentially the ClassCiv "expansion pack" when the platform grows to multi-school matchups. Supersedes Decisions 2, 12, 53, 66. ✅ **IMPLEMENTED:** `scripts/setup-classes.ts` and `scripts/007_reset_game_data.sql` updated March 15, 2026. |
---

## TECH TREE REFERENCE — CLASSCIV
*Research currency: Legacy 📜 (DEFINE round). One active research project per epoch. Hard prerequisite gates.*

### TIER 1 — Ancient Foundations (~35 Legacy each, Epoch 1 available)
| Tech | Prerequisite | Unlocks | Curriculum Hook |
|------|-------------|---------|----------------|
| Animal Husbandry | — | Granary buildable, Cart unit, Pasture tile improvement | Neolithic Revolution |
| Pottery | — | Food Stores cap ×2, food can be traded | Early sedentary civilization |
| Mining | — | Mountain sub-zones yield Production, ore resources activatable | Bronze Age economics |
| Sailing | — | Scout enters coastal sub-zones, Merchant sea routes open | Mediterranean, Polynesian, Pacific expansion |
| Writing | — | Library buildable, written justification earns +25% yield bonus | Mesopotamia, Egypt |

### TIER 2 — Early Civilization (~60 Legacy, requires 2× Tier 1)
| Tech | Prerequisite | Unlocks | Curriculum Hook |
|------|-------------|---------|----------------|
| The Wheel | Animal Husbandry | Roads (Reach cost −25%), Caravan unit | Mesopotamia, Bronze Age transport |
| Bronze Working | Mining | Swordsman unit, Walls cost −30% | Bronze Age warfare |
| Masonry | Mining | Wonder contributions cost −20% Production | Egypt, Pyramids, Stonehenge |
| Calendar | Animal Husbandry OR Pottery | Seasonal event preview 1 epoch ahead, one-time passive food bonus | Maya, Aztec, Mesopotamia |
| Currency | Writing | Market buildable, inter-team resource pricing | Lydian coins, Silk Road |
| Archery | Animal Husbandry | Archer unit (ranged DEFEND advantage) | Mongol, Scythian, English warfare |
| Celestial Navigation | Sailing | Deep ocean sub-zones accessible, extended contact range | Polynesian, Viking, European Age of Exploration |
| Irrigation | Sailing | Irrigate Sub-zone BUILD action (accelerated depletion recovery), coastal/river +10% Food permanently | Mesopotamian irrigation, Nile flood cycle (Decision 87) |

### TIER 3 — Classical Era (~90 Legacy, requires 2× Tier 2)
| Tech | Prerequisite | Unlocks | Curriculum Hook |
|------|-------------|---------|----------------|
| Iron Working | Bronze Working | Iron-tier units (+25% combat strength), Barracks upgrade | Iron Age, Rome, Zhou Dynasty |
| Construction | Masonry | Aqueduct buildable, Bridge (cross river sub-zones free) | Roman engineering |
| Mathematics | Currency OR Calendar | Catapult/Siege unit, all yields +10% base | Greek/Islamic Golden Age |
| Philosophy | Writing + Calendar | Government type choices unlock, Diplomat gets second de-escalation window | Athens, Confucius, Roman Republic |
| Drama & Poetry | Philosophy | Mythology creatures grant Legacy bonus, cultural influence to adjacent sub-zones | Greek theatre, oral tradition, bards |
| Horseback Riding | The Wheel | Cavalry unit (2× movement, high attack) | Mongols, Scythians, Arabian cavalry |
| Optics | Celestial Navigation | Lighthouse (Scout coastal reveal ×3), fog lifts faster in ocean sub-zones | Islamic scholars, European navigation |
| Trade Routes | Currency + The Wheel | Formal multi-epoch inter-team trade agreements, Merchant generates passive Reach | Silk Road, trans-Saharan trade |
| Terrace Farming | Irrigation + Masonry | Soil fertility cap raised to 120 (mountain/hill sub-zones only) | Incan terracing, Machu Picchu (Decision 87) |
| Crop Rotation | Irrigation + Animal Husbandry | Depletion decay capped at −2/epoch in sub-zones with Farm | Medieval agriculture, Dust Bowl prevention (Decision 87) |

### TIER 4 — Medieval Era (~120 Legacy, requires 3× Tier 3)
| Tech | Prerequisite | Unlocks | Curriculum Hook |
|------|-------------|---------|----------------|
| Steel | Iron Working | Steel-tier units (strongest), Castle building | Medieval Europe, Japanese katana |
| Engineering | Construction + Mathematics | Wonder construction −30%, damaged buildings repair instantly | Roman/Islamic engineering |
| Civil Service | Philosophy + Mathematics | Bureaucracy government form, second Diplomat active simultaneously | Tang China, Byzantine civil service |
| **Feudalism** | Horseback Riding + Civil Service | **VASSAL STATE mechanic unlocked** | Medieval Europe, Mongol Empire, feudal Japan |
| Guilds | Trade Routes + Currency | Merchant establishes permanent trade hub in sub-zone, passive Reach income | Medieval merchant guilds, Hanseatic League |
| Education | Philosophy + Drama & Poetry | University building (Legacy yield ×2 permanently) | Islamic Golden Age, medieval universities |
| Chivalry | Steel + Horseback Riding | Knight unit (strongest mobile), de-escalation cultural bonus | Medieval knighthood, Crusades |

### TIER 5 — Renaissance (~160 Legacy, requires 3× Tier 4)
| Tech | Prerequisite | Unlocks | Curriculum Hook |
|------|-------------|---------|----------------|
| Printing Press | Education | Laws spread passively to adjacent civs each epoch, Legacy ×1.5 | Gutenberg, Reformation, information spread |
| Gunpowder | Steel + Engineering | Musketeer unit (replaces Cavalry in power), Cannon (Walls bypass) | Ming Dynasty, Ottoman Empire, European colonization |
| Astronomy | Optics + Education | Full contact range with any civ on map, fog clears globally over time | Galileo, Copernicus, Islamic astronomy |
| Banking | Guilds | Banked resources stop decaying; +5% interest on bank each epoch | Medici, Amsterdam Exchange Bank |
| Diplomatic Corps | Civil Service + Trade Routes | Formal treaty enforcement by game engine, United Civilizations vote active | Congress of Vienna, League of Nations precursor |
| Scientific Method | Astronomy + Mathematics | All research costs −25%, Science mini-track unlocked | European Scientific Revolution |
| Scientific Agriculture | Printing Press + Philosophy | Soil fertility cap raised to 135 across all owned sub-zones | The Green Revolution (Decision 87) |

---

## ECONOMY ARCHITECTURE (Decisions 37–39)
*The full engine. How resources flow from round submission to the wonder bar or the purchase menu — every epoch, every round.*

---

### THE 4-RESOURCE MODEL

ClassCiv has exactly 4 resources. One per round. Each is earned ONLY by doing that round well.

| Round | Resource Generated | Icon | What It Does |
|-------|------------------|------|-------------|
| **BUILD** | **Production** | ⚙️ | Builds permanent structures. Primary wonder fuel. |
| **EXPAND** | **Reach** | 🧭 | Unlocks territory, enables trade routes, moves units. |
| **DEFINE** | **Legacy** | 📜 | Strengthens laws, builds mythology lore, generates cultural influence. |
| **DEFEND** | **Resilience** | 🛡️ | Recruits military units, maintains supply lines, prevents raid losses. |

**No substituting.** You cannot use Production to get military units. You cannot use Reach to build a Library. Each resource is locked to its category. Neglect a round = that category starves.

---

### THE YIELD FORMULA

Every round, a team earns:

```
Yield = Base Yield × Justification Multiplier × d20 Modifier
```

| Variable | Value Range | Source |
|---------|------------|--------|
| **Base Yield** | 8–15 points (scales up with epoch progress) | Fixed per epoch, same for all teams |
| **Justification Multiplier** | 0.5× (weak) / 1.0× (standard) / 1.5× (strong) / 2.0× (exceptional) | Scott's judgment (or auto-scored in v2) |
| **d20 Modifier** | 0.5× (19–20) / 0.75× (11–18) / 1.0× (standard) / 1.25× (1–8) / 1.5× (9–10) | d20 event system if event fires in this round |

**Translation:** A team that writes excellent historical justification AND rolls well can earn 4× the base yield in a single round. A team that writes nothing AND rolls a 19 can earn 25% of base. The range is intentional — it mirrors the actual variability of history.

---

### THE ROUTING PANEL (Per-Round Decision)

After a round auto-resolves and yield is calculated, **before the next round begins**, the team sees:

```
┌─────────────────────────────────────────────┐
│  ROUND COMPLETE — BUILD                      │
│  You earned: 18 Production ⚙️               │
│                                              │
│  How do you allocate?                        │
│                                              │
│  [ SPEND NOW  ]  → Purchase Menu            │
│  [ CONTRIBUTE ]  → Wonder Track (+⚙️ bar)   │
│  [ BANK       ]  → Reserve (decays 10%/day) │
│                                              │
│  Split allowed: e.g., 10 CONTRIBUTE + 8 SPEND│
└─────────────────────────────────────────────┘
```

- **SPEND** opens the purchase menu immediately
- **CONTRIBUTE** adds directly to the wonder's matching track (Production → Construction Track)
- **BANK** stores in reserve — but banked resources decay 10% per epoch and can be stolen by specific d20 events
- **Splits are allowed** — teams can allocate any portion across all three buckets
- The routing decision is made by the **leading role for that round** (Architect routes Production; Merchant routes Reach; Diplomat routes Legacy; Warlord routes Resilience)

---

### THE WONDER PROGRESS BAR — 4 TRACKS

```
[WONDER: Stonehenge]  Progress: 57%

Construction Track  ⚙️  ████████████░░░░░░  65%  (Production)
Foundation Track    🧭  ██████░░░░░░░░░░░░  34%  (Reach)
Culture Track       📜  ████████████████░░  80%  (Legacy)
Fortification Track 🛡️  ██████░░░░░░░░░░░░  32%  (Resilience)

Overall completion = average of all 4 tracks
```

- **All 4 tracks must advance.** A team strong in BUILD/DEFINE but neglecting EXPAND/DEFEND will have a lopsided bar — visible on the projector for the whole class to see.
- **Minimum track threshold:** Wonder cannot complete unless all 4 tracks are above 50%. Teams can't tank one track and spam another.
- **Track visibility:** Students see their own wonder panel. Scott sees all teams' bars on the DM panel. The projector can show the full-class wonder progress leaderboard.

---

### THE PURCHASE MENU — 13 ITEMS, 3 CATEGORIES

**Cost is paid in the resource type matching the category** (Production for Buildings, Reach for Units, Resilience for Supplies).

#### BUILDINGS (Permanent — placed on map territory, visible as icons)

| Building | Resource Cost | Benefit | Can Be Lost By |
|----------|-------------|---------|---------------|
| **Farm** | 6 Production | +3 Food Stores per epoch automatically | Fire event (d20 19-20 in BUILD round) |
| **Granary** | 8 Production | Food Stores decay at half rate; famine threshold doubled | Cannot be destroyed — only depleted |
| **Barracks** | 10 Production | Soldiers cost 4 Resilience instead of 6 | Raid event (military attack destroys 1 building) |
| **Market** | 8 Production | Trade routes yield +50% more Reach | Cannot be destroyed — but can be blockaded |
| **Aqueduct** | 12 Production | Team immune to disease event losses | Drought event removes Aqueduct (must rebuild) |
| **Library** | 10 Production | Legacy yield +25% every epoch permanently | Cannot be destroyed |
| **Walls** | 14 Production | First military attack each epoch absorbed with zero loss | Siege event (d20 19-20 in DEFEND round) destroys Walls |

#### UNITS (Mobile — placed on map as SVG markers, can move, can be lost)

| Unit | Resource Cost | Function | Can Be Lost By |
|------|-------------|----------|---------------|
| **Scout** | 5 Reach | Reveals 3 fog-of-war tiles; required for certain Exploration events | d20 19-20 in EXPAND round: "Scout lost in the mountains" |
| **Soldier** | 6 Resilience | Defends territory; required for DEFEND round bonus | Raid event; contact war; d20 19-20 in DEFEND round |
| **Merchant** | 7 Reach | Required for active trade routes; generates Reach bonus each epoch | Raid event: caravan stolen |
| **Builder** | 8 Production | Reduces building Construction cost by 3 Production while deployed | Tools break event (loses Builder for 1 epoch) |

#### SUPPLIES (Consumable inventory — tracked as a count, depletes automatically or via events)

| Supply | Resource Cost | Function | Depletes When |
|--------|-------------|----------|---------------|
| **Food Stores** | 4 Production | Buffer against famine; required for population survival long-term | Drought event / each epoch tick if no Farm / siege |
| **Medicine** | 5 Resilience | Buffer against disease; prevents population loss in plague events | Disease event (uses 1–3 stock) / plague (uses all) |
| **Repair Tools** | 4 Production | Required to repair damaged/destroyed buildings | Used when building is rebuilt; d20 19-20 in BUILD consumes 1 |

---

### THE DEGRADATION TABLE — What Can Break, Be Stolen, or Be Lost

| Asset | Triggering Event | Consequence |
|-------|----------------|-------------|
| Farm | Fire (BUILD round d20 19-20) | Farm destroyed — must rebuild |
| Walls | Siege (DEFEND round d20 19-20) | Walls destroyed — territory exposed |
| Barracks | Raid event (military contact) | Barracks destroyed — soldiers cost full rate again |
| Aqueduct | Drought event (d20 specific roll) | Aqueduct gone — disease immunity lost until rebuilt |
| Scout | d20 19-20 in EXPAND round | "Scout lost" — tile reveals stop, must recruit new one |
| Soldier | Raid / contact war / d20 19-20 DEFEND | Soldier unit removed from map |
| Merchant | Raid event / caravan stolen event | Merchant unit lost — trade route breaks until replaced |
| Food Stores | Drought, siege, epoch decay without Farm | Count decrements — zero Food Stores = famine event triggers |
| Medicine | Disease / plague events | Count decrements — zero = full population loss event |
| Repair Tools | Building rebuild / d20 BUILD negative | Count decrements |
| Banked resources | Stolen caravan event / any raid event | 1d6 banked resources removed |

**The floor rule:** No single event can remove more than one category of assets simultaneously. A famine can wipe Food Stores but cannot also destroy the Farm AND kill a Soldier in the same event. Scott can chain events manually — but the d20 system fires one thing at a time. Teams always have a path back.

---

### DB SCHEMA IMPLICATIONS (Resources Layer)

```typescript
// resources table — one row per team per epoch
type TeamResources = {
  team_id: string
  epoch: number
  // Resources generated this epoch (before routing)
  production_earned: number    // BUILD yield
  reach_earned: number         // EXPAND yield
  legacy_earned: number        // DEFINE yield
  resilience_earned: number    // DEFEND yield
  // Routed this epoch
  production_spent: number
  production_contributed: number
  production_banked: number
  // ... mirror for all 4 resources
  // Running bank totals (carry forward)
  production_bank: number
  reach_bank: number
  legacy_bank: number
  resilience_bank: number
}

// wonder_progress table
type WonderProgress = {
  team_id: string
  wonder_id: number
  construction_track: number   // Production contributions
  foundation_track: number     // Reach contributions
  culture_track: number        // Legacy contributions
  fortification_track: number  // Resilience contributions
  completed: boolean
  bonus_active: boolean
  completion_epoch: number | null
}

// assets table — buildings, units, supplies
type TeamAsset = {
  team_id: string
  asset_type: 'building' | 'unit' | 'supply'
  asset_name: string  // 'farm' | 'soldier' | 'medicine' etc.
  quantity: number
  tile_id: string | null  // for placed buildings and units
  epoch_acquired: number
  is_damaged: boolean
}
```

---

## GUI/UX ARCHITECTURE — LEAFLET + REACT OVERLAY
*Addressing the anxiety directly: what Leaflet can do, what it can't, and where the real game UI lives.*

---

### The Honest Map Assessment

Leaflet is a **mapping library**, not a game engine. This is good news, not bad news.

**What Leaflet does brilliantly:**
- Real Earth geography as the permanent backdrop — students see the world they know
- Territory overlays: colored polygon per team (flood fills their claimed tiles)
- Fog of war: dark semi-transparent overlay on unexplored tiles that lifts as scouts advance
- Custom markers: building icons, unit icons (SVG or PNG), wonder construction indicators
- Click handlers: clicking a territory, building, or unit triggers a React panel to open
- Tile zoom: students can zoom to their territory for detail, zoom out for world view
- Kaiju animation layer: CSS/canvas element positioned absolute over the Leaflet map

**What Leaflet does NOT do (and we don't need it to):**
- Smooth unit movement animation (we use marker-position-update via Supabase Realtime — marker disappears from tile A, appears on tile B — instant, clean, readable)
- Battle animations (those live in full-screen modal overlays, not on the map)
- Complex sprites (unit markers are simple iconic SVGs — a shield for Soldier, a compass for Scout, a coin for Merchant)

---

### The Architecture: Map = Backdrop, React = Everything Else

```
┌──────────────────────────────────────────────────────────┐
│  LEAFLET MAP (background layer)                           │
│  • Real Earth tiles                                       │
│  • Team territory overlays (colored regions)              │
│  • Fog of war (dark tiles, lifts as scouts explore)       │
│  • Building markers (Farm 🌾, Barracks ⚔️, Market 🏪, etc.)│
│  • Unit markers (Scout 🧭, Soldier 🛡️, Merchant 💰)       │
│  • Wonder construction site marker (animated progress)    │
│  • Kaiju animation (CSS layer, fires on top)              │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │  REACT OVERLAY (the actual game UI)               │    │
│  │                                                   │    │
│  │  Top bar: Epoch counter / Round status / Timer    │    │
│  │  Right panel: Resource bars (4 resources)         │    │
│  │  Bottom bar: Role indicator / Submit button       │    │
│  │                                                   │    │
│  │  [Triggered panels — open on click/event:]        │    │
│  │  • Civilization Panel (city manager)              │    │
│  │  • Purchase Menu (buildings/units/supplies)       │    │
│  │  • Routing Panel (Spend/Contribute/Bank)          │    │
│  │  • Wonder Progress Panel (4-track bar)            │    │
│  │  • Round Submission Form (role question + text)   │    │
│  │  • d20 Event Popup (full-screen modal)            │    │
│  │  • Kaiju Attack (full-screen modal)               │    │
│  │  • Wonder Completion (full-screen eruption)       │    │
│  │  • Daily Recap Card (login screen)                │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

---

### The Civilization Panel — The City Manager

When a student **clicks their territory on the Leaflet map**, a slide-in panel opens on the right side (like Civ VI's city panel). It shows everything about their civilization:

```
┌─────────────────────────────────────────┐
│  🏛️ CIVILIZATION PANEL                  │
│  Team: The Copper River Confederacy      │
│  Epoch 6 of 15  |  Round: BUILD         │
├─────────────────────────────────────────┤
│  RESOURCES THIS EPOCH                   │
│  Production ⚙️   ████████░░  18 pts     │
│  Reach      🧭   ██████░░░░  12 pts     │
│  Legacy     📜   ████████████ 22 pts    │
│  Resilience 🛡️   ████░░░░░░   8 pts     │
├─────────────────────────────────────────┤
│  WONDER: Stonehenge  [57% complete]      │
│  [VIEW WONDER DETAILS →]                 │
├─────────────────────────────────────────┤
│  BUILDINGS  (click any to see details)   │
│  🌾 Farm  🏪 Market  📚 Library          │
├─────────────────────────────────────────┤
│  UNITS  (click to see location on map)   │
│  🧭 Scout (×2)  🛡️ Soldier (×3)         │
├─────────────────────────────────────────┤
│  SUPPLIES                               │
│  Food Stores: 14  Medicine: 6  Tools: 3  │
└─────────────────────────────────────────┘
```

Clicking a **building icon** shows a tooltip: what it does, when it was built, current status (damaged/intact).
Clicking a **unit** flies the map to that unit's current tile.
This is the Civ city manager Scott asked for — zero game engine required, pure React panel over Leaflet map.

---

### Unit Markers on the Leaflet Map

Each unit is a custom SVG marker pinned to a tile:

| Unit | Marker | Color | Notes |
|------|--------|-------|-------|
| Scout | 🧭 compass rose icon | Team color | Moves tiles when EXPAND round used |
| Soldier | ⚔️ shield icon | Team color | Multiple soldiers = number badge on marker |
| Merchant | 💰 coin/scale icon | Team color | Appears on trade route with animated line |
| Builder | 🔨 hammer icon | Team color | Appears on active construction tile |

Unit **movement** = Supabase Realtime update → marker position changes. No animation needed. A soldier moving from tile A to tile B: tile A marker disappears, tile B marker appears. Clean. Fast. Readable at any zoom level.

---

### The Modal Overlays — The Loud Moments

The dramatic game moments don't happen on the map. They take over the whole screen:

| Moment | Overlay Type | Description |
|--------|-------------|-------------|
| d20 Event fires | Full-screen modal | 3D die roll animation, result number, event card with narrative text |
| Kaiju attack | Full-screen modal | 5–8 second CSS/canvas animation, then game resumes exactly as it was |
| Wonder completes | Full-screen eruption | Projector moment — dramatic animation, bonus activates, class-wide notification |
| Contact event | Full-screen announcement | A ship appears on the horizon. The world changes. |
| Daily recap | Full-screen login card | Yesterday's story before any game UI loads |

**None of these require a game engine.** They're React components with CSS animations, triggered by Supabase Realtime database events.

---

### Projector View vs. Student View

Two different React components, both reading from the same Supabase game state:

**Student MacBook:** Role-specific dashboard + their civilization panel + submission form for their role
**Projector (Scott's display):** God-view map (all fog removed) + all teams' resource bars + wonder progress leaderboard + epoch log + DM controls

Scott's laptop: Supabase dashboard as DM panel (or a custom teacher-only URL). The projector shows the teacher's display, not the student display. Two-monitor mode is the target setup.

---

## THE 12 REGIONS (Risk-Style World Split)

*6th grade spawns in regions 1–5 (Americas). 7/8 grade spawns in regions 6–12 (Old World). Contact between hemispheres is teacher-controlled until the colonization event.*

| # | Region | Hemisphere | Curriculum Hook |
|---|--------|-----------|----------------|
| 1 | Alaska + Western Canada | Americas (6th) | Home territory. These kids know this land. |
| 2 | Eastern Canada + Eastern US | Americas (6th) | Atlantic coast — future colonial contact zone |
| 3 | Western US + Mexico + Central America | Americas (6th) | Aztec, Maya — already studied |
| 4 | Caribbean + Northern South America | Americas (6th) | Olmec, Amazon, Columbus contact point |
| 5 | Southern South America | Americas (6th) | Inca, Andes — already studied |
| 6 | Western Europe + Mediterranean | Old World (7/8) | Greece, Rome, mythology unit |
| 7 | Northern Europe + British Isles | Old World (7/8) | Beowulf, Vikings |
| 8 | North Africa + Middle East | Old World (7/8) | Egypt, Nile, Mesopotamia |
| 9 | Sub-Saharan Africa | Old World (7/8) | 50 facts Africa unit |
| 10 | Russia + Caucasus + Central Asia | Old World (7/8) | Caucasus unit + Mongols/Khans |
| 11 | South Asia + East Asia | Old World (7/8) | India, Himalayas, Tibet, China — just finished |
| 12 | Pacific + Japan + Korea + Australia + NZ | Old World (7/8) | **The frontier. Fog of war. Pre-teaches what's next in the curriculum.** |

*Note: Region 12 is geographically larger than others — may split into 12a (Japan/Korea) and 12b (Pacific/Australia/NZ) if 13 teams needed.*

---

## STUDENT IDEAS — PENDING DISCUSSION (Items A–H)

*Source: student-ideas-analysis.md, Part 5 — "What to do RIGHT NOW." These 8 features were independently proposed by students across all three classes and filtered through the 5 Themes of Geography. Each one has a Decision number candidate. None are locked yet. We go through them one at a time.*

*Format: read the item, discuss, lock or park. No sprinting.*

---

### ITEM A — Overfarming / Overhunting Resource Depletion ✅ LOCKED — Decision 87
**Decision candidate:** Decision 87
**Geography theme:** Human-Environment Interaction
**Build phase:** Phase 9 (resource engine)
**Effort:** Medium — 2 new DB columns (`wildlife_stock`, `soil_fertility` on `sub_zones`) + event trigger

**What it is:** Each sub-zone holds a fertility/stock value (0–100). Working the sub-zone each epoch ticks it down slightly. At 30%: yield modifier kicks in (−25% Food or Production from that sub-zone). At 10%: sub-zone generates a depletion event and a color shift on the map (green → yellow → brown). Recovery: leave it unworked for 2–3 epochs. Domesticated land recovers slower than wild. This is the Dust Bowl, the passenger pigeon, the Aral Sea — in mechanic form.

**What it teaches:** HEI. Humans modify the environment; the environment responds. Oregon Trail stakes: the team that overworks their best farmland watches their food supply collapse in the middle of a war. The mechanic teaches it. Scott doesn't have to lecture it.

**Locked.** V1 resource engine, Phase 9. Tech-gated recovery and above-baseline yield enhancement included (Irrigation → Terrace Farming → Crop Rotation → Scientific Agriculture). See Decision 87.

---

### ITEM B — Math Gate (DM-Configurable) ✅ LOCKED — Decision 88
**Decision candidate:** Decision 88
**Geography theme:** Movement / Economics
**Build phase:** Phase 8 (decision submissions)
**Effort:** Low — modal wrapper on transaction confirmation screen

**What it is:** An optional mode Scott can toggle from the DM panel. When active on a specific action type (purchase, trade, territory expansion), a math problem fires before the transaction confirms. Correct answer = full transaction. Wrong answer = reduced yield (you miscalculated the exchange rate). Difficulty is class-configurable: 6th grade = multiplication tables; 7/8 = ratios and percentages. Example: "Your Merchant wants to trade 40 Production for 25 Reach. Is that a fair exchange rate? What percentage are you giving up?" Wrong = you gave up 10% more than you thought.

**What it teaches:** Every subject. But specifically: math is not a worksheet. It is the thing that determines whether your civilization survives. Also: what IS a 25% tariff? Students find out by losing resources when they get it wrong.

**The Scott note:** Multiple students independently submitted "make us do math to buy things." This is the only item on this list that was requested by students in a cross-curricular context unprompted. And you are a math teacher who cannot say the word "six" without the entire room droning. This mechanic makes math load-bearing in a game they care about. That is not nothing.

**Locked.** V1, Phase 8 (decision submissions). Applies to Spot Trade, building purchases, and EXPAND — each toggled independently from DM panel. Wrong answer = reduced yield, not cancellation. Difficulty configurable per class. See Decision 88.

---

### ITEM C — Customizable Civilization Flag ✅ LOCKED — Decision 89
**Decision candidate:** Decision 89
**Geography theme:** Place (human characteristics)
**Build phase:** Phase 7 (portfolio / civilization identity)
**Effort:** Low — file upload field + simple 5-control SVG builder in Lorekeeper dashboard

**What it is:** During civilization setup (Day 1, after the draft), each team can upload or draw a flag for their civilization. DM-gated before it goes live anywhere in the system. Displayed in the Civilization Panel, on the projector roster screen, and in the portfolio export PDF. No mechanical effect — pure cosmetic identity. Students drew 86 game ideas and multiple of them independently said "customizable flag." The Lorekeeper is the natural flag-keeper.

**What it teaches:** Place — human characteristics. Every civilization in history invented a symbol that said "this is us." Flags, totems, seals, banners. This is that.

**Locked.** Both physical upload AND in-app SVG builder — student's choice. DM-gated before display. Lorekeeper dashboard only. See Decision 89.

---

### ITEM D — Landmark Founding Bonus ✅ LOCKED — Decision 90
**Decision candidate:** Decision 90
**Geography theme:** Place (location + human characteristics)
**Build phase:** Phase 7 (civilization setup / first building placement)
**Effort:** Low — one-time choice modal at first building placement in a new sub-zone

**What it is:** When a team places their first building in a sub-zone (founding a settlement), they get a one-time modal: name their settlement AND choose one "founding claim":
- **First Settler** — small bonus to that sub-zone's yield that decays at a random rate (1–4 epochs, rolled on founding — early mover advantage, not permanent; historically true: some founding settlements flourished for generations, others faded in a season)
- **Resource Hub** — modest bonus tied to that sub-zone's terrain type resource
- **Natural Landmark** — permanent +Legacy bonus from that sub-zone, generates a named marker on the projector map

The named settlement appears as a label on the Leaflet map. Students are immediately doing what geographers do: explaining WHY a place became important.

**What it teaches:** Place. Why did Constantinople matter? Why Alexandria? Why did Chicago grow where it did? Location + resources + landmark = historical magnet. Students discover this by playing it before Scott explains it.

**Locked.** All three founding claims in. First Settler decays at a random rate (1–4 epochs, rolled on founding — student doesn't see the countdown). Resource Hub permanent terrain bonus. Natural Landmark permanent +Legacy + projector map pin. See Decision 90.

---

### ITEM E — Civilization Codex ✅ LOCKED — Decision 91
**Decision candidate:** Decision 91
**Geography theme:** Place (cultural characteristics)
**Build phase:** Phase 7 (portfolio)
**Effort:** Low — form fields in the Lorekeeper dashboard, stored as cultural artifact

**What it is:** At Writing tech unlock (Tier 1, already in the tech tree), the Lorekeeper gains access to the **Civilization Codex** — a structured portfolio artifact:
- Name their civilization's language (free text, even invented words)
- Name a deity or core belief
- Record one law or founding principle

Stored permanently in the team's portfolio, exported in the PDF, displayed in the Cultural Gallery. Generates a small Legacy bonus on completion (+5 Legacy, one-time). This is the same energy as the mythology creatures — creative, historical, portfolio-visible.

**What it teaches:** Language and religion are the defining human characteristics of place. Writing gave civilizations their record-keeping. The Codex IS that moment — students create the artifacts that archaeologists would one day find.

**Locked.** Civilization Codex: three fields (language name, deity/belief, founding law), gated at Writing tech (Tier 1), +5 Legacy one-time on completion, Lorekeeper dashboard only, portfolio PDF page. Its own decision — not folded into 77 or 89. See Decision 91.

---

### ITEM F — Piracy Event in d20 Event Deck ✅ LOCKED — Decision 92
**Decision candidate:** Decision 92 (appends to Decision 33)
**Geography theme:** Movement
**Build phase:** Phase 8 (event deck)
**Effort:** Low — 2 new event entries in the d20 deck, triggered only in coastal/ocean sub-zones

**What it is:** Two new d20 event entries that only fire if a team has active Trade Agreements using coastal or ocean sub-zone routes:
- **Piracy (moderate negative, d20 roll 14–16):** "Raiders have seized your trade caravan in the open water. Lose 15% of your Reach bank."
- **Pirate Fleet Spotted (severe negative, d20 roll 19–20 in coastal zones):** "A pirate fleet has blockaded your coastal trade route. All active Trade Agreements via sea routes suspended for 1 epoch."

Multiple students asked about this in Part 3 — it's already partially in the system (Caravan NPCs can be robbed). This formalizes it for ocean/coastal routes specifically and ties it to real geography: the Barbary pirates, the Hanseatic League's enemies, the British East India Company's security costs.

**Locked.** Two coastal-only d20 entries: Piracy (14–16, −15% Reach) and Pirate Fleet Blockade (19–20, sea-route Agreements suspended 1 epoch). Both conditional on active sea-route Trade Agreements — landlocked civs never roll them. See Decision 92, appends to Decision 33.

---

### ITEM G — Resource Refinement Made Visible in UI ✅ LOCKED — Decision 62 (UI addendum)
**Decision candidate:** Decision 62 (UI addendum)
**Geography theme:** Region + HEI
**Build phase:** Phase 9 (resource engine display)
**Effort:** Low — UI label/display change, no new data model required

**What it is:** The tech tree already gates unit upgrades (Bronze Working → Iron Working → Steel). This item makes that progression legible to students as explicit resource refinement: the Architect's BUILD screen shows a visible "smelting" step — *"You have iron ore in this sub-zone. Research Bronze Working to begin smelting it into usable metal. Current status: raw ore only."* The mechanic is already in the design — students just need to SEE it as a physical transformation chain: Mine ore → Use Production to refine → Unlock stronger units. More visible, more Oregon Trail supply screen energy.

**What it teaches:** Region + HEI — raw materials ≠ finished goods. Copper → Bronze → Iron → Steel is the tech tree of human civilization. Students who see the refinement step understand comparative advantage: the civilization that can PROCESS its ore is richer than the one that just digs it up.

**Locked.** UI display requirement anchored to Decision 62. Mining → Bronze Working → Iron Working → Steel must read as a visible refinement chain in the Architect BUILD panel. No new mechanics. No new decision number.

---

### ITEM H — Festival / Entertainment Event ✅ LOCKED — Decision 93
**Decision candidate:** Decision 93 (extends Decision 62 Drama & Poetry tech)
**Geography theme:** Place (cultural characteristics)
**Build phase:** Phase 9+ (post-core)
**Effort:** Medium — new DEFINE round sub-option, Cultural Influence bonus + population modifier

**What it is:** A new optional action available in the DEFINE round once Drama & Poetry tech (Tier 3) is researched. The Lorekeeper (or Diplomat, DM decides) can choose to **Hold a Festival** instead of standard DEFINE actions:
- Costs: 10 Legacy
- Grants: +8 CI immediately + a Population happiness modifier (+5% yield bonus for the following epoch only)
- Projector effect: a brief announcement card ("The [Civilization Name] holds a Great Festival — people from [sub-zone] gather in celebration")
- Can only be held once per 3 epochs (cooldown — you can't Festival your way to victory)

This is the Olympics, gladiatorial games, the Aztec ball court — entertainment and spectacle as social infrastructure, not frivolity. The student who submitted "theme song when you load in" and the ones who submitted "sports for activities" were both gesturing at this: culture is how civilizations hold together.

**Locked.** Festival: 10 Legacy cost, +8 CI + +5% yield bonus next epoch, 3-epoch cooldown, Drama & Poetry gate (Tier 3), Lorekeeper by default (DM-reassignable to Diplomat). Projector announcement fires on RESOLVE. See Decision 93.

---

*When a decision is made on any item, move it to the LOCKED DECISIONS table with the appropriate decision number and archive it from this section.*

---

## SESSION LOG

### Session 1 — March 2, 2026
- Project initiated: ClassCiv, Civilization × Oregon Trail hybrid anchor project for middle school
- Builder: Scott Somers | AI partner: The Brand Whisperer + Claude Sonnet/Opus 4.6
- Brainstorm method established: Scott leads, Brand Whisperer asks, we build together. No sprinting ahead.
- Folder created: `classroom-civ/`

**Curriculum context locked:**
- Year-long World Geography course. Currently finishing Asia (China/Khans). Spring break next.
- After break: Japan, Korea, Pacific, Australia — these are the FOG OF WAR zones in the game
- Project runs 6 weeks post spring break (~30 epochs). See Decision 94.
- 6th grade (~15 students) + 7/8 grade (~22 students, 15 min shorter period)

**Decisions locked this session:**
- Real Earth map (Leaflet)
- Two classes, one map — Americas (6th) + Old World (7/8)
- Up to 12 teams, 3–5 per team, MacBooks, touch + keyboard
- Persistent teams and game state across sessions
- Phase model: isolated → contact → diplomacy/war
- Contact trigger: Option C (teacher-fired OR earned through tech)
- Colonial contact event: teacher-controlled, fires when curriculum is ready
- Day 1: Kahoot-style blitz → snake draft → region selection
- Teams pre-formed by Scott, no best friends together
- Absent handling: AI fill / teammate absorbs / teacher plays
- 12 Risk-style regions defined
- Scott is DM of both classes with God view

**Blocked on:**
- U1: What does a team DO during one epoch? (core gameplay loop — nothing gets built until this is answered)

---

### Session 2 — March 11, 2026
- Full workspace audit completed (all 9 documents + entire codebase)
- Scott delivered two voice-transcribed brain dumps answering 20 design questions
- Decisions 95–103 locked (see below)
- Build sprint: sub-zone detail API + CityPanel + live map wiring

**Decisions locked this session:**

#### Decision 95 — Half-Epoch Per Class Day ✅ LOCKED (supersedes Decision 94)
Each class day = half an epoch.
- **Day 1:** LOGIN → BUILD → EXPAND
- **Day 2:** DEFINE → DEFEND → RESOLVE → EXIT
- **Run:** 30 class days over ~7 weeks = ~15 full epochs
- **Previous decision 94** (30 full epochs over 6 weeks) is superseded.

#### Decision 96 — Full Unit Movement on Map ✅ LOCKED
Scout, Soldier, Merchant, Builder are actual markers on the Leaflet map.
- Units receive move orders during the epoch; orders execute at next epoch resolution
- Civ I–style: explore → find spot → settle
- Unit types: Scout 🧭 Soldier 🛡️ Merchant 💰 Builder 🔨

#### Decision 97 — Pre-Generated Exit Ticket Question Bank ✅ LOCKED
Exit tickets = DOK3 questions, selected contextually by gameplay events.
- Written for below-grade-level 6th graders (3–5 sentences for 6th grade, 6–8 for 7/8)
- Questions exist in a bank; the game picks the relevant one based on what happened that epoch
- NOT AI-generated on the fly — curated bank, reviewed by Scott

#### Decision 98 — Three-Scale Zoom Model ✅ LOCKED
One continuous Leaflet zoom with three meaningful stops:
1. **World** — fog of war + colored regions, no detail
2. **Region** — sub-zones visible with terrain, resources, buildings
3. **City** — half-screen CityPanel opens on sub-zone click

#### Decision 99 — CityPanel = Half-Screen, Role-Specific ✅ LOCKED
City management panel opens below the map when a student clicks a sub-zone.
- Panel height ~50% of viewport; map shrinks to 300 px
- Role-specific sections: Architect sees build menu, Warlord sees military, etc.
- NOT a full-screen takeover — map stays visible above

#### Decision 100 — Geography = Decision-Making, Not Recall ✅ LOCKED
Math (multiplication, fractions, 6th-grade level) = toll booth on purchases/tech.
Geography = the road itself — embedded in place names, terrain visibility, organic decisions.
- Students see real sub-zone names ("Copper River Delta") and terrain emoji
- They internalize geography by deciding WHERE to build, settle, and expand
- No geography quiz questions; math questions gate resources and tech

#### Decision 101 — Depletion Rate Adjusted ✅ LOCKED
Soil fertility and wildlife stock tick down at **−3 to −5 per epoch** (balance TBD).
- Tech advances (irrigation, forestry) restore fertility
- Previous rate was deemed too aggressive; new rate is slower / more forgiving
- See Decision 87 for depletion mechanic origin

#### Decision 102 — Projector Default = Civilization Leaderboard ✅ LOCKED
The projector screen defaults to a **civilization standings board**, not the colored map.
- Shows: team name, population, resources, epoch rank
- DM can manually switch to map view during exploration phases
- Decision 82's map-on-projector behavior applies only when DM activates it

#### Decision 103 — Buildings Live in Specific Sub-Zones ✅ LOCKED
Buildings are placed in individual sub-zones, not abstracted team-wide.
- A Farm built in "Copper River Delta" appears as a 🌾 marker in that polygon
- City management is per-settlement (CityPanel shows buildings for that sub-zone only)
- Aligns with Decision 96 (units move on map) for a coherent spatial game layer

**Build shipped this session:**
- `GET /api/games/[id]/sub-zones` — 72 enriched sub-zones, ownership from teams table
- `CityPanel.tsx` — half-screen detail panel, terrain/resource bars, role hints, "Found Settlement" placeholder
- `StudentDashboardClient.tsx` — sub-zone fetch wired, map click opens CityPanel, map shrinks 500→300px
- Zero TypeScript errors, production build clean

**Unblocked:**
- U1 is fully answered: a team's epoch loop = explore map → click sub-zone → build/send units → submit resource routing → exit ticket

---

*Velocity Rule: The first playable version has a map, two teams, a teacher who can fire one event, and resources that change. Ship that. Then iterate.*

*Updated: March 11, 2026*

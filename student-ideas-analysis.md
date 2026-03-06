# STUDENT IDEAS ANALYSIS — ClassCiv
### 86 Students. One Brainstorm. Sorted.
> *Created: March 5, 2026 | Source: Student game idea submissions, all three classes*
> *Framework: The 5 Themes of Geography × ClassCiv game design priorities*

---

## THE LENS — Why the 5 Themes Matter Here

Every student idea gets evaluated against two questions:
1. **Does it teach something?** (Geography, History, Economics, Government, ELA)
2. **Does it make the game more real?** (consequential decisions, not fantasy noise)

The 5 Themes of Geography are the invisible skeleton of ClassCiv:

| Theme | What It Asks | Where It Lives in ClassCiv |
|-------|-------------|---------------------------|
| **Location** | Where is it? Does place on the map matter? | Sub-zones, regional sub-zones, fog of war |
| **Place** | What makes this place unique? | Regional bonus profiles, terrain types |
| **Human-Environment Interaction** | How do people change their environment — and how does it change them back? | Resource depletion, farming, building, disasters |
| **Movement** | How do people, goods, and ideas travel? | Trade routes, Merchant units, roads, ships |
| **Region** | What makes an area distinctive? | 12 macro-regions, terrain bonuses, climate |

---

## PART 1 — ALREADY IN THE GAME ✅

*These ideas are locked in ClassCiv design decisions. Students independently arrived at the same conclusions. That's validation.*

| Student Idea | What They Said | Already In ClassCiv | Decision |
|---|---|---|---|
| Different locations = different resources | "Different locations have different resources" | Regional terrain bonus profiles | Decision 60 |
| Different locations = different disasters | "Different locations have different disaster" | d20 event deck, terrain-specific events | Decision 33 |
| Build things that cost materials | "To build things that cost materials" | Full purchase menu, 13 items, 3 categories | Decision 39 |
| Starvation | "People can starve if their land doesn't provide" | Food/Population survival layer | Decision 41 |
| Plants need right climate | "Plant all have the right climate" / "You need fresh water to grow plants" | River Valley region bonus (+Food passively) | Decision 60 |
| Certain animals only in certain places | "Certain animals can only be in certain places" | Terrain-type yield modifiers per sub-zone | Decision 61 |
| Government types | "Different types of ruling of government" | Tech tree Tier 3+ (Philosophy → government unlock) | Decision 62 |
| Taxes / tribute | "The option to control taxes" / "Use the tax money to buy better stuff" | Vassal tribute auto-pull (20%), resource routing panel | Decisions 38, 63 |
| War weakens borders | "When you go to war your borders are weaker" | War Exhaustion — yields −15% to −30%, Resilience suppression | Decision 65 |
| A neutral market for everyone | "A place on the map not owned by anyone…market for everyone" | Spot Trade Board — open market, anonymous, any civ | Decision 69 |
| Trade routes | "Trade routes" / "The more you trade the faster the trading goes" | Trade Agreements (multi-epoch auto-executing), +5% yield bonus on shipped resource | Decision 69 |
| People die (disease, war) | "People die in the game (diseases, war, old age)" | Population drops from plague events, War Exhaustion, famine | Decisions 41, 65 |
| Culture boosts civilization | "Cultures can boast happiness" | Cultural Influence score, CI spread mechanic | Decision 67 |
| Surrendering in war | "If you get into a war you can have the option to surrender" | Diplomat de-escalation window in Battle Round | Decision 59 |
| Gift other teams | "You can gift another team to show you mean no threat" | Resource trades via Merchant, diplomatic exchanges via Diplomat | Decision 69 |
| Trade with other teams | "Trade with other teams" | Spot Trade Board + Trade Agreements | Decision 69 |
| Natural disasters | "Events once every 5 minutes like storms, earthquakes" | d20 random event system, one per class day | Decision 33 |
| Farming | "Farming" / "Growing plants for eating" | Farm building, passive food auto-yield | Decision 43 |
| Schools | "Schools" | Library → Education tech (Legacy ×2 permanently) | Decision 62 |
| Boats/ships | "Be able to deploy ships but you need port cities" | Sailing tech + Merchant sea routes + coastal sub-zones | Decision 62 |
| Roads | "You can create roads" | The Wheel tech → Roads (Reach cost −25%), Caravan unit | Decision 62 |
| Voting system | "Voting system" | Government type unlock (Philosophy tech) + Teacher World Congress | Decision 62 |
| Sicknesses / plagues | "Add sicknesses like dysentery, small pox, black plague, scurvy" | d20 event deck includes plague, disease, dysentery events | Decision 33 |
| Flags | "Customizable flags" / "Create your own flag" | Civilization naming already approved (DM-gated); flag = cosmetic add | Decision 76 |
| Laws | "Laws" / "Book of rules" | Diplomat leads DEFINE (laws), law creation panel | Decision 57 |
| Spying on other groups | "Spying on other groop" | Optics tech (fog reveal), private intel drops (Decision 50) | Decisions 50, 62 |
| Health bar / population metric | "Health bar" | Population count + Dark Ages status bar | Decisions 41, 75 |
| Messaging between teams | "We should be able to message each other" | Diplomat submission interface — all proposals go through Scott | Decision 70 |
| Caste system | "Cast system" | Government types unlocked via Philosophy tech | Decision 62 |
| Communism | "Communism" | Government types (Bureaucracy, etc.) — multiple forms unlocked by tech | Decision 62 |
| Canal / dam / dock | "Dams, docks, canales" | Aqueduct building; dock could be a v2 building addition | Decision 39 |
| Feeding citizens / using resources for needs | "Use your resources to sustain citizens' hunger" | Food/Population survival layer, Farm auto-yield | Decisions 41, 43 |
| Stars / astronomy | "Stars" | Astronomy tech (Tier 5) — fog clears globally | Decision 62 |

---

## PART 2 — STRONG NEW IDEAS: ADD THESE 🟢

*Not currently in ClassCiv. Strong educational fit. Mechanically achievable. Teach the 5 themes directly.*

---

### 🗺️ THEME: HUMAN-ENVIRONMENT INTERACTION

**IDEA: Overhunting / Overfarming Resource Depletion**
- Students said: *"If you overhunt animals they die out"* / *"If you overfarm an area it will lower the production rate"*
- **What it teaches:** HEI — the most powerful HEI concept in the standards. Humans modify the environment, and the environment responds. Agriculture, the Dust Bowl, the passenger pigeon. This is the engine of environmental history.
- **How to add:** Each sub-zone holds a `wildlife_stock` and `soil_fertility` value (0–100). Each EXPAND/BUILD round action in that sub-zone ticks the value down slightly. At 30%: yield modifier kicks in (−25% Food or Production from that sub-zone). At 10%: sub-zone generates a depletion event. Recovery: leave the sub-zone unworked for 2–3 epochs. Displayed on map as a subtle color shift (greening → yellowing → browning).
- **Decision number candidate:** Decision 87

**IDEA: Breed and Manage Livestock / Animal Domestication**
- Students said: *"Breed and capture animals"* / *"Cows, chickens, sheep, and pigs"* / *"Livestock management"* / *"Subsistence hunting"*
- **What it teaches:** HEI — the Neolithic Revolution was the domestication of animals. Hunting vs. herding is one of the defining pivots of human history. Food security vs. mobility tradeoff.
- **How to add:** Animal Husbandry tech (already in Tier 1) currently unlocks Granary + Cart. Expand it: Animal Husbandry also unlocks a Pasture building that generates passive Food AND a small Resilience bonus (draft animals for military). Teams in sub-zones with the right terrain can maintain Herds. Over-hunting wildlife depletes wild Herd potential (connects above). Domestication = the mechanic; Pasture = the building.
- **Decision number candidate:** Extends Decision 62 (tech tree) + Decision 87 above

---

### 🧭 THEME: MOVEMENT

**IDEA: Travel Takes Time / No Instant Movement**
- Students said: *"No instant travel"* / *"Over time transportation objects will brake and you need to fix them"* / *"Control carriage for traveling like Oregon Trail"*
- **What it teaches:** Movement — distance matters. The cost of moving goods and people IS geography. Roads, rivers, passes are shortcuts. Terrain is resistance.
- **How to add:** Already partially in — sub-zone expansion costs Reach. Formalize it: terrain type affects expansion cost modifier (plains cheap, mountains expensive, desert costly). Roads reduce it. Ships enable coastal movement that would otherwise be blocked. This is surfaced explicitly to students: *"Moving into the mountain sub-zone costs 18 Reach. A road would reduce that to 11."*
- **This is already partially locked (Decisions 38, 60, 61) but should be made more explicit in movement cost UI**

**IDEA: Math Games to Unlock Trade / Steal Resources**
- Students said: *"If we wanna buy something we do times tables"* / *"You can steal from other countries for answering math questions"* / *"We should add math into the games like division and addition"*
- **What it teaches:** Every subject — but specifically: Economics literacy. Resource conversion requires mathematical reasoning. This is embedded curriculum that doesn't feel like a worksheet.
- **How to add:** Optional DM-configurable mode: Scott can activate a "Math Gate" on any purchase or trade. When active, a multiplication/division/ratio problem appears before the transaction confirms. Correct = full transaction. Wrong = reduced yield (you miscalculated the exchange rate). Difficulty scales by grade (6th = multiplication tables; 7/8 = ratios and percentages — what IS a 25% tariff?). This is a genuine Scott-lever that ties directly to what he's teaching in math cross-curricular.
- **Decision number candidate:** Decision 88 — Math Gate mechanic

---

### 🏛️ THEME: PLACE

**IDEA: Landmark / City Fame Modifier**
- Students said: *"Your city can be popular because of: first area of settling, lots of a certain resource, and/or a certain landmark is there"*
- **What it teaches:** Place — human characteristics. Why did some cities become important? Constantinople, Alexandria, Venice weren't great by accident. Location + resources + landmark = historical magnet.
- **How to add:** When a team places their first building in a sub-zone (founding), they get a one-time flavor choice: name their settlement AND choose one "founding claim" (First Settler / Resource Hub / Natural Landmark). Each gives a small permanent bonus to that specific sub-zone's yield. Displayed on the map as a named marker. First Settler bonus decays over time (early mover advantage, not permanent) — historically accurate.
- **Decision number candidate:** Decision 89

**IDEA: Write Your Own Language / Civilization Identity**
- Students said: *"Write your own languages"* / *"Own language"* / *"Religion creation"*
- **What it teaches:** Place — cultural characteristics. Language and religion are the defining human characteristics of a place. Writing (the tech) gave civilizations record-keeping. Religion shaped laws, trade, conflict, and architecture.
- **How to add:** The Lorekeeper already builds mythology creatures and cultural artifacts. Expand the DEFINE round's mythology domain: at certain tech tiers, teams unlock a **Civilization Codex** — they can name their language, record a core belief, name a deity. This is a portfolio artifact (goes in the export PDF with their mythology creatures). It also generates a small Legacy bonus when completed. Connect to Writing tech (already in Tier 1).
- **This is a Lorekeeper portfolio expansion — extends Decision 77**

**IDEA: Music / Sports / Entertainment as Cultural Boosters**
- Students said: *"Sports for activities in your civilization and singing entertainment"* / *"The more sports you have people get strong"* / *"Theme song when you load in"*
- **What it teaches:** Place — cultural characteristics. Human civilizations universally developed entertainment, sport, and music. The Olympics, gladiatorial games, Aztec ballcourt — these weren't frivolous. They were social infrastructure.
- **How to add:** New DEFINE round option (not a full round, a sub-option): Teams in specific tech tiers can choose to hold a Festival event — costs Legacy, generates a CI bonus AND a Population happiness modifier (small yield boost next epoch). Drama & Poetry tech (already Tier 3) is the gate for this. The "theme music on load" is a UI feature — absolutely doable, each civ could get an ambient soundtrack tag.
- **Extends Drama & Poetry tech in Decision 62**

---

### ⚖️ THEME: REGION + HUMAN-ENVIRONMENT INTERACTION

**IDEA: Resource Refinement**
- Students said: *"The ability to refine resources"* / *"Ores like diamonds, iron, copper, emeralds, gold"*
- **What it teaches:** Region + HEI — raw materials ≠ finished goods. Refinement is how civilizations created comparative advantage. Copper → Bronze → Iron → Steel is literally the tech tree progression of human history.
- **How to add:** The tech tree already gates unit upgrades (Bronze Working → Iron Working → Steel). Formalize it as explicit resource refinement: Mining tech unlocks ore extraction. Bronze Working converts ore into refined material at a production cost. This is already the design — it just needs to be surfaced in the UI as a visible "refinery" mechanic so students see the progression: *Mine ore → Use Production to smelt → Unlock stronger units.* More visual, more Oregon Trail supply screen energy.
- **This is a UI clarification of existing Decision 62 tech tree — no new decision needed**

**IDEA: Survivors / Specialist NPCs from Specific Places**
- Students said: *"You can find survivors in your area that can help based on where they were from (e.g. if you find a sailor, they could help you with anything related to boats or trade through water)"*
- **What it teaches:** Movement + Place — people carry knowledge. A sailor from a coastal region knows things an inland farmer doesn't. This is the geographic logic of specialization and migration.
- **How to add:** The NPC Caravan already generates trade popups. Add a Survivor variant: certain d20 positive events (1–8 range) generate a Specialist Pickup — a named NPC with a bonus tied to their origin terrain. Coastal specialist = Merchant unit cost −2 Reach. Mountain specialist = mining yields +15% for 3 epochs. Steppe specialist = Cavalry unit unlocked one tier early. Stored in team assets, shown on the Civilization Panel. Students immediately understand: WHERE someone is from shapes WHAT they know.
- **Decision number candidate:** Decision 90 — Specialist NPC mechanic

---

### 🛡️ THEME: MOVEMENT + CONFLICT

**IDEA: Team Merge / Alliance Formation**
- Students said: *"The ability to merge clan/nations if close by"*
- **What it teaches:** Movement + Region — civilizations didn't just fight. They merged. The Roman confederation, the Iroquois Confederacy, the Holy Roman Empire. Political union as a survival strategy.
- **How to add:** Deep alliance already exists via Trade Agreements + the Vassal mechanic. Add a formal **Confederation** option available after 3 consecutive epochs of active Trade Agreements with the same team: both Diplomats can propose a Confederation. If both agree AND Scott approves: they share fog-of-war visibility, share resource surplus (auto-split each epoch), and defend as one in Battle Rounds. Each civ keeps its own name and portfolio. Confederation dissolves if war is declared against any member — all members respond. This is the Iroquois Confederacy in mechanic form.
- **Decision number candidate:** Decision 91 — Confederation mechanic

**IDEA: Non-War Duel / Single Challenge**
- Students said: *"Challenge a team to a duel but not a war"* / *"Give another team a truths"*
- **What it teaches:** Conflict resolution, diplomacy — sometimes civilizations resolved disputes without full war. Trial by combat. Olympic truce. Territorial negotiation.
- **How to add:** The Diplomat can issue a **Challenge** — a one-round mini-competition on a specific domain (BUILD vs. BUILD for one epoch, both teams submit their strongest justification, Scott rates both). Loser pays a small resource tribute; no territory changes. This is conflict without the Pyrrhic costs of war. Teaches: there are levels of conflict between full peace and full war.
- **Decision number candidate:** Decision 92 — Diplomatic Duel mechanic

---

## PART 3 — GOOD IDEAS, SKIP FOR V1 (NOTE FOR V2) 🟡

*These are real ideas with educational merit. They're too complex for a 4-week build window or a 3-week class run, but they're worth preserving.*

| Idea | Why It's Good | Why It's v2 | Geography Theme |
|------|--------------|------------|----------------|
| Coded / secret messages | Espionage = real geopolitical tool. Cold War, WWII cipher machines. | Adds a whole Spy role and mechanic layer. Too much for v1. | Movement of ideas |
| Individual stamina per person | Resource economy at the individual level, not just civilization level | Too granular — ClassCiv tracks civilizations, not individual pawns | HEI |
| Breed / genetically select plants | Green Revolution, Mendel, crop science | Extremely complex to model meaningfully | HEI |
| Name and build ships | Naval identity (Armada, Bismarck, HMS Victory) | Naming is cosmetic; ship mechanics are covered; individual ship tracking = too much state | Movement |
| Carriages / transportation unit | Oregon Trail energy — vehicles as key resources | Caravan unit already covers this conceptually; expanding would require significant new UI | Movement |
| Interrogation of prisoners | Intelligence gathering, Cold War, rules of war | Too dark for middle school without careful scaffolding. Prisoners of War as a mechanic = v2 with explicit curriculum framing | Conflict |
| Smuggling | Black markets, tariff evasion, colonial era trade | Interesting! Would require a hidden trade lane mechanic. Complex. | Movement |
| Day/night cycle affecting events | Circadian reality of farming, raiding, travel | Visual feature only in a web app. Could affect d20 event flavor text easily. | Place |
| Assassins (reframed as Spy unit) | Intelligence = a real domain of statecraft | A whole Espionage sub-system belongs in v2 if this becomes a product | Movement |
| Cooking / food processing | Agriculture → cuisine → culture → trade | Would be a DEFINE round sub-mechanic; worth exploring as a Lorekeeper artifact | HEI |
| Floating rivers / canal building | The Panama Canal, irrigation systems of Mesopotamia | Complex terrain manipulation. Water management as a mechanic = genuinely rich | HEI |
| Pangea start | Plate tectonics. Start on one continent, split over time. | This is a whole different game scenario, not a feature add | Region |
| Extinct animals / ancient creatures | Paleontology, biodiversity, mass extinction events | Interesting as a d20 rare event (Mammoth bones found → one-time resource bonus) | Region |
| Insurance | Risk pooling = foundational economic concept | Need a basic economy first; insurance layer belongs after the engine is stable | Economics |
| Family relationships tracker | Dynastic politics, succession, inheritance laws | Too complex for v1. Fascinating for a dynastic Civ-style game. | Place |
| 25% robbery chance when boating | Piracy! Very real historical force. | The Caravan NPC already can be robbed. Ocean piracy event = d20 roll, easy to add to event deck. **Actually, add this to the d20 event deck.** | Movement |

---

## PART 4 — WHAT WE SKIP AND WHY ❌

*These have no place in an educational geography game. Some are off-brand, some are too dark, some are simply not game design.*

| Idea | Why We Skip It |
|------|---------------|
| Magic / magical creatures / magical fruit | ClassCiv is grounded in real geography. Fantasy elements break the curriculum link. The mythology creatures exist as cultural artifacts, not as units with powers. |
| Poisons / hallucination effects | Too dark for middle school without specific curriculum framing. The d20 disease events cover the educational content (dysentery, plague, scurvy) without glamorizing poisoning. |
| Experiments on humans | No. |
| Cults | Covered by religion/mythology mechanics. "Cult" as a specific mechanic adds nothing educational. |
| Assassins (as an active player mechanic) | Targeted killing of specific units as a game action introduces a tone that doesn't serve the learning goals. Espionage via tech tree (Optics, Astronomy) is cleaner. |
| High-poly 3D models / PBR textures | This is a web app with a Leaflet map and React overlays. It's not Unreal Engine. Not wrong to want, just wrong platform. |
| Battle arena (standalone mini-game) | Conflict is already handled with full diplomatic consequences. A standalone arena mode strips out the geographic/economic context. |
| Loot drops | Random loot = Minecraft logic. ClassCiv uses structured resource economics. d20 events cover the "chaos gives you a bonus" need. |
| Dueling with real weapons, customizable weapons | Not a weapons game. Military strength = soldiers + buildings + justification quality. |
| Ford F150 (×2 different students) | No. |
| AK-47 | No. |
| Panzerkampfwagen VIII Maus | A student knows their WWII armor. Impressive. Still no. |
| Anti-Subaru club | Unclear what this does to GDP. |
| Bathrooms | The sanitation implications of poor aqueducts are already in the disease event system. Close enough. |
| Slurpee | Promoted to Silly Wall. See Part 7. |
| SPOKECAN | Spokane, WA. Region 1 adjacent. Geographically valid. See Part 7. |
| 67 | Gen Alpha brainrot slang, not a game idea. Origin: drill song + LaMelo Ball's height. Meaning: deliberately nothing. Dictionary.com published a definition. See Part 7. |
| Florida | Florida is technically in Region 2 (Eastern Canada + Eastern US). So, yes. Florida exists. |
| Lambo / Lambrigen | The Merchant unit is the closest available option. |
| WW3 | The game ends at the Epilogue Epoch, not the apocalypse. |
| Mutual Assured Destruction | See above. |
| The Iraq War / Vietnam War / Iran / Iraq | Real geopolitical conflicts deserve nuanced curriculum treatment, not a game button. |
| Google Maps | Already using Leaflet. Basically Google Maps but for classrooms. |

---

## PART 5 — IMPLEMENTATION ROADMAP 🛠️

### What to do RIGHT NOW (decision-ready, fits within build window):

| # | Feature | What It Adds | Effort | When |
|---|---------|-------------|--------|------|
| A | **Overfarming / Overhunting depletion** | HEI theme, resource scarcity, Oregon Trail stakes | Medium — 2 new DB columns + event trigger | Phase 9 (resource engine) |
| B | **Math Gate (DM-configurable)** | Cross-curricular math integration, Scott's control | Low — modal wrapper on transaction confirmation | Phase 8 (Build) |
| C | **Customizable Flag / Civilization Codex** | Place theme, student ownership, portfolio piece | Low — cosmetic upload + Lorekeeper artifact tab | Phase 7 (portfolio) |
| D | **Landmark founding bonus (First Settler / Resource Hub / Natural Landmark)** | Place theme, settlement strategy | Low — one-time choice at first building placement | Phase 7 |
| E | **Civilization Codex (language name, deity, core belief)** | Place theme, Lorekeeper portfolio expansion | Low — form fields, stored as cultural artifact | Phase 7 |
| F | **Piracy event in d20 deck (ocean/coastal sub-zones)** | Movement theme, maritime hazard | Low — 2 new event entries in the deck | Phase 8 (events) |
| G | **Resource refinement made visible in UI** | HEI/Region, tech tree storytelling | Low — UI label change, no new data model | Phase 9 |
| H | **Festival / Entertainment event (DEFINE sub-option)** | Place/Culture theme, Drama & Poetry gate | Medium — new DEFINE sub-option, CI + pop modifier | Phase 9+ |

### What to target for v2/product (build into architecture now, don't code yet):

| # | Feature | Architecture Notes |
|---|---------|------------------|
| I | **Specialist NPC Survivor** | `npc_type: 'survivor'` on NPC table, `terrain_origin` field, bonus_type enum |
| J | **Confederation mechanic** | `confederation_id` nullable foreign key on `teams` table |
| K | **Diplomatic Duel** | `conflict_type: 'duel' \| 'war'` on epoch_conflict_flags |
| L | **Pangea scenario pack** | Scenario pack JSON data layer (already scaffolded in Decision 86) |
| M | **Coded messages / Spy unit** | Separate espionage action_type on submissions table |
| N | **Day/night cycle flavor text** | `epoch_time_of_day` field in game_settings, drives d20 event narrative variant |

---

## PART 6 — WHAT THESE KIDS ACTUALLY TOLD YOU

Read between the lines. These students, unprompted, independently asked for:

- **Consequences that stick** — overhunting, overfarming, starvation, equipment breaking, people dying. They want decisions that matter.
- **Ownership** — name your flag, your language, your ships, your city. They want it to be *theirs*.
- **Unfairness to be real** — different terrain, different resources, different disaster risk. They understand that geography creates inequality. They want to play in a world that's honest about that.
- **Math to mean something** — multiple students independently said "make us do math to buy things." They want to earn it.
- **Things that can break** — transportation degrades, buildings get destroyed, armies lose people. They don't want a game that protects them. They want stakes.
- **Surprise** — weird events, random disasters, things they can't predict. Oregon Trail is in their DNA.
- **Other people to matter** — merge with allies, challenge rivals, gift neighbors, message enemies. They're social animals. The game should respect that.

ClassCiv is already designed around all of this. These students built it from scratch with their instincts. 

That's not a coincidence. That's what good game design feels like from the inside.

---

## PART 7 — THE SILLY WALL 🤪

*These stay. They were submitted in good faith and deserve to live somewhere. Some are genuinely funny. One references a large WWII tank by full German name. That student has a future.*

---

> **"Build a giant Mr. Somers statue"** — Confirmed landmark. Permanent Production bonus to any sub-zone in which it is placed. Students are not wrong.

> **"Slurpee"** — Actually viable. A Slurpee appearing in a few frames as a visual glitch during the RESOLVE animation — present for 2–3 frames, never explained, never acknowledged, never repeated at the same moment — is exactly the kind of thing a student notices once, tells their friends about, and spends the next week watching for. Easter egg. Zero build time. Infinite return. Add it.

> **"Cheddar my cat"** — Cheddar the Cat is hereby the official Mascot of ClassCiv. No mechanical role. Immense cultural value.

> **"Toothless the Dragon"** — The Kaiju roster is locked. We already have Thunderbird, Kraken, Kodiak, Chimera, Cyclops, Rexar, and ZORG-9. Toothless watches from the bench.

> **"Panzerkampfwagen VIII Maus"** — A 188-ton prototype tank that never saw combat, sank into the ground under its own weight, and was captured by the Soviets in 1945. Whoever submitted this: the Maus failed because it was logistically catastrophic. That IS the ClassCiv lesson. The Warlord who over-invests in military at the expense of Food and Roads is building a Maus. You already understand the game.

> **"AK-47"** — The Warlord's Musketeer unit says hello.

> **"Ford F150 (×2 submissions)"** — The Caravan unit thanks you for your continued support.

> **"Lambrigen / Lambo"** — The Merchant's trade route moves slower than a Lambo. But it doesn't break down in a mountain pass.

> **"George Washington"** — He is available as a Colossus NPC (Tier 4 trigger). Name: The Founding Colossus. Passive Legacy drain on adjacent civs whose democratic tech lags their military tech. Very on-brand.

> **"Breaking Bad"** — A student submitted this for a geography game. Respect. The Chemistry tech unlocks in v3.

> **"Floating Islands with Youth Fountain"** — Genuinely poetic. Put it in the mythology creature creation prompts. "Your Lorekeeper has discovered a floating island. What do your people believe lives there?"

> **"Dinosaur Island"** — Region 12 (Pacific/Japan/Korea/Australia) has never been fully explained. We're not saying it's Dinosaur Island. We're not *not* saying it's Dinosaur Island.

> **"Zedlandia — the 8th Continent"** — Classified. See Region 12.

> **"Pangea"** — Not impossible. Just a different game.

> **"Pneumonoultramicroscopicsilicovolcanoconiosis"** — A lung disease caused by inhaling volcanic silica dust. Actually curriculum-relevant near volcanic sub-zones. Student gets full credit for spelling it from memory.

> **"Ancient alien weapons blueprints in ruins"** — This student is playing a different game. It's a better game. Build ClassCiv first.

> **"Anti-Subaru club"** — Formal sanctions available through the Embargo mechanic. You know what you did, Subaru.

> **"SPOKECAN"** — Spokane, Washington. A student submitted the name of a real city in the Pacific Northwest as a game idea, which is arguably the most geographically grounded entry on this entire list. Spokane sits at the intersection of the Columbia Plateau and the Inland Northwest — Region 1 (Alaska + Western Canada) territory adjacent. Why a 7th grader submitted Spokane is between them and their journal. Noted.

> **"67"** — Not a prank. Genuine brainrot. "67" (said *six-seven*, never *sixty-seven*) is Gen Alpha slang that originated from the drill song *Doot Doot (6 7)* by Skrilla and NBA player LaMelo Ball's 6'7" height. Its meaning is deliberately nothing — it's ambiguous, fluid, and used as a response to any question in any context. Dictionary.com published an official slang entry in September 2025. When a student submitted "67" as a ClassCiv game idea, they weren't pranking Scott. They were answering a question the only way 2026 middle schoolers know how.
>
> Here's the thing nobody mentions: Scott is a **math teacher**. In a base-10 number system. Six and seven are not optional vocabulary. They are load-bearing digits. They appear in multiplication tables, fractions, number lines, word problems, and the answer to "how many days in a week." Two-ninths of the non-zero integers are now phonetically weaponized against him. He cannot say "six" — drone of "six-seven" from the left side of the room. He cannot say "seven" — the right side joins in and twenty-six hands go up in the scale gesture simultaneously. Google reportedly shakes the screen when you type 67 in the search bar. The infrastructure of civilization has paid tribute to the bit. The kids have already won. This is not a classroom management issue. This is a **phonetic hostage situation** with no clean resolution.
>
> The correct response, per LaMelo Ball, is to hold both palms up and move them alternately up and down. Scott is statistically doing this approximately twice per math class whether he intends to or not. 67.

> **"Florida"** — Florida exists. Florida has always existed. Florida will always be Florida.

> **"Mutual Assured Destruction"** — The War Exhaustion mechanic exists for this exact reason. Two civs that keep warring each other will reach 100 Exhaustion simultaneously and collapse. That IS mutually assured destruction. The students invented it from first principles.

---

*Document created: March 5, 2026*
*Next step: Review Part 5 with Scott and assign decision numbers to Items A–H*

# Substitute Playbook — ClassCiv Realms

**Written for:** a substitute teacher who may not have used the system before. Zero coding knowledge required. Everything is through the browser.

## Before class

1. Sign in at `classciv.vercel.app` with the teacher login credentials Scott left on the desk card.
2. You will land on the DM dashboard (`/dm`).
3. Open a second browser tab for the projector: `/projector/[game-code]`. The game code is also on the desk card.
4. On the projector tab, click **"Arm Ceremony"** once so sounds will play.

## Running the class

Each class period plays ONE epoch (≈45 minutes of class = one epoch). The system walks you through it. Here is what each step looks like:

- **Login phase:** students sign in on their Chromebooks with their first names as usernames. Passwords are also their first names. If a student cannot log in, check the roster panel — they might be marked absent from a previous day.
- **BUILD round:** students pick a building or action. Each team submits one choice per role.
- **EXPAND round:** students pick a region or trade.
- **DEFINE round:** diplomacy. Alliance, war, peace, etc.
- **DEFEND round:** military action.

Between rounds, you score each submission 1–5 on the DM dashboard. There is no wrong score — you are judging the quality of reasoning, not correctness.

## If something goes wrong

- **A student is upset about a game outcome:** acknowledge it calmly. Do NOT use the DM Undo button just to make them feel better — the game is supposed to have real consequences. Scott has a crisis-response doc (`CRISIS-SCRIPT.md`) with wording you can use.
- **A student lost a battle and has nothing to do:** check their screen. Their civilization is still alive — they should see their dashboard and the round prompt. If they genuinely cannot take any action, call Scott's phone number on the desk card.
- **The projector tab is blank:** reload it. Re-click Arm Ceremony.
- **A student cannot see the map:** tell them to refresh their browser. Their draft-claimed region is saved server-side.
- **A real technical bug:** take a screenshot, leave the class on the current step, and move to the student discussion questions in `DAY-1-STUDENT-GUIDE-6TH.md` for the remainder of the period. Text Scott a picture of the error.

## What NOT to do

- Do not run any terminal commands.
- Do not edit the code.
- Do not log into Supabase or Vercel.
- Do not use the "Reset Game" button unless Scott has texted you saying to.
- Do not modify student usernames or passwords.

## End of class

- There is nothing to save. The system writes everything to the database automatically.
- Make sure the projector tab is left open so the next period can pick up where this one ended.

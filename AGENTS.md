# INDIE+ POHANG — Instructions for Jules / Antigravity

## Read first
Read `HARNESS.md` and `DESIGN.md` before modifying any code. This is an actively used independent-film discovery, booking-link, criticism and magazine app. Favor surgical fixes over whole-site rewrites.

## Facts and data
- Never invent screenings, movie metadata, image rights, prices, reservation times, live API availability, critic quotations or real users.
- Official cinema schedule and Dtryx data are the authoritative sources. Failed external fetches must retain the last verified state.
- Keep localStorage-only prototype capabilities explicitly separate from Firebase-backed production features.
- Preserve the user's original reviews, bylines, paragraph rhythm and photographs unless asked to edit them.

## Implementation protocol
1. Inspect the latest target files and relevant data, `git status`, existing report and test scripts.
2. Reproduce the bug and identify its lowest-risk fix. Avoid layering duplicate CSS/JS version patches if consolidating is safe and tested.
3. Follow the applicable script in `HARNESS.md`; at minimum syntax-check changed JavaScript and validate changed JSON. Run the most relevant `scripts/probe_vXX.mjs` if browser environment is available.
4. Check 390×844 phone and 1440×1100 desktop; show before/after differences when CSS was changed.
5. Clearly distinguish source commit, deployment and live verification; never claim a deploy based on `git push` alone.

## AI design and external tools
- `DESIGN.md` describes the existing film-visual identity for Google Stitch. Do not auto-import generic themes or override real editorial CSS.
- Antigravity/Jules may propose changes but must keep public film facts and the author’s words intact.
- Never put movie service tokens, API keys, email login secrets or personal student data in source.
- Do not automate purchases, submissions, reservations, or destructive Firebase writes without separate explicit instruction.

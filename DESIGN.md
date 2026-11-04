# Design System: INDIE+ POHANG / INDIE PORT
**Source files:** `app.css`, `editorial-v38.css`, `desktop-v42.css`, `mobile-v33.css`, `index.html`.
**Intent:** Extend the existing independent cinema discovery, ticketing and film-criticism experience. Preserve features and real showtime data.

## 1. Visual Theme & Atmosphere
Independent cinema after dark: near-black editorial surfaces, vibrant electric-lime utility accents, photographic movie stills and confident large typography. This is not a generic streaming-clone grid. Film authorship, real cinema listings, personal criticism, and elegant magazine layouts lead.

## 2. Color Palette & Roles
- **True cinema black** `#090a0b` — app background (`--bg`).
- **Dark panel** `#121417` and **raised panel** `#171a1f` — app cards (`--panel`, `--panel2`).
- **Subtle line** `#2a2e35` — separators (`--line`).
- **Warm off-white** `#f7f7f2` — primary text (`--text`).
- **Cool secondary gray** `#9298a2` — metadata (`--muted`).
- **Electric lime** `#d8ff43` — focus action / kicker / status (`--lime`).
- **Warm cinema orange** `#ff7654` — secondary accents (`--orange`).
- **Magazine paper** `#f2eee5` — criticism publication view (`--mag-bg`).
- **Magazine ink** `#151515` and **literary red** `#a62520` — print-style magazine content.

## 3. Typography
- Main interface: Pretendard and system sans-serif with strong size contrast and crisp spacing.
- Large, bold film titles; quieter metadata and explanatory text.
- Film criticism should optimize long-form reading, paragraph rhythm and citation context, not one-line social-feed snippets.

## 4. Components & Interaction
- Main controls are high contrast; primary call to action lime-on-black or black-on-lime.
- Existing round pill navigation/filters and large cinematic hero can be retained, with stable click targets.
- Thumbnails/hero use licensed or source-credited stills only; never invent movie posters or screenings.
- User-generated magazine cards and share images retain precise photo cropping, text margins, issue numbering and exportability.

## 5. Responsive & Editorial Layout
- Minimum acceptance sizes: 390×844 phone and 1440×1100 desktop per `HARNESS.md`.
- Mobile-first touch and horizontal overflow verification. No obstructing overlays or undersized navigation.
- Date/time labels must be grounded in live verified screening data; no fictional reservation slots or fabricated ticket availability.
- Long criticism should reflow without text cutoff, image stretching or breaking card exports.

## 6. Quality, Safety & Workflow
- Read `HARNESS.md` for validation and data-source protocol; preserve existing v0.4–v0.43 layers.
- Preserve the distinction between actual Firebase features and localStorage prototypes.
- Maintain user text, film titles, director/actor credits, source links and copyright.
- Test before deploy; a design brief is never proof that CSS or live UI has changed.

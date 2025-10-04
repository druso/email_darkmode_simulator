# Project Overview

## Summary
Email Dark Mode Simulator is a lightweight Node.js +## Current Focus

- replace calibration lookups with algorithmic Outlook.com / Outlook for Windows transforms in `public/js/colorTransforms.js` (background phase complete, text refinement pending; see `tighten_plan.md`).
- Revamp the UI to present three scenarios (Intended, Outlook Web, Outlook Windows) with streamlined palette controls and randomized prompts.
- Integrate drag-and-drop palette ordering and compact rails for builder + queued items.
- User-configurable background and text colors with optional font selection and sample text.
- Four preview panes displaying:## Recent Updates

- Added `Color_inversion_data.md` describing calibration inputs for Outlook clients.
- Created `test_outlook_algorithms.js` to validate algorithm fits against calibration data.
- Documented the v1/v2 algorithm in `ALGORITHM_SUMMARY.md`.
- Introduced `public/js/prompts.js` containing 20 randomized sample prompts consumed by the palette builder and queue.
- Rebuilt `public/js/main.js` palette UI as inline rails with shuffle controls and drag-and-drop reordering.
- Tightened layout in `public/styles.css`, ensuring scenario subtitles share a fixed height and palette sections consume less vertical space.

## Tech Stack
- Runtime: Node.js 18+
- Server: Express 5 serving static assets from `public/`
- Front-end: Vanilla HTML, CSS, and JavaScript (no build step required)
## Entry Points
- `server.js`: boots the Express server.
- `public/index.html`: main UI loaded in browser.

## Scripts
- `npm start`: run the Express server on `http://localhost:3000`.

## Open Questions / Next Steps
- Should additional dark mode strategies (contrast boost, desaturation) be added?
- Persist user selections locally across sessions.
- Add automated tests for color conversion helpers.

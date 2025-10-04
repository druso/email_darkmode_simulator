# Email Dark Mode Simulator

Interactive Node.js + Express web app for experimenting with how common email dark mode algorithms transform one or more color palettes.

## Prerequisites
- Node.js 18+
- npm 9+

## Setup
```bash
npm install
```

## Run locally
```bash
npm start
```
Then visit `http://localhost:3000`.

## Project structure
- `server.js`: Express server serving the static UI.
- `public/`: Front-end assets.
  - `index.html`: UI with palette creator, stacked scenario previews, and accessible color chips.
  - `js/colorTransforms.js`: Pure functions for color conversions and scenario generation.
  - `js/main.js`: Interface logic for managing palettes and rendering previews.
  - `styles.css`: Styling for the palette manager and vertical scenario comparisons.

## Dark mode scenarios
- **As Intended**: Shows provided colors without modification.
- **Scenario A · Full Inversion**: Inverts both background and text colors via `invertHexColor()`.
- **Scenario B · Smart Inversion**: Uses HSL lightness to decide whether to apply full inversion.
- **Scenario C · No Change**: Mirrors original colors to emulate clients that preserve designs.

## Future enhancements
- Persist last-used palettes via `localStorage`.
- Add more transformation presets (e.g., desaturation, contrast enforcement).
- Provide accessibility contrast ratio feedback between background/text pairs.

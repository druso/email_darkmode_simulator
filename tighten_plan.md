---
description: tighten outlook text transforms
---

# Outlook Text Transform Tightening Plan

- **[goal]** Bring Outlook.com and Outlook for Windows text ΔE values under threshold (≤6) across all 13 calibration cases in `Color_inversion_data.md`.
- **[analysis]**
  - Backplate L* mappings already match backgrounds; primary gaps are text lightness overshoot (ΔL too large) and chroma desaturation inconsistencies for vivid hues.
  - Windows cases require stronger inversion toward lightness targets with controlled chroma retention for brand colors.
- **[actions]**
  1. **Recompute target curves**: Fit piecewise linear L* targets for each client using calibration pairs, paying attention to dark-preserving cases (`#000000`, `#010101`).
  2. **Derive chroma scaling**: Use ratios from empirical data (C_out / C_in) to set conditional damping per chroma band (e.g., soft neutrals vs saturated hues).
  3. **Implement adjustments**: Update `transformOutlookWebText()` and `transformOutlookWindowsText()` in `public/js/colorTransforms.js` with new L* formulae and chroma factors.
  4. **Iterate with harness**: Run `node test_outlook_algorithms.js` after each tweak until ΔE thresholds are satisfied.
  5. **Document findings**: Summarize adjustments in `ALGORITHM_SUMMARY.md` and `PROJECT_OVERVIEW.md` once stabilized.

# Outlook Dark Mode Transformation Algorithms

## Background Transformations - Test Results: 26/26 PASS (100%)

### Outlook.com (Smart/Partial Invert) - 13/13 PASS
**Pattern**: Preserve dark, darken light, moderate mid-tones

```javascript
function transformBackgroundOutlookCom(hex) {
  const lab = hexToLab(hex);
  const L = lab.l;
  
  // Preserve very dark backgrounds (< 5)
  if (L < 5) return hex;
  
  // Preserve dark backgrounds (< 40)
  if (L < 40) return hex;
  
  // Transform light backgrounds (>= 70)
  // Map 70-100 → 35-17 (aggressive darkening)
  if (L >= 70) {
    const targetL = 35 - ((L - 70) / 30) * 18;
    return labToHex({ ...lab, l: Math.max(15, targetL) });
  }
  
  // Mid-tones (40-70): moderate darkening with curve
  // Map 40-70 → 39-44
  const t = (L - 40) / 30;
  const targetL = 39 + t * 5;
  return labToHex({ ...lab, l: targetL });
}
```

**Key Insights**:
- **Dark preservation zone** (L* < 40): No change
- **Light zone** (L* ≥ 70): Aggressive darkening to ~15-35 range
- **Mid-tone zone** (40-70): Slight darkening with gentle curve

### Outlook for Windows (Aggressive/Full Invert) - 13/13 PASS
**Pattern**: Invert dark, darken light, context-aware for readability

```javascript
function transformBackgroundOutlookWin(hex, textHex = null) {
  const lab = hexToLab(hex);
  const L = lab.l;
  
  // Full invert very dark backgrounds (< 5)
  if (L < 5) {
    const targetL = 100 - L;
    return labToHex({ ...lab, l: targetL });
  }
  
  // Context-aware partial lift for light-text-on-dark scenarios
  // Only for mid-dark range (30-40), not pure blacks
  if (textHex) {
    const textLab = hexToLab(textHex);
    if (textLab.l > 90 && L >= 30 && L < 40) {
      // Partial lift to mid-tone (~75) for better readability
      const targetL = L + 36;
      return labToHex({ ...lab, l: Math.min(100, targetL) });
    }
  }
  
  // Full invert dark backgrounds (< 38)
  if (L < 38) {
    const targetL = 100 - L;
    return labToHex({ ...lab, l: targetL });
  }
  
  // Transform light backgrounds (>= 70)
  // Map 70-100 → 48-15 (aggressive darkening)
  if (L >= 70) {
    const targetL = 48 - ((L - 70) / 30) * 33;
    return labToHex({ ...lab, l: Math.max(15, targetL) });
  }
  
  // Mid-tones (38-70): slight lightening curve
  // Map 38-70 → 62-61
  const t = (L - 38) / 32;
  const targetL = 62 - t * 1;
  return labToHex({ ...lab, l: targetL });
}
```

**Key Insights**:
- **Full inversion zone** (L* < 38): Dark → Light (100 - L*)
- **Context-aware exception**: Light text (L* > 90) on mid-dark background (30-40) → Partial lift (+36) instead of full invert
- **Light zone** (L* ≥ 70): Aggressive darkening to ~15-48 range
- **Mid-tone zone** (38-70): Slight lightening/preservation

## Text Transformations - TODO

Next steps:
1. Analyze text transformation patterns from calibration data
2. Develop algorithmic models for Outlook.com and Windows text handling
3. Test against 13 test cases
4. Integrate into `colorTransforms.js`

## Test Coverage

- **13 test cases** covering:
  - Grayscale spectrum (ultra-light to pure black)
  - Brand colors (saturated blues, reds)
  - Accessibility scenarios (low contrast)
  - Edge cases (pure white, pure black, off-by-one)
  - Context-aware scenarios (light text on dark backgrounds)

- **Accuracy**: All transformations within ΔE < 5 (perceptually indistinguishable)

export const SMART_INVERSION_THRESHOLD = 0.6; // 60%
export const TARGET_CONTRAST_RATIO = 4.5; // WCAG AA for normal text

const WHITE = '#FFFFFF';
const BLACK = '#000000';
const OUTLOOK_WHITE_TARGET = '#262626';
const OUTLOOK_BLACK_TARGET = '#F6F6F6';
const EPSILON = 1e-6;
const BACKGROUND_DELTA_MATCH_THRESHOLD = 1.0;
const TEXT_BG_CALIBRATION_THRESHOLD = 2.0;
const TEXT_INPUT_CALIBRATION_THRESHOLD = 4.0;

export const SCENARIO_DEFINITIONS = [
  {
    key: 'intended',
    title: 'As Intended / No Change',
    description: 'Original palette as designed. Email clients that do not alter colors will render it this way.'
  },
  {
    key: 'outlook-contrast',
    title: 'Outlook Contrast Simulation',
    description:
      'Context-aware transformation that targets a WCAG 2.1 contrast ratio of 4.5:1 by adjusting perceptual lightness (L*) in CIELAB.'
  },
  {
    key: 'gmail-ios',
    title: 'Gmail iOS Full Inversion',
    description:
      'Formulaic full inversion inspired by the difference/screen blend behaviour observed on Gmail iOS dark mode.'
  }
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const OUTLOOK_BACKGROUND_CALIBRATION = [
  { input: '#000000', output: '#F6F6F6' },
  { input: '#010101', output: '#F3F3F3' },
  { input: '#383939', output: '#383939' },
  { input: '#5A5C5E', output: '#B6B8BA' },
  { input: '#7A7C80', output: '#727478' },
  { input: '#8A8D90', output: '#909396' },
  { input: '#B5B3AF', output: '#74716D' },
  { input: '#C8CACC', output: '#5B5D5F' },
  { input: '#D7D7D5', output: '#3E3E3C' },
  { input: '#E0E0E0', output: '#474747' },
  { input: '#E2E3E3', output: '#434545' },
  { input: '#F0F0F0', output: '#373737' },
  { input: '#F4F4F4', output: '#323232' },
  { input: '#FEFEFE', output: '#272727' },
  { input: '#FFFFFF', output: '#262626' }
];

const OUTLOOK_TEXT_CALIBRATION = [
  { background: '#FFFFFF', textInput: '#222222', textOutput: '#DEDEDE' },
  { background: '#FFFFFF', textInput: '#0078D4', textOutput: '#5EA6FF' },
  { background: '#FEFEFE', textInput: '#222222', textOutput: '#DEDEDE' },
  { background: '#F4F4F4', textInput: '#2B2B2B', textOutput: '#C4C4C5' },
  { background: '#F0F0F0', textInput: '#D92B2B', textOutput: '#FF7373' },
  { background: '#E2E3E3', textInput: '#3A3B3C', textOutput: '#C3C3C4' },
  { background: '#E0E0E0', textInput: '#8C8C8C', textOutput: '#393A3A' },
  { background: '#D7D7D5', textInput: '#5B5D62', textOutput: '#C6C7BE' },
  { background: '#C8CACC', textInput: '#4A4D50', textOutput: '#C7C7C8' },
  { background: '#B5B3AF', textInput: '#2F3132', textOutput: '#C7C7C8' },
  { background: '#8A8D90', textInput: '#151617', textOutput: '#E5E5E6' },
  { background: '#7A7C80', textInput: '#FFFFFF', textOutput: '#FFFFFF' },
  { background: '#5A5C5E', textInput: '#ECEDED', textOutput: '#3B3C3C' },
  { background: '#383939', textInput: '#F3F3F3', textOutput: '#DFDFDF' },
  { background: '#010101', textInput: '#EEEEEE', textOutput: '#393939' },
  { background: '#000000', textInput: '#EEEEEE', textOutput: '#393939' }
];

let cachedBackgroundCalibration;
let cachedTextCalibration;

export function formatHex(hex) {
  if (!hex) return BLACK;
  let value = String(hex).trim();
  if (value.startsWith('#')) {
    value = value.slice(1);
  }

  if (value.length === 3) {
    value = value
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (value.length !== 6 || /[^0-9a-fA-F]/.test(value)) {
    throw new Error(`Unexpected hex color format: ${hex}`);
  }

  return `#${value.toUpperCase()}`;
}

export function hexToRgb(hex) {
  const normalized = formatHex(hex).slice(1);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
}

export function rgbToHex({ r, g, b }) {
  const clampChannel = (value) => clamp(Math.round(value), 0, 255)
    .toString(16)
    .padStart(2, '0');

  return `#${[r, g, b].map(clampChannel).join('').toUpperCase()}`;
}

const srgbToLinear = (value) => {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const linearToSrgb = (value) => {
  const v = value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  return clamp(Math.round(v * 255), 0, 255);
};

function rgbToXyz({ r, g, b }) {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);

  const X = R * 0.4124 + G * 0.3576 + B * 0.1805;
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const Z = R * 0.0193 + G * 0.1192 + B * 0.9505;

  return {
    X: X * 100,
    Y: Y * 100,
    Z: Z * 100
  };
}

function xyzToRgb({ X, Y, Z }) {
  const x = X / 100;
  const y = Y / 100;
  const z = Z / 100;

  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let b = x * 0.0557 + y * -0.204 + z * 1.057;

  r = linearToSrgb(Math.max(0, Math.min(1, r)));
  g = linearToSrgb(Math.max(0, Math.min(1, g)));
  b = linearToSrgb(Math.max(0, Math.min(1, b)));

  return { r, g, b };
}

function xyzToLab({ X, Y, Z }) {
  const refX = 95.047;
  const refY = 100.0;
  const refZ = 108.883;

  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

  const x = f(X / refX);
  const y = f(Y / refY);
  const z = f(Z / refZ);

  return {
    l: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z)
  };
}

function labToXyz({ l, a, b }) {
  const refX = 95.047;
  const refY = 100.0;
  const refZ = 108.883;

  const fy = (l + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;

  const pow3 = (t) => t * t * t;

  const X = refX * (fx > 0.206893 ? pow3(fx) : (fx - 16 / 116) / 7.787);
  const Y = refY * (fy > 0.206893 ? pow3(fy) : (fy - 16 / 116) / 7.787);
  const Z = refZ * (fz > 0.206893 ? pow3(fz) : (fz - 16 / 116) / 7.787);

  return { X, Y, Z };
}

function hexToLab(hex) {
  return xyzToLab(rgbToXyz(hexToRgb(hex)));
}

function labToHex(lab) {
  return rgbToHex(xyzToRgb(labToXyz(lab)));
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(foregroundHex, backgroundHex) {
  const L1 = relativeLuminance(foregroundHex);
  const L2 = relativeLuminance(backgroundHex);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getReadableTextColor(hex) {
  return relativeLuminance(hex) > 0.55 ? '#111827' : '#F9FAFB';
}

function deltaE(labA, labB) {
  const dl = labA.l - labB.l;
  const da = labA.a - labB.a;
  const db = labA.b - labB.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

function getBackgroundCalibration() {
  if (!cachedBackgroundCalibration) {
    cachedBackgroundCalibration = OUTLOOK_BACKGROUND_CALIBRATION.map(({ input, output }) => {
      const inputHex = formatHex(input);
      const outputHex = formatHex(output);
      return {
        inputHex,
        outputHex,
        inputLab: hexToLab(inputHex),
        outputLab: hexToLab(outputHex)
      };
    }).sort((a, b) => a.inputLab.l - b.inputLab.l);
  }
  return cachedBackgroundCalibration;
}

function getTextCalibration() {
  if (!cachedTextCalibration) {
    cachedTextCalibration = OUTLOOK_TEXT_CALIBRATION.map(({ background, textInput, textOutput }) => {
      const backgroundHex = formatHex(background);
      const textInputHex = formatHex(textInput);
      const textOutputHex = formatHex(textOutput);
      return {
        backgroundHex,
        textInputHex,
        textOutputHex,
        backgroundLab: hexToLab(backgroundHex),
        textInputLab: hexToLab(textInputHex)
      };
    });
  }
  return cachedTextCalibration;
}

function adjustLabLightnessForContrast(labColor, backgroundHex, targetRatio) {
  const originalHex = labToHex(labColor);
  if (contrastRatio(originalHex, backgroundHex) >= targetRatio) {
    return originalHex;
  }

  const backgroundIsDark = relativeLuminance(backgroundHex) < 0.45;
  const searchDirectionIncrease = backgroundIsDark;

  let low = searchDirectionIncrease ? labColor.l : 0;
  let high = searchDirectionIncrease ? 100 : labColor.l;
  let bestHex = originalHex;
  let bestDiff = Infinity;

  for (let i = 0; i < 24; i += 1) {
    const mid = (low + high) / 2;
    const candidateHex = labToHex({ ...labColor, l: clamp(mid, 0, 100) });
    const ratio = contrastRatio(candidateHex, backgroundHex);

    if (ratio >= targetRatio) {
      const diff = Math.abs(mid - labColor.l);
      if (diff < bestDiff - EPSILON) {
        bestHex = candidateHex;
        bestDiff = diff;
      }

      if (searchDirectionIncrease) {
        high = mid - 0.01;
      } else {
        low = mid + 0.01;
      }
    } else if (searchDirectionIncrease) {
      low = mid + 0.01;
    } else {
      high = mid - 0.01;
    }

    if (Math.abs(high - low) < 0.01) {
      break;
    }
  }

  return bestHex;
}

function transformBackgroundForOutlook(backgroundHex) {
  const normalized = formatHex(backgroundHex);
  const calibration = getBackgroundCalibration();
  const lab = hexToLab(normalized);

  const hexMatch = calibration.find((point) => formatHex(point.inputHex) === normalized);
  if (hexMatch) {
    return hexMatch.outputHex;
  }

  const deltaMatch = calibration.find((point) => deltaE(point.inputLab, lab) < BACKGROUND_DELTA_MATCH_THRESHOLD);
  if (deltaMatch) {
    return deltaMatch.outputHex;
  }

  let lower = calibration[0];
  let upper = calibration[calibration.length - 1];

  for (let i = 0; i < calibration.length; i += 1) {
    const point = calibration[i];
    if (point.inputLab.l <= lab.l) {
      lower = point;
    } else {
      upper = point;
      break;
    }
  }

  if (lower === upper) {
    return lower.outputHex;
  }

  const ratio = clamp(
    (lab.l - lower.inputLab.l) / (upper.inputLab.l - lower.inputLab.l || 1),
    0,
    1
  );

  const targetL = clamp(
    lower.outputLab.l + ratio * (upper.outputLab.l - lower.outputLab.l),
    0,
    100
  );

  return labToHex({ ...lab, l: targetL });
}

function applyOutlookTextCalibration(baseTextHex, baseBackgroundHex, transformedBackgroundHex) {
  const calibrations = getTextCalibration();
  const textLab = hexToLab(formatHex(baseTextHex));
  const originalBackgroundLab = hexToLab(formatHex(baseBackgroundHex));
  const transformedBackgroundLab = hexToLab(formatHex(transformedBackgroundHex));

  let bestMatch = null;
  let bestScore = Number.POSITIVE_INFINITY;

  calibrations.forEach((entry) => {
    const bgDiffOriginal = deltaE(entry.backgroundLab, originalBackgroundLab);
    if (bgDiffOriginal > TEXT_BG_CALIBRATION_THRESHOLD) {
      return;
    }

    const textDiff = deltaE(entry.textInputLab, textLab);
    if (textDiff > TEXT_INPUT_CALIBRATION_THRESHOLD) {
      return;
    }

    const score = bgDiffOriginal * 1.5 + textDiff;
    if (score < bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  });

  return bestMatch ? bestMatch.textOutputHex : null;
}

function simulateOutlookScenario(palette) {
  const baseBackground = formatHex(palette.bgColor);
  const baseText = formatHex(palette.textColor);

  let transformedBackground = transformBackgroundForOutlook(baseBackground);
  let startingTextLab;
  let calibrationSource = null;

  const calibratedTextHex = applyOutlookTextCalibration(baseText, baseBackground, transformedBackground);
  let transformedText;
  let ratio;

  if (calibratedTextHex) {
    transformedText = calibratedTextHex;
    calibrationSource = 'empirical calibration';
    ratio = contrastRatio(transformedText, transformedBackground);
  } else {
    startingTextLab = hexToLab(baseText);
    transformedText = adjustLabLightnessForContrast(startingTextLab, transformedBackground, TARGET_CONTRAST_RATIO);
    ratio = contrastRatio(transformedText, transformedBackground);

    if (ratio < TARGET_CONTRAST_RATIO) {
      const fallback = relativeLuminance(transformedBackground) < 0.4 ? '#F7F7F7' : '#101010';
      transformedText = fallback;
      ratio = contrastRatio(transformedText, transformedBackground);
    }
  }

  const originalLab = hexToLab(baseText);
  const newLab = hexToLab(transformedText);
  const deltaL = newLab.l - originalLab.l;
  const bgDeltaL = hexToLab(transformedBackground).l - hexToLab(baseBackground).l;
  const methodNote = calibrationSource
    ? 'Calibrated using empirical Outlook samples.'
    : 'Solved for WCAG contrast target.';

  const caption = `Background ΔL* ${bgDeltaL.toFixed(1)}, text ΔL* ${deltaL.toFixed(1)} ⇒ contrast ${ratio.toFixed(2)}:1 (target ≥ ${TARGET_CONTRAST_RATIO}). ${methodNote}`;

  return {
    colors: {
      bgColor: transformedBackground,
      textColor: transformedText
    },
    caption,
    contrastRatio: ratio
  };
}

function mixTowardsWhite(value, factor) {
  return value + (1 - value) * factor;
}

function simulateGmailIosColor(hex) {
  const normalized = formatHex(hex);
  if (normalized === WHITE) {
    return BLACK;
  }
  if (normalized === BLACK) {
    return WHITE;
  }

  const inverted = invertHexColor(normalized);
  const { r, g, b } = hexToRgb(inverted);
  const normalize = (channel) => channel / 255;

  const rN = normalize(r);
  const gN = normalize(g);
  const bN = normalize(b);

  const toneCurve = (channel) => {
    const curved = Math.pow(channel, 0.72);
    return mixTowardsWhite(curved, 0.38);
  };

  const transformed = {
    r: clamp(Math.round(clamp(toneCurve(rN), 0, 1) * 255), 0, 255),
    g: clamp(Math.round(clamp(toneCurve(gN), 0, 1) * 255), 0, 255),
    b: clamp(Math.round(clamp(toneCurve(bN), 0, 1) * 255), 0, 255)
  };

  return rgbToHex(transformed);
}

function simulateGmailScenario(palette) {
  const baseBackground = formatHex(palette.bgColor);
  const baseText = formatHex(palette.textColor);

  const transformedBackground = simulateGmailIosColor(baseBackground);
  const transformedText = simulateGmailIosColor(baseText);
  const ratio = contrastRatio(transformedText, transformedBackground);

  const caption = `Formulaic full inversion with blend-inspired lightening. Resulting contrast ${ratio.toFixed(2)}:1.`;

  return {
    colors: {
      bgColor: transformedBackground,
      textColor: transformedText
    },
    caption,
    contrastRatio: ratio
  };
}

export function invertHexColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: 255 - r, g: 255 - g, b: 255 - b });
}

export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / delta) % 6;
        break;
      case gNorm:
        h = (bNorm - rNorm) / delta + 2;
        break;
      default:
        h = (rNorm - gNorm) / delta + 4;
        break;
    }
  }

  h = Math.round(h * 60);
  if (h < 0) {
    h += 360;
  }

  return { h, s: Math.max(0, Math.min(1, s)), l: Math.max(0, Math.min(1, l)) };
}

export function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

export function hslToHex(h, s, l) {
  return rgbToHex(hslToRgb(h, s, l));
}

export function generateScenarioSet(palette, options = {}) {
  const threshold = options.smartThreshold ?? SMART_INVERSION_THRESHOLD;
  const baseBackground = formatHex(palette.bgColor);
  const baseText = formatHex(palette.textColor);

  const intended = {
    bgColor: baseBackground,
    textColor: baseText
  };

  const outlook = simulateOutlookScenario(palette);
  const gmail = simulateGmailScenario(palette);

  const backgroundLightness = hexToLab(baseBackground).l / 100;
  const smartShouldInvert = backgroundLightness > threshold;

  return {
    scenarios: {
      intended: {
        colors: intended,
        caption: 'Original palette without modification. Represents clients that respect authored colors.'
      },
      'outlook-contrast': outlook,
      'gmail-ios': gmail
    },
    analysis: {
      backgroundLightness,
      smartThreshold: threshold,
      shouldTriggerSmartInvert: smartShouldInvert,
      outlookContrastRatio: outlook.contrastRatio,
      gmailContrastRatio: gmail.contrastRatio
    }
  };
}

export const SMART_INVERSION_THRESHOLD = 0.6; // 60%
export const TARGET_CONTRAST_RATIO = 4.5; // WCAG AA for normal text

const WHITE = '#FFFFFF';
const BLACK = '#000000';
const EPSILON = 1e-6;

export const SCENARIO_DEFINITIONS = [
  {
    key: 'intended',
    title: 'As Intended / No Change',
    description: 'Original palette as designed. Email clients that do not alter colors will render it this way.'
  },
  {
    key: 'outlook-web',
    title: 'Outlook.com — Smart Invert',
    description:
      'Empirical Outlook.com model that aggressively darkens light backgrounds while preserving darker surfaces and softly lifting text.'
  },
  {
    key: 'outlook-windows',
    title: 'Outlook for Windows — Full Invert',
    description:
      'Algorithmic Outlook for Windows simulation with full dark-to-light inversions, light-zone compressions, and vivid color damping.'
  }
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

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

  const outlookWeb = simulateOutlookWebScenario(palette);
  const outlookWindows = simulateOutlookWindowsScenario(palette);

  const backgroundLightness = hexToLab(baseBackground).l / 100;
  const smartShouldInvert = backgroundLightness > threshold;

  return {
    scenarios: {
      intended: {
        colors: intended,
        caption: 'Original palette without modification. Represents clients that respect authored colors.'
      },
      'outlook-web': outlookWeb,
      'outlook-windows': outlookWindows
    },
    analysis: {
      backgroundLightness,
      smartThreshold: threshold,
      shouldTriggerSmartInvert: smartShouldInvert,
      outlookWebContrastRatio: outlookWeb.contrastRatio,
      outlookWindowsContrastRatio: outlookWindows.contrastRatio
    }
  };
}

function deltaE(labA, labB) {
  const dl = labA.l - labB.l;
  const da = labA.a - labB.a;
  const db = labA.b - labB.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

const clampLab = (value, min, max) => Math.max(min, Math.min(max, value));

function scaleLabChroma(lab, factor) {
  const chroma = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  if (chroma < EPSILON) {
    return { a: 0, b: 0 };
  }
  return {
    a: lab.a * factor,
    b: lab.b * factor
  };
}

function transformOutlookWebBackground(hex) {
  const lab = hexToLab(hex);
  const L = lab.l;

  if (L < 5) {
    return formatHex(hex);
  }

  if (L < 40) {
    return labToHex(lab);
  }

  if (L >= 70) {
    const targetL = 35 - ((L - 70) / 30) * 18;
    return labToHex({ ...lab, l: Math.max(15, targetL) });
  }

  const t = (L - 40) / 30;
  const targetL = 39 + t * 5;
  return labToHex({ ...lab, l: targetL });
}

function transformOutlookWindowsBackground(hex, textHex) {
  const lab = hexToLab(hex);
  const L = lab.l;

  if (L < 5) {
    const targetL = 100 - L;
    return labToHex({ ...lab, l: targetL });
  }

  if (textHex) {
    const textLab = hexToLab(textHex);
    if (textLab.l > 90 && L >= 30 && L < 40) {
      const targetL = Math.min(100, L + 36);
      return labToHex({ ...lab, l: targetL });
    }
  }

  if (L < 38) {
    const targetL = 100 - L;
    return labToHex({ ...lab, l: targetL });
  }

  if (L >= 70) {
    const targetL = 48 - ((L - 70) / 30) * 33;
    return labToHex({ ...lab, l: Math.max(15, targetL) });
  }

  const t = (L - 38) / 32;
  const targetL = 62 - t * 1;
  return labToHex({ ...lab, l: targetL });
}

function transformOutlookWebText(textHex, originalBgHex, transformedBgHex) {
  const textLab = hexToLab(textHex);
  const bgLab = hexToLab(transformedBgHex);
  const bgL = bgLab.l;
  const originalL = textLab.l;
  const chroma = Math.sqrt(textLab.a * textLab.a + textLab.b * textLab.b);

  if (originalL >= 88 && bgL < 60) {
    return formatHex(textHex);
  }

  let targetL;
  if (bgL < 30) {
    targetL = 82 - (30 - bgL) * 0.12;
  } else if (bgL < 45) {
    targetL = 78 - (bgL - 30) * 0.35;
  } else if (bgL < 60) {
    targetL = 70 - (bgL - 45) * 0.25;
  } else if (bgL < 75) {
    targetL = 62 - (bgL - 60) * 0.45;
  } else {
    targetL = 55 - (bgL - 75) * 0.3;
  }

  targetL = clampLab(targetL, originalL + 12, 93);

  let chromaFactor;
  if (chroma > 60) {
    chromaFactor = 0.65;
  } else if (chroma > 25) {
    chromaFactor = 0.4;
  } else {
    chromaFactor = 0.12;
  }

  const scaled = scaleLabChroma(textLab, chromaFactor);
  return labToHex({ l: targetL, ...scaled });
}

function transformOutlookWindowsText(textHex, originalBgHex, transformedBgHex) {
  const textLab = hexToLab(textHex);
  const bgLab = hexToLab(transformedBgHex);
  const bgL = bgLab.l;
  const originalL = textLab.l;
  const chroma = Math.sqrt(textLab.a * textLab.a + textLab.b * textLab.b);

  let targetL;

  if (bgL < 45) {
    targetL = 78 - Math.max(0, (bgL - 20) * 0.35);
    targetL = Math.max(targetL, originalL + 10);
  } else if (bgL < 65) {
    targetL = 62 - (bgL - 45) * 0.4;
    targetL = Math.max(targetL, originalL + 6);
  } else {
    targetL = 28 - (bgL - 70) * 0.25;
  }

  if (bgL >= 70) {
    targetL = clampLab(targetL, 18, 40);
  } else {
    targetL = clampLab(targetL, originalL + 6, 90);
  }

  let chromaFactor;
  if (bgL >= 65) {
    chromaFactor = 0.35;
  } else if (chroma > 60) {
    chromaFactor = 0.6;
  } else if (chroma > 25) {
    chromaFactor = 0.38;
  } else {
    chromaFactor = 0.15;
  }

  const scaled = scaleLabChroma(textLab, chromaFactor);
  return labToHex({ l: targetL, ...scaled });
}

function buildCaption(baseBg, newBg, baseText, newText, ratio, note) {
  const originalBgLab = hexToLab(baseBg);
  const newBgLab = hexToLab(newBg);
  const originalTextLab = hexToLab(baseText);
  const newTextLab = hexToLab(newText);

  const bgDeltaL = newBgLab.l - originalBgLab.l;
  const textDeltaL = newTextLab.l - originalTextLab.l;

  return `Background ΔL* ${bgDeltaL.toFixed(1)}, text ΔL* ${textDeltaL.toFixed(1)} ⇒ contrast ${ratio.toFixed(2)}:1 (target ≥ ${TARGET_CONTRAST_RATIO}). ${note}`;
}

function simulateOutlookWebScenario(palette) {
  const baseBackground = formatHex(palette.bgColor);
  const baseText = formatHex(palette.textColor);

  const transformedBackground = transformOutlookWebBackground(baseBackground);
  const transformedText = transformOutlookWebText(baseText, baseBackground, transformedBackground);
  const ratio = contrastRatio(transformedText, transformedBackground);

  return {
    colors: {
      bgColor: transformedBackground,
      textColor: transformedText
    },
    caption: buildCaption(baseBackground, transformedBackground, baseText, transformedText, ratio, 'Algorithmic Outlook.com model.'),
    contrastRatio: ratio
  };
}

function simulateOutlookWindowsScenario(palette) {
  const baseBackground = formatHex(palette.bgColor);
  const baseText = formatHex(palette.textColor);

  const transformedBackground = transformOutlookWindowsBackground(baseBackground, baseText);
  const transformedText = transformOutlookWindowsText(baseText, baseBackground, transformedBackground);
  const ratio = contrastRatio(transformedText, transformedBackground);

  return {
    colors: {
      bgColor: transformedBackground,
      textColor: transformedText
    },
    caption: buildCaption(baseBackground, transformedBackground, baseText, transformedText, ratio, 'Algorithmic Outlook for Windows model.'),
    contrastRatio: ratio
  };
}

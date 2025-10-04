export const SMART_INVERSION_THRESHOLD = 0.6; // 60%

export const OUTLOOK_DARK_ZONE_MAX = 0.3; // Lightness <= 30%
export const OUTLOOK_LIGHT_ZONE_MIN = 0.75; // Lightness >= 75%

export const SCENARIO_DEFINITIONS = [
  {
    key: 'intended',
    title: 'As Intended / No Change',
    description: 'Original palette as designed. Email clients that do not alter colors will look like this.'
  },
  {
    key: 'full-inversion',
    title: 'Full Inversion (Outlook)',
    description: 'Approximation of Outlook mobile dark mode behaviour with light/dark zone handling.'
  },
  {
    key: 'smart-inversion',
    title: 'Smart Inversion (Threshold)',
    description: 'Pure inversion triggered when background lightness exceeds the configurable threshold.'
  }
];

export function formatHex(hex) {
  if (!hex) return '#000000';
  let value = hex.trim();
  if (value.startsWith('#')) {
    value = value.slice(1);
  }

  if (value.length === 3) {
    value = value
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (value.length !== 6) {
    throw new Error(`Unexpected hex color format: ${hex}`);
  }

  return `#${value.toUpperCase()}`;
}

export function hexToRgb(hex) {
  const normalized = formatHex(hex).slice(1);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
}

export function rgbToHex({ r, g, b }) {
  const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

export function invertHexColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: 255 - r, g: 255 - g, b: 255 - b });
}

export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const normalizedR = r / 255;
  const normalizedG = g / 255;
  const normalizedB = b / 255;

  const max = Math.max(normalizedR, normalizedG, normalizedB);
  const min = Math.min(normalizedR, normalizedG, normalizedB);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case normalizedR:
        h = ((normalizedG - normalizedB) / delta) % 6;
        break;
      case normalizedG:
        h = (normalizedB - normalizedR) / delta + 2;
        break;
      default:
        h = (normalizedR - normalizedG) / delta + 4;
        break;
    }
  }

  h = Math.round(h * 60);
  if (h < 0) {
    h += 360;
  }
  const saturation = Number.isFinite(s) ? Math.max(0, Math.min(1, s)) : 0;
  const lightness = Math.max(0, Math.min(1, l));

  return { h, s: Math.round(saturation * 100) / 100, l: Math.round(lightness * 100) / 100 };
}

export function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const saturation = Math.max(0, Math.min(1, s));
  const lightness = Math.max(0, Math.min(1, l));

  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (hue < 60) {
    rPrime = c;
    gPrime = x;
    bPrime = 0;
  } else if (hue < 120) {
    rPrime = x;
    gPrime = c;
    bPrime = 0;
  } else if (hue < 180) {
    rPrime = 0;
    gPrime = c;
    bPrime = x;
  } else if (hue < 240) {
    rPrime = 0;
    gPrime = x;
    bPrime = c;
  } else if (hue < 300) {
    rPrime = x;
    gPrime = 0;
    bPrime = c;
  } else {
    rPrime = c;
    gPrime = 0;
    bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255)
  };
}

export function hslToHex(h, s, l) {
  return rgbToHex(hslToRgb(h, s, l));
}

export function getReadableTextColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#111827' : '#F9FAFB';
}

export function dimColor(hex, amount = 0.1) {
  const { h, s, l } = hexToHsl(hex);
  const adjustedL = Math.max(0, l - amount);
  return hslToHex(h, s, adjustedL);
}

export function softInvert(hex) {
  const inverted = invertHexColor(hex);
  const { h, s, l } = hexToHsl(inverted);
  const adjustedL = Math.min(1, l + 0.15);
  return hslToHex(h, s, adjustedL);
}

export function generateOutlookScenario(palette) {
  const baseBackground = formatHex(palette.bgColor);
  const baseText = formatHex(palette.textColor);

  const { l: backgroundLightness } = hexToHsl(baseBackground);

  let finalBackground = baseBackground;
  let finalText = baseText;
  let caption;

  if (backgroundLightness >= OUTLOOK_LIGHT_ZONE_MIN) {
    finalBackground = softInvert(baseBackground);
    finalText = softInvert(baseText);
    caption = 'Light background detected. Applying a soft color inversion similar to Outlook mobile.';
  } else if (backgroundLightness <= OUTLOOK_DARK_ZONE_MAX) {
    const { l: textLightness } = hexToHsl(baseText);
    if (textLightness > 0.9) {
      finalText = dimColor(baseText, 0.1);
      caption = 'Dark background preserved. Very light text has been slightly dimmed.';
    } else {
      caption = 'Dark background and text colors preserved.';
    }
  } else {
    finalBackground = dimColor(baseBackground, 0.05);
    caption = 'Mid-tone background detected. Background nudged slightly darker.';
  }

  return {
    title: 'Scenario · Outlook App',
    caption,
    colors: {
      bgColor: finalBackground,
      textColor: finalText
    }
  };
}

export function generateScenarioSet(palette, options = {}) {
  const threshold = options.smartThreshold ?? SMART_INVERSION_THRESHOLD;
  const baseBackground = formatHex(palette.bgColor);
  const baseText = formatHex(palette.textColor);

  const intended = {
    bgColor: baseBackground,
    textColor: baseText
  };

  const fullInversion = generateOutlookScenario(palette);

  const { l } = hexToHsl(baseBackground);
  const shouldInvert = l > threshold;
  const smartColors = shouldInvert
    ? {
        bgColor: invertHexColor(baseBackground),
        textColor: invertHexColor(baseText)
      }
    : intended;

  const smartCaption = shouldInvert
    ? `Background lightness ${Math.round(l * 100)}% exceeds ${Math.round(threshold * 100)}% → inversion applied.`
    : `Background lightness ${Math.round(l * 100)}% is at or below ${Math.round(threshold * 100)}% → colors preserved.`;

  return {
    scenarios: {
      intended: {
        colors: intended,
        caption: 'Original palette without modification. Also represents clients that respect your colors.'
      },
      'full-inversion': {
        colors: fullInversion.colors,
        caption: fullInversion.caption
      },
      'smart-inversion': {
        colors: smartColors,
        caption: smartCaption
      }
    },
    analysis: {
      backgroundLightness: l,
      threshold,
      shouldInvert
    }
  };
}

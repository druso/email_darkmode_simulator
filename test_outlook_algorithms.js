import { generateScenarioSet } from './public/js/colorTransforms.js';

const TEST_CASES = [
  { name: 'Ultra Light Panel', bgIn: '#F4F4F4', textIn: '#2B2B2B', bgOutWeb: '#2E2E2E', textOutWeb: '#C5C6C7', bgOutWin: '#323232', textOutWin: '#C4C4C5' },
  { name: 'Soft Neutral Body', bgIn: '#E2E3E3', textIn: '#3A3B3C', bgOutWeb: '#373737', textOutWeb: '#BFC0C1', bgOutWin: '#434545', textOutWin: '#C3C3C4' },
  { name: 'Cool Midtone Card', bgIn: '#C8CACC', textIn: '#4A4D50', bgOutWeb: '#434547', textOutWeb: '#BEBFC0', bgOutWin: '#5B5D5F', textOutWin: '#C7C7C8' },
  { name: 'Warm Midtone Banner', bgIn: '#B5B3AF', textIn: '#2F3132', bgOutWeb: '#53514E', textOutWeb: '#BBBCBD', bgOutWin: '#74716D', textOutWin: '#C7C7C8' },
  { name: 'Slate Accent Block', bgIn: '#8A8D90', textIn: '#151617', bgOutWeb: '#66696C', textOutWeb: '#A2A4A7', bgOutWin: '#909396', textOutWin: '#E5E5E6' },
  { name: 'Deep Divider Section', bgIn: '#5A5C5E', textIn: '#ECEDED', bgOutWeb: '#5A5C5E', textOutWeb: '#ECEDED', bgOutWin: '#B6B8BA', textOutWin: '#3B3C3C' },
  { name: 'Low-Contrast Fail', bgIn: '#E0E0E0', textIn: '#8C8C8C', bgOutWeb: '#393939', textOutWeb: '#ECEDED', bgOutWin: '#474747', textOutWin: '#393A3A' },
  { name: 'Saturated Brand Blue', bgIn: '#FFFFFF', textIn: '#0078D4', bgOutWeb: '#292929', textOutWeb: '#5BA4FF', bgOutWin: '#262626', textOutWin: '#5EA6FF' },
  { name: 'Saturated Brand Red', bgIn: '#F0F0F0', textIn: '#D92B2B', bgOutWeb: '#303030', textOutWeb: '#ED6557', bgOutWin: '#373737', textOutWin: '#FF7373' },
  { name: 'Pure White Edge Case', bgIn: '#FFFFFF', textIn: '#222222', bgOutWeb: '#292929', textOutWeb: '#5BA4FF', bgOutWin: '#262626', textOutWin: '#DEDEDE' },
  { name: 'Pure Black Edge Case', bgIn: '#000000', textIn: '#EEEEEE', bgOutWeb: '#000000', textOutWeb: '#D9D9D9', bgOutWin: '#F6F6F6', textOutWin: '#393939' },
  { name: 'Off-White Test', bgIn: '#FEFEFE', textIn: '#222222', bgOutWeb: '#2A2A2A', textOutWeb: '#E1E1E1', bgOutWin: '#272727', textOutWin: '#DEDEDE' },
  { name: 'Off-Black Test', bgIn: '#010101', textIn: '#EEEEEE', bgOutWeb: '#010101', textOutWeb: '#E3E3E3', bgOutWin: '#F3F3F3', textOutWin: '#393939' }
];

function srgbToLinear(channel) {
  const v = channel / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

function rgbToXyz({ r, g, b }) {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return {
    X: (R * 0.4124 + G * 0.3576 + B * 0.1805) * 100,
    Y: (R * 0.2126 + G * 0.7152 + B * 0.0722) * 100,
    Z: (R * 0.0193 + G * 0.1192 + B * 0.9505) * 100
  };
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

function hexToLab(hex) {
  return xyzToLab(rgbToXyz(hexToRgb(hex)));
}

function deltaE(a, b) {
  const dl = a.l - b.l;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

console.log('=== Validating Outlook Web & Outlook Windows models ===\n');

let webPass = 0;
let webFail = 0;
let winPass = 0;
let winFail = 0;

const THRESHOLD_BG = 5;
const THRESHOLD_TEXT = 6;

TEST_CASES.forEach((testCase) => {
  const palette = {
    bgColor: testCase.bgIn,
    textColor: testCase.textIn,
    fontFamily: 'Arial',
    fontWeight: '400',
    text: 'Sample'
  };

  const { scenarios } = generateScenarioSet(palette);
  const web = scenarios['outlook-web'];
  const win = scenarios['outlook-windows'];

  const expectedWebBg = hexToLab(testCase.bgOutWeb);
  const expectedWebText = hexToLab(testCase.textOutWeb);
  const actualWebBg = hexToLab(web.colors.bgColor);
  const actualWebText = hexToLab(web.colors.textColor);

  const webBgDelta = deltaE(actualWebBg, expectedWebBg);
  const webTextDelta = deltaE(actualWebText, expectedWebText);
  const webOk = webBgDelta < THRESHOLD_BG && webTextDelta < THRESHOLD_TEXT;
  if (webOk) {
    webPass += 1;
  } else {
    webFail += 1;
  }
  console.log(`${webOk ? '✓' : '✗'} [Web] ${testCase.name.padEnd(24)} | BG ΔE ${webBgDelta.toFixed(2)} | Text ΔE ${webTextDelta.toFixed(2)}`);

  const expectedWinBg = hexToLab(testCase.bgOutWin);
  const expectedWinText = hexToLab(testCase.textOutWin);
  const actualWinBg = hexToLab(win.colors.bgColor);
  const actualWinText = hexToLab(win.colors.textColor);

  const winBgDelta = deltaE(actualWinBg, expectedWinBg);
  const winTextDelta = deltaE(actualWinText, expectedWinText);
  const winOk = winBgDelta < THRESHOLD_BG && winTextDelta < THRESHOLD_TEXT;
  if (winOk) {
    winPass += 1;
  } else {
    winFail += 1;
  }
  console.log(`${winOk ? '✓' : '✗'} [Win] ${testCase.name.padEnd(24)} | BG ΔE ${winBgDelta.toFixed(2)} | Text ΔE ${winTextDelta.toFixed(2)}`);
});

console.log(`\nOutlook Web: ${webPass} passed, ${webFail} failed`);
console.log(`Outlook Windows: ${winPass} passed, ${winFail} failed`);

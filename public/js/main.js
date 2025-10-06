import {
  formatHex,
  getReadableTextColor,
  generateScenarioSet,
  SCENARIO_DEFINITIONS
} from './colorTransforms.js';
import { FUN_PROMPTS } from './prompts.js';

const paletteList = document.getElementById('paletteList');
const scenariosGrid = document.getElementById('scenariosGrid');
const resetButton = document.getElementById('resetPalettes');

const dragState = {
  card: null,
  originIndex: null,
  startY: 0,
  placeholder: null,
  pointerId: null
};

const FONT_OPTIONS = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica Neue', value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" }
];

const FONT_WEIGHT_OPTIONS = [
  { label: 'Regular (400)', value: '400' },
  { label: 'Medium (500)', value: '500' },
  { label: 'Semi-bold (600)', value: '600' },
  { label: 'Bold (700)', value: '700' },
  { label: 'Extra-bold (800)', value: '800' }
];

const getRandomPrompt = () => FUN_PROMPTS[Math.floor(Math.random() * FUN_PROMPTS.length)];

const MAX_SCENARIO_IMAGE_HEIGHT = 300;
const SCENARIO_IMAGE_PADDING = 5;

const createDefaultDraft = () => ({
  bgColor: '#ffffff',
  textColor: '#333333',
  fontFamily: FONT_OPTIONS[0].value,
  fontWeight: FONT_WEIGHT_OPTIONS[0].value,
  text: getRandomPrompt(),
  imageData: null
});

let palettes = [];
let paletteCounter = 0;
let draftPalette = createDefaultDraft();
let sampleHeightGroups = [];
let scenarioImageEntries = [];

function loadImageData(file, callback) {
  if (!file) {
    callback(null);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    callback(typeof reader.result === 'string' ? reader.result : null);
  };
  reader.onerror = () => {
    callback(null);
  };
  reader.readAsDataURL(file);
}

function updateImagePreview(preview, imageData, backgroundColor) {
  if (!preview) {
    return;
  }

  preview.style.backgroundColor = backgroundColor ?? 'transparent';

  if (imageData) {
    preview.style.backgroundImage = `url(${imageData})`;
    preview.classList.remove('palette-rail__thumb--empty');
  } else {
    preview.style.backgroundImage = '';
    preview.classList.add('palette-rail__thumb--empty');
  }
}

function layoutScenarioImage(entry) {
  const { wrapper, image } = entry;
  if (!wrapper || !image || !image.naturalWidth || !image.naturalHeight) {
    return;
  }

  const availableWidth = wrapper.clientWidth - SCENARIO_IMAGE_PADDING * 2;
  if (availableWidth <= 0) {
    return;
  }

  const scaledHeight = (image.naturalHeight / image.naturalWidth) * availableWidth;
  const availableHeight = MAX_SCENARIO_IMAGE_HEIGHT - SCENARIO_IMAGE_PADDING * 2;

  if (!Number.isFinite(scaledHeight) || scaledHeight <= 0) {
    return;
  }

  if (scaledHeight > availableHeight) {
    wrapper.style.height = `${MAX_SCENARIO_IMAGE_HEIGHT}px`;
    image.style.marginTop = `${(availableHeight - scaledHeight) / 2}px`;
  } else {
    wrapper.style.height = `${scaledHeight + SCENARIO_IMAGE_PADDING * 2}px`;
    image.style.marginTop = '0';
  }
}

function layoutScenarioImages() {
  window.requestAnimationFrame(() => {
    scenarioImageEntries.forEach((entry) => {
      layoutScenarioImage(entry);
    });
  });
}

function registerScenarioImage(wrapper, image) {
  const entry = { wrapper, image };
  scenarioImageEntries.push(entry);

  const applyLayout = () => layoutScenarioImage(entry);

  if (image.complete && image.naturalWidth) {
    window.requestAnimationFrame(applyLayout);
  } else {
    image.addEventListener('load', () => window.requestAnimationFrame(applyLayout), { once: true });
  }
}

function resetDraftPalette() {
  draftPalette = createDefaultDraft();
}

function parseHexInput(value) {
  if (typeof value !== 'string') return null;
  let raw = value.trim();
  if (!raw) return null;
  if (raw.startsWith('#')) {
    raw = raw.slice(1);
  }

  if (raw.length !== 3 && raw.length !== 6) {
    return null;
  }

  const hexPattern = /^[0-9a-fA-F]+$/;
  if (!hexPattern.test(raw)) {
    return null;
  }

  let normalized = raw.length === 3 ? raw.split('').map((char) => char + char).join('') : raw;
  return `#${normalized.toUpperCase()}`;
}

function setFieldValidity(input, isValid) {
  if (!input) return;
  input.classList.toggle('invalid', !isValid);
  input.setAttribute('aria-invalid', (!isValid).toString());
}

function populateSelect(select, options, currentValue) {
  select.innerHTML = '';
  options.forEach((option) => {
    const optionEl = document.createElement('option');
    optionEl.value = option.value;
    optionEl.textContent = option.label;
    if (option.value === currentValue) {
      optionEl.selected = true;
    }
    select.appendChild(optionEl);
  });
}

function createHexPill(label, hex) {
  const formatted = formatHex(hex);
  const pill = document.createElement('span');
  pill.className = 'hex-pill';
  pill.textContent = `${label}: ${formatted}`;
  pill.style.setProperty('--swatch-color', formatted);
  pill.style.color = getReadableTextColor(formatted);
  return pill;
}

function bindColorControls({ picker, hexInput, getColor, setColor, onValidChange }) {
  const applyValue = (value) => {
    picker.value = value;
    hexInput.value = value;
    setFieldValidity(hexInput, true);
  };

  applyValue(getColor());

  picker.addEventListener('input', () => {
    const formatted = formatHex(picker.value);
    setColor(formatted);
    applyValue(formatted);
    onValidChange();
  });

  hexInput.addEventListener('input', () => {
    const parsed = parseHexInput(hexInput.value);
    if (parsed) {
      setColor(parsed);
      applyValue(parsed);
      onValidChange();
    } else {
      setFieldValidity(hexInput, false);
    }
  });

  hexInput.addEventListener('blur', () => {
    const parsed = parseHexInput(hexInput.value);
    if (!parsed) {
      applyValue(getColor());
    }
  });
}

function updateAddButtonState(card) {
  const addButton = card.querySelector('[data-action="add"]');
  if (!addButton) {
    return;
  }
  const invalidHex = card.querySelector('.hex-pill-input.invalid, .hex-input.invalid');
  addButton.disabled = Boolean(invalidHex);
}

function createBuilderCard() {
  const card = document.createElement('article');
  card.className = 'palette-rail palette-rail--builder';
  card.innerHTML = `
    <div class="palette-rail__label">New Palette</div>
    <div class="palette-rail__group">
      <label class="sr-only" for="builderBg">Background</label>
      <input id="builderBg" type="color" data-role="bgPicker" aria-label="Background color picker" />
      <input type="text" class="hex-pill-input hex-input" data-role="bgHex" aria-label="Background hex value" maxlength="7" placeholder="#FFFFFF" />
    </div>
    <div class="palette-rail__group">
      <label class="sr-only" for="builderText">Text</label>
      <input id="builderText" type="color" data-role="textPicker" aria-label="Text color picker" />
      <input type="text" class="hex-pill-input hex-input" data-role="textHex" aria-label="Text hex value" maxlength="7" placeholder="#111827" />
    </div>
    <div class="palette-rail__group">
      <label class="sr-only" for="builderFamily">Font family</label>
      <select id="builderFamily" data-role="fontFamily" aria-label="Font family"></select>
    </div>
    <div class="palette-rail__group">
      <label class="sr-only" for="builderWeight">Font weight</label>
      <select id="builderWeight" data-role="fontWeight" aria-label="Font weight"></select>
    </div>
    <div class="palette-rail__group palette-rail__group--image">
      <div class="palette-rail__thumb palette-rail__thumb--empty" data-role="imagePreview"></div>
      <label class="sr-only" for="builderImage">Palette image</label>
      <input id="builderImage" class="palette-rail__file" type="file" accept="image/*" data-role="imageInput" />
    </div>
    <div class="palette-rail__actions">
      <button type="button" data-action="chooseImage">Image</button>
      <button type="button" data-action="clearImage">Clear Img</button>
      <button type="button" class="primary" data-action="add">Add</button>
    </div>
  `;

  const bgPicker = card.querySelector('[data-role="bgPicker"]');
  const bgHex = card.querySelector('[data-role="bgHex"]');
  const textPicker = card.querySelector('[data-role="textPicker"]');
  const textHex = card.querySelector('[data-role="textHex"]');
  const fontFamilySelect = card.querySelector('[data-role="fontFamily"]');
  const fontWeightSelect = card.querySelector('[data-role="fontWeight"]');
  const imagePreview = card.querySelector('[data-role="imagePreview"]');
  const imageInput = card.querySelector('[data-role="imageInput"]');
  const chooseImageButton = card.querySelector('[data-action="chooseImage"]');
  const clearImageButton = card.querySelector('[data-action="clearImage"]');
  const addButton = card.querySelector('[data-action="add"]');

  populateSelect(fontFamilySelect, FONT_OPTIONS, draftPalette.fontFamily);
  populateSelect(fontWeightSelect, FONT_WEIGHT_OPTIONS, draftPalette.fontWeight);
  updateImagePreview(imagePreview, draftPalette.imageData, draftPalette.bgColor);
  clearImageButton.disabled = !draftPalette.imageData;

  bindColorControls({
    picker: bgPicker,
    hexInput: bgHex,
    getColor: () => draftPalette.bgColor,
    setColor: (value) => {
      draftPalette.bgColor = value;
    },
    onValidChange: () => {
      updateAddButtonState(card);
      updateImagePreview(imagePreview, draftPalette.imageData, draftPalette.bgColor);
    }
  });

  bindColorControls({
    picker: textPicker,
    hexInput: textHex,
    getColor: () => draftPalette.textColor,
    setColor: (value) => {
      draftPalette.textColor = value;
    },
    onValidChange: () => updateAddButtonState(card)
  });

  fontFamilySelect.addEventListener('change', () => {
    draftPalette.fontFamily = fontFamilySelect.value;
    updateAddButtonState(card);
  });

  fontWeightSelect.addEventListener('change', () => {
    draftPalette.fontWeight = fontWeightSelect.value;
    updateAddButtonState(card);
  });

  chooseImageButton.addEventListener('click', () => {
    imageInput?.click();
  });

  imageInput?.addEventListener('change', () => {
    const file = imageInput.files?.[0] ?? null;
    loadImageData(file, (data) => {
      draftPalette.imageData = data;
      updateImagePreview(imagePreview, draftPalette.imageData, draftPalette.bgColor);
      clearImageButton.disabled = !draftPalette.imageData;
      updateAddButtonState(card);
    });
    imageInput.value = '';
  });

  clearImageButton.addEventListener('click', () => {
    draftPalette.imageData = null;
    updateImagePreview(imagePreview, draftPalette.imageData, draftPalette.bgColor);
    clearImageButton.disabled = true;
    if (imageInput) {
      imageInput.value = '';
    }
    updateAddButtonState(card);
  });

  addButton.addEventListener('click', () => {
    const nextPalette = {
      id: ++paletteCounter,
      ...draftPalette,
      text: getRandomPrompt()
    };
    palettes.push(nextPalette);
    resetDraftPalette();
    renderPaletteList();
    renderScenarios();
  });

  updateAddButtonState(card);
  return card;
}

function createPaletteCard(palette, index) {
  const card = document.createElement('article');
  card.className = 'palette-rail';
  card.dataset.paletteId = String(palette.id);
  card.innerHTML = `
    <button type="button" class="palette-rail__drag" aria-label="Drag palette ${index + 1}">
      <span class="palette-rail__handle">Palette ${index + 1}</span>
    </button>
    <div class="palette-rail__group">
      <label class="sr-only" for="paletteBg${palette.id}">Background</label>
      <input id="paletteBg${palette.id}" type="color" data-role="bgPicker" aria-label="Background color picker" />
      <input type="text" class="hex-pill-input hex-input" data-role="bgHex" aria-label="Background hex value" maxlength="7" />
    </div>
    <div class="palette-rail__group">
      <label class="sr-only" for="paletteText${palette.id}">Text</label>
      <input id="paletteText${palette.id}" type="color" data-role="textPicker" aria-label="Text color picker" />
      <input type="text" class="hex-pill-input hex-input" data-role="textHex" aria-label="Text hex value" maxlength="7" />
    </div>
    <div class="palette-rail__group">
      <label class="sr-only" for="paletteFamily${palette.id}">Font family</label>
      <select id="paletteFamily${palette.id}" data-role="fontFamily" aria-label="Font family"></select>
    </div>
    <div class="palette-rail__group">
      <label class="sr-only" for="paletteWeight${palette.id}">Font weight</label>
      <select id="paletteWeight${palette.id}" data-role="fontWeight" aria-label="Font weight"></select>
    </div>
    <div class="palette-rail__group palette-rail__group--image">
      <div class="palette-rail__thumb palette-rail__thumb--empty" data-role="imagePreview"></div>
      <label class="sr-only" for="paletteImage${palette.id}">Palette image</label>
      <input id="paletteImage${palette.id}" class="palette-rail__file" type="file" accept="image/*" data-role="imageInput" />
    </div>
    <div class="palette-rail__actions">
      <button type="button" data-action="chooseImage">Image</button>
      <button type="button" data-action="clearImage">Clear Img</button>
      <button type="button" data-action="remove" aria-label="Remove palette ${index + 1}">Remove</button>
    </div>
  `;

  const bgPicker = card.querySelector('[data-role="bgPicker"]');
  const bgHex = card.querySelector('[data-role="bgHex"]');
  const textPicker = card.querySelector('[data-role="textPicker"]');
  const textHex = card.querySelector('[data-role="textHex"]');
  const fontFamilySelect = card.querySelector('[data-role="fontFamily"]');
  const fontWeightSelect = card.querySelector('[data-role="fontWeight"]');
  const imagePreview = card.querySelector('[data-role="imagePreview"]');
  const imageInput = card.querySelector('[data-role="imageInput"]');
  const chooseImageButton = card.querySelector('[data-action="chooseImage"]');
  const clearImageButton = card.querySelector('[data-action="clearImage"]');
  const removeButton = card.querySelector('[data-action="remove"]');
  const dragHandle = card.querySelector('.palette-rail__drag');

  populateSelect(fontFamilySelect, FONT_OPTIONS, palette.fontFamily);
  populateSelect(fontWeightSelect, FONT_WEIGHT_OPTIONS, palette.fontWeight);
  updateImagePreview(imagePreview, palette.imageData, palette.bgColor);
  clearImageButton.disabled = !palette.imageData;

  bindColorControls({
    picker: bgPicker,
    hexInput: bgHex,
    getColor: () => palette.bgColor,
    setColor: (value) => {
      palette.bgColor = value;
    },
    onValidChange: () => {
      renderScenarios();
      updateImagePreview(imagePreview, palette.imageData, palette.bgColor);
    }
  });

  bindColorControls({
    picker: textPicker,
    hexInput: textHex,
    getColor: () => palette.textColor,
    setColor: (value) => {
      palette.textColor = value;
    },
    onValidChange: () => {
      renderScenarios();
    }
  });

  fontFamilySelect.addEventListener('change', () => {
    palette.fontFamily = fontFamilySelect.value;
    renderScenarios();
  });

  fontWeightSelect.addEventListener('change', () => {
    palette.fontWeight = fontWeightSelect.value;
    renderScenarios();
  });

  dragHandle.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    card.setPointerCapture(event.pointerId);
    dragState.card = card;
    dragState.originIndex = index;
    dragState.startY = event.clientY;
    dragState.pointerId = event.pointerId;

    dragState.placeholder = document.createElement('div');
    dragState.placeholder.className = 'palette-rail palette-rail--placeholder';
    dragState.placeholder.style.height = `${card.getBoundingClientRect().height}px`;

    paletteList.insertBefore(dragState.placeholder, card.nextSibling);

    card.classList.add('palette-rail--dragging');
  });

  card.addEventListener('pointermove', (event) => {
    if (dragState.card !== card || dragState.pointerId !== event.pointerId) {
      return;
    }

    const delta = event.clientY - dragState.startY;
    card.style.transform = `translateY(${delta}px)`;

    const rails = Array.from(
      paletteList.querySelectorAll('.palette-rail:not(.palette-rail--builder):not(.palette-rail--dragging)')
    );

    let insertBeforeNode = null;
    for (const rail of rails) {
      const rect = rail.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (event.clientY < midpoint) {
        insertBeforeNode = rail;
        break;
      }
    }

    if (insertBeforeNode) {
      paletteList.insertBefore(dragState.placeholder, insertBeforeNode);
    } else {
      paletteList.appendChild(dragState.placeholder);
    }
  });

  const finalizeDrag = () => {
    if (dragState.card !== card) {
      return;
    }

    card.style.transform = '';
    card.classList.remove('palette-rail--dragging');

    const nodes = Array.from(paletteList.children);
    const placeholderIndex = nodes.indexOf(dragState.placeholder);

    if (placeholderIndex > 0) {
      const newIndex = placeholderIndex - 1; // offset for builder card
      if (newIndex !== dragState.originIndex) {
        movePalette(dragState.originIndex, newIndex - dragState.originIndex);
      } else {
        renderPaletteList();
      }
    }

    dragState.placeholder?.remove();
    dragState.card = null;
    dragState.originIndex = null;
    dragState.pointerId = null;
    dragState.placeholder = null;
  };

  card.addEventListener('pointerup', (event) => {
    if (dragState.card === card && dragState.pointerId === event.pointerId) {
      card.releasePointerCapture(event.pointerId);
      finalizeDrag();
    }
  });

  card.addEventListener('pointercancel', () => {
    finalizeDrag();
  });

  chooseImageButton.addEventListener('click', () => {
    imageInput?.click();
  });

  imageInput?.addEventListener('change', () => {
    const file = imageInput.files?.[0] ?? null;
    loadImageData(file, (data) => {
      palette.imageData = data;
      updateImagePreview(imagePreview, palette.imageData, palette.bgColor);
      clearImageButton.disabled = !palette.imageData;
      renderScenarios();
    });
    imageInput.value = '';
  });

  clearImageButton.addEventListener('click', () => {
    palette.imageData = null;
    updateImagePreview(imagePreview, palette.imageData, palette.bgColor);
    clearImageButton.disabled = true;
    if (imageInput) {
      imageInput.value = '';
    }
    renderScenarios();
  });

  removeButton.addEventListener('click', () => {
    removePalette(palette.id);
  });

  return card;
}

function renderPaletteList() {
  paletteList.innerHTML = '';

  const builderCard = createBuilderCard();
  paletteList.appendChild(builderCard);

  if (!palettes.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Add palettes to build your comparison queue.';
    paletteList.appendChild(empty);
    return;
  }

  palettes.forEach((palette, index) => {
    const card = createPaletteCard(palette, index);
    paletteList.appendChild(card);
  });
}

function applyEqualHeights() {
  if (!sampleHeightGroups.length) {
    return;
  }

  window.requestAnimationFrame(() => {
    sampleHeightGroups.forEach((group) => {
      const elements = group.filter(Boolean);
      if (!elements.length) return;

      elements.forEach((element) => {
        element.style.minHeight = '';
      });

      const maxHeight = Math.max(...elements.map((element) => element.getBoundingClientRect().height));

      elements.forEach((element) => {
        element.style.minHeight = `${maxHeight}px`;
      });
    });
  });
}

function storeSampleGroups(groups) {
  sampleHeightGroups = groups.map((group) => group.filter(Boolean));
  applyEqualHeights();
}

window.addEventListener('resize', () => {
  applyEqualHeights();
  layoutScenarioImages();
});

function renderScenarios() {
  scenariosGrid.innerHTML = '';
  scenarioImageEntries = [];

  if (!palettes.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Add at least one palette to preview how each scenario behaves.';
    scenariosGrid.appendChild(empty);
    sampleHeightGroups = [];
    return;
  }

  const sampleGroups = palettes.map(() => []);

  SCENARIO_DEFINITIONS.forEach((definition) => {
    const column = document.createElement('section');
    column.className = 'scenario-column';
    column.dataset.scenario = definition.key;

    const header = document.createElement('header');
    const title = document.createElement('h3');
    title.textContent = definition.title;
    const caption = document.createElement('p');
    caption.textContent = definition.description;
    header.appendChild(title);
    header.appendChild(caption);

    const board = document.createElement('div');
    board.className = 'scenario-board';

    palettes.forEach((palette, index) => {
      const { scenarios, analysis } = generateScenarioSet(palette);
      const scenario = scenarios[definition.key];

      const sample = document.createElement('div');
      sample.className = 'scenario-sample';
      sample.dataset.paletteId = palette.id;
      sample.style.backgroundColor = scenario.colors.bgColor;
      sample.style.color = scenario.colors.textColor;

      const labelRow = document.createElement('div');
      labelRow.className = 'scenario-label-row';
      labelRow.textContent = `Palette ${index + 1} · Lightness ${Math.round(analysis.backgroundLightness * 100)}%`;

      const textWrapper = document.createElement('div');
      textWrapper.className = 'scenario-text';
      const text = document.createElement('p');
      text.textContent = palette.text;
      text.style.fontFamily = palette.fontFamily;
      text.style.fontWeight = palette.fontWeight;
      textWrapper.appendChild(text);

      if (palette.imageData) {
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'scenario-image';
        const image = document.createElement('img');
        image.className = 'scenario-image__media';
        image.alt = `Palette ${index + 1} logo`; 
        image.src = palette.imageData;
        imageWrapper.style.backgroundColor = scenario.colors.bgColor;
        image.style.marginTop = '0';
        imageWrapper.appendChild(image);
        registerScenarioImage(imageWrapper, image);
        sample.appendChild(imageWrapper);
      }

      const hexRow = document.createElement('div');
      hexRow.className = 'scenario-hex-row';
      hexRow.appendChild(createHexPill('BG', scenario.colors.bgColor));
      hexRow.appendChild(createHexPill('Text', scenario.colors.textColor));

      const captionEl = document.createElement('p');
      captionEl.className = 'scenario-caption';
      captionEl.textContent = scenario.caption;

      sample.appendChild(labelRow);
      sample.appendChild(textWrapper);
      sample.appendChild(hexRow);
      sample.appendChild(captionEl);

      board.appendChild(sample);
      sampleGroups[index].push(sample);
    });

    column.appendChild(header);
    column.appendChild(board);

    scenariosGrid.appendChild(column);
  });

  storeSampleGroups(sampleGroups);
  layoutScenarioImages();
}

function movePalette(index, delta) {
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= palettes.length) {
    return;
  }

  const [removed] = palettes.splice(index, 1);
  palettes.splice(newIndex, 0, removed);
  renderPaletteList();
  renderScenarios();
}

function removePalette(id) {
  palettes = palettes.filter((palette) => palette.id !== id);
  renderPaletteList();
  renderScenarios();
}

function handleReset() {
  palettes = [];
  resetDraftPalette();
  renderPaletteList();
  renderScenarios();
}

if (resetButton) {
  resetButton.addEventListener('click', handleReset);
}

renderPaletteList();
renderScenarios();

// PNG export with color legend (V2 §8, V3 §11).
//
// Captures the keyboard DOM node with html2canvas, builds the per-zone color
// legend as an off-screen DOM element captured separately, then composites
// both onto a single canvas via drawImage and triggers a download. The final
// canvas is painted with the current --ws-bg value (never transparent).
//
// In comparison mode (V3 §11) both boards (A above B) and both legends are
// stacked onto one canvas.

import html2canvas from 'html2canvas';
import { ZONES } from '../data/zones.js';
import layouts from '../data/layouts/index.js';
import { DEFAULT_KEY_COLOR } from '../hooks/useColorway.js';

// Render at 2x for crisp output on hi-dpi displays.
const SCALE = 2;
const PAD = 24;
const BOARD_LEGEND_GAP = 16;

function resolveSvg(boardEl) {
  const svgEl =
    boardEl.tagName.toLowerCase() === 'svg' ? boardEl : boardEl.querySelector('svg');
  if (!svgEl) throw new Error('Keyboard SVG not available');
  return svgEl;
}

function readTokens(svgEl) {
  const cs = getComputedStyle(svgEl);
  return {
    bg: cs.getPropertyValue('--ws-bg').trim() || '#111111',
    labelColor: cs.getPropertyValue('--ws-label').trim() || '#e8e8e8',
    borderColor:
      cs.getPropertyValue('--ws-key-border').trim() || 'rgba(255,255,255,0.12)',
  };
}

// Capture a board wrapper. Transparent background — the composite paints
// --ws-bg. Transient selection rings are skipped via the data marker.
function captureBoard(boardEl) {
  return html2canvas(boardEl, {
    backgroundColor: null,
    scale: SCALE,
    logging: false,
    ignoreElements: (el) =>
      typeof el.hasAttribute === 'function' && el.hasAttribute('data-selection-ring'),
  });
}

// Build the legend off-screen (sized to its board's width) and capture it.
async function captureLegend(boardLike, svgEl, { labelColor, borderColor }) {
  const boardWidthPx = parseFloat(svgEl.getAttribute('width'));
  const legendEl = buildLegendElement(boardLike, { labelColor, borderColor, boardWidthPx });
  document.body.appendChild(legendEl);
  try {
    return await html2canvas(legendEl, {
      backgroundColor: null,
      scale: SCALE,
      logging: false,
    });
  } finally {
    legendEl.remove();
  }
}

export async function exportPng(boardEl, state) {
  if (!boardEl) throw new Error('Keyboard not available');

  const svgEl = resolveSvg(boardEl);
  const tokens = readTokens(svgEl);

  const boardCanvas = await captureBoard(boardEl);
  const legendCanvas = await captureLegend(state, svgEl, tokens);

  // Composite board + legend onto one canvas over the workspace background.
  const pad = PAD * SCALE;
  const gap = BOARD_LEGEND_GAP * SCALE;
  const contentW = Math.max(boardCanvas.width, legendCanvas.width);

  const out = document.createElement('canvas');
  out.width = contentW + pad * 2;
  out.height = pad + boardCanvas.height + gap + legendCanvas.height + pad;

  const ctx = out.getContext('2d');
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(boardCanvas, pad, pad);
  ctx.drawImage(legendCanvas, pad, pad + boardCanvas.height + gap);

  const url = out.toDataURL('image/png');
  triggerDownload(url, `${slugify(state.colorwayName)}-${state.layout}.png`);
}

// Comparison export (V3 §11): A board + legend stacked above B board + legend.
// `state.comparison.board` supplies B. Filename: {aName}-vs-{bName}.png.
export async function exportComparisonPng(boardElA, boardElB, state) {
  if (!boardElA || !boardElB) throw new Error('Both comparison boards must be available');
  const b = state.comparison?.board;
  if (!b) throw new Error('No comparison board (B) set');

  const svgA = resolveSvg(boardElA);
  const svgB = resolveSvg(boardElB);
  const tokens = readTokens(svgA);

  const aBoard = await captureBoard(boardElA);
  const aLegend = await captureLegend(state, svgA, tokens);
  const bBoard = await captureBoard(boardElB);
  const bLegend = await captureLegend(b, svgB, tokens);

  const pad = PAD * SCALE;
  const gap = BOARD_LEGEND_GAP * SCALE;
  const sectionGap = PAD * 2 * SCALE; // larger gap between the A and B blocks
  const contentW = Math.max(aBoard.width, aLegend.width, bBoard.width, bLegend.width);

  const out = document.createElement('canvas');
  out.width = contentW + pad * 2;
  out.height =
    pad +
    aBoard.height + gap + aLegend.height +
    sectionGap +
    bBoard.height + gap + bLegend.height +
    pad;

  const ctx = out.getContext('2d');
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, out.width, out.height);

  let y = pad;
  ctx.drawImage(aBoard, pad, y);
  y += aBoard.height + gap;
  ctx.drawImage(aLegend, pad, y);
  y += aLegend.height + sectionGap;
  ctx.drawImage(bBoard, pad, y);
  y += bBoard.height + gap;
  ctx.drawImage(bLegend, pad, y);

  const url = out.toDataURL('image/png');
  triggerDownload(url, `${slugify(state.colorwayName)}-vs-${slugify(b.name)}.png`);
}

// ── Legend ───────────────────────────────────────────────────────────────

// One entry per zone present in the layout, each with the unique colors used in
// that zone in first-seen order, ordered by the ZONES declaration.
function collectZones(layout, keyColors) {
  const keys = layouts[layout] ?? [];
  const byZone = new Map();
  for (const k of keys) {
    const color = (keyColors[k.id] ?? DEFAULT_KEY_COLOR).toLowerCase();
    if (!byZone.has(k.zone)) byZone.set(k.zone, []);
    const colors = byZone.get(k.zone);
    if (!colors.includes(color)) colors.push(color);
  }
  const result = [];
  for (const zoneKey of Object.keys(ZONES)) {
    if (byZone.has(zoneKey)) {
      result.push({ label: ZONES[zoneKey].label, colors: byZone.get(zoneKey) });
    }
  }
  return result;
}

// Build the off-screen legend DOM. Constrained to the board width so swatch
// rows wrap to roughly the same footprint as the keyboard above them. `board`
// is any object with { layout, keyColors } (live state or a B snapshot).
function buildLegendElement(board, { labelColor, borderColor, boardWidthPx }) {
  const zones = collectZones(board.layout, board.keyColors);

  const root = document.createElement('div');
  Object.assign(root.style, {
    position: 'absolute',
    left: '-9999px',
    top: '0',
    width: `${boardWidthPx}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: 'transparent',
  });

  for (const zone of zones) {
    const block = document.createElement('div');
    Object.assign(block.style, { display: 'flex', flexDirection: 'column', gap: '8px' });

    const label = document.createElement('div');
    label.textContent = zone.label;
    Object.assign(label.style, { color: labelColor, fontWeight: '600', fontSize: '14px' });
    block.appendChild(label);

    const row = document.createElement('div');
    Object.assign(row.style, { display: 'flex', flexWrap: 'wrap', gap: '14px' });

    for (const color of zone.colors) {
      const item = document.createElement('div');
      Object.assign(item.style, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      });

      const swatch = document.createElement('div');
      Object.assign(swatch.style, {
        width: '20px',
        height: '20px',
        background: color,
        border: `1px solid ${borderColor}`,
        borderRadius: '4px',
        boxSizing: 'border-box',
      });

      const hex = document.createElement('div');
      hex.textContent = color.toUpperCase();
      Object.assign(hex.style, {
        fontSize: '11px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        color: labelColor,
      });

      item.appendChild(swatch);
      item.appendChild(hex);
      row.appendChild(item);
    }

    block.appendChild(row);
    root.appendChild(block);
  }

  return root;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function triggerDownload(href, filename) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function slugify(name) {
  const slug = (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'colorway';
}

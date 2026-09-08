// PNG and SVG downloads. The board is rasterised from its own SVG at 2x, then
// a per-zone color legend is painted beneath it. Comparison mode stacks board
// A + legend above board B + legend.
import { ZONES } from '../data/zones.js';
import layouts from '../data/layouts/index.js';
import { DEFAULT_KEY_COLOR } from './designStore.js';
import { boardToSvg, canvasToBlob, readBoardTokens, svgToCanvas } from './exportSvg.js';
import { downloadBlob, downloadText, slugify } from './download.js';

// Render at 2x for crisp output on hi-dpi displays.
const SCALE = 2;
const PAD = 24;
const BOARD_LEGEND_GAP = 16;

// Legend geometry in CSS px (scaled when painted).
const LEGEND = {
  labelSize: 14, labelGap: 8, swatch: 20, hexSize: 11, hexGap: 4,
  itemWidth: 58, itemGap: 12, rowGap: 10, zoneGap: 16,
};
const ROW_HEIGHT = LEGEND.swatch + LEGEND.hexGap + LEGEND.hexSize + LEGEND.rowGap;

// One entry per zone present in the layout, each with the unique colors used
// in that zone in first-seen order, ordered by the ZONES declaration.
export function collectZones(layout, keyColors) {
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
    if (byZone.has(zoneKey)) result.push({ label: ZONES[zoneKey].label, colors: byZone.get(zoneKey) });
  }
  return result;
}

// Wraps swatch rows to the board width; returns blocks with y offsets (CSS px).
export function layoutLegend(zones, width) {
  const perRow = Math.max(1, Math.floor((width + LEGEND.itemGap) / (LEGEND.itemWidth + LEGEND.itemGap)));
  const blocks = [];
  let y = 0;
  for (const zone of zones) {
    const rows = Math.ceil(zone.colors.length / perRow);
    blocks.push({ label: zone.label, colors: zone.colors, y, perRow });
    y += LEGEND.labelSize + LEGEND.labelGap + rows * ROW_HEIGHT + LEGEND.zoneGap;
  }
  return { blocks, height: Math.max(0, y - LEGEND.zoneGap) };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function paintLegend(ctx, legend, x0, y0, scale, { labelColor, borderColor }) {
  const s = (v) => v * scale;
  for (const block of legend.blocks) {
    let y = y0 + s(block.y);
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillStyle = labelColor;
    ctx.font = `600 ${s(LEGEND.labelSize)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(block.label, x0, y);
    y += s(LEGEND.labelSize + LEGEND.labelGap);
    block.colors.forEach((color, i) => {
      const col = i % block.perRow;
      const row = Math.floor(i / block.perRow);
      const x = x0 + col * s(LEGEND.itemWidth + LEGEND.itemGap);
      const yy = y + row * s(ROW_HEIGHT);
      const sx = x + (s(LEGEND.itemWidth) - s(LEGEND.swatch)) / 2;
      roundRect(ctx, sx, yy, s(LEGEND.swatch), s(LEGEND.swatch), s(4));
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = Math.max(1, scale);
      ctx.stroke();
      ctx.fillStyle = labelColor;
      ctx.font = `${s(LEGEND.hexSize)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(color.toUpperCase(), x + s(LEGEND.itemWidth) / 2, yy + s(LEGEND.swatch + LEGEND.hexGap));
      ctx.textAlign = 'left';
    });
  }
}

async function renderBoard(boardEl) {
  return svgToCanvas(boardToSvg(boardEl, { scale: SCALE }));
}

export async function exportPng(boardEl, state, { transparent = false } = {}) {
  const tokens = readBoardTokens(boardEl);
  const board = await renderBoard(boardEl);
  const legend = layoutLegend(collectZones(state.layout, state.keyColors), board.width / SCALE);
  const pad = PAD * SCALE;
  const gap = BOARD_LEGEND_GAP * SCALE;

  const out = document.createElement('canvas');
  out.width = board.width + pad * 2;
  out.height = pad + board.height + gap + legend.height * SCALE + pad;
  const ctx = out.getContext('2d');
  if (!transparent) {
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, out.width, out.height);
  }
  ctx.drawImage(board, pad, pad);
  paintLegend(ctx, legend, pad, pad + board.height + gap, SCALE, tokens);
  downloadBlob(await canvasToBlob(out), `${slugify(state.colorwayName)}-${state.layout}.png`);
}

// Comparison export: A board + legend stacked above B board + legend.
export async function exportComparisonPng(boardElA, boardElB, state, { transparent = false } = {}) {
  if (!boardElA || !boardElB) throw new Error('Both comparison boards must be available');
  const b = state.comparison?.board;
  if (!b) throw new Error('No comparison board set');
  const tokens = readBoardTokens(boardElA);
  const [aBoard, bBoard] = await Promise.all([renderBoard(boardElA), renderBoard(boardElB)]);
  const aLegend = layoutLegend(collectZones(state.layout, state.keyColors), aBoard.width / SCALE);
  const bLegend = layoutLegend(collectZones(b.layout, b.keyColors), bBoard.width / SCALE);
  const pad = PAD * SCALE;
  const gap = BOARD_LEGEND_GAP * SCALE;
  const sectionGap = PAD * 2 * SCALE;

  const out = document.createElement('canvas');
  out.width = Math.max(aBoard.width, bBoard.width) + pad * 2;
  out.height = pad + aBoard.height + gap + aLegend.height * SCALE + sectionGap
    + bBoard.height + gap + bLegend.height * SCALE + pad;
  const ctx = out.getContext('2d');
  if (!transparent) {
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, out.width, out.height);
  }
  let y = pad;
  ctx.drawImage(aBoard, pad, y);
  y += aBoard.height + gap;
  paintLegend(ctx, aLegend, pad, y, SCALE, tokens);
  y += aLegend.height * SCALE + sectionGap;
  ctx.drawImage(bBoard, pad, y);
  y += bBoard.height + gap;
  paintLegend(ctx, bLegend, pad, y, SCALE, tokens);
  downloadBlob(await canvasToBlob(out), `${slugify(state.colorwayName)}-vs-${slugify(b.name)}.png`);
}

export function exportSvg(boardEl, state, { transparent = false } = {}) {
  const tokens = readBoardTokens(boardEl);
  const svg = boardToSvg(boardEl, { scale: 1, background: transparent ? null : tokens.bg });
  downloadText(svg, `${slugify(state.colorwayName)}-${state.layout}.svg`, 'image/svg+xml');
}

// Key outlines as rounded SVG paths. Plain keys are rectangles; `shape:
// "isoEnter"` keys are an L whose top row extends `lip` units to the left.
// Insets shrink the outline per side (negative values grow it), which gives
// the top surface, the sidewall, and the selection rings from one function.

const round2 = (v) => Math.round(v * 100) / 100;

// Clockwise corner points of a key's footprint in px.
export function keyPolygon(key, unit, gap, { top = 0, side = 0, bottom = 0 } = {}) {
  const x0 = key.x * unit + gap / 2;
  const y0 = key.y * unit + gap / 2;
  const x1 = x0 + key.w * unit - gap;
  const y2 = y0 + key.h * unit - gap;
  if (key.shape === 'isoEnter') {
    const xl = x0 - (key.lip ?? 0.25) * unit; // left edge of the wider top row
    const y1 = (key.y + 1) * unit - gap / 2; // bottom of the lip, leaving the row gap
    return [
      [xl + side, y0 + top], [x1 - side, y0 + top], [x1 - side, y2 - bottom],
      [x0 + side, y2 - bottom], [x0 + side, y1 - bottom], [xl + side, y1 - bottom],
    ];
  }
  return [[x0 + side, y0 + top], [x1 - side, y0 + top], [x1 - side, y2 - bottom], [x0 + side, y2 - bottom]];
}

// Path through the polygon with each corner rounded by `radius` (clamped so
// short edges never invert). Works for the concave corner of the L too.
export function roundedPath(points, radius) {
  const n = points.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const [px, py] = points[(i + n - 1) % n];
    const [cx, cy] = points[i];
    const [nx, ny] = points[(i + 1) % n];
    const inLen = Math.hypot(cx - px, cy - py) || 1;
    const outLen = Math.hypot(nx - cx, ny - cy) || 1;
    const r = Math.max(0, Math.min(radius, inLen / 2, outLen / 2));
    const ax = cx - ((cx - px) / inLen) * r;
    const ay = cy - ((cy - py) / inLen) * r;
    const bx = cx + ((nx - cx) / outLen) * r;
    const by = cy + ((ny - cy) / outLen) * r;
    d += `${i === 0 ? 'M' : 'L'}${round2(ax)} ${round2(ay)}Q${round2(cx)} ${round2(cy)} ${round2(bx)} ${round2(by)}`;
  }
  return `${d}Z`;
}

export function keyPath(key, unit, gap, insets, radius) {
  return roundedPath(keyPolygon(key, unit, gap, insets), radius);
}

// Bounding box of the surface a legend sits on: the full inset rect for plain
// keys, the wider top row for an ISO Enter.
export function keyTopBox(key, unit, gap, { top = 0, side = 0, bottom = 0 } = {}) {
  const x0 = key.x * unit + gap / 2;
  const y0 = key.y * unit + gap / 2;
  const x1 = x0 + key.w * unit - gap;
  const y2 = y0 + key.h * unit - gap;
  if (key.shape === 'isoEnter') {
    const xl = x0 - (key.lip ?? 0.25) * unit;
    const y1 = (key.y + 1) * unit - gap / 2;
    return { x: xl + side, y: y0 + top, w: x1 - xl - side * 2, h: y1 - y0 - top };
  }
  return { x: x0 + side, y: y0 + top, w: x1 - x0 - side * 2, h: y2 - y0 - top - bottom };
}

// Footprint box (no insets), used for hit areas and badge placement.
export function keyBox(key, unit, gap) {
  const x0 = key.x * unit + gap / 2;
  const y0 = key.y * unit + gap / 2;
  return { x: x0, y: y0, w: key.w * unit - gap, h: key.h * unit - gap };
}

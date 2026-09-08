// Standalone SVG from the live board. The on-screen board is already pure
// SVG, so export = clone it, bake the stylesheet-driven properties in as
// attributes, drop interaction-only bits, and serialise.

const SVG_NS = 'http://www.w3.org/2000/svg';

// Properties that come from CSS classes on screen and must be inlined.
const STYLE_PROPS = {
  path: ['fill', 'stroke', 'stroke-width', 'opacity'],
  rect: ['fill', 'stroke', 'stroke-width', 'opacity'],
  line: ['stroke', 'stroke-width', 'opacity'],
  text: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'fill'],
};
const INTERACTION_ATTRS = ['role', 'tabindex', 'aria-label', 'aria-pressed', 'class'];

export function resolveSvg(boardEl) {
  if (!boardEl) throw new Error('Keyboard not available');
  const svg = boardEl.tagName?.toLowerCase() === 'svg' ? boardEl : boardEl.querySelector('svg');
  if (!svg) throw new Error('Keyboard SVG not available');
  return svg;
}

export function readBoardTokens(boardEl) {
  const cs = getComputedStyle(resolveSvg(boardEl));
  return {
    bg: cs.getPropertyValue('--ws-bg').trim() || '#111111',
    labelColor: cs.getPropertyValue('--ws-label').trim() || '#e8e8e8',
    borderColor: cs.getPropertyValue('--ws-key-border').trim() || 'rgba(255,255,255,0.12)',
  };
}

export function svgSize(boardEl) {
  const [, , w, h] = resolveSvg(boardEl).getAttribute('viewBox').split(/\s+/).map(Number);
  return { width: w, height: h };
}

// `scale` sets the intrinsic pixel size (so rasterising at 2x stays crisp);
// `background` paints an opaque backdrop, otherwise the SVG is transparent.
export function boardToSvg(boardEl, { scale = 1, background = null } = {}) {
  const svg = resolveSvg(boardEl);
  const clone = svg.cloneNode(true);
  const sources = svg.querySelectorAll('*');
  const targets = clone.querySelectorAll('*');
  sources.forEach((node, i) => {
    const props = STYLE_PROPS[node.tagName.toLowerCase()];
    if (!props) return;
    const cs = getComputedStyle(node);
    for (const prop of props) {
      const value = cs.getPropertyValue(prop);
      if (value) targets[i].setAttribute(prop, value);
    }
  });
  clone.querySelectorAll('[data-selection-ring], [data-hover-ring]').forEach((node) => node.remove());
  clone.querySelectorAll('*').forEach((node) => {
    for (const attr of INTERACTION_ATTRS) node.removeAttribute(attr);
  });
  for (const attr of INTERACTION_ATTRS) clone.removeAttribute(attr);

  const [vx, vy, vw, vh] = clone.getAttribute('viewBox').split(/\s+/).map(Number);
  clone.setAttribute('xmlns', SVG_NS);
  clone.setAttribute('width', String(Math.round(vw * scale)));
  clone.setAttribute('height', String(Math.round(vh * scale)));
  if (background) {
    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('x', String(vx));
    bg.setAttribute('y', String(vy));
    bg.setAttribute('width', String(vw));
    bg.setAttribute('height', String(vh));
    bg.setAttribute('fill', background);
    clone.insertBefore(bg, clone.firstChild);
  }
  return new XMLSerializer().serializeToString(clone);
}

// Rasterises SVG text onto a canvas at the SVG's intrinsic size.
export function svgToCanvas(svgText) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('The board image could not be rendered'));
    };
    img.src = url;
  });
}

export function canvasToBlob(canvas, type = 'image/png') {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image'))), type);
  });
}

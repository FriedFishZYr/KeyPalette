# KeyPalette — Architecture

## Stack

React 19 + Vite 8, plain JavaScript, CSS Modules, `react-colorful` for the picker. No backend, no runtime dependencies beyond React and the picker. Tests run on Vitest (Node for pure logic, jsdom for components).

## File structure

```
src/
├── main.jsx                      # Entry: StrictMode + ErrorBoundary + App
├── App.jsx                       # Shell, canvas measurement, shortcuts, share-link import, notices
├── App.module.css                # Workspace tokens (dark default, light override), shell layout
├── components/
│   ├── Keyboard/
│   │   ├── Keyboard.jsx          # Renders a board from layout data; roving tabindex + arrow keys; hex badge
│   │   ├── KeyCap.jsx            # One key (memoized): flat or layered shaded render, legend, rings
│   │   ├── Case.jsx              # Case, finish overlays, plate, per-board gradient ids
│   │   └── Keyboard.module.css
│   ├── Toolbar/
│   │   ├── Toolbar.jsx           # Layout, tabs (Keycaps / Case / Lettering), comparison controls
│   │   ├── LayoutSelector.jsx    # Grouped <select> from LAYOUT_OPTIONS
│   │   ├── ZonePanel.jsx         # Zone pills with color summaries
│   │   ├── ColorPanel.jsx        # Picker + hex/RGB/HSL + apply + recent colors
│   │   └── InlineColorPicker.jsx # Picker + hex field shared by Case and Lettering
│   ├── ExportPanel/              # Share link, PNG / SVG / JSON download, JSON import
│   ├── ImagePaletteModal/        # Palette extraction from an image
│   ├── ComparisonView/           # Two boards side by side (stacked when narrow)
│   ├── Dialog.jsx                # Native <dialog>: modal, Escape, backdrop click, focus return
│   ├── EditorHeader.jsx          # Name, save status, undo/redo, My designs, presets, notices
│   ├── AboutDialog.jsx           # Privacy, shortcuts, backup download
│   ├── Onboarding.jsx            # First-run card
│   └── ErrorBoundary.jsx         # Recovery screen
├── data/
│   ├── layouts/
│   │   ├── index.js              # All layouts by id + LAYOUT_OPTIONS + layoutLabel()
│   │   ├── layout-60|65|75|tkl|full.js
│   │   ├── iso.js                # toIso(): derives an ISO board from an ANSI one
│   │   ├── layout-hhkb.js, layout-96.js, layout-planck.js
│   ├── presets.js                # Zone-based colorways
│   ├── profiles.js               # Shading parameters per keycap profile
│   └── zones.js
├── hooks/
│   ├── useColorway.js            # All state and actions (one hook)
│   ├── useLocalStorage.js        # Debounced, flush-on-hide, never destroys unreadable data
│   └── useMediaQuery.js
└── utils/
    ├── designHistory.js          # Undo/redo reducer (per design, grouped edits, slot deletion)
    ├── designStore.js            # Defaults, lenient store validation, backup download
    ├── exportJson.js             # Versioned design file (strict validation on import)
    ├── share.js                  # URL-hash share tokens
    ├── exportSvg.js              # Live board -> standalone SVG; SVG -> canvas
    ├── exportPng.js              # PNG (board + painted legend), SVG download, comparison export
    ├── keyShapes.js              # Rounded rect / ISO-Enter path geometry
    ├── colorUtils.js             # Hex/RGB/HSL, luminance, mix, contrast
    ├── extractPalette.js         # Dominant colors from an image
    └── download.js               # Blob/text downloads, slugify
```

## State

`useColorway` owns everything. The persisted store is `{ active, slots[] }`; each slot (a design) is:

```js
{
  layout: "tkl",              // any id in data/layouts/index.js
  caseColor: "#1a1a1a",
  caseFinish: "matte",        // "matte" | "gloss"
  keyColors: { q: "#ffffff" }, // by key id; missing keys render the default #e0e0e0
  selectedKeys: [],           // session only (cleared on load)
  activeColor: "#cccccc",     // picker color; null = mixed selection
  colorwayName: "Untitled",
  workspace: "dark",          // "light" | "dark"
  profile: "flat",            // "flat" | "sa" | "oem" | "cherry" | "dsa"
  legendColor: "auto",        // "auto" | "#rrggbb"
  legendPosition: "top",      // "top" | "front"
}
```

The hook exposes the active slot as `state` (plus `comparison` and `colorHistory`), the slot list, `actions`, `saveStatus`, `canUndo`/`canRedo`, and `storageIssues`.

### History

`designHistoryReducer` wraps the store. Only design fields (layout, colors, case, profile, legends, name) enter history; selection, picker drafts and workspace stay live. Each slot has its own past/future (50 steps). `begin`/`end` group a continuous edit (a drag, a typing session) into one step. `deleteSlot` re-indexes the per-slot histories.

### Persistence

| Key | Contents |
|-----|----------|
| `keypalette-slots` | `{ active, slots }` |
| `keypalette-color-history` | up to 16 recent hex colors |
| `keypalette-onboarded` | `"1"` once the first-run card has been dismissed or used |
| `keypalette-slots.unreadable-<timestamp>` | raw text of a store that failed to parse (kept, never overwritten) |

Writes are debounced (250 ms) and flushed on `pagehide`, `visibilitychange: hidden`, and unmount. On load, `normalizeStore` validates each slot leniently: invalid values fall back to defaults field by field, and the UI shows a notice with a backup download if anything was dropped.

## Layout data

Each layout is an array of keys in keyboard units:

```js
{ id: 'enter', label: 'Enter', x: 12.75, y: 2, w: 2.25, h: 1, zone: 'modifier' }
// ISO Enter additionally carries shape: 'isoEnter', lip: 0.25 (the wider top row)
```

Ids are shared across layouts for the same physical key. `tests/layouts.test.js` checks uniqueness, zones, no overlaps, and selector metadata for every layout.

## Rendering

Boards are inline SVG at 54 px per unit. `keyShapes.js` turns a key into rounded paths for the footprint, the inset top surface, and the selection rings (ISO Enter is an L). Shaded profiles draw: contact shadow, sidewall (darkened), front face, top surface (lifted), dish gradient, top-edge highlight; sculpted profiles show more front face per row toward the back. Flat draws a single path. Legends use per-key contrast unless a custom color is set. `KeyCap` is memoized; Keyboard passes only primitives and stable objects to it.

Accessibility: the board is one tab stop (roving `tabindex`); arrow keys and Home/End move between keys; Enter/Space select; every key has an `aria-label` with its color; dialogs are native `<dialog>` elements.

## Files and links

**Design file** (`*.json`, version 3):

```json
{ "version": 3, "name": "…", "layout": "tkl", "caseColor": "#…", "caseFinish": "matte",
  "profile": "flat", "legendColor": "auto", "legendPosition": "top",
  "keyColors": { "q": "#…" }, "exportedAt": "ISO date" }
```

Versions 1–3 import; missing fields take defaults; every value is validated before it touches state.

**Share link**: `#d=z.<base64url(deflate-raw(json))>` (or `#d=j.<base64url(json)>` where compression is unavailable). The JSON is the design file without `exportedAt`. On load the hash is cleared immediately and the design opens as a new slot, or replaces the active one undoably when all five are used.

**Exports**: `exportSvg.js` clones the live `<svg>`, bakes computed styles into attributes, strips interaction-only nodes, and serialises. PNG rasterises that SVG at 2x on a canvas and paints the zone legend below it. No DOM-capture library is involved.

## Deployment

Static: `vite build` → `dist/`, published to GitHub Pages at `https://friedfishzyr.github.io/KeyPalette/` by `.github/workflows/deploy.yml` on every push to `main`. Vite `base` is `/KeyPalette/`; Vite rewrites the asset links in `index.html` to match, but files in `public/` are copied verbatim, so `manifest.webmanifest` uses relative paths. The `og:url`/`og:image`/`twitter:image` tags are absolute and must change with the domain.

# KeyPalette — Changelog

---

## 3.1.0 — Unreleased

**Theme:** Launch readiness. Everything a public release needs short of hosting: safer storage, shareable links, more layouts, a more convincing render, exports without a DOM-capture library, and a real test and lint setup.

### Added
- **Share links** — the whole design is deflated into the URL hash (`#d=z.…`, ~600 characters for a TKL). Opening a link adds the design as a new saved design, or replaces the current one undoably when all five slots are used.
- **Layouts** — ISO variants of every ANSI board (L-shaped Enter), HHKB, 96% / 1800-compact, and a Planck 40% ortholinear. Key ids are shared across layouts so colors survive switching.
- **Design management** — duplicate and delete designs from *My designs*, with an inline confirmation for delete.
- **SVG export** and a transparent-background option for PNG and SVG. PNG export now rasterises the board's own SVG at 2x and paints the legend on a canvas.
- **Keyboard access to the board** — one tab stop, arrow keys move between keys (Home/End to row ends), Enter/Space select, Shift adds to the selection.
- **Alt-click / “Same color”** — select every key sharing a color, for recoloring accent sets.
- **First-run guidance** card, an **About** dialog (privacy statement, shortcuts, backup download), and copy feedback on the hex badge.
- **Error boundary** with a reload and a “download saved designs” escape hatch.
- **Storage safety** — unreadable saved data is moved to a timestamped backup key and offered for download instead of being overwritten; invalid fields are repaired one at a time.
- **Metadata** — description, theme color, Open Graph and Twitter tags, a web app manifest and icons, a `noscript` message, and a `LICENSE` file (MIT).
- **Tooling** — Vitest with React Testing Library (41 tests: history, storage, layouts, share links, legend layout, and app flows), ESLint 10 with the React hooks rules, Prettier, EditorConfig, `.nvmrc`, and `npm run check`.

### Changed
- **Keycap rendering** — walls are always darker than the top, the front face is lit separately, the top is lifted slightly so black caps show depth, sculpted profiles show more front face toward the back rows, each cap has a contact shadow, and a darker plate shows between keys. Flat stays the clean 2D default.
- **Case and Lettering** use the same picker as Keycaps; Lettering has an Auto / Custom switch.
- **Narrow screens** — the board keeps a tappable minimum size and the canvas scrolls; the header actions scroll horizontally instead of wrapping onto three rows.
- **Saving** is debounced and flushed when the tab is hidden; the status text no longer flickers.
- **Preset names** are original (Neon Coast, Blush, Circuit, Fern, Ember Grey, Tide, Harbor) instead of reusing keycap-set product names.
- **Header** — the Download button is now Share, opening a share-or-download dialog.
- `package.json` carries real metadata, version 3.1.0, MIT license, and an engines field.

### Fixed
- Duplicate SVG gradient ids when two boards are on screen in comparison mode.
- Escape now closes dialogs even where the browser skips the `cancel` event.
- Rules-of-hooks violations flagged by the React compiler lint rules.

### Removed
- `html2canvas` (unmaintained; ~200 KB). The production bundle dropped from 473 KB to 300 KB.
- The unused `saveSlot` action.

---

## Editor refinement — Unreleased

- Preserves the existing neutral workspace and keyboard rendering while grouping editing controls into Keycaps, Case, and Lettering.
- Adds a compact project bar with an editable design name, local save feedback, My designs, Presets, Compare, and Download.
- Exposes the existing five local design slots through create/open controls.
- Adds 50-step Undo/Redo per design for the current session, including keyboard shortcuts. Selection, picker drafts, and workspace appearance do not enter history. Continuous name/case/lettering edits are grouped until the field loses focus.
- Shows selection counts, an All keys group, and one color input format at a time. “Typing keys” accurately includes letters, punctuation, and space.
- Opens presets, downloads, and image palettes in keyboard-accessible native dialogs. Image palette actions now say what they do.
- Shows the keyboard before editing controls on narrow screens.
- Validates editable design files before applying them; imported designs remain undoable. Existing v1/v2/v3 files are supported.
- Corrects comparison layout boxes and isolates SVG filters per board. Selection badges are excluded from PNG exports.
- Adds dependency-free tests for history and editable design file validation (`npm test`).

---

## V3 — Visual Fidelity & Comparison

**Theme:** Make the board look like real keycaps, keep it front-and-center while you work, sharpen the selection model, and add side-by-side comparison. Additive only — all V1/V2 behavior preserved. Zero new dependencies.

### Added
- **Color math utilities** — `luminance`, `mix`, `lighten`, `darken`, `shadeTowardContrast` (luminance-aware), `contrastText`; the basis for shading, legend contrast, and selection framing
- **Scale-to-fit app shell** — fixed-height layout where the toolbar scrolls independently and the keyboard stays centered, shrinking to fit the canvas (capped at 1×, never enlarged); stacks on narrow viewports
- **Frame-ring selection feedback** — selection and press feedback are decoupled from the keycap fill: a 2px accent ring with a contrasting halo for selected keys, a faint ring on hover, and a geometric press (no color/brightness shift). New `--ws-accent` token on both themes
- **Selection clears on outside click / Escape** — clicking empty canvas or pressing Escape clears the selection (and dismisses the hex badge)
- **Keycap profile shading** — `Flat` (default, clean 2D), `SA`, `OEM`, `Cherry`, `DSA`; non-flat profiles render a layered cap (shaded sidewall, inset top surface, dish gradient, top-edge highlight) for a 3D look
- **Auto-contrast legends** — legends default to per-key contrast (white on dark caps, black on light), fixing invisible legends on dark keycaps; also supports a fixed legend color and Top / Front placement
- **Visual zone panel** — zone pills show each zone's current color as a swatch (or the mixed-color stripe pattern), and carry the accent frame when that zone is the active selection
- **Expanded preset library** — 16 presets (added Gruvbox, Monokai, Catppuccin, Tokyo Night, Botanical, Modern Dolch, Mizu, Hammerhead), each with alpha/modifier/case mini-preview dots
- **Collapsible toolbar sections** — Presets, Profile, Legends, and Export collapse behind a chevron header (default collapsed) to keep the panel tidy; each header shows the active value where there is one (preset count, current profile, legend color/position)
- **Comparison mode** — two boards side by side (same layout): A is the live, editable colorway; B is a read-only reference sourced from Duplicate A, a saved slot (matching layout), or a preset
- **JSON export bumped to v3** — adds `profile`, `legendColor`, `legendPosition`; import accepts v1/v2/v3 and default-fills missing fields, so older files still load
- **Comparison PNG export** — exports both boards and both legends stacked, named `{a}-vs-{b}.png`

### Changed
- **Default keycap profile is `Flat`** — the clean 2D look ships by default (overriding the spec's `cherry`); 3D profiles are opt-in. In Flat mode legends keep the V1/V2 bottom-left placement; 3D profiles center them
- **Selection no longer alters the fill** — the keycap fill now only ever shows the key's true color; the prior white-overlay / hover-brightness feedback was removed
- **Legend color moved out of CSS** — set per key as an SVG attribute so auto-contrast can take effect
- **Presets section collapsed by default** — a chevron toggle with a count keeps the 16-strong list from crowding the panel
- **Legend picker uses a native swatch + Auto toggle** — the V2 "unified picker context" was never actually implemented (Case is a native input too), so a native control was used instead of retrofitting `ColorPanel`

### Deferred to a later version
- True per-row keycap sculpting (V3 ships a uniform per-profile look only)
- Per-key / per-zone legend colors (one global legend color in V3)
- Editable comparison board B, A↔B swap, cross-layout comparison
- Keyboard mini-map glyphs on zone pills
- URL-encoded colorway sharing; Undo / Redo

---

## V2 — Enhanced UX

**Theme:** Polish, intuitiveness, and shareability.

### Added
- **Active key color readback** — selecting a key now initializes the color picker to that key's current color
- **Mixed-color state** — selecting multiple keys with different colors shows a neutral placeholder in the picker instead of defaulting to one key's color
- **Reset Selected** — resets only the currently selected keys to default (`#e0e0e0`)
- **Reset All** — clears the entire colorway with a confirmation prompt; does not affect color history or named slots
- **Color history strip** — a row of the last 16 colors used, persisted in localStorage; click to re-apply, hover for hex tooltip
- **Case finish toggle** — Matte / Gloss toggle; gloss renders a subtle radial gradient highlight on the case silhouette
- **Unified color picker context** — the same color panel serves both key and case coloring; panel title reflects active context
- **Image palette extraction** — upload any photo to extract 6–8 dominant colors as swatches; click to load into picker
- **Colorway presets** — 8 named starter colorways: WoB, BoW, Miami, Nord, Dracula, Solarized, Olive, Carbon
- **PNG export with color legend** — exports keyboard render + a per-zone color legend (zone name, swatch, hex, key count)
- **JSON export / import** — serialize and share full colorway state as a `.json` file; import validates structure before applying
- **Hex badge** — selecting exactly one key shows a click-to-copy hex pill below it on the canvas, tracking the key through responsive scaling
- **Workspace contrast polish** — precise dark/light mode color tokens; key borders ensure light keycaps are always visible; smooth fill color transitions

### Changed
- CSS tokens consolidated into a single `:root` / `[data-theme]` block — light/dark switching is now a single attribute toggle
- "Image eyedropper modal" (point-sample cursor) replaced by "Image palette extraction" — simpler to build, more useful in practice
- "Color palette strip" (ROADMAP V2) merged into "Color history strip" — one component covers both use cases

### Deferred to V3
- Undo / Redo — Reset + color history covers the immediate need; a proper history stack deferred until state shape is stable
- Point-sample eyedropper cursor
- Keycap profile shading
- URL-encoded colorway sharing

---

## V1 — MVP _(baseline)_

**Theme:** Core colorway designer. Layout in, colors applied, saved locally.

### Shipped
- Layout selector — 60%, 65%, 75%, TKL, Full-size
- Generic case silhouette per layout (rounded-rect)
- Case color picker — solid color
- Interactive SVG keyboard — all keys individually clickable
- Per-key color assignment via color picker panel (hex / RGB / HSL + `react-colorful`)
- Zone-based selection — click zone label to select all keys in group (Alphas, Numbers, Modifiers, Fn Row, Arrows, Nav Cluster)
- Shift-click multi-select
- localStorage persistence — auto-save on change, restore on revisit
- Named colorway slots — up to 5, stored in localStorage
- Reset / clear — one-click reset to default
- Light / Dark workspace toggle
- Static site deployable — Vercel, Netlify, GitHub Pages

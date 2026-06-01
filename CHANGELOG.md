# KeyPalette — Changelog

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
- **Expanded preset library** — 16 presets (added Gruvbox, Monokai, Catppuccin, Tokyo Night, Botanical, Modern Dolch, Mizu, Hammerhead), each with alpha/modifier/case mini-preview dots; the list is collapsible to save panel space
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

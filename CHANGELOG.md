# KeyPalette — Changelog

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

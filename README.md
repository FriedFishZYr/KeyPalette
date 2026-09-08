# KeyPalette

A lightweight, browser-based tool for designing and visualizing custom keycap colorways — before you buy.

No accounts. No installs. Just open it and start painting your board.

---

## What It Does

Pick a keyboard layout, click your keys, and assign colors however you like — individually, by zone, or sampled directly from an inspiration photo. The keyboard is the canvas.

- **Interactive SVG keyboard** — every key is clickable and colorable
- **Zone-based selection** — color all alphas, modifiers, or arrows at once
- **Image palettes** — extract dominant colors from a PNG, JPG, or WebP image
- **Case colorization** — match or contrast your case to the keycap scheme
- **Undo / Redo** — 50 steps per design during the current session
- **Saved locally** — your colorways persist in the browser, no account needed
- **Export-ready** — download as PNG or share as a `.json` file

---

## Layouts Supported

| Layout | Keys |
|--------|------|
| 60% | ~61 keys |
| 65% | ~68 keys |
| 75% | ~84 keys |
| TKL | ~87 keys |
| Full-size | ~104 keys |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Then open `http://localhost:5173` in your browser.

---

## How to Use

1. **Choose a layout** from the selector, or open **Presets** to start with a colorway.
2. **Select keys** on the keyboard, shift-click to select more, or select a key group. Typing keys includes letters, punctuation, and space.
3. **Choose a color** in the Keycaps panel, then click **Apply to … keys**. Switch between Hex, RGB, and HSL as needed.
4. **Add colors from an image** to extract a palette. Choose one color or add the whole palette to your recent colors.
5. **Style the case and lettering** using their editor tabs. These controls apply immediately. Keycap profile is available under Keycaps.
6. **Undo or redo** using the top bar, Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, or Ctrl+Y. Text fields keep their normal typing shortcuts. History is separate for each design and resets on reload.
7. **Name and keep designs** from the top bar. Changes save automatically in this browser; **My designs** lets you create or open up to five designs. This is local storage, not cloud sync. A failed save is shown beside the name.
8. **Compare** your current design with a snapshot, preset, or another saved design using **Compare with** in the editor.
9. **Download** an image or editable JSON design. Opening a JSON file replaces the active design and can be undone. Download a JSON backup before clearing browser data or changing devices.

Run `npm test` for the history and file-validation tests, and `npm run build` for a production build.

---

## Project Structure

```
keypalette/
├── src/
│   ├── components/       # Keyboard, KeyCap, Case, Toolbar, ColorPanel, etc.
│   ├── data/             # Layout maps (JSON), zone definitions, presets
│   ├── hooks/            # useColorway, useLocalStorage
│   └── utils/            # Color conversions, PNG/JSON export helpers
├── PROPOSAL.md           # Vision and product decisions
├── ROADMAP.md            # V1 → V2 → V3 feature tiers
└── ARCHITECTURE.md       # File structure, state shape, data formats
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full breakdown.

---

## Roadmap

- **V1 (MVP)** — Layout selector, per-key coloring, zone selection, case color, localStorage save/restore
- **V2** — Image eyedropper modal, colorway presets, PNG export, JSON import/export, undo/redo
- **V3** — Keycap profile shading, comparison mode, URL sharing, community gallery

See [`ROADMAP.md`](./ROADMAP.md) for full details and build order.

---

## Tech Stack

| | |
|---|---|
| Framework | React + Vite |
| Color Picker | `react-colorful` |
| SVG Rendering | Inline SVG via React |
| PNG Export | `html2canvas` |
| Persistence | `localStorage` |

---

## Contributing

This is a vibe-coded, enthusiast-first project. PRs welcome — especially for new layouts, preset colorways, or keycap profile shading.

---

## License

MIT

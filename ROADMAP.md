# KeyPalette — Roadmap

## Status (September 2026)

V1, V2, and V3 below have shipped. Version 3.1 (see CHANGELOG.md) adds share links, ISO / HHKB / 96% / Planck layouts, design duplicate and delete, SVG export, keyboard access to the board, safer storage, and the tooling needed for a public release. Still open from the lists below and from the launch review:

- KLE (keyboard-layout-editor) import for arbitrary boards, and rotated layouts such as Alice
- Per-key or per-zone legend colors
- Community gallery and vendor color matching (both need a backend)
- Hosting, CI, and analytics (deliberately left for launch)

## Overview

Three progressive tiers. Each tier is independently shippable. V1 is the complete, usable product — V2 and V3 layer depth on top.

---

## V1 — MVP (Core Experience)

**Goal:** A working colorway designer. Layout in, colors applied, saved locally.

### Features

- [ ] **Layout selector** — 60%, 65%, 75%, TKL, Full-size
- [ ] **Generic case silhouette** per layout — one clean rounded-rect model per size
- [ ] **Case color picker** — solid color, matte/gloss toggle (affects shadow rendering)
- [ ] **Interactive SVG keyboard** — all keys individually clickable
- [ ] **Per-key color assignment** — click key → color picker opens → color applied
- [ ] **Zone-based selection** — shift-click or click a zone label to select all keys in group
  - Zones: Alphas, Numbers Row, Modifiers, Function Row, Arrow Keys, Navigation Cluster
- [ ] **Color picker panel** — hex / RGB / HSL input + hue/saturation picker (`react-colorful`)
- [ ] **localStorage persistence** — auto-save on every change; restore on revisit
- [ ] **Named colorway slots** — save up to 5 named colorways in localStorage
- [ ] **Reset / clear** — one-click reset to default (white/grey)
- [ ] **Light / Dark workspace** toggle

### Deliverable
A fully functional React + Vite app. Deployable as a static site (Vercel, Netlify, GitHub Pages).

---

## V2 — Enhanced UX

**Goal:** Make the tool delightful and shareable.

### Features

- [ ] **Image eyedropper modal**
  - User clicks "Sample from image" → modal opens
  - Upload any photo or screenshot
  - Eyedropper cursor over image → hover shows color preview
  - Click to confirm → color loaded into active picker
  - Apply to selected key(s) or zone
- [ ] **Built-in colorway presets** — 8–12 named starter colorways (e.g. Miami, Dracula, Solarized, Nord, WoB, BoW)
- [ ] **PNG export** — render keyboard + case to canvas → download as `.png` (`html2canvas`)
- [ ] **JSON export / import** — serialize full colorway state (layout, case color, per-key map) to `.json`
  - Share a colorway: send the file → recipient imports → instant preview
- [ ] **Undo / Redo** — at least 20-step history stack
- [ ] **Color palette strip** — shows all currently used colors at a glance; click to re-select

---

## V3 — Depth & Polish (Stretch)

**Goal:** Make it the go-to tool for the enthusiast community.

### Features

- [ ] **Keycap profile shading** — SA (tall/spherical), DSA (flat), OEM, Cherry — changes per-key shadow/highlight rendering to simulate the profile's shape
- [ ] **Side legend color** — separately colorize the side-printed legends (for double-shot or dye-sub simulation)
- [ ] **Colorway comparison mode** — two keyboards side by side, same layout
- [ ] **URL-encoded sharing** — full colorway encoded in URL hash; no file needed
- [ ] **Community gallery** (optional, requires backend) — submit and browse public colorways
- [ ] **Vendor color matching** — snap picked colors to nearest available colorway from known vendors (KBDfans, Novelkeys)

---

## Timeline Estimate (solo / vibe-coded)

| Tier | Estimated Effort |
|------|-----------------|
| V1 | 1–2 weeks |
| V2 | 1–2 weeks |
| V3 | Open-ended / community-driven |

---

## Build Order Within V1

Recommended sequence for Claude Code:

1. Scaffold Vite + React app
2. Build layout data (key position maps as JSON)
3. Render static SVG keyboard from layout data
4. Add click-to-select + color picker wiring
5. Add zone selection logic
6. Add case silhouette + case color picker
7. Wire localStorage save/restore
8. Add workspace light/dark toggle
9. Polish: transitions, hover states, typography

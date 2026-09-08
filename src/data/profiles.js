// Keycap profile shading definitions. These drive a per-profile *look*
// (sidewall depth, dish, row sculpting), not true 3D geometry.
//
// `inset` / `frontExtra` are px at UNIT = 54; scale proportionally if UNIT
// ever changes. The shading fractions (0–1) are mixes toward black/white:
//   wallDarken  — side walls, always darker than the top (walls sit in shadow)
//   frontDarken — the front face, lit a little more than the sides
//   topLift     — the top surface, nudged lighter so even black caps show depth
//   rowSlope    — how much more front face shows per row toward the back of
//                 the board (sculpted profiles); 0 for uniform profiles
export const PROFILES = {
  // Flat is the default (clean 2D look). `flat: true` short-circuits the
  // layered render in KeyCap.
  flat:   { label: 'Flat', flat: true },
  sa:     { label: 'SA',     inset: 6, frontExtra: 5, dish: 'spherical',   dishStrength: 0.16, wallDarken: 0.32, frontDarken: 0.18, topLift: 0.06, rowSlope: 0.16 },
  oem:    { label: 'OEM',    inset: 5, frontExtra: 4, dish: 'cylindrical', dishStrength: 0.11, wallDarken: 0.28, frontDarken: 0.15, topLift: 0.05, rowSlope: 0.14 },
  cherry: { label: 'Cherry', inset: 4, frontExtra: 3, dish: 'cylindrical', dishStrength: 0.09, wallDarken: 0.26, frontDarken: 0.14, topLift: 0.04, rowSlope: 0.14 },
  dsa:    { label: 'DSA',    inset: 3, frontExtra: 2, dish: 'spherical',   dishStrength: 0.07, wallDarken: 0.22, frontDarken: 0.12, topLift: 0.04, rowSlope: 0 },
};

export const DEFAULT_PROFILE = 'flat';

// Display order for the Toolbar selector: flat first, then tallest → flattest.
export const PROFILE_ORDER = ['flat', 'sa', 'oem', 'cherry', 'dsa'];

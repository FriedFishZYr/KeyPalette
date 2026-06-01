// Keycap profile shading definitions (V3 §5). These drive a per-profile *look*
// (sidewall depth + dish), not true per-row geometry — sculpting is out of
// scope for V3.
//
// `inset` / `frontExtra` are in px at UNIT = 54; scale proportionally if UNIT
// ever changes. `dishStrength` and `wallDarken` are 0–1 fractions.
export const PROFILES = {
  // Flat is the default (clean 2D look). The other profiles opt in to the 3D
  // layered render; `flat: true` short-circuits that in KeyCap.
  flat:   { label: 'Flat', flat: true },
  sa:     { label: 'SA',     inset: 6, frontExtra: 5, dish: 'spherical',   dishStrength: 0.14, wallDarken: 0.22 },
  oem:    { label: 'OEM',    inset: 5, frontExtra: 4, dish: 'cylindrical', dishStrength: 0.10, wallDarken: 0.18 },
  cherry: { label: 'Cherry', inset: 4, frontExtra: 3, dish: 'cylindrical', dishStrength: 0.08, wallDarken: 0.16 },
  dsa:    { label: 'DSA',    inset: 3, frontExtra: 1, dish: 'spherical',   dishStrength: 0.06, wallDarken: 0.10 },
};

export const DEFAULT_PROFILE = 'flat';

// Display order for the Toolbar selector: flat first, then tallest → flattest.
export const PROFILE_ORDER = ['flat', 'sa', 'oem', 'cherry', 'dsa'];

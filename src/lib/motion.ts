// zoox.com's "Motion Bible", the same values as the motion tokens at the top
// of redesign.css, for motion driven from script (Motion, dnd-kit, WAAPI).
export const easeInOut = [0.2, 0, 0, 1] as const; // --ease-in-out
export const easeOut = [0, 0.4, 0, 1] as const; // --ease-out
export const easeIn = [1, 0, 1, 0.6] as const; // --ease-in
export const power2In = [0.32, 0, 0.67, 0] as const; // --ease-power2-in
// The three beats, in seconds (--beat-1/2/3).
export const beat = [0.334, 0.5, 0.667] as const;
// The same curve as a CSS timing function, for dnd-kit and element.animate().
export const cssEase = (curve: readonly number[]) =>
  `cubic-bezier(${curve.join(", ")})`;
